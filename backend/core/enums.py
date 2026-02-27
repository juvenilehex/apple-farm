"""
pj18_apple 도메인 Enum 정의
모든 문자열 기반 분류 체계를 중앙 관리

L4=5 (R123): TaxonomyUsageTracker
  - Enum 사용 빈도 추적 → 미사용 값 deprecation 경고
  - unmapped 값 빈도 분석 → 새 Enum 값 추가 제안
  - 택소노미가 실사용 패턴에 맞춰 자동 진화 제안 생성
"""

from collections import Counter
from enum import Enum
from typing import Any, Dict, List, Optional, Type


class CostCategory(str, Enum):
    """10a당 비용 분류"""
    MATERIALS = "자재비"
    LABOR = "노동비"
    FIXED = "고정비"


class AppleGrade(str, Enum):
    """사과 등급 (경매/출하 기준)"""
    PREMIUM = "특"
    EXCELLENT = "상"
    STANDARD = "보통"
    SUBSTANDARD = "비품"


class VarietyCategory(str, Enum):
    """사과 품종 수확 시기 분류"""
    EARLY = "early"          # 조생종 (8~9월)
    MID = "mid"              # 중생종 (9~10월)
    LATE = "late"            # 만생종 (10~11월)
    VERY_LATE = "very-late"  # 극만생종 (11월~)


class OrchardGrade(str, Enum):
    """과수원 입지 급지 (기후 기반)"""
    S = "S"  # 최적지 (90~100점)
    A = "A"  # 적지 (75~89점)
    B = "B"  # 보통 (60~74점)
    C = "C"  # 비적지 (60점 미만)


class TaxonomyUsageTracker:
    """L4=5: Enum 사용 빈도 추적 → 택소노미 자동 진화 제안.

    - 각 Enum 값의 실사용 빈도를 기록
    - 미사용 값 → deprecation 후보 경고
    - unmapped 값 빈도 분석 → 새 Enum 값 추가 제안
    """

    def __init__(self, enum_cls: Type[Enum], window: int = 50) -> None:
        self._enum_cls = enum_cls
        self._window = window
        self._usage_counts: Dict[str, int] = {e.value: 0 for e in enum_cls}
        self._unmapped: List[str] = []

    def record(self, value: Any) -> None:
        """Enum 값 사용 기록."""
        str_val = value.value if isinstance(value, Enum) else str(value)
        if str_val in self._usage_counts:
            self._usage_counts[str_val] += 1
        else:
            self._unmapped.append(str_val)
            if len(self._unmapped) > self._window * 2:
                self._unmapped = self._unmapped[-self._window:]

    def suggest_evolution(self) -> Optional[Dict[str, Any]]:
        """사용 패턴 분석 → 택소노미 진화 제안."""
        total = sum(self._usage_counts.values())
        if total < self._window:
            return None

        result: Dict[str, Any] = {
            "total_usage": total,
            "distribution": {},
            "deprecation_candidates": [],
            "new_value_candidates": [],
        }

        for val, count in self._usage_counts.items():
            ratio = round(count / total, 3)
            result["distribution"][val] = ratio
            if count == 0:
                result["deprecation_candidates"].append(val)

        if self._unmapped:
            freq = Counter(self._unmapped)
            threshold = max(3, len(self._unmapped) * 0.15)
            for val, cnt in freq.most_common(3):
                if cnt >= threshold:
                    result["new_value_candidates"].append(
                        {"value": val, "frequency": cnt}
                    )

        if not result["deprecation_candidates"] and not result["new_value_candidates"]:
            return None
        return result


# L4=5: 중앙 택소노미별 사용 추적 인스턴스
grade_tracker = TaxonomyUsageTracker(AppleGrade)
variety_cat_tracker = TaxonomyUsageTracker(VarietyCategory)
cost_cat_tracker = TaxonomyUsageTracker(CostCategory)
