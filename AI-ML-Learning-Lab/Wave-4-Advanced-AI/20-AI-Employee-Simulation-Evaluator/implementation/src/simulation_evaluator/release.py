from pathlib import Path

REQUIRED_EVIDENCE = (
    "BENCHMARK.json","PILOT_REPORT.json","MODEL_CARD.md","DATA_CARD.md","RUBRIC_CARD.md",
    "KNOWN_LIMITATIONS.md","SECURITY_PRIVACY.md","SLOS.md","OWNERSHIP.md","ROLLBACK.md",
    "RUNBOOK.md","RELEASE_CHECKLIST.md","PRODUCTION_HARDENING_AUDIT.md",
)

def validate_release(root) -> list[str]:
    root=Path(root)
    evidence=root / "evidence" if root.name != "evidence" else root
    return [name for name in REQUIRED_EVIDENCE if not (evidence/name).exists()]

def deployment_scope(real_reviewer_validated: bool) -> str:
    return "broad_candidate" if real_reviewer_validated else "controlled_only"
