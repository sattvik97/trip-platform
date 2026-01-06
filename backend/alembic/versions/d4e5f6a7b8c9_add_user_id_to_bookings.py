"""add user_id to bookings

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-01-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add user_id column to bookings table (nullable for offline bookings)
    op.add_column('bookings', sa.Column('user_id', sa.String(), nullable=True))
    op.create_foreign_key('fk_bookings_user_id', 'bookings', 'end_users', ['user_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_bookings_user_id', 'bookings', type_='foreignkey')
    op.drop_column('bookings', 'user_id')

