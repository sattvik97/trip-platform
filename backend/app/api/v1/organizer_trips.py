from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.deps import get_db
from app.core.auth import require_organizer
from app.schemas.trip import (
    OrganizerTripResponse,
    TripUpdate,
    TripCreate,
    OrganizerTripCreate,
    PaginatedOrganizerTripsResponse,
)
from app.crud.trip import (
    list_organizer_trips,
    get_trip_by_id,
    update_trip,
    create_trip,
    duplicate_trip,
    get_booked_seats_count,
    get_trip_publish_blockers,
)

router = APIRouter()


def _serialize_organizer_trip(db: Session, trip) -> OrganizerTripResponse:
    booked_seats = get_booked_seats_count(db, trip.id)
    available_seats = max(int(trip.total_seats or 0) - booked_seats, 0)
    publish_blockers = get_trip_publish_blockers(db, trip) if trip.status.value == "DRAFT" else []

    return OrganizerTripResponse(
        id=trip.id,
        slug=trip.slug,
        title=trip.title,
        description=trip.description,
        destination=trip.destination,
        price=trip.price,
        meeting_point=trip.meeting_point,
        difficulty_level=trip.difficulty_level,
        cancellation_policy=trip.cancellation_policy,
        inclusions=trip.inclusions,
        exclusions=trip.exclusions,
        start_date=trip.start_date,
        end_date=trip.end_date,
        total_seats=trip.total_seats,
        available_seats=available_seats,
        booked_seats=booked_seats,
        status=trip.status,
        tags=trip.tags,
        cover_image_url=trip.cover_image_url,
        gallery_images=trip.gallery_images,
        itinerary=trip.itinerary,
        is_active=trip.is_active,
        created_at=trip.created_at.isoformat() if trip.created_at else "",
        publish_ready=len(publish_blockers) == 0,
        publish_blockers=publish_blockers,
    )


@router.post(
    "",
    response_model=OrganizerTripResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_organizer_trip_api(
    trip_data: OrganizerTripCreate,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """Create a new trip for the authenticated organizer."""
    # Create TripCreate with organizer_id from JWT token
    trip_create = TripCreate(
        **trip_data.model_dump(),
        organizer_id=organizer_id,
    )
    try:
        trip = create_trip(db, trip_create)
        return _serialize_organizer_trip(db, trip)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=PaginatedOrganizerTripsResponse,
)
def list_organizer_trips_api(
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    time: Optional[str] = Query(None, description="Filter by time: upcoming, ongoing, past"),
):
    """List trips owned by the authenticated organizer."""
    page = (offset // limit) + 1
    trips, total = list_organizer_trips(
        db,
        organizer_id=organizer_id,
        limit=limit,
        offset=offset,
        time_filter=time,
    )
    return PaginatedOrganizerTripsResponse(
        items=[_serialize_organizer_trip(db, trip) for trip in trips],
        total=total,
        page=page,
        page_size=limit,
    )


@router.get(
    "/{trip_id}",
    response_model=OrganizerTripResponse,
)
def get_organizer_trip_api(
    trip_id: str,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """Get a specific trip by ID for the authenticated organizer."""
    trip = get_trip_by_id(db, trip_id)
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )
    
    if trip.organizer_id != organizer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this trip",
        )
    
    return _serialize_organizer_trip(db, trip)


@router.put(
    "/{trip_id}",
    response_model=OrganizerTripResponse,
)
def update_organizer_trip_api(
    trip_id: str,
    trip_update: TripUpdate,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    """Update a trip owned by the authenticated organizer. Only DRAFT trips can be edited."""
    try:
        trip = update_trip(db, trip_id, organizer_id, trip_update)
        return _serialize_organizer_trip(db, trip)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this trip",
        )


@router.post(
    "/{trip_id}/duplicate",
    response_model=OrganizerTripResponse,
    status_code=status.HTTP_201_CREATED,
)
def duplicate_organizer_trip_api(
    trip_id: str,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    try:
        trip = duplicate_trip(db, trip_id, organizer_id)
        return _serialize_organizer_trip(db, trip)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to duplicate this trip",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

