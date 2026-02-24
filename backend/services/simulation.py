from __future__ import annotations

from core.enums import CostCategory, AppleGrade, grade_tracker, cost_cat_tracker
from schemas.simulation import (
    SimulationRequest,
    SimulationResponse,
    GradeDistribution,
    CostBreakdown,
    YearlyProjection,
)

# ---------------------------------------------------------------------------
# Constants synced with frontend producer.ts
# ---------------------------------------------------------------------------

PYEONG_TO_M2 = 3.3058

# 품종별 시나리오 -- yield_per_10a(kg), price_per_kg(원), 등급비율
SCENARIOS: dict[str, dict] = {
    "후지": {
        "yield_per_10a": 2500,
        "price_per_kg": 5500,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.30, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.40, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.20, "multiplier": 0.6},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.10, "multiplier": 0.3},
        ],
    },
    "홍로": {
        "yield_per_10a": 2200,
        "price_per_kg": 6000,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.25, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.40, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.25, "multiplier": 0.6},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.10, "multiplier": 0.3},
        ],
    },
    "감홍": {
        "yield_per_10a": 1800,
        "price_per_kg": 8000,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.20, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.35, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.30, "multiplier": 0.6},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.15, "multiplier": 0.3},
        ],
    },
    "아리수": {
        "yield_per_10a": 2300,
        "price_per_kg": 5000,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.30, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.40, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.20, "multiplier": 0.6},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.10, "multiplier": 0.3},
        ],
    },
    "시나노골드": {
        "yield_per_10a": 2000,
        "price_per_kg": 6500,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.25, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.40, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.25, "multiplier": 0.6},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.10, "multiplier": 0.3},
        ],
    },
    "루비에스": {
        "yield_per_10a": 2000,
        "price_per_kg": 7000,
        "grades": [
            {"grade": AppleGrade.PREMIUM, "ratio": 0.25, "multiplier": 1.0},
            {"grade": AppleGrade.EXCELLENT, "ratio": 0.35, "multiplier": 0.8},
            {"grade": AppleGrade.STANDARD, "ratio": 0.25, "multiplier": 0.6},
            {"grade": AppleGrade.SUBSTANDARD, "ratio": 0.15, "multiplier": 0.3},
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
]

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
# Public API
# ---------------------------------------------------------------------------


def simulate(req: SimulationRequest) -> SimulationResponse:
    """수익 시뮬레이션을 계산한다.

    품종/면적/수확량/가격을 입력받아 등급별 매출, 비용 내역,
    연도별 추이(유목기 고려), 손익분기 연차를 산출한다.
    """
    scenario = SCENARIOS.get(req.variety, SCENARIOS["후지"])

    yield_per_10a = req.yield_per_10a or scenario["yield_per_10a"]
    price_per_kg = req.price_per_kg or scenario["price_per_kg"]
    area_m2 = req.area_pyeong * PYEONG_TO_M2
    area_10a = area_m2 / 1000

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

    # 연간 매출 (성목 기준)
    total_yield = yield_per_10a * area_10a
    weighted_price = sum(
        g["ratio"] * g["multiplier"] * price_per_kg
        for g in scenario["grades"]
    )
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

    # 초기 투자비 (묘목 + 지주 + 관수시설)
    initial_investment = int(total_trees * 15_000 + area_10a * 500_000)

    # 연도별 추이
    projections: list[YearlyProjection] = []
    cumulative_profit = -initial_investment
    break_even_year = req.projection_years  # default: never within period

    for year in range(1, req.projection_years + 1):
        ratio = YIELD_CURVE.get(year, 1.0)
        year_yield = total_yield * ratio
        year_revenue = int(year_yield * weighted_price)

        # 유목기에는 비용도 낮음 (노동비 절감)
        cost_ratio = 0.5 + 0.5 * min(ratio + 0.3, 1.0)
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
