"""작황 예측 엔진 (Lv1 규칙 + Lv2 통계 + Lv3 ML).

Lv1: 월별 4개 서브스코어 기반 규칙 엔진
Lv2: GDD 기반 개화·수확 예측, 품종별 리스크 매트릭스
Lv3: scikit-learn RandomForest (선택적, 없으면 graceful degradation)
"""

from __future__ import annotations

import logging
import pickle
from datetime import date
from pathlib import Path

from services.gdd_calculator import (
    VARIETY_PHENOLOGY,
    DailyClimate,
    calc_accumulated_gdd,
    calc_august_night_temp,
    calc_summer_rain_total,
    count_bloom_frost_days,
    count_frost_days,
    count_heat_stress_days,
    extract_ml_features,
    predict_bloom_date,
    predict_harvest_date,
)
from services.climate_collector import get_climate_collector, STATION_MAP
from core.config import settings

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent / "data" / "models"

# 월별 가중치 (핵심 생육기에 가중)
MONTH_WEIGHTS: dict[int, float] = {
    1: 0.6, 2: 0.6, 3: 0.8, 4: 2.0,   # 개화기 2x
    5: 1.0, 6: 1.5, 7: 1.5, 8: 1.2,   # 여름 생육기 1.5x
    9: 1.5, 10: 1.0, 11: 0.7, 12: 0.5, # 수확기 1.5x
}


# ──────────────────────────────────────────────────────────────────────
# Lv1: 규칙 기반 월별 스코어
# ──────────────────────────────────────────────────────────────────────

def _score_gdd_deviation(monthly_gdd: float, normal_gdd: float) -> float:
    """GDD 이탈도 점수 (0-25). 평년 대비 이탈이 클수록 감점."""
    if normal_gdd == 0:
        return 20.0
    deviation = abs(monthly_gdd - normal_gdd) / normal_gdd
    if deviation < 0.05:
        return 25.0
    elif deviation < 0.15:
        return 20.0
    elif deviation < 0.30:
        return 15.0
    elif deviation < 0.50:
        return 10.0
    else:
        return 5.0


def _score_frost_risk(frost_days: int, month: int) -> float:
    """서리 위험 점수 (0-25). 4월 개화기는 2배 가중."""
    multiplier = 2.0 if month == 4 else 1.0
    effective = frost_days * multiplier
    if effective == 0:
        return 25.0
    elif effective <= 2:
        return 20.0
    elif effective <= 5:
        return 15.0
    elif effective <= 10:
        return 8.0
    else:
        return 3.0


def _score_precip_balance(rainfall: float, normal_rainfall: float) -> float:
    """강수 균형 점수 (0-25). 과다=병해, 부족=가뭄."""
    if normal_rainfall == 0:
        return 20.0 if rainfall < 10 else 15.0
    ratio = rainfall / normal_rainfall
    if 0.7 <= ratio <= 1.3:
        return 25.0
    elif 0.5 <= ratio <= 1.5:
        return 20.0
    elif 0.3 <= ratio <= 2.0:
        return 12.0
    else:
        return 5.0


def _score_extreme_temp(
    min_ta: float,
    max_ta: float,
    month: int,
) -> float:
    """극한 기온 점수 (0-25). 7~8월 고온, 1~2월 한파."""
    score = 25.0

    # 여름 고온 (7~8월)
    if month in (7, 8) and max_ta > 33.0:
        penalty = min(20.0, (max_ta - 33.0) * 3)
        score -= penalty

    # 겨울 한파 (1~2월)
    if month in (1, 2) and min_ta < -15.0:
        penalty = min(15.0, abs(min_ta + 15.0) * 2)
        score -= penalty

    # 4월 늦서리
    if month == 4 and min_ta < 0.0:
        penalty = min(15.0, abs(min_ta) * 5)
        score -= penalty

    return max(0.0, score)


def calc_monthly_scores(
    daily_data: list[DailyClimate],
    normals: list[dict],
) -> list[dict]:
    """12개월 서브스코어 계산.

    Returns: [{"month": 1, "score": 80.0, "label": "좋음", ...}, ...]
    """
    from services.gdd_calculator import calc_daily_gdd, TBASE

    normal_map = {n["month"]: n for n in normals}
    monthly: dict[int, list[DailyClimate]] = {}
    for d in daily_data:
        try:
            m = date.fromisoformat(d["date"]).month
        except (ValueError, TypeError):
            continue
        monthly.setdefault(m, []).append(d)

    results = []
    for month in range(1, 13):
        days = monthly.get(month, [])
        normal = normal_map.get(month, {"min_ta": 0, "max_ta": 10, "rainfall": 50})

        # 월별 GDD
        month_gdd = sum(calc_daily_gdd(d["min_ta"], d["max_ta"]) for d in days)
        normal_gdd = sum(
            max(0, (normal["max_ta"] + normal["min_ta"]) / 2 - TBASE)
            for _ in range(len(days) or 30)
        )

        # 서리일수
        frost = sum(1 for d in days if d["min_ta"] <= 0)

        # 총 강수
        rain = sum(d["rainfall"] for d in days)

        # 평균 최저/최고
        avg_min = sum(d["min_ta"] for d in days) / len(days) if days else normal["min_ta"]
        avg_max = sum(d["max_ta"] for d in days) / len(days) if days else normal["max_ta"]

        # 4개 서브스코어
        gdd_score = _score_gdd_deviation(month_gdd, normal_gdd)
        frost_score = _score_frost_risk(frost, month)
        precip_score = _score_precip_balance(rain, normal["rainfall"])
        temp_score = _score_extreme_temp(avg_min, avg_max, month)

        total = gdd_score + frost_score + precip_score + temp_score
        gdd_dev = round((month_gdd - normal_gdd) / normal_gdd * 100, 1) if normal_gdd else 0

        if total >= 80:
            label = "좋음"
        elif total >= 60:
            label = "보통"
        elif total >= 40:
            label = "주의"
        else:
            label = "위험"

        results.append({
            "month": month,
            "score": round(total, 1),
            "label": label,
            "gdd_deviation": gdd_dev,
            "frost_risk": round(25 - frost_score, 1),
            "precip_balance": round(precip_score, 1),
            "extreme_temp": round(temp_score, 1),
        })

    return results


def calc_annual_score(monthly_scores: list[dict]) -> tuple[float, str]:
    """가중 평균 연간 점수 + 라벨."""
    total_weight = 0.0
    weighted_sum = 0.0
    for ms in monthly_scores:
        w = MONTH_WEIGHTS.get(ms["month"], 1.0)
        weighted_sum += ms["score"] * w
        total_weight += w

    score = round(weighted_sum / total_weight, 1) if total_weight > 0 else 50.0

    if score >= 80:
        label = "풍작"
    elif score >= 60:
        label = "평년작"
    elif score >= 40:
        label = "부진"
    else:
        label = "흉작"

    return score, label


# ──────────────────────────────────────────────────────────────────────
# Lv2: 통계 기반 예측
# ──────────────────────────────────────────────────────────────────────

def calc_bloom_predictions(daily_data: list[DailyClimate]) -> list[dict]:
    """전 품종 개화·수확 예측."""
    results = []
    for variety, pheno in VARIETY_PHENOLOGY.items():
        bloom = predict_bloom_date(daily_data, variety)
        harvest = predict_harvest_date(bloom, variety) if bloom else None

        # GDD at bloom
        gdd_at_bloom = None
        if bloom:
            bloom_data = [d for d in daily_data if d["date"] <= bloom]
            gdd_list = calc_accumulated_gdd(bloom_data)
            gdd_at_bloom = gdd_list[-1] if gdd_list else None

        results.append({
            "variety": variety,
            "bloom_date": bloom,
            "harvest_date": harvest,
            "gdd_at_bloom": gdd_at_bloom,
            "days_to_harvest": pheno["days_bloom_to_harvest"],
        })
    return results


def calc_variety_risks(daily_data: list[DailyClimate]) -> list[dict]:
    """품종별 리스크 매트릭스."""
    frost_total = count_frost_days(daily_data)
    heat_total = count_heat_stress_days(daily_data)
    summer_rain = calc_summer_rain_total(daily_data)

    def _level(value: float, thresholds: tuple[float, float]) -> str:
        if value <= thresholds[0]:
            return "낮음"
        elif value <= thresholds[1]:
            return "보통"
        return "높음"

    results = []
    for variety, pheno in VARIETY_PHENOLOGY.items():
        bloom = predict_bloom_date(daily_data, variety)
        bloom_frost = count_bloom_frost_days(daily_data, bloom)

        # 품종 특성 반영
        frost_sens = pheno["frost_sensitivity"]
        heat_tol = pheno["heat_tolerance"]

        effective_frost = bloom_frost * frost_sens * 2 + frost_total * 0.3
        effective_heat = heat_total * (1 - heat_tol)
        effective_rain = summer_rain

        frost_risk = _level(effective_frost, (3, 8))
        heat_risk = _level(effective_heat, (5, 15))
        rain_risk = _level(effective_rain, (500, 900))
        disease_risk = _level(effective_rain * 0.8 + effective_heat * 2, (350, 700))

        # 종합 (위험 카운트)
        risk_counts = sum(
            1 for r in [frost_risk, heat_risk, rain_risk, disease_risk]
            if r == "높음"
        )
        warn_counts = sum(
            1 for r in [frost_risk, heat_risk, rain_risk, disease_risk]
            if r == "보통"
        )

        if risk_counts >= 2:
            overall = "경고"
            overall_score = max(0, 100 - risk_counts * 25 - warn_counts * 10)
        elif risk_counts >= 1 or warn_counts >= 2:
            overall = "주의"
            overall_score = max(20, 100 - risk_counts * 20 - warn_counts * 8)
        else:
            overall = "안전"
            overall_score = max(60, 100 - warn_counts * 5)

        results.append({
            "variety": variety,
            "frost_risk": frost_risk,
            "heat_risk": heat_risk,
            "rain_risk": rain_risk,
            "disease_risk": disease_risk,
            "overall": overall,
            "overall_score": round(overall_score, 1),
        })

    return results


# ──────────────────────────────────────────────────────────────────────
# Lv3: ML 기반 예측 (선택적)
# ──────────────────────────────────────────────────────────────────────

def _try_ml_predict(daily_data: list[DailyClimate], region_id: str, year: int) -> dict | None:
    """scikit-learn RandomForest 예측 (없으면 None)."""
    try:
        import numpy as np
        from sklearn.ensemble import RandomForestRegressor  # noqa: F401

        model_path = MODEL_DIR / f"yield_rf_{region_id}.pkl"
        if not model_path.exists():
            return None

        with open(model_path, "rb") as f:
            model = pickle.load(f)

        features = extract_ml_features(daily_data)
        X = np.array([[
            features["total_gdd"],
            features["frost_days"],
            features["bloom_frost_days"],
            features["heat_stress_days"],
            features["summer_rain_mm"],
            features["aug_night_temp"],
            features["bloom_date_doy"],
        ]])
        predicted = model.predict(X)[0]

        return {
            "region_id": region_id,
            "year": year,
            "predicted_yield_kg_per_10a": round(float(predicted), 0),
            "confidence": 0.7,
            "model_used": "random_forest",
            "features_used": list(features.keys()),
        }

    except ImportError:
        logger.info("scikit-learn 미설치 → ML 예측 스킵")
        return None
    except Exception as e:
        logger.warning("ML 예측 실패: %s", e)
        return None


def train_model(region_id: str, historical_data: list[dict]) -> dict:
    """ML 모델 학습 (수동 트리거).

    historical_data: [{"features": {...}, "yield_kg_per_10a": float}, ...]
    """
    try:
        import numpy as np
        from sklearn.ensemble import RandomForestRegressor

        if len(historical_data) < 5:
            return {"success": False, "error": "최소 5년치 데이터 필요"}

        feature_keys = [
            "total_gdd", "frost_days", "bloom_frost_days",
            "heat_stress_days", "summer_rain_mm", "aug_night_temp",
            "bloom_date_doy",
        ]

        X = np.array([
            [d["features"].get(k, 0) for k in feature_keys]
            for d in historical_data
        ])
        y = np.array([d["yield_kg_per_10a"] for d in historical_data])

        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)

        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        model_path = MODEL_DIR / f"yield_rf_{region_id}.pkl"
        with open(model_path, "wb") as f:
            pickle.dump(model, f)

        return {
            "success": True,
            "model_path": str(model_path),
            "samples": len(historical_data),
            "feature_importances": dict(zip(feature_keys, model.feature_importances_.tolist())),
        }

    except ImportError:
        return {"success": False, "error": "scikit-learn 미설치"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ──────────────────────────────────────────────────────────────────────
# 메인 엔트리포인트
# ──────────────────────────────────────────────────────────────────────

async def annual_forecast(region_id: str, year: int | None = None) -> dict:
    """연간 작황 전망 — Lv1+Lv2+Lv3 통합.

    Returns: AnnualForecastResponse 호환 딕셔너리.
    """
    if year is None:
        year = date.today().year

    collector = get_climate_collector()
    daily_data = await collector.fetch_asos_daily(region_id, year)
    normals = collector.get_climate_normals(region_id)

    # Lv1: 월별 스코어
    monthly_scores = calc_monthly_scores(daily_data, normals)
    overall_score, overall_label = calc_annual_score(monthly_scores)

    # Lv2: 개화·수확 + 품종 리스크
    bloom_predictions = calc_bloom_predictions(daily_data)
    variety_risks = calc_variety_risks(daily_data)

    # Lv3: ML 예측 (선택)
    yield_pred = _try_ml_predict(daily_data, region_id, year)

    # 추천 메시지
    recommendation = _generate_recommendation(overall_score, overall_label, variety_risks)

    # 데이터 소스 판단
    data_source = "mock"
    if settings.data_portal_api_key:
        cache_path = Path(__file__).parent.parent / "data" / "climate_cache"
        stn_id = STATION_MAP.get(region_id)
        if stn_id and (cache_path / f"asos_{stn_id}_{year}.json").exists():
            data_source = "asos"

    return {
        "region_id": region_id,
        "year": year,
        "overall_score": overall_score,
        "overall_label": overall_label,
        "recommendation": recommendation,
        "monthly_scores": monthly_scores,
        "bloom_predictions": bloom_predictions,
        "variety_risks": variety_risks,
        "yield_prediction": yield_pred,
        "data_source": data_source,
    }


async def get_gdd_progress(region_id: str, year: int | None = None) -> dict:
    """GDD 누적 진행 상황."""
    if year is None:
        year = date.today().year

    collector = get_climate_collector()
    daily_data = await collector.fetch_asos_daily(region_id, year)
    normals = collector.get_climate_normals(region_id)

    from services.gdd_calculator import calc_daily_gdd, TBASE

    # 실제 GDD 누적
    gdd_acc = calc_accumulated_gdd(daily_data)

    # 평년 GDD 누적 (일별 보간)
    normal_map = {n["month"]: n for n in normals}
    normal_acc = []
    total = 0.0
    for d in daily_data:
        try:
            m = date.fromisoformat(d["date"]).month
        except (ValueError, TypeError):
            normal_acc.append(total)
            continue
        n = normal_map.get(m, {"min_ta": 0, "max_ta": 10})
        total += calc_daily_gdd(n["min_ta"], n["max_ta"])
        normal_acc.append(round(total, 1))

    # 응답 생성
    progress = []
    for i, d in enumerate(daily_data):
        progress.append({
            "date": d["date"],
            "accumulated": gdd_acc[i] if i < len(gdd_acc) else 0,
            "normal": normal_acc[i] if i < len(normal_acc) else 0,
        })

    current = gdd_acc[-1] if gdd_acc else 0
    normal_total = normal_acc[-1] if normal_acc else 1
    deviation = round((current - normal_total) / normal_total * 100, 1) if normal_total else 0

    stn_id = STATION_MAP.get(region_id)

    return {
        "region_id": region_id,
        "year": year,
        "base_temp": TBASE,
        "current_gdd": current,
        "normal_gdd": normal_total,
        "deviation_pct": deviation,
        "daily_progress": progress,
    }


def _generate_recommendation(score: float, label: str, variety_risks: list[dict]) -> str:
    """점수 기반 종합 추천 메시지."""
    safe_varieties = [
        v["variety"] for v in variety_risks
        if v["overall"] == "안전"
    ]
    warn_varieties = [
        v["variety"] for v in variety_risks
        if v["overall"] == "경고"
    ]

    if score >= 80:
        msg = f"올해 작황은 '{label}'으로 전망됩니다. 전반적으로 양호한 기후 조건입니다."
    elif score >= 60:
        msg = f"올해 작황은 '{label}'으로 전망됩니다. 일부 시기에 주의가 필요합니다."
    elif score >= 40:
        msg = f"올해 작황은 '{label}'으로 전망됩니다. 적극적인 관리가 필요합니다."
    else:
        msg = f"올해 작황은 '{label}'으로 전망됩니다. 각별한 주의와 대비가 필요합니다."

    if safe_varieties:
        msg += f" 안전 품종: {', '.join(safe_varieties)}."
    if warn_varieties:
        msg += f" 경고 품종: {', '.join(warn_varieties)} — 집중 관리 권장."

    return msg


# 싱글턴 (편의용)
_instance_cache: dict[str, object] = {}
