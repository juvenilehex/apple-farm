from __future__ import annotations
import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from core.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """비동기 DB 세션을 주입하는 FastAPI Dependency."""
    async with SessionLocal() as session:
        yield session


async def check_db_connection() -> bool:
    """DB 연결 상태를 확인한다. 연결 실패 시 False 반환."""
    try:
        async with engine.connect() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        return True
    except Exception as e:
        logger.warning("DB 연결 실패: %s", e)
        return False
