from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OfficerLoginRequest(BaseModel):
    officer_id: str
    password: str

class OfficerResponseData(BaseModel):
    officer_id: str
    name: str
    designation: str
    shift: str
    shift_start: str
    shift_end: str
    duty_location: str
    status: str

class OfficerResponse(BaseModel):
    id: int
    officer_id: str
    name: str
    designation: str
    shift: str
    shift_start: str
    shift_end: str
    duty_location: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OfficerCreate(BaseModel):
    officer_id: str
    name: str
    designation: str
    password: str
    shift: str
    shift_start: str
    shift_end: str
    duty_location: str
    status: str = "Active"

class OfficerUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    shift: Optional[str] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    duty_location: Optional[str] = None
    status: Optional[str] = None

class OfficerStatusUpdate(BaseModel):
    status: str
