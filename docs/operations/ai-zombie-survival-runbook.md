# AI Zombie Survival — Phase 5 Operations Runbook

## Objective
Keep the autonomous simulation authoritative and recoverable while protecting the public stream. Audience providers and presentation are optional dependencies; durable persistence and single-writer fencing are authoritative dependencies.

## Incident order
1. Protect output with the safe scene when the renderer/capture is black, frozen, stale, or divergent.
2. Disable audience interactions when provider, moderation, entitlement, or audit health is uncertain. The autonomous game continues.
3. Fence the old writer before any restore. Never run two authoritative writers for one channel.
4. Restore the newest compatible, checksum-valid `zombie-v3` snapshot and replay contiguous durable commands. Skip corrupt snapshots; quarantine gaps or checksum divergence.
5. Verify authoritative checksum, then verify renderer/capture output before resuming the live scene.
6. If verification repeatedly fails, keep the safe scene and emergency-halt the simulation rather than inventing game truth.

## Alerts and actions
- `zombie-output-unsafe`: page. Safe scene → renderer restart → verified simulation recovery → visual verification.
- `zombie-queue-pressure`: reduce presentation quality and disable interactions if pressure continues; never drop authoritative commands already reserved.
- Persistence unavailable: fail authoritative command before mutation and page immediately.
- Provider/moderation unavailable: disable interactions; do not restart or halt autonomous gameplay solely for an optional dependency.
- Crash loop: open the supervisor breaker, protect output, fence the writer, and require verified recovery.

## Rollback
Rollback means deploy the last exact candidate whose deterministic version, config/content hashes and snapshots are compatible. A material authoritative rules change starts a new deterministic compatibility boundary. Do not coerce an incompatible snapshot into a new binary.

## Evidence
Retain append-only commands, bounded compatible snapshots, operator/recovery audit, chaos report, exact commit SHA, and hashes. Synthetic chaos proves implementation only; it does not satisfy the real 72-hour endurance or seven-day canary required for production R5.
