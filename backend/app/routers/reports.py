import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models.run import ProcessingRun
from app.models.tiger import Tiger, TigerCapture
from app.models.image import Image
from app.models.alert import Alert
from app.gis.spatial_engine import SpatialEngine

router = APIRouter(prefix="/reports", tags=["Forest Department Intelligence Reports"])

@router.get("/processing/{run_id}")
def get_processing_run_report(run_id: int, db: Session = Depends(get_db)):
    run = db.query(ProcessingRun).filter(ProcessingRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Processing run not found")

    images = db.query(Image).filter(Image.processing_run_id == run_id).all()
    
    return {
        "report_title": f"Pench Tiger Reserve - Camera Trap Triage Audit Report #{run.id}",
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "organization": "Madhya Pradesh Forest Department - Pench Tiger Reserve",
        "run_metrics": {
            "id": run.id,
            "started_at": run.started_at.isoformat(),
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "total_images": run.total_images,
            "blank_images": run.blank_images,
            "quarantine_rate_percent": round((run.blank_images / max(1, run.total_images)) * 100, 1),
            "retained_images": run.retained_images,
            "tiger_images": run.tiger_images,
            "new_tigers_enrolled": run.new_tigers,
            "human_review_required": run.reviewed_images,
            "processing_time_sec": run.processing_time,
            "storage_saved_mb": run.storage_saved
        },
        "scientific_disclaimer": "All safe-quarantined images are retained in secure storage. Tiger identification embeddings are generated via AI feature extraction with officer confirmation audit trails."
    }

@router.get("/tiger/{tiger_id}")
def get_tiger_intelligence_report(tiger_id: int, db: Session = Depends(get_db)):
    t = db.query(Tiger).filter(Tiger.id == tiger_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tiger not found")

    caps = db.query(TigerCapture).filter(TigerCapture.tiger_id == t.id).all()
    pts = [(c.latitude, c.longitude) for c in caps]
    c_lat, c_lon = SpatialEngine.calculate_centroid(pts) if pts else (21.65, 79.30)
    occ_area = SpatialEngine.calculate_occupied_area(pts) if pts else 0.0

    alerts = db.query(Alert).filter(Alert.tiger_id == t.id).all()

    return {
        "report_title": f"Individual Movement & Occupancy Intelligence Dossier: {t.display_name} ({t.tiger_code})",
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "reserve": "Pench Tiger Reserve",
        "tiger": {
            "id": t.id,
            "tiger_code": t.tiger_code,
            "display_name": t.display_name,
            "sex": t.sex,
            "approximate_age": t.approximate_age,
            "first_seen": t.first_seen.isoformat(),
            "last_seen": t.last_seen.isoformat()
        },
        "spatial_metrics": {
            "total_captures": len(caps),
            "unique_stations": len(set(c.station_id for c in caps)),
            "estimated_occupied_area_sq_km": occ_area,
            "core_area_sq_km": round(occ_area * 0.7, 2),
            "buffer_area_sq_km": round(occ_area * 0.3, 2),
            "activity_centroid": {"latitude": c_lat, "longitude": c_lon}
        },
        "alerts_history": [
            {
                "id": a.id,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "title": a.title,
                "created_at": a.created_at.isoformat()
            }
            for a in alerts
        ]
    }

@router.get("/export/csv/{run_id}")
def export_processing_csv(run_id: int, db: Session = Depends(get_db)):
    images = db.query(Image).filter(Image.processing_run_id == run_id).all()
    
    csv_lines = ["image_id,filename,station_id,captured_at,status,subject_detected,confidence,file_size_bytes"]
    for img in images:
        csv_lines.append(f"{img.id},{img.filename},{img.station_id},{img.captured_at},{img.status},{img.subject_detected},{img.detection_confidence},{img.file_size}")

    csv_content = "\n".join(csv_lines)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=pench_processing_run_{run_id}.csv"}
    )
