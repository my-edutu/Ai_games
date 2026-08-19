REQUIRED=['MODEL_CARD.md','DATA_CARD.md','RESTRICTED_USE.md','APPEALS_CORRECTIONS.md','RUNBOOK.md','SLOS.md','KNOWN_LIMITATIONS.md','SECURITY_PRIVACY.md','OWNERSHIP.md','ROLLBACK.md','PILOT_REPORT.json','BENCHMARK.json']
def validate_release_evidence(path):
    return [f for f in REQUIRED if not (path/f).exists()]
