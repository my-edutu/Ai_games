# Scholarship Eligibility Predictor — Project 02 Implementation

A policy-first scholarship decision-support system with a strictly separate calibrated suitability model.

## Core invariant
The deterministic policy engine is authoritative for eligibility. Predictive suitability cannot make an ineligible applicant eligible, cannot override unknown policy criteria, and must never be presented as a guarantee of scholarship acceptance or funding.

## Run
```bash
python -m pip install -e '.[dev]'
pytest -q
python scripts/train_and_evaluate.py
```

The training script creates a deterministic representative benchmark, pilot report, and local serialized model artifact. Representative evidence is for engineering validation only; it is not real-world impact evidence.

## Layout
- `src/scholarship_eligibility/schemas.py` — applicant/policy contracts.
- `policy.py` — exact rules and source/version trace.
- `dataset.py` / `synthetic.py` — reproducible representative data and snapshots.
- `model.py` — transparent baseline, calibrated candidates, threshold guardrails.
- `robustness.py` — abstention, fairness report, user-facing suitability copy.
- `api.py` — typed FastAPI contract.
- `monitoring.py` — separate policy/model registries, rollback, drift and audit log.
- `pilot.py` — representative blind-review/comprehension gate.
- `release.py` — required evidence and prohibited-guarantee release gate.
- `tests/` — 23 test cases covering Phases 1–10.
- `evidence/` and `reports/` — reproducible release evidence.
