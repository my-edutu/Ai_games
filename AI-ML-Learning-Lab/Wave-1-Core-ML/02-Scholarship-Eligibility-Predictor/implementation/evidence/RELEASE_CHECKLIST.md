# Release Checklist
owner: Product & ML
status: engineering candidate verified

- [x] Eligibility rules are deterministic and source/version traceable.
- [x] Unknown/ambiguous policy inputs return needs-review.
- [x] Predictive suitability cannot override eligibility.
- [x] Protected attributes are excluded from predictive features.
- [x] Calibration and PR-AUC benchmark recorded.
- [x] High-cost cohort recall guardrail tested.
- [x] API separates eligibility and suitability.
- [x] Policy/model registries and rollback are independent.
- [x] Representative blind-review/comprehension pilot has zero P0/P1 findings.
- [x] Security/privacy, ownership, monitoring and rollback documents exist.
- [ ] Real-user controlled pilot and live operational evidence completed.
