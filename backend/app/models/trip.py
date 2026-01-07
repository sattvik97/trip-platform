import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Date,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.trip_tag import TripTag
import enum


class TripStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class Trip(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organizer_id = Column(String, ForeignKey("organizers.id"), nullable=False)

    slug = Column(String, nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text)
    destination = Column(String, nullable=False)
    price = Column(Integer, nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    total_seats = Column(Integer, nullable=False)  # ✅ REQUIRED

    status = Column(
        SQLEnum(TripStatus, name="tripstatus"),
        nullable=False,
        server_default=TripStatus.DRAFT.value,
    )

    tags = Column(ARRAY(String), nullable=True)
    cover_image_url = Column(String, nullable=True)
    gallery_images = Column(ARRAY(String), nullable=True)
    itinerary = Column(JSONB, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    bookings = relationship(
        "Booking",
        backref="trip",
        lazy="select",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("organizer_id", "slug", name="uq_trip_slug"),
        UniqueConstraint("organizer_id", "title", "start_date", name="uq_trip_no_duplicates"),
    )
