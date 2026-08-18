"""
Emergency Response System — API Router
=======================================
All endpoints under /api/emergency

Endpoints:
  GET    /emergency/status              — System status + demo mode flag
  GET    /emergency/contacts            — List all emergency contacts (phones masked)
  POST   /emergency/contacts            — Create new contact
  PUT    /emergency/contacts/{id}       — Update contact
  DELETE /emergency/contacts/{id}       — Delete contact
  GET    /emergency/events              — List all call events (filterable)
  GET    /emergency/events/{id}         — Event detail + all attempts
  POST   /emergency/events/{id}/acknowledge — Acknowledge event
  POST   /emergency/test-call           — Safe DEMO test call
"""
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.emergency import EmergencyContact, EmergencyCallEvent, CallAttempt
from app.services.emergency_alert_service import EmergencyAlertService
from app.schemas.emergency import (
    EmergencyContactCreate,
    EmergencyContactUpdate,
    EmergencyContactResponse,
    EmergencyCallEventResponse,
    CallAttemptResponse,
    AcknowledgeRequest,
    EmergencySystemStatus,
)

router = APIRouter(prefix="/emergency", tags=["🚨 Emergency Response System"])


# ──────────────────────────────────────────────────────────────
# Helper: mask phone number
# ──────────────────────────────────────────────────────────────
def _mask(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    return EmergencyAlertService._mask_phone(phone)


def _contact_to_response(c: EmergencyContact) -> EmergencyContactResponse:
    return EmergencyContactResponse(
        id=c.id,
        name=c.name,
        role=c.role,
        primary_phone_masked=_mask(c.primary_phone),
        secondary_phone_masked=_mask(c.secondary_phone),
        priority=c.priority,
        is_active=c.is_active,
        notes=c.notes,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


def _event_to_response(event: EmergencyCallEvent, db: Session) -> EmergencyCallEventResponse:
    contact_name = None
    if event.selected_contact_id:
        c = db.query(EmergencyContact).filter(EmergencyContact.id == event.selected_contact_id).first()
        contact_name = c.name if c else None

    attempts = (
        db.query(CallAttempt)
        .filter(CallAttempt.call_event_id == event.id)
        .order_by(CallAttempt.attempt_number.asc())
        .all()
    )

    return EmergencyCallEventResponse(
        id=event.id,
        alert_id=event.alert_id,
        alert_type=event.alert_type,
        risk_level=event.risk_level,
        reason=event.reason,
        tiger_id=event.tiger_id,
        tiger_code=event.tiger_code,
        camera_id=event.camera_id,
        zone=event.zone,
        detected_at=event.detected_at,
        selected_contact_id=event.selected_contact_id,
        selected_contact_name=contact_name,
        call_status=event.call_status,
        provider_call_id=event.provider_call_id,
        retry_count=event.retry_count,
        max_retries=event.max_retries,
        is_demo=event.is_demo,
        acknowledged=event.acknowledged,
        acknowledged_at=event.acknowledged_at,
        acknowledged_by=event.acknowledged_by,
        created_at=event.created_at,
        updated_at=event.updated_at,
        attempts=[
            CallAttemptResponse.model_validate(a) for a in attempts
        ],
    )


# ──────────────────────────────────────────────────────────────
# System Status
# ──────────────────────────────────────────────────────────────
@router.get("/status", response_model=EmergencySystemStatus)
def get_emergency_status(db: Session = Depends(get_db)):
    """Returns current system configuration and live counters."""
    provider_configured = bool(
        getattr(settings, "TWILIO_ACCOUNT_SID", None) and
        getattr(settings, "TWILIO_AUTH_TOKEN", None) and
        getattr(settings, "TWILIO_FROM_NUMBER", None)
    )

    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    events_today = db.query(EmergencyCallEvent).filter(
        EmergencyCallEvent.created_at >= today_start
    ).count()

    pending_ack = db.query(EmergencyCallEvent).filter(
        EmergencyCallEvent.acknowledged == False,
        EmergencyCallEvent.call_status.in_(["DEMO_SUCCESS", "ANSWERED", "ESCALATED", "FAILED"]),
    ).count()

    active_contacts = db.query(EmergencyContact).filter(EmergencyContact.is_active == True).count()

    return EmergencySystemStatus(
        demo_mode=settings.EMERGENCY_DEMO_MODE,
        voice_provider=settings.VOICE_PROVIDER,
        provider_configured=provider_configured,
        max_retries=settings.EMERGENCY_MAX_RETRIES,
        cooldown_minutes=settings.EMERGENCY_COOLDOWN_MINUTES,
        call_timeout_seconds=settings.EMERGENCY_CALL_TIMEOUT,
        active_contacts_count=active_contacts,
        total_events_today=events_today,
        pending_acknowledgements=pending_ack,
    )


# ──────────────────────────────────────────────────────────────
# Emergency Contacts CRUD
# ──────────────────────────────────────────────────────────────
@router.get("/contacts", response_model=List[EmergencyContactResponse])
def list_contacts(db: Session = Depends(get_db)):
    """Returns all emergency contacts ordered by priority. Phone numbers are masked."""
    contacts = db.query(EmergencyContact).order_by(EmergencyContact.priority.asc()).all()
    return [_contact_to_response(c) for c in contacts]


@router.post("/contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(body: EmergencyContactCreate, db: Session = Depends(get_db)):
    """Creates a new emergency contact. Stored server-side only."""
    c = EmergencyContact(**body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return _contact_to_response(c)


@router.put("/contacts/{contact_id}", response_model=EmergencyContactResponse)
def update_contact(contact_id: int, body: EmergencyContactUpdate, db: Session = Depends(get_db)):
    """Updates an existing emergency contact."""
    c = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return _contact_to_response(c)


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    """Deletes an emergency contact."""
    c = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(c)
    db.commit()


# ──────────────────────────────────────────────────────────────
# Emergency Call Events
# ──────────────────────────────────────────────────────────────
@router.get("/events", response_model=List[EmergencyCallEventResponse])
def list_events(
    risk_level: Optional[str] = Query(None),
    call_status: Optional[str] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Returns emergency call events, newest first."""
    q = db.query(EmergencyCallEvent)
    if risk_level:
        q = q.filter(EmergencyCallEvent.risk_level == risk_level)
    if call_status:
        q = q.filter(EmergencyCallEvent.call_status == call_status)
    if acknowledged is not None:
        q = q.filter(EmergencyCallEvent.acknowledged == acknowledged)
    events = q.order_by(EmergencyCallEvent.created_at.desc()).limit(limit).all()
    return [_event_to_response(e, db) for e in events]


@router.get("/events/{event_id}", response_model=EmergencyCallEventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Returns a single emergency call event with all attempt details."""
    event = db.query(EmergencyCallEvent).filter(EmergencyCallEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Emergency event not found")
    return _event_to_response(event, db)


@router.post("/events/{event_id}/acknowledge")
def acknowledge_event(
    event_id: int,
    body: AcknowledgeRequest,
    db: Session = Depends(get_db),
):
    """Marks a call event as acknowledged by an officer."""
    event = db.query(EmergencyCallEvent).filter(EmergencyCallEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Emergency event not found")
    if event.acknowledged:
        return {"message": "Already acknowledged", "acknowledged_at": event.acknowledged_at}

    event.acknowledged = True
    event.acknowledged_at = datetime.datetime.utcnow()
    event.acknowledged_by = body.acknowledged_by
    db.commit()
    return {
        "message": "Alert acknowledged",
        "event_id": event.id,
        "acknowledged_by": body.acknowledged_by,
        "acknowledged_at": event.acknowledged_at,
    }


# ──────────────────────────────────────────────────────────────
# Test Call (Demo / Development Only)
# ──────────────────────────────────────────────────────────────
@router.post("/test-call")
def trigger_test_call(
    contact_id: Optional[int] = Query(None, description="Target specific contact by ID"),
    db: Session = Depends(get_db),
):
    """
    Test trigger for voice call.
    """
    result = EmergencyAlertService.trigger_test_call(db, contact_id=contact_id)
    return result


@router.post("/test-message")
def trigger_test_message(
    contact_id: Optional[int] = Query(None, description="Target specific contact by ID"),
    db: Session = Depends(get_db),
):
    """
    Test trigger for SMS alert message.
    """
    result = EmergencyAlertService.trigger_test_message(db, contact_id=contact_id)
    return result

