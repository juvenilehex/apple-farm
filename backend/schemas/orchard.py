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
    spacing_row: float | None = None  # override
    spacing_tree: float | None = None  # override
    orientation: str = "south"  # south, east, etc


class OrchardDesignResponse(BaseModel):
    area_pyeong: float
    area_m2: float
    variety: str
    spacing: Spacing
    total_trees: int
    rows: int
    trees_per_row: int
    tree_positions: list[TreePosition]
    planting_density: float  # trees per 10a
    estimated_yield_kg: float  # at full production
    years_to_full_production: int
