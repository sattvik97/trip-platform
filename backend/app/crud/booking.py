from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.models.booking import Booking, BookingStatus
from app.models.trip import Trip


def list_bookings_for_organizer(
    db: Session,
    organizer_id: str,
    status: Optional[str] = None,
    trip_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[List[Booking], int]:
    """
    List bookings for trips owned by the organizer.
    Optionally filter by status. If status is None or empty, returns all bookings.
    """
    query = (
        db.query(Booking)
        .join(Trip, Booking.trip_id == Trip.id)
        .filter(Trip.organizer_id == organizer_id)
    )
    if trip_id:
        query = query.filter(Booking.trip_id == trip_id)
    
    # Only filter by status if provided and not empty.
    # Accept legacy names for backward compatibility.
    if status:
        normalized = status.strip().upper()
        if normalized == "APPROVED":
            status_filter = BookingStatus.PAYMENT_PENDING
        elif normalized in {"PENDING", "REVIEW_PENDING"}:
            status_filter = BookingStatus.REVIEW_PENDING
        elif normalized == "REJECTED":
            status_filter = BookingStatus.CANCELLED
        else:
            try:
                status_filter = BookingStatus(normalized)
            except ValueError as exc:
                raise ValueError("Invalid booking status filter") from exc

        query = query.filter(Booking.status == status_filter)
    
    total = query.count()
    return (
        query.order_by(Booking.created_at.desc()).limit(limit).offset(offset).all(),
        total,
    )


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


def approve_booking(
    db: Session,
    booking_id: str,
    organizer_id: str,
    *,
    note: Optional[str] = None,
    reason: Optional[str] = None,
) -> Booking:
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
        trip = db.query(Trip).filter(Trip.id == trip.id).with_for_update().first()
        if not trip:
            raise ValueError("Trip not found for this booking")
        
        # Validate organizer owns the trip
        if trip.organizer_id != organizer_id:
            raise PermissionError("You do not have permission to approve this booking")
        
        # Expire stale approved holds before capacity checks.
        now = datetime.now(timezone.utc)
        db.query(Booking).filter(
            Booking.trip_id == trip.id,
            Booking.status == BookingStatus.PAYMENT_PENDING,
            Booking.expires_at.is_not(None),
            Booking.expires_at < now,
        ).update(
            {Booking.status: BookingStatus.EXPIRED},
            synchronize_session=False,
        )

        # Status transition guard: Only REVIEW_PENDING can be approved for payment.
        if booking.status == BookingStatus.CONFIRMED:
            raise ValueError("Booking is already confirmed")
        if booking.status == BookingStatus.CANCELLED:
            raise ValueError("Cannot approve a cancelled booking")
        if booking.status == BookingStatus.PAYMENT_PENDING:
            raise ValueError("Booking is already approved and awaiting payment")
        if booking.status == BookingStatus.EXPIRED:
            raise ValueError("Cannot approve an expired booking")
        if booking.status != BookingStatus.REVIEW_PENDING:
            raise ValueError(f"Cannot approve booking with status: {booking.status}")
        
        # Re-check seat availability atomically within transaction
        # Use num_travelers if available, otherwise fall back to seats_booked
        requested_seats = booking.num_travelers if booking.num_travelers else booking.seats_booked
        available = get_available_seats(db, trip.id)
        
        if requested_seats > available:
            raise ValueError(
                f"Not enough seats available. Available: {available}, Requested: {requested_seats}"
            )
        
        # Move booking into a time-boxed payment hold.
        booking.status = BookingStatus.PAYMENT_PENDING
        booking.expires_at = now + timedelta(minutes=10)
        booking.organizer_note = note.strip() if note else booking.organizer_note
        booking.decision_reason = reason.strip() if reason else booking.decision_reason
        booking.decision_at = now
        db.commit()
        db.refresh(booking)
        
        return booking
    except Exception:
        db.rollback()
        raise


def reject_booking(
    db: Session,
    booking_id: str,
    organizer_id: str,
    *,
    note: Optional[str] = None,
    reason: Optional[str] = None,
) -> Booking:
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
        
        # Status transition guard: REVIEW_PENDING and PAYMENT_PENDING can be cancelled by organizer
        if booking.status == BookingStatus.CANCELLED:
            raise ValueError("Booking is already cancelled")
        if booking.status == BookingStatus.CONFIRMED:
            raise ValueError("Cannot cancel a confirmed booking")
        if booking.status == BookingStatus.EXPIRED:
            raise ValueError("Booking is already expired")
        if booking.status not in (BookingStatus.REVIEW_PENDING, BookingStatus.PAYMENT_PENDING):
            raise ValueError(f"Cannot reject booking with status: {booking.status}")

        # Update status to CANCELLED
        booking.status = BookingStatus.CANCELLED
        booking.expires_at = None
        booking.organizer_note = note.strip() if note else booking.organizer_note
        booking.decision_reason = reason.strip() if reason else booking.decision_reason
        booking.decision_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(booking)
        
        return booking
    except Exception:
        db.rollback()
        raise


def bulk_review_bookings(
    db: Session,
    organizer_id: str,
    *,
    booking_ids: List[str],
    action: str,
    note: Optional[str] = None,
    reason: Optional[str] = None,
) -> tuple[List[Booking], List[dict[str, str]]]:
    processed: List[Booking] = []
    errors: List[dict[str, str]] = []

    for booking_id in booking_ids:
        try:
            if action == "approve":
                processed.append(
                    approve_booking(db, booking_id, organizer_id, note=note, reason=reason)
                )
            elif action == "reject":
                processed.append(
                    reject_booking(db, booking_id, organizer_id, note=note, reason=reason)
                )
            else:
                errors.append({"booking_id": booking_id, "message": "Unsupported bulk action"})
        except (ValueError, PermissionError) as exc:
            errors.append({"booking_id": booking_id, "message": str(exc)})

    return processed, errors

