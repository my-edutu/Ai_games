# Phase 5 — Persistence, Recovery, Observability, and Operations

**Phase status:** Not started  
**Readiness target:** R4 production candidate infrastructure  
**Viewer-visible outcome:** The stream survives common component and provider failures, preserves verified runs and records, switches to intentional safe scenes, recovers automatically, and gives operators precise audited control.

## Objective

Turn the R3 game into an operable long-running service by implementing durable events and records, snapshots and restore, run supervision, watchdogs, output health, bounded resources, dashboards, alerts, runbooks, operator controls, deployment/config/content compatibility, and rollback.

## In Scope

- production persistence model for run metadata, authoritative events, snapshots, records, interaction audit, moderation decisions, and evidence references;
- idempotent projections and record reconciliation;
- run leases, worker supervision, heartbeats and progress probes;
- verified snapshot/restore/replay, quarantine, safe intermission, fresh-run fallback;
- renderer/audio/gateway/persistence/telemetry/dashboard process isolation and restart;
- black/frozen/wrong-scene/silent output probes;
- bounded durable/in-memory queues, retry/backoff/circuit breakers;
- structured logs, metrics, traces, dashboards, alerts, and runbooks;
- role-based operator dashboard and typed audited controls;
- managed configuration/content/deployment versions, feature flags, migration, rollout, and rollback;
- security/privacy hardening, secret management, retention/deletion, dependency/content scanning;
- 24-hour engineering soak and chaos programme.

## Explicit Non-Scope

Final 72-hour candidate soak, seven-day production canary, broad promotion, and public “production ready” claim; those are Phase 6.

## Requirements Addressed

All `FR-SNK-OPS-*`, `NFR-SNK-REL-*`, operational performance/security/privacy requirements, and the reliability, observability, recovery, operator, deployment, and rollback production gates.

## Workstreams

### 1. Persistence and Records

Implement immutable run metadata, append-only event segments, snapshot object lifecycle, interaction/moderation audit, idempotent projections, record eligibility/ties, reconciliation, retention, compaction/rollover, and privacy-safe access. Technical/quarantined runs never enter normal records.

### 2. Supervisor and Run Lease

Ensure one authoritative writer, lifecycle ownership, process heartbeats, progress probes, resource limits, crash counters, jittered backoff, breakers, component restarts, and safe fresh-run boundaries. Repeated crashes cannot loop indefinitely.

### 3. Verified Recovery

Fence the old lease, select the newest compatible snapshot, validate checksum/schema/config/content/invariants, replay subsequent events, compare hierarchical checkpoints, rebuild presentation/audio, verify output, then resume. Try an older snapshot on corruption; quarantine divergence and preserve evidence.

### 4. Degradation and Output Health

Implement declared behavior for provider, moderation, entitlement, persistence, telemetry, remote model, renderer, audio, dashboard, capture, host, and resource failures. Output probes detect stale/black/frozen/wrong scene and unintended silence. Safe intermission remains visually intentional and privacy-safe.

### 5. Resource Stability

Inventory and bound every queue, cache, body/history/event list, log, snapshot, connection, listener, timer, texture, render target, audio node/buffer, replay buffer, and telemetry label. Add compaction, eviction, TTL, pooling only where measured, and pressure quality tiers that preserve critical truth.

### 6. Observability and Alerts

Build dashboards for channel truth, simulation/AI/integrity, presentation/audio/output, interactions/providers/moderation, persistence/recovery, resources/queues, product balance/content, and releases/incidents. Alerts include impact, duration, run/version, automated actions, owner, runbook, and verification.

### 7. Operator Dashboard

Implement strong authentication, least privilege, environment clarity, run/version status, interaction/public-text disable, safe scene, pause/resume policy, snapshot, verified restore, fresh run, component restart, mute/quality preset, configuration/content rollout, rollback, credential revocation, and emergency halt. No arbitrary database or memory editing.

### 8. Security, Privacy, and Supply Chain

Complete threat model/data inventory, managed secrets, signature/replay controls, role tests, input/output sanitation, minimization/retention/deletion, dependency/SBOM/vulnerability and licence scans, immutable artefacts, content provenance, audit, incident and revocation drills.

### 9. Engineering Soak and Chaos

Run a 24-hour candidate with normal progression, interactions, snapshots, scene changes, and component restarts. Inject worker kills, provider disconnects/duplicates, database lag, moderation outage, queue pressure, corrupt test snapshot, renderer/audio failure, black/frozen/silent output, host restart, credential rotation, and deployment rollback.

## Test-First Sequence

- persistence idempotency, sequence gaps, projection rebuild, record reconciliation;
- lease conflict/fencing and crash-loop breaker;
- snapshot selection/validation/older fallback/quarantine;
- uninterrupted versus recovered checksum and interaction idempotency;
- each degradation state and public scene;
- output black/frozen/wrong-scene/silence detection and reconstruction;
- bounded queue overflow and resource cleanup;
- alert threshold/runbook verification;
- role/authorization/audit/security/privacy/retention controls;
- configuration/content/deployment compatibility and rollback;
- 24-hour soak plus chaos evidence.

## Acceptance Criteria

- [ ] Records, projections, and results rebuild from authoritative events and exclude technical/quarantined outcomes correctly.
- [ ] One active run lease is enforced and old writers are fenced before restore.
- [ ] Verified restore plus replay matches uninterrupted checksums within the recovery objective.
- [ ] Corrupt/incompatible/divergent state enters safe intermission and quarantine, not silent continuation.
- [ ] Common component/provider failures recover or degrade without duplicating authoritative effects.
- [ ] Output probes detect and recover black, frozen, stale, wrong-scene, and silent failures.
- [ ] Crash loops use bounded backoff/breakers and can transition to fresh run or safe halt.
- [ ] Memory, GPU, handles, listeners, timers, buffers, logs, snapshots, and queues remain bounded in the 24-hour soak.
- [ ] Dashboards, alerts, runbooks, and operator controls identify and resolve every injected failure.
- [ ] Secrets/privacy/operator/security/supply-chain controls pass review and drills.
- [ ] Deployment/config/content rollback restores a verified stream boundary.
- [ ] Spec, security, reliability, and quality reviews have no P0/P1 finding.

## Evidence Bundle

Include schema/migration/projection reports, restore/replay checksums, chaos timeline, screenshots/video of safe scenes and recovered output, resource slopes, dashboards/alerts/runbooks, operator audit, security/privacy reports, SBOM/licence scans, rollback drill, 24-hour soak manifest, and reviews under `phase-05/`.

## Rollback

Maintain the last compatible deployment, configuration, content, provider adapters, and database migrations with declared snapshot/event compatibility. When rollback cannot safely load current state, finish/quarantine the run and begin a fresh run on the previous version. Preserve failed-run evidence.

## Exit and Handoff

Phase 5 exits at R4 infrastructure quality when realistic failures recover under staging/production-equivalent operation and the 24-hour soak is stable. Phase 6 freezes the candidate, runs full statistical and endurance evidence, validates current providers, rehearses launch/rollback, and completes canary promotion.
