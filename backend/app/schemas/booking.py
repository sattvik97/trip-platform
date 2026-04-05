from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import conint

from app.models.booking import BookingStatus
from app.schemas.payment import PaymentOrderInfo, PaymentResponse

class BookingResponse(BaseModel):
    id: str
    trip_id: str
    user_id: Optional[str] = None
    seats_booked: int
    source: str
    status: str
    created_at: datetime
    amount_snapshot: Optional[Decimal] = None
    expires_at: Optional[datetime] = None

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
    organizer_note: Optional[str] = None
    decision_reason: Optional[str] = None
    decision_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class OrganizerBookingReviewRequest(BaseModel):
    note: Optional[str] = None
    reason: Optional[str] = None


class OrganizerBulkBookingReviewRequest(BaseModel):
    booking_ids: List[str]
    action: str
    note: Optional[str] = None
    reason: Optional[str] = None


class OrganizerBulkBookingReviewResponse(BaseModel):
    processed: int
    failed: int
    items: List[BookingResponse]
    errors: List[Dict[str, str]]


class PaginatedOrganizerBookingsResponse(BaseModel):
    items: List[BookingResponse]
    total: int
    page: int
    page_size: int


class BookingCreateRequest(BaseModel):
    trip_id: str
    seats: conint(gt=0)


class BookingCheckoutResponse(BaseModel):
    id: str
    trip_id: str
    user_id: Optional[str] = None
    seats: int
    amount_snapshot: Decimal
    currency: str
    status: BookingStatus
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class BookingWithPaymentOrderResponse(BaseModel):
    booking: BookingCheckoutResponse
    payment: PaymentResponse
    payment_order: PaymentOrderInfo

