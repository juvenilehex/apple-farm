"""급지 시스템 응답 스키마."""
from __future__ import annotations

from pydantic import BaseModel

from core.enums import OrchardGrade


class GradeFactorScore(BaseModel):
    """개별 급지 팩터 점수."""
    name: str
    value: float
    score: float
    weight: float
    description: str


class GradeResult(BaseModel):
    """지역별 급지 결과."""
    region_id: str
    region_name: str
    grade: OrchardGrade
    total_score: float
    factors: list[GradeFactorScore]


class AllGradesResponse(BaseModel):
    """전체 지역 급지 요약."""
    regions: list[GradeResult]
    methodology: str = "기후 5팩터 가중평균 (연평균기온 25%, GDD 25%, 무상일수 20%, 연강수량 15%, 8월야간기온 15%)"
