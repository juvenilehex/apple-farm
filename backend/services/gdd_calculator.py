"""GDD (Growing Degree Days) 계산 모듈.

순수 계산 함수만 포함 — 외부 의존성 없음.
사과 기준온도(Tbase) = 5°C.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import TypedDict

TBASE = 5.0  # 사과 기준온도 (°C)

# 품종별 생육 임계값 (GDD 단위)
VARIETY_PHENOLOGY: dict[str, dict] = {
    "fuji": {
        "bloom_gdd": 350,       # 개화 시작 GDD
        "full_bloom_gdd": 420,
        "days_bloom_to_harvest": 170,
        "frost_sensitivity": 0.8,   # 0-1 (높을수록 민감)
        "heat_tolerance": 0.5,
    },
    "hongro": {
        "bloom_gdd": 320,
        "full_bloom_gdd": 390,
        "days_bloom_to_harvest": 130,
        "frost_sensitivity": 0.7,
        "heat_tolerance": 0.6,
    },
    "gala": {
        "bloom_gdd": 300,
        "full_bloom_gdd": 370,
        "days_bloom_to_harvest": 120,
        "frost_sensitivity": 0.6,
        "heat_tolerance": 0.7,
    },
    "yanggwang": {
        "bloom_gdd": 330,
        "full_bloom_gdd": 400,
        "days_bloom_to_harvest": 140,
        "frost_sensitivity": 0.75,
        "heat_tolerance": 0.55,
    },
    "arisoo": {
        "bloom_gdd": 310,
        "full_bloom_gdd": 380,
        "days_bloom_to_harvest": 135,
        "frost_sensitivity": 0.5,
        "heat_tolerance": 0.8,
    },
    "gamhong": {
        "bloom_gdd": 340,
        "full_bloom_gdd": 410,
        "days_bloom_to_harvest": 150,
        "frost_sensitivity": 0.65,
        "heat_tolerance": 0.65,
    },
}


class DailyClimate(TypedDict):
    date: str       # ISO date (YYYY-MM-DD)
    min_ta: float   # 일 최저기온 (°C)
    max_ta: float   # 일 최고기온 (°C)
    rainfall: float # 강수량 (mm)


def calc_daily_gdd(min_ta: float, max_ta: float, tbase: float = TBASE) -> float:
    """일별 GDD 계산: max(0, (max+min)/2 - Tbase)."""
    return max(0.0, (max_ta + min_ta) / 2.0 - tbase)


def calc_accumulated_gdd(daily_data: list[DailyClimate], tbase: float = TBASE) -> list[float]:
    """누적 GDD 리스트 반환 (daily_data 순서대로)."""
    accumulated: list[float] = []
    total = 0.0
    for d in daily_data:
        total += calc_daily_gdd(d["min_ta"], d["max_ta"], tbase)
        accumulated.append(round(total, 1))
    return accumulated


def predict_bloom_date(
    daily_data: list[DailyClimate],
    variety: str = "fuji",
    tbase: float = TBASE,
) -> str | None:
    """GDD 임계값 도달일 예측 → 개화 예상일 (ISO date string)."""
    pheno = VARIETY_PHENOLOGY.get(variety, VARIETY_PHENOLOGY["fuji"])
    bloom_threshold = pheno["bloom_gdd"]
    total = 0.0
    for d in daily_data:
        total += calc_daily_gdd(d["min_ta"], d["max_ta"], tbase)
        if total >= bloom_threshold:
            return d["date"]
    return None


def predict_harvest_date(bloom_date_str: str, variety: str = "fuji") -> str | None:
    """개화일 + 품종별 일수 → 수확 예상일."""
    if not bloom_date_str:
        return None
    pheno = VARIETY_PHENOLOGY.get(variety, VARIETY_PHENOLOGY["fuji"])
    try:
        bloom = date.fromisoformat(bloom_date_str)
        harvest = bloom + timedelta(days=pheno["days_bloom_to_harvest"])
        return harvest.isoformat()
    except (ValueError, TypeError):
        return None


def count_frost_days(daily_data: list[DailyClimate], threshold: float = 0.0) -> int:
    """최저기온이 threshold 이하인 날 수."""
    return sum(1 for d in daily_data if d["min_ta"] <= threshold)


def count_bloom_frost_days(
    daily_data: list[DailyClimate],
    bloom_date_str: str | None,
    window_days: int = 14,
    threshold: float = 0.0,
) -> int:
    """개화기 전후 window 기간 서리일수 (개화기 2배 가중 위험)."""
    if not bloom_date_str:
        return 0
    try:
        bloom = date.fromisoformat(bloom_date_str)
    except (ValueError, TypeError):
        return 0

    start = bloom - timedelta(days=window_days)
    end = bloom + timedelta(days=window_days)
    count = 0
    for d in daily_data:
        try:
            dd = date.fromisoformat(d["date"])
        except (ValueError, TypeError):
            continue
        if start <= dd <= end and d["min_ta"] <= threshold:
            count += 1
    return count


def count_heat_stress_days(
    daily_data: list[DailyClimate],
    threshold: float = 33.0,
    months: tuple[int, ...] = (7, 8),
) -> int:
    """고온 스트레스 일수 (7~8월 최고기온 > threshold)."""
    count = 0
    for d in daily_data:
        try:
            dd = date.fromisoformat(d["date"])
        except (ValueError, TypeError):
            continue
        if dd.month in months and d["max_ta"] > threshold:
            count += 1
    return count


def calc_summer_rain_total(
    daily_data: list[DailyClimate],
    months: tuple[int, ...] = (6, 7, 8),
) -> float:
    """여름철(6~8월) 총 강수량."""
    total = 0.0
    for d in daily_data:
        try:
            dd = date.fromisoformat(d["date"])
        except (ValueError, TypeError):
            continue
        if dd.month in months:
            total += d["rainfall"]
    return round(total, 1)


def calc_august_night_temp(daily_data: list[DailyClimate]) -> float | None:
    """8월 평균 최저기온 (야간 기온 → 착색에 영향)."""
    temps = []
    for d in daily_data:
        try:
            dd = date.fromisoformat(d["date"])
        except (ValueError, TypeError):
            continue
        if dd.month == 8:
            temps.append(d["min_ta"])
    return round(sum(temps) / len(temps), 1) if temps else None


def extract_ml_features(daily_data: list[DailyClimate], variety: str = "fuji") -> dict:
    """ML 학습/예측용 피처 딕셔너리 추출."""
    bloom = predict_bloom_date(daily_data, variety)
    gdd_list = calc_accumulated_gdd(daily_data)
    total_gdd = gdd_list[-1] if gdd_list else 0.0

    return {
        "total_gdd": total_gdd,
        "frost_days": count_frost_days(daily_data),
        "bloom_frost_days": count_bloom_frost_days(daily_data, bloom),
        "heat_stress_days": count_heat_stress_days(daily_data),
        "summer_rain_mm": calc_summer_rain_total(daily_data),
        "aug_night_temp": calc_august_night_temp(daily_data) or 20.0,
        "bloom_date_doy": date.fromisoformat(bloom).timetuple().tm_yday if bloom else 110,
    }
