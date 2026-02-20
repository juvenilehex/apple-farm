from fastapi import APIRouter

from schemas.variety import RecommendRequest, RecommendResponse
from services.variety import recommend

router = APIRouter(prefix="/api/variety", tags=["variety"])


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_varieties(req: RecommendRequest):
    """품종 추천 — 지역+우선순위 입력 → 추천 품종 반환"""
    return recommend(req)
