from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.crud.trip import list_trips_filtered
from datetime import date
from pydantic import BaseModel, conint, EmailStr, Field

from app.db.deps import get_db
from app.schemas.trip import TripCreate, TripResponse
from app.crud.trip import (
    create_trip,
    get_trip_by_slug,
    get_trip_by_id,
    list_trips,
    soft_delete_trip,
)
from app.crud.availability import get_available_seats
from app.core.auth import get_current_end_user
from app.models.booking import Booking
from app.models.end_user import EndUser
from app.models.organizer import Organizer

router = APIRouter()

@router.post(
    "/",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_trip_api(trip: TripCreate, db: Session = Depends(get_db)):
    try:
        return create_trip(db, trip)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/", response_model=List[TripResponse])
def list_trips_api(
    db: Session = Depends(get_db),
    destination: Optional[str] = Query(None),
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None, ge=0),
    start_date: Optional[date] = Query(None),
    tag: Optional[List[str]] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    trips = list_trips_filtered(
        db,
        destination=destination,
        min_price=min_price,
        max_price=max_price,
        start_date=start_date,
        tags=tag,
        limit=limit,
        offset=offset,
    )

    return [map_trip_response(db, trip) for trip in trips]


@router.get("/{slug}", response_model=TripResponse)
def get_trip_api(slug: str, db: Session = Depends(get_db)):
    trip = get_trip_by_slug(db, slug)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip.available_seats = get_available_seats(db, trip.id)
    return map_trip_response(db, trip)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_api(slug: str, db: Session = Depends(get_db)):
    success = soft_delete_trip(db, slug)
    if not success:
        raise HTTPException(status_code=404, detail="Trip not found")


class TravelerDetail(BaseModel):
    name: str = Field(..., min_length=1)
    age: conint(gt=0, le=120)
    gender: str = Field(..., min_length=1)
    profession: Optional[str] = None


class BookingRequest(BaseModel):
    num_travelers: conint(gt=0)
    travelers: List[TravelerDetail]
    contact_name: str = Field(..., min_length=1)
    contact_phone: str = Field(..., min_length=1)
    contact_email: EmailStr
    price_per_person: conint(gt=0)
    total_price: conint(gt=0)
    currency: str = "INR"


@router.post(
    "/{trip_id}/bookings",
    status_code=status.HTTP_201_CREATED,
)
def create_booking_request(
    trip_id: str,
    payload: BookingRequest,
    db: Session = Depends(get_db),
    current_user: EndUser = Depends(get_current_end_user),
):
    """
    Create a booking request for a trip.
    Requires user authentication.
    Creates a booking with status = PENDING.
    """
    # Get trip
    trip = get_trip_by_id(db, trip_id)
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Check if trip is active
    if not trip.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trip is not active"
        )
    
    # Prevent organizer from booking their own trip
    # Check if the trip's organizer email matches the current user's email
    organizer = db.query(Organizer).filter(Organizer.id == trip.organizer_id).first()
    if organizer and organizer.email.lower() == current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organizers cannot book their own trips"
        )
    
    # Validate number of travelers matches traveler details
    if len(payload.travelers) != payload.num_travelers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of travelers must match the number of traveler details provided"
        )
    
    # Validate price matches trip price
    if payload.price_per_person != trip.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price per person does not match trip price"
        )
    
    # Validate total price calculation
    expected_total = payload.price_per_person * payload.num_travelers
    if payload.total_price != expected_total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total price calculation is incorrect"
        )
    
    # Check for duplicate PENDING booking by the same user for the same trip
    from app.crud.booking import get_user_booking_for_trip
    existing_booking = get_user_booking_for_trip(db, current_user.id, trip_id)
    
    if existing_booking and existing_booking.status == "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending booking request for this trip"
        )
    
    # Convert traveler details to JSONB format
    traveler_details_json = [traveler.model_dump() for traveler in payload.travelers]
    
    # Create booking with status PENDING
    # Note: PENDING bookings do NOT reduce available seats (only confirmed bookings do)
    booking = Booking(
        trip_id=trip_id,
        user_id=current_user.id,
        seats_booked=payload.num_travelers,
        source="user",
        status="PENDING",
        num_travelers=payload.num_travelers,
        traveler_details=traveler_details_json,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        price_per_person=payload.price_per_person,
        total_price=payload.total_price,
        currency=payload.currency,
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    return {
        "message": "Booking request submitted successfully",
        "booking_id": booking.id,
        "status": booking.status,
    }


def map_trip_response(db: Session, trip):
    return {
        "id": trip.id,
        "slug": trip.slug,
        "organizer_id": trip.organizer_id,
        "title": trip.title,
        "description": trip.description,
        "destination": trip.destination,
        "price": trip.price,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "total_seats": trip.total_seats,
        "available_seats": get_available_seats(db, trip.id),
        "tags": trip.tags,
        "cover_image_url": trip.cover_image_url,
        "gallery_images": trip.gallery_images,
        "itinerary": trip.itinerary,
    }