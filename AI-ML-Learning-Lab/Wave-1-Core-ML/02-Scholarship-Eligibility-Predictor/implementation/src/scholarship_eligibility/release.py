from __future__ import annotations
from pathlib import Path

REQUIRED_EVIDENCE = [
    'MODEL_CARD.md','DATA_CARD.md','POLICY_RUNBOOK.md','MONITORING.md',
    'SECURITY_PRIVACY.md','OWNERSHIP.md','ROLLBACK.md','RELEASE_CHECKLIST.md','PILOT_REPORT.json',
]
PROHIBITED_PHRASES = ['guarantees you will win', 'guaranteed scholarship', 'guaranteed funding']

def validate_release_evidence(evidence_dir) -> list[str]:
    root=Path(evidence_dir)
    issues=[]
    for name in REQUIRED_EVIDENCE:
        p=root/name
        if not p.exists():
            issues.append(name)
    for p in root.glob('*') if root.exists() else []:
        if not p.is_file(): continue
        try: text=p.read_text(encoding='utf-8').lower()
        except UnicodeDecodeError: continue
        if any(phrase in text for phrase in PROHIBITED_PHRASES):
            issues.append(f'PROHIBITED_GUARANTEE_CLAIM:{p.name}')
    return issues
