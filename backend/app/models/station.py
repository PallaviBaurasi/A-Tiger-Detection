import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base

class CameraStation(Base):
    __tablename__ = "camera_stations"

    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String, unique=True, index=True, nullable=False) # e.g. STN-CORE-01
    station_name = Column(String, nullable=False) # e.g. Karmajhiri Stream North
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    zone = Column(String, default="Karmajhiri Range")
    region_type = Column(String, nullable=False, default="CORE") # CORE, BUFFER, VILLAGE_ADJACENT
    status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE, MAINTENANCE
    installation_date = Column(DateTime, default=datetime.datetime.utcnow)
