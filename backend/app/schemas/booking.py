from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class BookingResponse(BaseModel):
    id: str
    trip_id: str
    user_id: Optional[str] = None
    seats_booked: int
    source: str
    status: str
    created_at: datetime
    
    # Trip info for organizer view
    trip_title: Optional[str] = None
    trip_destination: Optional[str] = None
    trip_start_date: Optional[str] = None
    trip_end_date: Optional[str] = None
    
    # User info for organizer view
    user_email: Optional[str] = None
    
    # Booking details (Phase 4.5)
    num_travelers: Optional[int] = None
    traveler_details: Optional[List[Dict[str, Any]]] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    price_per_person: Optional[int] = None
    total_price: Optional[int] = None
    currency: Optional[str] = None
    
    class Config:
        from_attributes = True

