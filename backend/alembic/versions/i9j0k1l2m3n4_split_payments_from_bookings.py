"""split payment data out of bookings into payments tables

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-02-17 16:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "i9j0k1l2m3n4"
down_revision: Union[str, Sequence[str], None] = "h8i9j0k1l2m3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    payment_status_enum = postgresql.ENUM(
        "NOT_INITIATED",
        "ORDER_CREATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED",
        name="paymentstatus",
    )
    payment_status_enum.create(op.get_bind(), checkfirst=True)
    payment_status_column_enum = postgresql.ENUM(
        "NOT_INITIATED",
        "ORDER_CREATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED",
        name="paymentstatus",
        create_type=False,
    )

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("booking_id", sa.String(), sa.ForeignKey("bookings.id"), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("provider_order_id", sa.String(), nullable=False),
        sa.Column("provider_payment_id", sa.String(), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(), nullable=False),
        sa.Column("status", payment_status_column_enum, nullable=False, server_default="ORDER_CREATED"),
        sa.Column("provider_signature", sa.String(), nullable=True),
        sa.Column("raw_provider_response", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("provider_order_id", name="uq_payments_provider_order_id"),
        sa.UniqueConstraint("provider_payment_id", name="uq_payments_provider_payment_id"),
    )
    op.create_index("ix_payments_booking_id", "payments", ["booking_id"], unique=False)

    op.create_table(
        "payment_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("payment_id", sa.Integer(), sa.ForeignKey("payments.id"), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_payment_events_payment_id", "payment_events", ["payment_id"], unique=False)

    # Move payment data from bookings into payments for existing rows.
    op.execute(
        """
        INSERT INTO payments (
            booking_id,
            provider,
            provider_order_id,
            provider_payment_id,
            amount,
            currency,
            status,
            provider_signature,
            raw_provider_response
        )
        SELECT
            b.id AS booking_id,
            COALESCE(b.payment_provider, 'MOCK') AS provider,
            COALESCE(b.payment_order_id, 'legacy_order_' || b.id) AS provider_order_id,
            b.payment_id AS provider_payment_id,
            b.amount_snapshot AS amount,
            b.currency AS currency,
            CASE
                WHEN b.payment_status IS NULL THEN 'NOT_INITIATED'
                ELSE b.payment_status::text
            END::paymentstatus AS status,
            NULL AS provider_signature,
            json_build_object(
                'migrated_from_booking', true,
                'legacy_payment_status', b.payment_status::text,
                'legacy_payment_provider', b.payment_provider,
                'legacy_payment_order_id', b.payment_order_id,
                'legacy_payment_id', b.payment_id
            ) AS raw_provider_response
        FROM bookings b
        WHERE b.payment_order_id IS NOT NULL
           OR b.payment_id IS NOT NULL
           OR b.payment_status::text <> 'NOT_INITIATED'
        """
    )

    op.execute(
        """
        INSERT INTO payment_events (payment_id, event_type, raw_payload)
        SELECT
            p.id,
            'MIGRATED',
            json_build_object(
                'booking_id', p.booking_id,
                'provider_order_id', p.provider_order_id,
                'provider_payment_id', p.provider_payment_id,
                'status', p.status::text
            )
        FROM payments p
        """
    )

    op.drop_constraint("uq_bookings_payment_id", "bookings", type_="unique")
    op.drop_constraint("uq_bookings_payment_order_id", "bookings", type_="unique")
    op.drop_column("bookings", "paid_at")
    op.drop_column("bookings", "payment_id")
    op.drop_column("bookings", "payment_order_id")
    op.drop_column("bookings", "payment_provider")
    op.drop_column("bookings", "payment_status")


def downgrade() -> None:
    payment_status_enum = postgresql.ENUM(
        "NOT_INITIATED",
        "ORDER_CREATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED",
        name="paymentstatus",
        create_type=False,
    )

    op.add_column(
        "bookings",
        sa.Column("payment_status", payment_status_enum, nullable=False, server_default="NOT_INITIATED"),
    )
    op.add_column("bookings", sa.Column("payment_provider", sa.String(), nullable=True))
    op.add_column("bookings", sa.Column("payment_order_id", sa.String(), nullable=True))
    op.add_column("bookings", sa.Column("payment_id", sa.String(), nullable=True))
    op.add_column("bookings", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint("uq_bookings_payment_order_id", "bookings", ["payment_order_id"])
    op.create_unique_constraint("uq_bookings_payment_id", "bookings", ["payment_id"])

    # Restore latest payment snapshot back to bookings on downgrade.
    op.execute(
        """
        UPDATE bookings b
        SET
            payment_provider = p.provider,
            payment_order_id = p.provider_order_id,
            payment_id = p.provider_payment_id,
            payment_status = p.status::text::paymentstatus,
            paid_at = CASE WHEN p.status = 'SUCCESS' THEN p.updated_at ELSE NULL END
        FROM (
            SELECT DISTINCT ON (booking_id)
                booking_id, provider, provider_order_id, provider_payment_id, status, updated_at
            FROM payments
            ORDER BY booking_id, updated_at DESC
        ) p
        WHERE b.id = p.booking_id
        """
    )

    op.drop_index("ix_payment_events_payment_id", table_name="payment_events")
    op.drop_table("payment_events")
    op.drop_index("ix_payments_booking_id", table_name="payments")
    op.drop_table("payments")
