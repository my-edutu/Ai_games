# AI Employee Simulation Evaluator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an evidence-grounded simulation competency evaluator with held-out task evaluation, human decision rights, robust anti-gaming controls, serving compatibility checks, monitoring, rollback, and controlled-deployment evidence.

**Architecture:** Versioned rubric -> grounded artifact/decision features -> transparent baseline -> calibrated score model -> typed fail-closed API. Audit-only attributes never enter features; sparse or inconsistent evidence escalates to human review.

**Tech Stack:** Python, FastAPI, Pydantic, NumPy, scikit-learn, SciPy, pytest, matplotlib.

**Spec:** `../specs/2026-08-20-ai-employee-simulation-evaluator-design.md`

## Global Constraints
- No personality, culture-fit, or protected-trait inference.
- No autonomous hire/reject/certify output.
- Every score must be evidence-grounded.
- Rubric/model version mismatch fails closed.
- Broad production requires real reviewer shadow validation.

- [x] Phases 1–3 safety, schemas, evidence graph and representative task fixtures.
- [x] Phases 4–5 baseline, calibrator and held-out task evaluation.
- [x] Phase 6 evidence-spam, contradiction, sparse-input and audit-group robustness.
- [x] Phase 7 typed scoring/coaching APIs and fail-closed readiness.
- [x] Phase 8 drift detection and independent version rollback.
- [x] Phase 9 representative human-comprehension pilot.
- [x] Phase 10 cards, reproducible plot generation, hardening audit and controlled-deployment gate.
