from fastapi import FastAPI, HTTPException
from datetime import datetime, timezone
from .schemas import PredictRequest
from .features import build_features
from .interventions import recommend_interventions
from .robustness import should_abstain
from .model import predict_risk

def create_app(bundle=None, data_version="unconfigured", intervention_policy_version="support-v2"):
    app=FastAPI(title="Medical No-Show Risk Support")

    @app.get("/health/ready")
    def ready():
        if bundle is None:
            raise HTTPException(status_code=503, detail="model artifact not configured")
        return {"ready": True, "model_version": bundle.model_version, "artifact_sha256": bundle.artifact_sha256}

    @app.post("/predict")
    def predict(req: PredictRequest):
        if bundle is None:
            raise HTTPException(status_code=503, detail="model artifact not configured")
        as_of=min(datetime.now(timezone.utc), req.appointment.appointment_at)
        features=build_features(req.appointment, req.history, as_of)
        abstain=should_abstain(features, 1)
        risk=None if abstain else predict_risk(bundle, features)
        actions=[] if abstain else recommend_interventions(risk, req.appointment.transport_barrier)
        forbidden={"cancel_appointment","deny_care","deprioritize_care","reduce_access"}
        if forbidden.intersection(actions):
            raise HTTPException(status_code=500, detail="unsafe intervention policy output")
        return {"appointment_id":req.appointment.appointment_id,"risk_probability":risk,"abstained":abstain,
                "recommended_interventions":actions,"care_access_guardrail":"risk_must_not_reduce_access",
                "human_review_required":True if abstain else risk>=bundle.threshold,
                "model_version":bundle.model_version,"model_artifact_sha256":bundle.artifact_sha256,
                "data_version":data_version,"intervention_policy_version":intervention_policy_version}
    return app

app=create_app()
