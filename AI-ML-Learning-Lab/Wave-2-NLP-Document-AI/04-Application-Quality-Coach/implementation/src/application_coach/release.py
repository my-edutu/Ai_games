REQUIRED=["MODEL_CARD.md","DATA_CARD.md","RUBRIC_CARD.md","RUNBOOK.md","SLOS.md","KNOWN_LIMITATIONS.md","SECURITY_PRIVACY.md","OWNERSHIP.md","ROLLBACK.md","PILOT_REPORT.json","BENCHMARK.json","PRODUCTION_HARDENING_AUDIT.md"]
def validate_release_evidence(path):
    path=__import__("pathlib").Path(path); return [f"missing:{x}" for x in REQUIRED if not (path/x).exists()]
