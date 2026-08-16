# Autonomous AI Games Platform — Design Specification

## 1. Purpose

Build a production-grade monorepo containing twelve autonomous games designed for uninterrupted YouTube and Twitch livestreaming. Every game must be understandable within seconds, continuously generate meaningful progress and suspense, recover automatically from failures, and accept bounded viewer influence through votes, gifts, memberships, and operator-triggered events without selling guaranteed outcomes.

The catalogue is not twelve disconnected codebases. It is one shared livestream game platform with twelve game modules.

## 2. Product Thesis

Each title must sustain an endlessly renewable dramatic loop:

1. establish a visible goal;
2. let autonomous agents pursue it;
3. escalate difficulty and uncertainty;
4. expose readable decisions and stakes;
5. accept bounded audience influence;
6. produce wins, losses, records, near-misses, and recoveries;
7. close the run with a satisfying result;
8. generate a new seed and begin again automatically.

The system must avoid obviously scripted outcomes. Difficulty directors may shape pacing and target engagement bands, but game rules remain transparent, deterministic when seeded, and auditable.

## 3. Catalogue

1. Autonomous Snake
2. AI Maze Escape
3. Infinite Tower Climb
4. AI vs 1,000 Floors
5. Tiny AI Civilization
6. AI Battle Royale
7. Marble Survival Tournament
8. AI Escape Room
9. Endless AI Dungeon
10. AI Zombie Survival
11. AI Traffic Experiment
12. AI Ant Colony / Ecosystem
13. Shared optional mode: Chat vs AI

AI World Conquest is retained as a planned expansion after the first twelve reach the catalogue quality bar; its strategy systems can be built on the Civilization and Ant Colony packages rather than expanding initial scope.

## 4. Architecture

### 4.1 Monorepo layers

- `apps/`: player-facing streams, operator console, overlays, and game launchers.
- `games/`: one isolated package per game containing rules, agents, content, presentation adapters, and tests.
- `packages/`: reusable engines, contracts, tools, UI, audio, analytics, reliability, and integrations.
- `skills/`: specialist agent skills used to design, implement, review, and operate the catalogue.
- `docs/`: platform specifications, decision records, implementation plans, standards, and runbooks.
- `infra/`: deployment, observability, streaming, storage, secrets, and environment definitions.

### 4.2 Shared runtime pipeline

`Seed Service → Simulation Kernel → Game Rules → Agent Decisions → Physics/Resolution → Event Director → Progression → Audience Gateway → Presentation/HUD → Audio/VFX → Telemetry → Replay/Recovery`

### 4.3 Runtime boundaries

- The simulation kernel owns time, ticks, pause/resume, snapshots, deterministic random streams, and lifecycle state.
- Game packages own domain rules and may not import livestream-provider SDKs directly.
- The audience gateway converts provider events into validated, rate-limited, game-neutral influence commands.
- The event director schedules only events permitted by each game’s influence policy.
- Presentation consumes immutable render snapshots and cannot mutate simulation state.
- Persistence stores run metadata, snapshots, records, audience events, moderation decisions, and replay logs.
- The watchdog detects stalls, memory growth, unavailable providers, corrupt saves, and repeated crash loops.

## 5. Shared Specialist Skills

The repository will contain reusable skills covering:

- game creative direction;
- game architecture;
- autonomous-agent design;
- gameplay loops and progression;
- procedural generation;
- deterministic simulation;
- game physics;
- game audio and adaptive music;
- visual effects and game feel;
- livestream HUD and broadcast composition;
- viewer retention and pacing;
- chat, vote, gift, and event integrations;
- game economy and rewards;
- difficulty and failure balancing;
- long-running reliability;
- performance and memory optimization;
- crowd interaction and moderation;
- telemetry and experimentation;
- simulation QA and soak testing;
- production-readiness review.

Each skill uses trigger-focused frontmatter, concrete invariants, an operating workflow, review gates, failure modes, and verifiable outputs.

## 6. Game Documentation Contract

Every `games/<slug>/` directory must include:

- `README.md`: identity, premise, commands, module boundaries, status.
- `PRD.md`: audience, outcomes, requirements, metrics, risks, launch acceptance.
- `GAME_DESIGN.md`: rules, loops, progression, content, difficulty, endings and restart.
- `AI_SYSTEM.md`: observations, actions, policies, planning, fallbacks, explainability.
- `VIEWER_INTERACTION.md`: votes, gift mappings, safety, fairness, cooldowns, moderation.
- `AUDIO_VISUAL.md`: art direction, HUD, animation, VFX, music, SFX, accessibility.
- `TECHNICAL_ARCHITECTURE.md`: package boundaries, schemas, APIs, performance budgets.
- `TESTING_STRATEGY.md`: unit, property, deterministic replay, simulation, soak and chaos tests.
- `PRODUCTION_READINESS.md`: SLOs, observability, recovery, security, launch checklist.
- `phases/PHASE-01.md` through the final phase: executable, testable delivery increments.

## 7. Cross-Game Platform Capabilities

### 7.1 Simulation

- Fixed-step deterministic execution with configurable real-time presentation speed.
- Named random streams so content generation, AI, rewards, and audience events remain replayable.
- Serializable snapshots, append-only event logs, run IDs, seeds, checksums, and schema versions.
- Headless execution at accelerated speed for balancing and regression testing.

### 7.2 Autonomous agents

- Layered decision system: hard safety constraints, tactical policy, strategic planner, stuck detector, and fallback policy.
- Strict per-tick decision budgets.
- Visible intent summaries suitable for stream overlays without exposing private model reasoning.
- Model-backed decisions are optional, asynchronous, cached, bounded, and never required for simulation continuity.

### 7.3 Audience influence

- Provider adapters for YouTube and Twitch feed a normalized event envelope.
- Free interactions and paid interactions share the same safety and fairness policy.
- Paid events buy an eligible disclosed effect or voting weight, never a guaranteed victory, loss, prize, or cash-equivalent return.
- Per-user, per-event, per-game, and global rate limits.
- Moderation queues, deny lists, regional configuration, audit logs, replay-safe idempotency keys, and refund/reversal handling.

### 7.4 Engagement director

- Tracks pacing signals: time since meaningful event, danger, progress, novelty, run age, repeated failures, audience activity, and visual density.
- Selects from authored eligible events using transparent weights and cooldowns.
- Cannot falsify physics, secretly change declared probabilities, or force winners.
- Supports quiet periods and escalation waves to prevent constant sensory overload.

### 7.5 Broadcast presentation

- 16:9 primary composition, safe zones for captions and mobile crops, browser-source overlay support, and clean-feed mode.
- Permanent goal/progress indicator, current run status, record, recent audience effect, and next interaction timer.
- Automatic camera direction, replay moments, slow motion, celebration, failure stingers, and intermission cards.
- Color-blind-safe states, subtitle-ready callouts, reduced-flash mode, loudness normalization, and readable typography.

### 7.6 Reliability

- Automatic restart from latest valid snapshot.
- Provider degradation modes: game continues when chat, payments, telemetry, audio, or persistence are temporarily unavailable.
- Memory, CPU, GPU, event-loop lag, tick-time, queue depth, snapshot age, crash-loop, and stream-output alarms.
- Minimum 72-hour pre-production soak; seven-day canary before unattended 24/7 promotion.

## 8. Quality Gates

A game cannot be labelled production-ready until it demonstrates:

- deterministic replay for identical version, config, seed, and event log;
- no unrecoverable stall during accelerated simulation campaigns;
- bounded memory over the required soak period;
- automated recovery from process crash and provider outage;
- accessible, legible stream composition at common mobile viewing sizes;
- complete moderation and paid-event audit trail;
- calibrated win/loss and run-duration distributions based on simulation evidence;
- at least three distinct dramatic patterns, not one repeated optimal path;
- no placeholder assets or silent critical errors;
- documented rollback and incident response;
- passing security, privacy, performance, gameplay, and broadcast review.

## 9. Delivery Strategy

The platform is built in vertical slices rather than completing all shared infrastructure before a playable game exists.

- Foundation: contracts, simulation kernel, deterministic replay, event envelope, observability baseline.
- Reference game: Autonomous Snake proves the full loop from simulation to unattended broadcast.
- Shared interaction: voting, gift effects, moderation, idempotency, operator controls.
- Catalogue waves: simpler games first, then games requiring rich agents and persistent worlds.
- Hardening: soak, chaos, load, accessibility, incident drills, content diversity, platform compliance.

Each phase must end in a running, testable increment and a recorded evidence bundle. Incomplete phases stay marked in progress ledgers and cannot be silently declared complete.

## 10. Initial Recommended Technology Direction

- TypeScript monorepo using `pnpm` and Turborepo.
- React and PixiJS for 2D game presentation and overlays.
- Node.js worker processes for deterministic simulations; Web Workers where browser-local execution is useful.
- Rapier for games needing continuous physics; grid/custom deterministic solvers for Snake, Maze, Traffic, Civilization, and Ant Colony.
- PostgreSQL for durable run and audience records; Redis-compatible queues only where operationally justified.
- OpenTelemetry-compatible structured telemetry.
- Vitest for unit/property tests, Playwright for operator and broadcast UI, and dedicated accelerated simulation runners for statistical tests.
- FFmpeg/OBS-compatible browser sources and output health probes.

Technology choices remain behind package interfaces so a game can replace a renderer or solver without rewriting audience, analytics, persistence, or operator systems.

## 11. Self-Review Result

- Placeholder scan: no unresolved `TBD` or `TODO` requirements.
- Internal consistency: twelve initial games are explicitly separated from the later World Conquest expansion.
- Scope: decomposed into platform foundation, specialist skills, one documentation package per game, and independently executable phase plans.
- Ambiguity: gifts and paid interactions are bounded, disclosed influence rather than guaranteed outcomes.
- Approval: user authorized automatic selection of the best approach and continuous execution; this specification is therefore approved for planning.
