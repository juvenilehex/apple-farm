"""initial_tables

Revision ID: a81b55f7b62f
Revises:
Create Date: 2026-02-20 14:22:49.068125

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a81b55f7b62f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "price_history",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("date", sa.String, nullable=False, index=True),
        sa.Column("variety", sa.String, nullable=False, index=True),
        sa.Column("grade", sa.String, nullable=False),
        sa.Column("market", sa.String, nullable=False),
        sa.Column("price", sa.Integer, nullable=False),
        sa.Column("change", sa.Float, default=0),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "weather_cache",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("region_id", sa.String, nullable=False, index=True),
        sa.Column("date", sa.String, nullable=False),
        sa.Column("data", sa.JSON, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "orchard_plans",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String, nullable=True),
        sa.Column("variety_id", sa.String, nullable=False),
        sa.Column("area_pyeong", sa.Float, nullable=False),
        sa.Column("design_data", sa.JSON, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("orchard_plans")
    op.drop_table("weather_cache")
    op.drop_table("price_history")
