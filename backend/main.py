from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from api import weather, price, land, statistics, orchard, simulation, variety
from services.data_refresher import data_refresher

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lifespan: 서버 시작 시 DataRefresher 스케줄러를 백그라운드로 실행
# ---------------------------------------------------------------------------

_scheduler_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan — 시작/종료 시 DataRefresher 스케줄러 관리."""
    global _scheduler_task
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

app = FastAPI(title="PJ18 Apple API", version="0.1.0", lifespan=lifespan)

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
