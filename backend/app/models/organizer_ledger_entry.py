import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.db.base import Base


class OrganizerLedgerEntryType(str, enum.Enum):
    BOOKING_GROSS = "BOOKING_GROSS"
    PLATFORM_FEE = "PLATFORM_FEE"
    REFUND = "REFUND"
    PAYOUT = "PAYOUT"


class OrganizerLedgerEntryStatus(str, enum.Enum):
    PENDING = "PENDING"
    AVAILABLE = "AVAILABLE"
    PAID_OUT = "PAID_OUT"


class OrganizerLedgerEntry(Base):
    __tablename__ = "organizer_ledger_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organizer_id = Column(String, nullable=False, index=True)
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True, index=True)
    payout_id = Column(Integer, ForeignKey("organizer_payouts.id"), nullable=True, index=True)
    entry_type = Column(
        SQLEnum(OrganizerLedgerEntryType, name="organizerledgerentrytype"),
        nullable=False,
    )
    status = Column(
        SQLEnum(OrganizerLedgerEntryStatus, name="organizerledgerentrystatus"),
        nullable=False,
        server_default=OrganizerLedgerEntryStatus.PENDING.value,
    )
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, nullable=False, server_default="INR")
    description = Column(Text, nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    available_on = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
