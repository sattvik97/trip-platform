import enum
import uuid
from sqlalchemy import Column, String, DateTime, Text, func, Enum as SQLEnum
from app.db.base import Base


class OrganizerVerificationStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"


class Organizer(Base):
    __tablename__ = "organizers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    support_email = Column(String, nullable=True)
    support_phone = Column(String, nullable=True)
    payout_method = Column(String, nullable=True)
    payout_beneficiary = Column(String, nullable=True)
    payout_reference = Column(String, nullable=True)
    verification_status = Column(
        SQLEnum(OrganizerVerificationStatus, name="organizerverificationstatus"),
        nullable=False,
        server_default=OrganizerVerificationStatus.UNVERIFIED.value,
    )
    verification_notes = Column(Text, nullable=True)
    verification_submitted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
