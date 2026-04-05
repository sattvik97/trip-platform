"""organizer finance and verification

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
Create Date: 2026-04-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "m3n4o5p6q7r8"
down_revision = "l2m3n4o5p6q7"
branch_labels = None
depends_on = None


organizer_payout_status = postgresql.ENUM(
    "SCHEDULED",
    "PROCESSING",
    "PAID",
    "FAILED",
    name="organizerpayoutstatus",
    create_type=False,
)
organizer_ledger_entry_type = postgresql.ENUM(
    "BOOKING_GROSS",
    "PLATFORM_FEE",
    "REFUND",
    "PAYOUT",
    name="organizerledgerentrytype",
    create_type=False,
)
organizer_ledger_entry_status = postgresql.ENUM(
    "PENDING",
    "AVAILABLE",
    "PAID_OUT",
    name="organizerledgerentrystatus",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    organizer_payout_status.create(bind, checkfirst=True)
    organizer_ledger_entry_type.create(bind, checkfirst=True)
    organizer_ledger_entry_status.create(bind, checkfirst=True)

    op.add_column("organizers", sa.Column("payout_method", sa.String(), nullable=True))
    op.add_column("organizers", sa.Column("payout_beneficiary", sa.String(), nullable=True))
    op.add_column("organizers", sa.Column("payout_reference", sa.String(), nullable=True))
    op.add_column("organizers", sa.Column("verification_submitted_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "organizer_payouts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("organizer_id", sa.String(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(), nullable=False, server_default="INR"),
        sa.Column("status", organizer_payout_status, nullable=False, server_default="SCHEDULED"),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reference", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_organizer_payouts_organizer_id", "organizer_payouts", ["organizer_id"])

    op.create_table(
        "organizer_ledger_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("organizer_id", sa.String(), nullable=False),
        sa.Column("booking_id", sa.String(), nullable=True),
        sa.Column("payment_id", sa.Integer(), nullable=True),
        sa.Column("payout_id", sa.Integer(), nullable=True),
        sa.Column("entry_type", organizer_ledger_entry_type, nullable=False),
        sa.Column("status", organizer_ledger_entry_status, nullable=False, server_default="PENDING"),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(), nullable=False, server_default="INR"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("available_on", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"]),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"]),
        sa.ForeignKeyConstraint(["payout_id"], ["organizer_payouts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_organizer_ledger_entries_organizer_id",
        "organizer_ledger_entries",
        ["organizer_id"],
    )
    op.create_index(
        "ix_organizer_ledger_entries_booking_id",
        "organizer_ledger_entries",
        ["booking_id"],
    )
    op.create_index(
        "ix_organizer_ledger_entries_payment_id",
        "organizer_ledger_entries",
        ["payment_id"],
    )
    op.create_index(
        "ix_organizer_ledger_entries_payout_id",
        "organizer_ledger_entries",
        ["payout_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_organizer_ledger_entries_payout_id", table_name="organizer_ledger_entries")
    op.drop_index("ix_organizer_ledger_entries_payment_id", table_name="organizer_ledger_entries")
    op.drop_index("ix_organizer_ledger_entries_booking_id", table_name="organizer_ledger_entries")
    op.drop_index("ix_organizer_ledger_entries_organizer_id", table_name="organizer_ledger_entries")
    op.drop_table("organizer_ledger_entries")

    op.drop_index("ix_organizer_payouts_organizer_id", table_name="organizer_payouts")
    op.drop_table("organizer_payouts")

    op.drop_column("organizers", "verification_submitted_at")
    op.drop_column("organizers", "payout_reference")
    op.drop_column("organizers", "payout_beneficiary")
    op.drop_column("organizers", "payout_method")

    bind = op.get_bind()
    organizer_ledger_entry_status.drop(bind, checkfirst=True)
    organizer_ledger_entry_type.drop(bind, checkfirst=True)
    organizer_payout_status.drop(bind, checkfirst=True)
