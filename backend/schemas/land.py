from __future__ import annotations

from pydantic import BaseModel


class LandInfo(BaseModel):
    address: str
    area_m2: float
    area_pyeong: float
    land_category: str
    official_price: int  # 공시지가 원/m2
    slope: str | None = None
    drainage: str | None = None


class LandRequest(BaseModel):
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
