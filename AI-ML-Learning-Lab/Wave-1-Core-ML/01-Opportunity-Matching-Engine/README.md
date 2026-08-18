# 01 — Opportunity Matching Engine

Build a ranking system that matches people to scholarships, internships, fellowships, grants, jobs, and other opportunities using eligibility, profile fit, preferences, and evidence quality.

**Primary skills:** ranking, retrieval, feature engineering, learning-to-rank, offline evaluation, calibration, fairness, explainability.

**Suggested stack:** Python, pandas/polars, scikit-learn, LightGBM/XGBoost or ranking alternatives, sentence-transformers when semantic similarity is justified, FastAPI, pytest, MLflow.

**Final deliverable:** a reproducible candidate-to-opportunity ranking service with documented data contracts, ranking metrics, explanations, fairness checks, API, monitoring, and rollback plan.

## Implementation status

Phases 1–10 have been implemented as an engineering/learning candidate under `implementation/`. See `PHASE_STATUS.md` for exit evidence, benchmark numbers and the truth boundary around representative vs real-world pilot evidence.

The implementation includes deterministic hard eligibility, validated contracts, dataset snapshotting, a baseline ranker, a graded learned reranker, ranking evaluation, robustness/fairness utilities, typed FastAPI serving, drift monitoring, model registry/rollback, audit logs, representative pilot tooling, release gates, model/data cards, runbook, SLOs and known limitations.

Run the verified package from `implementation/` with:

```bash
python -m pip install -e '.[dev]'
pytest -q
python scripts/train_and_evaluate.py
```

Use `TEACHING/` while reviewing or extending the implementation.
