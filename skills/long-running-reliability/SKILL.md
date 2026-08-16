---
name: long-running-reliability
description: Use when designing or reviewing always-on game operation, watchdogs, heartbeats, stalls, crash loops, snapshots, recovery, provider outages, output health, bounded resources, soak tests, alerts, runbooks, or unattended streaming
---

# Long-Running Reliability

## Overview

Keep an autonomous stream truthful and watchable through process failures, provider outages, resource pressure, corrupt state, and days of unattended operation. The core principle is **detect progress, isolate failure, recover from verified truth, and fall back to an intentional safe state**.

## Scope

Use for supervisors, health probes, snapshots, restore, crash loops, degradation, output/audio health, resource lifecycle, soak/chaos, alerts, runbooks, rollouts, and incidents. This skill does not declare production readiness alone; it supplies reliability evidence.

## Non-Negotiable Invariants

- Liveness is not enough: ticks, meaningful progress/valid idle, render freshness, audio intent, durability, and output are independently probed.
- One lease holder owns each authoritative run.
- Restore resumes only after compatibility, checksum, invariant, and event-continuity validation.
- Integrity uncertainty causes quarantine or safe intermission, never silent continuation.
- Optional dependencies cannot block the simulation thread indefinitely.
- Queues, caches, histories, logs, handles, listeners, textures, audio buffers, and retries are bounded.
- Recovery attempts use finite backoff and breakers; infinite restart loops are prohibited.
- Provider/model/telemetry failure preserves autonomous gameplay when truth remains valid.
- Public status is intentional and privacy-safe; operator status is detailed and actionable.
- Reliability claims require soak, chaos, canary, and rollback evidence.

## Workflow

### 1. Define service objectives

Specify per game/channel:

- authoritative tick availability and latency;
- output freshness and frame delivery;
- intended audio presence;
- event durability/recovery point;
- restore/recovery time;
- audience input processing availability;
- snapshot age and validation;
- operator command success;
- safe-intermission activation and maximum duration;
- crash-loop and quarantine limits.

Use objectives that can be measured and paged.

### 2. Map failure domains

For simulation, AI/model, generation, renderer, audio, providers, moderation/entitlement, persistence, analytics, dashboard, capture/output, host/network, and deployment define:

- health signal;
- timeout/stall threshold;
- immediate effect on gameplay/output;
- retry/backoff/breaker;
- degradation/fallback;
- restart/restore policy;
- public/operator state;
- alert/runbook;
- evidence test.

### 3. Implement progress-aware health

Heartbeats include process identity and version. Progress probes verify tick/sequence advance, objective validity, stuck detection, render snapshot age, frame differences or declared static state, audio bus activity or declared silence, persistence acknowledgement, provider keepalive, and output capture freshness.

Use sliding windows and hysteresis to avoid restart flapping.

### 4. Design verified recovery

Record immutable run metadata, append-only events, periodic/milestone snapshots, checksums, and schema versions. Recovery sequence:

1. fence old run lease;
2. choose newest compatible snapshot;
3. verify checksum and invariants;
4. replay subsequent authoritative events;
5. compare checkpoints;
6. reconstruct presentation/audio;
7. resume after supervisor ownership;
8. acknowledge recovery publicly only with safe copy.

Try older snapshots on corruption. Quarantine divergence and start a fresh run rather than falsifying continuity.

### 5. Bound resources

Inventory every long-lived resource with maximum, TTL, compaction, rollover, eviction, archival, or lifecycle cleanup. Define queue overflow by priority: block only outside hot path, reject/defer inputs, drop low-priority telemetry, or enter safe boundary.

Track memory slope, heap, handles, threads, listeners, timers, textures, render targets, audio voices/buffers, event/persistence queues, cache, log/disk, snapshot size/duration, and reconnect objects.

### 6. Design degradation and safe states

Examples:

- provider down: disable affected interactions, AI continues;
- model down: deterministic fallback;
- telemetry down: bounded priority buffer/drop;
- persistence lag: bounded durable buffer and alert; reject effects requiring unavailable audit;
- renderer/audio down: simulation continues while process restarts and safe slate applies;
- output frozen/black/silent: switch scene/source, restart, verify;
- invariant failure: stop run, preserve evidence, restore or fresh-run;
- resource pressure: reduce cosmetic quality, population/detail only under declared rule, then controlled restart.

### 7. Run soak and chaos

Use accelerated campaigns for rule/state stability, then 24-hour engineering soak, 72-hour production-candidate soak, and seven-day canary. Inject worker kills, provider disconnects, duplicate events, delayed persistence, corrupt test snapshots, queue saturation, renderer/audio failure, black/frozen output, credential rotation, and host restart.

Each injection has expected transition, alert, automated action, recovery objective, and evidence.

### 8. Prepare operations

Dashboards identify environment, deployment, game/version, config/content, run/seed, process, snapshot, provider, and incident. Alerts include impact, duration, recent automation, runbook, and verification. Rehearse emergency interaction disable, safe intermission, fresh run, rollback, and halt.

## Required Outputs

- service objectives/error budgets;
- failure-domain and degradation matrix;
- heartbeat/progress/output/audio probe specification;
- run lease, snapshot, event, restore, quarantine, and fresh-run design;
- watchdog state machine, backoff, breaker, and action limits;
- resource-lifecycle inventory and queue overflow policies;
- dashboards, alerts, runbooks, operator controls, and incident evidence plan;
- soak/chaos/canary scenarios and exact pass thresholds;
- rollout/rollback compatibility and rehearsal plan;
- known residual risks and production-readiness evidence links.

## Review Gate

Pass only when:

- stalled gameplay, renderer, audio, provider, persistence, and output are detected independently;
- repeated crashes trip a breaker and cannot storm indefinitely;
- snapshot/event restore matches uninterrupted replay checksums;
- corruption/divergence quarantines and preserves evidence;
- optional service outages keep autonomous play truthful;
- resources and queues reach a stable bounded band during required soak;
- injected failures meet expected state, alert, and recovery objectives;
- paid/audience events remain idempotent across reconnect/recovery;
- operator emergency controls and rollback are rehearsed;
- public stream shows an intentional scene during every recovery path.

## Stop-Ship Failures

- “just restart” wrapper;
- heartbeat with no progress probe;
- newest snapshot restored without checksum/invariants;
- infinite retry/reconnect loop;
- unbounded in-memory event history/queue;
- simulation blocked on database/provider/model;
- renderer/output freeze not detected;
- technical crash counted as game loss;
- 72-hour soak skipped because CI passes;
- rollback assumes incompatible snapshots will load.

## Handoffs

- `game-architecture` and `deterministic-simulation`: failure boundaries and verified truth.
- `audience-interaction`, `crowd-moderation`, `security-privacy`: provider/moderation/payment outage and incident controls.
- `game-audio`, `game-feel-vfx`, `livestream-hud`: process/output health and safe scenes.
- `performance-optimization`: resource stability and pressure degradation.
- `simulation-qa` and `production-readiness-review`: chaos, soak, evidence, and sign-off.
