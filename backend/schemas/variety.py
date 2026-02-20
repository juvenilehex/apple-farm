from __future__ import annotations

from pydantic import BaseModel


class VarietyBrief(BaseModel):
    id: str
    name: str
    name_en: str
    category: str
    harvest_period: str
    sweetness: float
    market_value: int
    popularity: int


class VarietyDetail(BaseModel):
    id: str
    name: str
    name_en: str
    origin: str
    harvest_period: str
    harvest_month: list[int]
    sweetness: float
    acidity: int
    size: str
    weight: str
    color: str
    storability: str
    disease_resistance: int
    cold_hardiness: int
    market_value: int
    popularity: int
    yield_per_tree: str
    years_to_fruit: int
    pollination: str
    spacing_row: float
    spacing_tree: float
    description: str
    tips: str
    category: str


class RecommendRequest(BaseModel):
    region_id: str | None = None
    priority: str = "balanced"  # balanced, profit, easy, storage
    max_results: int = 5


class RecommendScore(BaseModel):
    variety: VarietyBrief
    score: float
    reasons: list[str]


class RecommendResponse(BaseModel):
    region: str | None
    priority: str
    recommendations: list[RecommendScore]
