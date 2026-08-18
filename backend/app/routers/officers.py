from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.officer import Officer
from app.schemas.officer import OfficerResponse, OfficerCreate, OfficerUpdate, OfficerStatusUpdate
from app.utils.hash_utils import hash_password

router = APIRouter(prefix="/officers", tags=["Officers Management"])

@router.get("", response_model=List[OfficerResponse])
@router.get("/", response_model=List[OfficerResponse])
def get_all_officers(db: Session = Depends(get_db)):
    """
    Returns all Forest Department officers. Never exposes passwords or hashes.
    """
    officers = db.query(Officer).all()
    return officers

@router.get("/{officer_id}", response_model=OfficerResponse)
def get_officer_by_id(officer_id: str, db: Session = Depends(get_db)):
    """
    Returns specific officer by officer_id (e.g. FRO001). Never exposes passwords.
    """
    officer = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")
    return officer

@router.post("", response_model=OfficerResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=OfficerResponse, status_code=status.HTTP_201_CREATED)
def create_officer(officer_in: OfficerCreate, db: Session = Depends(get_db)):
    """
    Creates a new Forest Department officer with secure password hashing.
    """
    existing = db.query(Officer).filter(Officer.officer_id == officer_in.officer_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Officer ID '{officer_in.officer_id}' already exists")

    hashed_pw = hash_password(officer_in.password)
    off = Officer(
        officer_id=officer_in.officer_id,
        name=officer_in.name,
        designation=officer_in.designation,
        password_hash=hashed_pw,
        shift=officer_in.shift,
        shift_start=officer_in.shift_start,
        shift_end=officer_in.shift_end,
        duty_location=officer_in.duty_location,
        status=officer_in.status
    )
    db.add(off)
    db.commit()
    db.refresh(off)
    return off

@router.put("/{officer_id}", response_model=OfficerResponse)
def update_officer(officer_id: str, officer_in: OfficerUpdate, db: Session = Depends(get_db)):
    """
    Updates officer details.
    """
    off = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not off:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")

    update_data = officer_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(off, key, value)

    db.commit()
    db.refresh(off)
    return off

@router.patch("/{officer_id}/status", response_model=OfficerResponse)
def update_officer_status(officer_id: str, status_in: OfficerStatusUpdate, db: Session = Depends(get_db)):
    """
    Updates officer account status (Active / Inactive).
    """
    off = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not off:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")

    off.status = status_in.status
    db.commit()
    db.refresh(off)
    return off
