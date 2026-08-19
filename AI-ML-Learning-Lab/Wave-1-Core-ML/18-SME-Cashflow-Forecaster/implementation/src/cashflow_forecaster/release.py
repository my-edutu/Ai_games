REQUIRED=["MODEL_CARD.md","DATA_CARD.md","BACKTEST_REPORT.json","RUNBOOK.md","SLOS.md","KNOWN_LIMITATIONS.md","SECURITY_PRIVACY.md","OWNERSHIP.md","ROLLBACK.md","PILOT_REPORT.json"]
def validate_release_evidence(root):
    return [x for x in REQUIRED if not (root/x).exists()]
