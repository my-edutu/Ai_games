# Project 13 Production Hardening Audit

## Findings fixed

1. **P0 — Serving/training divergence:** the API previously used a hand-written probability formula instead of the trained model. Serving now requires a configured `ModelBundle` and calls the exact model prediction path used in evaluation.
2. **P1 — Training-set evaluation:** release metrics were previously computed on the training set. Model selection now reports metrics from a stratified untouched 30% holdout.
3. **P1 — Silent unconfigured serving:** the API now fails closed with HTTP 503 when no model artifact is configured and exposes `/health/ready`.
4. **P1 — Weak artifact traceability:** responses and readiness now include a deterministic SHA-256 model fingerprint alongside the model version.
5. **P1 — Cross-patient history risk:** request validation now rejects mismatched appointment/history patient IDs.
6. **Safety defense-in-depth:** supportive interventions are validated against an allow-list and explicit forbidden care-reduction actions.

## Verification

Hardening regression suite: 6/6 passing. Representative holdout benchmark: Brier 0.18391 vs constant baseline 0.19556; PR-AUC 0.44556; train 840 / holdout 360. This remains representative fixture evidence, not clinical effectiveness evidence.
