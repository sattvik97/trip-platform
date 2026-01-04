from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from typing import Optional
import uuid

from app.models.user import User, UserRole
from app.models.organizer import Organizer
from app.schemas.auth import UserRegister

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_data: UserRegister) -> User:
    """
    Create a new user.
    If role is organizer, also creates an Organizer record.
    """
    # Validate role (case-insensitive)
    try:
        role = UserRole(user_data.role.lower())
    except ValueError:
        raise ValueError("Invalid role. Must be 'user' or 'organizer'")

    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise ValueError("User with this email already exists")

    # Hash password
    password_hash = get_password_hash(user_data.password)

    organizer_id = None
    if role == UserRole.organizer:
        organizer_id = str(uuid.uuid4())

        organizer = Organizer(
            id=organizer_id,
            name="",  # Can be updated later
            email=user_data.email,
        )
        db.add(organizer)

    # Create User record
    db_user = User(
        email=user_data.email,
        password_hash=password_hash,
        role=role,              # ✅ enum, not string
        organizer_id=organizer_id,
    )
    
    db.add(db_user)
    
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Failed to create user") from e

