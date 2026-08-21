from simulation_evaluator.rubric import default_rubric
from simulation_evaluator.scoring import score_submission
from simulation_evaluator.model import train_calibrator
from simulation_evaluator.monitoring import VersionRegistry, drift_report
from simulation_evaluator.api import create_app
from fastapi.testclient import TestClient


def sparse():
    return {"simulation_id":"s","candidate_id":"c","audit_group":"x","artifacts":[{"artifact_id":"a","kind":"note","content":"done"}],"decisions":[]}


def contradictory():
    return {
      "simulation_id":"s","candidate_id":"c","audit_group":"x",
      "artifacts":[
        {"artifact_id":"a1","kind":"analysis","content":"Conversion rate is 12% and metric is conversion rate."},
        {"artifact_id":"a2","kind":"analysis","content":"Conversion rate is 31% and metric is conversion rate."}],
      "decisions":[]}


def coherent():
    return {
      "simulation_id":"s","candidate_id":"c","audit_group":"x",
      "artifacts":[
        {"artifact_id":"a1","kind":"analysis","content":"Conversion rate is 12% and metric is conversion rate."},
        {"artifact_id":"a2","kind":"plan","content":"Baseline conversion rate is 12%; target metric is 15% after experiment."}],
      "decisions":[{"decision_id":"d","action":"experiment","rationale":"Test target 15% against 12% baseline","evidence_artifact_ids":["a1","a2"]}]}


def test_sparse_submission_abstains_in_api():
    r=default_rubric(); b=train_calibrator(r)
    body=TestClient(create_app(b,r)).post('/score',json=sparse()).json()
    assert body['abstained'] is True
    assert body['overall_score'] is None
    assert body['human_review_required'] is True


def test_unexplained_contradiction_reduces_coherence_score():
    r=default_rubric()
    bad=score_submission(contradictory(),r)
    good=score_submission(coherent(),r)
    assert bad['coherence_score'] < good['coherence_score']


def test_version_registry_rolls_back_independently():
    reg=VersionRegistry()
    reg.activate('model','m1'); reg.activate('rubric','r1'); reg.activate('model','m2')
    reg.rollback('model')
    assert reg.active['model']=='m1'
    assert reg.active['rubric']=='r1'


def test_drift_report_flags_score_and_citation_shift():
    report=drift_report(reference={'mean_score':70,'citation_rate':0.9},current={'mean_score':54,'citation_rate':0.5})
    assert set(report) == {'score_shift','citation_grounding_shift'}
