import datetime
from pydantic import BaseModel
from typing import Optional

class AlertResponse(BaseModel):
    id: int
    tiger_id: Optional[int] = None
    alert_type: str
    severity: str
    title: str
    description: str
    detected_change: Optional[str] = None
    supporting_evidence: Optional[str] = None
    confidence: float
    station_id: Optional[int] = None
    is_artefact: str
    created_at: datetime.datetime
    status: str

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: Optional[str] = None # ACKNOWLEDGED, RESOLVED, FALSE_POSITIVE
    notes: Optional[str] = None
