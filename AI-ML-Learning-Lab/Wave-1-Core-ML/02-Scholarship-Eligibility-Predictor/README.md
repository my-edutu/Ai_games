# 02 — Scholarship Eligibility Predictor

Build a system that determines explicit scholarship eligibility and, separately, estimates application suitability/likelihood without confusing prediction with guaranteed acceptance.

**Primary skills:** classification, rule systems, calibrated probabilities, imbalanced data, explainability, policy parsing, fairness.

**Final deliverable:** auditable eligibility engine plus optional calibrated predictive layer, with reason codes and human-readable policy trace.

## Implementation status

Phases 1–10 have been implemented as an engineering release candidate under `implementation/`. See `PHASE_STATUS.md` for phase evidence, `implementation/tests/` for the 23-test suite, and `implementation/evidence/` plus `implementation/reports/` for reproducible benchmark, pilot, governance, monitoring, privacy/security, rollback and release evidence.

The included pilot/benchmark are representative and synthetic/hand-authored; they are not real-world scholarship impact evidence. A real-user controlled pilot remains the final external production-evidence gate.