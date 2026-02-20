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
