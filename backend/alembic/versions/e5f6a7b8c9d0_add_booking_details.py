"""add booking details

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-01-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add booking detail fields
    op.add_column('bookings', sa.Column('num_travelers', sa.Integer(), nullable=True))
    op.add_column('bookings', sa.Column('traveler_details', postgresql.JSONB, nullable=True))
    op.add_column('bookings', sa.Column('contact_name', sa.String(), nullable=True))
    op.add_column('bookings', sa.Column('contact_phone', sa.String(), nullable=True))
    op.add_column('bookings', sa.Column('contact_email', sa.String(), nullable=True))
    op.add_column('bookings', sa.Column('price_per_person', sa.Integer(), nullable=True))
    op.add_column('bookings', sa.Column('total_price', sa.Integer(), nullable=True))
    op.add_column('bookings', sa.Column('currency', sa.String(), nullable=True, server_default='INR'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('bookings', 'currency')
    op.drop_column('bookings', 'total_price')
    op.drop_column('bookings', 'price_per_person')
    op.drop_column('bookings', 'contact_email')
    op.drop_column('bookings', 'contact_phone')
    op.drop_column('bookings', 'contact_name')
    op.drop_column('bookings', 'traveler_details')
    op.drop_column('bookings', 'num_travelers')

