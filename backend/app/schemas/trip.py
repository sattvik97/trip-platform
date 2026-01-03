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
    pass

class TripResponse(TripBase):
    id: str

    class Config:
        from_attributes = True
