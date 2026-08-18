import datetime
from pydantic import BaseModel
from typing import Optional

class ProcessingRunResponse(BaseModel):
    id: int
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    total_images: int
    blank_images: int
    retained_images: int
    tiger_images: int
    new_tigers: int
    reviewed_images: int
    processing_time: float
    storage_saved: float
    status: str

    class Config:
        from_attributes = True
