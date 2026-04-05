from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_organizer
from app.crud.organizer import get_organizer_by_id
from app.db.deps import get_db
from app.models.user import User
from app.schemas.organizer_ops import OrganizerFinanceOverviewResponse
from app.services.organizer_finance import build_organizer_overview

router = APIRouter()


@router.get("", response_model=OrganizerFinanceOverviewResponse)
def organizer_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_organizer),
):
    organizer = get_organizer_by_id(db, current_user.organizer_id)
    if not organizer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizer not found")
    return build_organizer_overview(db, organizer)
