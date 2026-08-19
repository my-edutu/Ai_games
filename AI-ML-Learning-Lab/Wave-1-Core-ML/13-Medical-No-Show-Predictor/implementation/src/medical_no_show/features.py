from datetime import datetime
from .schemas import Appointment, PatientHistory

MODEL_FEATURES=["lead_time_days","prior_no_show_rate","history_count","transport_barrier","reminder_opt_in","clinic_code"]
FEATURE_NAMES=MODEL_FEATURES+["prior_cancel_rate","history_missing","days_since_last_contact"]

def clinic_code(name:str)->int:
    return sum(name.encode("utf-8")) % 17

def build_features(appt: Appointment, history: PatientHistory, as_of: datetime):
    past=[e for e in history.events if e.at <= as_of and e.at < appt.appointment_at]
    n=len(past)
    no_show=sum(e.outcome=="no_show" for e in past)
    cancel=sum(e.outcome=="cancelled" for e in past)
    last=max((e.at for e in past), default=None)
    return {
        "lead_time_days": max(0.0,(appt.appointment_at-appt.scheduled_at).total_seconds()/86400),
        "prior_no_show_rate": no_show/n if n else 0.0,
        "prior_cancel_rate": cancel/n if n else 0.0,
        "history_count": n,
        "history_missing": 1 if n==0 else 0,
        "days_since_last_contact": (as_of-last).total_seconds()/86400 if last else 999.0,
        "transport_barrier": int(appt.transport_barrier),
        "reminder_opt_in": int(appt.reminder_opt_in),
        "clinic_code": clinic_code(appt.clinic),
    }
