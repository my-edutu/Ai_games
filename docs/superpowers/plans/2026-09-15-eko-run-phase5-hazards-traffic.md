# Eko Run Phase 5 — Fair Hazards and Lagos Traffic Implementation Plan

> **Execution rule:** Phase 5 is authoritative gameplay work. Tests are committed and observed RED before production implementation. Three later adversarial criticise → improve passes must each add a falsifiable regression before a fix is accepted.

## Goal

Build the first deterministic Lagos-inspired hazard and traffic layer on top of the verified Phase 1–4 movement/character/world contracts. Ordinary failures must be readable, causal and avoidable; moving traffic may be visually energetic but may never create hidden teleport/acceleration or bypass the fixed-60 Hz authority.

## Architecture

- Existing `createInitialState` and Foundation Route remain backward-compatible for Phase 1–4 regressions.
- Phase 5 introduces an explicit `createPhase5State` factory and `mainland-hazard-001` route so all hazard families can be exercised without rewriting historical fixtures.
- Hazard runtime state lives inside authoritative `EkoRunState` and is included in checksums/snapshots.
- Hazard contracts are deterministic from route + root seed. Seed variation may change traffic phase offsets, never warning-window/fairness constraints.
- `stepSimulation` remains the sole authoritative mutation loop; Three.js and presentation only consume sanitized snapshot/event facts.
- Hazard subsystem uses its own `hazardSchemaVersion` so additive Phase 5 authority does not falsify the historical global `0.2.0/schema-2` foundation evidence.

## Hazard families

Implement contracts for:

1. danfo pull-out/crossing
2. Molue-style large vehicle crossing
3. pothole
4. open drain
5. construction trench/barrier
6. puddle/flood zone
7. handcart/hawker-cart movement
8. rolling loose object
9. crowd compression
10. non-graphic street argument/disturbance
11. temporary blocked route

Each contract must define cue/caption semantics, collision footprint, warning distance, minimum response ticks, legal responses, consequence, active timing if dynamic, and bounded deterministic motion where applicable.

## Base RED corpus

Create Phase 5 tests before implementation covering:

- all 11 families and unique IDs;
- explicit Phase 5 route/state factory;
- seeded deterministic campaigns;
- minimum response-window math at maximum closing speed;
- moving traffic per-tick speed bounds/no teleport;
- warning → causal hit semantic events;
- jump/slow/wait avoidance semantics;
- severe hazards produce gameplay failure rather than technical/integrity failure;
- hazard runtime state participates in checksum/snapshot/replay;
- render snapshot contains only sanitized public hazard facts;
- Phase 1–4 regression suites stay green.

Expected RED reason: Phase 5 APIs/state/route do not exist yet.

## Base implementation

Primary files:

- `games/eko-street-run/src/hazards/index.ts`
- `games/eko-street-run/src/state/types.ts`
- `games/eko-street-run/src/state/create-state.ts`
- `games/eko-street-run/src/rules/route.ts`
- `games/eko-street-run/src/runtime/simulation.ts`
- `games/eko-street-run/src/runtime/checksum.ts`
- `games/eko-street-run/src/presentation/snapshot.ts`
- `games/eko-street-run/src/index.ts`
- `scripts/run-eko-run-phase5-evidence.cjs`
- `.github/workflows/eko-run-phase5.yml`

Base gate:

- focused Phase 5 GREEN;
- Phase 1–4 regressions GREEN;
- authority/presentation boundary scan GREEN;
- deterministic evidence runner within p99 < 4 ms / worst < 16.67 ms.

## Review / improvement pass 1 — combination fairness

Attack authored hazard spacing and cognitive overload. Add RED regression proving individually-fair hazards can still become unfair when warning/collision/recovery regions are placed too tightly. Fix campaign validation so ordinary combinations preserve an independent legal response window.

## Review / improvement pass 2 — punishment grace

Attack restored/teleported/high-relative-speed states. Add RED regression proving a player cannot be punished on the same tick as their first valid warning. Fix the authority so a hazard may only punish after its declared `minResponseTicks` have elapsed since warning; unfair same-tick overlap must warn/defer rather than hit.

## Review / improvement pass 3 — restart exploit

Attack failure/restart persistence. Add RED regression proving hazards at/after a checkpoint cannot remain permanently consumed after a failed encounter, allowing a free post-restart route. Fix checkpoint restart so future/current-checkpoint hazard encounters reset deterministically while completed hazards behind the checkpoint remain resolved.

## Final evidence and merge gate

Create:

- `evidence/eko-run/phase5/PHASE-05-REVIEW-1.md`
- `PHASE-05-REVIEW-2.md`
- `PHASE-05-REVIEW-3.md`
- `PHASE-05-EXPERIENCE-REVIEW.md`
- `PHASE-05-RESULTS.md`
- update `games/eko-street-run/phases/PHASE-05-HAZARDS-TRAFFIC.md`
- update `REQUIREMENT_TRACEABILITY.md`

Before merge require:

- no unresolved stop-ship/P1/P2 Phase 5 finding;
- exact closure-head focused workflow GREEN;
- exact closure-head full catalogue GREEN;
- deterministic replay/snapshot evidence GREEN;
- performance budget GREEN;
- PR scope limited to Eko Phase 5 and shared package/workflow metadata required by it;
- post-merge verification on the merge SHA.
