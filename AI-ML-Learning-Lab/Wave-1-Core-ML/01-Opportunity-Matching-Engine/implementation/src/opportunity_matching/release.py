from __future__ import annotations
from pathlib import Path

REQUIRED_EVIDENCE = [
    "MODEL_CARD.md",
    "DATA_CARD.md",
    "RUNBOOK.md",
    "SLOS.md",
    "KNOWN_LIMITATIONS.md",
    "PILOT_REPORT.json",
]


def validate_release_evidence(evidence_dir: str | Path) -> dict[str, object]:
    evidence_dir = Path(evidence_dir)
    missing = [name for name in REQUIRED_EVIDENCE if not (evidence_dir / name).exists()]
    return {"ready": not missing, "missing": missing, "required": REQUIRED_EVIDENCE}
