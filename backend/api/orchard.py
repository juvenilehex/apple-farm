from fastapi import APIRouter

from schemas.orchard import OrchardDesignRequest, OrchardDesignResponse
from services.orchard import design_orchard

router = APIRouter(prefix="/api/orchard", tags=["orchard"])


@router.post("/design", response_model=OrchardDesignResponse)
async def create_design(req: OrchardDesignRequest):
    """밭 자동설계 — 면적+품종 입력 → 배치도+수확량 반환"""
    return design_orchard(req)
