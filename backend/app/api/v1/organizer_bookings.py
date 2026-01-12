from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.deps import get_db
from app.core.auth import require_organizer
from app.schemas.booking import BookingResponse
from app.crud.booking import (
    list_bookings_for_organizer,
    approve_booking,
    reject_booking,
)
from app.models.end_user import EndUser

router = APIRouter()


@router.get(
    "",
    response_model=List[BookingResponse],
)
def list_organizer_bookings(
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
    status: Optional[str] = Query(None, description="Filter by booking status (default: PENDING)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List booking requests for trips owned by the authenticated organizer.
    If status is not provided, returns all bookings.
    """
    bookings = list_bookings_for_organizer(
        db,
        organizer_id=organizer_id,
        status=status,
        limit=limit,
        offset=offset,
    )
    
    # Enrich bookings with trip and user info
    result = []
    for booking in bookings:
        # Get trip info
        trip = booking.trip
        trip_title = trip.title if trip else None
        trip_destination = trip.destination if trip else None
        
        # Get user info if user_id exists
        user_email = None
        if booking.user_id:
            user = db.query(EndUser).filter(EndUser.id == booking.user_id).first()
            user_email = user.email if user else None
        
        result.append(
            BookingResponse(
                id=booking.id,
                trip_id=booking.trip_id,
                user_id=booking.user_id,
                seats_booked=booking.seats_booked,
                source=booking.source,
                status=booking.status,
                created_at=booking.created_at,
                trip_title=trip_title,
                trip_destination=trip_destination,
                user_email=user_email,
                num_travelers=booking.num_travelers,
                traveler_details=booking.traveler_details,
                contact_name=booking.contact_name,
                contact_phone=booking.contact_phone,
                contact_email=booking.contact_email,
                price_per_person=booking.price_per_person,
                total_price=booking.total_price,
                currency=booking.currency,
            )
        )
    
    return result


@router.post(
    "/{booking_id}/approve",
    response_model=BookingResponse,
)
def approve_booking_request(
    booking_id: str,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """
    Approve a booking request.
    Validates that:
    - The organizer owns the trip
    - There are enough seats available
    Updates booking status to APPROVED.
    """
    try:
        booking = approve_booking(db, booking_id, organizer_id)
        
        # Get trip and user info for response
        trip = booking.trip
        trip_title = trip.title if trip else None
        trip_destination = trip.destination if trip else None
        
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
            trip_title=trip_title,
            trip_destination=trip_destination,
            user_email=user_email,
            num_travelers=booking.num_travelers,
            traveler_details=booking.traveler_details,
            contact_name=booking.contact_name,
            contact_phone=booking.contact_phone,
            contact_email=booking.contact_email,
            price_per_person=booking.price_per_person,
            total_price=booking.total_price,
            currency=booking.currency,
        )
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
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """
    Reject a booking request.
    Validates that the organizer owns the trip.
    Updates booking status to REJECTED.
    """
    try:
        booking = reject_booking(db, booking_id, organizer_id)
        
        # Get trip and user info for response
        trip = booking.trip
        trip_title = trip.title if trip else None
        trip_destination = trip.destination if trip else None
        
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
            trip_title=trip_title,
            trip_destination=trip_destination,
            user_email=user_email,
            num_travelers=booking.num_travelers,
            traveler_details=booking.traveler_details,
            contact_name=booking.contact_name,
            contact_phone=booking.contact_phone,
            contact_email=booking.contact_email,
            price_per_person=booking.price_per_person,
            total_price=booking.total_price,
            currency=booking.currency,
        )
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

