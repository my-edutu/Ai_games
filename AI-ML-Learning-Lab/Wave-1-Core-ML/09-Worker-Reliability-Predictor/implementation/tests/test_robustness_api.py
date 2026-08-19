from fastapi.testclient import TestClient
from worker_reliability.api import create_app
from worker_reliability.robustness import should_abstain, audit_feature_contract

def test_abstain_on_stale_or_too_little_history_when_risk_is_uncertain():
    assert should_abstain(history_count=0,data_age_days=0,probability=.51) is True; assert should_abstain(history_count=20,data_age_days=400,probability=.51) is True
def test_feature_contract_has_no_protected_or_location_proxy():
    assert audit_feature_contract()==[]
def test_api_returns_event_risk_review_and_appeal_path():
    c=TestClient(create_app()); payload={'worker':{'worker_id':'w1','tenure_days':100,'protected_group':'audit-A','home_postcode':'10001'},'event':{'event_id':'e1','starts_at':'2026-08-20T09:00:00Z','booking_created_at':'2026-08-18T09:00:00Z','distance_km':3,'expected_duration_hours':8,'shift_type':'day'},'history':[]}; r=c.post('/v1/event-risk',json=payload); assert r.status_code==200; j=r.json(); assert j['event_id']=='e1' and 'risk_probability' in j and 'appeal_url' in j; assert j['decision_authority']=='human_review_required_for_adverse_action' and 'worker_label' not in j
