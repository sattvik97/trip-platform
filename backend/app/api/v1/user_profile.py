from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_end_user
from app.crud.end_user import update_end_user_profile
from app.db.deps import get_db
from app.models.end_user import EndUser
from app.schemas.user_auth import UserProfileResponse, UserProfileUpdate

router = APIRouter()


@router.get("", response_model=UserProfileResponse)
def get_user_profile(
    current_user: EndUser = Depends(get_current_end_user),
):
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
    )


@router.patch("", response_model=UserProfileResponse)
def update_user_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: EndUser = Depends(get_current_end_user),
):
    user = update_end_user_profile(
        db,
        user=current_user,
        profile_update=payload,
    )
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
    )
