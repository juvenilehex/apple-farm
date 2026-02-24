"""이상 감지 시스템 (자율성 렌즈 L3: 규칙 기반 자동화).

가격·날씨 데이터의 이상치를 감지하고 알림 큐에 적재한다.
- 가격: 전일 대비 ±20% 이상 변동
- 날씨: 극단 기온 (영하 5도 이하, 38도 이상)
- 날씨: 폭우 (시간당 30mm 이상)
"""
from __future__ import annotations

import json
import logging
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "anomalies.jsonl"

# 이상 감지 임계값
THRESHOLDS = {
    "price_change_pct": 20.0,       # 전일 대비 ±20%
    "temp_low_c": -5.0,             # 동해 위험
    "temp_high_c": 38.0,            # 고온 피해
    "rain_hourly_mm": 30.0,         # 집중호우
    "wind_speed_ms": 14.0,          # 강풍 (태풍 주의보 수준)
}


class AnomalyDetector:
    """규칙 기반 이상 감지기."""

    def __init__(self, max_alerts: int = 200):
        self._alerts: deque[dict] = deque(maxlen=max_alerts)
        self._last_prices: dict[str, float] = {}  # 품종 → 최근 가격

    # ------------------------------------------------------------------
    # 가격 이상 감지
    # ------------------------------------------------------------------
    def check_price(self, variety: str, price: float, date: str = "") -> list[dict]:
        """가격 이상치 검사. 전일 대비 급등/급락 감지."""
        alerts = []
        prev = self._last_prices.get(variety)
        self._last_prices[variety] = price

        if prev and prev > 0:
            change_pct = ((price - prev) / prev) * 100
            threshold = THRESHOLDS["price_change_pct"]
            if abs(change_pct) >= threshold:
                direction = "급등" if change_pct > 0 else "급락"
                alert = self._make_alert(
                    category="price",
                    severity="warning" if abs(change_pct) < 40 else "critical",
                    message=f"{variety} 가격 {direction}: {prev:,.0f}→{price:,.0f}원 ({change_pct:+.1f}%)",
                    data={"variety": variety, "prev": prev, "current": price,
                           "change_pct": round(change_pct, 1), "date": date},
                )
                alerts.append(alert)
        return alerts

    # ------------------------------------------------------------------
    # 날씨 이상 감지
    # ------------------------------------------------------------------
    def check_weather(self, temp_c: float, rain_mm: float = 0,
                      wind_ms: float = 0, region: str = "") -> list[dict]:
        """날씨 이상치 검사."""
        alerts = []

        if temp_c <= THRESHOLDS["temp_low_c"]:
            alerts.append(self._make_alert(
                category="weather",
                severity="critical",
                message=f"동해 위험: {region} 기온 {temp_c}°C (임계 {THRESHOLDS['temp_low_c']}°C)",
                data={"type": "frost", "temp_c": temp_c, "region": region},
            ))
        elif temp_c >= THRESHOLDS["temp_high_c"]:
            alerts.append(self._make_alert(
                category="weather",
                severity="warning",
                message=f"고온 피해 주의: {region} 기온 {temp_c}°C",
                data={"type": "heat", "temp_c": temp_c, "region": region},
            ))

        if rain_mm >= THRESHOLDS["rain_hourly_mm"]:
            alerts.append(self._make_alert(
                category="weather",
                severity="critical" if rain_mm >= 50 else "warning",
                message=f"집중호우: {region} 시간당 {rain_mm}mm",
                data={"type": "heavy_rain", "rain_mm": rain_mm, "region": region},
            ))

        if wind_ms >= THRESHOLDS["wind_speed_ms"]:
            alerts.append(self._make_alert(
                category="weather",
                severity="critical" if wind_ms >= 20 else "warning",
                message=f"강풍 주의: {region} 풍속 {wind_ms}m/s",
                data={"type": "strong_wind", "wind_ms": wind_ms, "region": region},
            ))

        return alerts

    # ------------------------------------------------------------------
    # 알림 관리
    # ------------------------------------------------------------------
    def get_alerts(self, limit: int = 20, category: str | None = None) -> list[dict]:
        """최근 알림 조회."""
        items = list(self._alerts)
        if category:
            items = [a for a in items if a["category"] == category]
        return items[-limit:]

    def get_stats(self) -> dict:
        """알림 통계."""
        total = len(self._alerts)
        by_category: dict[str, int] = {}
        by_severity: dict[str, int] = {}
        for a in self._alerts:
            by_category[a["category"]] = by_category.get(a["category"], 0) + 1
            by_severity[a["severity"]] = by_severity.get(a["severity"], 0) + 1
        return {
            "total_alerts": total,
            "by_category": by_category,
            "by_severity": by_severity,
            "last_alert": self._alerts[-1] if self._alerts else None,
        }

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------
    def _make_alert(self, category: str, severity: str,
                    message: str, data: dict[str, Any]) -> dict:
        alert = {
            "timestamp": datetime.now().isoformat(),
            "category": category,
            "severity": severity,
            "message": message,
            "data": data,
        }
        self._alerts.append(alert)
        self._log(alert)

        level = logging.CRITICAL if severity == "critical" else logging.WARNING
        logger.log(level, "ANOMALY [%s] %s", severity.upper(), message)
        return alert

    def _log(self, alert: dict) -> None:
        try:
            _LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(alert, ensure_ascii=False) + "\n")
        except OSError:
            pass


# 전역 싱글턴
_detector: AnomalyDetector | None = None


def get_anomaly_detector() -> AnomalyDetector:
    global _detector
    if _detector is None:
        _detector = AnomalyDetector()
    return _detector
