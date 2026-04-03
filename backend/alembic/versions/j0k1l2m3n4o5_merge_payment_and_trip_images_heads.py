"""merge payment split and trip images heads

Revision ID: j0k1l2m3n4o5
Revises: g1h2i3j4k5l6, i9j0k1l2m3n4
Create Date: 2026-02-17 16:45:00.000000

"""

from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "j0k1l2m3n4o5"
down_revision: Union[str, Sequence[str], None] = ("g1h2i3j4k5l6", "i9j0k1l2m3n4")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
