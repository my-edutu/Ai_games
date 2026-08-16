# Long-Running Reliability Model

## Objective

Keep each game truthful, watchable, and recoverable during unattended livestream operation. Reliability is not merely process uptime: the simulation must continue making progress, presentation must remain fresh and audible, external integrations must degrade safely, and every recovery must preserve or explicitly reset gameplay truth.

## Reliability States

### Channel state

- `healthy`: all critical paths meet service objectives.
- `degraded`: gameplay continues but one or more optional capabilities are unavailable or operating below target.
- `recovering`: automated recovery is actively restoring a component or run.
- `safe-intermission`: broadcast remains intentional while authoritative continuation is unavailable or integrity is uncertain.
- `maintenance`: scheduled operator-controlled state with interactions disabled.
- `halted`: output is intentionally stopped because truthful or safe operation cannot be guaranteed.

### Run integrity state

- `verified`: current checksum chain and persisted position agree.
- `buffered`: valid authoritative state is ahead of durable persistence within the allowed recovery window.
- `restoring`: snapshot and event replay are in progress.
- `quarantined`: replay, invariant, or schema validation failed.
- `finalized`: terminal result and checksum are immutable.

The public stream status must not falsely present a quarantined run as continuing normally.

## Failure Domains

1. simulation tick and game rules;
2. autonomous decision systems;
3. procedural content generation;
4. presentation/rendering and camera;
5. audio/music output;
6. audience provider adapters;
7. moderation and entitlement services;
8. persistence and replay storage;
9. analytics/telemetry;
10. operator dashboard/control plane;
11. OBS/FFmpeg/browser capture and stream output;
12. host resources, network, operating system, and deployment platform.

Each domain has independent health signals, timeouts, retries, circuit breakers, restart policy, and a declared effect on gameplay.

## Critical Invariants

- Only one active authoritative writer owns a run lease.
- Tick numbers and event sequences never move backward or duplicate.
- A recovered run resumes only after snapshot compatibility, event continuity, and checksum validation.
- A failed optional integration cannot block the simulation thread.
- Queue and buffer growth are bounded with explicit overflow policy.
- Recovery attempts are finite within a window; repeated failure trips a breaker instead of creating an endless crash loop.
- Operator emergency controls remain available when normal game controls fail.
- The stream never displays private diagnostics, secrets, raw provider payloads, or unsafe user text.

## Heartbeats and Progress Probes

Every process emits a heartbeat, but liveness alone is insufficient. Required probes include:

- simulation tick advances at the expected logical rate;
- meaningful game progress or valid idle state occurs within game-specific bounds;
- render snapshots change or an intentional static scene is declared;
- presentation frames and source timestamps advance;
- expected audio buses produce activity or an intentional-silence state is declared;
- persistence acknowledges events within the recovery-point objective;
- provider connections receive keepalives and expose last-event time;
- operator commands complete or fail with typed outcomes;
- output probe detects black frame, frozen frame, wrong scene, missing overlay, and sustained silence.

A “stuck detector” distinguishes legitimate strategic waiting from loops, oscillation, deadlocks, impossible objectives, and content-generation traps.

## Recovery Point and Recovery Time

Catalogue defaults, overridden only by stricter game requirements:

- authoritative event loss objective: zero after acknowledgement;
- unacknowledged in-memory recovery window: no more than 10 seconds of authoritative ticks;
- snapshot interval: adaptive within 30–120 seconds, plus milestone and pre-risk snapshots;
- simulation process recovery target: 60 seconds;
- presentation/audio process recovery target: 30 seconds;
- provider adapter recovery target: 5 minutes while game continues autonomously;
- safe intermission activation after output truth cannot be verified for 10 seconds;
- fresh-run fallback after compatible restore attempts are exhausted, with failed run preserved as `quarantined`.

Exact thresholds are configuration, telemetry, and test fixtures—not undocumented constants.

## Snapshot Strategy

Snapshots are written asynchronously and include:

- game, platform, deterministic algorithm, and schema versions;
- run ID, seed metadata, tick, next event sequence, and lease epoch;
- authoritative state payload;
- configuration and content-pack hashes;
- checksum and compression metadata;
- creation reason and source deployment;
- last durably persisted authoritative event.

Writing uses temporary objects and atomic promotion. Restore verifies size, checksum, schema, game compatibility, content availability, invariants, and event continuity before ownership changes.

## Watchdog Policy

The supervisor evaluates sliding windows rather than one noisy sample. It may:

1. emit warning and capture diagnostics;
2. disable an optional subsystem or expensive feature;
3. restart the failed worker;
4. restore the run from a verified snapshot;
5. transition output to safe intermission;
6. start a fresh run while quarantining the failed run;
7. halt the channel when truth, security, or platform compliance cannot be preserved.

Watchdog actions are idempotent, rate-limited, and audited. It cannot repeatedly restart faster than configured backoff.

## Degradation Matrix

| Failure | Gameplay | Audience | Presentation | Recovery |
|---|---|---|---|---|
| YouTube/Twitch input outage | Continue | Disable affected provider and queue no unverifiable paid effects | Show restrained connection state | Reconnect with backoff and dedupe |
| Remote AI outage | Continue with deterministic fallback | Continue eligible interactions | Intent overlay identifies fallback mode without technical noise | Circuit breaker and health probes |
| Database unavailable | Continue within bounded durable buffer | Accept only effects whose audit/durability policy permits; otherwise reject clearly | No disruption unless buffer nears limit | Retry, spill to durable local/secondary log if configured, then safe boundary |
| Telemetry unavailable | Continue | Continue | Continue | Priority buffer/drop; no tick blocking |
| Audio engine crash | Continue | Continue | Visual status remains normal; no alarming public debug copy | Restart audio; output alarm |
| Renderer crash | Continue snapshots | Continue if acknowledgements remain auditable | Safe slate, then reconstructed scene | Restart renderer from latest snapshot |
| Simulation invariant failure | Stop affected run | Reject/disable authoritative effects | Safe intermission | Preserve evidence; restore earlier snapshot or fresh run |
| Output frozen/black | Continue or pause according to game policy | Queue only within disclosed limits | Switch scene/source | Restart capture and verify moving image |
| Host resource exhaustion | Reduce optional load | Rate-limit effects | Reduce particles/resolution/replays | Controlled restart or failover |

## Resource Stability

Every long-lived collection has one of: maximum size, time-to-live, compaction, rollover, or durable offload. Tests track:

- resident memory and heap slope;
- object/handle/thread counts;
- texture, audio-buffer, and GPU-resource lifecycle;
- event, command, telemetry, and persistence queue depths;
- cache hit rate and eviction;
- snapshot size and duration;
- log volume and disk consumption;
- provider reconnection objects and listeners.

Monotonic growth without a justified finite bound is a stop-ship defect.

## Soak and Chaos Programme

Before unattended promotion:

- accelerated deterministic campaigns cover at least 100,000 representative runs for lightweight games or an equivalent statistically justified workload;
- a 24-hour engineering soak validates functional continuity early;
- a 72-hour production-candidate soak validates stable resources, recovery, and output;
- a seven-day canary channel validates real provider and operational behaviour before broad 24/7 promotion;
- chaos scenarios terminate workers, delay persistence, corrupt a test snapshot, drop provider connections, inject duplicate events, exhaust configured queues, disable audio, freeze presentation, and rotate credentials;
- every injected failure has an expected state transition, alert, recovery, and evidence record.

A canary clock resets for any change affecting authoritative rules, recovery, provider handling, resource lifecycle, deployment topology, or output capture.

## Alerts

Alerts are actionable and include current state, impact, run/channel, first occurrence, duration, probable domain, recent automated actions, and runbook link. Required pages include:

- run lease conflict;
- tick stalled or p99 over budget;
- invariant/replay divergence;
- crash loop or failed restore;
- durable buffer near limit;
- memory/handle/GPU growth over threshold;
- output black/frozen or missing audio;
- moderation/entitlement processing unavailable;
- unexpected paid-event rejection/reversal spike;
- secret/authentication failure;
- safe intermission exceeding its target duration.

Product anomalies such as low novelty or unusual run-duration distribution create non-paging investigations unless they imply game failure.

## Incident and Rollback

Every release records the previous compatible deployment, snapshot compatibility, configuration rollback, content rollback, provider rollback, and operator verification steps. Incidents preserve:

- relevant logs, metrics, traces, events, snapshots, configuration hashes, versions, and output samples;
- viewer/privacy-safe handling;
- automated actions and operator commands;
- impact window and affected run IDs;
- decision to restore, fresh-start, or halt.

## Acceptance Criteria

A game passes reliability review only when:

- failure domains and degradation behaviours are mapped;
- watchdog actions and breakers are tested;
- snapshot restore and deterministic replay succeed across declared versions;
- duplicate events, reordered callbacks, and provider reconnects do not duplicate effects;
- memory, queues, handles, logs, textures, and audio resources remain bounded during soak;
- output probes detect and recover from frozen/black/silent failure;
- optional service outages do not stop authoritative play;
- integrity failures quarantine rather than silently continue;
- alerts and runbooks lead to a verified recovery or safe halt;
- required soak, chaos, canary, and rollback evidence is attached.
