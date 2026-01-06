from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.booking import Booking
from app.models.trip import Trip

def get_available_seats(db: Session, trip_id: str) -> int:
    """
    Calculate available seats for a trip.
    Only APPROVED and confirmed bookings count toward booked seats.
    Supports both "APPROVED" (new) and "confirmed" (legacy) statuses for backward compatibility.
    """
    booked = (
        db.query(func.coalesce(func.sum(Booking.seats_booked), 0))
        .filter(
            Booking.trip_id == trip_id,
            or_(
                Booking.status == "APPROVED",
                Booking.status == "confirmed",  # Legacy support
            ),
        )
        .scalar()
    )

    total = db.query(Trip.total_seats).filter(Trip.id == trip_id).scalar()
    return total - booked
