# AI Zombie Survival — Production Operations Runbook

## Objective
Keep the autonomous simulation authoritative and recoverable while protecting the public stream. Audience providers and presentation are optional dependencies; durable persistence and single-writer fencing are authoritative dependencies.

## Incident order
1. Protect output with the safe scene when the renderer/capture is black, frozen, stale, or divergent.
2. Disable audience interactions when provider, moderation, entitlement, or audit health is uncertain. The autonomous game continues.
3. Fence the old writer before any restore. Never run two authoritative writers for one channel.
4. Restore the newest compatible, checksum-valid `zombie-v4` snapshot and replay contiguous durable commands. Skip corrupt snapshots; quarantine gaps or checksum divergence.
5. Verify authoritative checksum, then verify renderer/capture output before resuming the live scene.
6. If verification repeatedly fails, keep the safe scene and emergency-halt the simulation rather than inventing game truth.

## Alerts and actions
- `zombie-output-unsafe`: page. Safe scene → renderer restart → verified simulation recovery → visual verification.
- `zombie-queue-pressure`: reduce presentation quality and disable interactions if pressure continues; never drop authoritative commands already reserved.
- Persistence unavailable: fail authoritative command before mutation and page immediately.
- Provider/moderation unavailable: disable interactions; do not restart or halt autonomous gameplay solely for an optional dependency.
- Crash loop: open the supervisor breaker, protect output, fence the writer, and require verified recovery.

## Mandatory production drill catalogue
Each R5 candidate must execute every drill below against the exact candidate checksum. CI/synthetic execution proves the implementation only. Production-equivalent acceptance additionally requires an independent witness and externally signed evidence.

- `provider-outage`
- `moderation-outage`
- `entitlement-outage`
- `audit-outage`
- `disable-interactions`
- `disable-public-text`
- `simulation-failure`
- `renderer-failure`
- `audio-failure`
- `gateway-failure`
- `persistence-failure`
- `black-output`
- `frozen-output`
- `wrong-scene`
- `silent-output`
- `verified-restore`
- `older-snapshot-fallback`
- `divergence-quarantine`
- `credential-rotation`
- `credential-revocation`
- `config-rollback`
- `content-rollback`
- `deployment-rollback`
- `safe-intermission`
- `emergency-halt`
- `alert-escalation`

For public-output failures, switch to the **safe scene** before restart or restore. For authoritative failures, perform a **verified restore** and compare checksums before resuming. Record an **independent witness** for production-equivalent drills.

## Rollback
Rollback means deploy the last exact candidate whose deterministic version, config/content hashes and snapshots are compatible. A material authoritative rules change starts a new deterministic compatibility boundary. Do not coerce an incompatible snapshot into a new binary. Phase 6 uses the fully verified Phase 5 source as its rollback boundary and starts a fresh run when compatibility is uncertain.

Immediate rollback triggers include replay divergence, duplicate influence application, private-data exposure, unauthorized control, record corruption, unsafe moderation failure, persistent bad output, or a canary guardrail breach.

## R5 launch evidence
The release manifest is bound to the exact Git commit and contains version/config/content/asset/deployment identities plus rollback metadata. Promotion requires all MUST traceability, deterministic campaign integrity, production-reference capacity, at least 72 real elapsed endurance hours, credentialed YouTube and Twitch validation, security/privacy/moderation/accessibility/audiovisual/assets/supply-chain attestations, the complete production-equivalent drill programme, a clean seven-real-day canary, and a current external signed independent review.

Synthetic timestamps, fixture providers, CI-only drills, and self-review must remain BLOCKED at R4. They must never be translated into R5 PASS evidence.

## Evidence retention
Retain append-only commands, bounded compatible snapshots, operator/recovery audit, chaos reports, release-validation bundles, exact commit SHA, hashes, provider attestations, drill evidence, canary samples, independent review and rollback decisions. Any material authoritative change invalidates candidate-bound evidence and restarts the applicable validation clock.
