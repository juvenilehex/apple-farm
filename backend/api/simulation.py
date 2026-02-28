import time

from fastapi import APIRouter

from schemas.simulation import (
    SimulationRequest, SimulationResponse, AnalyticsContext,
    CompareRequest, CompareResponse,
    FeedbackRequest, FeedbackStats,
)
from services.simulation import simulate, compare_scenarios
from services.simulation_analytics import get_analytics
from services.simulation_feedback import get_feedback_collector
from services.simulation_validator import validate_simulation, suggest_refinement

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.post("/run", response_model=SimulationResponse)
async def run_simulation(req: SimulationRequest):
    """수익 시뮬레이션 — 품종+면적 입력 → 연도별 수익 예측"""
    t0 = time.perf_counter()
    result = simulate(req)

    # self-refine-loop R51: 검증 → 보정 → 재시뮬레이션
    try:
        notes = validate_simulation(result)
        if notes:
            refined_req = suggest_refinement(req, result, notes)
            if refined_req is not None:
                result = simulate(refined_req)
                result.refined = True
                # 보정 결과도 재검증 (1회만)
                notes = validate_simulation(result)
            result.validation_notes = notes if notes else None
    except Exception:
        pass

    duration_ms = (time.perf_counter() - t0) * 1000

    analytics = get_analytics()
    analytics.record_run(
        variety=result.variety,
        area_pyeong=result.area_pyeong,
        total_trees=result.total_trees,
        projection_years=req.projection_years,
        annual_profit=result.annual_profit,
        roi_10year=result.roi_10year,
        break_even_year=result.break_even_year,
        duration_ms=duration_ms,
    )

    # pipeline-connect R40: 과거 시뮬레이션 대비 비교 맥락 주입
    try:
        snapshot = analytics.get_snapshot()
        if snapshot.total_runs >= 2:
            result.analytics_context = AnalyticsContext(
                total_past_runs=snapshot.total_runs - 1,
                avg_roi=snapshot.avg_roi,
                roi_delta=round(result.roi_10year - snapshot.avg_roi, 2),
                avg_break_even=snapshot.avg_break_even,
                break_even_delta=round(result.break_even_year - snapshot.avg_break_even, 1),
                same_variety_count=snapshot.variety_counts.get(result.variety, 1) - 1,
                most_popular_variety=snapshot.most_popular_variety,
            )
    except Exception:
        pass

    return result


@router.post("/compare", response_model=CompareResponse)
async def compare_simulation(req: CompareRequest):
    """낙관/중립/비관 3시나리오 비교 (워크플로우 렌즈 L4)"""
    return compare_scenarios(
        variety=req.variety,
        area_pyeong=req.area_pyeong,
        projection_years=req.projection_years,
    )


@router.get("/analytics")
async def simulation_analytics():
    """시뮬레이션 실행 통계 조회"""
    return get_analytics().get_snapshot().to_dict()


@router.get("/analytics/trends")
async def simulation_trends(window: int = 50):
    """시뮬레이션 트렌드 분석 (L6 학습순환)"""
    return get_analytics().get_trends(window=window)


@router.post("/feedback")
async def submit_simulation_feedback(req: FeedbackRequest):
    """시뮬레이션 결과 피드백 제출 (feedback-system R48)"""
    collector = get_feedback_collector()
    entry = collector.submit(
        variety=req.variety,
        area_pyeong=req.area_pyeong,
        rating=req.rating,
        comment=req.comment,
    )

    # Step 5: 피드백 20건마다 자동 진화 트리거
    evolution_triggered = False
    try:
        from core.feature_flags import get_feature_flags
        if get_feature_flags().is_enabled("evolution_auto_trigger"):
            stats = collector.get_stats()
            if stats.get("total", 0) % 20 == 0 and stats.get("total", 0) > 0:
                from core.evolution_engine import get_evolution_engine
                result = get_evolution_engine().evolve()
                evolution_triggered = result.get("evolved", False)
    except Exception:
        pass

    return {
        "received": True,
        "timestamp": entry["timestamp"],
        "evolution_triggered": evolution_triggered,
    }


@router.get("/feedback/stats", response_model=FeedbackStats)
async def simulation_feedback_stats():
    """시뮬레이션 피드백 통계 조회"""
    return get_feedback_collector().get_stats()
