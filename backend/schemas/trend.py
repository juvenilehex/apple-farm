"""트렌드 감지 스키마."""
from __future__ import annotations

from pydantic import BaseModel


class TrendSignal(BaseModel):
    """개별 시그널."""
    source: str          # 시그널 출처 (kamis, kosis, news, seedling)
    signal_type: str     # price_surge, volume_spike, area_growth, mention_freq, seedling_demand
    variety: str
    value: float         # 변화율 또는 점수
    description: str
    strength: str        # strong, moderate, weak


class VarietyTrend(BaseModel):
    """품종별 종합 트렌드."""
    variety: str
    variety_en: str
    composite_score: float   # 0~100
    rank: int
    grade: str               # HOT, RISING, WATCH, STABLE, DECLINING
    signals: list[TrendSignal]
    summary: str
    actionable_insight: str


class TrendReport(BaseModel):
    """트렌드 리포트."""
    generated_at: str
    data_freshness: str      # 데이터 신선도
    total_varieties_analyzed: int
    hot_varieties: list[VarietyTrend]     # HOT + RISING
    watch_list: list[VarietyTrend]        # WATCH
    declining: list[VarietyTrend]         # DECLINING
    market_summary: str
