"""add trip enhancements tags images itinerary

Revision ID: a1b2c3d4e5f6
Revises: 9048e106dd9a
Create Date: 2026-01-04 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9048e106dd9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add tags (array of strings)
    op.add_column('trips', sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True))
    
    # Add cover_image_url (nullable string)
    op.add_column('trips', sa.Column('cover_image_url', sa.String(), nullable=True))
    
    # Add gallery_images (array of strings)
    op.add_column('trips', sa.Column('gallery_images', postgresql.ARRAY(sa.String()), nullable=True))
    
    # Add itinerary (JSONB array)
    op.add_column('trips', sa.Column('itinerary', postgresql.JSONB, nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('trips', 'itinerary')
    op.drop_column('trips', 'gallery_images')
    op.drop_column('trips', 'cover_image_url')
    op.drop_column('trips', 'tags')

