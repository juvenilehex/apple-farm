"""Simulation API + Service 테스트."""
import pytest


def test_simulation_fuji(client):
    """후지 1000평 수익 시뮬레이션."""
    res = client.post("/api/simulation/run", json={
        "variety": "후지",
        "area_pyeong": 1000,
    })
    assert res.status_code == 200
    data = res.json()

    assert data["variety"] == "후지"
    assert data["area_pyeong"] == 1000.0
    assert data["area_10a"] > 0
    assert data["total_trees"] > 0

    # 등급 분포
    assert len(data["grade_distribution"]) == 4
    ratios = sum(g["ratio"] for g in data["grade_distribution"])
    assert ratios == pytest.approx(1.0, abs=0.01)

    # 매출/비용/수익
    assert data["annual_revenue"] > 0
    assert data["annual_cost"] > 0
    assert data["annual_profit"] > 0
    assert 0 < data["income_ratio"] < 1

    # 비용 내역 (기본 16 + 숨은비용 3)
    assert len(data["cost_breakdown"]) == 19

    # 연도별 추이 (기본 10년)
    assert len(data["yearly_projections"]) == 10
    # 1~2년차는 수확 0
    assert data["yearly_projections"][0]["yield_ratio"] == 0.0
    assert data["yearly_projections"][1]["yield_ratio"] == 0.0
    # 9~10년차는 수확 100%
    assert data["yearly_projections"][8]["yield_ratio"] == 1.0

    # 손익분기 연차
    assert 1 <= data["break_even_year"] <= 10
    assert data["roi_10year"] > 0


def test_simulation_custom_params(client):
    """사용자 지정 파라미터."""
    res = client.post("/api/simulation/run", json={
        "variety": "감홍",
        "area_pyeong": 500,
        "yield_per_10a": 2000,
        "price_per_kg": 10000,
        "projection_years": 5,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["variety"] == "감홍"
    assert data["yield_per_10a"] == 2000
    assert data["price_per_kg"] == 10000
    assert len(data["yearly_projections"]) == 5


def test_simulation_unknown_variety_uses_default(client):
    """알 수 없는 품종은 후지 기본값으로 시뮬레이션 (SSOT + self-refine 보정 가능)."""
    res = client.post("/api/simulation/run", json={
        "variety": "미상품종",
        "area_pyeong": 300,
    })
    assert res.status_code == 200
    data = res.json()
    # SSOT 기반 수확량 (간격에 따라 다양) ± self-refine 보정
    assert 1500 <= data["yield_per_10a"] <= 3000
