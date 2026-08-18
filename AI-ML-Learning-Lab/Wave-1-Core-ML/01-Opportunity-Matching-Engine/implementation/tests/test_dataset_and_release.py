import json
from pathlib import Path

from opportunity_matching.dataset import build_dataset_snapshot
from opportunity_matching.release import validate_release_evidence


def test_dataset_snapshot_is_reproducible_and_reports_invalid_rows(tmp_path: Path):
    raw = tmp_path / "raw.jsonl"
    rows = [
        {"user_id":"u1","opportunity_id":"o1","features":{"skill_overlap":0.5},"label":1,"event_time":"2026-01-01T00:00:00Z"},
        {"user_id":"u2","opportunity_id":"o2","features":{"skill_overlap":1.5},"label":1,"event_time":"2026-01-02T00:00:00Z"},
        {"user_id":"u3","opportunity_id":"o3","features":{"skill_overlap":0.2},"label":0,"event_time":"2026-01-03T00:00:00Z"},
    ]
    raw.write_text("\n".join(json.dumps(r) for r in rows))
    out = tmp_path / "snapshot.jsonl"
    report = build_dataset_snapshot(raw, out)
    assert report["valid_rows"] == 2
    assert report["invalid_rows"] == 1
    first = out.read_text()
    report2 = build_dataset_snapshot(raw, out)
    assert out.read_text() == first
    assert report2["snapshot_sha256"] == report["snapshot_sha256"]


def test_release_gate_requires_all_operational_evidence(tmp_path: Path):
    required = ["MODEL_CARD.md", "DATA_CARD.md", "RUNBOOK.md", "SLOS.md", "KNOWN_LIMITATIONS.md", "PILOT_REPORT.json"]
    for name in required:
        (tmp_path / name).write_text("evidence")
    result = validate_release_evidence(tmp_path)
    assert result["ready"] is True
    (tmp_path / "RUNBOOK.md").unlink()
    blocked = validate_release_evidence(tmp_path)
    assert blocked["ready"] is False
    assert "RUNBOOK.md" in blocked["missing"]
