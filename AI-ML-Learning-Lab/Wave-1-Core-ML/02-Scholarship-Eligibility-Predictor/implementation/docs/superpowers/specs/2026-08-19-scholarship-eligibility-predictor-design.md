# Scholarship Eligibility Predictor Design

## Purpose
Build an auditable scholarship decision-support system with two strictly separated outputs: deterministic policy eligibility and optional probabilistic application suitability.

## Decision architecture
The policy engine owns eligibility. It evaluates versioned scholarship criteria against validated applicant data and emits `eligible`, `ineligible`, or `needs_review`, with unmet/unknown criteria and source/version trace. Unknown or ambiguous required values never become guessed facts.

The predictive model estimates application suitability only from non-protected, non-policy-outcome features. It cannot change eligibility, is suppressed for ineligible applicants, and always carries a non-guarantee disclaimer. Threshold selection explicitly protects high-cost cohorts from recall degradation.

## Data and governance
Scholarship policy and applicant records have separate schemas. Policy versions carry source provenance and effective/deadline dates. Representative predictive data is deterministic and snapshot-hashed. Protected attributes are excluded from predictive features and used only for justified post-hoc evaluation where permitted.

## Operations
Policy and model registries have independent activation and rollback. Monitoring distinguishes policy/data quality failures from model distribution drift. An append-only audit log records decision IDs and active versions.

## Release boundary
The included pilot is representative and hand-authored/synthetic; it is not real-world impact evidence. Production release evidence must include model/data cards, policy runbook, monitoring, security/privacy, ownership, rollback, release checklist, and pilot report, and must contain no guarantee claims.
