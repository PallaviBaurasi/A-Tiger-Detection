import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from app.database import Base

class Tiger(Base):
    __tablename__ = "tigers"

    id = Column(Integer, primary_key=True, index=True)
    tiger_code = Column(String, unique=True, index=True, nullable=False) # e.g. TIGER-001
    display_name = Column(String, nullable=False) # e.g. Collarwali-T15
    sex = Column(String, default="UNKNOWN") # MALE, FEMALE, UNKNOWN
    approximate_age = Column(String, default="Adult") # Cub, Sub-adult, Adult, Senior
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="ACTIVE") # ACTIVE, DISPLACED, MISSING, INACTIVE
    stripe_embedding = Column(Text, nullable=True) # JSON vector representation
    profile_image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class TigerCapture(Base):
    __tablename__ = "tiger_captures"

    id = Column(Integer, primary_key=True, index=True)
    tiger_id = Column(Integer, ForeignKey("tigers.id"), index=True, nullable=False)
    image_id = Column(Integer, ForeignKey("images.id"), index=True, nullable=False)
    station_id = Column(Integer, ForeignKey("camera_stations.id"), index=True, nullable=False)
    captured_at = Column(DateTime, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    identification_confidence = Column(Float, default=0.0)
    identification_method = Column(String, default="AI_MATCH") # AI_MATCH, HUMAN_CONFIRMED, NEW_INDIVIDUAL
    review_status = Column(String, default="CONFIRMED") # CONFIRMED, REVIEW_PENDING, REJECTED

class TigerMovementObservation(Base):
    __tablename__ = "tiger_movement_observations"

    id = Column(Integer, primary_key=True, index=True)
    tiger_id = Column(Integer, ForeignKey("tigers.id"), index=True, nullable=False)
    station_id = Column(Integer, ForeignKey("camera_stations.id"), index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    confidence = Column(Float, default=1.0)
    source_image_id = Column(Integer, ForeignKey("images.id"), nullable=True)

class TigerAreaStatistics(Base):
    __tablename__ = "tiger_area_statistics"

    id = Column(Integer, primary_key=True, index=True)
    tiger_id = Column(Integer, ForeignKey("tigers.id"), index=True, nullable=False)
    processing_run_id = Column(Integer, ForeignKey("processing_runs.id"), nullable=True)
    capture_station_count = Column(Integer, default=0)
    centroid_latitude = Column(Float, nullable=False)
    centroid_longitude = Column(Float, nullable=False)
    occupied_area_sq_km = Column(Float, default=0.0)
    core_area_sq_km = Column(Float, default=0.0)
    buffer_area_sq_km = Column(Float, default=0.0)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)
