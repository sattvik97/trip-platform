from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import jwt

from app.db.deps import get_db
from app.core.config import settings
from app.schemas.user_auth import UserRegister, UserLogin, Token, UserResponse
from app.crud.end_user import (
    create_end_user,
    get_end_user_by_email,
    verify_password,
)

router = APIRouter()


def create_user_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a JWT access token for end users."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + settings.access_token_expire
    
    to_encode.update({"exp": expire})
    # Add token_type to distinguish from organizer tokens
    to_encode["token_type"] = "user"
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    """Register a new end user."""
    try:
        user = create_end_user(db, user_data)
        return UserResponse(id=user.id, email=user.email)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/login",
    response_model=Token,
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """Login and receive JWT token for end users."""
    user = get_end_user_by_email(db, credentials.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Create JWT payload with token_type to distinguish from organizer tokens
    jwt_payload = {
        "sub": user.id,
        "token_type": "user",  # Explicit token type for user
    }
    
    access_token = create_user_access_token(data=jwt_payload)
    
    return Token(access_token=access_token)

