"""add booking payment flow fields and enums

Revision ID: h8i9j0k1l2m3
Revises: f7e8d9c0b1a2
Create Date: 2026-02-17 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "h8i9j0k1l2m3"
down_revision: Union[str, Sequence[str], None] = "f7e8d9c0b1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    booking_status_enum = sa.Enum(
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "EXPIRED",
        name="bookingstatus",
    )
    payment_status_enum = sa.Enum(
        "NOT_INITIATED",
        "ORDER_CREATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED",
        name="paymentstatus",
    )

    booking_status_enum.create(op.get_bind(), checkfirst=True)
    payment_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column("bookings", sa.Column("amount_snapshot", sa.Numeric(12, 2), nullable=True))
    op.add_column(
        "bookings",
        sa.Column("payment_status", payment_status_enum, nullable=False, server_default="NOT_INITIATED"),
    )
    op.add_column("bookings", sa.Column("payment_provider", sa.String(), nullable=True))
    op.add_column("bookings", sa.Column("payment_order_id", sa.String(), nullable=True))
    op.add_column("bookings", sa.Column("payment_id", sa.String(), nullable=True))
    op.add_column("bookings", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("bookings", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))

    op.execute(
        """
        UPDATE bookings AS b
        SET amount_snapshot = COALESCE(
            b.total_price::numeric,
            (t.price * COALESCE(NULLIF(b.num_travelers, 0), b.seats_booked))::numeric,
            0
        )
        FROM trips AS t
        WHERE b.trip_id = t.id
        """
    )
    op.execute("UPDATE bookings SET amount_snapshot = 0 WHERE amount_snapshot IS NULL")

    op.execute("UPDATE bookings SET currency = 'INR' WHERE currency IS NULL")

    op.execute("UPDATE bookings SET status = UPPER(status) WHERE status IS NOT NULL")
    op.execute("UPDATE bookings SET status = 'CONFIRMED' WHERE status = 'APPROVED'")
    op.execute("UPDATE bookings SET status = 'CANCELLED' WHERE status = 'REJECTED'")
    op.execute(
        """
        UPDATE bookings
        SET status = 'PENDING'
        WHERE status IS NULL OR status NOT IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')
        """
    )
    op.alter_column(
        "bookings",
        "status",
        existing_type=sa.String(),
        type_=booking_status_enum,
        postgresql_using="status::bookingstatus",
        nullable=False,
        server_default="PENDING",
    )

    op.execute("UPDATE bookings SET payment_status = 'SUCCESS' WHERE status = 'CONFIRMED'")
    op.execute("UPDATE bookings SET payment_status = 'FAILED' WHERE status IN ('CANCELLED', 'EXPIRED')")

    op.execute(
        """
        UPDATE bookings
        SET expires_at = COALESCE(created_at, NOW()) + INTERVAL '10 minutes'
        WHERE expires_at IS NULL
        """
    )
    op.execute("UPDATE bookings SET paid_at = created_at WHERE paid_at IS NULL AND status = 'CONFIRMED'")

    op.alter_column("bookings", "amount_snapshot", nullable=False, server_default="0")
    op.alter_column("bookings", "currency", existing_type=sa.String(), nullable=False, server_default="INR")
    op.alter_column("bookings", "expires_at", nullable=False)

    op.create_unique_constraint("uq_bookings_payment_order_id", "bookings", ["payment_order_id"])
    op.create_unique_constraint("uq_bookings_payment_id", "bookings", ["payment_id"])


def downgrade() -> None:
    """Downgrade schema."""
    payment_status_enum = sa.Enum(
        "NOT_INITIATED",
        "ORDER_CREATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED",
        name="paymentstatus",
    )
    booking_status_enum = sa.Enum(
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "EXPIRED",
        name="bookingstatus",
    )

    op.drop_constraint("uq_bookings_payment_id", "bookings", type_="unique")
    op.drop_constraint("uq_bookings_payment_order_id", "bookings", type_="unique")

    op.alter_column("bookings", "status", existing_type=booking_status_enum, type_=sa.String(), nullable=False)
    op.execute("UPDATE bookings SET status = 'APPROVED' WHERE status = 'CONFIRMED'")
    op.execute("UPDATE bookings SET status = 'REJECTED' WHERE status = 'CANCELLED'")

    op.drop_column("bookings", "paid_at")
    op.drop_column("bookings", "expires_at")
    op.drop_column("bookings", "payment_id")
    op.drop_column("bookings", "payment_order_id")
    op.drop_column("bookings", "payment_provider")
    op.drop_column("bookings", "payment_status")
    op.drop_column("bookings", "amount_snapshot")

    payment_status_enum.drop(op.get_bind(), checkfirst=True)
    booking_status_enum.drop(op.get_bind(), checkfirst=True)
