from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.versioning import VERSION, get_system_info, mark_started
from core.feature_flags import get_feature_flags
from api import weather, price, land, statistics, orchard, simulation, variety, trend, forecast, grading
from services.data_refresher import data_refresher
from services.anomaly_detector import get_anomaly_detector
from services.health_monitor import get_health_monitor
from services.data_quality import get_data_quality_scorer
from services.usage_analytics import get_usage_analytics
from core.evolution_engine import get_evolution_engine
from core.experiment import get_experiment_manager
from core.migration_manager import get_migration_manager

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lifespan: 서버 시작 시 DataRefresher 스케줄러를 백그라운드로 실행
# ---------------------------------------------------------------------------

_scheduler_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan — 시작/종료 시 DataRefresher 스케줄러 관리."""
    global _scheduler_task
    mark_started()
    logger.info("DataRefresher 백그라운드 스케줄러 기동")
    _scheduler_task = asyncio.create_task(data_refresher.run_scheduler())
    yield
    # shutdown
    logger.info("DataRefresher 스케줄러 종료 요청")
    data_refresher.stop()
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        try:
            await _scheduler_task
        except asyncio.CancelledError:
            pass
    logger.info("DataRefresher 스케줄러 종료 완료")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="PJ18 Apple API", version=VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 외부 API 연동
app.include_router(weather.router)
app.include_router(price.router)
app.include_router(land.router)
app.include_router(statistics.router)

# 비즈니스 로직
app.include_router(orchard.router)
app.include_router(simulation.router)
app.include_router(variety.router)
app.include_router(trend.router)
app.include_router(forecast.router)
app.include_router(grading.router)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    from core.database import check_db_connection
    db_ok = await check_db_connection()
    return {"status": "ok", "database": "connected" if db_ok else "disconnected"}


# ---------------------------------------------------------------------------
# Data Refresh endpoints
# ---------------------------------------------------------------------------

@app.get("/api/refresh/status")
async def refresh_status():
    """데이터 갱신 상태 조회."""
    return data_refresher.get_refresh_status()


@app.post("/api/refresh/trigger")
async def refresh_trigger(source: str = "all"):
    """수동 데이터 갱신 트리거.

    Args:
        source: "all" | "weather" | "prices"
    """
    if source == "weather":
        result = await data_refresher.refresh_weather()
    elif source == "prices":
        result = await data_refresher.refresh_prices()
    else:
        result = await data_refresher.refresh_all()
    return result


# ---------------------------------------------------------------------------
# System (진화 렌즈: 버전 + 피처 플래그)
# ---------------------------------------------------------------------------

@app.get("/api/system/info")
async def system_info():
    """시스템 버전, 업타임, 피처 플래그, 변경이력 조회."""
    return get_system_info()


@app.get("/api/system/flags")
async def system_flags():
    """피처 플래그 전체 목록."""
    return get_feature_flags().get_all()


@app.post("/api/system/flags/{flag}")
async def toggle_flag(flag: str, enabled: bool = True):
    """피처 플래그 토글."""
    ff = get_feature_flags()
    ff.set_flag(flag, enabled)
    return {"flag": flag, "enabled": enabled}


# ---------------------------------------------------------------------------
# Anomaly Detection (자율성 렌즈: 이상 감지)
# ---------------------------------------------------------------------------

@app.get("/api/anomaly/alerts")
async def anomaly_alerts(limit: int = 20, category: str | None = None):
    """이상 감지 알림 조회."""
    return get_anomaly_detector().get_alerts(limit=limit, category=category)


@app.get("/api/anomaly/stats")
async def anomaly_stats():
    """이상 감지 통계."""
    return get_anomaly_detector().get_stats()


# ---------------------------------------------------------------------------
# Health Monitor (자율성 렌즈: 자가 진단)
# ---------------------------------------------------------------------------

@app.get("/api/system/health")
async def system_health():
    """전체 시스템 건강 점검."""
    return await get_health_monitor().run_full_check()


# ---------------------------------------------------------------------------
# Data Quality (품질루프 렌즈: 데이터 신뢰도)
# ---------------------------------------------------------------------------

@app.get("/api/quality/score")
async def data_quality_score():
    """데이터 품질 종합 점수 (날씨/가격/시뮬레이션)."""
    return get_data_quality_scorer().score_all()


# ---------------------------------------------------------------------------
# Usage Analytics (학습순환 렌즈: 사용 패턴 → 개선)
# ---------------------------------------------------------------------------

@app.get("/api/analytics/usage")
async def usage_analytics():
    """사용 패턴 분석 + 자동 개선 제안."""
    return get_usage_analytics().analyze()


# ---------------------------------------------------------------------------
# Evolution Engine (진화 렌즈 L5: 자가 진화)
# ---------------------------------------------------------------------------

@app.get("/api/evolution/status")
async def evolution_status():
    """진화 엔진 상태 (세대, 보정 계수, 이력)."""
    return get_evolution_engine().get_status()


@app.post("/api/evolution/evolve")
async def trigger_evolution():
    """진화 사이클 1회 실행 (피드백 기반 파라미터 자동 보정)."""
    return get_evolution_engine().evolve()


@app.post("/api/evolution/rollback")
async def evolution_rollback():
    """마지막 진화를 되돌린다."""
    return get_evolution_engine().rollback()


# ---------------------------------------------------------------------------
# Experiments (진화 렌즈 L5: A/B 실험)
# ---------------------------------------------------------------------------

@app.get("/api/experiments")
async def list_experiments():
    """전체 실험 목록."""
    return get_experiment_manager().list_all()


@app.post("/api/experiments/{experiment_id}/record")
async def record_experiment(experiment_id: str, session_key: str,
                            satisfied: bool):
    """실험 결과 기록 + 자동 결론 체크."""
    return get_experiment_manager().record_and_check(
        experiment_id=experiment_id,
        session_key=session_key,
        satisfied=satisfied,
    )


# ---------------------------------------------------------------------------
# Migration (진화 렌즈 L5: 스키마 마이그레이션)
# ---------------------------------------------------------------------------

@app.get("/api/migration/status")
async def migration_status():
    """마이그레이션 상태."""
    return get_migration_manager().get_status()


@app.post("/api/migration/run")
async def run_migration():
    """전체 데이터 파일 마이그레이션 실행."""
    return get_migration_manager().migrate_all()
