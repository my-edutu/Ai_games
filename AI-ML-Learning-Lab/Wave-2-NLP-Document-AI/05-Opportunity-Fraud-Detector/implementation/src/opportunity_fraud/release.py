REQUIRED=['MODEL_CARD.md','DATA_CARD.md','THREAT_MODEL.md','REVIEWER_RUNBOOK.md','SLOS.md','KNOWN_LIMITATIONS.md','SECURITY_PRIVACY.md','OWNERSHIP.md','ROLLBACK.md','PILOT_REPORT.json','BENCHMARK.json','PRODUCTION_HARDENING_AUDIT.md']
def validate_release_evidence(path):
    return [f for f in REQUIRED if not (path/f).exists()]
