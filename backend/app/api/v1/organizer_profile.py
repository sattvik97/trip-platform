from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_organizer
from app.crud.organizer import (
    get_organizer_by_id,
    organizer_can_submit_verification,
    organizer_profile_completion_percent,
    organizer_profile_gaps,
    organizer_verification_checklist,
    submit_organizer_verification,
    update_organizer_profile,
)
from app.db.deps import get_db
from app.models.user import User
from app.schemas.organizer import OrganizerProfileResponse, OrganizerProfileUpdate

router = APIRouter()


def _serialize_profile(organizer) -> OrganizerProfileResponse:
    gaps = organizer_profile_gaps(organizer)
    return OrganizerProfileResponse(
        id=organizer.id,
        name=organizer.name,
        email=organizer.email,
        phone=organizer.phone,
        website=organizer.website,
        bio=organizer.bio,
        support_email=organizer.support_email,
        support_phone=organizer.support_phone,
        payout_method=organizer.payout_method,
        payout_beneficiary=organizer.payout_beneficiary,
        payout_reference=organizer.payout_reference,
        verification_status=organizer.verification_status,
        verification_notes=organizer.verification_notes,
        verification_submitted_at=organizer.verification_submitted_at,
        profile_completion_percent=organizer_profile_completion_percent(organizer),
        publish_requirements_met=len(gaps) == 0,
        missing_profile_items=gaps,
        verification_checklist=organizer_verification_checklist(organizer),
        can_submit_verification=organizer_can_submit_verification(organizer),
    )


@router.get("", response_model=OrganizerProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_organizer),
):
    organizer = get_organizer_by_id(db, current_user.organizer_id)
    if not organizer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizer not found")
    return _serialize_profile(organizer)


@router.patch("", response_model=OrganizerProfileResponse)
def patch_profile(
    payload: OrganizerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_organizer),
):
    organizer = get_organizer_by_id(db, current_user.organizer_id)
    if not organizer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizer not found")
    organizer = update_organizer_profile(db, organizer, payload)
    return _serialize_profile(organizer)


@router.post("/verification/submit", response_model=OrganizerProfileResponse)
def submit_verification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_organizer),
):
    organizer = get_organizer_by_id(db, current_user.organizer_id)
    if not organizer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizer not found")
    try:
        organizer = submit_organizer_verification(db, organizer)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _serialize_profile(organizer)
