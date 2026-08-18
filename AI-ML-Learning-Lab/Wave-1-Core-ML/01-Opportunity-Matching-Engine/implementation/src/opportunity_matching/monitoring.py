from __future__ import annotations
from pathlib import Path
from datetime import datetime, timezone
import json
from statistics import mean


def drift_report(reference: list[dict[str, float]], current: list[dict[str, float]], threshold: float = 0.25) -> dict[str, object]:
    if not reference or not current:
        return {"drift_detected": False, "drifted_features": [], "feature_deltas": {}}
    keys = sorted(set(reference[0]).intersection(current[0]))
    deltas = {k: abs(mean(float(r[k]) for r in reference) - mean(float(r[k]) for r in current)) for k in keys}
    drifted = [k for k, delta in deltas.items() if delta >= threshold]
    return {"drift_detected": bool(drifted), "drifted_features": drifted, "feature_deltas": deltas}


class ModelRegistry:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.state = json.loads(self.path.read_text()) if self.path.exists() else {"models": {}, "active": None, "history": []}

    def _save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self.state, indent=2, sort_keys=True))

    def register(self, version: str, artifact_path: str):
        self.state["models"][version] = {"artifact_path": artifact_path}
        self._save()

    def activate(self, version: str):
        if version not in self.state["models"]:
            raise KeyError(version)
        previous = self.state.get("active")
        if previous and previous != version:
            self.state["history"].append(previous)
        self.state["active"] = version
        self._save()

    def rollback(self):
        if not self.state["history"]:
            raise RuntimeError("no rollback target")
        self.state["active"] = self.state["history"].pop()
        self._save()

    @property
    def active_version(self):
        return self.state.get("active")


class AuditLog:
    def __init__(self, path: str | Path):
        self.path = Path(path)

    def write(self, event: str, payload: dict[str, object]):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        row = {"timestamp": datetime.now(timezone.utc).isoformat(), "event": event, "payload": payload}
        with self.path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(row, sort_keys=True) + "\n")

    def read_all(self):
        if not self.path.exists():
            return []
        return [json.loads(line) for line in self.path.read_text().splitlines() if line.strip()]
