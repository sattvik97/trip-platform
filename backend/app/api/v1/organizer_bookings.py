from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.deps import get_db
from app.core.auth import require_organizer
from app.schemas.booking import (
    BookingResponse,
    OrganizerBookingReviewRequest,
    OrganizerBulkBookingReviewRequest,
    OrganizerBulkBookingReviewResponse,
    PaginatedOrganizerBookingsResponse,
)
from app.crud.booking import (
    list_bookings_for_organizer,
    approve_booking,
    reject_booking,
    bulk_review_bookings,
)
from app.models.end_user import EndUser

router = APIRouter()


def _serialize_booking(db: Session, booking) -> BookingResponse:
    trip = booking.trip
    trip_title = trip.title if trip else None
    trip_destination = trip.destination if trip else None
    trip_start_date = trip.start_date.isoformat() if trip and trip.start_date else None
    trip_end_date = trip.end_date.isoformat() if trip and trip.end_date else None

    user_email = None
    if booking.user_id:
        user = db.query(EndUser).filter(EndUser.id == booking.user_id).first()
        user_email = user.email if user else None

    return BookingResponse(
        id=booking.id,
        trip_id=booking.trip_id,
        user_id=booking.user_id,
        seats_booked=booking.seats_booked,
        source=booking.source,
        status=booking.status,
        created_at=booking.created_at,
        amount_snapshot=booking.amount_snapshot,
        expires_at=booking.expires_at,
        trip_title=trip_title,
        trip_destination=trip_destination,
        trip_start_date=trip_start_date,
        trip_end_date=trip_end_date,
        user_email=user_email,
        num_travelers=booking.num_travelers,
        traveler_details=booking.traveler_details,
        contact_name=booking.contact_name,
        contact_phone=booking.contact_phone,
        contact_email=booking.contact_email,
        price_per_person=booking.price_per_person,
        total_price=booking.total_price,
        currency=booking.currency,
        organizer_note=booking.organizer_note,
        decision_reason=booking.decision_reason,
        decision_at=booking.decision_at,
    )


@router.get(
    "",
    response_model=PaginatedOrganizerBookingsResponse,
)
def list_organizer_bookings(
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
    booking_status: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by booking status",
    ),
    trip_id: Optional[str] = Query(None, description="Filter by trip ID"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List booking requests for trips owned by the authenticated organizer.
    If status is not provided, returns all bookings.
    """
    try:
        bookings, total = list_bookings_for_organizer(
            db,
            organizer_id=organizer_id,
            status=booking_status,
            trip_id=trip_id,
            limit=limit,
            offset=offset,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    return PaginatedOrganizerBookingsResponse(
        items=[_serialize_booking(db, booking) for booking in bookings],
        total=total,
        page=(offset // limit) + 1,
        page_size=limit,
    )


@router.post(
    "/{booking_id}/approve",
    response_model=BookingResponse,
)
def approve_booking_request(
    booking_id: str,
    payload: OrganizerBookingReviewRequest | None = None,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """
    Approve a booking request.
    Validates that:
    - The organizer owns the trip
    - There are enough seats available
    Updates booking status to PAYMENT_PENDING and opens a payment window.
    """
    try:
        booking = approve_booking(
            db,
            booking_id,
            organizer_id,
            note=payload.note if payload else None,
            reason=payload.reason if payload else None,
        )
        return _serialize_booking(db, booking)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.post(
    "/{booking_id}/reject",
    response_model=BookingResponse,
)
def reject_booking_request(
    booking_id: str,
    payload: OrganizerBookingReviewRequest | None = None,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """
    Reject a booking request.
    Validates that the organizer owns the trip.
    Updates booking status to CANCELLED.
    """
    try:
        booking = reject_booking(
            db,
            booking_id,
            organizer_id,
            note=payload.note if payload else None,
            reason=payload.reason if payload else None,
        )
        return _serialize_booking(db, booking)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.post(
    "/bulk-review",
    response_model=OrganizerBulkBookingReviewResponse,
)
def bulk_review_booking_requests(
    payload: OrganizerBulkBookingReviewRequest,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    normalized_action = payload.action.strip().lower()
    if normalized_action not in {"approve", "reject"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="action must be either 'approve' or 'reject'",
        )

    processed, errors = bulk_review_bookings(
        db,
        organizer_id,
        booking_ids=payload.booking_ids,
        action=normalized_action,
        note=payload.note,
        reason=payload.reason,
    )

    return OrganizerBulkBookingReviewResponse(
        processed=len(processed),
        failed=len(errors),
        items=[_serialize_booking(db, booking) for booking in processed],
        errors=errors,
    )

