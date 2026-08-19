REQUIRED=["MODEL_CARD.md","DATA_CARD.md","SAFE_INTERVENTION_POLICY.md","PRIVACY_SECURITY.md",
"RUNBOOK.md","SLOS.md","KNOWN_LIMITATIONS.md","OWNERSHIP.md","ROLLBACK.md","PILOT_REPORT.json"]
def validate_release_evidence(path):
    return [x for x in REQUIRED if not (path/x).exists()]
