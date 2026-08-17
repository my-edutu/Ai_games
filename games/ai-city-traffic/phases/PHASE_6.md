# Phase 6 — Release Candidate and Governance

**Exit status:** software complete at R4 production-candidate level.

Implemented exact-SHA release manifests, six-phase traceability, final deterministic baseline and pressure campaigns, chaos evidence, integrity and capacity gates, production evidence contracts, readiness scoring, fail-closed R5 blockers, CI evidence generation, atomic persistent snapshots, corruption quarantine, bounded recovery crash-loop protection, handoff, evidence intake, phase ledger, and review artifacts.

Evidence command: `npm run test:traffic:phase6` and `CANDIDATE_SOURCE_SHA=<40-char-sha> npm run traffic:phase6:validate`.

R5 remains blocked until real exact-candidate external evidence passes. This is an explicit release boundary, not unfinished software work.
