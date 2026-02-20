from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, JSON, String
from sqlalchemy.orm import DeclarativeBase


def _utcnow():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False, index=True)
    variety = Column(String, nullable=False, index=True)
    grade = Column(String, nullable=False)
    market = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    change = Column(Float, default=0)
    created_at = Column(DateTime, default=_utcnow)


class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    region_id = Column(String, nullable=False, index=True)
    date = Column(String, nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=_utcnow)


class OrchardPlan(Base):
    __tablename__ = "orchard_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=True)
    variety_id = Column(String, nullable=False)
    area_pyeong = Column(Float, nullable=False)
    design_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
