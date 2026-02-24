from __future__ import annotations

from pydantic import BaseModel


class Spacing(BaseModel):
    row: float  # meters
    tree: float  # meters


class TreePosition(BaseModel):
    row: int
    col: int
    x: float
    y: float


class OrchardDesignRequest(BaseModel):
    area_pyeong: float
    variety_id: str
    rootstock_id: str | None = None  # M9, M26, MM106, seedling
    machine_id: str | None = None  # ss, tractor-small, tractor-mid, cultivator
    setback_enabled: bool = False
    setback_distance: float = 1.0  # meters
    spacing_row: float | None = None  # override
    spacing_tree: float | None = None  # override
    orientation: str = "south"  # south, east, etc


class OrchardDesignResponse(BaseModel):
    area_pyeong: float
    area_m2: float
    variety: str
    rootstock_id: str | None = None
    rootstock_name: str | None = None
    machine_id: str | None = None
    spacing: Spacing
    total_trees: int
    rows: int
    trees_per_row: int
    tree_positions: list[TreePosition]
    planting_density: float  # trees per 10a
    estimated_yield_kg: float  # at full production
    years_to_full_production: int
    setback_applied: bool = False
    effective_area_m2: float | None = None
