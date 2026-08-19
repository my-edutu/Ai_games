# Medical No-Show Predictor Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
**Goal:** Build a calibrated no-show risk-support service for supportive interventions only.
**Architecture:** contracts -> temporal features -> baseline/model evaluation -> robustness/fairness -> safe intervention policy -> API -> monitoring/audit/rollback -> representative shadow pilot -> release evidence.
**Tech Stack:** Python, Pydantic, scikit-learn, FastAPI, pytest.
## Global Constraints
- No denial, cancellation or deprioritization of care from risk.
- Pre-appointment data only.
- Protected attributes excluded from model features.
- Sparse/stale inputs abstain.
- Representative evidence is never called real-world clinical impact evidence.
