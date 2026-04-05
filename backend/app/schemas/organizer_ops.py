from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel

from app.models.organizer_ledger_entry import (
    OrganizerLedgerEntryStatus,
    OrganizerLedgerEntryType,
)
from app.models.organizer_payout import OrganizerPayoutStatus
from app.models.organizer import OrganizerVerificationStatus
from app.schemas.organizer import OrganizerVerificationChecklistItem


class OrganizerLedgerEntryResponse(BaseModel):
    id: int
    booking_id: Optional[str] = None
    payment_id: Optional[int] = None
    payout_id: Optional[int] = None
    entry_type: OrganizerLedgerEntryType
    status: OrganizerLedgerEntryStatus
    amount: Decimal
    currency: str
    description: Optional[str] = None
    occurred_at: datetime
    available_on: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedOrganizerLedgerResponse(BaseModel):
    items: List[OrganizerLedgerEntryResponse]
    total: int
    page: int
    page_size: int


class OrganizerPayoutResponse(BaseModel):
    id: int
    amount: Decimal
    currency: str
    status: OrganizerPayoutStatus
    scheduled_for: datetime
    paid_at: Optional[datetime] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedOrganizerPayoutsResponse(BaseModel):
    items: List[OrganizerPayoutResponse]
    total: int
    page: int
    page_size: int


class OrganizerFinanceSummaryResponse(BaseModel):
    gross_bookings: Decimal
    platform_fees: Decimal
    refunds: Decimal
    pending_balance: Decimal
    available_balance: Decimal
    paid_out_total: Decimal
    net_earnings: Decimal
    next_payout_amount: Decimal
    next_payout_date: Optional[datetime] = None
    payout_setup_complete: bool
    payout_method: Optional[str] = None
    payout_reference: Optional[str] = None


class OrganizerPayoutCreateRequest(BaseModel):
    note: Optional[str] = None


class OrganizerFinanceOverviewResponse(BaseModel):
    active_trips: int
    draft_trips: int
    review_queue_count: int
    payment_pending_count: int
    confirmed_travelers: int
    gross_bookings: Decimal
    pending_balance: Decimal
    available_balance: Decimal
    next_payout_amount: Decimal
    next_payout_date: Optional[datetime] = None
    verification_status: OrganizerVerificationStatus
    can_submit_verification: bool
    verification_checklist: List[OrganizerVerificationChecklistItem]
    urgent_bookings: List["OrganizerOverviewBooking"]
    draft_trip_alerts: List["OrganizerOverviewTripAlert"]
    upcoming_trips: List["OrganizerOverviewUpcomingTrip"]


class OrganizerOverviewBooking(BaseModel):
    id: str
    trip_id: str
    trip_title: str
    traveler_name: str
    travelers: int
    created_at: datetime
    status: str


class OrganizerOverviewTripAlert(BaseModel):
    id: str
    title: str
    start_date: date
    publish_blockers: List[str]


class OrganizerOverviewUpcomingTrip(BaseModel):
    id: str
    title: str
    start_date: date
    destination: str
    booked_seats: int
    total_seats: int
    available_seats: int


OrganizerFinanceOverviewResponse.model_rebuild()
