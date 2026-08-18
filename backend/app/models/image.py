import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from app.database import Base

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_path = Column(String, nullable=False)
    processed_path = Column(String, nullable=True)
    station_id = Column(Integer, ForeignKey("camera_stations.id"), index=True, nullable=False)
    captured_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    file_size = Column(Integer, default=0) # Bytes
    image_hash = Column(String, index=True, nullable=True)
    status = Column(String, index=True, default="PENDING") 
    # Statuses: PENDING, BLANK, QUARANTINED, RETAINED, REVIEW_REQUIRED, PROCESSED, ERROR
    subject_detected = Column(String, default="UNKNOWN") # tiger, leopard, deer, human, blank, etc.
    subject_type = Column(String, default="UNKNOWN")
    detection_confidence = Column(Float, default=0.0)
    bounding_box = Column(Text, nullable=True) # JSON format string: [ymin, xmin, ymax, xmax]
    processing_run_id = Column(Integer, ForeignKey("processing_runs.id"), index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
