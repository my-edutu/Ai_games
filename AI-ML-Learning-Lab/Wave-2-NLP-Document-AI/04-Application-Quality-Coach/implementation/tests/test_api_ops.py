from fastapi.testclient import TestClient
from application_coach.api import create_app
from application_coach.synthetic import make_reviewer_dataset
from application_coach.model import train_calibrator
from application_coach.monitoring import VersionRegistry, detect_drift
TEXT="I led five volunteers and increased attendance by 30% in three months."
def test_unconfigured_api_fails_closed():
    c=TestClient(create_app()); assert c.get("/health/ready").status_code==503; assert c.post("/review",json={"application_text":TEXT,"opportunity_criteria":["leadership"]}).status_code==503
def test_configured_api_exposes_versions_and_evidence():
    b=train_calibrator(make_reviewer_dataset(180,seed=9),seed=9); c=TestClient(create_app(b,rubric_version="rubric-v1",prompt_version="prompt-v1")); assert c.get("/health/ready").status_code==200; body=c.post("/review",json={"application_text":TEXT,"opportunity_criteria":["leadership"]}).json(); assert body["model_artifact_sha256"]==b.artifact_sha256; assert body["rubric_version"]=="rubric-v1"; assert body["prompt_version"]=="prompt-v1"; assert all(x["evidence_spans"] or x["status"]=="insufficient_evidence" for x in body["dimensions"])
def test_rewrite_endpoint_requires_explicit_intent():
    b=train_calibrator(make_reviewer_dataset(160,seed=3),seed=3); c=TestClient(create_app(b)); assert c.post("/rewrite",json={"application_text":TEXT,"rewrite_intent":False}).status_code==422
def test_independent_version_rollback():
    r=VersionRegistry(); r.activate("model","m2"); r.activate("rubric","r2"); r.activate("prompt","p2"); r.activate("model","m3"); r.rollback("model"); assert r.active("model")=="m2" and r.active("rubric")=="r2" and r.active("prompt")=="p2"
def test_monitoring_detects_grounding_and_score_drift():
    issues=detect_drift({"grounding_precision":.95,"mean_score":72},{"grounding_precision":.78,"mean_score":88}); assert "grounding_precision_drop" in issues and "score_distribution_shift" in issues
