from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/statistics", tags=["statistics"])

class ProductionStat(BaseModel):
    year: int
    total_area_ha: float
    total_production_ton: float
    yield_per_10a_kg: float

class RegionalArea(BaseModel):
    region: str
    area_ha: float
    ratio: float

# 정적 통계 데이터 (KOSIS 기반, 추후 API 연동)
PRODUCTION_STATS = [
    ProductionStat(year=2024, total_area_ha=33500, total_production_ton=498000, yield_per_10a_kg=1487),
    ProductionStat(year=2023, total_area_ha=33800, total_production_ton=510000, yield_per_10a_kg=1509),
    ProductionStat(year=2022, total_area_ha=34200, total_production_ton=475000, yield_per_10a_kg=1389),
    ProductionStat(year=2021, total_area_ha=33900, total_production_ton=490000, yield_per_10a_kg=1445),
    ProductionStat(year=2020, total_area_ha=33600, total_production_ton=505000, yield_per_10a_kg=1503),
]

REGIONAL_AREAS = [
    RegionalArea(region="경북", area_ha=19500, ratio=0.582),
    RegionalArea(region="충북", area_ha=4800, ratio=0.143),
    RegionalArea(region="경남", area_ha=3200, ratio=0.096),
    RegionalArea(region="전북", area_ha=2100, ratio=0.063),
    RegionalArea(region="강원", area_ha=1800, ratio=0.054),
    RegionalArea(region="충남", area_ha=1200, ratio=0.036),
    RegionalArea(region="기타", area_ha=900, ratio=0.027),
]

@router.get("/production", response_model=list[ProductionStat])
async def get_production_stats():
    """연도별 사과 생산 현황"""
    return PRODUCTION_STATS

@router.get("/area", response_model=list[RegionalArea])
async def get_regional_area():
    """지역별 재배면적"""
    return REGIONAL_AREAS
