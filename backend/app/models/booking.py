import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.base import Base   # 🔥 THIS LINE WAS MISSING

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String, ForeignKey("trips.id"), nullable=False)
    user_id = Column(String, ForeignKey("end_users.id"), nullable=True)  # Nullable for offline bookings
    seats_booked = Column(Integer, nullable=False)
    source = Column(String, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Booking details (Phase 4.5)
    num_travelers = Column(Integer, nullable=True)
    traveler_details = Column(JSONB, nullable=True)  # Array of traveler info
    contact_name = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    price_per_person = Column(Integer, nullable=True)
    total_price = Column(Integer, nullable=True)
    currency = Column(String, nullable=True, server_default='INR')
