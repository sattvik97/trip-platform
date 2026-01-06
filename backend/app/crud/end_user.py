from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from passlib.context import CryptContext

from app.models.end_user import EndUser
from app.schemas.user_auth import UserRegister

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def get_end_user_by_email(db: Session, email: str) -> Optional[EndUser]:
    """Get end user by email."""
    return db.query(EndUser).filter(EndUser.email == email).first()


def get_end_user_by_id(db: Session, user_id: str) -> Optional[EndUser]:
    """Get end user by ID."""
    return db.query(EndUser).filter(EndUser.id == user_id).first()


def create_end_user(db: Session, user_data: UserRegister) -> EndUser:
    """
    Create a new end user.
    """
    # Check if user already exists
    existing_user = get_end_user_by_email(db, user_data.email)
    if existing_user:
        raise ValueError("User with this email already exists")

    # Hash password
    password_hash = get_password_hash(user_data.password)

    # Create EndUser record
    db_user = EndUser(
        email=user_data.email,
        password_hash=password_hash,
    )
    
    db.add(db_user)
    
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Failed to create user") from e

