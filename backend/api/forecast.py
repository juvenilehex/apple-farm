"""작황 예측 API 라우터.

GET  /api/forecast/annual       → 연간 작황 전망
GET  /api/forecast/gdd          → GDD 진행상황
GET  /api/forecast/variety-risk → 품종별 리스크
GET  /api/forecast/bloom        → 개화/수확 예측
POST /api/forecast/train        → ML 학습 (수동)
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Query

from services.yield_forecaster import (
    annual_forecast,
    get_gdd_progress,
    train_model,
)
from services.climate_collector import get_climate_collector
from services.gdd_calculator import extract_ml_features

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("/annual")
async def forecast_annual(
    region_id: str = Query("yeongju", description="지역 ID"),
    year: int | None = Query(None, description="연도 (기본: 올해)"),
):
    """연간 작황 전망 (Lv1 규칙 + Lv2 통계 + Lv3 ML)."""
    return await annual_forecast(region_id, year)


@router.get("/gdd")
async def forecast_gdd(
    region_id: str = Query("yeongju"),
    year: int | None = Query(None),
):
    """GDD 누적 진행상황."""
    return await get_gdd_progress(region_id, year)


@router.get("/variety-risk")
async def forecast_variety_risk(
    region_id: str = Query("yeongju"),
    year: int | None = Query(None),
):
    """품종별 리스크 매트릭스."""
    result = await annual_forecast(region_id, year)
    return {
        "region_id": result["region_id"],
        "year": result["year"],
        "variety_risks": result["variety_risks"],
    }


@router.get("/bloom")
async def forecast_bloom(
    region_id: str = Query("yeongju"),
    year: int | None = Query(None),
):
    """개화·수확 예측."""
    result = await annual_forecast(region_id, year)
    return {
        "region_id": result["region_id"],
        "year": result["year"],
        "bloom_predictions": result["bloom_predictions"],
    }


@router.post("/train")
async def forecast_train(
    region_id: str = Query("yeongju"),
    start_year: int = Query(2013),
    end_year: int = Query(2023),
):
    """ML 모델 학습 (KOSIS 수확량 + ASOS 기상 데이터 결합)."""
    collector = get_climate_collector()
    kosis_data = await collector.fetch_kosis_yield(start_year, end_year)

    historical = []
    for record in kosis_data:
        y = record["year"]
        daily = await collector.fetch_asos_daily(region_id, y)
        features = extract_ml_features(daily)
        historical.append({
            "features": features,
            "yield_kg_per_10a": record["yield_kg_per_10a"],
        })

    return train_model(region_id, historical)
