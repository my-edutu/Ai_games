# Worker Reliability Predictor Implementation Plan

**Goal:** Build a calibrated event-level operational risk-support API with human review, correction/appeal, fairness monitoring and rollback.

**Constraints:** no persistent worker score; no protected attributes in serving features; no future-event leakage; adverse actions require human review; corrections/appeals are auditable; representative pilot is not real-world evidence.

- [x] Phases 1–2 contracts, safety rules and correction model.
- [x] Phase 3 leakage-safe temporal pipeline and deterministic snapshot.
- [x] Phases 4–5 calibration/evaluation, candidate selection and threshold study.
- [x] Phase 6 robustness/fairness/explainability and abstention.
- [x] Phase 7 typed API and appeal/review metadata.
- [x] Phase 8 registry, drift, audit and rollback.
- [x] Phase 9 representative advisory pilot.
- [x] Phase 10 release evidence and governance package.
