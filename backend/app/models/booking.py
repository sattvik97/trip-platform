import enum
import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SQLEnum, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String, ForeignKey("trips.id"), nullable=False)
    user_id = Column(String, ForeignKey("end_users.id"), nullable=True)

    # Existing storage column retained for compatibility.
    seats_booked = Column(Integer, nullable=False)
    source = Column(String, nullable=False, server_default="user")

    amount_snapshot = Column(Numeric(12, 2), nullable=False, server_default="0")
    currency = Column(String, nullable=False, server_default="INR")

    status = Column(
        SQLEnum(BookingStatus, name="bookingstatus"),
        nullable=False,
        server_default=BookingStatus.PENDING.value,
    )

    expires_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Existing optional booking detail fields.
    num_travelers = Column(Integer, nullable=True)
    traveler_details = Column(JSONB, nullable=True)
    contact_name = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    price_per_person = Column(Integer, nullable=True)
    total_price = Column(Integer, nullable=True)
    payments = relationship(
        "Payment",
        back_populates="booking",
        lazy="select",
        cascade="all, delete-orphan",
    )

    @property
    def seats(self) -> int:
        return self.seats_booked

    @seats.setter
    def seats(self, value: int) -> None:
        self.seats_booked = value
