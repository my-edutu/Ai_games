# AI Battle Royale Operations Runbook

## Purpose

This runbook defines the production-safe operating response for Game 6. Simulation truth is authoritative; the browser broadcast, audio, persistence, and audience providers are supervised independently. A presentation or provider outage must never be converted into a game loss, winner, or invented result.

## Health model

The operator watches five independent signals: logical tick progress, render change, expected audio activity, persistence freshness, and audience-provider availability. Queue utilization and resource pressure are secondary capacity signals. Provider or moderation loss degrades interactions only. Audio loss degrades to captions and mute. Render, persistence, or simulation no-progress is unsafe and moves public output to the intentional recovery safe scene.

## Unsafe-output procedure

1. Move the public broadcast to the safe scene before restart work. Do not leave a frozen or black gameplay frame on air.
2. Disable audience interaction if provider, moderation, entitlement, or audit certainty is unavailable. Autonomous battle simulation remains complete without viewers.
3. Restart only the failed component when isolation is possible. Repeated restart loops are prohibited.
4. Perform a verified restore from a version-compatible, checksum-valid Battle Royale snapshot envelope. Corrupt or incompatible evidence is quarantined; never silently continue from it.
5. Reconcile bounded replay evidence and confirm the restored checksum before accepting new authoritative work.
6. Verify output health after restore. Resume the battle scene only after state verification and healthy public output both succeed.
7. After the finite recovery-attempt budget is exhausted, halt safely and escalate to the incident owner rather than cycling indefinitely.

## Evidence and ownership

The on-call operations owner records candidate SHA, snapshot/envelope checksum, replay manifest checksum, failure reason, recovery attempts, and final output state. Security owns credential or moderation incidents; release engineering owns candidate identity and rollback evidence; gameplay engineering owns deterministic integrity. No operator may mark R5 from synthetic CI, fixture providers, compressed chaos, or local self-review evidence.

## Rollback

Use the Battle Royale rollback matrix for trigger-specific action. A rollback must preserve the last verified snapshot and replay manifest for diagnosis. Any deterministic divergence, duplicate authoritative application, privacy leak, unresolved P0/P1, or failed verified restore is a release failure and blocks promotion until a corrected candidate is freshly validated.
