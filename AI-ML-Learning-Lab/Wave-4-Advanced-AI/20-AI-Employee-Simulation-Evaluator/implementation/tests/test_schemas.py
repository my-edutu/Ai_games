import pytest
from pydantic import ValidationError
from simulation_evaluator.schemas import Submission


def test_duplicate_artifact_ids_rejected():
    with pytest.raises(ValidationError):
        Submission.model_validate({
            "simulation_id":"s","candidate_id":"c","audit_group":"x",
            "artifacts":[{"artifact_id":"a","kind":"analysis","content":"one"},{"artifact_id":"a","kind":"plan","content":"two"}],
            "decisions":[]})


def test_decision_cannot_cite_missing_artifact():
    with pytest.raises(ValidationError):
        Submission.model_validate({
            "simulation_id":"s","candidate_id":"c","audit_group":"x",
            "artifacts":[{"artifact_id":"a","kind":"analysis","content":"one"}],
            "decisions":[{"decision_id":"d","action":"choose","rationale":"because evidence","evidence_artifact_ids":["missing"]}]})
