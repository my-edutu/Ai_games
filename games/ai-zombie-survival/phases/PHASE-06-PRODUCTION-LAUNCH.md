# Phase 6 — Production Validation and Launch Governance

**Target:** R5 production ready  
**Software status:** IMPLEMENTED — verification is attached to the active completion PR  
**Truthful release status:** R4 candidate; R5 BLOCKED until genuine external launch evidence exists

## Implemented software gates

- Exact-source release manifest bound to a full Git commit SHA.
- Candidate-bound Phase 3, Phase 5, and Phase 6 software evidence digests.
- Six-phase MUST-requirement traceability with candidate/release checksum binding.
- Deterministic baseline and maximum bounded audience-pressure campaigns with byte-equivalent rerun checks.
- Integrity gates for technical outcomes, hidden-information violations, replay divergence, duplicate effects, unauthorized controls, and private exposure.
- Phase 5 chaos/recovery evidence as a software prerequisite.
- Capacity budgets with an explicit production-reference provenance requirement.
- Real-duration endurance contract requiring at least 72 real elapsed hours; accelerated or synthetic duration cannot satisfy it.
- Credentialed production-equivalent YouTube and Twitch provider evidence contracts.
- Security, privacy, moderation, accessibility, audiovisual, asset, and supply-chain attestation contracts.
- Mandatory drill programme tied to the Zombie operations runbook; production acceptance requires production-equivalent execution, external signature, and independent witness.
- Seven-real-day canary controller with integrity and quantitative rollback triggers.
- Current-candidate external signed independent-review requirement.
- Fail-closed assessor: `FAIL` for integrity defects, `BLOCKED` for missing external evidence, and `PASS / R5 / productionReady=true` only when every real gate is satisfied.
- Candidate validation CLI plus retained `ai-zombie-survival-phase6-validation` artifact.

## Test-first evidence

- `tests/phase6/zombie-release-evidence.test.cjs`
- `tests/phase6/zombie-validation.test.cjs`
- `npm run test:zombie:phase6`
- `CANDIDATE_SOURCE_SHA=<40-char-sha> npm run zombie:phase6:validate`

The suite explicitly proves that synthetic fixtures, CI-only drills, accelerated timestamps, provider stubs, self-review, and synthetic canary samples cannot promote the candidate above R4.

## External R5 blockers software must not fabricate

1. Production-reference capacity evidence for the exact release candidate.
2. At least 72 real elapsed endurance hours with bounded resource slopes and zero integrity failures.
3. Credentialed production-equivalent validation for YouTube and Twitch.
4. Current external security, privacy, moderation, accessibility, audiovisual, asset, licensing, and supply-chain attestations.
5. All mandatory drills executed in production-equivalent or production conditions with an independent witness and externally signed evidence.
6. A clean seven-real-day canary for the exact candidate with no rollback trigger.
7. A current external signed independent review for the exact release checksum with no open P0/P1 findings.

## Review and remediation

| Severity | Finding | Resolution |
|---|---|---|
| P1 | Prior wording could be read as a Phase 6 implementation claim without current-head proof. | Software completion is tied to the active PR checks and candidate-bound artifact; R5 remains a separate external decision. |
| P1 | The prior rollback SHA belonged to a divergent historical branch. | The merge base is current `main`; the exact validated PR head and its Phase 5 artifact define the current software rollback evidence. |
| P0 | None found. | — |

## Exit decision

Phase 6 software is complete only when the exact PR head passes the full repository suite, Zombie stream self-test, authoritative nondeterminism scan, Phase 5 chaos generation, Phase 6 validation generation, Chromium/browser verification, and artifact publication. Even then, the truthful readiness result remains `BLOCKED / R4 / productionReady=false` until all external blockers above are independently satisfied.
