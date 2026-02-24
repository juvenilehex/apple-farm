"""적응형 스케줄러 (L5: 자율 판단 + 자기학습)

refresh_log.jsonl의 성공률 + 응답시간을 분석하여
데이터 갱신 간격을 자율적으로 조절한다.

L5=3: 규칙 기반 (고정 배율)
  - 연속 실패 시 → 간격 늘림 (API 부하 방지)
  - 안정 성공 시 → 기본 간격 유지
  - 응답 느려짐 → 간격 늘림
  - KAMIS 장외 시간 → 가격 갱신 빈도 감소

L5=4: 학습 기반 — 간격 조정 결과를 추적하여 배율 자동 보정
  - 간격 단축 후 실패 증가 → 단축 억제 학습
  - 간격 연장 후에도 실패 지속 → 추가 연장 학습
  - 간격 연장 후 안정 회복 → 현행 유지 학습
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "refresh_log.jsonl"

# 기본 간격 (초)
BASE_INTERVALS = {
    "weather": 3 * 60 * 60,   # 3시간
    "prices": 6 * 60 * 60,    # 6시간
}

# 배율 제한
MIN_MULTIPLIER = 0.5   # 기본의 50%까지 단축
MAX_MULTIPLIER = 3.0   # 기본의 3배까지 연장

# 분석 윈도우
RECENT_WINDOW = 10  # 최근 N건 분석


def _load_recent_logs(source: str, window: int = RECENT_WINDOW) -> list[dict]:
    """refresh_log.jsonl에서 특정 source의 최근 N건 로드."""
    if not LOG_PATH.exists():
        return []
    entries: list[dict] = []
    try:
        with LOG_PATH.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    if entry.get("source") == source:
                        entries.append(entry)
                except (json.JSONDecodeError, KeyError):
                    continue
    except Exception:
        return []
    return entries[-window:]


def _calc_success_rate(logs: list[dict]) -> float:
    """성공률 계산 (0.0 ~ 1.0)."""
    if not logs:
        return 1.0  # 데이터 없으면 정상 간주
    successes = sum(1 for e in logs if e.get("success", False))
    return successes / len(logs)


def _calc_avg_latency(logs: list[dict]) -> float:
    """평균 응답시간 (ms)."""
    durations = [e.get("duration_ms", 0) for e in logs if e.get("success")]
    if not durations:
        return 0.0
    return sum(durations) / len(durations)


def _consecutive_failures(logs: list[dict]) -> int:
    """최근 연속 실패 횟수."""
    count = 0
    for entry in reversed(logs):
        if entry.get("success", False):
            break
        count += 1
    return count


def _is_market_hours() -> bool:
    """KAMIS 거래 시간대 여부 (09:00~17:00 KST, 평일)."""
    now = datetime.now()
    # 주말 체크 (0=월, 6=일)
    if now.weekday() >= 5:
        return False
    return 9 <= now.hour < 17


OUTCOME_PATH = Path(__file__).resolve().parent.parent / "data" / "scheduler_outcomes.jsonl"


class SchedulerLearner:
    """간격 조정 결과를 추적하여 배율 보정값 학습."""

    def __init__(self) -> None:
        # source → [{"multiplier": float, "post_success_rate": float}]
        self._outcomes: dict[str, list[dict]] = {}
        self._adjustments: dict[str, float] = {}
        self._load_outcomes()

    def _load_outcomes(self) -> None:
        """저장된 결과 이력 로드."""
        if not OUTCOME_PATH.exists():
            return
        try:
            with OUTCOME_PATH.open("r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        src = entry.get("source", "")
                        self._outcomes.setdefault(src, []).append(entry)
                    except (json.JSONDecodeError, KeyError):
                        continue
        except Exception:
            pass
        # 소스별 학습
        for src in self._outcomes:
            self._learn(src)

    def record_outcome(
        self, source: str, multiplier: float, post_success_rate: float
    ) -> None:
        """간격 조정 후 결과 기록."""
        entry = {
            "source": source,
            "multiplier": round(multiplier, 3),
            "post_success_rate": round(post_success_rate, 3),
            "timestamp": datetime.now().isoformat(),
        }
        self._outcomes.setdefault(source, []).append(entry)

        # 최근 20건만 유지
        if len(self._outcomes[source]) > 20:
            self._outcomes[source] = self._outcomes[source][-20:]

        # 파일 기록
        try:
            OUTCOME_PATH.parent.mkdir(parents=True, exist_ok=True)
            with OUTCOME_PATH.open("a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            pass

        # 5건 이상이면 학습
        if len(self._outcomes[source]) >= 5:
            self._learn(source)

    def _learn(self, source: str) -> None:
        """결과 이력에서 배율 보정값 학습."""
        outcomes = self._outcomes.get(source, [])
        if len(outcomes) < 5:
            return

        recent = outcomes[-10:]

        # 단축(mult < 1.0) 후 성공률 vs 연장(mult > 1.0) 후 성공률
        tight = [o for o in recent if o.get("multiplier", 1.0) < 1.0]
        loose = [o for o in recent if o.get("multiplier", 1.0) > 1.2]

        adjustment = 0.0

        if tight:
            tight_rate = sum(o.get("post_success_rate", 1.0) for o in tight) / len(tight)
            if tight_rate < 0.7:
                # 단축 후 실패 빈번 → 단축 억제 (양수 = 간격 늘림)
                adjustment += 0.15
            elif tight_rate >= 0.9:
                # 단축 후에도 안정 → 더 단축 허용
                adjustment -= 0.1

        if loose:
            loose_rate = sum(o.get("post_success_rate", 1.0) for o in loose) / len(loose)
            if loose_rate < 0.5:
                # 연장 후에도 실패 지속 → 추가 연장 필요
                adjustment += 0.2
            elif loose_rate >= 0.9:
                # 연장 후 안정 → 현행 적절
                adjustment += 0.0

        self._adjustments[source] = max(-0.3, min(0.5, adjustment))

        if self._adjustments[source] != 0.0:
            logger.debug(
                "[SchedulerLearner] %s: 보정 %+.2f (tight=%d, loose=%d)",
                source, self._adjustments[source], len(tight), len(loose),
            )

    def get_adjustment(self, source: str) -> float:
        """학습된 배율 보정값 반환."""
        return self._adjustments.get(source, 0.0)


# 싱글톤 학습기
_learner = SchedulerLearner()


def get_scheduler_learner() -> SchedulerLearner:
    return _learner


def get_adaptive_interval(source: str) -> float:
    """컨텍스트 기반 적응형 갱신 간격 계산.

    Args:
        source: "weather" 또는 "prices"

    Returns:
        조정된 간격 (초)
    """
    base = BASE_INTERVALS.get(source, 3600)
    logs = _load_recent_logs(source)

    multiplier = 1.0

    # 1. 연속 실패 기반 백오프
    consecutive_fails = _consecutive_failures(logs)
    if consecutive_fails >= 5:
        multiplier *= 2.5      # 5연속 실패: 큰 백오프
    elif consecutive_fails >= 3:
        multiplier *= 1.8      # 3연속 실패: 중간 백오프
    elif consecutive_fails >= 1:
        multiplier *= 1.3      # 1회 실패: 약간 백오프

    # 2. 성공률 기반 조정
    success_rate = _calc_success_rate(logs)
    if success_rate < 0.5:
        multiplier *= 1.5      # 성공률 50% 미만: 추가 백오프
    elif success_rate >= 0.9:
        multiplier *= 0.9      # 성공률 90% 이상: 약간 단축

    # 3. 응답 시간 기반 조정
    avg_latency = _calc_avg_latency(logs)
    if avg_latency > 10000:     # 10초 초과
        multiplier *= 1.5
    elif avg_latency > 5000:    # 5초 초과
        multiplier *= 1.2

    # 4. 시간대 기반 조정 (가격 데이터 전용)
    if source == "prices" and not _is_market_hours():
        multiplier *= 2.0      # 장외 시간: 간격 2배

    # 5. L5=4: 학습된 보정값 적용
    adjustment = _learner.get_adjustment(source)
    multiplier += adjustment

    # 배율 제한
    multiplier = max(MIN_MULTIPLIER, min(MAX_MULTIPLIER, multiplier))
    adjusted = base * multiplier

    if multiplier != 1.0:
        logger.debug(
            "[AdaptiveScheduler] %s: %ds × %.2f = %.0fs "
            "(fails=%d, rate=%.0f%%, latency=%.0fms)",
            source, base, multiplier, adjusted,
            consecutive_fails, success_rate * 100, avg_latency,
        )

    return adjusted
