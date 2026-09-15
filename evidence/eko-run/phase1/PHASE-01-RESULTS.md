# Eko Run Phase 1 Results

**Phase:** 1 — Deterministic Simulation Foundation  
**Verification date:** 2026-09-15  
**Runtime candidate:** `b7b234f2d668c193ba106d1b67f18fa260a5630c`  
**Status:** `VERIFIED — deterministic foundation scope only`

Phase 1 proves the headless deterministic authority required before movement feel, hazards, 3D presentation, AI/autoplay, audience interaction or production operations are introduced. It does **not** claim that Eko Run is yet a playable or visually complete game.

## Exact-Candidate Verification

### Focused Eko Run gate

GitHub Actions run `34929904427` executed the dedicated Phase 1 workflow on the exact runtime candidate.

- TypeScript build: PASS
- Eko Phase 1 tests: **20/20 PASS**
- headless Foundation Route: PASS
- evidence artifact: `eko-run-phase1-foundation`
- artifact digest: `sha256:17cc317b708893c1ddef4f85f271753a7bbcb02265085dca4c2825d37dc311fa`

### Catalogue regression gate

GitHub Actions run `34929904443` executed the full catalogue workflow on the same runtime candidate.

- Node test suite: **391/391 PASS**
- existing Snake/Maze/Ant/Tower stream self-tests: PASS
- authoritative nondeterminism scan, including Eko Run authority: PASS
- existing catalogue chaos/release-validation generation: PASS
- browser verification: **15/15 PASS**
- evidence uploads: PASS

No regression blocker remained in the affected catalogue workflow.

## Headless Foundation Route Evidence

The dedicated runner exercised Eko Run only through its public API with seed `eko-phase1-ci`.

| Field | Verified value |
|---|---|
| game version | `0.1.0` |
| deterministic version | `1` |
| route | `foundation-straight-001` |
| lifecycle | `completed` |
| ticks | `207` |
| checkpoints | `1` |
| checkpoint checksum | `9d83188b86930044` |
| final checksum | `50f9432c0e7b57b4` |
| p99 tick | `0.175388 ms` |
| worst tick | `0.204772 ms` |

Declared Phase 1 performance budgets are p99 `< 4 ms` and worst tick `< 16.67 ms` on the candidate CI workload. The measured run is inside both budgets. Timing is operational evidence only and is not part of authoritative gameplay state.

## Acceptance Review

- PASS — identical seed/config/normalized commands produce identical checkpoint and final checksums.
- PASS — render-snapshot request cadence cannot alter authoritative outcome.
- PASS — named cosmetic random draws cannot perturb authoritative streams.
- PASS — command ordering is stable; invalid, duplicate and stale commands are rejected predictably without double application.
- PASS — snapshot restore plus remaining commands matches uninterrupted execution.
- PASS — corrupted/unsupported snapshots fail typed instead of restoring silently.
- PASS — snapshot envelope and embedded state versions must agree before restore is accepted.
- PASS — public render snapshots are deeply frozen, sanitized projections with no mutable authority reference or PRNG internals.
- PASS — authority directories are included in the catalogue nondeterminism scan and contain no provider/presentation dependency.
- PASS — the Foundation Route completes headlessly without Three.js.
- PASS — p99/worst tick evidence meets the declared Phase 1 CI budget.
- PASS — the full catalogue workflow remains green on the candidate.

## Review Findings Closed During Phase 1

Two restore-integrity issues were found by test/review and fixed before verification:

1. checksum validation originally happened after state invariants, allowing corrupted payloads to surface as an internal invariant error rather than the required typed integrity failure;
2. a payload with a recomputed valid checksum could carry state-version metadata inconsistent with its snapshot envelope unless envelope/state version equality was explicitly enforced.

Both cases now have regression coverage and pass on the verified candidate.

## Explicit Non-Claims / Open Work

Phase 1 does **not** verify or claim:

- final run/jump/slide/vault controller feel;
- camera feel or gameplay framing;
- hazards, traffic, potholes, drains, crowds or fairness telegraphs;
- character/outfit art, animation or cloth behaviour;
- Three.js world/rendering, Web Audio, HUD or mobile presentation;
- district generation or Lagos visual authenticity in runtime;
- AI/autoplay policy or human-vs-AI parity beyond the shared command boundary;
- viewer influence, moderation, providers or economy;
- accessibility presentation;
- external persistence service, long-running recovery or production readiness.

Those remain owned by later phases in `REQUIREMENT_TRACEABILITY.md`.

## Review Limitation

This environment did not expose a separate reviewer-agent dispatcher. Phase 1 therefore used a requirement-by-requirement diff review plus two independent GitHub Actions verification surfaces. This is not represented as an external independent production review.

## Phase 1 Verdict

**VERIFIED for the deterministic simulation foundation defined by `EKO-P01`.** No Phase 1 stop-ship condition remains on candidate `b7b234f2d668c193ba106d1b67f18fa260a5630c`. Phase 2 may build on these public authority contracts, but Phase 2 has not been started by this closure record.
