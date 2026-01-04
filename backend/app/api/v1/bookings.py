from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, conint

from app.db.deps import get_db
from app.models.booking import Booking
from app.crud.availability import get_available_seats

router = APIRouter()

class OfflineBookingRequest(BaseModel):
    seats: conint(gt=0)

@router.post("/trips/{trip_id}/offline-booking")
def add_offline_booking(trip_id: str, payload: OfflineBookingRequest, db: Session = Depends(get_db)):
    available = get_available_seats(db, trip_id)
    if payload.seats > available:
        raise HTTPException(status_code=400, detail="Not enough seats")

    booking = Booking(
        trip_id=trip_id,
        seats_booked=payload.seats,
        source="offline",
        status="confirmed",
    )
    db.add(booking)
    db.commit()

    return {"message": "Offline booking added"}
