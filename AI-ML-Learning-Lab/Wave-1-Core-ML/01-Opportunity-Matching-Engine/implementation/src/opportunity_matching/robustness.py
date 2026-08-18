from __future__ import annotations
from collections import Counter, defaultdict
from .schemas import UserProfile, Opportunity


def robustness_report(user: UserProfile, opportunities: list[Opportunity]) -> dict[str, object]:
    counts = Counter(o.opportunity_id for o in opportunities)
    warnings = []
    if len(user.skills) < 1 or len(user.interests) < 1:
        warnings.append("SPARSE_PROFILE")
    if not user.preferred_types:
        warnings.append("MISSING_TYPE_PREFERENCES")
    return {
        "duplicate_opportunity_ids": sum(v - 1 for v in counts.values() if v > 1),
        "warnings": warnings,
        "opportunity_count": len(opportunities),
    }


def fairness_report(rows: list[dict[str, object]]) -> dict[str, object]:
    groups: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        groups[str(row["group"])].append(row)
    report: dict[str, object] = {}
    recalls = []
    for name, items in sorted(groups.items()):
        relevant = sum(int(i["relevant"]) for i in items)
        true_positive = sum(1 for i in items if int(i["relevant"]) and int(i["recommended"]))
        recall = true_positive / relevant if relevant else 0.0
        report[name] = {"recall": recall, "n": len(items)}
        recalls.append(recall)
    report["max_recall_gap"] = max(recalls) - min(recalls) if recalls else 0.0
    return report
