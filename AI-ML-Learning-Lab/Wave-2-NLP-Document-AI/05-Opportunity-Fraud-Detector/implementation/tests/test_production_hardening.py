from datetime import datetime, timezone
from fastapi.testclient import TestClient
from opportunity_fraud.synthetic import make_dataset
from opportunity_fraud.model import train_risk_model, predict_probability
from opportunity_fraud.api import create_app
from opportunity_fraud.schemas import OpportunityRecord
from opportunity_fraud.features import hard_escalation

def benign_ip_record(): return OpportunityRecord(opportunity_id='ip1',campaign_id='new',title='Research Fellowship',description='Apply through the listed portal.',url='https://203.0.113.7/apply',publisher='Unknown Publisher',contact_email='contact@unknown.example',application_fee=0,publisher_age_days=400,prior_verified_posts=6,redirect_count=0,shortener_used=False,created_at=datetime(2026,8,1,tzinfo=timezone.utc))
def test_api_probability_matches_model_prediction_exactly():
    rows=make_dataset(50,10,seed=17); b=train_risk_model(rows,seed=17); record=rows[-1].record; got=TestClient(create_app(b,'d1','p1')).post('/review',json={'opportunity':record.model_dump(mode='json')}).json()['risk_probability']; assert abs(got-predict_probability(b,record)) < 1e-12
def test_hard_evidence_always_requires_review_even_if_model_score_is_low():
    rows=make_dataset(50,10,seed=18); b=train_risk_model(rows,seed=18); r=benign_ip_record(); assert hard_escalation(r); body=TestClient(create_app(b,'d1','p1')).post('/review',json={'opportunity':r.model_dump(mode='json')}).json(); assert body['review_required'] is True
def test_output_copy_never_declares_fraud_or_criminality():
    rows=make_dataset(45,10,seed=19); b=train_risk_model(rows,seed=19); r=rows[-1].record; body=TestClient(create_app(b,'d','p')).post('/review',json={'opportunity':r.model_dump(mode='json')}).json(); assert body['legal_conclusion'] is False and 'not a finding of fraud or criminality' in body['disclaimer'].lower()
