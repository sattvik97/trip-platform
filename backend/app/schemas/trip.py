from datetime import date
from pydantic import BaseModel, model_validator
from typing import Optional, List, Dict, Any
from app.models.trip_tag import TripTag
from app.models.trip import TripStatus

class ItineraryItem(BaseModel):
    day: int
    title: str
    description: str

class TripBase(BaseModel):
    title: str
    description: Optional[str] = None
    destination: str
    price: int
    meeting_point: Optional[str] = None
    difficulty_level: Optional[str] = None
    cancellation_policy: Optional[str] = None
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        return self

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
    meeting_point: Optional[str] = None
    difficulty_level: Optional[str] = None
    cancellation_policy: Optional[str] = None
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
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
    status: TripStatus
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
    meeting_point: Optional[str] = None
    difficulty_level: Optional[str] = None
    cancellation_policy: Optional[str] = None
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    start_date: date
    end_date: date
    total_seats: int
    available_seats: int
    booked_seats: int
    status: TripStatus
    tags: Optional[List[TripTag]] = None
    cover_image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    itinerary: Optional[List[Dict[str, Any]]] = None
    is_active: bool
    created_at: str
    publish_ready: bool
    publish_blockers: List[str]

    class Config:
        from_attributes = True


class PaginatedOrganizerTripsResponse(BaseModel):
    items: List[OrganizerTripResponse]
    total: int
    page: int
    page_size: int
