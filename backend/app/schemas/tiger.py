import datetime
from pydantic import BaseModel
from typing import Optional, List

class TigerResponse(BaseModel):
    id: int
    tiger_code: str
    display_name: str
    sex: str
    approximate_age: str
    first_seen: datetime.datetime
    last_seen: datetime.datetime
    status: str
    profile_image_url: Optional[str] = None
    capture_count: Optional[int] = 0
    station_count: Optional[int] = 0
    occupied_area_sq_km: Optional[float] = 0.0

    class Config:
        from_attributes = True

class TigerCaptureResponse(BaseModel):
    id: int
    tiger_id: int
    image_id: int
    station_id: int
    captured_at: datetime.datetime
    latitude: float
    longitude: float
    identification_confidence: float
    identification_method: str
    review_status: str

    class Config:
        from_attributes = True

class ReviewAction(BaseModel):
    action: str # CONFIRM_MATCH, CREATE_NEW_TIGER, REJECT, NEEDS_MORE_REVIEW
    target_tiger_id: Optional[int] = None
    notes: Optional[str] = None
