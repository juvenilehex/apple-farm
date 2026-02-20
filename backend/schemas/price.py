from __future__ import annotations

from pydantic import BaseModel


class PriceRecord(BaseModel):
    date: str
    variety: str
    grade: str  # 특, 상, 보통
    market: str
    price: int  # 원/kg
    unit: str = "원/kg"
    change: float  # % change


class PriceTrendPoint(BaseModel):
    date: str
    price: int


class PriceTrendResponse(BaseModel):
    variety: str
    data: list[PriceTrendPoint]


class PriceRequest(BaseModel):
    variety: str | None = None
    grade: str | None = None
    market: str | None = None
    date_from: str | None = None
    date_to: str | None = None
