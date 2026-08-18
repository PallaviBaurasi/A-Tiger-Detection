import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.database import get_db
from app.config import settings
from app.models.officer import Officer
from app.models.user import User
from app.utils.hash_utils import verify_password
from app.utils.jwt_utils import encode_jwt, decode_jwt
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class LoginPayload(BaseModel):
    officer_id: Optional[str] = None
    employee_id: Optional[str] = None
    password: str

def calculate_on_duty(shift_start: str, shift_end: str) -> bool:
    try:
        now_time = datetime.datetime.now().time()
        s_h, s_m = map(int, shift_start.split(":"))
        e_h, e_m = map(int, shift_end.split(":"))
        start = datetime.time(s_h, s_m)
        end = datetime.time(e_h, e_m)
        if start <= end:
            return start <= now_time <= end
        else:
            return now_time >= start or now_time <= end
    except Exception:
        return True

def create_access_token(data: dict):
    to_encode = data.copy()
    return encode_jwt(to_encode)

def get_current_officer_or_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_jwt(token)
        sub_id: str = payload.get("sub")
        if not sub_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    # Check Officer table first
    officer = db.query(Officer).filter(Officer.officer_id == sub_id).first()
    if officer:
        return {"type": "officer", "data": officer}

    # Fallback to User table
    user = db.query(User).filter(User.employee_id == sub_id).first()
    if user:
        return {"type": "user", "data": user}

    raise HTTPException(status_code=404, detail="Authenticated identity not found")

@router.post("/login")
def login(req: LoginPayload, db: Session = Depends(get_db)):
    target_id = req.officer_id or req.employee_id
    if not target_id:
        raise HTTPException(status_code=400, detail="Officer ID or Employee ID is required")

    # 1. Search in Officer Table
    officer = db.query(Officer).filter(Officer.officer_id == target_id).first()
    if officer:
        if not verify_password(req.password, officer.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect Password")
        if officer.status != "Active":
            raise HTTPException(status_code=400, detail="Officer account is Inactive")

        token = create_access_token({"sub": officer.officer_id, "role": officer.designation})
        AuditService.log(db, officer.officer_id, "LOGIN", "Officer", officer.id)

        officer_data = {
            "officer_id": officer.officer_id,
            "name": officer.name,
            "designation": officer.designation,
            "shift": officer.shift,
            "shift_start": officer.shift_start,
            "shift_end": officer.shift_end,
            "duty_location": officer.duty_location,
            "status": officer.status,
            "is_on_duty": calculate_on_duty(officer.shift_start, officer.shift_end)
        }

        return {
            "success": True,
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "data": officer_data,
            "user": {
                "id": officer.id,
                "employee_id": officer.officer_id,
                "name": officer.name,
                "role": officer.designation,
                "department": officer.duty_location,
                "shift": officer.shift
            }
        }

    # 2. Fallback to User Table for legacy logins
    user = db.query(User).filter(User.employee_id == target_id).first()
    if user:
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect Employee ID or Password")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="User account is deactivated")

        token = create_access_token({"sub": user.employee_id, "role": user.role})
        AuditService.log(db, user.employee_id, "LOGIN", "User", user.id)

        officer_data = {
            "officer_id": user.employee_id,
            "name": user.name,
            "designation": user.role,
            "shift": user.shift,
            "shift_start": "06:00",
            "shift_end": "14:00",
            "duty_location": user.department,
            "status": "Active",
            "is_on_duty": True
        }

        return {
            "success": True,
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "data": officer_data,
            "user": {
                "id": user.id,
                "employee_id": user.employee_id,
                "name": user.name,
                "role": user.role,
                "department": user.department,
                "shift": user.shift
            }
        }

    raise HTTPException(status_code=400, detail="Officer ID not found")

@router.get("/me")
def get_me(identity: dict = Depends(get_current_officer_or_user)):
    if identity["type"] == "officer":
        off: Officer = identity["data"]
        return {
            "officer_id": off.officer_id,
            "name": off.name,
            "designation": off.designation,
            "shift": off.shift,
            "shift_start": off.shift_start,
            "shift_end": off.shift_end,
            "duty_location": off.duty_location,
            "status": off.status,
            "is_on_duty": calculate_on_duty(off.shift_start, off.shift_end)
        }
    else:
        u: User = identity["data"]
        return {
            "officer_id": u.employee_id,
            "name": u.name,
            "designation": u.role,
            "shift": u.shift,
            "shift_start": "06:00",
            "shift_end": "14:00",
            "duty_location": u.department,
            "status": "Active" if u.is_active else "Inactive",
            "is_on_duty": True
        }
