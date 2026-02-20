from __future__ import annotations

from pydantic import BaseModel


class Temperature(BaseModel):
    min: float
    max: float
    current: float


class WeatherResponse(BaseModel):
    region_id: str
    date: str
    temperature: Temperature
    humidity: float
    rainfall: float
    wind: float
    sky: str  # clear, cloudy, overcast, rain, snow
    alerts: list[str] = []


class ForecastItem(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    sky: str
    rainfall: float
    pop: float  # precipitation probability


class ForecastResponse(BaseModel):
    region_id: str
    forecasts: list[ForecastItem]


class WeatherRequest(BaseModel):
    region_id: str
    date: str | None = None
