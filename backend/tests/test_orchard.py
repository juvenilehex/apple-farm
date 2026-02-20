"""Orchard Design API + Service 테스트."""
import pytest


def test_design_fuji(client):
    """후지 1000평 밭 설계."""
    res = client.post("/api/orchard/design", json={
        "area_pyeong": 1000,
        "variety_id": "fuji",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["variety"] == "후지"
    assert data["area_pyeong"] == 1000.0
    assert data["area_m2"] == pytest.approx(3305.8, abs=0.1)
    assert data["total_trees"] > 0
    assert data["rows"] > 0
    assert data["trees_per_row"] > 0
    assert data["spacing"]["row"] == 5.0
    assert data["spacing"]["tree"] == 3.5
    assert len(data["tree_positions"]) == data["total_trees"]
    assert data["estimated_yield_kg"] > 0
    assert data["years_to_full_production"] > 0
    assert data["planting_density"] > 0


def test_design_with_custom_spacing(client):
    """사용자 지정 간격으로 설계."""
    res = client.post("/api/orchard/design", json={
        "area_pyeong": 500,
        "variety_id": "hongro",
        "spacing_row": 4.0,
        "spacing_tree": 2.5,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["spacing"]["row"] == 4.0
    assert data["spacing"]["tree"] == 2.5


def test_design_unknown_variety(client):
    """알 수 없는 품종은 기본값 사용."""
    res = client.post("/api/orchard/design", json={
        "area_pyeong": 300,
        "variety_id": "unknown_variety",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["spacing"]["row"] == 5.0
    assert data["spacing"]["tree"] == 3.0


def test_design_small_area(client):
    """소규모 면적(100평)."""
    res = client.post("/api/orchard/design", json={
        "area_pyeong": 100,
        "variety_id": "gala",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["total_trees"] >= 1
