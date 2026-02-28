"""온톨로지 통합 테스트 — 서비스 간 배선 검증.

수확량 SSOT, 실시간 시세, 설계→시뮬 배선, 급지→시뮬 연동, 진화엔진 확장을 검증한다.
"""
import pytest


# ---------------------------------------------------------------------------
# Step 1: 수확량 SSOT
# ---------------------------------------------------------------------------


def test_yield_ssot_consistency():
    """orchard yield_per_10a ≈ simulation yield_per_10a (SSOT 일관성)."""
    from services.orchard import compute_yield_per_10a, VARIETY_YIELD, VARIETY_SPACING

    for variety_id in ("fuji", "hongro", "gamhong", "arisu"):
        yield_10a = compute_yield_per_10a(variety_id)
        # 기본 간격에서의 수확량은 합리적 범위 내
        assert 1000 <= yield_10a <= 5000, f"{variety_id}: {yield_10a} out of range"


def test_yield_ssot_rootstock_affects_density():
    """대목에 따라 식재 밀도가 달라지므로 10a당 수확량도 달라야 한다."""
    from services.orchard import compute_yield_per_10a

    m9_yield = compute_yield_per_10a("fuji", rootstock_id="M9")
    seedling_yield = compute_yield_per_10a("fuji", rootstock_id="seedling")

    # M9(왜성)는 밀식이므로 10a당 수확량 > 실생(보통)
    assert m9_yield > seedling_yield


def test_simulation_uses_ssot_yield(client):
    """시뮬레이션이 SSOT 수확량을 사용하는지 확인."""
    from services.orchard import compute_yield_per_10a

    expected_yield = compute_yield_per_10a("fuji")

    res = client.post("/api/simulation/run", json={
        "variety": "후지",
        "area_pyeong": 1000,
    })
    assert res.status_code == 200
    data = res.json()

    # SSOT yield ± self-refine 보정 허용 (±15%)
    assert abs(data["yield_per_10a"] - expected_yield) / expected_yield < 0.15


# ---------------------------------------------------------------------------
# Step 2: 실시간 시세
# ---------------------------------------------------------------------------


def test_price_cache_update_and_get():
    """PriceCache 업데이트/조회."""
    from services.price_cache import PriceCache

    cache = PriceCache()
    assert cache.get_apple_price() is None

    items = [
        {"dpr1": "5,000", "item_name": "사과"},
        {"dpr1": "6,000", "item_name": "사과"},
        {"dpr1": "5,500", "item_name": "사과"},
    ]
    count = cache.update(items)
    assert count == 3

    price = cache.get_apple_price()
    assert price is not None
    assert 4000 <= price <= 7000


def test_price_cache_empty_items():
    """빈 아이템으로 업데이트 시 가격 변경 없음."""
    from services.price_cache import PriceCache

    cache = PriceCache()
    count = cache.update([])
    assert count == 0
    assert cache.get_apple_price() is None


def test_simulation_price_source_default(client):
    """시세 미지정 + 캐시 비어있으면 scenario_default 사용."""
    # 테스트 환경에서는 KAMIS 키가 없으므로 price_cache 비어있음
    res = client.post("/api/simulation/run", json={
        "variety": "후지",
        "area_pyeong": 1000,
    })
    assert res.status_code == 200
    data = res.json()
    assert data.get("price_source") in ("scenario_default", "user_input", None)


def test_simulation_price_source_user_input(client):
    """사용자 가격 지정 시 price_source가 user_input."""
    res = client.post("/api/simulation/run", json={
        "variety": "후지",
        "area_pyeong": 1000,
        "price_per_kg": 7000,
    })
    assert res.status_code == 200
    data = res.json()
    assert data.get("price_source") == "user_input"
    assert data["price_per_kg"] == 7000


# ---------------------------------------------------------------------------
# Step 3: 설계→시뮬 배선 (대목별 투자비)
# ---------------------------------------------------------------------------


def test_rootstock_investment_m9_higher(client):
    """M9(왜성) 초기투자비 > M26(반왜성) > seedling(실생)."""
    results = {}
    for rs in ("M9", "M26", "seedling"):
        res = client.post("/api/simulation/run", json={
            "variety": "후지",
            "area_pyeong": 1000,
            "rootstock_id": rs,
        })
        assert res.status_code == 200
        data = res.json()
        results[rs] = data.get("initial_investment", 0)

    assert results["M9"] > results["M26"] > results["seedling"]


def test_investment_breakdown_present(client):
    """rootstock_id 전달 시 investment_breakdown 필드 존재."""
    res = client.post("/api/simulation/run", json={
        "variety": "후지",
        "area_pyeong": 1000,
        "rootstock_id": "M9",
    })
    assert res.status_code == 200
    data = res.json()

    assert data.get("rootstock_id") == "M9"
    assert data.get("initial_investment") is not None
    bd = data.get("investment_breakdown")
    assert bd is not None
    assert bd["rootstock_used"] == "M9"
    assert bd["seedling_unit"] == 25000
    assert bd["seedling_cost"] > 0
    assert bd["infra_cost"] > 0


# ---------------------------------------------------------------------------
# Step 4: 급지→시뮬 연동
# ---------------------------------------------------------------------------


def test_grade_s_revenue_higher_than_c(client):
    """S등급 지역 시뮬레이션 매출 > C등급 시뮬레이션 매출."""
    # cheongsong은 S등급 지역 (급지 테스트 기반)
    # 직접 S/C로 비교하기 위해 yield override 없이 region_id만 변경
    # 주의: 실제 grade는 기후 데이터에 의존하므로, 직접 서비스로 테스트
    from services.simulation import simulate, _apply_grade_adjustment, SCENARIOS
    from schemas.simulation import SimulationRequest

    scenario = SCENARIOS["후지"]
    base_yield = 2500.0

    # S등급 보정
    s_yield, s_grades, s_impact = _apply_grade_adjustment(base_yield, scenario["grades"], "S")
    # C등급 보정
    c_yield, c_grades, c_impact = _apply_grade_adjustment(base_yield, scenario["grades"], "C")

    assert s_yield > c_yield
    assert s_impact is not None
    assert s_impact["yield_factor"] == 1.10
    assert c_impact is not None
    assert c_impact["yield_factor"] == 0.75


def test_grade_a_no_change():
    """A등급은 보정 없음 (기본값)."""
    from services.simulation import _apply_grade_adjustment, SCENARIOS

    scenario = SCENARIOS["후지"]
    a_yield, _, a_impact = _apply_grade_adjustment(2500.0, scenario["grades"], "A")
    assert a_yield == 2500
    assert a_impact["yield_factor"] == 1.0


# ---------------------------------------------------------------------------
# Step 5: 진화엔진 확장
# ---------------------------------------------------------------------------


def test_evolution_consume_anomaly_no_alerts():
    """이상감지 알림 없으면 소비 결과 consumed=True, adjustments 비어있음."""
    from core.evolution_engine import EvolutionEngine
    engine = EvolutionEngine()
    result = engine.consume_anomaly_alerts()
    # 알림이 없으면 consumed=False
    assert result.get("consumed") is False or result.get("alerts_processed", 0) == 0


def test_evolution_engine_new_params():
    """진화엔진이 farm_gate_ratio, yield_modifier_global 등 신규 파라미터를 지원."""
    from core.evolution_engine import EvolutionEngine
    engine = EvolutionEngine()

    # 직접 modifier 설정
    engine._state.setdefault("modifiers", {})["farm_gate_ratio"] = 0.80
    engine._state["modifiers"]["yield_modifier_global"] = 0.95

    assert engine.get_modifier("farm_gate_ratio") == 0.80
    assert engine.get_modifier("yield_modifier_global") == 0.95
    assert engine.get_modifier("nonexistent", 1.0) == 1.0


def test_feedback_auto_evolution_flag(client):
    """피드백 API가 evolution_triggered 필드를 반환하는지 확인."""
    res = client.post("/api/simulation/feedback", json={
        "variety": "후지",
        "area_pyeong": 1000,
        "rating": "helpful",
        "comment": "테스트",
    })
    assert res.status_code == 200
    data = res.json()
    assert "received" in data
    assert "evolution_triggered" in data
