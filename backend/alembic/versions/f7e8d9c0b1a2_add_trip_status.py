"""add trip status lifecycle field

Revision ID: f7e8d9c0b1a2
Revises: e5f6a7b8c9d0
Create Date: 2026-01-07 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f7e8d9c0b1a2"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add status column with default DRAFT and non-null constraint
    status_enum = sa.Enum("DRAFT", "PUBLISHED", "ARCHIVED", name="tripstatus")
    status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "trips",
        sa.Column(
            "status",
            status_enum,
            nullable=False,
            server_default="DRAFT",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("trips", "status")
    status_enum = sa.Enum("DRAFT", "PUBLISHED", "ARCHIVED", name="tripstatus")
    status_enum.drop(op.get_bind(), checkfirst=True)


