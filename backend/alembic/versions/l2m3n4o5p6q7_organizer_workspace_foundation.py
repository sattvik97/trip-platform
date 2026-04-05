"""organizer workspace foundation

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-04-05 14:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "l2m3n4o5p6q7"
down_revision: Union[str, Sequence[str], None] = "k1l2m3n4o5p6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


organizer_verification_status = sa.Enum(
    "UNVERIFIED",
    "PENDING",
    "VERIFIED",
    name="organizerverificationstatus",
)


def upgrade() -> None:
    bind = op.get_bind()
    organizer_verification_status.create(bind, checkfirst=True)

    op.add_column("organizers", sa.Column("phone", sa.String(), nullable=True))
    op.add_column("organizers", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("organizers", sa.Column("support_email", sa.String(), nullable=True))
    op.add_column("organizers", sa.Column("support_phone", sa.String(), nullable=True))
    op.add_column(
        "organizers",
        sa.Column(
            "verification_status",
            organizer_verification_status,
            nullable=False,
            server_default="UNVERIFIED",
        ),
    )
    op.add_column("organizers", sa.Column("verification_notes", sa.Text(), nullable=True))

    op.execute(
        """
        UPDATE organizers
        SET name = INITCAP(SPLIT_PART(email, '@', 1))
        WHERE COALESCE(NULLIF(TRIM(name), ''), '') = ''
        """
    )
    op.execute(
        """
        UPDATE organizers
        SET support_email = email
        WHERE support_email IS NULL
        """
    )

    op.add_column("trips", sa.Column("meeting_point", sa.String(), nullable=True))
    op.add_column("trips", sa.Column("difficulty_level", sa.String(), nullable=True))
    op.add_column("trips", sa.Column("cancellation_policy", sa.Text(), nullable=True))
    op.add_column("trips", sa.Column("inclusions", postgresql.ARRAY(sa.String()), nullable=True))
    op.add_column("trips", sa.Column("exclusions", postgresql.ARRAY(sa.String()), nullable=True))

    op.add_column("bookings", sa.Column("organizer_note", sa.String(), nullable=True))
    op.add_column("bookings", sa.Column("decision_reason", sa.String(), nullable=True))
    op.add_column("bookings", sa.Column("decision_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("bookings", "decision_at")
    op.drop_column("bookings", "decision_reason")
    op.drop_column("bookings", "organizer_note")

    op.drop_column("trips", "exclusions")
    op.drop_column("trips", "inclusions")
    op.drop_column("trips", "cancellation_policy")
    op.drop_column("trips", "difficulty_level")
    op.drop_column("trips", "meeting_point")

    op.drop_column("organizers", "verification_notes")
    op.drop_column("organizers", "verification_status")
    op.drop_column("organizers", "support_phone")
    op.drop_column("organizers", "support_email")
    op.drop_column("organizers", "bio")
    op.drop_column("organizers", "phone")

    bind = op.get_bind()
    organizer_verification_status.drop(bind, checkfirst=True)
