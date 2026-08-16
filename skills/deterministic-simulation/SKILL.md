---
name: deterministic-simulation
description: Use when designing or reviewing authoritative ticks, time steps, random streams, command ordering, replay, snapshots, checksums, state invariants, rollback, headless simulation, or reproducible game outcomes
---

# Deterministic Simulation

## Overview

Make every authoritative outcome reproducible from versioned inputs so failures, balance, audience effects, records, and recovery can be trusted. The core principle is **logical time plus explicit ordered inputs produce one verifiable state sequence**.

## Scope

Use for any state that affects rules, positions, collisions, resources, score, deaths, wins, records, progression, or persistent worlds. Presentation-only animation may be nondeterministic if it cannot feed authority. This skill does not require identical pixels; it requires identical gameplay truth.

## Non-Negotiable Invariants

- Authority advances on a fixed logical tick or exact event-step model.
- Wall-clock time and render frame delta never determine results.
- All authoritative randomness comes from named seeded streams with recorded algorithm versions.
- Commands/actions have stable validation, scheduling, priority, and total ordering.
- Iteration order cannot depend on object/hash insertion behaviour when outcomes differ.
- Authoritative state is serializable, versioned, bounded, and invariant-checkable.
- Identical versions, configuration, content, seed, and normalized event log yield matching checksums.
- Snapshots are validated restore points, not unverified memory dumps.
- Divergence quarantines or fails loudly; it never self-corrects invisibly.
- Headless mode executes the same rules as presentation mode.

## Workflow

### 1. Define the determinism envelope

List exactly what must reproduce:

- state fields and entity IDs;
- tick/system order;
- accepted/rejected actions;
- generated content;
- collisions and damage;
- resources, rewards, score, records, and terminal result;
- audience influence outcomes;
- snapshots and replay checksums.

List permitted nondeterminism such as particle positions, camera easing, cosmetic audio variation, and analytics timing, and prove it cannot enter authority.

### 2. Specify logical time

Choose tick rate based on rule precision and cost. Represent durations as integer ticks, fixed-point units, or exact rational conversions. Define catch-up and overload behaviour:

- cap real-time catch-up ticks per render frame;
- never enlarge authoritative delta to “catch up”;
- allow presentation to drop/interpolate frames;
- declare pause/resume semantics;
- record speed changes as presentation or authoritative configuration deliberately.

### 3. Design random streams

Create a root run seed and derive stable streams by name and version. Keep world generation, agents, rewards, event director, audience tie-breaks, and cosmetics isolated. Document draw ownership and forbid shared convenience random calls.

Changing the draw sequence or algorithm changes deterministic version unless compatibility is proven.

### 4. Establish total ordering

For each tick define:

1. lifecycle/system commands;
2. validated audience influence;
3. agent observations and decisions;
4. action conflict resolution;
5. movement/physics;
6. hazards/combat/resources;
7. progression/objectives/results;
8. semantic events and checksum.

Use stable keys for entity and command ordering. Parallel computation may prepare independent results, but deterministic reduction order commits them.

### 5. Control numeric behaviour

Prefer integer grid/fixed-point representations for discrete games. For continuous physics:

- pin runtime and solver versions;
- fix time step, iteration counts, collision layers, and ordering;
- avoid platform-dependent transcendental functions in authority where possible;
- quantize authoritative outputs at declared boundaries;
- test supported architectures;
- use replay checkpoints to catch drift early.

### 6. Design snapshots and event logs

Snapshot metadata includes game/platform/deterministic/schema/config/content versions, run ID, seed streams, tick, next sequence, checksum, and payload. Persist normalized authoritative events after the snapshot. Restore validates compatibility, checksum, state invariants, event continuity, and replay checkpoints before resuming.

### 7. Add invariant and divergence probes

Examples:

- unique entity IDs;
- no entity in two exclusive cells/states;
- resources nonnegative and conserved where required;
- graph connectivity and valid objectives;
- score/record monotonic rules;
- lifecycle and terminal-state consistency;
- bounded collections and coordinates;
- command/event sequence continuity.

Run cheap invariants frequently and expensive checks at snapshots/milestones or in headless tests.

### 8. Build replay tests

Test:

- same process repeat;
- snapshot boundary repeat;
- process restart repeat;
- different render frame schedules;
- provider events arriving in different wall-clock order but normalized to the same authoritative schedule;
- high-load scheduling;
- supported runtime/architecture matrix;
- previous compatible version fixtures;
- deliberate corrupted state/event detection.

Use hierarchical checksums to localize divergence by system/entity rather than only one final hash.

## Required Outputs

- determinism envelope and allowed cosmetic nondeterminism;
- tick rate, logical-time, catch-up, pause, and speed policy;
- named random-stream registry with ownership/version;
- authoritative system and conflict ordering;
- numeric representation and supported-runtime policy;
- state/event/snapshot/checksum schemas;
- invariant catalogue and execution cadence;
- replay fixture corpus and checksum strategy;
- version compatibility and fresh-run boundaries;
- headless runner and divergence diagnostic plan;
- determinism impact section for every rule change.

## Review Gate

Pass only when:

- two independent runs with identical inputs match all checkpoint and final checksums;
- presentation frame rate, telemetry delay, provider reconnect timing, and optional service availability cannot alter results;
- random-stream isolation tests prove cosmetic draws do not perturb authority;
- duplicate/reordered/stale commands resolve predictably;
- snapshot restore reproduces uninterrupted execution;
- unsupported versions fail with typed errors;
- deliberate invariant and event corruption are detected and quarantined;
- collections and numeric ranges remain bounded;
- headless and streamed modes share one authoritative rules implementation;
- performance optimizations preserve ordered reduction and replay fixtures.

## Stop-Ship Failures

- variable-delta rules;
- `Math.random`, current time, UUID randomness, or unordered sets affect authority;
- renderer/provider callback mutates gameplay;
- unrecorded model response changes an action;
- physics solver settings vary by host;
- checksum excludes outcome-relevant fields;
- snapshot restored without validation;
- divergence logged but play continues;
- flaky replay test rerun until green;
- separate “fast simulation” rules drift from production rules.

## Handoffs

- `game-architecture`: authority and contract boundaries.
- `game-physics`: deterministic continuous/discrete motion and collision.
- `autonomous-agent-design`: decision schedule, tie-breaks, fallback, external proposals.
- `procedural-generation`: seeded content and validation.
- `audience-interaction`: normalized scheduled input and idempotency.
- `simulation-qa`, `long-running-reliability`, `performance-optimization`: replay campaigns, restore, and safe optimization.
