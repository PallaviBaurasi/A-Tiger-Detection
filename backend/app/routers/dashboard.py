from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.image import Image
from app.models.tiger import Tiger, TigerCapture
from app.models.station import CameraStation
from app.models.alert import Alert
from app.models.run import ProcessingRun

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/")
@router.get("")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_images = db.query(Image).count()
    quarantined_images = db.query(Image).filter(Image.status == "QUARANTINED").count()
    retained_images = db.query(Image).filter(Image.status != "QUARANTINED").count()
    review_required = db.query(Image).filter(Image.status == "REVIEW_REQUIRED").count()
    
    active_tigers = db.query(Tiger).filter(Tiger.status == "ACTIVE").count()
    total_stations = db.query(CameraStation).filter(CameraStation.status == "ACTIVE").count()
    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").count()
    total_runs = db.query(ProcessingRun).count()
    
    # Calculate storage saved in GB
    storage_saved_gb = round((quarantined_images * 3.2) / 1024.0, 2)

    # Recent Alerts
    recent_alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(5).all()
    recent_alerts_data = [
        {
            "id": a.id,
            "title": a.title,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "created_at": a.created_at.isoformat(),
            "status": a.status,
            "is_artefact": a.is_artefact
        }
        for a in recent_alerts
    ]

    # Recent Tiger Sightings
    recent_captures = (
        db.query(TigerCapture, Tiger, CameraStation)
        .join(Tiger, TigerCapture.tiger_id == Tiger.id)
        .join(CameraStation, TigerCapture.station_id == CameraStation.id)
        .order_by(TigerCapture.captured_at.desc())
        .limit(6)
        .all()
    )

    recent_sightings_data = [
        {
            "capture_id": cap.id,
            "tiger_code": t.tiger_code,
            "display_name": t.display_name,
            "station_code": stn.station_code,
            "station_name": stn.station_name,
            "captured_at": cap.captured_at.isoformat(),
            "confidence": cap.identification_confidence,
            "method": cap.identification_method
        }
        for cap, t, stn in recent_captures
    ]

    # Occupancy / Tiger statistics overview
    tigers = db.query(Tiger).all()
    tiger_occupancies = [
        {
            "tiger_code": t.tiger_code,
            "display_name": t.display_name,
            "sex": t.sex,
            "last_seen": t.last_seen.isoformat() if t.last_seen else None,
            "captures_count": db.query(TigerCapture).filter(TigerCapture.tiger_id == t.id).count()
        }
        for t in tigers
    ]

    return {
        "kpis": {
            "total_images_processed": total_images,
            "quarantined_blank_images": quarantined_images,
            "retained_images": retained_images,
            "review_queue_count": review_required,
            "active_tigers_identified": active_tigers,
            "active_camera_stations": total_stations,
            "active_alerts_count": active_alerts,
            "total_processing_runs": total_runs,
            "estimated_storage_saved_gb": storage_saved_gb
        },
        "recent_alerts": recent_alerts_data,
        "recent_sightings": recent_sightings_data,
        "tiger_overview": tiger_occupancies
    }
