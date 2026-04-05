from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.organizer import OrganizerVerificationStatus

class OrganizerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    bio: Optional[str] = None
    support_email: Optional[EmailStr] = None
    support_phone: Optional[str] = None
    payout_method: Optional[str] = None
    payout_beneficiary: Optional[str] = None
    payout_reference: Optional[str] = None

class OrganizerCreate(OrganizerBase):
    pass

class OrganizerResponse(OrganizerBase):
    id: str
    verification_status: OrganizerVerificationStatus
    verification_notes: Optional[str] = None
    verification_submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrganizerVerificationChecklistItem(BaseModel):
    key: str
    label: str
    description: str
    completed: bool
    required: bool = True


class OrganizerProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    bio: Optional[str] = None
    support_email: Optional[EmailStr] = None
    support_phone: Optional[str] = None
    payout_method: Optional[str] = None
    payout_beneficiary: Optional[str] = None
    payout_reference: Optional[str] = None
    verification_status: OrganizerVerificationStatus
    verification_notes: Optional[str] = None
    verification_submitted_at: Optional[datetime] = None
    profile_completion_percent: int
    publish_requirements_met: bool
    missing_profile_items: list[str]
    verification_checklist: list[OrganizerVerificationChecklistItem]
    can_submit_verification: bool

    class Config:
        from_attributes = True


class OrganizerProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    bio: Optional[str] = None
    support_email: Optional[EmailStr] = None
    support_phone: Optional[str] = None
    payout_method: Optional[str] = None
    payout_beneficiary: Optional[str] = None
    payout_reference: Optional[str] = None
