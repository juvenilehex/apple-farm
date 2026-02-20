from __future__ import annotations

import math

from schemas.orchard import (
    OrchardDesignRequest,
    OrchardDesignResponse,
    Spacing,
    TreePosition,
)

# ---------------------------------------------------------------------------
# Constants synced with frontend varieties.ts
# ---------------------------------------------------------------------------

# 품종별 기본 간격 (m) - row: 열간, tree: 주간
VARIETY_SPACING: dict[str, Spacing] = {
    "tsugaru": Spacing(row=5.0, tree=3.0),
    "summer-king": Spacing(row=5.0, tree=3.0),
    "gala": Spacing(row=5.0, tree=3.0),
    "hongro": Spacing(row=5.0, tree=3.0),
    "gamhong": Spacing(row=5.0, tree=3.5),
    "fuji": Spacing(row=5.0, tree=3.5),
    "arisu": Spacing(row=5.0, tree=3.0),
    "shinano-gold": Spacing(row=5.0, tree=3.5),
    "ruby-s": Spacing(row=4.5, tree=3.0),
    "piknic": Spacing(row=5.0, tree=3.0),
    "default": Spacing(row=5.0, tree=3.0),
}

VARIETY_NAMES: dict[str, str] = {
    "tsugaru": "쓰가루",
    "summer-king": "썸머킹",
    "gala": "갈라",
    "hongro": "홍로",
    "gamhong": "감홍",
    "fuji": "후지",
    "arisu": "아리수",
    "shinano-gold": "시나노골드",
    "ruby-s": "루비에스",
    "piknic": "피크닉",
}

# 품종별 주당 수확량(kg)과 결실연수
VARIETY_YIELD: dict[str, dict[str, int]] = {
    "tsugaru": {"yield_per_tree": 35, "years_to_fruit": 3},
    "hongro": {"yield_per_tree": 30, "years_to_fruit": 3},
    "gamhong": {"yield_per_tree": 25, "years_to_fruit": 4},
    "fuji": {"yield_per_tree": 40, "years_to_fruit": 4},
    "arisu": {"yield_per_tree": 35, "years_to_fruit": 3},
    "shinano-gold": {"yield_per_tree": 30, "years_to_fruit": 4},
    "ruby-s": {"yield_per_tree": 30, "years_to_fruit": 3},
    "default": {"yield_per_tree": 30, "years_to_fruit": 4},
}

PYEONG_TO_M2 = 3.3058


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def design_orchard(req: OrchardDesignRequest) -> OrchardDesignResponse:
    """밭 면적과 품종으로 최적 과수원 설계를 계산한다.

    직사각형(가로:세로 = 2:1) 가정, 통로/여유공간 15% 제외 후
    열간(row) x 주간(tree) 격자 배치.
    """
    area_m2 = req.area_pyeong * PYEONG_TO_M2

    # 간격 결정: 사용자 오버라이드 > 품종 기본값
    default_sp = VARIETY_SPACING.get(req.variety_id, VARIETY_SPACING["default"])
    spacing = Spacing(
        row=req.spacing_row or default_sp.row,
        tree=req.spacing_tree or default_sp.tree,
    )

    # 유효 면적 (통로/여유공간 15% 제외)
    effective_area = area_m2 * 0.85

    # 직사각형 가정 -- 가로:세로 = 2:1
    width = math.sqrt(effective_area * 2)
    height = effective_area / width

    rows = max(1, int(height / spacing.row))
    trees_per_row = max(1, int(width / spacing.tree))
    total_trees = rows * trees_per_row

    # 나무 위치 생성 (m 단위, 원점 기준)
    positions: list[TreePosition] = []
    for r in range(rows):
        for c in range(trees_per_row):
            positions.append(
                TreePosition(
                    row=r,
                    col=c,
                    x=round(c * spacing.tree + spacing.tree / 2, 1),
                    y=round(r * spacing.row + spacing.row / 2, 1),
                )
            )

    # 수확량 추정
    variety_info = VARIETY_YIELD.get(req.variety_id, VARIETY_YIELD["default"])
    estimated_yield = total_trees * variety_info["yield_per_tree"]

    # 10a당 식재밀도
    area_10a = area_m2 / 1000
    density = total_trees / area_10a if area_10a > 0 else 0

    # 성목 도달 연차 = 결실연수 + 3 (안정 생산까지)
    years_to_full = variety_info["years_to_fruit"] + 3

    return OrchardDesignResponse(
        area_pyeong=req.area_pyeong,
        area_m2=round(area_m2, 1),
        variety=VARIETY_NAMES.get(req.variety_id, req.variety_id),
        spacing=spacing,
        total_trees=total_trees,
        rows=rows,
        trees_per_row=trees_per_row,
        tree_positions=positions,
        planting_density=round(density, 1),
        estimated_yield_kg=round(estimated_yield, 0),
        years_to_full_production=years_to_full,
    )
