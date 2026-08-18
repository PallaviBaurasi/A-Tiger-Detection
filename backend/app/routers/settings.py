from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.user import UserResponse, UserCreate
from app.services.audit_service import AuditService

router = APIRouter(tags=["Settings & Admin Management"])

class SystemSettingsSchema(BaseModel):
    blank_threshold: float = settings.BLANK_THRESHOLD
    match_threshold: float = settings.MATCH_THRESHOLD
    review_threshold: float = settings.REVIEW_THRESHOLD
    core_range_threshold: float = settings.CORE_RANGE_THRESHOLD
    buffer_range_threshold: float = settings.BUFFER_RANGE_THRESHOLD
    prolonged_absence_days: int = settings.PROLONGED_ABSENCE_DAYS
    ml_mode: str = settings.ML_MODE
    roboflow_api_key: str = settings.ROBOFLOW_API_KEY
    roboflow_model_id: str = settings.ROBOFLOW_MODEL_ID
    roboflow_version: str = settings.ROBOFLOW_VERSION

@router.get("/settings")
def get_system_settings():
    return {
        "blank_threshold": settings.BLANK_THRESHOLD,
        "match_threshold": settings.MATCH_THRESHOLD,
        "review_threshold": settings.REVIEW_THRESHOLD,
        "core_range_threshold": settings.CORE_RANGE_THRESHOLD,
        "buffer_range_threshold": settings.BUFFER_RANGE_THRESHOLD,
        "prolonged_absence_days": settings.PROLONGED_ABSENCE_DAYS,
        "ml_mode": settings.ML_MODE,
        "roboflow_api_key": settings.ROBOFLOW_API_KEY,
        "roboflow_model_id": settings.ROBOFLOW_MODEL_ID,
        "roboflow_version": settings.ROBOFLOW_VERSION
    }

@router.post("/settings")
def update_system_settings(cfg: SystemSettingsSchema):
    settings.BLANK_THRESHOLD = cfg.blank_threshold
    settings.MATCH_THRESHOLD = cfg.match_threshold
    settings.REVIEW_THRESHOLD = cfg.review_threshold
    settings.CORE_RANGE_THRESHOLD = cfg.core_range_threshold
    settings.BUFFER_RANGE_THRESHOLD = cfg.buffer_range_threshold
    settings.PROLONGED_ABSENCE_DAYS = cfg.prolonged_absence_days
    settings.ML_MODE = cfg.ml_mode
    settings.ROBOFLOW_API_KEY = cfg.roboflow_api_key
    settings.ROBOFLOW_MODEL_ID = cfg.roboflow_model_id
    settings.ROBOFLOW_VERSION = cfg.roboflow_version
    return {"status": "SUCCESS", "message": "System threshold configuration and Roboflow settings updated successfully."}

@router.get("/admin/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/admin/users", response_model=UserResponse)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.employee_id == user_in.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    u = User(
        employee_id=user_in.employee_id,
        name=user_in.name,
        role=user_in.role,
        department=user_in.department,
        shift=user_in.shift,
        password_hash="hashed_" + user_in.password,
        is_active=user_in.is_active
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

@router.get("/admin/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "user_employee_id": l.user_employee_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "timestamp": l.timestamp.isoformat(),
            "previous_value": l.previous_value,
            "new_value": l.new_value
        }
        for l in logs
    ]
