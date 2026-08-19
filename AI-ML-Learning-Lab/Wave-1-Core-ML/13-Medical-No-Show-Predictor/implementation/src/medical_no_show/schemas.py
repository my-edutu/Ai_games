from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, model_validator

class HistoryEvent(BaseModel):
    at: datetime
    outcome: Literal["attended","no_show","cancelled"]

class PatientHistory(BaseModel):
    patient_id: str
    events: list[HistoryEvent]=Field(default_factory=list)

class Appointment(BaseModel):
    appointment_id: str
    patient_id: str
    scheduled_at: datetime
    appointment_at: datetime
    clinic: str
    reminder_opt_in: bool=True
    transport_barrier: bool=False

    @model_validator(mode="after")
    def validate_times(self):
        if self.appointment_at <= self.scheduled_at:
            raise ValueError("appointment_at must be after scheduled_at")
        if not self.clinic.strip():
            raise ValueError("clinic is required")
        return self

class PredictRequest(BaseModel):
    appointment: Appointment
    history: PatientHistory

    @model_validator(mode="after")
    def validate_patient_identity(self):
        if self.appointment.patient_id != self.history.patient_id:
            raise ValueError("patient_id mismatch")
        return self
