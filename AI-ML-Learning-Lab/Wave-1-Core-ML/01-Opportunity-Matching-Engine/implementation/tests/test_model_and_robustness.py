from pathlib import Path

from opportunity_matching.synthetic import make_training_rows, make_benchmark_queries
from opportunity_matching.model import LearnedRanker, train_model
from opportunity_matching.baseline import BaselineRanker
from opportunity_matching.evaluation import evaluate_ranker
from opportunity_matching.robustness import fairness_report, robustness_report


def test_learned_model_beats_baseline_on_deterministic_benchmark(tmp_path: Path):
    rows = make_training_rows(n_users=80, n_opportunities=20, seed=7)
    model_path = tmp_path / "ranker.joblib"
    metadata = train_model(rows, model_path=model_path, random_state=7)
    assert model_path.exists()
    assert metadata["feature_names"]
    queries = make_benchmark_queries(seed=13)
    baseline = evaluate_ranker(BaselineRanker(), queries, k=5)
    learned = evaluate_ranker(LearnedRanker.load(model_path), queries, k=5)
    assert learned["ndcg_at_k"] >= baseline["ndcg_at_k"] + 0.05


def test_model_keeps_hard_eligibility_filter(tmp_path: Path):
    rows = make_training_rows(n_users=30, n_opportunities=12, seed=3)
    path = tmp_path / "ranker.joblib"
    train_model(rows, model_path=path, random_state=3)
    ranker = LearnedRanker.load(path)
    user, opportunities, _ = make_benchmark_queries(seed=9)[0]
    ineligible = opportunities[0].model_copy(update={"eligible_citizenships": ["ZZ"]})
    results = ranker.rank(user, [ineligible] + opportunities[1:])
    assert ineligible.opportunity_id not in {r.opportunity_id for r in results}


def test_robustness_report_flags_duplicate_ids_and_incomplete_profile():
    user, opps, _ = make_benchmark_queries(seed=5)[0]
    duplicate = opps[0].model_copy()
    report = robustness_report(user, opps + [duplicate])
    assert report["duplicate_opportunity_ids"] >= 1
    sparse = user.model_copy(update={"skills": [], "interests": []})
    sparse_report = robustness_report(sparse, opps)
    assert "SPARSE_PROFILE" in sparse_report["warnings"]


def test_fairness_report_uses_outcomes_for_groups_not_protected_attributes_as_features():
    rows = [
        {"group": "A", "relevant": 1, "recommended": 1},
        {"group": "A", "relevant": 1, "recommended": 0},
        {"group": "B", "relevant": 1, "recommended": 1},
        {"group": "B", "relevant": 1, "recommended": 1},
    ]
    report = fairness_report(rows)
    assert report["A"]["recall"] == 0.5
    assert report["B"]["recall"] == 1.0
    assert report["max_recall_gap"] == 0.5
