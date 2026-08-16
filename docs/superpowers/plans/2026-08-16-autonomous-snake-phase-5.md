# Autonomous Snake Phase 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Every production behavior begins with a failing test and finishes with fresh full-suite evidence.

**Goal:** Deliver an R4 infrastructure candidate that durably records authoritative Snake runs, enforces single-writer ownership, restores verified snapshots, survives component failures, bounds resources, exposes actionable observability, and permits only typed audited operator actions.

**Architecture:** Phase 5 adds provider-neutral operational packages around the existing deterministic runtime. An append-only store persists run events, snapshots, records, interaction decisions and operator audit entries. A lease/supervisor layer fences stale writers, a recovery coordinator verifies compatible snapshots and deterministic replay, and a health/control plane drives safe scenes, component restart, circuit breakers, alerts and rollback without mutating game rules directly.

**Tech Stack:** TypeScript 5.8.3, Node.js 22.16, Node built-in crypto/fs/path/test modules, existing replay/snapshot/runtime packages, Playwright capture gate.

## Global Constraints

- One authoritative writer per channel/run; stale lease generations are rejected.
- Events are append-only, sequence-contiguous, checksummed and idempotent by event ID.
- Snapshots include schema/config/content/deterministic compatibility metadata and are never trusted before checksum and invariant validation.
- Recovery fences the old writer before restore and never silently continues through replay divergence.
- Technical/quarantined runs are excluded from normal records.
- Paid-eligible audience effects remain fail-closed when durable audit/idempotency state is unavailable.
- Every queue, cache, log segment, heartbeat map, crash history, metric label set and replay tail is bounded.
- Output faults switch to an intentional privacy-safe scene before risky reconstruction.
- Operator actions are typed, role-authorized, environment-scoped, idempotent and append-only audited.
- No operator endpoint permits arbitrary state/database/memory editing.
- All Phase 1–4 tests remain green.

---

### Task 1: Operational Contracts and Append-Only Store

Create `packages/ops-contracts/src/index.ts` and `packages/durable-store/src/*`. Define run/event/snapshot/record/audit contracts, typed store errors, contiguous append, duplicate replay, snapshot ordering, projection rebuild, record eligibility and bounded retention. Tests: `tests/phase5/durable-store.test.cjs`.

### Task 2: Lease Fencing, Bounded Queues and Supervisor

Create `packages/supervisor/src/*`. Implement monotonic lease generations, acquire/renew/fence/release, heartbeat/progress checks, component state, bounded exponential backoff, crash-loop breaker and fixed-capacity queues with explicit overflow policy. Tests: `tests/phase5/supervisor.test.cjs`.

### Task 3: Verified Recovery and Quarantine

Create `packages/recovery/src/*`. Select newest compatible snapshot, verify checksum/version/config/content, restore runtime, replay recorded deterministic step commands, compare checkpoints, fall back to an older snapshot on corruption and quarantine divergence. Tests: `tests/phase5/recovery.test.cjs`.

### Task 4: Output Health and Safe Degradation

Create `packages/output-health/src/*`. Detect stale snapshots, heartbeat loss, black/frozen/wrong-scene output, unintended silence, queue pressure and resource pressure. Produce `healthy`, `degraded`, `unsafe` decisions with one safe-scene/restart/rebuild/resume workflow. Tests: `tests/phase5/output-health.test.cjs`.

### Task 5: Metrics, Alerts, Runbooks and Operator Controls

Create `packages/observability/src/*` and `packages/operator-control/src/*`. Implement bounded metric labels, structured events, alert hysteresis, runbook references, RBAC roles, typed commands, independent interaction/public-text disable, safe scene, verified snapshot, component restart, quality preset, fresh-run and emergency halt. Tests: `tests/phase5/control-observability.test.cjs`.

### Task 6: Production Service Integration

Create `services/snake-channel/src/*`. Compose runtime, store, lease, snapshot cadence, supervisor, health, recovery and operator controls. Persist authoritative events once, snapshot at bounded cadence, maintain projections, recover after injected worker/render/provider failures and preserve autonomous play when audience services are disabled. Tests: `tests/phase5/service-integration.test.cjs`.

### Task 7: Chaos/Soak Harness and R4 Evidence

Create `scripts/run-phase5-chaos.cjs`, `tests/phase5/chaos.test.cjs`, and `evidence/autonomous-snake/r4-phase-05/phase-05/*`. Exercise writer fencing, duplicate provider callbacks, database/store unavailability, corrupt newest snapshot, renderer/audio failure, output freeze/silence, crash-loop breaker, rollback and bounded-resource simulation. A compressed deterministic CI campaign substitutes for the documented 24-hour staging soak; the real-duration soak remains an explicit Phase 6 environment gate.

## Exit Gate

Phase 5 may merge only when the full Phase 1–5 suite, stream self-test, nondeterminism scan and Chromium capture pass on the exact PR head; recovery matches uninterrupted checksums; duplicate authoritative application is zero; corrupt/divergent state quarantines; queues/resources remain bounded; and review has no P0/P1 finding. This is R4 infrastructure-candidate evidence, not an R5 public production claim.