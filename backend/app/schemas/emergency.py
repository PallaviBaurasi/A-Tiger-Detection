"""
Emergency Response System — Pydantic Schemas
=============================================
Request/response models for all emergency endpoints.
Phone numbers are never included in API responses — only masked versions.
"""
import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────
# Emergency Contact Schemas
# ─────────────────────────────────────────────

class EmergencyContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., min_length=2, max_length=100)
    primary_phone: str = Field(..., min_length=7, max_length=30,
                                description="E.164 format recommended: +91XXXXXXXXXX")
    secondary_phone: Optional[str] = Field(None, max_length=30)
    priority: int = Field(default=1, ge=1, le=99)
    is_active: bool = True
    notes: Optional[str] = None


class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    primary_phone: Optional[str] = None
    secondary_phone: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class EmergencyContactResponse(BaseModel):
    id: int
    name: str
    role: str
    # NEVER expose raw phone numbers to frontend
    primary_phone_masked: str
    secondary_phone_masked: Optional[str] = None
    priority: int
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Call Attempt Schemas
# ─────────────────────────────────────────────

class CallAttemptResponse(BaseModel):
    id: int
    call_event_id: int
    contact_id: Optional[int] = None
    attempt_number: int
    phone_dialed: Optional[str] = None   # Already masked at DB layer
    attempt_type: str
    status: str
    provider_call_id: Optional[str] = None
    error_message: Optional[str] = None
    initiated_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    duration_seconds: Optional[int] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Emergency Call Event Schemas
# ─────────────────────────────────────────────

class EmergencyCallEventResponse(BaseModel):
    id: int
    alert_id: int
    alert_type: str
    risk_level: str
    reason: Optional[str] = None
    tiger_id: Optional[int] = None
    tiger_code: Optional[str] = None
    camera_id: Optional[str] = None
    zone: Optional[str] = None
    detected_at: Optional[datetime.datetime] = None
    selected_contact_id: Optional[int] = None
    selected_contact_name: Optional[str] = None  # Populated from join in router
    call_status: str
    provider_call_id: Optional[str] = None
    retry_count: int
    max_retries: int
    is_demo: bool
    acknowledged: bool
    acknowledged_at: Optional[datetime.datetime] = None
    acknowledged_by: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    attempts: List[CallAttemptResponse] = []

    class Config:
        from_attributes = True


class AcknowledgeRequest(BaseModel):
    acknowledged_by: str = Field(..., min_length=2, max_length=100)


# ─────────────────────────────────────────────
# System Status Schema
# ─────────────────────────────────────────────

class EmergencySystemStatus(BaseModel):
    demo_mode: bool
    voice_provider: str               # "twilio" | "mock"
    provider_configured: bool         # True if Twilio credentials present
    max_retries: int
    cooldown_minutes: int
    call_timeout_seconds: int
    active_contacts_count: int
    total_events_today: int
    pending_acknowledgements: int
