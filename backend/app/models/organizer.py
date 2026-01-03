import uuid
from sqlalchemy import Column, String, DateTime, func
from app.db.base import Base

class Organizer(Base):
    __tablename__ = "organizers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    website = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())