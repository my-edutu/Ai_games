# Phase 1 — Deterministic Headless Foundation

**Phase status:** Not started  
**Readiness target:** R1 headless prototype  
**Viewer-visible outcome:** A complete autonomous Snake run can start, move, eat, grow, lose or reach a simple conquest target, show a textual result, and restart from a new seed without a renderer or provider.

## Objective

Implement the smallest authoritative vertical slice that proves the shared `GameModule` contract, fixed-step rules, seeded state, deterministic fallback agent, events, snapshots, replay, headless runner, and automated restart. This phase establishes truth; later phases may add intelligence and spectacle without duplicating rules.

## In Scope

- monorepo/package scaffolding required by the Snake module;
- versioned manifest and configuration schema;
- integer grid/board/body state;
- classic open-board profile;
- standard food generation and growth;
- wall/self collision and simple conquest/terminal result;
- one bounded deterministic fallback movement policy;
- lifecycle from initialization through intermission/restart;
- named random streams;
- semantic events and normalized progress signals;
- snapshot codec, checksum, restore, replay;
- headless CLI/test runner;
- baseline structured telemetry and evidence manifest.

## Explicit Non-Scope

Advanced safe-path AI, procedural topology families, hazards, portals, special food, graphics/audio, audience interactions, provider adapters, production persistence, operator dashboard, long soak, and public launch.

## Requirements Addressed

`FR-SNK-001`–`FR-SNK-008` at foundation scope; `FR-SNK-AI-005`; `FR-SNK-OPS-001`–`FR-SNK-005` at local/headless scope; `NFR-SNK-DET-001`; foundational portions of performance, security, and testing requirements.

## Expected Files and Interfaces

- root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, TypeScript/test configuration;
- `packages/game-contracts`, `packages/simulation-core`, `packages/seeded-rng`, `packages/replay`, `packages/telemetry-contracts`;
- `games/autonomous-snake/src/manifest.ts`, config/state/rules/generation/ai/presentation/persistence/testing modules;
- contract, unit, property, replay, snapshot, and headless integration tests;
- CLI or package command for one run, seed corpus, and replay verification.

The implementation plan must name exact paths and public signatures before code changes.

## Workstreams

### 1. Contract and Configuration

Implement versioned schemas, manifest, run initialization context, lifecycle, state, action, event, result, render-snapshot placeholder, and snapshot types. Reject invalid board sizes, speeds, targets, and content versions before run start.

### 2. Authoritative Rules

Implement the fixed movement step, direct-reversal rejection, configured tail-vacate behavior, food collection, growth, score/occupancy, objective spawn, wall/self collision, victory/terminal result, resolving/intermission, and automatic restart. Rule order follows `TECHNICAL_ARCHITECTURE.md` exactly.

### 3. Seeded Randomness and Content

Create named random streams and an open connected board. Spawn standard food from valid free cells using `objective-spawn`. No ambient randomness or wall-clock state is permitted.

### 4. Minimal Autonomous Policy

Implement a deterministic legal-move fallback: remove illegal moves, prefer a valid food-reducing move when it does not immediately fail the simplest free-space rule, otherwise maximize immediate free neighbors/reachable space, then use stable tie-breaking. It is intentionally not the production AI.

### 5. Events, Signals, and Result

Emit initialized, countdown, move, food spawned/collected, growth, milestone, collision, victory, result, intermission, and restart events. Expose length, occupancy, danger, progress, meaningful-event age, and lifecycle signals. Result records terminal reason and final checksum.

### 6. Snapshot and Replay

Serialize every authoritative field and named stream state. Restore only compatible checksummed state. Replay from initial metadata/snapshot plus ordered commands/events and compare hierarchical checksums.

### 7. Headless Runner and Telemetry

Support exact seed, number of runs/ticks, terminal cap, output JSON, and stop-on-invariant/replay failure. Report duration, progress, terminal reason, tick timing, memory, objective generation, invariant failures, and checksums.

## Test-First Sequence

1. configuration rejection and deterministic initial state;
2. movement/body/tail-vacate unit tests;
3. food/growth/occupancy atomic behavior;
4. wall/self/victory terminal precedence;
5. property invariants over legal state/action sequences;
6. named-stream reproducibility and isolation;
7. lifecycle/result/restart integration;
8. snapshot round-trip and unsupported-version failure;
9. uninterrupted versus restored replay checksums;
10. headless multi-run evidence and bounded-state test.

Every behavior test is observed failing before implementation.

## Telemetry and Operations

Expose run/game/version/config/seed IDs, tick duration, movement step, length/occupancy, objective generation, terminal reason, checksum, snapshot duration/size, restore outcome, memory, and invariant errors. Logs are structured and contain no secret/provider/viewer fields.

## Acceptance Criteria

- [ ] A valid seed completes a full run and automatically starts a new run in headless mode.
- [ ] Identical inputs produce matching initialization, checkpoint, and result checksums.
- [ ] Different simulated render/wall-clock schedules do not alter authority.
- [ ] All core rule and state invariants pass property tests.
- [ ] Food never occupies illegal cells and generation terminates within its bound.
- [ ] Snapshot restore matches uninterrupted replay.
- [ ] Unsupported/corrupt snapshots fail with typed errors and preserved evidence.
- [ ] The fallback agent never emits an unvalidated authoritative action.
- [ ] Headless results classify game outcomes separately from abort/quarantine.
- [ ] Baseline tick/memory/headless throughput measurements are recorded on reference CI hardware.
- [ ] Specification-compliance and quality reviews contain no P0/P1 finding.

## Evidence Bundle

Store command output, test reports, property seeds, replay fixtures/checksums, state schema, performance baseline, memory snapshot, generated run summaries, review reports, and commit/deployment manifest under `evidence/autonomous-snake/<release-id>/phase-01/`.

## Rollback and Safe Failure

Because Phase 1 is not public, rollback is the previous green commit. Any replay divergence, invariant failure, or incompatible snapshot blocks phase exit; do not patch fixtures to accept new outcomes without a documented deterministic-version decision.

## Exit and Handoff

Phase 1 exits at R1 only after every criterion passes. Phase 2 consumes the stable state/rule/replay contracts and replaces the minimal policy with the production survival AI while adding validated content and progression.
