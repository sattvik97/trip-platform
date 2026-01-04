from datetime import date
from pydantic import BaseModel
from typing import Optional

class TripBase(BaseModel):
    title: str
    description: Optional[str] = None
    destination: str
    price: int
    start_date: date
    end_date: date

class TripCreate(TripBase):
    organizer_id: str

class TripResponse(TripBase):
    id: str
    slug: str
    organizer_id: str
    total_seats: int
    available_seats: int

    class Config:
        from_attributes = True