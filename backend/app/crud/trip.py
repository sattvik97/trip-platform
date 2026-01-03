from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.trip import Trip
from app.schemas.trip import TripCreate
from datetime import date

def create_trip(db: Session, trip: TripCreate) -> Trip:
    db_trip = Trip(**trip.model_dump())
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

def get_trips(
    db: Session,
    destination: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    start_date: Optional[date] = None,
) -> List[Trip]:
    query = db.query(Trip)

    if destination:
        query = query.filter(Trip.destination.ilike(f"%{destination}%"))
    if min_price is not None:
        query = query.filter(Trip.price >= min_price)
    if max_price is not None:
        query = query.filter(Trip.price <= max_price)
    if start_date:
        query = query.filter(Trip.start_date >= start_date)

    return query.order_by(Trip.start_date.asc()).all()
