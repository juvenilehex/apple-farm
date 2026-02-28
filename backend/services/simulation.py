from __future__ import annotations

from core.enums import CostCategory, AppleGrade, grade_tracker, cost_cat_tracker
from schemas.simulation import (
    SimulationRequest,
    SimulationResponse,
    GradeDistribution,
    CostBreakdown,
    YearlyProjection,
)
from services.orchard import compute_yield_per_10a

# ---------------------------------------------------------------------------
# Constants synced with frontend producer.ts
# ---------------------------------------------------------------------------

PYEONG_TO_M2 = 3.3058

# 농가 수취 비율 (경매가 대비): 수수료·운송·선별 비용 차감
FARM_GATE_RATIO = 0.82

# 품종별 시나리오 -- yield_per_10a(kg), price_per_kg(원=경매가), 등급비율
# ※ 등급비율은 전국 중앙값 기준 (상위 20% 농가는 특등급 비율 더 높음)
# ※ price_per_kg는 KAMIS 경매가 기준, 실제 농가 수취가 = × FARM_GATE_RATIO
SCENARIOS: dict[str, dict] = {
    "후지": {
        "yield_per_10a": 2500,
        "price_per_kg": 5500,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.15, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.35, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.35, "multiplier": 0.55},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.15, "multiplier": 0.25},
        ],
    },
    "홍로": {
        "yield_per_10a": 2200,
        "price_per_kg": 6000,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.12, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.33, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.35, "multiplier": 0.55},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.20, "multiplier": 0.25},
        ],
    },
    "감홍": {
        "yield_per_10a": 1800,
        "price_per_kg": 8000,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.10, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.30, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.35, "multiplier": 0.55},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.25, "multiplier": 0.25},
        ],
    },
    "아리수": {
        "yield_per_10a": 2300,
        "price_per_kg": 5000,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.15, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.35, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.35, "multiplier": 0.55},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.15, "multiplier": 0.25},
        ],
    },
    "시나노골드": {
        "yield_per_10a": 2000,
        "price_per_kg": 6500,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.12, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.33, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.35, "multiplier": 0.55},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.20, "multiplier": 0.25},
        ],
    },
    "루비에스": {
        "yield_per_10a": 2000,
        "price_per_kg": 7000,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.10, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.30, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.35, "multiplier": 0.55},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.25, "multiplier": 0.25},
        ],
    },
}

# 10a당 비용 항목 (producer.ts costItems 동기화)
COST_ITEMS: list[dict] = [
    {"category": CostCategory.MATERIALS, "name": "비료 (기비+추비)", "amount": 150_000},
    {"category": CostCategory.MATERIALS, "name": "퇴비", "amount": 200_000},
    {"category": CostCategory.MATERIALS, "name": "농약 (살균+살충)", "amount": 350_000},
    {"category": CostCategory.MATERIALS, "name": "봉지", "amount": 80_000},
    {"category": CostCategory.MATERIALS, "name": "반사필름·피복자재", "amount": 60_000},
    {"category": CostCategory.MATERIALS, "name": "포장재·상자", "amount": 120_000},
    {"category": CostCategory.LABOR, "name": "전정", "amount": 200_000},
    {"category": CostCategory.LABOR, "name": "적과", "amount": 300_000},
    {"category": CostCategory.LABOR, "name": "방제", "amount": 150_000},
    {"category": CostCategory.LABOR, "name": "수확", "amount": 250_000},
    {"category": CostCategory.LABOR, "name": "기타 (관수·시비·잡초)", "amount": 200_000},
    {"category": CostCategory.FIXED, "name": "토지 임차료", "amount": 300_000},
    {"category": CostCategory.FIXED, "name": "농기계 감가상각", "amount": 200_000},
    {"category": CostCategory.FIXED, "name": "지주·시설", "amount": 100_000},
    {"category": CostCategory.FIXED, "name": "유류·전기료", "amount": 120_000},
    {"category": CostCategory.FIXED, "name": "농작물재해보험", "amount": 80_000},
    # 숨은 비용 (기존 추정에서 누락되었던 항목)
    {"category": CostCategory.MATERIALS, "name": "전정 잔가지 처리", "amount": 40_000},
    {"category": CostCategory.FIXED, "name": "농기계 수리·정비", "amount": 100_000},
    {"category": CostCategory.FIXED, "name": "GAP인증·행정비용", "amount": 50_000},
]

# 품종 한글명 → ID 매핑 (orchard.py의 VARIETY_NAMES 역방향)
VARIETY_NAME_TO_ID: dict[str, str] = {
    "후지": "fuji",
    "홍로": "hongro",
    "감홍": "gamhong",
    "아리수": "arisu",
    "시나노골드": "shinano-gold",
    "루비에스": "ruby-s",
    "쓰가루": "tsugaru",
    "갈라": "gala",
    "썸머킹": "summer-king",
    "피크닉": "piknic",
}

# 연차별 수확 비율 (유목 -> 성목)
YIELD_CURVE: dict[int, float] = {
    1: 0.0,
    2: 0.0,
    3: 0.10,
    4: 0.30,
    5: 0.50,
    6: 0.70,
    7: 0.85,
    8: 0.95,
    9: 1.0,
    10: 1.0,
}


# ---------------------------------------------------------------------------
# 급지 → 시뮬레이션 보정 (Step 4: Grade → Simulation)
# ---------------------------------------------------------------------------

GRADE_MODIFIERS: dict[str, dict[str, float]] = {
    "S": {"yield_factor": 1.10, "premium_shift": 0.05},
    "A": {"yield_factor": 1.00, "premium_shift": 0.00},
    "B": {"yield_factor": 0.90, "premium_shift": -0.05},
    "C": {"yield_factor": 0.75, "premium_shift": -0.10},
}


def _apply_grade_adjustment(
    yield_per_10a: float,
    grade_list: list[dict],
    region_grade: str | None,
) -> tuple[float, list[dict], dict | None]:
    """급지 등급에 따라 수확량과 등급 비율을 조정한다.

    Returns:
        (adjusted_yield, adjusted_grades, grade_impact_info)
    """
    if not region_grade or region_grade not in GRADE_MODIFIERS:
        return yield_per_10a, grade_list, None

    mod = GRADE_MODIFIERS[region_grade]
    adjusted_yield = round(yield_per_10a * mod["yield_factor"])

    # 등급 비율 조정: 특등급 비율을 shift만큼 이동
    adjusted_grades = []
    shift = mod["premium_shift"]
    for g in grade_list:
        new_ratio = g["ratio"]
        if g["grade"] == AppleGrade.PREMIUM:
            new_ratio = max(0.02, min(0.40, g["ratio"] + shift))
        elif g["grade"] == AppleGrade.SUBSTANDARD:
            new_ratio = max(0.05, min(0.40, g["ratio"] - shift))
        adjusted_grades.append({**g, "ratio": round(new_ratio, 3)})

    # 비율 합계 정규화
    total_ratio = sum(g["ratio"] for g in adjusted_grades)
    if total_ratio > 0 and abs(total_ratio - 1.0) > 0.001:
        for g in adjusted_grades:
            g["ratio"] = round(g["ratio"] / total_ratio, 3)

    grade_impact = {
        "grade": region_grade,
        "yield_factor": mod["yield_factor"],
        "premium_shift": mod["premium_shift"],
        "yield_before": yield_per_10a,
        "yield_after": adjusted_yield,
    }

    return adjusted_yield, adjusted_grades, grade_impact


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def simulate(req: SimulationRequest) -> SimulationResponse:
    """수익 시뮬레이션을 계산한다.

    품종/면적/수확량/가격을 입력받아 등급별 매출, 비용 내역,
    연도별 추이(유목기 고려), 손익분기 연차를 산출한다.
    """
    scenario = SCENARIOS.get(req.variety, SCENARIOS["후지"])

    # Yield SSOT: orchard.compute_yield_per_10a 사용 (사용자 오버라이드 > SSOT > 시나리오 폴백)
    variety_id = VARIETY_NAME_TO_ID.get(req.variety, "fuji")
    rootstock_id = getattr(req, "rootstock_id", None)
    if req.yield_per_10a:
        yield_per_10a = req.yield_per_10a
    else:
        try:
            yield_per_10a = compute_yield_per_10a(variety_id, rootstock_id=rootstock_id)
        except Exception:
            yield_per_10a = scenario["yield_per_10a"]

    # 시세 우선순위: 사용자 입력 > KAMIS 실시간 > 시나리오 기본값
    if req.price_per_kg:
        price_per_kg = req.price_per_kg
        price_source = "user_input"
    else:
        from services.price_cache import get_price_cache
        live_price = get_price_cache().get_apple_price()
        if live_price is not None:
            price_per_kg = live_price
            price_source = "kamis_live"
        else:
            price_per_kg = scenario["price_per_kg"]
            price_source = "scenario_default"
    area_m2 = req.area_pyeong * PYEONG_TO_M2
    area_10a = area_m2 / 1000

    # 급지 보정 (Step 4): region_id → grade → 수확량·등급비율 조정
    region_id = getattr(req, "region_id", None)
    region_grade: str | None = None
    grade_impact: dict | None = None

    if region_id:
        from core.feature_flags import get_feature_flags
        if get_feature_flags().is_enabled("simulation_grade_adjustment"):
            try:
                from services.grading import get_orchard_grader
                grade_result = get_orchard_grader().grade_region(region_id)
                region_grade = grade_result.grade
                yield_per_10a, adjusted_scenario_grades, grade_impact = (
                    _apply_grade_adjustment(
                        yield_per_10a, scenario["grades"], region_grade,
                    )
                )
                if adjusted_scenario_grades:
                    scenario = {**scenario, "grades": adjusted_scenario_grades}
            except Exception:
                pass  # 급지 조회 실패 시 기본값 유지

    # 등급별 분포
    grades = []
    for g in scenario["grades"]:
        # L4=5: 등급 사용 기록
        grade_tracker.record(g["grade"])
        grades.append(GradeDistribution(
            grade=g["grade"],
            ratio=g["ratio"],
            price_multiplier=g["multiplier"],
        ))

    # 연간 매출 (성목 기준, 농가 수취가 적용)
    total_yield = yield_per_10a * area_10a
    weighted_price = sum(
        g["ratio"] * g["multiplier"] * price_per_kg
        for g in scenario["grades"]
    ) * FARM_GATE_RATIO  # 경매가 → 농가 수취가
    annual_revenue = int(total_yield * weighted_price)

    # 연간 비용
    cost_breakdown = []
    for c in COST_ITEMS:
        # L4=5: 비용 분류 사용 기록
        cost_cat_tracker.record(c["category"])
        cost_breakdown.append(CostBreakdown(
            category=c["category"],
            name=c["name"],
            amount=int(c["amount"] * area_10a),
        ))
    annual_cost = int(sum(c["amount"] for c in COST_ITEMS) * area_10a)
    annual_profit = annual_revenue - annual_cost
    income_ratio = annual_profit / annual_revenue if annual_revenue > 0 else 0

    # 나무 수 추정 (간격 5m x 3m 기준, 유효면적 85%)
    total_trees = req.total_trees or int(area_m2 * 0.85 / (5.0 * 3.0))

    # 대목별 묘목비 + 인프라비 (원/그루, 원/10a)
    ROOTSTOCK_COSTS: dict[str, dict[str, int]] = {
        "M9":      {"seedling": 25_000, "infra_per_10a": 2_000_000},
        "M26":     {"seedling": 15_000, "infra_per_10a": 1_200_000},
        "MM106":   {"seedling": 12_000, "infra_per_10a":   800_000},
        "seedling": {"seedling": 8_000, "infra_per_10a":   500_000},
    }
    rs_cost = ROOTSTOCK_COSTS.get(rootstock_id or "", ROOTSTOCK_COSTS["M26"])
    initial_investment = int(
        total_trees * rs_cost["seedling"] + area_10a * rs_cost["infra_per_10a"]
    )
    investment_breakdown = {
        "seedling_cost": int(total_trees * rs_cost["seedling"]),
        "infra_cost": int(area_10a * rs_cost["infra_per_10a"]),
        "seedling_unit": rs_cost["seedling"],
        "rootstock_used": rootstock_id or "M26",
    }

    # 연도별 추이
    projections: list[YearlyProjection] = []
    cumulative_profit = -initial_investment
    break_even_year = req.projection_years  # default: never within period

    for year in range(1, req.projection_years + 1):
        ratio = YIELD_CURVE.get(year, 1.0)
        year_yield = total_yield * ratio
        year_revenue = int(year_yield * weighted_price)

        # 유목기에도 비용 대부분 발생 (토지·농약·관리는 동일)
        # 수확량 0%일 때도 70%, 성목 100%일 때 100%
        cost_ratio = 0.70 + 0.30 * min(ratio, 1.0)
        year_cost = int(annual_cost * cost_ratio)
        year_profit = year_revenue - year_cost
        cumulative_profit += year_profit

        projections.append(
            YearlyProjection(
                year=year,
                yield_ratio=ratio,
                yield_kg=round(year_yield, 0),
                revenue=year_revenue,
                cost=year_cost,
                profit=year_profit,
            )
        )

        if cumulative_profit >= 0 and break_even_year == req.projection_years:
            break_even_year = year

    roi_10year = cumulative_profit / initial_investment if initial_investment > 0 else 0

    return SimulationResponse(
        variety=req.variety,
        area_pyeong=req.area_pyeong,
        area_10a=round(area_10a, 2),
        total_trees=total_trees,
        yield_per_10a=yield_per_10a,
        price_per_kg=price_per_kg,
        grade_distribution=grades,
        annual_revenue=annual_revenue,
        annual_cost=annual_cost,
        annual_profit=annual_profit,
        income_ratio=round(income_ratio, 3),
        cost_breakdown=cost_breakdown,
        yearly_projections=projections,
        break_even_year=break_even_year,
        roi_10year=round(roi_10year, 2),
        # Step 2: 시세 출처
        price_source=price_source,
        # Step 3: 설계 컨텍스트
        rootstock_id=rootstock_id,
        initial_investment=initial_investment,
        investment_breakdown=investment_breakdown,
        # Step 4: 급지 연동
        region_grade=region_grade,
        grade_impact=grade_impact,
    )


# ---------------------------------------------------------------------------
# 다중 시나리오 비교 (워크플로우 렌즈 L4)
# ---------------------------------------------------------------------------

# 시나리오별 보정 계수
_SCENARIO_MODIFIERS = {
    "optimistic":  {"yield": 1.15, "price": 1.20, "label": "낙관"},
    "neutral":     {"yield": 1.00, "price": 1.00, "label": "중립"},
    "pessimistic": {"yield": 0.80, "price": 0.75, "label": "비관"},
}


def compare_scenarios(
    variety: str,
    area_pyeong: float,
    projection_years: int = 10,
) -> dict:
    """낙관/중립/비관 3시나리오 비교.

    각 시나리오별로 수확량·가격을 보정하여 시뮬레이션을 돌리고,
    결과를 요약·비교하여 종합 추천을 생성한다.
    """
    from schemas.simulation import CompareResponse, ScenarioResult

    scenario_data = SCENARIOS.get(variety, SCENARIOS["후지"])
    base_yield = scenario_data["yield_per_10a"]
    base_price = scenario_data["price_per_kg"]

    results: list[ScenarioResult] = []

    for key, mod in _SCENARIO_MODIFIERS.items():
        req = SimulationRequest(
            variety=variety,
            area_pyeong=area_pyeong,
            yield_per_10a=base_yield * mod["yield"],
            price_per_kg=base_price * mod["price"],
            projection_years=projection_years,
        )
        res = simulate(req)
        total_10y = sum(p.profit for p in res.yearly_projections)

        results.append(ScenarioResult(
            scenario=key,
            label=mod["label"],
            yield_per_10a=res.yield_per_10a,
            price_per_kg=res.price_per_kg,
            annual_revenue=res.annual_revenue,
            annual_cost=res.annual_cost,
            annual_profit=res.annual_profit,
            income_ratio=res.income_ratio,
            break_even_year=res.break_even_year,
            roi_10year=res.roi_10year,
            total_10year_profit=total_10y,
        ))

    # 종합 추천 메시지 생성
    neutral = results[1]
    pessimistic = results[2]
    recommendation = _build_recommendation(variety, neutral, pessimistic)

    return CompareResponse(
        variety=variety,
        area_pyeong=area_pyeong,
        scenarios=results,
        recommendation=recommendation,
    )


def _build_recommendation(variety: str, neutral: "ScenarioResult",
                          pessimistic: "ScenarioResult") -> str:
    """시나리오 비교 결과로 종합 추천 메시지를 생성한다."""
    parts = []

    if pessimistic.annual_profit > 0:
        parts.append(f"{variety}은(는) 비관적 시나리오에서도 흑자가 예상됩니다. 안정적인 선택입니다.")
    elif neutral.annual_profit > 0:
        parts.append(f"{variety}은(는) 중립 시나리오에서 흑자이나, 시장 하락 시 적자 가능성이 있습니다.")
    else:
        parts.append(f"{variety}은(는) 중립 시나리오에서도 적자가 예상됩니다. 신중한 검토가 필요합니다.")

    if neutral.break_even_year <= 5:
        parts.append(f"손익분기까지 약 {neutral.break_even_year}년으로 빠른 편입니다.")
    elif neutral.break_even_year <= 8:
        parts.append(f"손익분기까지 약 {neutral.break_even_year}년이 소요될 수 있습니다.")
    else:
        parts.append(f"손익분기까지 {neutral.break_even_year}년 이상 걸릴 수 있어 장기적 관점이 필요합니다.")

    return " ".join(parts)
