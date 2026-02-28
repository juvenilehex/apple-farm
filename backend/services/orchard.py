from __future__ import annotations

import math

from schemas.orchard import (
    OrchardDesignRequest,
    OrchardDesignResponse,
    Spacing,
    TreePosition,
)

# ---------------------------------------------------------------------------
# Constants synced with frontend varieties.ts & orchard-specs.ts
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

# 대목별 추천 간격 (m) — orchard-specs.ts와 동기화
ROOTSTOCK_SPACING: dict[str, Spacing] = {
    "M9": Spacing(row=3.75, tree=1.75),
    "M26": Spacing(row=4.75, tree=3.0),
    "MM106": Spacing(row=5.5, tree=3.5),
    "seedling": Spacing(row=7.0, tree=5.0),
}

ROOTSTOCK_NAMES: dict[str, str] = {
    "M9": "M9 (T337) 왜성",
    "M26": "M26 반왜성",
    "MM106": "MM106 준강세",
    "seedling": "실생 (보통)",
}

# 장비별 최소 통행폭 (m) — orchard-specs.ts와 동기화
MACHINE_MIN_PASS_WIDTH: dict[str, float] = {
    "ss": 3.0,
    "tractor-small": 2.5,
    "tractor-mid": 3.2,
    "cultivator": 2.0,
}

PYEONG_TO_M2 = 3.3058


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def design_orchard(req: OrchardDesignRequest) -> OrchardDesignResponse:
    """밭 면적과 품종으로 최적 과수원 설계를 계산한다.

    간격 결정 우선순위: 사용자 오버라이드 > 대목 추천값 > 품종 기본값
    장비 최소폭 보장, setback(이격) 적용.
    """
    area_m2 = req.area_pyeong * PYEONG_TO_M2

    # ── 1) 간격 결정: 오버라이드 > 대목 > 품종 기본값 ──
    base_sp = VARIETY_SPACING.get(req.variety_id, VARIETY_SPACING["default"])
    if req.rootstock_id and req.rootstock_id in ROOTSTOCK_SPACING:
        base_sp = ROOTSTOCK_SPACING[req.rootstock_id]

    row_spacing = req.spacing_row or base_sp.row
    tree_spacing = req.spacing_tree or base_sp.tree

    # ── 2) 장비 최소 통행폭 보장 ──
    if req.machine_id and req.machine_id in MACHINE_MIN_PASS_WIDTH:
        min_width = MACHINE_MIN_PASS_WIDTH[req.machine_id]
        if row_spacing < min_width:
            row_spacing = min_width

    spacing = Spacing(row=round(row_spacing, 2), tree=round(tree_spacing, 2))

    # ── 3) 유효 면적 (통로 15% + setback 제외) ──
    effective_area = area_m2 * 0.85
    setback_applied = False
    if req.setback_enabled and req.setback_distance > 0:
        # 사각형 가정: 둘레에서 setback만큼 줄임
        side = math.sqrt(effective_area)
        reduced_side = max(1.0, side - 2 * req.setback_distance)
        effective_area = reduced_side * reduced_side
        setback_applied = True

    # ── 4) 직사각형 배치 (가로:세로 = 2:1) ──
    width = math.sqrt(effective_area * 2)
    height = effective_area / width

    rows = max(1, int(height / spacing.row))
    trees_per_row = max(1, int(width / spacing.tree))
    total_trees = rows * trees_per_row

    # ── 5) 나무 위치 생성 ──
    positions: list[TreePosition] = []
    offset_x = req.setback_distance if setback_applied else 0
    offset_y = req.setback_distance if setback_applied else 0
    for r in range(rows):
        for c in range(trees_per_row):
            positions.append(
                TreePosition(
                    row=r,
                    col=c,
                    x=round(offset_x + c * spacing.tree + spacing.tree / 2, 1),
                    y=round(offset_y + r * spacing.row + spacing.row / 2, 1),
                )
            )

    # ── 6) 수확량·밀도 계산 ──
    variety_info = VARIETY_YIELD.get(req.variety_id, VARIETY_YIELD["default"])
    estimated_yield = total_trees * variety_info["yield_per_tree"]
    area_10a = area_m2 / 1000
    density = total_trees / area_10a if area_10a > 0 else 0
    years_to_full = variety_info["years_to_fruit"] + 3

    return OrchardDesignResponse(
        area_pyeong=req.area_pyeong,
        area_m2=round(area_m2, 1),
        variety=VARIETY_NAMES.get(req.variety_id, req.variety_id),
        rootstock_id=req.rootstock_id,
        rootstock_name=ROOTSTOCK_NAMES.get(req.rootstock_id or "", None),
        machine_id=req.machine_id,
        spacing=spacing,
        total_trees=total_trees,
        rows=rows,
        trees_per_row=trees_per_row,
        tree_positions=positions,
        planting_density=round(density, 1),
        estimated_yield_kg=round(estimated_yield, 0),
        years_to_full_production=years_to_full,
        setback_applied=setback_applied,
        effective_area_m2=round(effective_area, 1),
    )


# ---------------------------------------------------------------------------
# Yield SSOT — 수확량 단일 진실 원천
# ---------------------------------------------------------------------------


def compute_yield_per_10a(
    variety_id: str,
    row_sp: float | None = None,
    tree_sp: float | None = None,
    rootstock_id: str | None = None,
) -> float:
    """10a(1000m²)당 수확량(kg)을 간격·대목으로부터 산출한다.

    수확량 단일 진실 원천(SSOT): 설계·시뮬레이션 양쪽에서 이 함수를 호출하여
    동일한 수확량을 사용해야 한다.

    계산: trees_per_10a = (1000 × 0.85) / (row_sp × tree_sp)
          yield_per_10a = yield_per_tree × trees_per_10a
    """
    # 간격 결정: 인자 > 대목 > 품종 기본값
    base_sp = VARIETY_SPACING.get(variety_id, VARIETY_SPACING["default"])
    if rootstock_id and rootstock_id in ROOTSTOCK_SPACING:
        base_sp = ROOTSTOCK_SPACING[rootstock_id]

    final_row = row_sp or base_sp.row
    final_tree = tree_sp or base_sp.tree

    variety_info = VARIETY_YIELD.get(variety_id, VARIETY_YIELD["default"])
    trees_per_10a = (1000 * 0.85) / (final_row * final_tree)
    return round(variety_info["yield_per_tree"] * trees_per_10a)
