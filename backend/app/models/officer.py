from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class Officer(Base):
    """
    SQLAlchemy model for Forest Department Officers.
    """
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    shift = Column(String(50), nullable=False)        # "Morning" | "Evening" | "Night"
    shift_start = Column(String(10), nullable=False)  # "06:00" | "14:00" | "22:00"
    shift_end = Column(String(10), nullable=False)    # "14:00" | "22:00" | "06:00"
    duty_location = Column(String(100), nullable=False)
    status = Column(String(20), default="Active")     # "Active" | "Inactive"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
