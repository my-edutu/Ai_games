from simulation_evaluator.rubric import default_rubric
from simulation_evaluator.scoring import score_submission
from simulation_evaluator.model import train_calibrator, evaluate_holdout
from simulation_evaluator.api import create_app
from fastapi.testclient import TestClient


def submission():
    return {
        "simulation_id": "sim-2",
        "candidate_id": "cand-2",
        "audit_group": "control",
        "artifacts": [
            {"artifact_id": "a1", "kind": "analysis", "content": "Diagnosed churn using retention cohorts and cited 18% week-4 retention."},
            {"artifact_id": "a2", "kind": "plan", "content": "Prioritized experiment with success metric week-4 retention and risk of sample bias."},
        ],
        "decisions": [
            {"decision_id": "d1", "action": "run_experiment", "rationale": "Evidence supports a retention test", "evidence_artifact_ids": ["a1", "a2"]}
        ],
    }


def test_scores_have_grounded_citations_and_no_personality_fields():
    r = score_submission(submission(), default_rubric())
    assert r["citations"]
    assert all(c["artifact_id"] in {"a1", "a2"} for c in r["citations"])
    assert "personality" not in str(r).lower()
    assert "culture_fit" not in str(r).lower()


def test_scoring_and_coaching_are_separate():
    bundle = train_calibrator(default_rubric(), seed=20)
    app = create_app(bundle, default_rubric())
    c = TestClient(app)
    score = c.post("/score", json=submission())
    coach = c.post("/coach", json=submission())
    assert score.status_code == 200 and coach.status_code == 200
    assert "coaching" not in score.json()
    assert "overall_score" not in coach.json()


def test_employment_outcome_is_never_automated():
    bundle = train_calibrator(default_rubric(), seed=20)
    app = create_app(bundle, default_rubric())
    body = TestClient(app).post("/score", json=submission()).json()
    assert body["human_decision_required"] is True
    assert "hire" not in body and "reject" not in body


def test_model_beats_constant_baseline_on_held_out_tasks():
    bundle = train_calibrator(default_rubric(), seed=20)
    metrics = evaluate_holdout(bundle, default_rubric(), seed=21)
    assert metrics["mae"] < metrics["constant_baseline_mae"]
    assert metrics["spearman"] > 0.75
    assert metrics["held_out_task_templates"] >= 4


def test_api_model_score_parity():
    rubric = default_rubric()
    bundle = train_calibrator(rubric, seed=20)
    app = create_app(bundle, rubric)
    api_score = TestClient(app).post("/score", json=submission()).json()["overall_score"]
    direct = score_submission(submission(), rubric, model_bundle=bundle)["overall_score"]
    assert abs(api_score - direct) < 1e-12
