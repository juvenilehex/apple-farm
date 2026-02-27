"""데이터 품질 스코어링 시스템 (품질루프 렌즈 L4).

시뮬레이션에 사용되는 데이터의 신뢰도를 자동 평가한다.
각 데이터 소스의 신선도, 정합성, 커버리지를 0~100 점수로 환산.

점수 범위:
- 90~100: 신뢰할 수 있음 (최근 데이터, 완전한 커버리지)
- 70~89:  참고 가능 (다소 오래되었지만 사용 가능)
- 50~69:  주의 필요 (mock 데이터 또는 불완전)
- 0~49:   신뢰 불가 (데이터 없음 또는 심각한 결함)
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "refresh_log.jsonl"


class DataQualityScorer:
    """데이터 품질 종합 평가."""

    def score_all(self) -> dict[str, Any]:
        """전체 데이터 소스 품질 평가."""
        weather = self._score_weather()
        price = self._score_price()
        simulation = self._score_simulation()

        scores = [weather["score"], price["score"], simulation["score"]]
        overall = round(sum(scores) / len(scores), 1) if scores else 0

        return {
            "overall_score": overall,
            "grade": self._grade(overall),
            "assessed_at": datetime.now().isoformat(),
            "sources": {
                "weather": weather,
                "price": price,
                "simulation": simulation,
            },
        }

    # ------------------------------------------------------------------
    # 개별 소스 평가
    # ------------------------------------------------------------------
    def _score_weather(self) -> dict:
        """날씨 데이터 품질."""
        freshness = self._check_freshness("weather", max_hours=6)
        success_rate = self._check_success_rate("weather", window=20)

        score = freshness * 0.5 + success_rate * 0.5
        issues = []
        if freshness < 50:
            issues.append("날씨 데이터가 6시간 이상 오래됨")
        if success_rate < 70:
            issues.append(f"최근 API 성공률 {success_rate:.0f}% (임계 70%)")

        return {
            "score": round(score, 1),
            "grade": self._grade(score),
            "freshness": round(freshness, 1),
            "success_rate": round(success_rate, 1),
            "issues": issues,
        }

    def _score_price(self) -> dict:
        """가격 데이터 품질."""
        freshness = self._check_freshness("prices", max_hours=12)
        success_rate = self._check_success_rate("prices", window=20)

        score = freshness * 0.5 + success_rate * 0.5
        issues = []
        if freshness < 50:
            issues.append("가격 데이터가 12시간 이상 오래됨")
        if success_rate < 70:
            issues.append(f"최근 API 성공률 {success_rate:.0f}% (임계 70%)")

        return {
            "score": round(score, 1),
            "grade": self._grade(score),
            "freshness": round(freshness, 1),
            "success_rate": round(success_rate, 1),
            "issues": issues,
        }

    def _score_simulation(self) -> dict:
        """시뮬레이션 엔진 품질 (가정 기반 점수)."""
        # 시뮬레이션 가정 투명화 여부 체크
        assumptions_file = Path(__file__).resolve().parent.parent.parent / "docs" / "SIMULATION_ASSUMPTIONS.md"
        has_assumptions = assumptions_file.exists()

        # 검증기 존재 여부
        validator_exists = (Path(__file__).parent / "simulation_validator.py").exists()

        # 피드백 데이터 존재 여부
        feedback_dir = Path(__file__).resolve().parent.parent / "data" / "feedback"
        has_feedback = feedback_dir.exists() and any(feedback_dir.glob("*.json"))

        score = 50.0  # 기본 (가정 기반)
        if has_assumptions:
            score += 20
        if validator_exists:
            score += 15
        if has_feedback:
            score += 15

        issues = []
        if not has_assumptions:
            issues.append("시뮬레이션 가정 문서 없음")
        if not has_feedback:
            issues.append("사용자 피드백 데이터 없음 (교차 검증 불가)")

        return {
            "score": round(min(score, 100), 1),
            "grade": self._grade(score),
            "has_assumptions_doc": has_assumptions,
            "has_validator": validator_exists,
            "has_feedback_data": has_feedback,
            "issues": issues,
        }

    # ------------------------------------------------------------------
    # 유틸
    # ------------------------------------------------------------------
    def _check_freshness(self, source: str, max_hours: int) -> float:
        """데이터 신선도 점수 (0~100). 최근 갱신 시각 기준."""
        last_success = self._find_last_success(source)
        if not last_success:
            return 0.0

        # naive/aware 호환: 둘 다 UTC 기준으로 통일
        now = datetime.now(timezone.utc)
        if last_success.tzinfo is None:
            last_success = last_success.replace(tzinfo=timezone.utc)
        age = now - last_success
        max_age = timedelta(hours=max_hours)
        if age <= max_age:
            return 100.0
        elif age <= max_age * 2:
            return 70.0
        elif age <= max_age * 4:
            return 40.0
        return 10.0

    def _check_success_rate(self, source: str, window: int = 20) -> float:
        """최근 N회 시도 중 성공률 (0~100)."""
        entries = self._read_log(source, limit=window)
        if not entries:
            return 50.0  # 데이터 없으면 중립 점수
        successes = sum(1 for e in entries if e.get("success"))
        return (successes / len(entries)) * 100

    def _find_last_success(self, source: str) -> datetime | None:
        """로그에서 해당 소스의 마지막 성공 시각."""
        entries = self._read_log(source, limit=50)
        for e in reversed(entries):
            if e.get("success"):
                try:
                    return datetime.fromisoformat(e["timestamp"])
                except (KeyError, ValueError):
                    continue
        return None

    def _read_log(self, source: str, limit: int = 50) -> list[dict]:
        """refresh_log.jsonl에서 특정 소스 엔트리 읽기."""
        if not _LOG_PATH.exists():
            return []
        try:
            lines = _LOG_PATH.read_text(encoding="utf-8").strip().split("\n")
            entries = []
            for line in reversed(lines):
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    if entry.get("source") == source:
                        entries.append(entry)
                        if len(entries) >= limit:
                            break
                except json.JSONDecodeError:
                    continue
            return list(reversed(entries))
        except OSError:
            return []

    @staticmethod
    def _grade(score: float) -> str:
        if score >= 90:
            return "A"
        elif score >= 70:
            return "B"
        elif score >= 50:
            return "C"
        return "D"


# 전역 싱글턴
_scorer: DataQualityScorer | None = None


def get_data_quality_scorer() -> DataQualityScorer:
    global _scorer
    if _scorer is None:
        _scorer = DataQualityScorer()
    return _scorer
