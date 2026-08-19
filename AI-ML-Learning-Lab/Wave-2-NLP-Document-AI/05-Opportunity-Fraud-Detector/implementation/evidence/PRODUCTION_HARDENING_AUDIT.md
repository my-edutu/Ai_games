# Project 05 Production Hardening Audit

- Chronological campaign holdout enforced; training and holdout campaigns do not overlap.
- Reviewer queue combines hard evidence escalation with a calibrated top-risk budget.
- Adversarial zero-width/leetspeak normalization covered by regression tests.
- API uses the exact trained bundle probability path and fails closed without a configured artifact.
- Artifact SHA, model/data/threat-policy versions are returned.
- Output is explicitly risk evidence, never a legal conclusion.
- Representative benchmark: PR-AUC 0.889; Brier 0.0619 vs baseline 0.2440; review precision 0.890; severe recall 1.000.
- Representative evidence only; production remains gated on live reviewer shadow validation.
