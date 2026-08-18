from __future__ import annotations
from pathlib import Path
from datetime import datetime, timezone
import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

from .features import FEATURE_NAMES, build_features
from .eligibility import evaluate_eligibility
from .schemas import UserProfile, Opportunity
from .baseline import RankedOpportunity


def train_model(rows: list[dict[str, float | int]], model_path: str | Path, random_state: int = 7) -> dict[str, object]:
    X = np.array([[float(row[name]) for name in FEATURE_NAMES] for row in rows], dtype=float)
    y = np.array([int(row["label"]) for row in rows], dtype=int)
    model = GradientBoostingRegressor(random_state=random_state, n_estimators=120, max_depth=2, learning_rate=0.05, loss="huber")
    model.fit(X, y)
    artifact = {
        "model": model,
        "feature_names": FEATURE_NAMES,
        "model_version": "gbdt-v1",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_rows": len(rows),
    }
    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, model_path)
    return {k: v for k, v in artifact.items() if k != "model"}


class LearnedRanker:
    def __init__(self, artifact: dict[str, object]):
        self.model = artifact["model"]
        self.feature_names = list(artifact["feature_names"])
        self.model_version = str(artifact.get("model_version", "unknown"))
        self.trained_at = str(artifact.get("trained_at", "unknown"))

    @classmethod
    def load(cls, path: str | Path) -> "LearnedRanker":
        return cls(joblib.load(path))

    def _score(self, user: UserProfile, opp: Opportunity) -> tuple[float, list[str]]:
        f = build_features(user, opp)
        X = np.array([[f[name] for name in self.feature_names]], dtype=float)
        raw = float(self.model.predict(X)[0])
        score = max(0.0, min(1.0, raw / 3.0))
        contributions = sorted([(name, f[name]) for name in self.feature_names], key=lambda item: item[1], reverse=True)[:3]
        reasons = [name.replace("_", "-") for name, value in contributions if value > 0]
        return score, reasons or ["eligible-match"]

    def rank(self, user: UserProfile, opportunities: list[Opportunity], top_k: int | None = None) -> list[RankedOpportunity]:
        ranked = []
        for opp in opportunities:
            eligibility = evaluate_eligibility(user, opp)
            if not eligibility.eligible:
                continue
            score, reasons = self._score(user, opp)
            ranked.append(RankedOpportunity(opportunity_id=opp.opportunity_id, score=round(score, 6), reason_codes=reasons))
        ranked.sort(key=lambda x: (-x.score, x.opportunity_id))
        return ranked[:top_k] if top_k is not None else ranked
