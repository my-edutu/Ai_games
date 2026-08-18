# Opportunity Matching Engine — Project 01

A safety-first opportunity matching service that separates deterministic eligibility from learned relevance ranking.

## Architecture

1. Validate user/opportunity contracts.
2. Apply hard eligibility rules.
3. Build bounded, non-sensitive relevance features.
4. Rank eligible opportunities with a deterministic baseline or `gbdt-v1` learned reranker.
5. Return user-facing reason codes plus model/data version metadata.
6. Monitor drift and outcomes; activate/rollback model versions through the registry.

## Quick start

```bash
python -m pip install -e '.[dev]'
pytest -q
python scripts/train_and_evaluate.py
```

The training command produces `models/ranker.joblib`, `reports/BENCHMARK.json`, and `evidence/PILOT_REPORT.json` from deterministic representative data.

## Important safety boundary

A learned score never makes an ineligible opportunity eligible. Protected attributes are excluded from ranking features. The included pilot is representative/synthetic and must not be described as real-world impact evidence.

See `../PHASE_STATUS.md` for phase-by-phase evidence and `evidence/` for the production-readiness package.
