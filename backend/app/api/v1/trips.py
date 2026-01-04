from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.crud.trip import list_trips_filtered
from datetime import date

from app.db.deps import get_db
from app.schemas.trip import TripCreate, TripResponse
from app.crud.trip import (
    create_trip,
    get_trip_by_slug,
    list_trips,
    soft_delete_trip,
)
from app.crud.availability import get_available_seats

router = APIRouter()

@router.post(
    "/",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_trip_api(trip: TripCreate, db: Session = Depends(get_db)):
    try:
        return create_trip(db, trip)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/", response_model=List[TripResponse])
def list_trips_api(
    db: Session = Depends(get_db),
    destination: Optional[str] = Query(None),
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None, ge=0),
    start_date: Optional[date] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    trips = list_trips_filtered(
        db,
        destination=destination,
        min_price=min_price,
        max_price=max_price,
        start_date=start_date,
        limit=limit,
        offset=offset,
    )

    return [map_trip_response(db, trip) for trip in trips]


@router.get("/{slug}", response_model=TripResponse)
def get_trip_api(slug: str, db: Session = Depends(get_db)):
    trip = get_trip_by_slug(db, slug)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip.available_seats = get_available_seats(db, trip.id)
    return map_trip_response(db, trip)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_api(slug: str, db: Session = Depends(get_db)):
    success = soft_delete_trip(db, slug)
    if not success:
        raise HTTPException(status_code=404, detail="Trip not found")


def map_trip_response(db: Session, trip):
    return {
        "id": trip.id,
        "slug": trip.slug,
        "organizer_id": trip.organizer_id,
        "title": trip.title,
        "description": trip.description,
        "destination": trip.destination,
        "price": trip.price,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "total_seats": trip.total_seats,
        "available_seats": get_available_seats(db, trip.id),
        "tags": trip.tags,
        "cover_image_url": trip.cover_image_url,
        "gallery_images": trip.gallery_images,
        "itinerary": trip.itinerary,
    }