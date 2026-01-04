from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date

from app.models.trip import Trip
from app.schemas.trip import TripCreate
from app.core.slug import slugify

def create_trip(db: Session, trip: TripCreate) -> Trip:
    slug_source = f"{trip.title}-{trip.destination}-{trip.start_date}"
    slug = slugify(slug_source)

    db_trip = Trip(
        **trip.model_dump(exclude={"organizer_id"}),
        organizer_id=trip.organizer_id,
        slug=slug,
    )

    db.add(db_trip)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Duplicate trip detected for this organizer")
    db.refresh(db_trip)
    return db_trip


def get_trip_by_slug(db: Session, slug: str) -> Optional[Trip]:
    return (
        db.query(Trip)
        .filter(Trip.slug == slug, Trip.is_active.is_(True))
        .first()
    )


def list_trips(db: Session):
    return (
        db.query(Trip)
        .filter(Trip.is_active.is_(True))
        .order_by(Trip.start_date.asc())
        .all()
    )


def soft_delete_trip(db: Session, slug: str) -> bool:
    trip = db.query(Trip).filter(Trip.slug == slug).first()
    if not trip:
        return False

    trip.is_active = False
    db.commit()
    return True

def list_trips_filtered(
    db: Session,
    *,
    destination: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    start_date: Optional[date] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[Trip]:
    query = db.query(Trip).filter(Trip.is_active.is_(True))

    if destination:
        query = query.filter(Trip.destination.ilike(f"%{destination}%"))

    if min_price is not None:
        query = query.filter(Trip.price >= min_price)

    if max_price is not None:
        query = query.filter(Trip.price <= max_price)

    if start_date:
        query = query.filter(Trip.start_date >= start_date)

    return (
        query
        .order_by(Trip.start_date.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )