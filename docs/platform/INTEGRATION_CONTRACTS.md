# Shared Platform Integration Contracts

## Dependency Direction

```text
Game Contracts ← Game Module
Game Contracts ← Simulation Core
Game Contracts ← AI Runtime / Content Engine
Event Contracts → Persistence / Analytics / Event Director
Render and Audio Contracts → Presentation Apps
Audience Contracts → Gateway / Moderation / Entitlement → Event Director → Game Command
Health and Control Contracts → Supervisor / Operator Dashboard
```

Game modules never import provider SDKs, databases, presentation frameworks, OBS, dashboards or remote-model clients. Infrastructure depends on stable contracts and game manifests, not game internals.

## Required Integration IDs

Every cross-process item carries environment, deployment, platform/game/config/content/schema versions, run ID, correlation ID, logical tick/sequence where authoritative, producer, type/version and privacy classification. Audience chains additionally carry provider evidence, normalized input, influence request and command idempotency IDs.

## Versioning

- additive optional fields may remain compatible under schema rules;
- behavioral, rule or random-order changes increment deterministic version;
- state-shape changes increment snapshot schema and require a migration or fresh-run decision;
- event meaning changes require event version and projection compatibility plan;
- content and configuration versions are immutable and hashable;
- provider adapter versions record API and verification semantics;
- render and audio contracts reject incompatible snapshots or cues and use safe scenes.

## Backpressure and Timeouts

All process boundaries have bounded queues, TTL or expiry, priority and overflow policy. Simulation never waits indefinitely for provider, model, analytics, rendering, audio or database work. Critical event durability has a declared buffer and safe-boundary behavior; low-priority telemetry may sample or drop under policy.

## Error Contract

Errors expose stable code, severity, retryability, affected run or component, safe public category, operator action, correlation and privacy-safe context. No stack trace, secret, raw provider payload, payment detail, prompt or private user data enters public contracts.

## Test Contract

Each integration supplies schemas, faithful fixtures, duplicate, reorder, stale, malformed, outage and load tests, compatibility and migration tests, observability and runbook. End-to-end verification covers provider input → decision → authoritative command → semantic event → presentation → persistence or record → recovery and replay.
