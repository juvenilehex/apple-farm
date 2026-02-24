from __future__ import annotations

from pydantic import BaseModel


class GradeDistribution(BaseModel):
    grade: str
    ratio: float
    price_multiplier: float


class CostBreakdown(BaseModel):
    category: str
    name: str
    amount: int


class YearlyProjection(BaseModel):
    year: int
    yield_ratio: float  # % of full yield (young trees produce less)
    yield_kg: float
    revenue: int
    cost: int
    profit: int


class SimulationRequest(BaseModel):
    variety: str
    area_pyeong: float
    total_trees: int | None = None
    yield_per_10a: float | None = None
    price_per_kg: float | None = None
    projection_years: int = 10


class AnalyticsContext(BaseModel):
    """과거 시뮬레이션 대비 현재 결과 비교 맥락"""
    total_past_runs: int
    avg_roi: float
    roi_delta: float  # 현재 ROI - 평균 ROI
    avg_break_even: float
    break_even_delta: float  # 현재 - 평균 (음수 = 더 빠름)
    same_variety_count: int
    most_popular_variety: str


class FeedbackRequest(BaseModel):
    """시뮬레이션 결과 피드백 (feedback-system R48)."""
    variety: str
    area_pyeong: float
    rating: str  # "helpful" | "inaccurate" | "needs_detail"
    comment: str = ""


class FeedbackStats(BaseModel):
    """피드백 통계 스냅샷."""
    total: int = 0
    helpful_rate: float = 0.0
    recent_issues: list[str] = []
    variety_breakdown: dict[str, dict] = {}


class ValidationNote(BaseModel):
    """시뮬레이션 자가검증 결과 항목 (self-refine-loop R51)."""
    severity: str  # "info" | "warning" | "caution"
    field: str
    message: str


class SimulationResponse(BaseModel):
    variety: str
    area_pyeong: float
    area_10a: float
    total_trees: int
    yield_per_10a: float
    price_per_kg: float
    grade_distribution: list[GradeDistribution]
    annual_revenue: int
    annual_cost: int
    annual_profit: int
    income_ratio: float
    cost_breakdown: list[CostBreakdown]
    yearly_projections: list[YearlyProjection]
    break_even_year: int
    roi_10year: float
    analytics_context: AnalyticsContext | None = None
    validation_notes: list[ValidationNote] | None = None
    refined: bool = False


# ---------------------------------------------------------------------------
# 다중 시나리오 비교 (워크플로우 렌즈 L4)
# ---------------------------------------------------------------------------

class CompareRequest(BaseModel):
    """다중 시나리오 비교 요청."""
    variety: str
    area_pyeong: float
    projection_years: int = 10


class ScenarioResult(BaseModel):
    """시나리오 하나의 요약 결과."""
    scenario: str  # "optimistic" | "neutral" | "pessimistic"
    label: str     # "낙관" | "중립" | "비관"
    yield_per_10a: float
    price_per_kg: float
    annual_revenue: int
    annual_cost: int
    annual_profit: int
    income_ratio: float
    break_even_year: int
    roi_10year: float
    total_10year_profit: int


class CompareResponse(BaseModel):
    """다중 시나리오 비교 응답."""
    variety: str
    area_pyeong: float
    scenarios: list[ScenarioResult]
    recommendation: str  # 종합 추천 메시지
