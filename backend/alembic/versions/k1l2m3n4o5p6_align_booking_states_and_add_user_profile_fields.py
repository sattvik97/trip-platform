"""align booking states and add user profile fields

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-04-05 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "k1l2m3n4o5p6"
down_revision: Union[str, Sequence[str], None] = "j0k1l2m3n4o5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("end_users", sa.Column("full_name", sa.String(), nullable=True))
    op.add_column("end_users", sa.Column("phone", sa.String(), nullable=True))

    op.execute("ALTER TYPE bookingstatus RENAME TO bookingstatus_old")
    op.execute("ALTER TABLE bookings ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE bookings ALTER COLUMN status TYPE text USING status::text")

    op.execute(
        """
        UPDATE bookings
        SET status = CASE
            WHEN status = 'PENDING' AND expires_at IS NOT NULL AND expires_at < NOW() THEN 'EXPIRED'
            WHEN status = 'PENDING' THEN 'PAYMENT_PENDING'
            ELSE status
        END
        """
    )

    op.execute(
        """
        CREATE TYPE bookingstatus AS ENUM (
            'REVIEW_PENDING',
            'PAYMENT_PENDING',
            'CONFIRMED',
            'CANCELLED',
            'EXPIRED'
        )
        """
    )
    op.execute("ALTER TABLE bookings ALTER COLUMN status TYPE bookingstatus USING status::bookingstatus")
    op.execute("ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'REVIEW_PENDING'")
    op.execute("DROP TYPE bookingstatus_old")

    op.alter_column("bookings", "expires_at", existing_type=sa.DateTime(timezone=True), nullable=True)


def downgrade() -> None:
    op.execute("ALTER TYPE bookingstatus RENAME TO bookingstatus_new")
    op.execute("ALTER TABLE bookings ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE bookings ALTER COLUMN status TYPE text USING status::text")
    op.execute("UPDATE bookings SET status = 'PENDING' WHERE status IN ('REVIEW_PENDING', 'PAYMENT_PENDING')")
    op.execute(
        """
        CREATE TYPE bookingstatus AS ENUM (
            'PENDING',
            'CONFIRMED',
            'CANCELLED',
            'EXPIRED'
        )
        """
    )
    op.execute("ALTER TABLE bookings ALTER COLUMN status TYPE bookingstatus USING status::bookingstatus")
    op.execute("ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'PENDING'")
    op.execute("DROP TYPE bookingstatus_new")

    op.execute(
        """
        UPDATE bookings
        SET expires_at = COALESCE(expires_at, created_at, NOW())
        WHERE expires_at IS NULL
        """
    )
    op.alter_column("bookings", "expires_at", existing_type=sa.DateTime(timezone=True), nullable=False)

    op.drop_column("end_users", "phone")
    op.drop_column("end_users", "full_name")
