from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.organizer import Organizer, OrganizerVerificationStatus
from app.schemas.organizer import (
    OrganizerCreate,
    OrganizerProfileUpdate,
    OrganizerVerificationChecklistItem,
)

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


def get_organizer_by_id(db: Session, organizer_id: str) -> Organizer | None:
    return db.query(Organizer).filter(Organizer.id == organizer_id).first()


def organizer_profile_gaps(organizer: Organizer) -> list[str]:
    gaps: list[str] = []
    if not organizer.name or len(organizer.name.strip()) < 2:
        gaps.append("Add your organizer display name")
    if not organizer.phone:
        gaps.append("Add a primary phone number")
    if not organizer.bio or len(organizer.bio.strip()) < 40:
        gaps.append("Write a short organizer bio")
    if not organizer.support_email:
        gaps.append("Add a support email")
    return gaps


def organizer_verification_checklist(
    organizer: Organizer,
) -> list[OrganizerVerificationChecklistItem]:
    return [
        OrganizerVerificationChecklistItem(
            key="business_profile",
            label="Business profile",
            description="Add a clear organizer name and a bio that explains what trips you run.",
            completed=bool(
                organizer.name
                and organizer.name.strip()
                and organizer.bio
                and len(organizer.bio.strip()) >= 40
            ),
        ),
        OrganizerVerificationChecklistItem(
            key="primary_phone",
            label="Primary phone",
            description="Give travelers and the ops team a reachable phone number.",
            completed=bool(organizer.phone),
        ),
        OrganizerVerificationChecklistItem(
            key="support_channel",
            label="Support contact",
            description="Set at least one support channel that travelers can use before departure.",
            completed=bool(organizer.support_email or organizer.support_phone),
        ),
        OrganizerVerificationChecklistItem(
            key="public_presence",
            label="Public website",
            description="Link a website or public brand page so travelers can verify who you are.",
            completed=bool(organizer.website),
        ),
        OrganizerVerificationChecklistItem(
            key="payout_setup",
            label="Payout setup",
            description="Add the payout method, beneficiary, and payout reference you want us to settle to.",
            completed=bool(
                organizer.payout_method and organizer.payout_beneficiary and organizer.payout_reference
            ),
        ),
    ]


def organizer_can_submit_verification(organizer: Organizer) -> bool:
    if organizer.verification_status == OrganizerVerificationStatus.VERIFIED:
        return False
    if organizer.verification_status == OrganizerVerificationStatus.PENDING:
        return False
    return all(item.completed for item in organizer_verification_checklist(organizer) if item.required)


def organizer_profile_completion_percent(organizer: Organizer) -> int:
    checks = [
        bool(organizer.name and organizer.name.strip()),
        bool(organizer.phone),
        bool(organizer.website),
        bool(organizer.bio and len(organizer.bio.strip()) >= 40),
        bool(organizer.support_email),
        bool(organizer.support_phone),
        bool(organizer.payout_method and organizer.payout_beneficiary and organizer.payout_reference),
        organizer.verification_status in (
            OrganizerVerificationStatus.PENDING,
            OrganizerVerificationStatus.VERIFIED,
        ),
    ]
    completed = sum(1 for item in checks if item)
    return int(round((completed / len(checks)) * 100))


def update_organizer_profile(
    db: Session,
    organizer: Organizer,
    profile_update: OrganizerProfileUpdate,
) -> Organizer:
    if profile_update.name is not None:
        organizer.name = profile_update.name.strip() or organizer.name
    if profile_update.phone is not None:
        organizer.phone = profile_update.phone.strip() or None
    if profile_update.website is not None:
        organizer.website = profile_update.website.strip() or None
    if profile_update.bio is not None:
        organizer.bio = profile_update.bio.strip() or None
    if profile_update.support_email is not None:
        organizer.support_email = str(profile_update.support_email).strip() or None
    if profile_update.support_phone is not None:
        organizer.support_phone = profile_update.support_phone.strip() or None
    if profile_update.payout_method is not None:
        organizer.payout_method = profile_update.payout_method.strip() or None
    if profile_update.payout_beneficiary is not None:
        organizer.payout_beneficiary = profile_update.payout_beneficiary.strip() or None
    if profile_update.payout_reference is not None:
        organizer.payout_reference = profile_update.payout_reference.strip() or None

    db.commit()
    db.refresh(organizer)
    return organizer


def submit_organizer_verification(db: Session, organizer: Organizer) -> Organizer:
    if not organizer_can_submit_verification(organizer):
        raise ValueError("Complete the verification checklist before submitting")

    organizer.verification_status = OrganizerVerificationStatus.PENDING
    organizer.verification_submitted_at = datetime.now(timezone.utc)
    organizer.verification_notes = "Verification submitted and awaiting review."
    db.commit()
    db.refresh(organizer)
    return organizer
