REQUIRED=["MODEL_CARD.md","DATA_CARD.md","PARSER_CARD.md","RUNBOOK.md","SLOS.md","KNOWN_LIMITATIONS.md","SECURITY_PRIVACY.md","OWNERSHIP.md","ROLLBACK.md","PILOT_REPORT.json","BENCHMARK.json","PRODUCTION_HARDENING_AUDIT.md"]
def missing_evidence(names): return sorted(set(REQUIRED)-set(names))
