from medical_no_show.synthetic import make_dataset
from medical_no_show.model import train_candidates, predict_risk, select_threshold
from medical_no_show.evaluation import evaluate_predictions, cohort_report
from medical_no_show.robustness import should_abstain, audit_feature_contract
from medical_no_show.api import app
from fastapi.testclient import TestClient

def test_selected_model_beats_constant_baseline_on_brier():
    X,y,g=make_dataset(700,seed=13)
    bundle=train_candidates(X,y,seed=13)
    assert bundle.metrics["brier"] < bundle.metrics["constant_baseline_brier"]

def test_threshold_is_bounded_and_cohort_aware():
    X,y,g=make_dataset(500,seed=7)
    b=train_candidates(X,y,seed=7)
    t=select_threshold(b, X, y, g)
    assert 0.05 <= t <= 0.8

def test_sparse_or_stale_inputs_abstain():
    assert should_abstain({"history_count":0,"days_since_last_contact":400}, uncertainty=0.2)
    assert should_abstain({"history_count":2,"days_since_last_contact":10}, uncertainty=0.6)

def test_feature_contract_has_no_protected_or_clinical_diagnosis_fields():
    assert audit_feature_contract()==[]

def test_api_returns_supportive_only_and_no_denial():
    c=TestClient(app)
    payload={"appointment":{"appointment_id":"a","patient_id":"p","scheduled_at":"2026-08-01T00:00:00Z","appointment_at":"2026-08-20T00:00:00Z","clinic":"general","reminder_opt_in":True,"transport_barrier":True},
             "history":{"patient_id":"p","events":[]}}
    r=c.post("/predict",json=payload)
    assert r.status_code==200
    body=r.json()
    assert body["care_access_guardrail"]=="risk_must_not_reduce_access"
    assert "deny_care" not in body["recommended_interventions"]
