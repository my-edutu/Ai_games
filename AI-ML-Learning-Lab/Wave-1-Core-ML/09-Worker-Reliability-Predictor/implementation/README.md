# Worker Reliability Predictor — Project 09 Implementation

A governed event-level operational risk-support system. It predicts risk for a specific scheduled event and never creates a permanent worker reliability score.

Run:
```bash
python -m pip install -e '.[dev]'
pytest -q
python scripts/generate_evidence.py
```

See `evidence/RESTRICTED_USE.md` and `evidence/APPEALS_CORRECTIONS.md` before any deployment. The included pilot/benchmark are representative only.
