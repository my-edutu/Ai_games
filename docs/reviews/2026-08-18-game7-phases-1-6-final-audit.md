# Game 7 final audit — Phases 1–6

**Game:** Marble Survival Tournament  
**Branch:** `feat/game-7-marble-survival`  
**Audit date:** 2026-08-18  
**Decision boundary:** software-candidate review, not production certification

## Executive assessment

The branch now contains a complete, isolated Game 7 candidate spanning deterministic authority, local AI, the five-round elimination campaign, responsive browser-source presentation, bounded viewer influence, authenticated operations, recovery mechanisms, automated verification, and release-evidence gating.

The correct release classification is:

- **R4 software candidate:** eligible only after the fresh branch checks and pull-request checks pass.
- **R5 production-ready:** **not approved** from this implementation alone.

R5 requires observed external evidence that cannot be generated truthfully by source code or a unit-test suite.

## Phase assessment

| Phase | Scope reviewed | Result |
|---|---|---|
| 1 | deterministic roster, RNG, arenas, identities, invariants | Implemented with automated gates |
| 2 | bounded AI, five rounds, exact bracket, replay, balance corpus | Implemented with automated gates |
| 3 | sanitized snapshots, responsive/clean feed, canvas UI, audio/accessibility | Implemented; production accessibility review remains external |
| 4 | six fixed influence families, abuse bounds, deterministic resolution | Implemented with automated gates |
| 5 | health, metrics, auth, audit bounds, snapshot fallback, chaos checks | Implemented; witnessed drill remains external |
| 6 | CI, release report, runbook, evidence boundary | Implemented; R5 evidence intentionally missing |

## Critical findings reviewed

### P1 — archetype monopoly risk

**Risk:** A deterministic scoring model can accidentally make one archetype structurally dominant across the seed corpus.  
**Treatment:** Four evenly sized archetypes, rotating round affinities, independent named score streams, deterministic tie-breaking, and a corpus gate requiring every archetype to win.  
**Status:** Software mitigation and regression gate implemented. Production telemetry must still watch long-run win distribution.

### P1 — championship geometry bias

**Risk:** An asymmetric final arena can predetermine lane advantage.  
**Treatment:** Championship features are authored as left-side features plus exact mirrored pairs with equal type, radius, and Y coordinate.  
**Status:** Resolved in code and invariant test.

### P1 — authority-state leakage

**Risk:** Public snapshots could expose the root seed, RNG state, operator token, or audit data.  
**Treatment:** Presentation snapshots are constructed from an allow-listed public schema and expose only a campaign checksum, round data, bounded leaderboard, arena geometry, marble presentation state, champion, and camera directive.  
**Status:** Resolved in code and server self-test.

### P1 — arbitrary or replayed viewer mutation

**Risk:** Audience input could become an unbounded physics-control or replay channel.  
**Treatment:** Exactly six fixed families, fixed options, eligibility checks, idempotency, per-user cooldown, global rate cap, hard queue cap, bounded dedupe, deterministic tie-breaking, and no free-form physics payload.  
**Status:** Resolved in code and tests.

### P1 — corrupt latest snapshot

**Risk:** A process could restore the newest entry without integrity verification and continue from corrupt state.  
**Treatment:** Every snapshot stores a checksum. Recovery scans newest to oldest and selects the newest valid payload, explicitly reporting fallback.  
**Status:** Resolved in code and chaos test. A witnessed production drill remains required.

### P1 — operator endpoint abuse

**Risk:** Public callers could pause, restart, or alter the feed.  
**Treatment:** Bearer token authentication, constant-work digest comparison, allow-listed commands, request-body limit, security headers, bounded audit history, and explicit denial tests.  
**Status:** Software control implemented. Deployment must load the token from a secret manager and restrict ingress/observability paths.

### P2 — colour-only marble identity

**Risk:** Competitors may be indistinguishable for viewers with colour-vision differences or low-quality streams.  
**Treatment:** Every archetype has a visible geometric pattern in the arena and legend in addition to colour.  
**Status:** Implemented. Independent accessibility review remains required for R5.

### P2 — audio fatigue and autoplay

**Risk:** Continuous or automatic sound can make a long-running stream unpleasant and violate browser expectations.  
**Treatment:** Sound starts only after explicit viewer action, uses short semantic synthesized cues, and caps processed recent events. The same state remains visible without audio.  
**Status:** Implemented.

## Verification matrix

The branch workflow is expected to run:

1. locked repository dependency installation;
2. repository build baseline;
3. syntax checks for authority, server, release verifier, and client;
4. Phase 1–6 Node test suite;
5. ninety-six-seed campaign/replay corpus;
6. declared chaos suite;
7. R4/R5 release validator;
8. browser-source HTTP self-test;
9. authority ambient-nondeterminism scan;
10. static browser/accessibility-hook checks;
11. release-report artifact upload.

A green workflow is necessary for R4 but is not sufficient for R5.

## External blockers retained deliberately

The following are not software implementation tasks and must not be marked complete without genuine evidence:

- **72-hour endurance run:** continuous candidate operation with resource, lag, error, recovery, and broadcast-quality telemetry.
- **Seven-day canary:** limited production exposure with agreed success/error budgets and rollback evidence.
- **Credentialed provider session:** a real production streaming-provider connection using production credential handling.
- **Independent security review:** reviewer, method, scope, findings, fixes, and approval.
- **Independent accessibility review:** keyboard, screen-reader, contrast, reduced motion, non-colour identity, zoom, mobile, and clean-feed evaluation.
- **Witnessed recovery drill:** checksum fallback, restart, replay proof, operator auth, and stream-continuity evidence signed by a witness.
- **Production capacity proof:** representative concurrency, host limits, network behavior, queue behavior, and headroom.

## Final disposition

**Implementation disposition:** ready for pull-request review after fresh checks.  
**Candidate disposition:** R4 only when branch and PR verification are green.  
**Production disposition:** R5 remains false until every external proof is attached, independently reviewed, and explicitly approved.
