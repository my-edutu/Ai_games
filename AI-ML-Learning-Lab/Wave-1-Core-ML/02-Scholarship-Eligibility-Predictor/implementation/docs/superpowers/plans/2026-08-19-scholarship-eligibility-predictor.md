# Scholarship Eligibility Predictor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an auditable scholarship eligibility engine plus a separately calibrated predictive suitability layer that never overrides policy eligibility or guarantees funding.

**Architecture:** Versioned scholarship policy and applicant schemas feed a deterministic rules engine producing eligible/ineligible/needs-review plus policy traces. A separate ML pipeline trains calibrated suitability models only on non-policy outcome signals, serves both outputs through a typed API, and maintains distinct policy/model registries, monitoring, rollback, pilot evidence, and release gates.

**Tech Stack:** Python 3.11+, Pydantic, scikit-learn, pandas/numpy, FastAPI, pytest, joblib.

**Spec:** Repository Project 02 phase documents under `AI-ML-Learning-Lab/Wave-1-Core-ML/02-Scholarship-Eligibility-Predictor/PHASES/`.

## Global Constraints
- Deterministic eligibility and probabilistic suitability are separate outputs.
- Predictive scores never override policy eligibility.
- Outputs never claim or imply guaranteed scholarship acceptance/funding.
- Unknown or ambiguous required policy inputs return needs-review rather than fabricated certainty.
- Every eligibility result traces to policy source and version.
- Policy and model version lifecycles are monitored and rolled back separately.

---

### Task 1: Policy and applicant contracts
- [ ] Write failing schema/decision tests.
- [ ] Verify failures.
- [ ] Implement versioned schemas and decision taxonomy.
- [ ] Verify tests.

### Task 2: Deterministic rules engine and normalization
- [ ] Write failing policy boundary/unknown tests.
- [ ] Verify failures.
- [ ] Implement GPA normalization, criteria evaluation, policy trace.
- [ ] Verify tests.

### Task 3: Dataset pipeline and transparent baseline
- [ ] Write failing deterministic snapshot and metric tests.
- [ ] Verify failures.
- [ ] Implement snapshots, synthetic representative data, logistic baseline and evaluation.
- [ ] Verify tests.

### Task 4: Calibrated model selection
- [ ] Write failing model-improvement/calibration tests.
- [ ] Verify failures.
- [ ] Implement calibrated boosted candidate, comparison and threshold study.
- [ ] Verify tests.

### Task 5: Robustness, fairness and abstention
- [ ] Write failing boundary, subgroup and abstention tests.
- [ ] Verify failures.
- [ ] Implement robustness/fairness audit and suitability abstention.
- [ ] Verify tests.

### Task 6: API serving
- [ ] Write failing typed API tests.
- [ ] Verify failures.
- [ ] Implement FastAPI response contract with separate policy and suitability sections.
- [ ] Verify tests.

### Task 7: Policy/model operations
- [ ] Write failing registry/drift/rollback tests.
- [ ] Verify failures.
- [ ] Implement separate policy/model registries, monitoring and audit log.
- [ ] Verify tests.

### Task 8: Representative pilot and human-review harness
- [ ] Write failing blind-review/comprehension gate tests.
- [ ] Verify failures.
- [ ] Implement deterministic pilot metrics and disagreement severity gates.
- [ ] Verify tests.

### Task 9: Production readiness package
- [ ] Write failing release-evidence tests.
- [ ] Verify failures.
- [ ] Implement release gate and operational evidence documents.
- [ ] Verify tests.

### Task 10: Full verification and publication
- [ ] Run full pytest suite and compilation.
- [ ] Generate benchmark and pilot reports.
- [ ] Verify release gate.
- [ ] Publish verified package and phase status to GitHub main.
