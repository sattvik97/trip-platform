from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.deps import get_db
from app.schemas.organizer import OrganizerCreate, OrganizerResponse
from app.crud.organizer import create_organizer, list_organizers

router = APIRouter()

@router.post(
    "",
    response_model=OrganizerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_organizer_api(
    organizer: OrganizerCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_organizer(db, organizer)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.get(
    "",
    response_model=List[OrganizerResponse],
)
def list_organizers_api(db: Session = Depends(get_db)):
    return list_organizers(db)
