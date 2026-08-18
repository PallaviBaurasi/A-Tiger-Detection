import datetime
from pydantic import BaseModel
from typing import Optional, List

class ImageResponse(BaseModel):
    id: int
    filename: str
    original_path: str
    processed_path: Optional[str] = None
    station_id: int
    captured_at: datetime.datetime
    file_size: int
    status: str
    subject_detected: str
    subject_type: str
    detection_confidence: float
    bounding_box: Optional[str] = None
    processing_run_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ImageUploadRequest(BaseModel):
    station_id: int
    captured_at: Optional[str] = None
