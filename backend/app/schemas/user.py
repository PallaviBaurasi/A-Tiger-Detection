import datetime
from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    employee_id: str
    name: str
    role: str
    department: str = "Pench Wildlife Division"
    shift: str = "DAY"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True
