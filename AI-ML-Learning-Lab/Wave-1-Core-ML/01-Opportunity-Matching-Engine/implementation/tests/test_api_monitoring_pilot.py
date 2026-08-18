from pathlib import Path
from fastapi.testclient import TestClient

from opportunity_matching.synthetic import make_training_rows, make_benchmark_queries
from opportunity_matching.model import train_model, LearnedRanker
from opportunity_matching.api import create_app
from opportunity_matching.monitoring import drift_report, ModelRegistry, AuditLog
from opportunity_matching.pilot import run_representative_pilot


def trained_ranker(tmp_path: Path):
    path = tmp_path / "ranker.joblib"
    train_model(make_training_rows(50, 16, seed=17), path, random_state=17)
    return LearnedRanker.load(path)


def test_api_returns_traceable_top_k_results(tmp_path: Path):
    ranker = trained_ranker(tmp_path)
    user, opps, _ = make_benchmark_queries(seed=21)[0]
    client = TestClient(create_app(ranker, data_version="synthetic-v1"))
    response = client.post("/v1/match", json={"user": user.model_dump(), "opportunities": [o.model_dump() for o in opps], "top_k": 3})
    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) == 3
    assert body["model_version"] == "gbdt-v1"
    assert body["data_version"] == "synthetic-v1"
    assert all(r["reason_codes"] for r in body["results"])


def test_api_rejects_invalid_top_k(tmp_path: Path):
    ranker = trained_ranker(tmp_path)
    user, opps, _ = make_benchmark_queries(seed=22)[0]
    client = TestClient(create_app(ranker, data_version="synthetic-v1"))
    response = client.post("/v1/match", json={"user": user.model_dump(), "opportunities": [o.model_dump() for o in opps], "top_k": 0})
    assert response.status_code == 422


def test_drift_report_flags_material_feature_shift():
    reference = [{"skill_overlap": 0.8, "interest_overlap": 0.7} for _ in range(20)]
    current = [{"skill_overlap": 0.1, "interest_overlap": 0.2} for _ in range(20)]
    report = drift_report(reference, current, threshold=0.25)
    assert report["drift_detected"] is True
    assert set(report["drifted_features"]) == {"skill_overlap", "interest_overlap"}


def test_registry_supports_activation_and_rollback(tmp_path: Path):
    registry = ModelRegistry(tmp_path / "registry.json")
    registry.register("v1", "models/v1.joblib")
    registry.register("v2", "models/v2.joblib")
    registry.activate("v1")
    registry.activate("v2")
    assert registry.active_version == "v2"
    registry.rollback()
    assert registry.active_version == "v1"


def test_audit_log_is_append_only_jsonl(tmp_path: Path):
    log = AuditLog(tmp_path / "audit.jsonl")
    log.write("match_request", {"request_id": "r1", "model_version": "v1"})
    log.write("rollback", {"from": "v2", "to": "v1"})
    rows = log.read_all()
    assert [r["event"] for r in rows] == ["match_request", "rollback"]


def test_representative_pilot_meets_guardrails(tmp_path: Path):
    ranker = trained_ranker(tmp_path)
    report = run_representative_pilot(ranker, seed=41)
    assert report["queries"] >= 20
    assert report["learned_ndcg_at_5"] > report["baseline_ndcg_at_5"]
    assert report["p0_count"] == 0
    assert report["p1_count"] == 0
    assert report["decision"] == "GO_FOR_CONTROLLED_DEPLOYMENT"
