# Autonomous Livestream Game Platform Architecture

## 1. Architectural Goal

Provide one provider-neutral, deterministic, observable, and recoverable platform on which twelve autonomous games can run for days, accept bounded audience influence, produce broadcast-quality presentation, and restart without operator intervention.

The platform uses a modular monolith at repository and contract level, with process isolation for simulations, presentation, provider integrations, and operational control. This avoids premature distributed-system complexity while preventing one game or provider failure from corrupting authoritative gameplay.

## 2. Context

### External actors and systems

- Viewers watch through YouTube, Twitch, or future providers.
- Viewers submit chat messages, votes, reactions, gifts, memberships, and eligible paid events.
- Operators configure schedules, effect policies, difficulty targets, moderation, maintenance, and emergency controls.
- Streaming software captures a browser or native render source and publishes video/audio.
- Provider APIs emit events and health information.
- Storage retains configurations, run records, snapshots, events, moderation decisions, and analytics.
- Observability systems receive logs, metrics, traces, alerts, and incident annotations.

### Trust boundaries

Provider payloads, chat text, gift metadata, operator input, configuration files, imported content, and model responses are untrusted. They are validated before entering authoritative or presentation state. The simulation kernel, versioned rules, normalized event log, and checksummed snapshots form the gameplay truth boundary.

## 3. Runtime Topology

### Control Plane

The control plane owns configuration, deployment version, game selection, schedule, operator commands, feature flags, provider credentials, moderation policy, rollouts, and incident state. It cannot directly mutate arbitrary game memory. It submits typed administrative commands through the same audited command path used for lifecycle control.

### Data Plane

A running channel consists of:

1. **Run Supervisor** — owns process lifecycle, crash-loop policy, heartbeats, resource limits, and recovery selection.
2. **Simulation Worker** — owns authoritative state, tick loop, named random streams, game rules, AI decisions, and snapshot generation.
3. **Audience Gateway** — ingests provider events and emits normalized, validated influence requests.
4. **Event Director** — evaluates eligibility, cooldowns, pacing, fairness, and game policy before scheduling influence commands.
5. **Presentation Host** — consumes immutable render snapshots and presentation events, drives camera/HUD/VFX, and produces stream-ready frames.
6. **Audio Engine** — maps semantic cues and state to music, ambience, SFX, ducking, captions metadata, and loudness-safe output.
7. **Persistence Writer** — appends events, stores snapshots and records, handles retries, and reports durability lag without blocking the tick loop.
8. **Telemetry Pipeline** — emits structured operational and product signals asynchronously.
9. **Output Health Probe** — confirms the stream scene is updating, audio is present when expected, frame delivery is healthy, and the captured source is not black or frozen.

Each component can begin in one deployable application with worker/process boundaries. Split deployment occurs only when measured load, failure isolation, or independent scaling requires it.

## 4. Authoritative Tick

The simulation worker uses a fixed time step. Wall-clock time determines how many ticks should be presented, not the result of a tick.

For tick `n`:

1. load commands whose scheduled tick equals `n`;
2. validate lifecycle and game preconditions;
3. obtain agent actions within declared decision budgets;
4. resolve rules and physics in deterministic order;
5. update progression, objectives, records, and run termination state;
6. emit semantic gameplay events;
7. calculate state checksum at configured intervals;
8. produce an immutable render snapshot;
9. enqueue persistence and telemetry work;
10. increment the authoritative tick.

No presentation frame rate, network callback, logging sink, provider response, or remote model latency may change this ordering.

## 5. Randomness

The run seed derives independent named random streams, including:

- `world-generation`;
- `agent-policy`;
- `loot-and-rewards`;
- `event-director`;
- `audience-tiebreaks`;
- `cosmetic-variation`.

Authoritative code cannot call ambient system randomness. Adding a new random draw to one stream must not perturb unrelated streams. Algorithms and stream versions are recorded in run metadata.

## 6. Commands and Events

Commands request state changes. Events state what occurred.

Command families:

- lifecycle: start, pause, resume, terminate, restart, checkpoint;
- gameplay: game-specific agent or system actions;
- influence: eligible audience or scheduled effects;
- operator: maintenance, safe-mode, mute, effect-disable, scene transition;
- recovery: restore snapshot, skip corrupt snapshot, quarantine event.

Every external command includes an idempotency key, source, received time, scheduled tick, schema version, authorization result, moderation result, and audit correlation ID.

Events are append-only within a run. Corrections create new events; persisted history is not rewritten.

## 7. Game Module Interface

A game module provides:

- metadata and configuration schema;
- initial state factory;
- tick reducer or deterministic systems pipeline;
- observation builder for each agent type;
- action validation and resolution;
- procedural generators and validators;
- progress, danger, novelty, and pacing signals;
- audience influence catalogue and eligibility predicates;
- render snapshot adapter;
- semantic audio/VFX cue mapping;
- snapshot serializer and migrations;
- run-result and record calculation;
- headless simulation entrypoint;
- tests and production evidence definitions.

It cannot depend on provider SDKs, databases, streaming software, or operator UI implementations.

## 8. AI Boundaries

Each autonomous agent uses layered control:

1. hard legality and safety constraints;
2. reflex/tactical policy for immediate hazards;
3. bounded strategic planning;
4. stuck and loop detection;
5. deterministic fallback policy.

Model-backed assistance may propose high-level intentions or puzzle hypotheses. Proposals are schema-validated, deadline-bounded, recorded as external inputs when authoritative, and rejected safely. A fallback must keep the run progressing without model access.

The public “thinking” overlay shows concise game-state-derived intent, confidence, observations, and selected action rationale. It does not display hidden chain-of-thought or unvalidated model text.

## 9. Audience Influence Flow

1. Provider adapter verifies webhook/signature or authenticated connection.
2. Gateway normalizes the payload and strips unsupported data.
3. Identity, entitlement, rate limit, moderation, region, reversal, and idempotency checks run.
4. Eligible input becomes an `InfluenceRequest`.
5. Event Director evaluates game policy, current state, pacing, cooldown, conflict group, and effect budget.
6. Accepted influence becomes a scheduled authoritative command or presentation-only event.
7. The stream acknowledges accepted, queued, rejected, expired, or reversed state without exposing private user data.
8. The decision and outcome are written to the audit log.

No payment callback directly mutates game state.

## 10. Persistence and Recovery

Persistence uses:

- immutable run metadata;
- append-only normalized event segments;
- periodic full snapshots;
- optional incremental snapshots between full snapshots;
- checksums and schema versions;
- record and aggregate projections rebuildable from source events.

On restart, the supervisor chooses the newest valid compatible snapshot and replays subsequent authoritative events. It verifies checksums before resuming output. If a snapshot is corrupt, it tries the previous valid snapshot. If replay diverges, the run enters quarantined recovery, displays a safe intermission, preserves evidence, and starts a fresh run rather than presenting corrupted truth.

## 11. Degradation Modes

- **Provider outage:** continue autonomous play; disable affected interactions; show a restrained status indicator.
- **Persistence lag:** buffer within bounded limits; alert; increase snapshot interval only through policy; never block the tick loop indefinitely.
- **Telemetry outage:** buffer/drop according to signal priority; gameplay continues.
- **Remote model outage:** deterministic fallback takes over.
- **Audio failure:** continue visuals, surface operator alarm, attempt engine restart.
- **Presentation failure:** supervisor restarts presentation while simulation snapshots continue; safe slate appears during recovery.
- **Simulation crash:** restore last valid snapshot and replay; repeated crashes trip safe-mode and fresh-run policy.
- **Output freeze/black frame:** transition to intermission, restart source, preserve simulation or pause only according to game-specific broadcast policy.

## 12. Observability

Every run and process emits identifiers for environment, deployment, game, game version, run, seed, channel, process, snapshot, event correlation, and provider adapter.

Required operational signals include:

- tick duration percentiles and missed-tick count;
- render frame duration, dropped frames, and source freshness;
- CPU, GPU, memory, heap, handles, threads, and queue depth;
- heartbeat age and crash-loop count;
- snapshot age, duration, size, validation, and restore time;
- persistence lag and retry counts;
- provider connection state and event delay;
- influence accepted/rejected/expired/reversed counts;
- moderation and rate-limit outcomes;
- audio underruns, muted duration, loudness violations, and missing semantic cues;
- output black/frozen-frame duration;
- run duration, progress, danger, novelty, win/loss, restart reason, and record state.

Logs are structured and redacted. Metrics avoid unbounded labels. Traces sample high-volume tick work and retain errors and slow paths.

## 13. Security and Privacy

- Store credentials in environment-specific secret management.
- Apply least privilege to provider, database, deployment, and operator access.
- Separate public display names from durable internal identities.
- Minimise retained viewer data and document deletion/retention policies.
- Escape and constrain all user text before display.
- Verify webhooks and prevent replay attacks.
- Audit operator and paid-event decisions.
- Treat model prompts and responses as sensitive operational data when they contain user content.
- Protect operator controls with strong authentication, role-based authorization, and emergency revocation.

## 14. Performance Budgets

Game-specific budgets may be stricter. Catalogue defaults:

- authoritative tick p99 below 50% of the configured tick interval during normal load;
- no single optional integration may block the simulation thread longer than one millisecond;
- presentation sustains its target frame rate with p99 frame work below 80% of the frame interval on the reference host;
- snapshots complete asynchronously without missing authoritative ticks;
- memory reaches a stable band during soak instead of growing monotonically;
- audience queues remain bounded and apply explicit overflow policy;
- headless mode can run at least ten times real-time for standard grid games on the reference CI worker.

Reference hardware and exact per-game thresholds are recorded with test evidence.

## 15. Deployment and Rollback

Deployments are versioned as a compatible set of platform, game, configuration schema, snapshot schema, and overlay assets. A canary channel validates restore, provider degradation, output health, and representative interactions before broad promotion.

Rollback requires:

- a compatible previous deployment;
- declared snapshot/event compatibility or a fresh-run boundary;
- configuration rollback;
- provider adapter rollback;
- operator procedure and verification query;
- preserved failed-run evidence.

## 16. Architecture Acceptance

The platform architecture is accepted for implementation when:

- every game can implement the module contract without provider dependencies;
- deterministic replay inputs and ordering are explicit;
- every optional subsystem has a defined degradation path;
- audience payment and chat inputs pass through validation and policy before authoritative commands;
- presentation cannot mutate simulation state;
- recovery protects gameplay truth and avoids silent divergence;
- operational signals cover simulation, presentation, audio, providers, persistence, and output health;
- security and privacy boundaries are documented;
- measurable performance and production gates exist.
