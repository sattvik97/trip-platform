import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Numeric,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class PaymentStatus(str, enum.Enum):
    NOT_INITIATED = "NOT_INITIATED"
    ORDER_CREATED = "ORDER_CREATED"
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False, index=True)

    provider = Column(String, nullable=False)
    provider_order_id = Column(String, unique=True, nullable=False)
    provider_payment_id = Column(String, unique=True, nullable=True)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, nullable=False)

    status = Column(
        SQLEnum(PaymentStatus, name="paymentstatus"),
        nullable=False,
        server_default=PaymentStatus.ORDER_CREATED.value,
    )

    provider_signature = Column(String, nullable=True)
    raw_provider_response = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    booking = relationship("Booking", back_populates="payments", lazy="select")
    events = relationship(
        "PaymentEvent",
        back_populates="payment",
        lazy="select",
        cascade="all, delete-orphan",
    )
