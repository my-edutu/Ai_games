# Replay, Recovery and Watchdog Platform

## Mission

Preserve authoritative truth across crashes and long-running operation, detect stalls that ordinary process liveness misses, and recover the public stream from verified state without fabricating continuity or game results.

## Data Model

- immutable run metadata: environment, deployment, game/config/content/deterministic/schema/provider versions, seed and mode;
- ordered append-only authoritative events and accepted commands;
- periodic and milestone snapshots with checksums, random-stream states and durability boundary;
- hierarchical state checksums and replay checkpoints;
- presentation/audio reconstruction state or derivable snapshot;
- interaction, moderation and audit correlations;
- records and projections rebuildable from source events;
- incident and evidence references.

## Run Ownership

One lease holder owns an authoritative run. Lease acquisition and fencing are durable and versioned. An old writer cannot resume after a supervisor starts recovery. Process identity and epoch enter events and health, but not game randomness.

## Progress-Aware Watchdog

Probe independently:

- process heartbeat;
- authoritative tick/sequence advance or declared valid pause;
- game-specific meaningful progress and stuck state;
- AI decision/fallback and generator health;
- event durability and snapshot age;
- renderer snapshot/frame freshness and correct scene;
- black or frozen output outside declared scenes;
- audio activity or declared silence;
- provider, moderation, entitlement and gateway health;
- queues, CPU/GPU, memory, handles, listeners, timers, disk, logs and resource slope.

Sliding windows, hysteresis and finite action budgets prevent restart flapping.

## Recovery Sequence

1. Fence the old run lease.
2. Preserve process, log, event, snapshot and output evidence.
3. Switch public output to a safe privacy-safe scene.
4. Choose the newest compatible snapshot.
5. Verify checksum, schema/config/content compatibility and game invariants.
6. Replay durable events and commands after the snapshot.
7. Compare hierarchical checkpoints and interaction idempotency state.
8. Rebuild presentation and audio from current snapshot.
9. Verify tick, frame, HUD, audio and output.
10. Resume and record recovery.

If validation fails, try an older compatible snapshot. Repeated or unknown divergence quarantines the run and starts a fresh run rather than claiming continuity.

## Failure Policies

- AI or planner timeout: deterministic fallback.
- Provider, model or telemetry outage: autonomous play continues.
- Moderation outage: disable public text and other policy-required interactions.
- Entitlement or audit uncertainty: reject or defer paid-eligible authoritative effects.
- Persistence pressure: bounded durable buffer and safe-boundary behavior before overflow.
- Renderer, audio or output failure: simulation continues while presentation restarts.
- Resource pressure: reduce cosmetic and level-of-detail work, then controlled restart if needed.
- Crash loop: jittered backoff, breaker, safe intermission and operator escalation.
- Invariant or replay divergence: immediate quarantine.

## Idempotency

Provider event ID, normalized input ID, influence request ID and authoritative command ID form a traceable chain. Recovery reloads the decision and application ledger before accepting retries. Reversal appends a new event; it never deletes historical truth.

## Operations and Tests

Runbooks and typed controls cover component restart, interaction disable, snapshot, verified restore, older snapshot, fresh run, safe scene, rollback and halt. Inject worker kills, duplicate/reordered events, persistence lag, corrupt snapshots, output black/freeze/silence, host restart and credential rotation. Verify expected state, alert, automated action, recovery objective, no duplicate effects and evidence retention.

## Acceptance

Restore matches uninterrupted checksums, corruption/divergence quarantines, common outages preserve truthful autonomous play, crash loops are bounded, output recovery is verified, resources stabilize through required soak and operators can execute every runbook without arbitrary state mutation.
