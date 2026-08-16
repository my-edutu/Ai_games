# Autonomous Snake Phase 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Every release decision begins with failing tests, retains all Phase 1–5 regressions, and must distinguish CI/synthetic evidence from real production-environment evidence.

**Goal:** Deliver a frozen-release validation and launch-governance system that can run final campaigns, evaluate capacity and endurance, verify provider/safety/drill evidence, control a guarded canary, and return R5 `PASS` only when every real-world production gate is genuinely satisfied.

**Architecture:** A versioned release manifest freezes source/config/content/provider/asset identities. Traceability maps every MUST requirement to current evidence. Deterministic campaign and capacity packages generate reproducible CI evidence. Endurance, provider, drill and canary attestations carry provenance and elapsed-time semantics. A final readiness assessor rejects synthetic, stale, unsigned, wrong-version, incomplete or independently unreviewed evidence and emits the highest truthful readiness state plus exact blockers.

**Tech Stack:** TypeScript 5.8.3, Node.js 22.16, existing deterministic Snake/runtime/audience/operations packages, Node test runner, GitHub Actions artifacts and Playwright 1.55.

## Global Constraints

- Candidate source, deterministic, config, content, snapshot, event, provider, asset and deployment versions are immutable after freeze.
- Material code/config/content/provider changes invalidate affected evidence and restart the owning validation clock.
- Every MUST requirement must map to current-version primary evidence.
- Synthetic or accelerated duration evidence can test logic but cannot satisfy real 72-hour soak or seven-day canary gates.
- Fixture/provider-contract evidence cannot satisfy credentialed production-equivalent provider validation.
- CI hardware cannot be labelled production-reference unless an explicit environment attestation says so.
- A readiness assessor cannot return `PASS` without an independent reviewer verdict and zero P0/P1 findings.
- Canary rollback triggers are immutable before canary start and fail closed for replay divergence, duplicate paid-eligible effects, private/secret exposure, unauthorized control, unsafe moderation, unbounded resource growth, repeated crash loop, failed restore, persistent bad output, record corruption or platform-policy breach.
- Public/repository status remains below R5 until the final assessor returns `PASS`.
- All Phase 1–5 tests remain green.

---

### Task 1: Frozen Release Manifest and Material-Change Detection

Create `packages/release-governance/src/manifest.ts`, `hashes.ts` and tests. Define exact versions, artifacts, flags, owners, environment, rollback and candidate checksum. Freeze is immutable; changed source/config/content/provider/asset identity returns a typed invalidation set.

### Task 2: MUST Requirement Traceability

Create `packages/release-governance/src/traceability.ts` and tests. Validate required IDs, evidence digests, source/version compatibility, expiry, owner and status. Missing, stale, wrong-version, duplicate or waived P0/P1 evidence fails.

### Task 3: Final Deterministic Simulation and Interaction Campaign

Create `packages/release-validation/src/campaign.ts`, a CLI and tests. Run stratified topology/no-audience/maximum-bounded-pressure corpora, record outcomes, progress, strategy/content diversity, fallback/replan/stagnation, invariants, duplicates and deterministic rerun checksums. Evidence is CI statistical validation, not production elapsed time.

### Task 4: Capacity, Resource-Slope and Endurance Evaluators

Create `packages/release-validation/src/capacity.ts`, `endurance.ts` and tests. Calculate percentiles, worst case, headroom, queue/resource slopes and anomaly windows. Synthetic samples are labelled and cannot satisfy `productionReference` or `realElapsed` gates.

### Task 5: Provider, Security, Moderation, Accessibility and Asset Evidence Contracts

Create `packages/release-validation/src/attestations.ts` and tests. Require provenance, environment, candidate checksum, primary evidence digest, timestamps and explicit live/credentialed/reference flags. Fixture validation is recorded but cannot impersonate live evidence.

### Task 6: Operational Drill Programme

Create `packages/release-validation/src/drills.ts`, deterministic drill fixtures, runbook mapping and tests. Validate every mandatory outage, disable, component failure, output fault, snapshot fallback, divergence quarantine, credential action, rollback, safe scene and emergency halt drill with owner, start/end, result and evidence digest.

### Task 7: Seven-Day Canary Controller and Rollback Guardrails

Create `packages/canary-control/src/*` and tests. Freeze thresholds before start, ingest monotonic production samples, detect rollback triggers immediately, prevent promotion before seven real elapsed days, restart the clock after material change and preserve immutable incident history.

### Task 8: Independent R5 Readiness Assessor

Create `packages/readiness-assessor/src/*` and tests. Combine manifest, traceability, campaigns, capacity, attestations, endurance, drills, canary and review. Return `PASS`, `BLOCKED`, or `FAIL`; include exact blockers and highest truthful readiness. Synthetic evidence must never produce R5 `PASS`.

### Task 9: Release Bundle, CI Artifacts, Status and Handoff

Create `scripts/run-phase6-validation.cjs`, evidence under `evidence/autonomous-snake/r5-phase-06/phase-06/`, release notes, rollback matrix and operational handoff. CI uploads release-validation artifacts. Repository/game status is updated only to the assessor’s actual verdict.

## Exit Gate

The implementation phase may merge only when all Phase 1–6 tests, strict build, stream self-test, nondeterminism scan, final campaign, validation bundle and Chromium capture pass on the exact PR head, with no P0/P1 implementation finding.

An **R5 production-ready claim** is a separate runtime verdict and requires actual production-reference, credentialed provider, 72-hour real elapsed, seven-day real canary and independent-review attestations. When those are absent, the merged implementation must report `BLOCKED` rather than fabricate completion.