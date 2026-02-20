from fastapi import APIRouter

from schemas.simulation import SimulationRequest, SimulationResponse
from services.simulation import simulate

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.post("/run", response_model=SimulationResponse)
async def run_simulation(req: SimulationRequest):
    """수익 시뮬레이션 — 품종+면적 입력 → 연도별 수익 예측"""
    return simulate(req)
