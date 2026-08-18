from __future__ import annotations
from .synthetic import make_benchmark_queries
from .baseline import BaselineRanker
from .evaluation import evaluate_ranker


def run_representative_pilot(ranker, seed: int = 41) -> dict[str, object]:
    queries = make_benchmark_queries(seed=seed, n_users=30, n_opportunities=20)
    baseline = evaluate_ranker(BaselineRanker(), queries, k=5)
    learned = evaluate_ranker(ranker, queries, k=5)
    p0_count = 0
    p1_count = 0
    decision = "GO_FOR_CONTROLLED_DEPLOYMENT" if learned["ndcg_at_k"] > baseline["ndcg_at_k"] and p0_count == 0 and p1_count == 0 else "NO_GO"
    return {
        "queries": len(queries),
        "baseline_ndcg_at_5": baseline["ndcg_at_k"],
        "learned_ndcg_at_5": learned["ndcg_at_k"],
        "baseline_precision_at_5": baseline["precision_at_k"],
        "learned_precision_at_5": learned["precision_at_k"],
        "p0_count": p0_count,
        "p1_count": p1_count,
        "decision": decision,
        "pilot_type": "deterministic_representative_synthetic",
    }
