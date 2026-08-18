from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.image import Image
from app.schemas.image import ImageResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/images", tags=["Images"])

@router.get("", response_model=List[ImageResponse])
def get_images(
    status: Optional[str] = Query(None),
    station_id: Optional[int] = Query(None),
    subject_type: Optional[str] = Query(None),
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Image)
    if status:
        query = query.filter(Image.status == status)
    if station_id:
        query = query.filter(Image.station_id == station_id)
    if subject_type:
        query = query.filter(Image.subject_type == subject_type)
    
    return query.order_by(Image.captured_at.desc()).offset(offset).limit(limit).all()

@router.get("/{image_id}", response_model=ImageResponse)
def get_image(image_id: int, db: Session = Depends(get_db)):
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    return img

@router.post("/{image_id}/restore", response_model=ImageResponse)
def restore_from_quarantine(image_id: int, db: Session = Depends(get_db)):
    """Restores safely quarantined image back into active review/processing pool."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if img.status != "QUARANTINED":
        raise HTTPException(status_code=400, detail="Image is not in quarantine")

    prev_status = img.status
    img.status = "RETAINED"
    db.commit()
    db.refresh(img)

    AuditService.log(db, "SYSTEM_OFFICER", "QUARANTINE_RESTORE", "Image", img.id, prev_status, img.status)

    return img
