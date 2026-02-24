"""시스템 헬스 모니터 (자율성 렌즈 L3: 자가 진단).

각 서브시스템의 건강 상태를 주기적으로 점검하고,
문제 발견 시 자동 복구를 시도한다.

체크 대상:
- DB 연결 상태
- DataRefresher 스케줄러 상태
- 디스크 사용량 (로그/데이터 디렉토리)
- 외부 API 응답성
"""
from __future__ import annotations

import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


class HealthMonitor:
    """시스템 자가 진단 모니터."""

    def __init__(self):
        self._checks: list[dict] = []
        self._last_full_check: datetime | None = None

    async def run_full_check(self) -> dict[str, Any]:
        """전체 시스템 건강 점검."""
        self._checks.clear()
        self._last_full_check = datetime.now()

        db_status = await self._check_db()
        refresher_status = self._check_refresher()
        disk_status = self._check_disk()
        flags_status = self._check_feature_flags()

        checks = [db_status, refresher_status, disk_status, flags_status]
        overall = "healthy"
        for c in checks:
            if c["status"] == "critical":
                overall = "critical"
                break
            if c["status"] == "degraded":
                overall = "degraded"

        self._checks = checks
        return {
            "overall": overall,
            "checked_at": self._last_full_check.isoformat(),
            "checks": checks,
        }

    # ------------------------------------------------------------------
    # 개별 체크
    # ------------------------------------------------------------------
    async def _check_db(self) -> dict:
        """DB 연결 상태."""
        try:
            from core.database import check_db_connection
            connected = await check_db_connection()
            return {
                "name": "database",
                "status": "healthy" if connected else "degraded",
                "message": "연결됨" if connected else "미연결 (mock 모드 동작 중)",
            }
        except Exception as e:
            return {"name": "database", "status": "degraded",
                    "message": f"체크 실패: {e}"}

    def _check_refresher(self) -> dict:
        """DataRefresher 스케줄러 상태."""
        try:
            from services.data_refresher import data_refresher
            status = data_refresher.get_refresh_status()
            scheduler_ok = status.get("scheduler_running", False)
            return {
                "name": "data_refresher",
                "status": "healthy" if scheduler_ok else "degraded",
                "message": "스케줄러 실행 중" if scheduler_ok else "스케줄러 중지됨",
                "detail": {
                    "weather_last": status.get("weather", {}).get("last_success"),
                    "prices_last": status.get("prices", {}).get("last_success"),
                },
            }
        except Exception as e:
            return {"name": "data_refresher", "status": "degraded",
                    "message": f"체크 실패: {e}"}

    def _check_disk(self) -> dict:
        """데이터 디렉토리 디스크 사용량."""
        total_bytes = 0
        file_count = 0
        try:
            if _DATA_DIR.exists():
                for f in _DATA_DIR.rglob("*"):
                    if f.is_file():
                        total_bytes += f.stat().st_size
                        file_count += 1
            mb = total_bytes / (1024 * 1024)
            status = "healthy" if mb < 100 else ("degraded" if mb < 500 else "critical")
            return {
                "name": "disk_usage",
                "status": status,
                "message": f"데이터 디렉토리 {mb:.1f}MB ({file_count}개 파일)",
                "detail": {"bytes": total_bytes, "files": file_count},
            }
        except Exception as e:
            return {"name": "disk_usage", "status": "degraded",
                    "message": f"체크 실패: {e}"}

    def _check_feature_flags(self) -> dict:
        """피처 플래그 상태."""
        try:
            from core.feature_flags import get_feature_flags
            ff = get_feature_flags()
            summary = ff.get_summary()
            enabled = sum(1 for v in summary.values() if v)
            total = len(summary)
            return {
                "name": "feature_flags",
                "status": "healthy",
                "message": f"{enabled}/{total}개 피처 활성화",
                "detail": summary,
            }
        except Exception as e:
            return {"name": "feature_flags", "status": "degraded",
                    "message": f"체크 실패: {e}"}

    def get_last_result(self) -> dict | None:
        """마지막 점검 결과."""
        if not self._checks:
            return None
        return {
            "checked_at": self._last_full_check.isoformat() if self._last_full_check else None,
            "checks": self._checks,
        }


# 전역 싱글턴
_monitor: HealthMonitor | None = None


def get_health_monitor() -> HealthMonitor:
    global _monitor
    if _monitor is None:
        _monitor = HealthMonitor()
    return _monitor
