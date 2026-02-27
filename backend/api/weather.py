from __future__ import annotations
import logging
from fastapi import APIRouter, Query
import httpx
from core.config import settings
from schemas.weather import WeatherResponse, ForecastResponse, Temperature, ForecastItem

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/weather", tags=["weather"])

KMA_BASE = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"

# 단기예보 발표시각 (KMA 기준)
_FORECAST_PUBLISH_HOURS = [2, 5, 8, 11, 14, 17, 20, 23]


def _calc_forecast_base_time(now) -> tuple[str, str]:
    """현재 시각 기준 가장 최근 단기예보 발표시각 반환.

    발표 후 약 10분 뒤 API 제공 → hour+0:10 이전이면 이전 발표시각 사용.
    Returns: (base_date, base_time)
    """
    from datetime import timedelta

    current_minutes = now.hour * 60 + now.minute
    chosen = None
    for h in reversed(_FORECAST_PUBLISH_HOURS):
        if current_minutes >= h * 60 + 10:
            chosen = h
            break

    if chosen is not None:
        base_date = now.strftime("%Y%m%d")
        base_time = f"{chosen:02d}00"
    else:
        # 자정~02:10 → 전날 23시 발표 사용
        yesterday = now - timedelta(days=1)
        base_date = yesterday.strftime("%Y%m%d")
        base_time = "2300"

    return base_date, base_time


def _mock_current(region_id: str, date: str) -> WeatherResponse:
    """API 키 없을 때 반환할 mock 날씨 데이터."""
    return WeatherResponse(
        region_id=region_id, date=date,
        temperature=Temperature(min=2.0, max=12.0, current=7.5),
        humidity=55.0, rainfall=0.0, wind=2.3, sky="clear",
        alerts=[],
    )


def _mock_forecast(region_id: str) -> ForecastResponse:
    """API 키 없을 때 반환할 mock 예보 데이터."""
    from datetime import datetime, timedelta
    today = datetime.now()
    items = []
    for i in range(3):
        d = today + timedelta(days=i + 1)
        items.append(ForecastItem(
            date=d.strftime("%Y%m%d"),
            temp_min=1.0 + i, temp_max=11.0 + i,
            sky="clear" if i == 0 else "cloudy",
            rainfall=0.0, pop=10.0 * i,
        ))
    return ForecastResponse(region_id=region_id, forecasts=items)


@router.get("/current", response_model=WeatherResponse)
async def get_current_weather(region_id: str = Query(...), nx: int = Query(...), ny: int = Query(...)):
    """현재 날씨 조회 (기상청 초단기실황)"""
    from datetime import datetime
    now = datetime.now()
    base_date = now.strftime("%Y%m%d")

    if not settings.data_portal_api_key:
        return _mock_current(region_id, base_date)

    # 매시 정각 발표, 40분 이후 조회 가능
    base_time = f"{(now.hour - 1) % 24:02d}00" if now.minute < 40 else f"{now.hour:02d}00"

    params = {
        "serviceKey": settings.data_portal_api_key,
        "numOfRows": "10",
        "pageNo": "1",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{KMA_BASE}/getUltraSrtNcst", params=params)
            data = resp.json()
        items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
        return _parse_current(items, region_id, base_date)
    except Exception as e:
        logger.warning("기상청 API 호출 실패, mock 데이터 반환: %s", e)
        return _mock_current(region_id, base_date)

def _parse_current(items: list, region_id: str, date: str) -> WeatherResponse:
    values = {item["category"]: float(item["obsrValue"]) for item in items}
    current = values.get("T1H", 0)
    return WeatherResponse(
        region_id=region_id,
        date=date,
        temperature=Temperature(
            min=round(current - 3, 1),
            max=round(current + 5, 1),
            current=round(current, 1),
        ),
        humidity=round(values.get("REH", 0), 1),
        rainfall=round(values.get("RN1", 0), 1),
        wind=round(values.get("WSD", 0), 1),
        sky="clear",
        alerts=[],
    )

@router.get("/forecast", response_model=ForecastResponse)
async def get_forecast(region_id: str = Query(...), nx: int = Query(...), ny: int = Query(...)):
    """단기예보 조회 (3일)"""
    from datetime import datetime

    if not settings.data_portal_api_key:
        return _mock_forecast(region_id)

    now = datetime.now()
    base_date, base_time = _calc_forecast_base_time(now)

    params = {
        "serviceKey": settings.data_portal_api_key,
        "numOfRows": "1000",
        "pageNo": "1",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{KMA_BASE}/getVilageFcst", params=params)
            data = resp.json()
        items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
        today = now.strftime("%Y%m%d")
        forecasts = _parse_forecast(items, exclude_date=today)
        return ForecastResponse(region_id=region_id, forecasts=forecasts)
    except Exception as e:
        logger.warning("기상청 예보 API 호출 실패, mock 데이터 반환: %s", e)
        return _mock_forecast(region_id)

def _parse_forecast(items: list, exclude_date: str | None = None) -> list[ForecastItem]:
    """예보 아이템 파싱. TMP 시간별 기온을 TMN/TMX 폴백으로 사용."""
    from collections import defaultdict

    daily: dict[str, dict] = defaultdict(lambda: {
        "TMN": None, "TMX": None, "SKY": "1", "PCP": "0", "POP": "0",
        "_temps": [],  # TMP 시간별 기온 수집 (TMN/TMX 폴백용)
    })
    for item in items:
        date = item.get("fcstDate", "")
        cat = item.get("category", "")
        val = item.get("fcstValue", "0")
        if cat in ("TMN", "TMX", "SKY", "PCP", "POP"):
            daily[date][cat] = val
        elif cat == "TMP":
            try:
                daily[date]["_temps"].append(float(val))
            except (ValueError, TypeError):
                pass

    sky_map = {"1": "clear", "3": "cloudy", "4": "overcast"}
    result = []
    for date, vals in sorted(daily.items()):
        if exclude_date and date == exclude_date:
            continue

        # TMN/TMX가 없으면 TMP min/max로 대체
        temps = vals["_temps"]
        tmn = vals["TMN"]
        tmx = vals["TMX"]
        temp_min = float(tmn) if tmn is not None else (min(temps) if temps else 0.0)
        temp_max = float(tmx) if tmx is not None else (max(temps) if temps else 0.0)

        pcp = vals["PCP"]
        rainfall = 0.0 if pcp in ("강수없음", "0") else float(
            pcp.replace("mm", "").replace("~", "").split("미만")[0] or "0"
        )
        result.append(ForecastItem(
            date=date,
            temp_min=round(temp_min, 1),
            temp_max=round(temp_max, 1),
            sky=sky_map.get(str(vals.get("SKY", "1")), "clear"),
            rainfall=rainfall,
            pop=float(vals.get("POP", 0)),
        ))
    return result[:3]  # 최대 3일
