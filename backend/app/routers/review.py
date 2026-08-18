import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.image import Image
from app.models.tiger import Tiger, TigerCapture
from app.models.station import CameraStation
from app.schemas.tiger import ReviewAction
from app.ml.stripe_matcher import StripeMatcher
from app.services.audit_service import AuditService

router = APIRouter(prefix="/review", tags=["Human Review Queue"])

@router.get("/queue")
def get_review_queue(db: Session = Depends(get_db)):
    """Returns items requiring officer human review with candidate image & top matching tiger candidates."""
    items = (
        db.query(Image, CameraStation)
        .join(CameraStation, Image.station_id == CameraStation.id)
        .filter(Image.status == "REVIEW_REQUIRED")
        .all()
    )

    known_tigers = db.query(Tiger).all()
    matcher = StripeMatcher()
    
    queue = []
    for img, stn in items:
        cand_emb = matcher.generate_embedding(img.original_path, img.bounding_box)
        known_dict = [
            {"id": t.id, "tiger_code": t.tiger_code, "display_name": t.display_name, "stripe_embedding": t.stripe_embedding}
            for t in known_tigers
        ]
        match_res = matcher.match_against_catalogue(cand_emb, known_dict)

        top_candidates = []
        for match in match_res["ranked_matches"][:3]:
            t_obj = next((t for t in known_tigers if t.id == match["tiger_id"]), None)
            top_candidates.append({
                "tiger_id": match["tiger_id"],
                "tiger_code": match["tiger_code"],
                "display_name": match["display_name"],
                "similarity_score": match["similarity"],
                "profile_image_url": t_obj.profile_image_url if t_obj else None,
                "last_seen": t_obj.last_seen.isoformat() if t_obj and t_obj.last_seen else None
            })

        queue.append({
            "image_id": img.id,
            "filename": img.filename,
            "original_path": img.original_path,
            "captured_at": img.captured_at.isoformat(),
            "station_code": stn.station_code,
            "station_name": stn.station_name,
            "latitude": stn.latitude,
            "longitude": stn.longitude,
            "detection_confidence": img.detection_confidence,
            "subject_detected": img.subject_detected,
            "top_matches": top_candidates
        })

    return queue

@router.post("/{image_id}")
def process_review_decision(
    image_id: int, 
    action: ReviewAction, 
    db: Session = Depends(get_db)
):
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    
    stn = db.query(CameraStation).filter(CameraStation.id == img.station_id).first()

    if action.action == "CONFIRM_MATCH":
        if not action.target_tiger_id:
            raise HTTPException(status_code=400, detail="Target tiger ID required for CONFIRM_MATCH")
        
        target_t = db.query(Tiger).filter(Tiger.id == action.target_tiger_id).first()
        if not target_t:
            raise HTTPException(status_code=404, detail="Target tiger not found")

        img.status = "PROCESSED"
        
        cap = TigerCapture(
            tiger_id=target_t.id,
            image_id=img.id,
            station_id=img.station_id,
            captured_at=img.captured_at,
            latitude=stn.latitude if stn else 21.65,
            longitude=stn.longitude if stn else 79.30,
            identification_confidence=1.0,
            identification_method="HUMAN_CONFIRMED",
            review_status="CONFIRMED"
        )
        db.add(cap)
        target_t.last_seen = img.captured_at

    elif action.action == "CREATE_NEW_TIGER":
        img.status = "PROCESSED"
        count = db.query(Tiger).count()
        new_code = f"TIGER-00{count + 1}"
        
        new_t = Tiger(
            tiger_code=new_code,
            display_name=f"Individual {new_code}",
            sex="UNKNOWN",
            approximate_age="Adult",
            first_seen=img.captured_at,
            last_seen=img.captured_at,
            status="ACTIVE"
        )
        db.add(new_t)
        db.flush()

        cap = TigerCapture(
            tiger_id=new_t.id,
            image_id=img.id,
            station_id=img.station_id,
            captured_at=img.captured_at,
            latitude=stn.latitude if stn else 21.65,
            longitude=stn.longitude if stn else 79.30,
            identification_confidence=1.0,
            identification_method="NEW_INDIVIDUAL",
            review_status="CONFIRMED"
        )
        db.add(cap)

    elif action.action == "REJECT":
        img.status = "PROCESSED"
        img.subject_type = "non_tiger"

    db.commit()

    AuditService.log(db, "OFFICER_REVIEWER", f"REVIEW_{action.action}", "Image", img.id, None, action.action)

    return {"status": "SUCCESS", "message": f"Review action {action.action} recorded."}
