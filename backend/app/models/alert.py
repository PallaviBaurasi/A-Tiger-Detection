import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    tiger_id = Column(Integer, ForeignKey("tigers.id"), index=True, nullable=True)
    alert_type = Column(String, index=True, nullable=False) 
    # RANGE_SHIFT, NEW_STATION, BUFFER_MOVEMENT, VILLAGE_APPROACH, PROLONGED_ABSENCE, DATA_ARTIFACT, REVIEW_REQUIRED
    severity = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    detected_change = Column(Text, nullable=True)
    supporting_evidence = Column(Text, nullable=True) # JSON string with metrics/reasons
    confidence = Column(Float, default=0.90)
    station_id = Column(Integer, ForeignKey("camera_stations.id"), nullable=True)
    is_artefact = Column(String, default="NO") # YES, NO, UNCERTAIN
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    status = Column(String, default="ACTIVE") # ACTIVE, ACKNOWLEDGED, RESOLVED, FALSE_POSITIVE
