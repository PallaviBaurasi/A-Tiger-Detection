"""
Emergency Response System — Database Models
============================================
Three new tables extend the existing SQLite database.
No existing tables are modified.
"""
import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    ForeignKey, Text, Boolean
)
from app.database import Base


class EmergencyContact(Base):
    """
    Configuration table for emergency contacts / forest officers.
    Administrators configure this through the dashboard.
    Phone numbers are stored server-side only — never sent to the frontend.
    """
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)          # e.g. "Field Director", "Range Officer"
    primary_phone = Column(String(30), nullable=False)  # E.164 format recommended: +91xxxxxxxxxx
    secondary_phone = Column(String(30), nullable=True) # Fallback number for this contact
    priority = Column(Integer, default=1, index=True)   # 1 = first called, 2 = second, etc.
    is_active = Column(Boolean, default=True)           # Inactive contacts are skipped
    notes = Column(Text, nullable=True)                 # Optional: duty zone, shift, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class EmergencyCallEvent(Base):
    """
    One record per CRITICAL alert that triggers the emergency call workflow.
    Tracks the full lifecycle from detection to acknowledgement.
    """
    __tablename__ = "emergency_call_events"

    id = Column(Integer, primary_key=True, index=True)

    # Source alert linkage
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)     # e.g. "VILLAGE_APPROACH"
    risk_level = Column(String(20), nullable=False)     # Always "CRITICAL" for calls
    reason = Column(Text, nullable=True)                # Human-readable reason for the call

    # Context from the detection
    tiger_id = Column(Integer, ForeignKey("tigers.id"), nullable=True)
    tiger_code = Column(String(50), nullable=True)      # e.g. "T-101"
    camera_id = Column(String(50), nullable=True)       # Station code e.g. "STN-V01"
    zone = Column(String(100), nullable=True)           # Zone / region label
    detected_at = Column(DateTime, nullable=True)       # When the AI detected the event

    # Call orchestration state
    selected_contact_id = Column(Integer, ForeignKey("emergency_contacts.id"), nullable=True)
    call_status = Column(String(30), default="PENDING")
    # PENDING → CALLING → ANSWERED | NO_ANSWER | FAILED | ESCALATED | DEMO_CALL | MOCK_SENT
    provider_call_id = Column(String(200), nullable=True)   # Twilio CallSid or mock ID
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    is_demo = Column(Boolean, default=True)             # True when EMERGENCY_DEMO_MODE=true

    # Acknowledgement
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)  # Officer name or "SYSTEM"

    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class CallAttempt(Base):
    """
    Individual call attempt log.
    One EmergencyCallEvent can have many CallAttempts (retries + escalations).
    """
    __tablename__ = "call_attempts"

    id = Column(Integer, primary_key=True, index=True)
    call_event_id = Column(Integer, ForeignKey("emergency_call_events.id"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("emergency_contacts.id"), nullable=True)

    attempt_number = Column(Integer, nullable=False)    # 1, 2, 3 ...
    phone_dialed = Column(String(30), nullable=True)    # Masked in API responses
    attempt_type = Column(String(20), default="PRIMARY") # PRIMARY | SECONDARY | ESCALATION | DEMO
    status = Column(String(30), nullable=False)
    # INITIATED | ANSWERED | NO_ANSWER | BUSY | FAILED | DEMO_SUCCESS | MOCK

    provider_call_id = Column(String(200), nullable=True)
    provider_response = Column(Text, nullable=True)     # Raw provider JSON (for debugging)
    error_message = Column(Text, nullable=True)

    initiated_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
