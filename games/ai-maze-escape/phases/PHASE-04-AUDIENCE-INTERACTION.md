# Phase 4 — Audience Influence and Chat vs AI

**Target:** R3 interaction beta  
**Software status:** Complete and repository-CI verified  
**Verified implementation head:** `8ee8cffe4c8319439b56ea24276fc7d8039e6c7b`  
**Verification workflow:** GitHub Actions `31976132434`

## Outcome

AI Maze Escape now accepts deterministic, bounded audience influence without surrendering game authority. Every effect is chosen from a server-generated opaque candidate, is checked against solver validity and minimum response distance, is queued once, applied at a fixed tick, recorded append-only and separated from baseline records.

## Effects

- reveal a frontier;
- show a directional hint;
- open an eligible door;
- trigger a temporary fog pulse;
- pause/pulse an active threat;
- add a safe non-critical obstacle;
- add a route resource/checkpoint;
- choose the next maze profile.

## Safety and Integrity

- arbitrary coordinates, provider text and raw payment payloads never enter authority;
- candidate previews must retain a valid inventory-aware solution;
- duplicate delivery is idempotent across retry and snapshot restore;
- expired, terminal-state and invalid commands fail without gameplay mutation;
- reversals are append-only and cannot erase already learned truth;
- irreversible effects explicitly refuse reversal rather than falsifying history;
- fixed vote tokens, one vote per viewer, capped entitlement weighting and named RNG tie-breaks are enforced;
- Chat vs AI rounds obey lifecycle, overlap, cooldown and pressure caps;
- no-audience gameplay remains complete;
- maximum bounded pressure cannot buy an escape, death, record or technical outcome.

## Verification

- 7/7 focused Phase 4 tests passed locally;
- combined Maze regression through Phase 4: 30/30 passed;
- maximum-pressure rerun was byte-deterministic;
- duplicate authoritative applications: 0;
- the exact candidate passed the full repository workflow, both stream self-tests, nondeterminism scan and 6/6 browser checks.

## Acceptance

- [x] Every effect preserves solver validity and declared response distance.
- [x] Provider retries and snapshots cannot duplicate application.
- [x] Vote, entitlement and Chat vs AI state remain bounded and deterministic.
- [x] Reversals and operator/audience history are append-only.
- [x] Baseline and audience-influenced records remain distinct.
- [x] Provider absence does not interrupt autonomous Maze gameplay.
- [x] Full regression and browser capture remain green.

## Exit

Phase 4 is complete. Phase 5 owns durable authority, cross-process recovery, writer fencing, observability, output protection, operator controls and chaos evidence.
