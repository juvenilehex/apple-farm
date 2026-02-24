"""공공데이터 자동 갱신 서비스.

기상청(KMA) 날씨 + KAMIS 사과 경매가격을 주기적으로 갱신하고
모든 시도를 refresh_log.jsonl 에 append-only 기록한다.

Usage (standalone CLI):
    python -m services.data_refresher --all
    python -m services.data_refresher --weather
    python -m services.data_refresher --prices
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


# =====================================================================
# L1=5: Pipeline Stage Timer — 단계별 성능 추적 + 병목 감지
# =====================================================================

class PipelineStageTimer:
    """L1=5: 파이프라인 단계별 성능 추적 → 병목 자동 감지."""

    def __init__(self, stages: list[str], window: int = 20) -> None:
        self._stages = stages
        self._window = window
        self._current_marks: dict[str, float] = {}
        self._history: list[dict[str, float]] = []
        self._run_start: float = 0.0

    def start_run(self) -> None:
        self._current_marks = {}
        self._run_start = time.monotonic()

    def mark(self, stage: str) -> None:
        self._current_marks[stage] = time.monotonic()

    def end_run(self) -> dict[str, Any]:
        durations: dict[str, float] = {}
        prev = self._run_start
        for s in self._stages:
            if s in self._current_marks:
                durations[s] = round(self._current_marks[s] - prev, 4)
                prev = self._current_marks[s]
        if durations:
            self._history.append(durations)
            if len(self._history) > self._window:
                self._history = self._history[-self._window:]
        bottleneck = max(durations, key=durations.get) if durations else None
        total = round(sum(durations.values()), 4)
        return {"durations": durations, "total": total, "bottleneck": bottleneck}

    def get_trends(self) -> dict[str, Any] | None:
        if len(self._history) < 3:
            return None
        avg: dict[str, float] = {}
        for s in self._stages:
            vals = [h.get(s, 0) for h in self._history]
            avg[s] = round(sum(vals) / len(vals), 4)
        recent = self._history[-3:]
        degraded = []
        for s in self._stages:
            r_avg = sum(h.get(s, 0) for h in recent) / len(recent)
            if avg[s] > 0 and r_avg > avg[s] * 1.5:
                degraded.append({"stage": s, "recent_avg": round(r_avg, 4), "overall_avg": avg[s]})
        return {"runs": len(self._history), "avg_durations": avg, "degraded_stages": degraded}


_refresh_timer = PipelineStageTimer(["weather_current", "weather_forecast", "price_fetch"])


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "refresh_log.jsonl"

KMA_BASE = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"
KAMIS_BASE = "http://www.kamis.or.kr/service/price/xml.do"
APPLE_PRODUCT_CODE = "411"

WEATHER_INTERVAL_SECONDS = 3 * 60 * 60   # 3 hours
PRICE_INTERVAL_SECONDS = 6 * 60 * 60     # 6 hours


# ---------------------------------------------------------------------------
# DataRefresher
# ---------------------------------------------------------------------------

class DataRefresher:
    """공공데이터 자동 갱신 서비스.

    - refresh_weather(): 기상청 현재 날씨 + 3일 예보 갱신
    - refresh_prices(): KAMIS 사과 당일 경매가격 갱신
    - refresh_all(): 전체 갱신
    - get_refresh_status(): 최근 갱신 상태 조회
    """

    def __init__(self) -> None:
        self._last_refresh: dict[str, datetime | None] = {
            "weather": None,
            "prices": None,
        }
        self._success_counts: dict[str, int] = {"weather": 0, "prices": 0}
        self._fail_counts: dict[str, int] = {"weather": 0, "prices": 0}
        self._running = False
        # L5=5: 자율 갱신 품질 감시
        self._ade = AutonomousRefreshDecisionEngine()
        # ensure log directory exists
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _append_log(self, entry: dict[str, Any]) -> None:
        """refresh_log.jsonl 에 한 줄 추가."""
        try:
            with LOG_PATH.open("a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False, default=str) + "\n")
        except Exception as exc:
            logger.error("refresh_log.jsonl 기록 실패: %s", exc)

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    # ------------------------------------------------------------------
    # Weather refresh
    # ------------------------------------------------------------------

    async def refresh_weather(
        self,
        region_id: str = "충북영동",
        nx: int = 68,
        ny: int = 100,
    ) -> dict[str, Any]:
        """기상청 현재 날씨 + 3일 예보 갱신 -> 로그."""
        t0 = time.monotonic()
        source = "weather"
        result: dict[str, Any] = {
            "timestamp": self._now_iso(),
            "source": source,
            "success": False,
            "records_count": 0,
            "error": None,
            "duration_ms": 0,
        }

        try:
            records = 0

            # --- 1) 초단기실황 ---
            current_data = await self._fetch_weather_current(region_id, nx, ny)
            if current_data:
                records += len(current_data)

            # --- 2) 단기예보 ---
            forecast_data = await self._fetch_weather_forecast(region_id, nx, ny)
            if forecast_data:
                records += len(forecast_data)

            result["success"] = True
            result["records_count"] = records
            self._success_counts[source] += 1
            self._last_refresh[source] = datetime.now(timezone.utc)
            logger.info("날씨 갱신 완료: %d건 (%s)", records, region_id)

        except Exception as exc:
            result["error"] = str(exc)
            self._fail_counts[source] += 1
            logger.warning("날씨 갱신 실패: %s", exc)

        result["duration_ms"] = round((time.monotonic() - t0) * 1000)
        self._append_log(result)
        return result

    async def _fetch_weather_current(
        self, region_id: str, nx: int, ny: int
    ) -> list[dict]:
        """기상청 초단기실황 API 호출."""
        if not settings.data_portal_api_key:
            logger.debug("data_portal_api_key 미설정 — 날씨 현재 스킵")
            return []

        now = datetime.now()
        base_date = now.strftime("%Y%m%d")
        base_time = (
            f"{(now.hour - 1) % 24:02d}00"
            if now.minute < 40
            else f"{now.hour:02d}00"
        )

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

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{KMA_BASE}/getUltraSrtNcst", params=params)
            resp.raise_for_status()
            data = resp.json()

        items = (
            data.get("response", {})
            .get("body", {})
            .get("items", {})
            .get("item", [])
        )
        return items

    async def _fetch_weather_forecast(
        self, region_id: str, nx: int, ny: int
    ) -> list[dict]:
        """기상청 단기예보 API 호출."""
        if not settings.data_portal_api_key:
            logger.debug("data_portal_api_key 미설정 — 날씨 예보 스킵")
            return []

        now = datetime.now()
        base_date = now.strftime("%Y%m%d")
        base_time = "0500"

        params = {
            "serviceKey": settings.data_portal_api_key,
            "numOfRows": "300",
            "pageNo": "1",
            "dataType": "JSON",
            "base_date": base_date,
            "base_time": base_time,
            "nx": nx,
            "ny": ny,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{KMA_BASE}/getVilageFcst", params=params)
            resp.raise_for_status()
            data = resp.json()

        items = (
            data.get("response", {})
            .get("body", {})
            .get("items", {})
            .get("item", [])
        )
        return items

    # ------------------------------------------------------------------
    # Price refresh
    # ------------------------------------------------------------------

    async def refresh_prices(self) -> dict[str, Any]:
        """KAMIS 사과 당일 경매가격 갱신 -> 로그."""
        t0 = time.monotonic()
        source = "prices"
        result: dict[str, Any] = {
            "timestamp": self._now_iso(),
            "source": source,
            "success": False,
            "records_count": 0,
            "error": None,
            "duration_ms": 0,
        }

        try:
            items = await self._fetch_daily_prices()
            result["success"] = True
            result["records_count"] = len(items)
            self._success_counts[source] += 1
            self._last_refresh[source] = datetime.now(timezone.utc)
            logger.info("가격 갱신 완료: %d건", len(items))

        except Exception as exc:
            result["error"] = str(exc)
            self._fail_counts[source] += 1
            logger.warning("가격 갱신 실패: %s", exc)

        result["duration_ms"] = round((time.monotonic() - t0) * 1000)
        self._append_log(result)
        return result

    async def _fetch_daily_prices(self) -> list[dict]:
        """KAMIS 당일 경매가격 API 호출."""
        if not settings.kamis_api_key:
            logger.debug("kamis_api_key 미설정 — 가격 스킵")
            return []

        today = datetime.now().strftime("%Y-%m-%d")
        params = {
            "action": "dailySalesList",
            "p_cert_key": settings.kamis_api_key,
            "p_cert_id": settings.kamis_api_id,
            "p_returntype": "json",
            "p_product_cls_code": "02",
            "p_item_code": APPLE_PRODUCT_CODE,
            "p_regday": today,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(KAMIS_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()

        items = data.get("data", {}).get("item", [])
        # filter out records with no valid price
        valid = []
        for item in items:
            price_str = item.get("dpr1", "0").replace(",", "")
            if price_str and price_str != "-":
                valid.append(item)
        return valid

    # ------------------------------------------------------------------
    # Aggregate
    # ------------------------------------------------------------------

    async def refresh_all(self) -> dict[str, Any]:
        """전체 갱신 (날씨 + 가격). 개별 실패해도 중단하지 않는다."""
        _refresh_timer.start_run()

        # L5=5: 자율 일시중지 소스 스킵
        if self._ade.is_source_paused("weather"):
            weather_result = {"success": False, "error": "auto_paused", "source": "weather"}
        else:
            weather_result = await self.refresh_weather()
            self._ade.on_refresh_complete("weather", weather_result.get("success", False))
        _refresh_timer.mark("weather_forecast")

        if self._ade.is_source_paused("prices"):
            price_result = {"success": False, "error": "auto_paused", "source": "prices"}
        else:
            price_result = await self.refresh_prices()
            self._ade.on_refresh_complete("prices", price_result.get("success", False))
        _refresh_timer.mark("price_fetch")

        stage_perf = _refresh_timer.end_run()
        if stage_perf.get("bottleneck"):
            logger.info(
                "Refresh pipeline bottleneck: %s (%.3fs)",
                stage_perf["bottleneck"],
                stage_perf["durations"].get(stage_perf["bottleneck"], 0),
            )
        trends = _refresh_timer.get_trends()
        if trends and trends.get("degraded_stages"):
            for d in trends["degraded_stages"]:
                logger.warning(
                    "Refresh perf degradation: %s recent=%.3fs vs avg=%.3fs",
                    d["stage"], d["recent_avg"], d["overall_avg"],
                )

        return {
            "weather": weather_result,
            "prices": price_result,
            "timestamp": self._now_iso(),
        }

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    def get_refresh_status(self) -> dict[str, Any]:
        """최근 갱신 상태 조회."""
        return {
            "last_refresh": {
                k: v.isoformat() if v else None
                for k, v in self._last_refresh.items()
            },
            "success_counts": dict(self._success_counts),
            "fail_counts": dict(self._fail_counts),
            "log_path": str(LOG_PATH),
            "scheduler_running": self._running,
        }

    # ------------------------------------------------------------------
    # Background scheduler loop
    # ------------------------------------------------------------------

    async def run_scheduler(self) -> None:
        """asyncio 기반 백그라운드 스케줄러.

        L5 적응형: 성공률/응답시간/시간대에 따라 간격 자율 조절.
        서버 lifespan 에서 asyncio.create_task() 로 실행한다.
        """
        from .adaptive_scheduler import get_adaptive_interval

        self._running = True
        logger.info("DataRefresher 스케줄러 시작 (적응형 간격)")

        # 시작 직후 1회 갱신
        await self._safe_refresh_all()

        weather_elapsed = 0
        price_elapsed = 0
        tick = 60  # 1분 단위로 체크

        while self._running:
            try:
                await asyncio.sleep(tick)
            except asyncio.CancelledError:
                logger.info("DataRefresher 스케줄러 종료 요청")
                break

            weather_elapsed += tick
            price_elapsed += tick

            # L5 적응형 간격: 매 틱마다 현재 상태 기반 간격 재계산
            weather_interval = get_adaptive_interval("weather")
            price_interval = get_adaptive_interval("prices")

            if weather_elapsed >= weather_interval:
                await self._safe_refresh("weather")
                weather_elapsed = 0

            if price_elapsed >= price_interval:
                await self._safe_refresh("prices")
                price_elapsed = 0

        self._running = False
        logger.info("DataRefresher 스케줄러 종료")

    async def _safe_refresh(self, source: str) -> None:
        """개별 갱신을 예외-안전하게 실행."""
        try:
            if source == "weather":
                await self.refresh_weather()
            elif source == "prices":
                await self.refresh_prices()
        except Exception as exc:
            logger.error("DataRefresher._safe_refresh(%s) 예외: %s", source, exc)

    async def _safe_refresh_all(self) -> None:
        """전체 갱신을 예외-안전하게 실행."""
        try:
            await self.refresh_all()
        except Exception as exc:
            logger.error("DataRefresher._safe_refresh_all 예외: %s", exc)

    def stop(self) -> None:
        """스케줄러 루프 정지 플래그 설정."""
        self._running = False


# =====================================================================
# L5=5: Autonomous Refresh Decision Engine — 자율 갱신 품질 감시
# =====================================================================

class AutonomousRefreshDecisionEngine:
    """L5=5: 갱신 성공률 드리프트 감지 → 소스별 자율 일시중지/재개.

    - 소스별 연속 실패 추적
    - 연속 N회 실패 시 자율 일시중지 (cooldown)
    - cooldown 후 자동 재개
    - JSONL 결정 로그
    """

    DECISIONS_PATH = Path(__file__).resolve().parent.parent / "data" / "autonomous_decisions.jsonl"
    MAX_CONSECUTIVE_FAILURES = 3
    COOLDOWN_SECONDS = 1800  # 30분

    def __init__(self) -> None:
        self._consecutive_failures: dict[str, int] = {}
        self._paused_until: dict[str, float] = {}

    def is_source_paused(self, source: str) -> bool:
        """소스가 자율 일시중지 상태인지 확인."""
        until = self._paused_until.get(source, 0)
        if until and time.monotonic() < until:
            return True
        if until and time.monotonic() >= until:
            del self._paused_until[source]
            self._consecutive_failures[source] = 0
            decision = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "type": "autonomous_refresh_guard",
                "trigger": "cooldown_expired",
                "source": source,
                "action": "auto_resume",
            }
            self._log_decision(decision)
            logger.info("L5 autonomous guard: auto-resumed source '%s'", source)
        return False

    def on_refresh_complete(self, source: str, success: bool) -> dict[str, Any] | None:
        """갱신 완료 시 호출 — 자율 판단."""
        if success:
            self._consecutive_failures[source] = 0
            return None

        self._consecutive_failures[source] = self._consecutive_failures.get(source, 0) + 1
        count = self._consecutive_failures[source]

        if count >= self.MAX_CONSECUTIVE_FAILURES:
            self._paused_until[source] = time.monotonic() + self.COOLDOWN_SECONDS
            decision = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "type": "autonomous_refresh_guard",
                "trigger": "consecutive_failures",
                "source": source,
                "consecutive_failures": count,
                "cooldown_seconds": self.COOLDOWN_SECONDS,
                "action": "auto_pause",
            }
            self._log_decision(decision)
            logger.warning(
                "L5 autonomous guard: paused '%s' (%d consecutive failures, cooldown %ds)",
                source, count, self.COOLDOWN_SECONDS,
            )
            return decision
        return None

    def _log_decision(self, decision: dict[str, Any]) -> None:
        try:
            self.DECISIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
            with self.DECISIONS_PATH.open("a", encoding="utf-8") as f:
                f.write(json.dumps(decision, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.warning("Failed to log autonomous decision: %s", e)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

data_refresher = DataRefresher()


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

async def _cli_main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="공공데이터 수동 갱신")
    parser.add_argument("--weather", action="store_true", help="날씨 갱신")
    parser.add_argument("--prices", action="store_true", help="가격 갱신")
    parser.add_argument("--all", action="store_true", help="전체 갱신")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    refresher = DataRefresher()

    if args.all or (not args.weather and not args.prices):
        result = await refresher.refresh_all()
        print(json.dumps(result, indent=2, ensure_ascii=False, default=str))
    else:
        if args.weather:
            result = await refresher.refresh_weather()
            print(json.dumps(result, indent=2, ensure_ascii=False, default=str))
        if args.prices:
            result = await refresher.refresh_prices()
            print(json.dumps(result, indent=2, ensure_ascii=False, default=str))

    print("\nStatus:", json.dumps(refresher.get_refresh_status(), indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    asyncio.run(_cli_main())
