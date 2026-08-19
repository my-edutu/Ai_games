from datetime import datetime, timezone
from fastapi.testclient import TestClient
from opportunity_fraud.schemas import OpportunityRecord
from opportunity_fraud.synthetic import make_dataset
from opportunity_fraud.model import train_risk_model
from opportunity_fraud.api import create_app
from opportunity_fraud.robustness import adversarial_consistency, should_escalate

def rec(desc='Guaranteed selection. Pay processing fee by WhatsApp.', **kw):
    base=dict(opportunity_id='x',campaign_id='cx',title='URGENT GRANT',description=desc,url='http://quickgrant.example/a',publisher='Q',contact_email='desk@gmail.com',application_fee=50,publisher_age_days=10,prior_verified_posts=0,redirect_count=4,shortener_used=False,created_at=datetime(2026,8,1,tzinfo=timezone.utc)); base.update(kw); return OpportunityRecord(**base)
def test_adversarial_obfuscation_preserves_risk_signal():
    b=train_risk_model(make_dataset(55,12,seed=4),seed=4); a=rec('Guaranteed selection. Pay processing fee by WhatsApp.'); c=rec('G\u200buar4nteed selection. P@y processing fee by Wh4tsApp.'); pa,pb=adversarial_consistency(b,a,c); assert abs(pa-pb) < 0.08 and min(pa,pb)>0.45
def test_uncertain_or_high_risk_escalates_to_human_review(): assert should_escalate(0.91,0.7) and should_escalate(0.51,0.8) and not should_escalate(0.08,0.7)
def test_api_fails_closed_without_model(): assert TestClient(create_app()).get('/health/ready').status_code==503
def test_api_returns_risk_evidence_not_legal_conclusion():
    b=train_risk_model(make_dataset(55,12,seed=3),seed=3); body=TestClient(create_app(b,'fixture-v1','threat-v1')).post('/review',json={'opportunity':rec().model_dump(mode='json')}).json(); assert body['legal_conclusion'] is False and body['review_required'] is True and body['artifact_sha256']==b.artifact_sha256 and body['evidence'] and all('criminal' not in e['detail'].lower() for e in body['evidence'])
