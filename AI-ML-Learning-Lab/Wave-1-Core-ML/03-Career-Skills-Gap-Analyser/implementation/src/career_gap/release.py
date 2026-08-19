from pathlib import Path
REQUIRED=['MODEL_CARD.md','DATA_CARD.md','ONTOLOGY_CARD.md','RUNBOOK.md','SLOS.md','KNOWN_LIMITATIONS.md','SECURITY_PRIVACY.md','OWNERSHIP.md','ROLLBACK.md','PILOT_REPORT.json','BENCHMARK.json']
def validate_release_evidence(path):
    p=Path(path); return [name for name in REQUIRED if not (p/name).exists()]
