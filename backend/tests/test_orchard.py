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


def test_design_with_rootstock(client):
    """대목 지정 시 간격이 대목 추천값으로 변경."""
    res = client.post("/api/orchard/design", json={
        "area_pyeong": 1000,
        "variety_id": "fuji",
        "rootstock_id": "M9",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["rootstock_id"] == "M9"
    assert data["rootstock_name"] is not None
    assert data["spacing"]["row"] == 3.75
    assert data["spacing"]["tree"] == 1.75
    # M9 밀식은 같은 면적에 더 많은 나무
    assert data["total_trees"] > 100


def test_design_with_machine(client):
    """장비 지정 시 최소 통행폭 보장."""
    res = client.post("/api/orchard/design", json={
        "area_pyeong": 1000,
        "variety_id": "fuji",
        "rootstock_id": "M9",
        "machine_id": "tractor-mid",
    })
    assert res.status_code == 200
    data = res.json()
    # M9 열간 3.75m < 중형트랙터 3.2m → 3.75 유지 (이미 충분)
    assert data["spacing"]["row"] >= 3.2
    assert data["machine_id"] == "tractor-mid"


def test_design_with_setback(client):
    """이격 적용 시 유효 면적 감소."""
    res_no = client.post("/api/orchard/design", json={
        "area_pyeong": 1000,
        "variety_id": "fuji",
    })
    res_yes = client.post("/api/orchard/design", json={
        "area_pyeong": 1000,
        "variety_id": "fuji",
        "setback_enabled": True,
        "setback_distance": 1.5,
    })
    data_no = res_no.json()
    data_yes = res_yes.json()
    assert data_yes["setback_applied"] is True
    assert data_yes["effective_area_m2"] < data_no["area_m2"]
    assert data_yes["total_trees"] <= data_no["total_trees"]
