# AI City Traffic Experiment Operations Runbook

## Purpose and authority boundary

This runbook operates Game 11 without confusing the public renderer, provider adapters, or operator console with simulation authority. The fixed-tick runtime and its verified snapshot are authoritative. During uncertainty, preserve the latest accepted public frame or show the intentional **safe scene**; never invent traffic state, a score, a record, or a result.

Every production drill must use the exact frozen candidate checksum, record start and end timestamps, capture health and public-output evidence, identify the owner, and name an **independent witness** who is not the drill operator. Automated CI drills prove implementation only. They do not satisfy the production drill gate.

## Normal operation

1. Start with `npm run traffic:stream` and verify `/traffic/health` reports `healthy`.
2. Confirm the public frame shows Mobility Score, flow, congestion, active vehicles, demand wave, AI intent, and record gap.
3. Confirm the provider and moderation states are healthy before enabling audience input.
4. Set `TRAFFIC_SNAPSHOT_PATH` to an operator-owned persistent volume. The host writes a checksum-verified snapshot atomically at least every 50 logical ticks, uses owner-only permissions, and never treats a partially written `.tmp` file as authority.
5. A corrupt or incompatible persisted snapshot is renamed into quarantine and the host remains in the safe scene. It never silently authorizes a fresh run over failed recovery evidence.
6. Restore attempts are bounded. Repeated post-restore faults trip the recovery crash-loop breaker; a failed verified restore quarantines immediately rather than continuing from a possibly partial in-memory tick.
7. Route any degraded dependency through the declared safe action. Provider or moderation failure disables audience input while autonomous play continues.

## Mandatory drills

### `authority-stall-restore`

Inject a stopped authority heartbeat. The health assessor must quarantine the run, the host must enter the safe scene, and recovery must use **verified restore** from the latest valid snapshot. Success requires monotonic event sequence, restored RNG state, no duplicate effect, and a public recovery acknowledgement.

### `snapshot-corruption-quarantine`

Alter one snapshot checksum and separately alter one invariant before resealing. Both attempts must produce typed quarantine errors. Repeat the drill against the persistent snapshot file: the bad file must be atomically moved to quarantine, the `.tmp` path must be absent, and the host must remain in the safe scene. The corrupted snapshot must never become authoritative.

### `renderer-recovery`

Interrupt canvas/public output while leaving authority running. The host must show “Restoring city view,” rebuild from the latest accepted render snapshot, and resume without changing the authority checksum or classifying the incident as a game loss.

### `provider-outage`

Set the audience provider to offline. New free and paid-eligible inputs must be rejected by the same boundary, queued authority must remain bounded, and autonomous traffic must continue. Recovery requires successful authentication, reconnect, duplicate, reversal, outage, and rate-limit checks.

### `queue-overload`

Drive the normalized audience queue to the near-capacity band. The health report must request load shedding before capacity is exceeded. Exceeding the declared capacity must quarantine the input queue rather than accepting unbounded work.

### `rollback-to-phase5`

Freeze the current run, preserve evidence, disable audience intake, and roll back to source `4d5c6351043061461781d2ef0fa791d92eb15641` at a fresh run boundary. Do not mix snapshots, commands, records, or RNG state across incompatible candidate versions. Verify the rollback artifact and public safe scene before reopening traffic.

### `record-integrity`

Complete a run, verify its final checksum and audience-influence category, restart, and prove that an audience-influenced score cannot overwrite a standard-category record. Any mismatch freezes record writes and triggers investigation.

### `moderation-degradation`

Set moderation to degraded and offline. Audience input must disable immediately while the city remains autonomous. The public state must not reveal viewer tokens, raw payloads, provider secrets, or moderation internals.

## Incident priorities

P0: authority divergence, private exposure, unauthorized control, corrupted records, duplicate paid effect, or unsafe moderation. Enter safe scene, disable input, preserve logs, and quarantine.

P1: repeated restore failure, sustained output outage, queue breach, provider authentication failure, or resource slope above the critical threshold. Degrade or roll back according to the health action.

P2: cosmetic defects, delayed noncritical cues, or isolated provider latency with safe fallback. Track and repair without changing authority.

## R5 evidence sequence

R4 software completion does not authorize an R5 label. Promotion requires the exact deployed candidate to pass production-reference capacity, a real elapsed **72-hour** endurance run, current credentialed YouTube and Twitch checks, external safety attestations, every production drill with an independent witness, a guarded **seven-day canary**, and an independent exact-candidate review with no open P0/P1.

## Rollback and closeout

Rollback is a fresh-run transition. Record candidate SHA, deployment artifact, config/content/assets hashes, snapshot disposition, reason, operator, witness, start/end time, public-output state, and validation result. After recovery, run the candidate validator and attach its checksum. Never claim production ready unless it returns `PASS`, `R5`, and `productionReady: true`.
