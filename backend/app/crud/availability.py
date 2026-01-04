from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.booking import Booking
from app.models.trip import Trip

def get_available_seats(db: Session, trip_id: str) -> int:
    booked = (
        db.query(func.coalesce(func.sum(Booking.seats_booked), 0))
        .filter(
            Booking.trip_id == trip_id,
            Booking.status == "confirmed",
        )
        .scalar()
    )

    total = db.query(Trip.total_seats).filter(Trip.id == trip_id).scalar()
    return total - booked
