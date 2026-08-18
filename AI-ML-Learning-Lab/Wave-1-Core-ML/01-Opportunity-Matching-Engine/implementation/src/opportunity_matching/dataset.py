from __future__ import annotations
from pathlib import Path
import hashlib
import json
from datetime import datetime


def _valid_row(row: dict[str, object]) -> bool:
    try:
        if not row.get("user_id") or not row.get("opportunity_id"):
            return False
        label = int(row["label"])
        if label < 0 or label > 3:
            return False
        datetime.fromisoformat(str(row["event_time"]).replace("Z", "+00:00"))
        features = row.get("features")
        if not isinstance(features, dict) or not features:
            return False
        for value in features.values():
            fv = float(value)
            if fv < 0 or fv > 1:
                return False
        return True
    except (KeyError, TypeError, ValueError):
        return False


def build_dataset_snapshot(raw_path: str | Path, output_path: str | Path) -> dict[str, object]:
    raw_path = Path(raw_path)
    output_path = Path(output_path)
    valid: list[dict[str, object]] = []
    invalid = 0
    for line in raw_path.read_text().splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            invalid += 1
            continue
        if _valid_row(row):
            valid.append(row)
        else:
            invalid += 1
    valid.sort(key=lambda row: (str(row["event_time"]), str(row["user_id"]), str(row["opportunity_id"])))
    payload = "\n".join(json.dumps(r, sort_keys=True, separators=(",", ":")) for r in valid)
    if payload:
        payload += "\n"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(payload)
    digest = hashlib.sha256(payload.encode()).hexdigest()
    return {"source": str(raw_path), "valid_rows": len(valid), "invalid_rows": invalid, "snapshot_sha256": digest}
