from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_organizer
from app.crud.organizer import get_organizer_by_id
from app.db.deps import get_db
from app.models.organizer_ledger_entry import OrganizerLedgerEntry
from app.models.organizer_payout import OrganizerPayout
from app.models.user import User
from app.schemas.organizer_ops import (
    OrganizerFinanceSummaryResponse,
    OrganizerLedgerEntryResponse,
    OrganizerPayoutCreateRequest,
    OrganizerPayoutResponse,
    PaginatedOrganizerLedgerResponse,
    PaginatedOrganizerPayoutsResponse,
)
from app.services.organizer_finance import build_finance_summary, request_payout

router = APIRouter()


def _current_organizer(db: Session, current_user: User) -> object:
    organizer = get_organizer_by_id(db, current_user.organizer_id)
    if not organizer:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organizer not found")
    return organizer


@router.get("/summary", response_model=OrganizerFinanceSummaryResponse)
def finance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_organizer),
):
    organizer = _current_organizer(db, current_user)
    return build_finance_summary(db, organizer)


@router.get("/ledger", response_model=PaginatedOrganizerLedgerResponse)
def finance_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_organizer),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    organizer = _current_organizer(db, current_user)
    build_finance_summary(db, organizer)

    query = (
        db.query(OrganizerLedgerEntry)
        .filter(OrganizerLedgerEntry.organizer_id == organizer.id)
        .order_by(OrganizerLedgerEntry.occurred_at.desc(), OrganizerLedgerEntry.id.desc())
    )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedOrganizerLedgerResponse(
        items=[OrganizerLedgerEntryResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/payouts", response_model=PaginatedOrganizerPayoutsResponse)
def finance_payouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_organizer),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    organizer = _current_organizer(db, current_user)
    query = (
        db.query(OrganizerPayout)
        .filter(OrganizerPayout.organizer_id == organizer.id)
        .order_by(OrganizerPayout.created_at.desc(), OrganizerPayout.id.desc())
    )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedOrganizerPayoutsResponse(
        items=[OrganizerPayoutResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/payouts/request", response_model=OrganizerPayoutResponse)
def create_payout_request(
    payload: OrganizerPayoutCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_organizer),
):
    organizer = _current_organizer(db, current_user)
    payout = request_payout(db, organizer=organizer, note=payload.note)
    return OrganizerPayoutResponse.model_validate(payout)
