# Learning Standard

Every project follows a build-teach-review loop.

## Build
Implement the smallest working increment for the current phase, preferably test-first. Preserve reproducibility: fixed seeds where relevant, versioned data/configuration, tracked metrics, and explicit assumptions.

## Teach
Before copying code, explain the concept in your own words. For each new technique record: what problem it solves, why it was chosen, what alternatives exist, what can go wrong, and how you know it works.

## Review
At the end of each phase review code quality, data quality, model quality, UX/API behavior, safety, bias/fairness where relevant, observability, cost, latency, and failure recovery.

## Evidence portfolio
Keep experiment results, evaluation tables, plots, model/data cards, failure examples, postmortems, screenshots/API examples, and a short learning log. Completion is based on evidence, not merely on files existing.

## Recommended core stack
Python 3.12+, uv or pip, pandas/polars, NumPy, scikit-learn, PyTorch where deep learning is justified, Hugging Face for NLP/speech where justified, FastAPI for serving, pytest for testing, MLflow or equivalent for experiments, Docker for packaging, and a cloud-neutral monitoring approach. Projects may deviate when the domain requires it.