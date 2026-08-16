---
name: game-architecture
description: Use when designing or reviewing game modules, authoritative state, engine boundaries, package ownership, data flow, lifecycle, persistence, replay, integrations, scalability, or technical decomposition
---

# Game Architecture

## Overview

Design game systems so rules remain deterministic and testable while AI, rendering, audio, audience providers, persistence, and operations evolve independently. The core principle is **authoritative truth has one owner and every boundary communicates through explicit versioned contracts**.

## Scope

Use for new games, shared engines, major features crossing systems, persistent worlds, provider integrations, and refactors caused by unclear ownership. This skill chooses boundaries and data flow. It does not invent gameplay goals, tune balance, or certify production readiness.

## Non-Negotiable Invariants

- The simulation worker is the only authority for gameplay state.
- Presentation consumes immutable render snapshots and semantic events; it cannot mutate gameplay.
- Game packages do not import YouTube, Twitch, payment, database, OBS, or operator-dashboard SDKs.
- Commands request changes; append-only events record what occurred.
- External input is validated, authorized, moderated, rate-limited, idempotent, scheduled, and auditable before authority sees it.
- Time, randomness, ordering, schemas, snapshots, and migrations are explicit.
- Optional services never block authoritative ticks indefinitely.
- Every collection, queue, cache, resource, and history stream has a bound or lifecycle.
- Failures have typed ownership, degradation, recovery, observability, and rollback behaviour.

## Workflow

### 1. Map contexts and trust boundaries

List viewers, operators, providers, model services, storage, observability, streaming software, and deployment. Mark untrusted inputs and identify the gameplay-truth boundary.

### 2. Assign one responsibility per unit

Decompose into focused units such as:

- run supervisor;
- simulation kernel;
- game rules module;
- agent policy;
- procedural generator;
- event director;
- audience gateway;
- render adapter and presentation host;
- audio engine;
- persistence writer;
- analytics pipeline;
- operator control plane;
- output health probe.

For each unit answer: what it owns, what it consumes, what it emits, what it cannot do, and how it fails.

### 3. Define authoritative data

Specify:

- state schema and entity IDs;
- tick and lifecycle model;
- system execution order;
- command/action schemas;
- event sequence and causation;
- named random streams;
- state invariants;
- snapshot and checksum material;
- terminal result and record derivation.

Remove wall-clock, provider objects, rendering handles, audio sources, callbacks, and executable closures from authoritative state.

### 4. Design public interfaces

For every boundary document exact inputs, outputs, versions, validation, errors, deadlines, idempotency, ordering, backpressure, and compatibility. Prefer pure functions for rules and adapters. Hide internal data behind stable types.

Apply dependency direction:

`apps/games → public packages/contracts`, never shared packages importing game private code or games importing apps.

### 5. Separate hot, warm, and cold paths

- Hot: authoritative tick and action resolution; no network or unbounded allocation.
- Warm: snapshot creation, render snapshot, event scheduling, local queues.
- Cold: analytics projections, model-assisted planning, content baking, reports, archives.

Move work off the hot path only when ordering and durability remain explicit.

### 6. Design failure and degradation first

For each dependency define timeout, retry/backoff, breaker, queue bound, fallback, public status, alert, and recovery. Distinguish:

- optional capability failure;
- recoverable worker failure;
- integrity failure requiring quarantine;
- security/policy failure requiring rejection or halt.

### 7. Plan evolution

Version configuration, content packs, game rules, event schemas, deterministic algorithms, and snapshots. Declare compatible ranges and fresh-run boundaries. Ensure rollback does not silently load incompatible state.

### 8. Validate architecture with thin slices

Before broad implementation, prove:

- one headless run;
- identical-seed replay;
- one render snapshot;
- one semantic audio/VFX event;
- one normalized audience request through eligibility to scheduled command;
- snapshot/restore;
- provider outage degradation;
- process crash recovery;
- bounded queue/resource behaviour.

## Required Outputs

- context/trust-boundary diagram;
- component ownership table;
- game module and shared package map;
- authoritative state/lifecycle/system-order specification;
- command, action, event, render, audio, snapshot, and configuration schemas;
- dependency and forbidden-import rules;
- data-flow and failure-flow diagrams;
- compatibility/migration/rollback matrix;
- performance/resource budgets by path;
- architecture decision records for irreversible choices;
- architecture test and vertical-slice plan.

## Review Gate

Pass only when:

- every mutable datum has one authoritative owner;
- interfaces can be understood without reading internals;
- identical inputs have a defined deterministic path;
- provider/model/render/audio/database failure cannot silently corrupt authority;
- queueing, ordering, idempotency, and backpressure are exact;
- state and resource growth are bounded;
- restore, migration, versioning, and rollback are testable;
- games remain provider-neutral and shared packages remain game-agnostic;
- the architecture supports headless simulation and stream presentation without duplicate rules;
- the first vertical slice tests the riskiest boundaries.

## Stop-Ship Failures

- game logic in React/render callbacks or provider webhooks;
- multiple processes can write the same run;
- ambient randomness or wall-clock affects results;
- “event-driven” without ordering and idempotency;
- persistence/network/model call inside the tick;
- global singleton state shared across runs;
- unversioned saves or content;
- infinite history retained in live memory;
- restart policy without integrity verification;
- distributed services introduced without measured isolation/scaling need.

## Handoffs

- `deterministic-simulation`: formalize tick, ordering, replay, and random streams.
- `autonomous-agent-design`: define observation/action boundary and deadlines.
- `game-physics`: select deterministic movement/collision representation.
- `procedural-generation`: isolate content generation, validation, and seed contracts.
- `audience-interaction`: implement provider-neutral influence path.
- `long-running-reliability`, `performance-optimization`, `security-privacy`: review failure, resources, and trust boundaries.
