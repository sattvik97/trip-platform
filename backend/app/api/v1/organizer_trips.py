from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.deps import get_db
from app.core.auth import require_organizer
from app.schemas.trip import OrganizerTripResponse, TripUpdate, TripCreate, OrganizerTripCreate
from app.crud.trip import (
    list_organizer_trips,
    get_trip_by_id,
    update_trip,
    create_trip,
)

router = APIRouter()


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
        # Convert Trip model to OrganizerTripResponse
        # Need to convert created_at datetime to string
        return OrganizerTripResponse(
            id=trip.id,
            slug=trip.slug,
            title=trip.title,
            description=trip.description,
            destination=trip.destination,
            price=trip.price,
            start_date=trip.start_date,
            end_date=trip.end_date,
            total_seats=trip.total_seats,
            status=trip.status,
            tags=trip.tags,
            cover_image_url=trip.cover_image_url,
            gallery_images=trip.gallery_images,
            itinerary=trip.itinerary,
            is_active=trip.is_active,
            created_at=trip.created_at.isoformat() if trip.created_at else "",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=List[OrganizerTripResponse],
)
def list_organizer_trips_api(
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    time: Optional[str] = Query(None, description="Filter by time: upcoming, ongoing, past"),
):
    """List trips owned by the authenticated organizer."""
    trips = list_organizer_trips(
        db,
        organizer_id=organizer_id,
        limit=limit,
        offset=offset,
        time_filter=time,
    )
    # Convert Trip models to OrganizerTripResponse, handling created_at datetime to string
    return [
        OrganizerTripResponse(
            id=trip.id,
            slug=trip.slug,
            title=trip.title,
            description=trip.description,
            destination=trip.destination,
            price=trip.price,
            start_date=trip.start_date,
            end_date=trip.end_date,
            total_seats=trip.total_seats,
            status=trip.status,
            tags=trip.tags,
            cover_image_url=trip.cover_image_url,
            gallery_images=trip.gallery_images,
            itinerary=trip.itinerary,
            is_active=trip.is_active,
            created_at=trip.created_at.isoformat() if trip.created_at else "",
        )
        for trip in trips
    ]


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
    
    return OrganizerTripResponse(
        id=trip.id,
        slug=trip.slug,
        title=trip.title,
        description=trip.description,
        destination=trip.destination,
        price=trip.price,
        start_date=trip.start_date,
        end_date=trip.end_date,
        total_seats=trip.total_seats,
        status=trip.status,
        tags=trip.tags,
        cover_image_url=trip.cover_image_url,
        gallery_images=trip.gallery_images,
        itinerary=trip.itinerary,
        is_active=trip.is_active,
        created_at=trip.created_at.isoformat() if trip.created_at else "",
    )


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
        return OrganizerTripResponse(
            id=trip.id,
            slug=trip.slug,
            title=trip.title,
            description=trip.description,
            destination=trip.destination,
            price=trip.price,
            start_date=trip.start_date,
            end_date=trip.end_date,
            total_seats=trip.total_seats,
            status=trip.status,
            tags=trip.tags,
            cover_image_url=trip.cover_image_url,
            gallery_images=trip.gallery_images,
            itinerary=trip.itinerary,
            is_active=trip.is_active,
            created_at=trip.created_at.isoformat() if trip.created_at else "",
        )
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

