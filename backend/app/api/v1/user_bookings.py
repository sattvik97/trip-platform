from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from typing import Optional


from app.db.deps import get_db
from app.core.auth import get_current_end_user
from app.schemas.booking import BookingResponse
from app.crud.booking import list_bookings_for_user, get_booking_by_id, get_user_booking_for_trip
from app.models.end_user import EndUser

router = APIRouter()


@router.get(
    "/",
    response_model=List[BookingResponse],
)
def list_user_bookings(
    db: Session = Depends(get_db),
    current_user: EndUser = Depends(get_current_end_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List bookings for the authenticated user.
    """
    bookings = list_bookings_for_user(
        db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )
    
    # Enrich bookings with trip info
    result = []
    for booking in bookings:
        # Get trip info
        trip = booking.trip
        trip_title = trip.title if trip else None
        trip_destination = trip.destination if trip else None
        trip_start_date = trip.start_date.isoformat() if trip and trip.start_date else None
        trip_end_date = trip.end_date.isoformat() if trip and trip.end_date else None
        
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
                trip_start_date=trip_start_date,
                trip_end_date=trip_end_date,
                user_email=None,  # Not needed for user's own bookings
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


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
)
def get_user_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: EndUser = Depends(get_current_end_user),
):
    """
    Get a specific booking by ID for the authenticated user.
    Users can only view their own bookings.
    """
    booking = get_booking_by_id(db, booking_id)
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Verify the booking belongs to the current user
    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this booking"
        )
    
    # Get trip info
    trip = booking.trip
    trip_title = trip.title if trip else None
    trip_destination = trip.destination if trip else None
    trip_start_date = trip.start_date.isoformat() if trip and trip.start_date else None
    trip_end_date = trip.end_date.isoformat() if trip and trip.end_date else None
    
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
        trip_start_date=trip_start_date,
        trip_end_date=trip_end_date,
        user_email=None,  # Not needed for user's own booking
        num_travelers=booking.num_travelers,
        traveler_details=booking.traveler_details,
        contact_name=booking.contact_name,
        contact_phone=booking.contact_phone,
        contact_email=booking.contact_email,
        price_per_person=booking.price_per_person,
        total_price=booking.total_price,
        currency=booking.currency,
    )


@router.get(
    "/trip/{trip_id}",
    response_model=Optional[BookingResponse],
)
def get_user_booking_for_trip_api(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: EndUser = Depends(get_current_end_user),
):
    """
    Get the user's booking for a specific trip.
    Returns None if no booking exists.
    """
    booking = get_user_booking_for_trip(db, current_user.id, trip_id)
    
    if not booking:
        return None
    
    # Get trip info
    trip = booking.trip
    trip_title = trip.title if trip else None
    trip_destination = trip.destination if trip else None
    trip_start_date = trip.start_date.isoformat() if trip and trip.start_date else None
    trip_end_date = trip.end_date.isoformat() if trip and trip.end_date else None
    
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
        trip_start_date=trip_start_date,
        trip_end_date=trip_end_date,
        user_email=None,
        num_travelers=booking.num_travelers,
        traveler_details=booking.traveler_details,
        contact_name=booking.contact_name,
        contact_phone=booking.contact_phone,
        contact_email=booking.contact_email,
        price_per_person=booking.price_per_person,
        total_price=booking.total_price,
        currency=booking.currency,
    )

