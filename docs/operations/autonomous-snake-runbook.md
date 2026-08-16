# Autonomous Snake Operations Runbook

## Operating Principle

Preserve authoritative integrity before availability. When truth is uncertain, fence the writer, show the intentional safe scene, verify compatible evidence, and either restore exactly or quarantine and start a clearly declared fresh run. Never label a technical failure as a game loss.

## Roles

- **Viewer:** read-only status.
- **Operator:** safe scene, disable interactions/public text, restart isolated components, request snapshot, change quality tier.
- **Administrator/on-call lead:** verified restore, fresh run, deployment/config rollback and emergency halt.

Every command is environment-scoped, idempotent and append-only audited. Arbitrary database or memory editing is prohibited.

## Replay Divergence / Invariant Failure

1. Activate the safe scene and disable new paid-eligible interactions.
2. Fence the current writer lease.
3. Preserve process logs, command journal, snapshots, checksums and deployment/config/content versions.
4. Attempt newest compatible snapshot; on corruption, try the next older compatible snapshot.
5. Replay contiguous commands and compare hierarchical/final checksum.
6. Resume only after snapshot, replay and output verification all pass.
7. Otherwise quarantine the run, exclude it from records, and begin a fresh declared run on the last compatible version.

## Black, Frozen, Wrong-Scene or Silent Output

1. Switch to the privacy-safe recovery scene.
2. Keep authoritative simulation running only when its heartbeat/progress/integrity are healthy.
3. Restart the affected renderer/audio/capture component.
4. Rebuild from the latest accepted render snapshot.
5. Verify frame freshness, non-black output, expected scene, critical HUD, intended audio/silence and capture resolution.
6. Return to live output after two healthy verification samples; halt safely after the bounded retry limit.

## Provider / Moderation / Entitlement / Audit Outage

- Provider outage: disable new interaction windows; autonomous play continues.
- Moderation outage: public names/text disabled; paid-eligible actions fail closed.
- Entitlement uncertainty: paid weighting/effects fail closed; ordinary fixed-token votes may continue only under declared policy.
- Audit/idempotency outage: paid-eligible authoritative effects are rejected/deferred; never confirm publicly before durable reservation.

## Persistence Pressure or Failure

1. Reject new paid-eligible authoritative commands when durable reservation is unavailable.
2. Preserve the current verified snapshot and safe scene.
3. Do not advance authoritative commands beyond the bounded durable buffer policy.
4. Recover persistence, verify sequence continuity and resume, or quarantine/fresh-run at a declared boundary.

## Crash Loop

After the configured failure threshold, open the breaker, stop automatic restart attempts, activate safe output, and page the assigned owner. A half-open probe is allowed only after cooldown. A successful verified probe closes the breaker; a failed probe reopens it.

## Credential Revocation

Disable provider interactions, rotate/revoke the affected credential, verify that logs/public state contain no secret, test the replacement in a sandbox/production-equivalent path, then re-enable with audit evidence.

## Rollback

Rollback the application, configuration, content and provider adapters as one declared compatibility set. If the previous deployment cannot load current snapshots/events, finish or quarantine the current run and start a fresh run on the previous version. Historical records are never rewritten.

## Required Incident Evidence

Channel/run IDs, source/deployment/config/content/deterministic versions, lease generation, command/event ranges, snapshots attempted, checksum comparisons, automated actions, operator audit, output captures, resource/queue state, alert/runbook timestamps, resolution and follow-up owner.