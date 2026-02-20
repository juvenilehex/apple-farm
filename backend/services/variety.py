from __future__ import annotations

from schemas.variety import (
    RecommendRequest,
    RecommendResponse,
    RecommendScore,
    VarietyBrief,
)

# ---------------------------------------------------------------------------
# Constants synced with frontend varieties.ts
# ---------------------------------------------------------------------------

# 품종 데이터 (varieties.ts 핵심 필드)
VARIETIES: list[dict] = [
    {
        "id": "fuji", "name": "후지", "name_en": "Fuji", "category": "late",
        "harvest_period": "10월 하순~11월 상순", "sweetness": 15,
        "market_value": 5, "popularity": 5,
        "disease_resistance": 2, "cold_hardiness": 4,
        "storability": 5, "yield_score": 5,
    },
    {
        "id": "hongro", "name": "홍로", "name_en": "Hongro", "category": "mid",
        "harvest_period": "9월 중순~9월 하순", "sweetness": 14,
        "market_value": 4, "popularity": 4,
        "disease_resistance": 3, "cold_hardiness": 4,
        "storability": 3, "yield_score": 4,
    },
    {
        "id": "gamhong", "name": "감홍", "name_en": "Gamhong", "category": "late",
        "harvest_period": "10월 중순~10월 하순", "sweetness": 16,
        "market_value": 5, "popularity": 3,
        "disease_resistance": 2, "cold_hardiness": 3,
        "storability": 4, "yield_score": 3,
    },
    {
        "id": "arisu", "name": "아리수", "name_en": "Arisu", "category": "mid",
        "harvest_period": "9월 하순~10월 상순", "sweetness": 14,
        "market_value": 3, "popularity": 3,
        "disease_resistance": 4, "cold_hardiness": 4,
        "storability": 3, "yield_score": 4,
    },
    {
        "id": "shinano-gold", "name": "시나노골드", "name_en": "Shinano Gold",
        "category": "late",
        "harvest_period": "10월 중순~10월 하순", "sweetness": 15,
        "market_value": 4, "popularity": 3,
        "disease_resistance": 3, "cold_hardiness": 3,
        "storability": 4, "yield_score": 3,
    },
    {
        "id": "ruby-s", "name": "루비에스", "name_en": "Ruby S", "category": "mid",
        "harvest_period": "9월 중순~9월 하순", "sweetness": 14.5,
        "market_value": 4, "popularity": 2,
        "disease_resistance": 3, "cold_hardiness": 3,
        "storability": 3, "yield_score": 3,
    },
    {
        "id": "tsugaru", "name": "쓰가루 (아오리)", "name_en": "Tsugaru",
        "category": "early",
        "harvest_period": "8월 하순~9월 상순", "sweetness": 13,
        "market_value": 3, "popularity": 4,
        "disease_resistance": 2, "cold_hardiness": 3,
        "storability": 2, "yield_score": 4,
    },
    {
        "id": "gala", "name": "갈라", "name_en": "Gala", "category": "early",
        "harvest_period": "8월 하순~9월 상순", "sweetness": 14,
        "market_value": 3, "popularity": 3,
        "disease_resistance": 3, "cold_hardiness": 3,
        "storability": 2, "yield_score": 4,
    },
]

# 지역별 적합 품종 가중치
REGION_VARIETY_FIT: dict[str, dict[str, float]] = {
    "cheongsong": {"fuji": 1.2, "gamhong": 1.1, "hongro": 1.0},
    "andong": {"fuji": 1.1, "hongro": 1.1, "arisu": 1.0},
    "yeongju": {"fuji": 1.2, "hongro": 1.0, "gamhong": 1.1},
    "chungju": {"fuji": 1.1, "hongro": 1.0, "arisu": 1.1},
    "geochang": {"fuji": 1.2, "gamhong": 1.1},
    "yesan": {"fuji": 1.0, "hongro": 1.1, "arisu": 1.1},
}

# 우선순위별 가중치
PRIORITY_WEIGHTS: dict[str, dict[str, float]] = {
    "balanced": {
        "market_value": 0.25, "yield_score": 0.25,
        "disease_resistance": 0.20, "storability": 0.15, "popularity": 0.15,
    },
    "profit": {
        "market_value": 0.40, "yield_score": 0.30,
        "storability": 0.20, "popularity": 0.10, "disease_resistance": 0.0,
    },
    "easy": {
        "disease_resistance": 0.35, "cold_hardiness": 0.25,
        "yield_score": 0.20, "market_value": 0.10, "storability": 0.10,
    },
    "storage": {
        "storability": 0.40, "market_value": 0.25,
        "yield_score": 0.20, "disease_resistance": 0.15, "popularity": 0.0,
    },
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def recommend(req: RecommendRequest) -> RecommendResponse:
    """품종 추천 점수를 계산한다.

    우선순위(balanced/profit/easy/storage)에 따라 가중치를 적용하고,
    지역 적합도 보정 후 상위 N개 품종을 반환한다.
    """
    weights = PRIORITY_WEIGHTS.get(req.priority, PRIORITY_WEIGHTS["balanced"])
    region_fit = REGION_VARIETY_FIT.get(req.region_id or "", {})

    scored: list[RecommendScore] = []
    for v in VARIETIES:
        # 기본 점수 계산
        score = sum(v.get(attr, 3) * weight for attr, weight in weights.items())

        # 지역 적합도 보정
        region_bonus = region_fit.get(v["id"], 1.0)
        score *= region_bonus

        # 사유 생성
        reasons = _generate_reasons(v, weights, region_fit.get(v["id"]))

        scored.append(
            RecommendScore(
                variety=VarietyBrief(
                    id=v["id"],
                    name=v["name"],
                    name_en=v["name_en"],
                    category=v["category"],
                    harvest_period=v["harvest_period"],
                    sweetness=v["sweetness"],
                    market_value=v["market_value"],
                    popularity=v["popularity"],
                ),
                score=round(score, 2),
                reasons=reasons,
            )
        )

    scored.sort(key=lambda x: x.score, reverse=True)
    return RecommendResponse(
        region=req.region_id,
        priority=req.priority,
        recommendations=scored[: req.max_results],
    )


def _generate_reasons(
    v: dict,
    weights: dict[str, float],
    region_bonus: float | None,
) -> list[str]:
    """점수 근거 사유를 생성한다."""
    reasons: list[str] = []

    if v.get("market_value", 0) >= 4 and weights.get("market_value", 0) > 0.2:
        reasons.append("시장가치 높음")
    if v.get("disease_resistance", 0) >= 4:
        reasons.append("병해충 저항성 우수")
    if v.get("storability", 0) >= 4:
        reasons.append("저장성 우수")
    if v.get("yield_score", 0) >= 4:
        reasons.append("수확량 많음")
    if region_bonus and region_bonus > 1.0:
        reasons.append("해당 지역 적합 품종")
    if v.get("sweetness", 0) >= 15:
        reasons.append(f"높은 당도 ({v['sweetness']}Brix)")
    if not reasons:
        reasons.append("균형잡힌 특성")

    return reasons
