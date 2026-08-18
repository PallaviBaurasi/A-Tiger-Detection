from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.station import CameraStation
from app.schemas.station import CameraStationResponse, CameraStationCreate

router = APIRouter(prefix="/stations", tags=["Camera Stations"])

@router.get("", response_model=List[CameraStationResponse])
def get_stations(db: Session = Depends(get_db)):
    return db.query(CameraStation).order_by(CameraStation.station_code.asc()).all()

@router.get("/{station_id}", response_model=CameraStationResponse)
def get_station(station_id: int, db: Session = Depends(get_db)):
    stn = db.query(CameraStation).filter(CameraStation.id == station_id).first()
    if not stn:
        raise HTTPException(status_code=404, detail="Camera station not found")
    return stn

@router.post("", response_model=CameraStationResponse)
def create_station(req: CameraStationCreate, db: Session = Depends(get_db)):
    stn = CameraStation(**req.dict())
    db.add(stn)
    db.commit()
    db.refresh(stn)
    return stn
