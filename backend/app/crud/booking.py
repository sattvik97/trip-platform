from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from app.models.booking import Booking
from app.models.trip import Trip
from app.models.end_user import EndUser


def list_bookings_for_organizer(
    db: Session,
    organizer_id: str,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[Booking]:
    """
    List bookings for trips owned by the organizer.
    Optionally filter by status. If status is None or empty, returns all bookings.
    """
    query = (
        db.query(Booking)
        .join(Trip, Booking.trip_id == Trip.id)
        .filter(Trip.organizer_id == organizer_id)
    )
    
    # Only filter by status if provided and not empty
    if status:
        query = query.filter(Booking.status == status)
    
    return query.order_by(Booking.created_at.desc()).limit(limit).offset(offset).all()


def get_booking_by_id(db: Session, booking_id: str) -> Optional[Booking]:
    """Get a booking by ID."""
    return db.query(Booking).filter(Booking.id == booking_id).first()


def list_bookings_for_user(
    db: Session,
    user_id: str,
    limit: int = 20,
    offset: int = 0,
) -> List[Booking]:
    """
    List bookings for a specific user.
    """
    return (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def get_user_booking_for_trip(
    db: Session,
    user_id: str,
    trip_id: str,
) -> Optional[Booking]:
    """
    Get the most recent booking for a user on a specific trip.
    Returns None if no booking exists.
    """
    return (
        db.query(Booking)
        .filter(
            Booking.user_id == user_id,
            Booking.trip_id == trip_id,
        )
        .order_by(Booking.created_at.desc())
        .first()
    )


def get_booking_with_trip(db: Session, booking_id: str):
    """Get a booking with its associated trip. Returns (Booking, Trip) or None."""
    booking = (
        db.query(Booking)
        .join(Trip, Booking.trip_id == Trip.id)
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        return None
    return (booking, booking.trip)


def approve_booking(db: Session, booking_id: str, organizer_id: str) -> Booking:
    """
    Approve a booking request.
    Validates organizer ownership and seat availability within a transaction.
    Prevents invalid status transitions.
    Returns the updated booking.
    Raises exceptions for validation failures.
    """
    from app.crud.availability import get_available_seats
    
    # Use a transaction to ensure atomicity
    try:
        # Get booking with trip (lock the booking row for update)
        booking = (
            db.query(Booking)
            .join(Trip, Booking.trip_id == Trip.id)
            .filter(Booking.id == booking_id)
            .with_for_update()  # Row-level lock to prevent race conditions
            .first()
        )
        
        if not booking:
            raise ValueError("Booking not found")
        
        trip = booking.trip
        if not trip:
            raise ValueError("Trip not found for this booking")
        
        # Validate organizer owns the trip
        if trip.organizer_id != organizer_id:
            raise PermissionError("You do not have permission to approve this booking")
        
        # Status transition guard: Only PENDING can be approved
        if booking.status == "APPROVED":
            raise ValueError("Booking is already approved")
        if booking.status == "REJECTED":
            raise ValueError("Cannot approve a rejected booking")
        if booking.status != "PENDING":
            raise ValueError(f"Cannot approve booking with status: {booking.status}")
        
        # Re-check seat availability atomically within transaction
        # Use num_travelers if available, otherwise fall back to seats_booked
        requested_seats = booking.num_travelers if booking.num_travelers else booking.seats_booked
        available = get_available_seats(db, trip.id)
        
        if requested_seats > available:
            raise ValueError(
                f"Not enough seats available. Available: {available}, Requested: {requested_seats}"
            )
        
        # Update status to APPROVED
        booking.status = "APPROVED"
        db.commit()
        db.refresh(booking)
        
        return booking
    except Exception as e:
        db.rollback()
        raise


def reject_booking(db: Session, booking_id: str, organizer_id: str) -> Booking:
    """
    Reject a booking request.
    Validates organizer ownership.
    Prevents invalid status transitions.
    Returns the updated booking.
    Raises exceptions for validation failures.
    """
    try:
        # Get booking with trip
        booking = (
            db.query(Booking)
            .join(Trip, Booking.trip_id == Trip.id)
            .filter(Booking.id == booking_id)
            .with_for_update()  # Row-level lock
            .first()
        )
        
        if not booking:
            raise ValueError("Booking not found")
        
        trip = booking.trip
        if not trip:
            raise ValueError("Trip not found for this booking")
        
        # Validate organizer owns the trip
        if trip.organizer_id != organizer_id:
            raise PermissionError("You do not have permission to reject this booking")
        
        # Status transition guard: Only PENDING can be rejected
        if booking.status == "REJECTED":
            raise ValueError("Booking is already rejected")
        if booking.status == "APPROVED":
            raise ValueError("Cannot reject an approved booking")
        if booking.status != "PENDING":
            raise ValueError(f"Cannot reject booking with status: {booking.status}")
        
        # Update status to REJECTED
        booking.status = "REJECTED"
        db.commit()
        db.refresh(booking)
        
        return booking
    except Exception as e:
        db.rollback()
        raise

