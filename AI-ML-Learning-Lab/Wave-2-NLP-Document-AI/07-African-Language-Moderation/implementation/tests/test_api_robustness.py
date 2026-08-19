from fastapi.testclient import TestClient
from african_moderation.synthetic import make_dataset
from african_moderation.model import train_model
from african_moderation.api import create_app
from african_moderation.robustness import perturbation_consistency
def test_case_and_punctuation_perturbations_preserve_label():
    b=train_model(make_dataset()); a,c=perturbation_consistency(b,'nitakupiga','NITAKUPIGA!!!','sw'); assert a['label']==c['label']=='threat'
def test_api_fails_closed_without_model(): assert TestClient(create_app()).get('/health/ready').status_code==503
def test_api_abstains_on_low_confidence_and_escalates_non_safe():
    b=train_model(make_dataset()); c=TestClient(create_app(b,data_version='fixture-v1')); uncertain=c.post('/moderate',json={'text':'zzzz qqqq unknown','language':'sw'}).json(); assert uncertain['abstained'] is True and uncertain['human_review_required'] is True; threat=c.post('/moderate',json={'text':'nitakupiga tomorrow friend','language':'sw'}).json(); assert threat['label']=='threat' and threat['human_review_required'] is True and threat['code_switched'] is True
def test_controlled_scope_exposes_native_speaker_validation_gate():
    body=TestClient(create_app(train_model(make_dataset()))).get('/health/ready').json(); assert body['native_speaker_validated'] is False and body['deployment_scope']=='controlled_only'
