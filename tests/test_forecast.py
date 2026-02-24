"""작황 예측 시스템 테스트.

GDD 계산, 서리일수, 개화일 예측, 스코어 범위, mock 폴백, ML graceful degradation.
"""

import sys
from pathlib import Path

import pytest

# backend 모듈 경로 추가
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


# ─── GDD 계산 테스트 ─────────────────────────────────────────

class TestGddCalculator:
    def test_calc_daily_gdd_positive(self):
        from services.gdd_calculator import calc_daily_gdd
        # (10 + 20) / 2 - 5 = 10
        assert calc_daily_gdd(10.0, 20.0) == 10.0

    def test_calc_daily_gdd_zero(self):
        from services.gdd_calculator import calc_daily_gdd
        # (-5 + 5) / 2 - 5 = -5 → 0
        assert calc_daily_gdd(-5.0, 5.0) == 0.0

    def test_calc_daily_gdd_cold(self):
        from services.gdd_calculator import calc_daily_gdd
        # (-10 + -2) / 2 - 5 = -11 → 0
        assert calc_daily_gdd(-10.0, -2.0) == 0.0

    def test_accumulated_gdd(self):
        from services.gdd_calculator import calc_accumulated_gdd
        data = [
            {"date": "2026-04-01", "min_ta": 5.0, "max_ta": 15.0, "rainfall": 0},
            {"date": "2026-04-02", "min_ta": 8.0, "max_ta": 20.0, "rainfall": 0},
            {"date": "2026-04-03", "min_ta": -2.0, "max_ta": 3.0, "rainfall": 0},
        ]
        result = calc_accumulated_gdd(data)
        assert len(result) == 3
        assert result[0] == 5.0  # (15+5)/2 - 5
        assert result[1] == 14.0  # 5 + (20+8)/2-5 = 5 + 9
        assert result[2] == 14.0  # 마지막 날 GDD 0이라 그대로

    def test_frost_days(self):
        from services.gdd_calculator import count_frost_days
        data = [
            {"date": "2026-01-01", "min_ta": -5.0, "max_ta": 3.0, "rainfall": 0},
            {"date": "2026-01-02", "min_ta": 1.0, "max_ta": 8.0, "rainfall": 0},
            {"date": "2026-01-03", "min_ta": 0.0, "max_ta": 5.0, "rainfall": 0},
            {"date": "2026-01-04", "min_ta": -3.0, "max_ta": 2.0, "rainfall": 0},
        ]
        assert count_frost_days(data) == 3  # -5, 0, -3

    def test_heat_stress_days(self):
        from services.gdd_calculator import count_heat_stress_days
        data = [
            {"date": "2026-07-15", "min_ta": 22.0, "max_ta": 35.0, "rainfall": 0},
            {"date": "2026-07-16", "min_ta": 21.0, "max_ta": 32.0, "rainfall": 0},
            {"date": "2026-08-01", "min_ta": 23.0, "max_ta": 36.0, "rainfall": 0},
            {"date": "2026-06-15", "min_ta": 20.0, "max_ta": 34.0, "rainfall": 0},
        ]
        assert count_heat_stress_days(data) == 2  # 7/15, 8/1 (6월 제외)


# ─── 개화일 예측 ─────────────────────────────────────────────

class TestBloomPrediction:
    def test_predict_bloom_date_fuji(self):
        from services.gdd_calculator import predict_bloom_date
        # 따뜻한 날 반복 → GDD 350 도달
        data = [
            {"date": f"2026-03-{d:02d}", "min_ta": 8.0, "max_ta": 22.0, "rainfall": 0}
            for d in range(1, 32)
        ] + [
            {"date": f"2026-04-{d:02d}", "min_ta": 10.0, "max_ta": 24.0, "rainfall": 0}
            for d in range(1, 31)
        ]
        bloom = predict_bloom_date(data, "fuji")
        assert bloom is not None
        assert bloom.startswith("2026-")

    def test_predict_harvest_date(self):
        from services.gdd_calculator import predict_harvest_date
        harvest = predict_harvest_date("2026-04-15", "fuji")
        assert harvest is not None
        # 후지: 170일 후 → 10월 초
        assert harvest.startswith("2026-10")

    def test_predict_bloom_none_cold(self):
        from services.gdd_calculator import predict_bloom_date
        # 매우 추운 날만 → GDD 임계값 미도달
        data = [
            {"date": f"2026-01-{d:02d}", "min_ta": -10.0, "max_ta": -2.0, "rainfall": 0}
            for d in range(1, 32)
        ]
        assert predict_bloom_date(data, "fuji") is None


# ─── 스코어 범위 ─────────────────────────────────────────────

class TestScoreRange:
    def test_monthly_scores_range(self):
        from services.yield_forecaster import calc_monthly_scores
        from services.climate_collector import ClimateCollector

        collector = ClimateCollector()
        daily = collector._generate_mock_daily("yeongju", 2025)
        normals = collector.get_climate_normals("yeongju")
        scores = calc_monthly_scores(daily, normals)

        assert len(scores) == 12
        for ms in scores:
            assert 0 <= ms["score"] <= 100, f"월 {ms['month']} 점수 범위 오류: {ms['score']}"
            assert ms["label"] in ("좋음", "보통", "주의", "위험")

    def test_annual_score_range(self):
        from services.yield_forecaster import calc_monthly_scores, calc_annual_score
        from services.climate_collector import ClimateCollector

        collector = ClimateCollector()
        daily = collector._generate_mock_daily("andong", 2025)
        normals = collector.get_climate_normals("andong")
        monthly = calc_monthly_scores(daily, normals)
        score, label = calc_annual_score(monthly)

        assert 0 <= score <= 100
        assert label in ("풍작", "평년작", "부진", "흉작")


# ─── Mock 폴백 ───────────────────────────────────────────────

class TestMockFallback:
    def test_mock_daily_generation(self):
        from services.climate_collector import ClimateCollector
        collector = ClimateCollector()
        data = collector._generate_mock_daily("yeongju", 2025)
        assert len(data) == 365
        assert data[0]["date"] == "2025-01-01"
        assert data[-1]["date"] == "2025-12-31"

    def test_mock_kosis_yield(self):
        from services.climate_collector import ClimateCollector
        collector = ClimateCollector()
        yields = collector._mock_kosis_yield(2018, 2023)
        assert len(yields) == 6
        for y in yields:
            assert 1000 < y["yield_kg_per_10a"] < 2500

    def test_climate_normals(self):
        from services.climate_collector import ClimateCollector
        collector = ClimateCollector()
        normals = collector.get_climate_normals("cheongsong")
        assert len(normals) == 12
        # 1월은 추워야
        assert normals[0]["min_ta"] < 0
        # 7월은 더워야
        assert normals[6]["max_ta"] > 25


# ─── ML graceful degradation ────────────────────────────────

class TestMLDegradation:
    def test_ml_predict_no_model(self):
        from services.yield_forecaster import _try_ml_predict
        from services.climate_collector import ClimateCollector

        collector = ClimateCollector()
        daily = collector._generate_mock_daily("yeongju", 2025)
        result = _try_ml_predict(daily, "yeongju", 2025)
        # 모델 파일이 없으므로 None 또는 정상 반환
        # (sklearn 설치 여부에 따라 다름)
        assert result is None or isinstance(result, dict)

    def test_extract_ml_features(self):
        from services.gdd_calculator import extract_ml_features
        from services.climate_collector import ClimateCollector

        collector = ClimateCollector()
        daily = collector._generate_mock_daily("yeongju", 2025)
        features = extract_ml_features(daily)

        assert "total_gdd" in features
        assert "frost_days" in features
        assert "heat_stress_days" in features
        assert "summer_rain_mm" in features
        assert features["total_gdd"] > 0


# ─── 통합 (async) ────────────────────────────────────────────

class TestIntegration:
    @pytest.mark.asyncio
    async def test_annual_forecast_mock(self):
        from services.yield_forecaster import annual_forecast
        result = await annual_forecast("yeongju", 2025)

        assert result["region_id"] == "yeongju"
        assert result["year"] == 2025
        assert 0 <= result["overall_score"] <= 100
        assert result["overall_label"] in ("풍작", "평년작", "부진", "흉작")
        assert len(result["monthly_scores"]) == 12
        assert isinstance(result["recommendation"], str)

    @pytest.mark.asyncio
    async def test_gdd_progress_mock(self):
        from services.yield_forecaster import get_gdd_progress
        result = await get_gdd_progress("yeongju", 2025)

        assert result["region_id"] == "yeongju"
        assert result["base_temp"] == 5.0
        assert result["current_gdd"] > 0
        assert len(result["daily_progress"]) > 0

    @pytest.mark.asyncio
    async def test_variety_risks(self):
        from services.yield_forecaster import annual_forecast
        result = await annual_forecast("andong", 2025)

        risks = result["variety_risks"]
        assert len(risks) > 0
        for vr in risks:
            assert vr["overall"] in ("안전", "주의", "경고")
            assert 0 <= vr["overall_score"] <= 100
