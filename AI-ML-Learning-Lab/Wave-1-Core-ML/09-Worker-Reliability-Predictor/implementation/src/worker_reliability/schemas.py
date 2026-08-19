from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

class WorkerProfile(BaseModel):
    worker_id: str
    tenure_days: int = Field(ge=0)
    protected_group: str | None = None
    home_postcode: str | None = None

class WorkEvent(BaseModel):
    event_id: str
    starts_at: datetime
    booking_created_at: datetime
    distance_km: float = Field(ge=0)
    expected_duration_hours: float = Field(gt=0, le=24)
    shift_type: Literal['day','evening','night']

class HistoryEvent(BaseModel):
    event_id: str
    occurred_at: datetime
    outcome: Literal['completed','cancelled','no_show']
    lateness_minutes: int = Field(ge=0)

class PredictionRequest(BaseModel):
    worker: WorkerProfile
    event: WorkEvent
    history: list[HistoryEvent]
