from __future__ import annotations

from pydantic import BaseModel


class MonthScore(BaseModel):
    """월별 작황 서브스코어."""
    month: int
    score: float          # 0-100
    label: str            # "좋음" | "보통" | "주의" | "위험"
    gdd_deviation: float  # 평년 GDD 대비 이탈 (%)
    frost_risk: float     # 서리 위험 점수 (0-25)
    precip_balance: float # 강수 균형 점수 (0-25)
    extreme_temp: float   # 극한 기온 점수 (0-25)


class BloomPrediction(BaseModel):
    """개화·수확 예측."""
    variety: str
    bloom_date: str | None = None       # ISO date
    harvest_date: str | None = None     # ISO date
    gdd_at_bloom: float | None = None
    days_to_harvest: int | None = None


class VarietyRisk(BaseModel):
    """품종별 리스크 매트릭스."""
    variety: str
    frost_risk: str        # "낮음" | "보통" | "높음"
    heat_risk: str
    rain_risk: str
    disease_risk: str
    overall: str           # "안전" | "주의" | "경고"
    overall_score: float   # 0-100 (높을수록 안전)


class GddProgress(BaseModel):
    """GDD 누적 진행 데이터 포인트."""
    date: str
    accumulated: float
    normal: float  # 평년 누적


class GddResponse(BaseModel):
    """GDD 진행상황 응답."""
    region_id: str
    year: int
    base_temp: float
    current_gdd: float
    normal_gdd: float
    deviation_pct: float
    daily_progress: list[GddProgress]


class YieldPrediction(BaseModel):
    """ML 기반 수확량 예측 (Lv3)."""
    region_id: str
    year: int
    predicted_yield_kg_per_10a: float
    confidence: float       # 0-1
    model_used: str         # "random_forest" | "rule_based"
    features_used: list[str]


class AnnualForecastResponse(BaseModel):
    """연간 작황 전망 응답."""
    region_id: str
    year: int
    overall_score: float          # 0-100
    overall_label: str            # "풍작" | "평년작" | "부진" | "흉작"
    recommendation: str           # 종합 추천
    monthly_scores: list[MonthScore]
    bloom_predictions: list[BloomPrediction]
    variety_risks: list[VarietyRisk]
    yield_prediction: YieldPrediction | None = None
    data_source: str              # "asos" | "mock"
