from sqlalchemy.orm import Session
from app.models.organizer import Organizer
from app.schemas.organizer import OrganizerCreate
from sqlalchemy.exc import IntegrityError

def create_organizer(db: Session, organizer: OrganizerCreate) -> Organizer:
    db_organizer = Organizer(**organizer.model_dump())
    db.add(db_organizer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Organizer with this email already exists")
    db.refresh(db_organizer)
    return db_organizer

def list_organizers(db: Session):
    return db.query(Organizer).order_by(Organizer.created_at.desc()).all()
