"""create trip_images table

Revision ID: g1h2i3j4k5l6
Revises: f7e8d9c0b1a2
Create Date: 2026-01-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "g1h2i3j4k5l6"
down_revision: Union[str, Sequence[str], None] = "f7e8d9c0b1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "trip_images",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("trip_id", sa.String(), nullable=False),
        sa.Column("image_url", sa.String(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    # Create index on trip_id for faster queries
    op.create_index("ix_trip_images_trip_id", "trip_images", ["trip_id"])
    # Create index on position for ordering
    op.create_index("ix_trip_images_position", "trip_images", ["trip_id", "position"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_trip_images_position", table_name="trip_images")
    op.drop_index("ix_trip_images_trip_id", table_name="trip_images")
    op.drop_table("trip_images")

