# Phase 6 — Production Validation and Launch Governance

**Target:** R5 production ready  
**Software status:** IMPLEMENTED — pending exact-head CI verification  
**Truthful release status:** R4 candidate; R5 BLOCKED until real external launch evidence exists

## Implemented software gates
- Exact-source release manifest bound to a full Git commit SHA.
- Candidate-bound Phase 3, Phase 5 and Phase 6 software evidence digests.
- Six-phase MUST requirement traceability with current candidate/release checksum binding.
- Deterministic baseline campaign plus maximum bounded audience-pressure campaign and byte-equivalent rerun checks.
- Integrity gates for technical outcomes, hidden-information violations, replay divergence, duplicate effects, unauthorized controls and private exposure.
- Phase 5 chaos/recovery evidence reused as an implementation prerequisite.
- Capacity budgets and explicit production-reference provenance requirement.
- Real-duration endurance evidence contract requiring at least 72 real elapsed hours; accelerated/synthetic duration cannot satisfy it.
- Credentialed production-equivalent YouTube and Twitch provider evidence contracts.
- Security, privacy, moderation, accessibility, audiovisual, asset and supply-chain attestation contracts.
- Full mandatory drill programme tied to the Zombie operations runbook; production acceptance requires production-equivalent execution, external signature and independent witness.
- Seven-real-day canary controller with integrity and quantitative rollback triggers.
- Current-candidate external signed independent-review requirement.
- Fail-closed readiness assessor that returns `FAIL` for integrity defects, `BLOCKED` for missing external evidence and `PASS/R5` only when every real gate is satisfied.
- Candidate validation CLI and CI artifact generation for Phase 5 operations and Phase 6 release-validation evidence.

## External R5 blockers that software must not fabricate
1. Production-reference capacity evidence for the exact release candidate.
2. At least 72 real elapsed endurance hours with bounded resource slopes and zero integrity failures.
3. Credentialed production-equivalent validation for YouTube and Twitch.
4. Current external safety/privacy/moderation/accessibility/audiovisual/assets/supply-chain attestations.
5. All mandatory drills executed in production-equivalent or production conditions with an independent witness and externally signed evidence.
6. A clean seven-real-day canary for the exact candidate with no rollback trigger.
7. A current external signed independent review for the exact release checksum with no open P0/P1 findings.

Synthetic timestamps, fixture providers, CI-only drills, synthetic canary samples and self-review remain useful implementation tests but are deliberately incapable of promoting the candidate to R5.

## Rollback boundary
The verified Phase 5 source `f3ee747272dc95e3f90e9caa625ab9d6a3f709bf` is recorded as the Phase 6 rollback boundary. Incompatible deterministic/config/content evidence requires a fresh run; snapshots must never be coerced across incompatible authority boundaries.

## Exit decision
Phase 6 software may be marked complete only after the current exact head passes the full repository suite, Zombie stream self-test, authoritative nondeterminism scan, Phase 5 chaos evidence generation, Phase 6 validation generation, Chromium/browser verification and artifact publication. R5 production readiness remains a separate evidence decision and cannot be claimed from CI alone.
