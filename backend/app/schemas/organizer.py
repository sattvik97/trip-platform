from pydantic import BaseModel, EmailStr
from typing import Optional

class OrganizerBase(BaseModel):
    name: str
    email: EmailStr
    website: Optional[str] = None

class OrganizerCreate(OrganizerBase):
    pass

class OrganizerResponse(OrganizerBase):
    id: str

    class Config:
        from_attributes = True
