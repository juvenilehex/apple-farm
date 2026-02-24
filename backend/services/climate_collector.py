"""기후 데이터 수집 모듈.

ASOS 일별 관측 데이터 + KOSIS 생산량 통계 수집.
JSON 파일 캐싱 + API 실패 시 mock 폴백.
"""

from __future__ import annotations

import json
import logging
import os
import random
from datetime import date, timedelta
from pathlib import Path

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent.parent / "data" / "climate_cache"

# 10개 사과 주산지 → ASOS 관측소 ID
STATION_MAP: dict[str, int] = {
    "yeongju": 271,     # 영주
    "andong": 136,      # 안동
    "yeongcheon": 281,  # 영천
    "cheongsong": 277,  # 청송
    "mungyeong": 273,   # 문경
    "chungju": 131,     # 충주
    "jecheon": 221,     # 제천
    "geochang": 284,    # 거창
    "jangsu": 247,      # 장수
    "yesan": 232,       # 예산
}

# 월별 기후 평년값 (mock 용) — 각 지역의 월별 평균 최저/최고/강수량
# 영주 기준, 나머지는 미세 보정
_BASE_NORMALS: list[dict] = [
    {"month": 1,  "min_ta": -8.5, "max_ta": 2.5,  "rainfall": 20},
    {"month": 2,  "min_ta": -6.0, "max_ta": 5.5,  "rainfall": 25},
    {"month": 3,  "min_ta": -0.5, "max_ta": 12.0, "rainfall": 40},
    {"month": 4,  "min_ta": 5.0,  "max_ta": 19.5, "rainfall": 60},
    {"month": 5,  "min_ta": 11.0, "max_ta": 25.0, "rainfall": 80},
    {"month": 6,  "min_ta": 16.5, "max_ta": 28.5, "rainfall": 150},
    {"month": 7,  "min_ta": 21.0, "max_ta": 30.5, "rainfall": 280},
    {"month": 8,  "min_ta": 21.0, "max_ta": 31.0, "rainfall": 250},
    {"month": 9,  "min_ta": 14.5, "max_ta": 26.5, "rainfall": 130},
    {"month": 10, "min_ta": 7.0,  "max_ta": 20.5, "rainfall": 40},
    {"month": 11, "min_ta": 0.5,  "max_ta": 12.0, "rainfall": 35},
    {"month": 12, "min_ta": -6.0, "max_ta": 4.0,  "rainfall": 25},
]

# 지역별 기온 보정값 (영주 대비)
_REGION_OFFSET: dict[str, float] = {
    "yeongju": 0.0,
    "andong": 0.3,
    "yeongcheon": 1.0,
    "cheongsong": -0.5,
    "mungyeong": 0.5,
    "chungju": 0.8,
    "jecheon": -0.3,
    "geochang": 0.2,
    "jangsu": -0.8,
    "yesan": 1.2,
}


def _get_cache_path(stn_id: int, year: int) -> Path:
    return CACHE_DIR / f"asos_{stn_id}_{year}.json"


def _load_cache(stn_id: int, year: int) -> list[dict] | None:
    path = _get_cache_path(stn_id, year)
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, list) and len(data) > 300:
                return data
        except (json.JSONDecodeError, OSError):
            pass
    return None


def _save_cache(stn_id: int, year: int, data: list[dict]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = _get_cache_path(stn_id, year)
    try:
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    except OSError as e:
        logger.warning("캐시 저장 실패: %s", e)


class ClimateCollector:
    """ASOS/KOSIS 데이터 수집기."""

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=15.0)
        return self._client

    # ------------------------------------------------------------------
    # ASOS 일별 관측 데이터
    # ------------------------------------------------------------------

    async def fetch_asos_daily(
        self,
        region_id: str,
        year: int,
    ) -> list[dict]:
        """ASOS 일별 기상 데이터 조회.

        Returns: [{"date": "YYYY-MM-DD", "min_ta": float, "max_ta": float, "rainfall": float}, ...]
        """
        stn_id = STATION_MAP.get(region_id)
        if stn_id is None:
            logger.warning("알 수 없는 지역 %s → mock 사용", region_id)
            return self._generate_mock_daily(region_id, year)

        # 캐시 확인
        cached = _load_cache(stn_id, year)
        if cached:
            return cached

        # API 호출
        api_key = settings.data_portal_api_key
        if not api_key:
            logger.info("data_portal_api_key 미설정 → mock 사용")
            return self._generate_mock_daily(region_id, year)

        try:
            client = await self._get_client()
            start_dt = f"{year}0101"
            end_dt = f"{year}1231"
            url = "https://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList"
            params = {
                "serviceKey": api_key,
                "numOfRows": 366,
                "pageNo": 1,
                "dataType": "JSON",
                "dataCd": "ASOS",
                "dateCd": "DAY",
                "startDt": start_dt,
                "endDt": end_dt,
                "stnIds": stn_id,
            }
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            body = resp.json()

            items = (
                body.get("response", {})
                .get("body", {})
                .get("items", {})
                .get("item", [])
            )
            if not items:
                raise ValueError("빈 응답")

            result = []
            for item in items:
                try:
                    result.append({
                        "date": f"{item['tm'][:4]}-{item['tm'][4:6]}-{item['tm'][6:8]}"
                        if len(str(item.get("tm", ""))) == 8
                        else item.get("tm", ""),
                        "min_ta": float(item.get("minTa", 0)),
                        "max_ta": float(item.get("maxTa", 0)),
                        "rainfall": float(item.get("sumRn", 0) or 0),
                    })
                except (ValueError, KeyError):
                    continue

            if result:
                _save_cache(stn_id, year, result)
                return result

        except Exception as e:
            logger.warning("ASOS API 실패 (%s, %s): %s → mock 사용", region_id, year, e)

        return self._generate_mock_daily(region_id, year)

    # ------------------------------------------------------------------
    # KOSIS 사과 생산량 데이터
    # ------------------------------------------------------------------

    async def fetch_kosis_yield(
        self,
        start_year: int = 2013,
        end_year: int = 2023,
    ) -> list[dict]:
        """KOSIS 시도별 사과 생산량 (10a당 kg).

        Returns: [{"year": int, "yield_kg_per_10a": float}, ...]
        """
        api_key = settings.kosis_api_key
        if not api_key:
            return self._mock_kosis_yield(start_year, end_year)

        try:
            client = await self._get_client()
            url = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
            params = {
                "method": "getList",
                "apiKey": api_key,
                "itmId": "T10+",
                "objL1": "ALL",
                "objL2": "",
                "objL3": "",
                "objL4": "",
                "objL5": "",
                "objL6": "",
                "objL7": "",
                "objL8": "",
                "format": "json",
                "jsonVD": "Y",
                "prdSe": "Y",
                "startPrdDe": str(start_year),
                "endPrdDe": str(end_year),
                "orgId": "101",
                "tblId": "DT_1ET0027",
            }
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            items = resp.json()

            if not isinstance(items, list):
                raise ValueError("KOSIS 응답 형식 오류")

            result = []
            for item in items:
                try:
                    result.append({
                        "year": int(item.get("PRD_DE", "0")[:4]),
                        "yield_kg_per_10a": float(item.get("DT", 0)),
                    })
                except (ValueError, KeyError):
                    continue
            return result if result else self._mock_kosis_yield(start_year, end_year)

        except Exception as e:
            logger.warning("KOSIS API 실패: %s → mock 사용", e)
            return self._mock_kosis_yield(start_year, end_year)

    # ------------------------------------------------------------------
    # 기후 평년값
    # ------------------------------------------------------------------

    def get_climate_normals(self, region_id: str) -> list[dict]:
        """10년 월별 기후 평년값."""
        offset = _REGION_OFFSET.get(region_id, 0.0)
        return [
            {
                "month": n["month"],
                "min_ta": round(n["min_ta"] + offset, 1),
                "max_ta": round(n["max_ta"] + offset, 1),
                "rainfall": n["rainfall"],
            }
            for n in _BASE_NORMALS
        ]

    # ------------------------------------------------------------------
    # Mock 데이터 생성
    # ------------------------------------------------------------------

    def _generate_mock_daily(self, region_id: str, year: int) -> list[dict]:
        """월별 평년값 기반 일별 mock 데이터 생성 (자연스러운 변동 포함)."""
        normals = {n["month"]: n for n in self.get_climate_normals(region_id)}
        rng = random.Random(hash((region_id, year)))

        result = []
        start = date(year, 1, 1)
        end = date(year, 12, 31)
        current = start
        while current <= end:
            n = normals[current.month]
            # 일별 변동: 기온 ±3°C, 강수 확률 기반
            min_ta = round(n["min_ta"] + rng.gauss(0, 2.0), 1)
            max_ta = round(n["max_ta"] + rng.gauss(0, 2.5), 1)
            if max_ta <= min_ta:
                max_ta = min_ta + 3.0

            # 월별 강수일수 추정 → 일별 강수 생성
            days_in_month = 30
            daily_rain_prob = min(0.7, n["rainfall"] / (days_in_month * 15))
            if rng.random() < daily_rain_prob:
                rainfall = round(rng.uniform(1, n["rainfall"] / 5), 1)
            else:
                rainfall = 0.0

            result.append({
                "date": current.isoformat(),
                "min_ta": min_ta,
                "max_ta": max_ta,
                "rainfall": rainfall,
            })
            current += timedelta(days=1)

        return result

    def _mock_kosis_yield(self, start_year: int, end_year: int) -> list[dict]:
        """KOSIS mock: 전국 평균 10a당 사과 수확량 (약 1,500~1,800kg)."""
        rng = random.Random(42)
        return [
            {
                "year": y,
                "yield_kg_per_10a": round(1600 + rng.gauss(0, 100), 0),
            }
            for y in range(start_year, end_year + 1)
        ]


# 싱글턴
_instance: ClimateCollector | None = None


def get_climate_collector() -> ClimateCollector:
    global _instance
    if _instance is None:
        _instance = ClimateCollector()
    return _instance
