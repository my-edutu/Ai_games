# Operations Runbook

1. Run `pytest -q` and `python scripts/train_and_evaluate.py`.
2. Inspect `reports/BENCHMARK.json` and `evidence/PILOT_REPORT.json`.
3. Register the candidate model version in `ModelRegistry` and activate it only after release gates pass.
4. Monitor request failures, latency, eligible-set coverage, feature drift and feedback/outcome metrics.
5. If a P0/P1 incident, severe drift, or ranking regression occurs, call registry rollback to the previous version and record the event with `AuditLog`.
6. Preserve the failed model/data versions for investigation; never overwrite audit history.
