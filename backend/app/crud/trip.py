from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date
from sqlalchemy import func, or_

from app.models.trip import Trip
from app.models.booking import Booking
from app.schemas.trip import TripCreate, TripUpdate
from app.core.slug import slugify

def create_trip(db: Session, trip: TripCreate) -> Trip:
    slug_source = f"{trip.title}-{trip.destination}-{trip.start_date}"
    base_slug = slugify(slug_source)

    # Check if slug already exists for this organizer and handle collision
    existing = (
        db.query(Trip)
        .filter(
            Trip.organizer_id == trip.organizer_id,
            Trip.slug == base_slug,
        )
        .first()
    )
    
    if existing:
        # Append a counter if slug conflicts
        counter = 1
        while True:
            test_slug = f"{base_slug}-{counter}"
            existing_test = (
                db.query(Trip)
                .filter(
                    Trip.organizer_id == trip.organizer_id,
                    Trip.slug == test_slug,
                )
                .first()
            )
            if not existing_test:
                base_slug = test_slug
                break
            counter += 1
    
    slug = base_slug

    # Check for duplicate (organizer_id, title, start_date) constraint
    existing_duplicate = (
        db.query(Trip)
        .filter(
            Trip.organizer_id == trip.organizer_id,
            Trip.title == trip.title,
            Trip.start_date == trip.start_date,
        )
        .first()
    )
    
    if existing_duplicate:
        raise ValueError(
            f"A trip with the same title '{trip.title}' and start date '{trip.start_date}' already exists. "
            "Please use a different title or start date."
        )

    trip_data = trip.model_dump(exclude={"organizer_id"}, mode="json")
    
    # Convert itinerary Pydantic models to dicts for JSONB storage
    if "itinerary" in trip_data and trip_data["itinerary"] is not None:
        itinerary_list = trip_data["itinerary"]
        trip_data["itinerary"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in itinerary_list]
    
    # Convert enum tags to strings for database storage
    if "tags" in trip_data and trip_data["tags"] is not None:
        trip_data["tags"] = [tag.value if hasattr(tag, 'value') else tag for tag in trip_data["tags"]]

    db_trip = Trip(
        **trip_data,
        organizer_id=trip.organizer_id,
        slug=slug,
    )

    db.add(db_trip)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        # Fallback error message if constraint check somehow missed it
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
    tags: Optional[List[str]] = None,
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

    # Tag filtering with OR operation (trip must have at least one of the tags)
    if tags and len(tags) > 0:
        # Create OR conditions: trip.tags contains any of the requested tags
        tag_conditions = [Trip.tags.contains([tag]) for tag in tags]
        query = query.filter(or_(*tag_conditions))

    return (
        query
        .order_by(Trip.start_date.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def get_trip_by_id(db: Session, trip_id: str) -> Optional[Trip]:
    """Get trip by UUID."""
    return db.query(Trip).filter(Trip.id == trip_id).first()


def list_organizer_trips(
    db: Session,
    organizer_id: str,
    limit: int = 20,
    offset: int = 0,
) -> List[Trip]:
    """List trips owned by a specific organizer."""
    return (
        db.query(Trip)
        .filter(Trip.organizer_id == organizer_id)
        .order_by(Trip.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


def get_booked_seats_count(db: Session, trip_id: str) -> int:
    """Get count of approved/confirmed booked seats for a trip."""
    from sqlalchemy import or_
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
    return int(booked)


def update_trip(
    db: Session,
    trip_id: str,
    organizer_id: str,
    trip_update: TripUpdate,
) -> Trip:
    """
    Update a trip.
    Enforces ownership and validates total_seats >= booked seats.
    """
    trip = get_trip_by_id(db, trip_id)
    
    if not trip:
        raise FileNotFoundError("Trip not found")
    
    # Enforce ownership
    if trip.organizer_id != organizer_id:
        raise PermissionError("You do not have permission to update this trip")
    
    # Validate total_seats if being updated
    if trip_update.total_seats is not None:
        booked_seats = get_booked_seats_count(db, trip_id)
        if trip_update.total_seats < booked_seats:
            raise ValueError(
                f"Cannot reduce total_seats to {trip_update.total_seats}. "
                f"Trip has {booked_seats} confirmed bookings."
            )
    
    # Update fields
    update_data = trip_update.model_dump(exclude_unset=True, mode="json")
    
    # Handle itinerary conversion if provided
    if "itinerary" in update_data and update_data["itinerary"] is not None:
        # Convert Pydantic models to dicts for JSONB storage
        itinerary_list = update_data["itinerary"]
        update_data["itinerary"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in itinerary_list]
    
    # Convert enum tags to strings for database storage
    if "tags" in update_data and update_data["tags"] is not None:
        update_data["tags"] = [tag.value if hasattr(tag, 'value') else tag for tag in update_data["tags"]]
    
    for field, value in update_data.items():
        setattr(trip, field, value)
    
    # Handle slug uniqueness if title/destination/start_date changed
    if any(field in update_data for field in ["title", "destination", "start_date"]):
        slug_source = f"{trip.title}-{trip.destination}-{trip.start_date}"
        new_slug = slugify(slug_source)
        
        # Check if slug already exists for this organizer (excluding current trip)
        existing = (
            db.query(Trip)
            .filter(
                Trip.organizer_id == organizer_id,
                Trip.slug == new_slug,
                Trip.id != trip_id,
            )
            .first()
        )
        
        if existing:
            # Append a suffix if slug conflicts
            counter = 1
            while True:
                test_slug = f"{new_slug}-{counter}"
                existing_test = (
                    db.query(Trip)
                    .filter(
                        Trip.organizer_id == organizer_id,
                        Trip.slug == test_slug,
                        Trip.id != trip_id,
                    )
                    .first()
                )
                if not existing_test:
                    new_slug = test_slug
                    break
                counter += 1
        
        trip.slug = new_slug
    
    try:
        db.commit()
        db.refresh(trip)
        return trip
    except IntegrityError:
        db.rollback()
        raise ValueError("Duplicate trip detected for this organizer")