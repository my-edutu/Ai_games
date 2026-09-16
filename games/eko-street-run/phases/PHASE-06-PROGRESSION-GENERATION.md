# Phase 6 — Progression, Procedural Generation and Economy

Status: `VERIFIED — deterministic progression/generation/economy scope`

## Goal

Turn Eko Run from a single authored slice into a deterministic six-district progression loop with replayable procedural route grammar, bounded endless-cycle escalation, intermission/advance authority and a cosmetic-only Eko Token economy.

## Authoritative scope

- Six-district ladder: Mainland Morning → Market Rush → Danfo Junction → Rainy Lagos → Island Night → Bridge Run.
- Deterministic generated route/content grammar keyed by root seed, district and cycle.
- Continuous mandatory backbone, ordered checkpoints, bounded hazards, route decisions, tokens and milestones.
- Explicit generated-content provenance: generator version, district index/id and endless cycle.
- Validated intermission/advance command path; Bridge Run wraps to Mainland Morning and increments cycle.
- Bounded endless-cycle escalation that changes real authoritative hazard density and optional-route risk while preserving Phase 5 response-window fairness.
- Bounded cosmetic-focused Eko Token ledger with idempotent collection, lifetime-earned audit total and no gameplay modifiers.
- Progression, generated content and reward state included in checksum/snapshot/replay contracts.
- Public render snapshot exposes only presentation-safe progression/reward facts; root seed/random streams remain private.
- Active generated content is re-fingerprinted and hard-revalidated at the authoritative invariant boundary; stale `valid` metadata cannot authorize tampered content.

## Acceptance gate

- [x] Same seed + district + cycle generates identical validated content.
- [x] Generated districts preserve a continuous mandatory route backbone and ordered checkpoints.
- [x] Repair/fallback paths are bounded and observable.
- [x] Generated content carries district/cycle/generator provenance and mismatches fail closed.
- [x] District index/id/content drift and cycle/content drift fail closed.
- [x] Token identities remain distinct when a district repeats in a later cycle.
- [x] Later cycles increase real hazard density and optional-route risk rather than metadata only.
- [x] Cycle escalation does not weaken Phase 5 physical reaction-window fairness.
- [x] Token collection is authoritative, idempotent and bounded.
- [x] Lifetime token earnings are bounded, checksummed and survive district advancement.
- [x] Cosmetic rewards cannot modify speed, collision or invulnerability.
- [x] Intermission advance is deterministic and rejected outside intermission.
- [x] Snapshot restore + advance matches uninterrupted authority exactly.
- [x] Bridge Run wrap increments cycle deterministically.
- [x] Stale generated-content fingerprints are rejected.
- [x] Rehashed but invalid generated content is independently rejected.
- [x] Snapshot creation fails closed on mutated generated content.
- [x] Three adversarial review/improvement passes leave no unresolved Phase 6 stop-ship/P1/P2 finding.
- [x] Dedicated Phase 6 evidence and full catalogue CI pass on the exact runtime/evidence candidate.

## Exact evidence candidate

`8d418a4db51acdb094c8b7a20fd1377993400a33`

- Dedicated Phase 6 run: `34977420628` — PASS.
- Full catalogue run: `34977420658` — PASS.
- Evidence artifact: `10400340261`.
- Artifact digest: `sha256:093a82cd316453fc89c30348da1e0501a41bee4f6c06b8832b793f843ad49001`.
- Phase 6 tests: 31/31 PASS.
- Phase 5 regressions: 16/16 PASS.
- Phase 4 regressions: 16/16 PASS.
- Phase 3 regressions: 21/21 PASS.
- Phase 2 regressions: 28/28 PASS.
- Phase 1 regressions: 20/20 PASS.
- Authority boundary scan: PASS.

## Runtime evidence

- Generated districts sampled: 432.
- Valid: 432/432.
- Unique fingerprints: 432.
- Observed fallback rate: 0% in evidence campaign.
- Minimum physical response margin: 1.5 m.
- Snapshot/advance checksum: `8cf7d8f4df25a153` direct and restored.
- Token idempotency: PASS.
- Stale fingerprint rejection: PASS.
- Invalid rehash rejection: PASS.
- Generation p99: `0.298250 ms`; worst: `1.363977 ms`.
- Simulation p99: `1.179761 ms`; worst: `1.577006 ms`.
- Generation budget: p99 <5 ms, worst <16.67 ms — PASS.
- Simulation budget: p99 <4 ms, worst <16.67 ms — PASS.

## Specialist review panel

All 22 Eko specialist domains were used across implementation and three review passes, with the six mandatory lenses applied every time: game creative direction, game architecture, game physics, game-feel/VFX, performance optimization and platformer experience review.

## Non-goals

Phase 6 does not claim final HUD/audio/VFX/game-feel polish, AI Street Run, viewer interaction/economy influence, full district presentation expansion, operations/reliability or production readiness. Those remain later phases, beginning with Phase 7 presentation/game-feel work.
