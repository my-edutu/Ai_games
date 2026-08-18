from __future__ import annotations
import math


def precision_at_k(relevance: list[int], k: int) -> float:
    if k <= 0:
        return 0.0
    top = relevance[:k]
    return sum(1 for r in top if r > 0) / k


def recall_at_k(relevance: list[int], k: int) -> float:
    total = sum(1 for r in relevance if r > 0)
    if total == 0:
        return 0.0
    return sum(1 for r in relevance[:k] if r > 0) / total


def dcg_at_k(relevance: list[int], k: int) -> float:
    return sum((2 ** rel - 1) / math.log2(i + 2) for i, rel in enumerate(relevance[:k]))


def ndcg_at_k(relevance: list[int], k: int) -> float:
    ideal = sorted(relevance, reverse=True)
    denom = dcg_at_k(ideal, k)
    return dcg_at_k(relevance, k) / denom if denom else 0.0


def average_precision(relevance: list[int]) -> float:
    total = sum(1 for r in relevance if r > 0)
    if not total:
        return 0.0
    hit = 0
    score = 0.0
    for i, r in enumerate(relevance, 1):
        if r > 0:
            hit += 1
            score += hit / i
    return score / total
