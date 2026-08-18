import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_employee_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False) # e.g. LOGIN, QUARANTINE_RESTORE, TIGER_MATCH_CONFIRM
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    entity_type = Column(String, nullable=True) # e.g. Image, Tiger, Alert
    entity_id = Column(String, nullable=True)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
