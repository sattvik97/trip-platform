from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.booking import Booking, BookingStatus
from app.models.trip import Trip


def get_available_seats(db: Session, trip_id: str) -> int:
    """
    Calculate available seats from bookings table.
    Only approved payment holds and confirmed bookings hold inventory.
    """
    booked = (
        db.query(func.coalesce(func.sum(Booking.seats_booked), 0))
        .filter(
            Booking.trip_id == trip_id,
            Booking.status.in_([BookingStatus.PAYMENT_PENDING, BookingStatus.CONFIRMED]),
        )
        .scalar()
    )

    total = db.query(Trip.total_seats).filter(Trip.id == trip_id).scalar()
    if total is None:
        return 0
    return max(int(total) - int(booked or 0), 0)
