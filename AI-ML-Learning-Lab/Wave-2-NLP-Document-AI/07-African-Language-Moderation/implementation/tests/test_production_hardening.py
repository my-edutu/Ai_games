from fastapi.testclient import TestClient
from african_moderation.synthetic import make_dataset
from african_moderation.model import train_model, predict
from african_moderation.api import create_app
def test_api_and_model_prediction_match_for_confident_direct_content():
    b=train_model(make_dataset()); raw=predict(b,'nitakupiga','sw'); body=TestClient(create_app(b,data_version='fixture-v1')).post('/moderate',json={'text':'nitakupiga','language':'sw'}).json(); assert body['label']==raw['label']=='threat' and abs(body['probability']-raw['probability'])<1e-12
def test_unsupported_language_returns_validation_error(): assert TestClient(create_app(train_model(make_dataset()))).post('/moderate',json={'text':'hello','language':'yo'}).status_code==422
def test_quoted_harmful_speech_abstains_for_context_review():
    body=TestClient(create_app(train_model(make_dataset()))).post('/moderate',json={'text':'he said "nitakupiga" yesterday','language':'sw'}).json(); assert body['abstained'] is True and body['human_review_required'] is True and body['context_dependent'] is True
def test_reviewer_explanation_contains_grounded_snippet_not_invented_text():
    text='wewe ni mjinga'; body=TestClient(create_app(train_model(make_dataset()))).post('/moderate',json={'text':text,'language':'sw'}).json(); assert body['review_snippets'] and all(s in text.lower() for s in body['review_snippets'])
def test_release_scope_stays_controlled_without_native_speaker_validation():
    ready=TestClient(create_app(train_model(make_dataset()))).get('/health/ready').json(); assert ready['deployment_scope']=='controlled_only' and ready['native_speaker_validated'] is False
