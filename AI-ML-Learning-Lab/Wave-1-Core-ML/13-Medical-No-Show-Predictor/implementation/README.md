# Project 13 Implementation
Healthcare-safe appointment-level no-show risk-support service.

Run:
```bash
PYTHONPATH=src python -m pytest -q
```
Safety invariants: supportive actions only; no care denial/cancellation/deprioritization; pre-appointment information only; abstain on insufficient/stale evidence; protected/clinical diagnosis fields excluded from model features.
