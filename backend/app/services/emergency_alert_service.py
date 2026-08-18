"""
Emergency Alert Service
=======================
Core orchestration service for CRITICAL alert → voice call workflow.

DEMO MODE (default):
  - Set EMERGENCY_DEMO_MODE=true in .env
  - All "calls" are logged as DEMO_CALL — no real API is contacted
  - Safe for demonstrations and development

LIVE MODE:
  - Set EMERGENCY_DEMO_MODE=false AND provide Twilio credentials
  - Real calls are made via Twilio Voice API
  - Officer hears an automated voice message
"""
import datetime
import json
import threading
import uuid
import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.models.emergency import EmergencyContact, EmergencyCallEvent, CallAttempt
from app.models.alert import Alert

logger = logging.getLogger(__name__)


class EmergencyAlertService:
    """
    Handles the full lifecycle of a CRITICAL emergency call:
      1. Validate alert is CRITICAL
      2. Duplicate-call protection (cooldown window)
      3. Select highest-priority active officer
      4. Trigger call (demo or live)
      5. Record every attempt
      6. Retry & escalate as configured
      7. Full audit trail in DB
    """

    # ------------------------------------------------------------------ #
    # Public entry point — called from triage_service after alert is saved
    # ------------------------------------------------------------------ #
    @staticmethod
    def handle_critical_alert(db: Session, alert: Alert) -> Optional[EmergencyCallEvent]:
        """
        Entry point called from triage_service.py.
        Runs in a background thread so it never blocks image processing.
        """
        if alert.severity != "CRITICAL":
            return None

        # 1. Duplicate-call protection
        cooldown_minutes = settings.EMERGENCY_COOLDOWN_MINUTES
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=cooldown_minutes)
        existing = (
            db.query(EmergencyCallEvent)
            .filter(EmergencyCallEvent.alert_id == alert.id)
            .filter(EmergencyCallEvent.created_at >= cutoff)
            .first()
        )
        if existing:
            logger.info(
                f"[EMERGENCY] Duplicate suppressed for alert {alert.id} — "
                f"existing event {existing.id} within {cooldown_minutes}min cooldown."
            )
            return existing

        # 2. Select first active contact by priority
        contact = (
            db.query(EmergencyContact)
            .filter(EmergencyContact.is_active == True)
            .order_by(EmergencyContact.priority.asc())
            .first()
        )

        # 3. Build context for voice message
        tiger_code = f"T-{alert.tiger_id}" if alert.tiger_id else "Unknown"
        camera_id = f"STN-{alert.station_id}" if alert.station_id else "Unknown"
        reason = alert.description or alert.title

        try:
            evidence = json.loads(alert.supporting_evidence or "{}")
            zone = evidence.get("region_type", evidence.get("station_code", "Unknown Zone"))
        except Exception:
            zone = "Unknown Zone"

        # 4. Create call event record
        is_demo = settings.EMERGENCY_DEMO_MODE
        call_event = EmergencyCallEvent(
            alert_id=alert.id,
            alert_type=alert.alert_type,
            risk_level=alert.severity,
            reason=reason,
            tiger_id=alert.tiger_id,
            tiger_code=tiger_code,
            camera_id=camera_id,
            zone=zone,
            detected_at=alert.created_at,
            selected_contact_id=contact.id if contact else None,
            call_status="PENDING",
            max_retries=settings.EMERGENCY_MAX_RETRIES,
            is_demo=is_demo,
        )
        db.add(call_event)
        db.commit()
        db.refresh(call_event)

        if not contact:
            call_event.call_status = "FAILED"
            call_event.reason = (reason or "") + " | No active emergency contacts configured."
            db.commit()
            logger.warning(f"[EMERGENCY] No active contacts found for alert {alert.id}")
            return call_event

        # 5. Execute call workflow in a daemon thread
        #    We pass primary keys only (thread gets its own DB session)
        t = threading.Thread(
            target=EmergencyAlertService._run_call_workflow,
            args=(call_event.id, alert.id),
            daemon=True
        )
        t.start()

        return call_event

    # ------------------------------------------------------------------ #
    # Internal call workflow (runs in its own thread + DB session)
    # ------------------------------------------------------------------ #
    @staticmethod
    def _run_call_workflow(call_event_id: int, alert_id: int):
        """Background thread: executes call attempts with retry + escalation."""
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            call_event = db.query(EmergencyCallEvent).filter(
                EmergencyCallEvent.id == call_event_id
            ).first()
            if not call_event:
                return

            alert = db.query(Alert).filter(Alert.id == alert_id).first()
            max_retries = call_event.max_retries
            attempt_num = 0

            # Get all active contacts ordered by priority (for escalation)
            contacts = (
                db.query(EmergencyContact)
                .filter(EmergencyContact.is_active == True)
                .order_by(EmergencyContact.priority.asc())
                .all()
            )

            if not contacts:
                call_event.call_status = "FAILED"
                db.commit()
                return

            contact_idx = 0
            contact = contacts[contact_idx]
            call_event.selected_contact_id = contact.id
            call_event.call_status = "CALLING"
            db.commit()

            while attempt_num < max_retries and contact_idx < len(contacts):
                attempt_num += 1
                phone = contact.primary_phone

                attempt = CallAttempt(
                    call_event_id=call_event.id,
                    contact_id=contact.id,
                    attempt_number=attempt_num,
                    phone_dialed=EmergencyAlertService._mask_phone(phone),
                    attempt_type="PRIMARY" if attempt_num == 1 else "RETRY",
                    status="INITIATED",
                    initiated_at=datetime.datetime.utcnow(),
                )
                db.add(attempt)
                db.commit()
                db.refresh(attempt)

                # Build the voice message
                voice_message = EmergencyAlertService._build_voice_message(alert, call_event)

                # Execute call (demo or live)
                result = EmergencyAlertService._execute_call(
                    phone=phone,
                    message=voice_message,
                    is_demo=call_event.is_demo,
                )

                attempt.status = result["status"]
                attempt.provider_call_id = result.get("provider_call_id")
                attempt.provider_response = json.dumps(result.get("raw_response", {}))
                attempt.error_message = result.get("error")
                attempt.completed_at = datetime.datetime.utcnow()
                call_event.retry_count = attempt_num
                call_event.provider_call_id = result.get("provider_call_id")
                db.commit()

                if result["status"] in ("ANSWERED", "DEMO_SUCCESS", "MOCK"):
                    call_event.call_status = result["status"]
                    db.commit()
                    logger.info(f"[EMERGENCY] Call succeeded: event={call_event.id} status={result['status']}")
                    return

                # Try secondary phone of same contact before escalating
                if contact.secondary_phone and attempt_num < max_retries:
                    attempt_num += 1
                    sec_attempt = CallAttempt(
                        call_event_id=call_event.id,
                        contact_id=contact.id,
                        attempt_number=attempt_num,
                        phone_dialed=EmergencyAlertService._mask_phone(contact.secondary_phone),
                        attempt_type="SECONDARY",
                        status="INITIATED",
                        initiated_at=datetime.datetime.utcnow(),
                    )
                    db.add(sec_attempt)
                    db.commit()
                    db.refresh(sec_attempt)

                    sec_result = EmergencyAlertService._execute_call(
                        phone=contact.secondary_phone,
                        message=voice_message,
                        is_demo=call_event.is_demo,
                    )
                    sec_attempt.status = sec_result["status"]
                    sec_attempt.provider_call_id = sec_result.get("provider_call_id")
                    sec_attempt.completed_at = datetime.datetime.utcnow()
                    call_event.retry_count = attempt_num
                    db.commit()

                    if sec_result["status"] in ("ANSWERED", "DEMO_SUCCESS", "MOCK"):
                        call_event.call_status = sec_result["status"]
                        db.commit()
                        return

                # Escalate to next officer
                contact_idx += 1
                if contact_idx < len(contacts):
                    contact = contacts[contact_idx]
                    call_event.selected_contact_id = contact.id
                    call_event.call_status = "ESCALATED"
                    db.commit()
                    logger.info(
                        f"[EMERGENCY] Escalating to contact priority={contact.priority} "
                        f"name={contact.name}"
                    )
                else:
                    break

            # All attempts exhausted
            call_event.call_status = "FAILED"
            db.commit()
            logger.error(f"[EMERGENCY] All call attempts exhausted for event {call_event.id}")

        except Exception as e:
            logger.exception(f"[EMERGENCY] Unexpected error in call workflow: {e}")
            try:
                call_event = db.query(EmergencyCallEvent).filter(
                    EmergencyCallEvent.id == call_event_id
                ).first()
                if call_event:
                    call_event.call_status = "FAILED"
                    db.commit()
            except Exception:
                pass
        finally:
            db.close()

    # ------------------------------------------------------------------ #
    # Call execution — demo or Twilio live
    # ------------------------------------------------------------------ #
    @staticmethod
    def _execute_call(phone: str, message: str, is_demo: bool) -> dict:
        """
        Executes the actual call.
        In DEMO MODE: logs and returns a mock success — NO real call is made.
        In LIVE MODE: calls Twilio Voice API.
        """
        if is_demo:
            mock_id = f"DEMO-{uuid.uuid4().hex[:12].upper()}"
            logger.info(
                f"[EMERGENCY][DEMO] Mock call to {EmergencyAlertService._mask_phone(phone)}\n"
                f"  Message: {message[:120]}..."
            )
            return {
                "status": "DEMO_SUCCESS",
                "provider_call_id": mock_id,
                "raw_response": {"mode": "DEMO", "mock_call_id": mock_id},
                "error": None,
            }

        # Live Twilio call
        try:
            account_sid = settings.TWILIO_ACCOUNT_SID
            auth_token = settings.TWILIO_AUTH_TOKEN
            from_number = settings.TWILIO_FROM_NUMBER

            if not all([account_sid, auth_token, from_number]):
                return {
                    "status": "FAILED",
                    "provider_call_id": None,
                    "error": "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.",
                }

            from twilio.rest import Client  # type: ignore
            client = Client(account_sid, auth_token)

            # TwiML: text-to-speech voice message
            twiml = f"<Response><Say voice='alice'>{message}</Say><Pause length='2'/><Say voice='alice'>Repeating. {message}</Say></Response>"

            call = client.calls.create(
                twiml=twiml,
                to=phone,
                from_=from_number,
                timeout=settings.EMERGENCY_CALL_TIMEOUT,
            )
            return {
                "status": "ANSWERED",
                "provider_call_id": call.sid,
                "raw_response": {"sid": call.sid, "status": call.status},
                "error": None,
            }
        except ImportError:
            return {
                "status": "FAILED",
                "provider_call_id": None,
                "error": "twilio package not installed. Run: pip install twilio",
            }
        except Exception as e:
            return {
                "status": "FAILED",
                "provider_call_id": None,
                "error": str(e),
            }

    # ------------------------------------------------------------------ #
    # Voice message builder
    # ------------------------------------------------------------------ #
    @staticmethod
    def _build_voice_message(alert, call_event) -> str:
        """Builds the automated voice message text."""
        tiger_part = (
            f"Tiger ID {call_event.tiger_code} was detected"
            if call_event.tiger_code else
            "An unidentified tiger was detected"
        )
        time_str = ""
        if call_event.detected_at:
            time_str = call_event.detected_at.strftime("at %I:%M %p on %B %d")

        return (
            f"Emergency wildlife alert from Pench Tiger Reserve. "
            f"A critical tiger movement event has been detected near "
            f"camera {call_event.camera_id or 'unknown'} in {call_event.zone or 'unknown zone'}. "
            f"{tiger_part} {time_str}. "
            f"The system has classified this event as CRITICAL. "
            f"Alert type: {call_event.alert_type.replace('_', ' ')}. "
            f"Please check the wildlife monitoring dashboard immediately and take appropriate action. "
            f"This is an automated emergency alert from the Pench Vision Intelligence System."
        )

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _mask_phone(phone: str) -> str:
        """Returns masked phone for safe logging: +91XXXXXX7890"""
        if not phone or len(phone) < 6:
            return "UNKNOWN"
        return phone[:3] + "X" * (len(phone) - 6) + phone[-3:]

    # ------------------------------------------------------------------ #
    # SMS / Message execution
    # ------------------------------------------------------------------ #
    @staticmethod
    def _execute_sms(phone: str, message: str, is_demo: bool) -> dict:
        """
        Sends an emergency SMS text message alert.
        In DEMO MODE: logs mock SMS.
        In LIVE MODE: sends via Twilio Messages API.
        """
        if is_demo:
            mock_id = f"SMS-DEMO-{uuid.uuid4().hex[:10].upper()}"
            logger.info(
                f"[EMERGENCY][SMS DEMO] Mock SMS to {EmergencyAlertService._mask_phone(phone)}: {message}"
            )
            return {
                "status": "DEMO_SUCCESS",
                "provider_message_id": mock_id,
                "error": None,
                "mode": "DEMO"
            }

        try:
            account_sid = settings.TWILIO_ACCOUNT_SID
            auth_token = settings.TWILIO_AUTH_TOKEN
            from_number = settings.TWILIO_FROM_NUMBER

            from twilio.rest import Client  # type: ignore
            client = Client(account_sid, auth_token)

            msg = client.messages.create(
                body=message,
                to=phone,
                from_=from_number
            )
            return {
                "status": "SENT",
                "provider_message_id": msg.sid,
                "error": None,
                "mode": "LIVE"
            }
        except Exception as e:
            return {
                "status": "FAILED",
                "provider_message_id": None,
                "error": str(e),
                "mode": "LIVE"
            }

    # ------------------------------------------------------------------ #
    # Manual test trigger (from dashboard "TEST EMERGENCY CALL" button)
    # ------------------------------------------------------------------ #
    @staticmethod
    def trigger_test_call(db: Session, contact_id: Optional[int] = None) -> dict:
        """
        Test trigger from dashboard.
        If EMERGENCY_DEMO_MODE=True, returns simulated demo result.
        If EMERGENCY_DEMO_MODE=False, executes actual call via configured voice provider.
        """
        contact = None
        if contact_id:
            contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
        if not contact:
            contact = (
                db.query(EmergencyContact)
                .filter(EmergencyContact.is_active == True)
                .order_by(EmergencyContact.priority.asc())
                .first()
            )

        if not contact:
            return {
                "status": "FAILED",
                "mode": "DEMO" if settings.EMERGENCY_DEMO_MODE else "LIVE",
                "error": "No active emergency contacts configured to test.",
            }

        message = (
            "This is a test of the Pench Tiger Reserve emergency alert system. "
            "Automated call alert integration is active and verified. "
            "No real emergency has occurred."
        )

        is_demo = settings.EMERGENCY_DEMO_MODE

        # Execute call
        result = EmergencyAlertService._execute_call(
            phone=contact.primary_phone,
            message=message,
            is_demo=is_demo,
        )

        return {
            "status": result.get("status", "SUCCESS"),
            "mode": "DEMO" if is_demo else "LIVE",
            "provider_call_id": result.get("provider_call_id"),
            "contact_name": contact.name,
            "contact_phone_masked": EmergencyAlertService._mask_phone(contact.primary_phone),
            "message_preview": message,
            "error": result.get("error"),
            "note": "DEMO MODE — Simulated call." if is_demo else "LIVE MODE — Real call initiated via Twilio."
        }

    # ------------------------------------------------------------------ #
    # Manual test SMS trigger
    # ------------------------------------------------------------------ #
    @staticmethod
    def trigger_test_message(db: Session, contact_id: Optional[int] = None) -> dict:
        """
        Test trigger for SMS alert message.
        """
        contact = None
        if contact_id:
            contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
        if not contact:
            contact = (
                db.query(EmergencyContact)
                .filter(EmergencyContact.is_active == True)
                .order_by(EmergencyContact.priority.asc())
                .first()
            )

        if not contact:
            return {
                "status": "FAILED",
                "error": "No active emergency contacts found.",
            }

        sms_body = (
            "🚨 [PENCH VISION ALERT - TEST]\n"
            "Critical tiger movement alert system test verified.\n"
            "Tiger ID: T-01\n"
            "Station: STN-C01 (Karmajhiri North)\n"
            "Status: System Operational."
        )

        res = EmergencyAlertService._execute_sms(
            phone=contact.primary_phone,
            message=sms_body,
            is_demo=settings.EMERGENCY_DEMO_MODE
        )

        return {
            "status": res.get("status"),
            "mode": res.get("mode"),
            "provider_message_id": res.get("provider_message_id"),
            "contact_name": contact.name,
            "contact_phone_masked": EmergencyAlertService._mask_phone(contact.primary_phone),
            "message": sms_body,
            "error": res.get("error")
        }


