import enum

from sqlalchemy import Column, DateTime, Enum as SQLEnum, Integer, Numeric, String, Text
from sqlalchemy.sql import func

from app.db.base import Base


class OrganizerPayoutStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"


class OrganizerPayout(Base):
    __tablename__ = "organizer_payouts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organizer_id = Column(String, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, nullable=False, server_default="INR")
    status = Column(
        SQLEnum(OrganizerPayoutStatus, name="organizerpayoutstatus"),
        nullable=False,
        server_default=OrganizerPayoutStatus.SCHEDULED.value,
    )
    scheduled_for = Column(DateTime(timezone=True), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    reference = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
