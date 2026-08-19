from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from medical_no_show.synthetic import make_dataset
from medical_no_show.model import train_evaluate, predict_risk
from medical_no_show.api import create_app
from medical_no_show.schemas import PredictRequest
from medical_no_show.features import build_features

def bundle():
    X,y,g=make_dataset(n=1200,seed=13)
    b,hold=train_evaluate(X,y,g)
    return b,hold,X,y

def payload(with_history=True):
    now=datetime.now(timezone.utc)
    appointment={"appointment_id":"a1","patient_id":"p1","scheduled_at":(now-timedelta(days=2)).isoformat(),"appointment_at":(now+timedelta(days=5)).isoformat(),"clinic":"lagos-1","transport_barrier":True}
    events=[] if not with_history else [{"at":(now-timedelta(days=10)).isoformat(),"outcome":"no_show"}]
    return {"appointment":appointment,"history":{"patient_id":"p1","events":events}}

def test_release_metrics_use_holdout_and_beat_constant_baseline():
    b,hold,X,y=bundle()
    assert b.metrics["holdout_size"] == len(hold)
    assert b.metrics["train_size"] + b.metrics["holdout_size"] == len(y)
    assert b.metrics["brier"] < b.metrics["constant_baseline_brier"]

def test_api_probability_is_exact_model_probability():
    b,_,_,_=bundle()
    req=PredictRequest.model_validate(payload())
    f=build_features(req.appointment,req.history,datetime.now(timezone.utc))
    expected=predict_risk(b,f)
    actual=TestClient(create_app(b,"fixture-v2")).post("/predict",json=payload()).json()["risk_probability"]
    assert abs(actual-expected) < 1e-10

def test_unconfigured_api_fails_closed():
    client=TestClient(create_app())
    assert client.get("/health/ready").status_code == 503
    assert client.post("/predict",json=payload()).status_code == 503

def test_serving_response_has_artifact_fingerprint():
    b,_,_,_=bundle()
    body=TestClient(create_app(b)).post("/predict",json=payload()).json()
    assert body["model_artifact_sha256"] == b.artifact_sha256
    assert len(body["model_artifact_sha256"]) == 64

def test_sparse_history_abstains_without_care_reduction():
    b,_,_,_=bundle()
    body=TestClient(create_app(b)).post("/predict",json=payload(False)).json()
    assert body["abstained"] is True
    assert body["risk_probability"] is None
    assert body["recommended_interventions"] == []
    assert body["care_access_guardrail"] == "risk_must_not_reduce_access"

def test_cross_patient_history_is_rejected():
    p=payload(); p["history"]["patient_id"]="other"
    b,_,_,_=bundle()
    assert TestClient(create_app(b)).post("/predict",json=p).status_code == 422
