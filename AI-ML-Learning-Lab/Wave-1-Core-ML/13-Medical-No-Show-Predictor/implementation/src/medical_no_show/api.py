from fastapi import FastAPI
from datetime import datetime, timezone
from .schemas import PredictRequest
from .features import build_features
from .interventions import recommend_interventions
from .robustness import should_abstain

app=FastAPI(title="Medical No-Show Risk Support")
@app.post("/predict")
def predict(req: PredictRequest):
    as_of=min(datetime.now(timezone.utc), req.appointment.appointment_at)
    f=build_features(req.appointment,req.history,as_of)
    risk=min(.95,max(.05,.15+.25*f["prior_no_show_rate"]+.15*f["transport_barrier"]+.003*f["lead_time_days"]))
    abstain=should_abstain(f,0.2)
    acts=[] if abstain else recommend_interventions(risk,req.appointment.transport_barrier)
    return {"appointment_id":req.appointment.appointment_id,"risk_probability":None if abstain else risk,
            "abstained":abstain,"recommended_interventions":acts,
            "care_access_guardrail":"risk_must_not_reduce_access",
            "human_review_required":risk>=.7 if not abstain else True,
            "model_version":"noshow-logistic-v1","data_version":"representative-v1","intervention_policy_version":"support-v1"}
