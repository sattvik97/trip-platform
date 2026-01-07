from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date
from sqlalchemy import func, or_, literal

from app.models.trip import Trip, TripStatus
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
    """
    Get trip by slug for public display.
    Never shows DRAFT trips or past trips.
    """
    today = date.today()
    return (
        db.query(Trip)
        .filter(
            Trip.slug == slug,
            Trip.is_active.is_(True),
            Trip.status != TripStatus.DRAFT,
            Trip.end_date >= today,  # Never show past trips
        )
        .first()
    )


def list_trips(db: Session):
    """
    List published trips for public display.
    Never shows DRAFT trips or past trips.
    """
    today = date.today()
    return (
        db.query(Trip)
        .filter(
            Trip.is_active.is_(True),
            Trip.status == TripStatus.PUBLISHED,
            Trip.end_date >= today,  # Never show past trips
        )
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
    """
    List published trips for public display.
    Never shows DRAFT trips or past trips.
    """
    today = date.today()
    query = (
        db.query(Trip)
        .filter(
            Trip.is_active.is_(True),
            Trip.status == TripStatus.PUBLISHED,
            Trip.end_date >= today,  # Never show past trips
        )
    )

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


def search_trips(
    db: Session,
    *,
    q: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    range_start: Optional[date] = None,
    range_end: Optional[date] = None,
    month: Optional[str] = None,
    people: Optional[int] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_days: Optional[int] = None,
    max_days: Optional[int] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[Trip]:
    """
    Optimized trip search with structured filters.
    Only returns PUBLISHED trips with start_date >= today.
    Uses indexed fields only and avoids unnecessary joins.
    
    Supports flexible date filtering:
    - Exact dates: start_date, end_date
    - Flexible range: range_start, range_end (trip dates within range)
    - Month: month (YYYY-MM format)
    
    Duration filtering: min_days, max_days (calculated as end_date - start_date + 1)
    
    Future-proofing: Structure allows vector search to be added later
    by extending the query conditions without breaking this API.
    """
    from datetime import timedelta
    from calendar import monthrange
    
    today = date.today()
    
    # Base query: only PUBLISHED trips with start_date >= today
    query = (
        db.query(Trip)
        .filter(
            Trip.is_active.is_(True),
            Trip.status == TripStatus.PUBLISHED,
            Trip.start_date >= today,  # Only future trips
        )
    )
    
    # Text search: q matches title or destination (ILIKE for case-insensitive)
    if q:
        q_pattern = f"%{q}%"
        query = query.filter(
            or_(
                Trip.title.ilike(q_pattern),
                Trip.destination.ilike(q_pattern),
            )
        )
    
    # Date filtering: Priority order
    # 1. Month filter (YYYY-MM)
    if month:
        try:
            year, month_num = map(int, month.split('-'))
            # Get first and last day of month
            first_day = date(year, month_num, 1)
            last_day = date(year, month_num, monthrange(year, month_num)[1])
            # Trip start_date should be within the month
            query = query.filter(
                Trip.start_date >= first_day,
                Trip.start_date <= last_day,
            )
        except (ValueError, IndexError):
            # Invalid month format, ignore
            pass
    # 2. Flexible range (range_start, range_end)
    elif range_start or range_end:
        if range_start:
            query = query.filter(Trip.start_date >= range_start)
        if range_end:
            query = query.filter(Trip.end_date <= range_end)
    # 3. Exact dates (start_date, end_date)
    else:
        if start_date:
            query = query.filter(Trip.start_date >= start_date)
        if end_date:
            query = query.filter(Trip.end_date <= end_date)
    
    # Price range filters
    if min_price is not None:
        query = query.filter(Trip.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Trip.price <= max_price)
    
    # Duration filters: min_days, max_days
    # Duration = (end_date - start_date + 1)
    # In PostgreSQL, DATE - DATE returns an INTEGER (number of days)
    if min_days is not None or max_days is not None:
        # Calculate duration: PostgreSQL date subtraction returns integer days
        # We add 1 to include both start and end dates in the count
        # Using literal(1) to ensure proper SQL generation
        duration_days = (Trip.end_date - Trip.start_date) + literal(1)
        
        if min_days is not None:
            query = query.filter(duration_days >= min_days)
        if max_days is not None:
            query = query.filter(duration_days <= max_days)
    
    # Availability filter: available_seats >= people
    # Uses a correlated subquery for efficient filtering
    if people is not None and people > 0:
        # Correlated subquery to calculate booked seats for each trip
        booked_seats_subquery = (
            db.query(func.coalesce(func.sum(Booking.seats_booked), 0))
            .filter(
                Booking.trip_id == Trip.id,
                or_(
                    Booking.status == "APPROVED",
                    Booking.status == "confirmed",  # Legacy support
                )
            )
            .correlate(Trip)
            .as_scalar()
        )
        
        # Filter: total_seats - booked_seats >= people
        query = query.filter(
            Trip.total_seats - func.coalesce(booked_seats_subquery, 0) >= people
        )
    
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
    time_filter: Optional[str] = None,
) -> List[Trip]:
    """
    List trips owned by a specific organizer.
    time_filter: 'upcoming', 'ongoing', 'past', or None for all
    """
    from datetime import date
    today = date.today()
    
    query = db.query(Trip).filter(Trip.organizer_id == organizer_id)
    
    if time_filter == "upcoming":
        query = query.filter(Trip.start_date > today)
    elif time_filter == "ongoing":
        query = query.filter(
            Trip.start_date <= today,
            Trip.end_date >= today
        )
    elif time_filter == "past":
        query = query.filter(Trip.end_date < today)
    # If time_filter is None or empty, return all trips
    
    return (
        query
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
    Enforces ownership, validates total_seats >= booked seats, and only allows editing DRAFT trips.
    """
    trip = get_trip_by_id(db, trip_id)
    
    if not trip:
        raise FileNotFoundError("Trip not found")
    
    # Enforce ownership
    if trip.organizer_id != organizer_id:
        raise PermissionError("You do not have permission to update this trip")
    
    # Only DRAFT trips can be edited
    if trip.status != TripStatus.DRAFT:
        raise ValueError("Only draft trips can be edited")
    
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


def publish_trip(db: Session, trip_id: str, organizer_id: str) -> Trip:
    """
    Transition a trip from DRAFT to PUBLISHED.
    Enforces ownership, valid lifecycle transition, and minimum image requirement.
    """
    from app.crud.trip_image import count_trip_images
    
    trip = get_trip_by_id(db, trip_id)

    if not trip:
        raise FileNotFoundError("Trip not found")

    if trip.organizer_id != organizer_id:
        raise PermissionError("You do not have permission to update this trip")

    if trip.status != TripStatus.DRAFT:
        raise ValueError("Only DRAFT trips can be published")
    
    # Check minimum image requirement
    image_count = count_trip_images(db, trip_id)
    if image_count == 0:
        raise ValueError("Please add at least one image before publishing the trip")

    trip.status = TripStatus.PUBLISHED
    db.commit()
    db.refresh(trip)
    return trip


def archive_trip(db: Session, trip_id: str, organizer_id: str) -> Trip:
    """
    Transition a trip from PUBLISHED to ARCHIVED.
    Enforces ownership and valid lifecycle transition.
    """
    trip = get_trip_by_id(db, trip_id)

    if not trip:
        raise FileNotFoundError("Trip not found")

    if trip.organizer_id != organizer_id:
        raise PermissionError("You do not have permission to update this trip")

    if trip.status != TripStatus.PUBLISHED:
        raise ValueError("Only PUBLISHED trips can be archived")

    trip.status = TripStatus.ARCHIVED
    db.commit()
    db.refresh(trip)
    return trip


def unarchive_trip(db: Session, trip_id: str, organizer_id: str) -> Trip:
    """
    Transition a trip from ARCHIVED to DRAFT.
    Enforces ownership and valid lifecycle transition.
    """
    trip = get_trip_by_id(db, trip_id)

    if not trip:
        raise FileNotFoundError("Trip not found")

    if trip.organizer_id != organizer_id:
        raise PermissionError("You do not have permission to update this trip")

    if trip.status != TripStatus.ARCHIVED:
        raise ValueError("Only ARCHIVED trips can be unarchived")

    trip.status = TripStatus.DRAFT
    db.commit()
    db.refresh(trip)
    return trip


def get_weekend_getaways(db: Session) -> List[Trip]:
    """
    Get weekend getaways for the next upcoming weekend.
    Definition:
    - status == PUBLISHED
    - Starts on Friday or Saturday
    - Ends on Sunday or Monday
    - Duration <= 4 days
    - Occurs in the NEXT upcoming weekend only
    """
    from datetime import date, timedelta
    
    today = date.today()
    today_weekday = today.weekday()  # 0=Monday, 4=Friday, 6=Sunday
    
    # Find next Friday
    # If today is Friday (4), we want next Friday (7 days away)
    # If today is Saturday (5), we want next Friday (6 days away)
    # If today is Sunday (6), we want next Friday (5 days away)
    # If today is Monday (0), we want next Friday (4 days away)
    # If today is Tuesday (1), we want next Friday (3 days away)
    # If today is Wednesday (2), we want next Friday (2 days away)
    # If today is Thursday (3), we want next Friday (1 day away)
    
    if today_weekday == 4:  # Today is Friday
        days_until_friday = 7
    elif today_weekday == 5:  # Today is Saturday
        days_until_friday = 6
    elif today_weekday == 6:  # Today is Sunday
        days_until_friday = 5
    else:  # Monday (0) through Thursday (3)
        days_until_friday = (4 - today_weekday) % 7
        if days_until_friday == 0:
            days_until_friday = 7
    
    next_friday = today + timedelta(days=days_until_friday)
    
    # Next Monday is 3 days after Friday
    next_monday = next_friday + timedelta(days=3)
    
    # Query trips that:
    # - Are PUBLISHED and active
    # - Start date is within the weekend range (Friday to Saturday)
    # - End date is within the weekend range (Sunday to Monday)
    # - Start date >= next_friday and end_date <= next_monday
    query = (
        db.query(Trip)
        .filter(
            Trip.is_active.is_(True),
            Trip.status == TripStatus.PUBLISHED,
            Trip.start_date >= next_friday,
            Trip.start_date <= next_friday + timedelta(days=1),  # Friday or Saturday
            Trip.end_date >= next_monday - timedelta(days=1),  # Sunday or Monday
            Trip.end_date <= next_monday,
        )
    )
    
    trips = query.all()
    
    # Filter by:
    # 1. Start date is Friday (4) or Saturday (5)
    # 2. End date is Sunday (6) or Monday (0)
    # 3. Duration <= 4 days
    weekend_trips = []
    for trip in trips:
        start_weekday = trip.start_date.weekday()
        end_weekday = trip.end_date.weekday()
        duration = (trip.end_date - trip.start_date).days + 1
        
        if (
            start_weekday in [4, 5]  # Friday or Saturday
            and end_weekday in [6, 0]  # Sunday or Monday
            and duration <= 4
        ):
            weekend_trips.append(trip)
    
    return weekend_trips