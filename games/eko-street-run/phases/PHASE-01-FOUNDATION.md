# Phase 1 — Deterministic Simulation Foundation

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Implement a headless authoritative simulation skeleton that reproduces from versioned inputs before any 3D scene polish.  
**Status:** `verified — deterministic foundation scope only`  
**Owning phase:** 1  
**Last material review:** 2026-09-15  
**Phase ID:** `EKO-P01`  
**Verified runtime candidate:** `b7b234f2d668c193ba106d1b67f18fa260a5630c`

## Viewer-Visible / Executable Outcome

A headless Foundation Route can be driven through the public command interface, reach a checkpoint and finish, emit semantic events/render snapshots, replay identically and restore from a verified snapshot. There is no claim of final movement feel or playable Three.js presentation.

## Scope

- version/config constants;
- serializable authoritative state;
- named PRNG streams;
- stable command validation/order/deduplication;
- minimal horizontal/gravity/flat-ground kinematic integration;
- Foundation Route checkpoint/finish rules;
- semantic events;
- canonical checksum;
- immutable render snapshot projection;
- replay/snapshot/restore/corruption detection;
- architecture boundary tests;
- headless demonstrator and performance baseline.

## Non-Scope

Jump/slide/vault tuning, hazards/traffic, procedural route construction, AI policy, Three.js, Web Audio, HUD, audience providers, persistence service, economy and final production operations.

## Requirements Addressed

`FR-GAME-001`, foundation subset of `FR-GAME-002`, `NFR-DET-001`, `NFR-DET-002`, `NFR-DET-003`, `NFR-ARCH-001`, `NFR-ARCH-002`, `NFR-PERF-001`, Phase 1 subset of `NFR-SEC-001`, `NFR-REL-001`.

## Files

Implementation and test paths are locked in `docs/superpowers/plans/2026-09-15-eko-run-phase0-1-implementation.md`.

## Test-First Sequence

1. add failing Eko foundation tests against public contracts;
2. verify RED in GitHub Actions because the current tool container cannot clone external GitHub;
3. implement version/state/PRNG/checksum;
4. implement command/route/minimal physics/tick;
5. implement presentation projection/replay/restore;
6. run focused Eko suite, full catalogue suite and headless script;
7. record checksums and performance evidence;
8. run spec-compliance and engineering/experience review.

The sequence was completed with two restore-integrity regressions discovered and closed before the final candidate was verified.

## Foundation Route

Start x=0, checkpoint x=10, finish x=20, flat ground y=0, bounded route x `[-2,24]`. It is intentionally simple so failures localize to deterministic contracts rather than level design.

Verified headless route ID: `foundation-straight-001`.

## Telemetry / Operations

Headless script reports version, seed, ticks, checkpoint count, lifecycle, final checksum and basic tick timing. Phase 1 does not send network telemetry. Operational timing is excluded from authoritative state/checksums.

## Security / Privacy

No secrets/viewer data are required. Source IDs in fixtures are synthetic. Public render snapshot excludes internal stream states and stack traces.

## Acceptance Criteria

- [x] same config/seed/accepted commands produce identical checkpoint/final checksums across independent runs;
- [x] simulated render snapshot request cadence cannot alter final checksum;
- [x] duplicate/stale/invalid commands resolve predictably and do not double-apply;
- [x] extra cosmetic random draws cannot perturb authoritative checksum;
- [x] snapshot restore + replay equals uninterrupted final checksum;
- [x] corrupted snapshot/checksum fails with typed integrity error;
- [x] envelope/state version mismatch fails typed rather than restoring;
- [x] render snapshot is immutable and shares no mutable authority reference;
- [x] no provider/presentation SDK import appears in authority directories;
- [x] headless Foundation Route reaches `completed` without Three.js;
- [x] Phase 1 p99/worst foundation tick measurement meets the declared budget on candidate CI workload;
- [x] full affected catalogue tests are green.

## Verified Evidence

Primary record: `evidence/eko-run/phase1/PHASE-01-RESULTS.md`.

Exact runtime candidate `b7b234f2d668c193ba106d1b67f18fa260a5630c` produced:

- focused Eko Phase 1 GitHub Actions run `34929904427`: **20/20 PASS**;
- route lifecycle: `completed` in `207` ticks;
- checkpoint checksum: `9d83188b86930044`;
- final checksum: `50f9432c0e7b57b4`;
- p99 tick: `0.175388 ms` against `< 4 ms` budget;
- worst tick: `0.204772 ms` against `< 16.67 ms` budget;
- full catalogue GitHub Actions run `34929904443`: **391/391 Node tests PASS**, existing stream self-tests PASS, nondeterminism scan PASS, existing release validations PASS and **15/15 browser tests PASS**.

## Stop-Ship Review

No Phase 1 stop-ship condition remains on the verified runtime candidate: no ambient authority randomness/current time, replay divergence, variable-delta gameplay, presentation mutation, unchecked restore or hidden provider dependency was observed by the named gates.

This verdict is limited to Phase 1. It does not constitute playable, stream-ready or production-ready status.

## Rollback

Phase 1 introduces no external persistent production data. Revert the candidate commits. Snapshot compatibility is version 1 only; no migration claim is made before production persistence exists.

## Handoff

Phase 2 receives only the verified public deterministic movement/state/command contracts and expands the kinematic controller under the mechanics-only platformer experience gate. This Phase 1 closure does not itself start Phase 2.
