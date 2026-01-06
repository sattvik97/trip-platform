import uuid
from sqlalchemy import Column, String, DateTime, func
from app.db.base import Base


class EndUser(Base):
    __tablename__ = "end_users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

