# Phase 1 — Deterministic Simulation Foundation

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Implement a headless authoritative simulation skeleton that reproduces from versioned inputs before any 3D scene polish.  
**Status:** `planned for immediate implementation after Phase 0 gate`  
**Owning phase:** 1  
**Last material review:** 2026-09-15  
**Phase ID:** `EKO-P01`

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

## Foundation Route

Start x=0, checkpoint x=10, finish x=20, flat ground y=0, bounded route x `[-2,24]`. It is intentionally simple so failures localize to deterministic contracts rather than level design.

## Telemetry / Operations

Headless script reports version, seed, ticks, checkpoint count, lifecycle, final checksum and basic tick timing. Phase 1 does not send network telemetry.

## Security / Privacy

No secrets/viewer data are required. Source IDs in fixtures are synthetic. Public render snapshot excludes internal stream states and stack traces.

## Acceptance Criteria

- same config/seed/accepted commands produce identical checkpoint/final checksums across independent runs;
- simulated render snapshot request cadence cannot alter final checksum;
- duplicate/stale/invalid commands resolve predictably and do not double-apply;
- extra cosmetic random draws cannot perturb authoritative checksum;
- snapshot restore + replay equals uninterrupted final checksum;
- corrupted snapshot/checksum fails with typed integrity error;
- render snapshot is immutable and shares no mutable authority reference;
- no provider/presentation SDK import appears in authority directories;
- headless Foundation Route reaches `completed` without Three.js;
- Phase 1 p99/worst foundation tick measurement meets the declared budget on candidate CI workload;
- full affected catalogue tests are green.

## Evidence

`evidence/eko-run/phase1/PHASE-01-RESULTS.md` records candidate commit, CI run, commands/results, checksums, timing, exclusions and review findings.

## Stop-Ship

Ambient randomness/current time in authority, replay divergence, variable-delta gameplay, presentation mutation, unchecked restore, unbounded queue/history, hidden provider dependency, false playable/stream readiness claim.

## Rollback

Phase 1 introduces no external persistent production data. Revert the candidate commits. Snapshot compatibility is version 1 only; no migration claim is made before production persistence exists.

## Handoff

Phase 2 receives only the public deterministic movement/state/command contracts and expands the kinematic controller under the mechanics-only platformer experience gate.
