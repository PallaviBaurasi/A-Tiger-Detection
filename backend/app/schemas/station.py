import datetime
from pydantic import BaseModel
from typing import Optional

class CameraStationBase(BaseModel):
    station_code: str
    station_name: str
    latitude: float
    longitude: float
    zone: str = "Karmajhiri Range"
    region_type: str = "CORE" # CORE, BUFFER, VILLAGE_ADJACENT
    status: str = "ACTIVE"

class CameraStationCreate(CameraStationBase):
    pass

class CameraStationResponse(CameraStationBase):
    id: int
    installation_date: datetime.datetime

    class Config:
        from_attributes = True
