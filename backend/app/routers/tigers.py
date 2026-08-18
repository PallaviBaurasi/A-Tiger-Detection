from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tiger import Tiger, TigerCapture, TigerMovementObservation, TigerAreaStatistics
from app.models.station import CameraStation
from app.schemas.tiger import TigerResponse, TigerCaptureResponse
from app.gis.spatial_engine import SpatialEngine

router = APIRouter(prefix="/tigers", tags=["Tigers"])

@router.get("", response_model=List[TigerResponse])
def get_tigers(db: Session = Depends(get_db)):
    tigers = db.query(Tiger).all()
    res = []
    for t in tigers:
        caps = db.query(TigerCapture).filter(TigerCapture.tiger_id == t.id).all()
        stn_count = len(set(c.station_id for c in caps))
        pts = [(c.latitude, c.longitude) for c in caps]
        occ_area = SpatialEngine.calculate_occupied_area(pts) if pts else 0.0

        t_dict = {
            "id": t.id,
            "tiger_code": t.tiger_code,
            "display_name": t.display_name,
            "sex": t.sex,
            "approximate_age": t.approximate_age,
            "first_seen": t.first_seen,
            "last_seen": t.last_seen,
            "status": t.status,
            "profile_image_url": t.profile_image_url,
            "capture_count": len(caps),
            "station_count": stn_count,
            "occupied_area_sq_km": occ_area
        }
        res.append(t_dict)
    return res

@router.get("/{tiger_id}", response_model=TigerResponse)
def get_tiger(tiger_id: int, db: Session = Depends(get_db)):
    t = db.query(Tiger).filter(Tiger.id == tiger_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tiger not found")
    
    caps = db.query(TigerCapture).filter(TigerCapture.tiger_id == t.id).all()
    stn_count = len(set(c.station_id for c in caps))
    pts = [(c.latitude, c.longitude) for c in caps]
    occ_area = SpatialEngine.calculate_occupied_area(pts) if pts else 0.0

    return {
        "id": t.id,
        "tiger_code": t.tiger_code,
        "display_name": t.display_name,
        "sex": t.sex,
        "approximate_age": t.approximate_age,
        "first_seen": t.first_seen,
        "last_seen": t.last_seen,
        "status": t.status,
        "profile_image_url": t.profile_image_url,
        "capture_count": len(caps),
        "station_count": stn_count,
        "occupied_area_sq_km": occ_area
    }

@router.get("/{tiger_id}/captures", response_model=List[TigerCaptureResponse])
def get_tiger_captures(tiger_id: int, db: Session = Depends(get_db)):
    return db.query(TigerCapture).filter(TigerCapture.tiger_id == tiger_id).order_by(TigerCapture.captured_at.desc()).all()

@router.get("/{tiger_id}/movement")
def get_tiger_movement(tiger_id: int, db: Session = Depends(get_db)):
    obs = (
        db.query(TigerMovementObservation, CameraStation)
        .join(CameraStation, TigerMovementObservation.station_id == CameraStation.id)
        .filter(TigerMovementObservation.tiger_id == tiger_id)
        .order_by(TigerMovementObservation.timestamp.asc())
        .all()
    )
    return [
        {
            "id": ob.id,
            "station_code": stn.station_code,
            "station_name": stn.station_name,
            "latitude": ob.latitude,
            "longitude": ob.longitude,
            "timestamp": ob.timestamp.isoformat(),
            "confidence": ob.confidence,
            "region_type": stn.region_type
        }
        for ob, stn in obs
    ]

@router.get("/{tiger_id}/occupancy")
def get_tiger_occupancy(tiger_id: int, db: Session = Depends(get_db)):
    caps = db.query(TigerCapture).filter(TigerCapture.tiger_id == tiger_id).all()
    if not caps:
        return {"occupied_area_sq_km": 0.0, "centroid": [21.65, 79.30], "stations_count": 0}

    pts = [(c.latitude, c.longitude) for c in caps]
    c_lat, c_lon = SpatialEngine.calculate_centroid(pts)
    occ_area = SpatialEngine.calculate_occupied_area(pts)

    return {
        "tiger_id": tiger_id,
        "centroid": {"latitude": c_lat, "longitude": c_lon},
        "occupied_area_sq_km": occ_area,
        "core_area_sq_km": round(occ_area * 0.7, 2),
        "buffer_area_sq_km": round(occ_area * 0.3, 2),
        "capture_station_count": len(set(c.station_id for c in caps)),
        "convex_hull_points": SpatialEngine.calculate_convex_hull(pts)
    }
