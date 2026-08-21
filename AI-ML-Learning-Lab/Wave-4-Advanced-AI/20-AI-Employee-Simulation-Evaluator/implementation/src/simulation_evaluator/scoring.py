from __future__ import annotations
import re
from typing import Any

SUBSTANTIVE = {
    "analysis": ("diagnos", "cohort", "root cause", "tradeoff", "hypothesis", "segment", "compare"),
    "decision_quality": ("selected", "priorit", "delay", "decid", "because", "rationale", "experiment"),
    "measurement": ("metric", "retention", "conversion", "revenue", "latency", "%", "baseline", "success"),
    "risk_awareness": ("risk", "compliance", "bias", "uncertain", "privacy", "failure", "mitigat"),
}
GENERIC_SPAM = re.compile(r"(?:\bevidence\s*:\s*)?(?:excellent|great|strong|good)\s+work", re.I)
NUMBER = re.compile(r"(?<!\w)\d+(?:\.\d+)?%?")


def _clean(text: str) -> str:
    text = GENERIC_SPAM.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def _artifact_scores(artifacts: list[dict[str, Any]]) -> tuple[dict[str, float], list[dict[str, str]]]:
    texts = {a["artifact_id"]: _clean(str(a.get("content", ""))) for a in artifacts}
    citations: list[dict[str, str]] = []
    scores = {k: 0.0 for k in ["analysis", "decision_quality", "evidence_use", "measurement", "risk_awareness"]}
    seen_evidence: set[tuple[str, str]] = set()
    for aid, text in texts.items():
        for dim, terms in SUBSTANTIVE.items():
            hits = sum(1 for t in terms if t in text)
            scores[dim] += min(1.0, hits / 2.0)
            if hits:
                key = (aid, dim)
                if key not in seen_evidence:
                    citations.append({"artifact_id": aid, "dimension": dim})
                    seen_evidence.add(key)
        has_number = bool(NUMBER.search(text))
        has_context = any(t in text for t in SUBSTANTIVE["analysis"] + SUBSTANTIVE["measurement"])
        if has_number and has_context:
            scores["evidence_use"] += 0.75
            key = (aid, "evidence_use")
            if key not in seen_evidence:
                citations.append({"artifact_id": aid, "dimension": "evidence_use"})
                seen_evidence.add(key)
    n = max(1, len(texts))
    return {k: min(1.0, v / n * 1.5) for k, v in scores.items()}, citations


def extract_features(submission: dict[str, Any]) -> list[float]:
    artifacts = list(submission.get("artifacts", []))
    decisions = list(submission.get("decisions", []))
    scores, _ = _artifact_scores(artifacts)
    artifact_ids = {a.get("artifact_id") for a in artifacts}
    linked = sum(bool(set(d.get("evidence_artifact_ids", [])) & artifact_ids) for d in decisions)
    rationale = sum(len(_clean(str(d.get("rationale", "")))) >= 12 for d in decisions)
    return [
        scores["analysis"], scores["decision_quality"], scores["evidence_use"],
        scores["measurement"], scores["risk_awareness"],
        min(1.0, linked / max(1, len(decisions))),
        min(1.0, rationale / max(1, len(decisions))),
    ]


def _coherence_score(artifacts: list[dict[str, Any]]) -> float:
    values=[]
    contextual=False
    for a in artifacts:
        text=_clean(str(a.get("content", "")))
        if "conversion rate" in text:
            nums=[float(x.rstrip("%")) for x in NUMBER.findall(text) if x.endswith("%")]
            values.extend(nums)
            if "baseline" in text or "target" in text or "goal" in text:
                contextual=True
    unique={round(v,6) for v in values}
    if len(unique) <= 1 or contextual:
        return 1.0
    return 0.3

def score_submission(submission: dict[str, Any], rubric, model_bundle=None) -> dict[str, Any]:
    artifacts = list(submission.get("artifacts", []))
    dimensions, citations = _artifact_scores(artifacts)
    # Decision quality gains only from linked, reasoned decisions; audit_group is intentionally ignored.
    features = extract_features(submission)
    dimensions["decision_quality"] = min(1.0, (dimensions["decision_quality"] + features[5] + features[6]) / 3.0)
    raw = 100.0 * sum(d.weight * dimensions[d.name] for d in rubric.dimensions)
    overall = raw
    if model_bundle is not None:
        overall = float(model_bundle.predict([features])[0])
    overall = max(0.0, min(100.0, overall))
    coherence=_coherence_score(artifacts)
    overall *= (0.9 + 0.1*coherence)
    return {
        "overall_score": overall,
        "coherence_score": coherence,
        "dimension_scores": {k: round(v * 100.0, 6) for k, v in dimensions.items()},
        "citations": citations,
        "rubric_version": rubric.version,
        "human_decision_required": True,
        "scope": "simulation_competency_evidence_only",
    }
