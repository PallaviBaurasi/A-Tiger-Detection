from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.station import CameraStation
from app.models.tiger import Tiger, TigerCapture, TigerMovementObservation
from app.models.alert import Alert
from app.gis.spatial_engine import SpatialEngine

router = APIRouter(prefix="/map", tags=["GIS Map Services"])

@router.get("/observations")
def get_map_observations(db: Session = Depends(get_db)):
    """Returns all camera stations and tiger capture observations for Leaflet GIS map rendering."""
    stations = db.query(CameraStation).all()
    stn_data = [
        {
            "id": s.id,
            "station_code": s.station_code,
            "station_name": s.station_name,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "zone": s.zone,
            "region_type": s.region_type,
            "status": s.status
        }
        for s in stations
    ]

    tigers = db.query(Tiger).all()
    tiger_tracks = []
    for t in tigers:
        obs = (
            db.query(TigerMovementObservation, CameraStation)
            .join(CameraStation, TigerMovementObservation.station_id == CameraStation.id)
            .filter(TigerMovementObservation.tiger_id == t.id)
            .order_by(TigerMovementObservation.timestamp.asc())
            .all()
        )
        pts = [(ob.latitude, ob.longitude) for ob, _ in obs]
        centroid = SpatialEngine.calculate_centroid(pts) if pts else (21.65, 79.30)
        occ_area = SpatialEngine.calculate_occupied_area(pts) if pts else 0.0
        hull = SpatialEngine.calculate_convex_hull(pts) if pts else []

        tiger_tracks.append({
            "tiger_id": t.id,
            "tiger_code": t.tiger_code,
            "display_name": t.display_name,
            "sex": t.sex,
            "status": t.status,
            "last_seen": t.last_seen.isoformat() if t.last_seen else None,
            "occupied_area_sq_km": occ_area,
            "activity_centroid": {"latitude": centroid[0], "longitude": centroid[1]},
            "convex_hull": [{"latitude": p[0], "longitude": p[1]} for p in hull],
            "observations": [
                {
                    "id": ob.id,
                    "latitude": ob.latitude,
                    "longitude": ob.longitude,
                    "timestamp": ob.timestamp.isoformat(),
                    "station_code": stn.station_code,
                    "region_type": stn.region_type
                }
                for ob, stn in obs
            ]
        })

    # Active Alerts on map
    alerts = db.query(Alert, CameraStation).outerjoin(CameraStation, Alert.station_id == CameraStation.id).all()
    alerts_data = [
        {
            "id": a.id,
            "title": a.title,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "station_code": stn.station_code if stn else None,
            "latitude": stn.latitude if stn else 21.65,
            "longitude": stn.longitude if stn else 79.30,
            "is_artefact": a.is_artefact
        }
        for a, stn in alerts
    ]

    return {
        "camera_stations": stn_data,
        "tiger_trajectories": tiger_tracks,
        "alerts": alerts_data
    }

@router.get("/overlap")
def get_territorial_overlap(db: Session = Depends(get_db)):
    """Calculates spatial home range overlap matrix across all registered tiger pairs."""
    tigers = db.query(Tiger).all()
    tiger_profiles = []
    
    for t in tigers:
        caps = db.query(TigerCapture).filter(TigerCapture.tiger_id == t.id).all()
        pts = [(c.latitude, c.longitude) for c in caps]
        c_lat, c_lon = SpatialEngine.calculate_centroid(pts) if pts else (21.65, 79.30)
        area = SpatialEngine.calculate_occupied_area(pts) if pts else 0.0
        
        tiger_profiles.append({
            "id": t.id,
            "code": t.tiger_code,
            "display_name": t.display_name,
            "centroid": (c_lat, c_lon),
            "occupied_area": area
        })

    overlaps = []
    n = len(tiger_profiles)
    for i in range(n):
        for j in range(i + 1, n):
            ov = SpatialEngine.calculate_territorial_overlap(tiger_profiles[i], tiger_profiles[j])
            if ov["overlap_sq_km"] > 0 or ov["distance_km"] < 12.0:
                overlaps.append(ov)

    return overlaps
