---
name: performance-optimization
description: Use when profiling or improving tick time, frame time, CPU, GPU, memory, allocations, draw calls, entities, pathfinding, physics, particles, queues, snapshots, headless throughput, or long-run resource stability
---

# Performance Optimization

## Overview

Meet explicit simulation and broadcast budgets without weakening deterministic truth, gameplay readability, or maintainability. The core principle is **measure representative tails, fix the dominant cost, and prove behaviour stayed equivalent**.

## Scope

Use for profiling, budgets, algorithms, rendering, physics, AI, generation, audio, persistence, queues, memory, headless campaigns, capacity, and quality degradation. Do not optimize from intuition or alter authoritative semantics without a versioned design and balance review.

## Non-Negotiable Invariants

- Performance targets identify reference hardware, workload, game state, population, resolution, tick/frame rate, and percentile.
- Measure p50/p95/p99/worst and long-run slope, not only averages.
- Authoritative optimizations preserve system order, random draws, checksums, and replay fixtures unless intentionally versioned.
- Optional work never blocks the simulation hot path beyond its budget.
- Every queue, cache, pool, asset, listener, timer, entity, history, and log has a lifecycle.
- Degradation removes cosmetic/low-priority work before outcome-relevant information.
- Profilers and telemetry must not create unbounded labels or materially distort the workload.
- Performance improvements include before/after evidence and regression thresholds.
- Faster code that leaks memory, hides failures, reduces accessibility, or changes winners is a regression.

## Workflow

### 1. Define budgets

Specify:

- authoritative tick interval and p50/p95/p99/worst budget;
- decision, generation, physics, rule, snapshot, and event sub-budgets;
- render CPU/GPU frame time, draw calls, overdraw, particles, textures, render targets;
- memory/heap/GPU/audio/queue/log/snapshot budgets;
- startup, restore, intermission, scene change, and deployment warm-up;
- provider burst and operator-command latency;
- headless simulation throughput;
- maximum entities/bodies/agents/rooms/events;
- soak duration and allowed resource slope.

### 2. Reproduce representative workloads

Create deterministic scenarios for ordinary, peak, pathological, and long-run conditions. Include maximum progression, dense effects, contact storms, many agents, audience bursts, provider reconnect, snapshot write, restore/replay, content generation, and low-end quality tier.

Record versions, configuration, seed/event corpus, hardware, runtime, background load, and capture method.

### 3. Profile by path

Measure first:

- CPU flame/profile and event-loop/tick delay;
- GPU timing, draw calls, overdraw, texture/render-target use;
- allocation rate, heap retainers, GC pauses, native memory, handles/listeners/timers;
- pathfinding/search expansions, physics contacts/iterations, generator attempts;
- serialization/compression/I/O and queue depth;
- audio voices/decode/buffers;
- telemetry/log volume/cardinality.

Identify the top one to three costs; do not perform broad speculative rewrites.

### 4. Optimize in the safest order

1. remove unnecessary work and duplicate computation;
2. reduce frequency using valid dirty/event-driven updates;
3. bound input/state/content;
4. improve algorithms/data structures;
5. partition/cull/sleep/level-of-simulation;
6. reuse/pool only where lifecycle remains simpler and measured allocation cost matters;
7. batch rendering/I/O while preserving order;
8. move cold work off hot path with bounded queues;
9. add quality tiers/degradation;
10. scale hardware/processes only after software constraints are understood.

### 5. Preserve deterministic semantics

Before authoritative optimization, capture replay fixtures, random-stream draw counts/ownership, system order, and result distributions. Afterward compare checksums or explicitly increment deterministic version and run balance/migration review.

Parallelize only independent calculations with stable deterministic reduction.

### 6. Stabilize memory and resources

Use heap/resource snapshots over time. Confirm retired entities, worlds, particles, tweens, textures, audio voices, observers, provider connections, snapshots, events, and caches are released, compacted, rolled over, or archived.

A stable sawtooth is acceptable; monotonic growth without a finite cap is not.

### 7. Design quality degradation

Define thresholds and hysteresis for quality tiers. Potential reductions:

- ambient particles/decals/lights/shadows;
- cosmetic animation frequency;
- distant detail/agent presentation;
- replay resolution/duration;
- noncritical audio voices;
- analytics sampling;
- UI animation density.

Never remove goal, danger, terminal result, accessibility cues, audit, integrity, or recovery work.

### 8. Automate regression detection

CI or scheduled benchmarks compare budgets with variance-aware thresholds. Soak tracks slopes and queue/resource maxima. Store profiles for regressions and flag changes by subsystem.

## Required Outputs

- performance budget and capacity table;
- representative deterministic workload/seed corpus;
- baseline profiles and top-cost diagnosis;
- proposed optimization with expected complexity and correctness risk;
- replay/invariant/visual/audio equivalence plan;
- before/after percentile, throughput, memory, GPU, queue, and quality evidence;
- resource lifecycle and leak analysis;
- quality-tier/degradation table;
- automated benchmark/soak thresholds;
- reference hardware and production capacity recommendation.

## Review Gate

Pass only when:

- representative p99 and worst cases meet declared headroom;
- authoritative replay/invariants remain identical or versioned changes pass full review;
- memory, handles, listeners, textures, audio buffers, logs, snapshots, and queues remain bounded in soak;
- maximum documented populations and audience bursts do not violate tick/output integrity;
- renderer meets frame budget with critical HUD/VFX intact;
- optional integrations remain outside the hot-path blocking budget;
- quality transitions do not flap and preserve critical/accessibility cues;
- benchmark variance and hardware are documented;
- regression thresholds run automatically;
- code complexity added by optimization is justified by measured gain.

## Stop-Ship Failures

- optimize before profiling;
- cite average FPS only;
- use a faster alternate rule implementation in headless mode;
- parallel reduction changes order/winners;
- cache without eviction/invalidation;
- pool creates retained listeners/state;
- drop audit or integrity work to save time;
- low-tier removes danger/caption/goal cues;
- memory measured only at startup/end;
- solve unbounded input with more hardware.

## Handoffs

- `game-architecture`, `deterministic-simulation`, `game-physics`, `autonomous-agent-design`, `procedural-generation`: safe subsystem changes.
- `game-feel-vfx`, `game-audio`, `livestream-hud`: visual/audio budgets and degradation.
- `long-running-reliability`: resource slope, queues, pressure recovery.
- `simulation-qa` and `production-readiness-review`: representative benchmarks and stop-ship evidence.
