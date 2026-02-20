from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from api import weather, price, land, statistics, orchard, simulation, variety

app = FastAPI(title="PJ18 Apple API", version="0.1.0")

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


@app.get("/health")
async def health():
    from core.database import check_db_connection
    db_ok = await check_db_connection()
    return {"status": "ok", "database": "connected" if db_ok else "disconnected"}
