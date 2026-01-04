import uuid
from sqlalchemy import Column, String, DateTime, func, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class UserRole(str, enum.Enum):
    user = "user"
    organizer = "organizer"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    organizer_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

