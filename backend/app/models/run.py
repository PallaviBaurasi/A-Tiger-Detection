import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base

class ProcessingRun(Base):
    __tablename__ = "processing_runs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_images = Column(Integer, default=0)
    blank_images = Column(Integer, default=0)
    retained_images = Column(Integer, default=0)
    tiger_images = Column(Integer, default=0)
    new_tigers = Column(Integer, default=0)
    reviewed_images = Column(Integer, default=0)
    processing_time = Column(Float, default=0.0) # Seconds
    storage_saved = Column(Float, default=0.0) # MB saved by safe quarantine
    status = Column(String, default="RUNNING") # RUNNING, COMPLETED, FAILED, COMPLETED_WITH_REVIEW
