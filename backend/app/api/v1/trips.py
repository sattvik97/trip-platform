from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.db.deps import get_db
from app.schemas.trip import TripCreate, TripResponse
from app.crud.trip import create_trip, get_trips

router = APIRouter()

@router.post("/", response_model=TripResponse, status_code=201)
def create_trip_api(trip: TripCreate, db: Session = Depends(get_db)):
    return create_trip(db, trip)

@router.get("/", response_model=List[TripResponse])
def list_trips_api(
    destination: Optional[str] = Query(None),
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None, ge=0),
    start_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    return get_trips(
        db,
        destination=destination,
        min_price=min_price,
        max_price=max_price,
        start_date=start_date,
    )
