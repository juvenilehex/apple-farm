"""피처 플래그 시스템 (진화 렌즈 L3: 점진적 기능 배포).

JSON 파일 기반. 서버 재시작 없이 기능을 켜고 끌 수 있다.
flags.json이 없으면 기본값 사용, 런타임 변경 → 파일에 영속화.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_FLAGS_PATH = Path(__file__).resolve().parent.parent / "data" / "flags.json"

# 기본 피처 플래그 정의
DEFAULTS: dict[str, dict[str, Any]] = {
    "simulation_self_refine": {
        "enabled": True,
        "description": "시뮬레이션 자동 검증 + 보정 루프",
        "since": "0.2.0",
    },
    "simulation_feedback": {
        "enabled": True,
        "description": "사용자 피드백 수집",
        "since": "0.2.0",
    },
    "simulation_analytics_context": {
        "enabled": True,
        "description": "과거 시뮬레이션 대비 비교 맥락 주입",
        "since": "0.2.0",
    },
    "data_auto_refresh": {
        "enabled": True,
        "description": "날씨/가격 자동 갱신 스케줄러",
        "since": "0.2.0",
    },
    "adaptive_scheduler": {
        "enabled": True,
        "description": "ML 기반 갱신 간격 자율 조절",
        "since": "0.2.0",
    },
    "anomaly_detection": {
        "enabled": True,
        "description": "가격/날씨 이상 감지 알림",
        "since": "0.3.0",
    },
    "multi_scenario_compare": {
        "enabled": True,
        "description": "낙관/중립/비관 3시나리오 비교",
        "since": "0.3.0",
    },
}


class FeatureFlags:
    """JSON 파일 기반 피처 플래그 관리자."""

    def __init__(self, path: Path | None = None):
        self._path = path or _FLAGS_PATH
        self._flags: dict[str, dict[str, Any]] = {}
        self._load()

    def _load(self) -> None:
        self._flags = {k: dict(v) for k, v in DEFAULTS.items()}
        if self._path.exists():
            try:
                overrides = json.loads(self._path.read_text(encoding="utf-8"))
                for k, v in overrides.items():
                    if k in self._flags:
                        self._flags[k].update(v)
                    else:
                        self._flags[k] = v
            except (json.JSONDecodeError, OSError):
                logger.warning("flags.json 파싱 실패, 기본값 사용")

    def _save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(
            json.dumps(self._flags, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def is_enabled(self, flag: str) -> bool:
        """피처 활성화 여부."""
        f = self._flags.get(flag)
        return bool(f and f.get("enabled", False))

    def set_flag(self, flag: str, enabled: bool) -> None:
        """런타임 피처 토글 (영속화)."""
        if flag not in self._flags:
            self._flags[flag] = {"enabled": enabled, "description": "", "since": "custom"}
        else:
            self._flags[flag]["enabled"] = enabled
        self._save()
        logger.info("피처 플래그 변경: %s → %s", flag, enabled)

    def get_all(self) -> dict[str, dict[str, Any]]:
        """전체 피처 플래그 목록."""
        return {k: dict(v) for k, v in self._flags.items()}

    def get_summary(self) -> dict[str, bool]:
        """플래그 이름 → 활성화 여부 요약."""
        return {k: v.get("enabled", False) for k, v in self._flags.items()}


# 전역 싱글턴
_instance: FeatureFlags | None = None


def get_feature_flags() -> FeatureFlags:
    global _instance
    if _instance is None:
        _instance = FeatureFlags()
    return _instance
