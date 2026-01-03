import uuid
from sqlalchemy import (
    Column, String, Integer, Date, Text,
    Boolean, DateTime, ForeignKey, UniqueConstraint, func
)
from app.db.base import Base

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

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("organizer_id", "title", "start_date", name="uq_trip_no_duplicates"),
        UniqueConstraint("organizer_id", "slug", name="uq_trip_slug"),
    )
