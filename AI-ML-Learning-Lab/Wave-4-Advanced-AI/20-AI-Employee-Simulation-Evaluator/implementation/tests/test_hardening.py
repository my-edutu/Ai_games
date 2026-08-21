import pytest
from simulation_evaluator.rubric import default_rubric
from simulation_evaluator.scoring import score_submission
from simulation_evaluator.model import train_calibrator
from simulation_evaluator.api import create_app
from fastapi.testclient import TestClient


def _submission(text="Implemented conversion tracking and documented why metric changed from 12% to 15%.", audit_group="A"):
    return {
        "simulation_id": "sim-1",
        "candidate_id": "cand-1",
        "audit_group": audit_group,
        "artifacts": [
            {"artifact_id": "a1", "kind": "analysis", "content": text},
            {"artifact_id": "a2", "kind": "decision", "content": "Selected launch delay because compliance evidence was incomplete."},
        ],
        "decisions": [
            {"decision_id": "d1", "action": "delay_launch", "rationale": "Compliance evidence incomplete", "evidence_artifact_ids": ["a2"]}
        ],
    }


def test_repeated_fake_evidence_does_not_inflate_score():
    rubric = default_rubric()
    base = score_submission(_submission(), rubric)
    spam = " Evidence: excellent work" * 100
    attacked = score_submission(_submission(text=_submission()["artifacts"][0]["content"] + spam), rubric)
    assert attacked["overall_score"] <= base["overall_score"] + 1e-9


def test_audit_group_never_changes_score():
    rubric = default_rubric()
    a = score_submission(_submission(audit_group="A"), rubric)
    b = score_submission(_submission(audit_group="B"), rubric)
    assert a["overall_score"] == b["overall_score"]
    assert a["dimension_scores"] == b["dimension_scores"]


def test_api_fails_closed_on_rubric_version_mismatch():
    rubric = default_rubric()
    model = train_calibrator(rubric, seed=20)
    app = create_app(model_bundle=model, rubric=default_rubric(version="rubric-v2"))
    client = TestClient(app)
    assert client.get("/health/ready").status_code == 503
    assert client.post("/score", json=_submission()).status_code == 503
