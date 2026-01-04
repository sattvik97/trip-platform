from datetime import date
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.models.trip_tag import TripTag

class ItineraryItem(BaseModel):
    day: int
    title: str
    description: str

class TripBase(BaseModel):
    title: str
    description: Optional[str] = None
    destination: str
    price: int
    start_date: date
    end_date: date

class TripCreate(TripBase):
    organizer_id: str
    total_seats: int
    tags: Optional[List[TripTag]] = None
    cover_image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    itinerary: Optional[List[ItineraryItem]] = None

class OrganizerTripCreate(TripBase):
    """TripCreate without organizer_id (obtained from JWT token)."""
    total_seats: int
    tags: Optional[List[TripTag]] = None
    cover_image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    itinerary: Optional[List[ItineraryItem]] = None

class TripUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    price: Optional[int] = None
    total_seats: Optional[int] = None
    tags: Optional[List[TripTag]] = None
    cover_image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    itinerary: Optional[List[ItineraryItem]] = None

class TripResponse(TripBase):
    id: str
    slug: str
    organizer_id: str
    total_seats: int
    available_seats: int
    tags: Optional[List[TripTag]] = None
    cover_image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    itinerary: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

class OrganizerTripResponse(BaseModel):
    id: str
    slug: str
    title: str
    description: Optional[str] = None
    destination: str
    price: int
    start_date: date
    end_date: date
    total_seats: int
    tags: Optional[List[TripTag]] = None
    cover_image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    itinerary: Optional[List[Dict[str, Any]]] = None
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True