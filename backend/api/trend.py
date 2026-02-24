"""트렌드 감지 API."""
from __future__ import annotations

from fastapi import APIRouter

from services.trend_detector import generate_trend_report, get_variety_trend

router = APIRouter(prefix="/api/trend", tags=["trend"])


@router.get("/report")
async def trend_report():
    """전체 품종 트렌드 리포트.

    다중 시그널(가격·면적·뉴스·묘목) 기반 품종별 트렌드 분석.
    HOT/RISING/WATCH/STABLE/DECLINING 등급 부여.
    """
    return generate_trend_report()


@router.get("/variety/{variety_id}")
async def variety_trend(variety_id: str):
    """특정 품종 트렌드 상세."""
    result = get_variety_trend(variety_id)
    if result is None:
        return {"error": "품종을 찾을 수 없습니다", "variety_id": variety_id}
    return result
