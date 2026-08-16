# Shared Simulation Engine

## Mission

Provide a deterministic, headless-capable authoritative runtime shared by all catalogue games. It owns run lifecycle, logical time, command ordering, named randomness, state validation, snapshots, checksums, replay, and semantic events. It does not render, play audio, call provider APIs, query analytics, or decide game-specific rules.

## Public Responsibilities

- create a run from validated game module, configuration, content versions, and seed;
- advance fixed authoritative ticks;
- schedule and order lifecycle, agent, system, audience, and recovery commands;
- derive named random streams;
- invoke game module observation, action validation, step, signal, result, and snapshot contracts;
- persist append-only authoritative events asynchronously;
- emit immutable render snapshots and semantic events;
- create/validate/restore snapshots;
- calculate hierarchical checksums and detect divergence;
- run headless campaigns at accelerated speed;
- expose health, performance, progress, and integrity signals to the supervisor.

## Lifecycle

`initializing → countdown → running ↔ paused → resolving → intermission → terminated`

`quarantined` is entered from any state when integrity cannot be guaranteed. Recovery may restore to a verified previous tick or start a new run; it never silently resumes a divergent state.

## Tick Contract

For tick `n`:

1. assert lease, lifecycle, configuration, and state invariants required at this cadence;
2. take commands scheduled for `n` and sort by stable priority and ID;
3. apply lifecycle commands that permit or prevent rule execution;
4. build serializable observations;
5. obtain bounded agent actions or deterministic fallback;
6. validate actions and resolve conflicts in stable order;
7. call the game’s fixed-step systems pipeline;
8. update progression, objective, records, and terminal state;
9. emit ordered semantic events;
10. compute configured hierarchical checksum;
11. produce render snapshot and normalized signals;
12. enqueue event persistence, telemetry, and optional snapshot work;
13. advance to `n + 1`.

Presentation frame schedules, provider callback times, log sinks, database latency, and model response timing cannot alter this sequence.

## Time

- Tick duration is configuration validated against the game manifest.
- Durations use integer ticks or exact fixed units.
- Real-time hosts may execute several ticks to catch up but cap work per frame and never enlarge the authoritative delta.
- Headless hosts ignore wall clock and run as fast as budgets permit.
- Pause freezes authoritative tick; provider input is rejected, queued, or scheduled according to game/policy rather than applied during pause accidentally.
- Presentation slow motion is cosmetic unless an explicit versioned authoritative speed command exists.

## Commands

Commands use the shared envelope and one of these priority bands:

1. lease/integrity/recovery;
2. lifecycle/emergency operator;
3. scheduled authoritative system events;
4. accepted audience influence;
5. agent actions;
6. lower-priority game commands.

The exact within-band key is stable. Duplicate idempotency keys return the prior decision. Stale and illegal commands fail atomically and emit a decision event.

## Named Random Streams

The engine derives streams from `(root seed, game ID, deterministic version, stream name)`. Streams are requested through a registry; unknown dynamic names are rejected unless the game manifest permits indexed entity streams with a stable derivation rule.

Default names include world generation, agent policy, rewards, event director, audience tie-breaks, and cosmetic variation. Cosmetic streams never enter authoritative systems.

## State and Invariants

The engine stores one authoritative state value per run. It prevents in-place presentation mutation by exposing read-only inputs and accepting only the game’s returned next state.

Invariant levels:

- tick-cheap: identifiers, bounds, lifecycle, sequence, no invalid numeric values;
- milestone/snapshot: reachability, resource/graph consistency, terminal/result consistency;
- headless/deep: expensive conservation, replay, leak, diversity, and historical checks.

An invariant failure records tick, event window, checksum tree, state diagnostic digest, configuration/version, and recovery action.

## Events and Persistence

Authoritative events receive `(run ID, sequence)` total order. Event persistence occurs outside the tick through a bounded durable queue. Acknowledged audience effects follow the configured durability policy before public confirmation when required.

If persistence is unavailable:

- continue within the declared recovery-point buffer;
- reject/defer interactions requiring unavailable audit/durability;
- alert before the bound;
- at the bound, reach a safe snapshot/intermission/halt policy rather than discard truth.

## Snapshots

Snapshots include platform/game/deterministic/config/content/schema versions, run/seed/tick/next sequence, named stream states, state payload, event durability boundary, checksum, and creation reason. Writes use atomic promotion.

Restore verifies size, checksum, compatibility, state invariants, event continuity, replay checkpoints, and run lease. Unsupported migration returns a typed error and may require a fresh-run boundary.

## Checksums and Divergence

Compute a root checksum from ordered subsystems and entity groups so divergence can be localized. Evidence fixtures store checkpoints at initialization, milestones, snapshots, and terminal result.

Divergence policy:

1. stop affected authoritative run;
2. preserve snapshot/event/version/config evidence;
3. try an earlier verified compatible snapshot if policy permits;
4. quarantine on repeat or unknown cause;
5. show safe intermission;
6. start a fresh run without claiming continuity.

## Headless Runner

Inputs:

- game/config/content versions;
- seed list/range/feature strata;
- normalized scheduled event logs;
- run/tick/terminal limits;
- evidence metrics and invariant profile;
- stop-on-failure policy.

Outputs:

- result/failure/progress distributions;
- named-stream/checksum manifest;
- invariant and generator failures;
- decision/stuck/fallback metrics;
- tick-time, memory, queue, snapshot, and throughput profiles;
- replay artefacts for anomalies and representative runs.

Headless mode uses the identical game rules and authoritative systems as stream mode.

## Concurrency

One run executes authoritative commits serially. Independent observations, pathfinding, or broadphase work may run concurrently only when inputs are immutable, deadlines are bounded, and results are reduced in a stable order. Late work is ignored or replaced by fallback; it cannot commit asynchronously after its tick.

## Error Types

- invalid configuration/content;
- unsupported game/snapshot/event version;
- lease conflict;
- command/action validation;
- decision budget exceeded;
- generator bounded failure;
- invariant violation;
- persistence buffer pressure;
- snapshot validation/restore;
- replay divergence;
- terminal lifecycle misuse.

All errors have stable codes, severity, retryability, operator action, and privacy-safe context.

## Performance Defaults

- authoritative tick p99 below 50% of interval under normal reference load;
- no optional integration blocks the authoritative thread longer than one millisecond;
- bounded work per tick for commands, agents, physics, generation, and events;
- asynchronous snapshots do not miss ticks;
- headless standard grid games achieve at least ten times real-time on reference CI hardware;
- memory and queue slopes stabilize during soak.

Games declare stricter or justified alternate budgets in their technical architecture.

## Required Tests

- fixed-step and render-schedule independence;
- command priority/order/idempotency/staleness;
- random-stream reproducibility/isolation;
- initial/tick/result determinism;
- snapshot round-trip/migration/restore;
- uninterrupted versus restore replay checksums;
- invariant corruption and quarantine;
- bounded persistence/command/telemetry queues;
- process kill/lease fencing/recovery;
- headless/stream rule equivalence;
- performance, memory, soak, and supported-host fixtures.

## Acceptance

The shared engine is ready for the Snake reference implementation when a minimal game module can complete, snapshot, restore, replay, render, fail, quarantine, intermit, and restart through the public contracts with no provider/render/audio dependency in authoritative code.
