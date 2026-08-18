from __future__ import annotations
from statistics import mean
from .metrics import ndcg_at_k, precision_at_k, recall_at_k, average_precision


def evaluate_ranker(ranker, queries, k: int = 5) -> dict[str, float]:
    ndcgs, precisions, recalls, aps = [], [], [], []
    for user, opportunities, relevance_by_id in queries:
        ranked = ranker.rank(user, opportunities)
        relevance = [relevance_by_id.get(item.opportunity_id, 0) for item in ranked]
        binary = [1 if x > 0 else 0 for x in relevance]
        ndcgs.append(ndcg_at_k(relevance, k))
        precisions.append(precision_at_k(binary, k))
        recalls.append(recall_at_k(binary, k))
        aps.append(average_precision(binary))
    return {
        "ndcg_at_k": mean(ndcgs),
        "precision_at_k": mean(precisions),
        "recall_at_k": mean(recalls),
        "map": mean(aps),
    }
