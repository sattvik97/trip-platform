from dataclasses import dataclass
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
from typing import Optional

from app.core.config import settings
from app.db.deps import get_db
from app.models.user import User, UserRole
from app.models.end_user import EndUser
from app.crud.auth import get_user_by_id
from app.crud.end_user import get_end_user_by_id

security = HTTPBearer()


def get_current_organizer(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate JWT token for organizer and return current organizer user.
    Rejects user tokens.
    """
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Check token type - reject user tokens
        # Default to "organizer" for backward compatibility (old tokens without token_type)
        token_type = payload.get("token_type")
        if token_type is not None and token_type != "organizer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This endpoint requires organizer authentication"
            )
        
        user_id: str = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user ID not found"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Double-check role
    if user.role != UserRole.organizer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires organizer role"
        )
    
    return user


def get_current_end_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> EndUser:
    """
    Validate JWT token for end user and return current end user.
    Rejects organizer tokens.
    """
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Check token type - reject organizer tokens
        token_type = payload.get("token_type")
        if token_type != "user":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This endpoint requires user authentication"
            )
        
        user_id: str = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user ID not found"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = get_end_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


# Legacy function for backward compatibility - now uses get_current_organizer
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate JWT token and return current user (organizer).
    Legacy function - prefer get_current_organizer or get_current_end_user.
    """
    return get_current_organizer(credentials, db)


def require_organizer(
    current_user: User = Depends(get_current_organizer),
) -> str:
    """
    Ensure the current user is an organizer and return organizer_id.
    Rejects user tokens via get_current_organizer.
    """
    if not current_user.organizer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizer ID not found"
        )
    
    return current_user.organizer_id


@dataclass
class PaymentListActor:
    """Either an end user (listing own booking payments) or an organizer (listing by trip ownership)."""

    end_user: Optional[EndUser] = None
    organizer: Optional[User] = None

    def __post_init__(self) -> None:
        if (self.end_user is None) == (self.organizer is None):
            raise ValueError("Exactly one of end_user or organizer must be set")


def get_payment_list_actor(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> PaymentListActor:
    """
    Resolve JWT to end user or organizer for shared payment list/events routes.
    - token_type == \"user\" → end user
    - token_type == \"organizer\" or missing (legacy organizer tokens) → organizer User
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        ) from None
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from None

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user ID not found",
        )

    token_type = payload.get("token_type")

    if token_type == "user":
        end_user = get_end_user_by_id(db, user_id)
        if not end_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return PaymentListActor(end_user=end_user)

    # Organizer (explicit or legacy token without token_type)
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if user.role != UserRole.organizer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires user or organizer authentication",
        )
    return PaymentListActor(organizer=user)
