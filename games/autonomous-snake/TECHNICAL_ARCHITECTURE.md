# Autonomous Snake — Technical Architecture

**Status:** Approved design  
**Target stack:** TypeScript, shared Node.js simulation worker, PixiJS presentation adapter, Vitest/property tests, Playwright broadcast UI, PostgreSQL-backed run/event records, OpenTelemetry-compatible telemetry.

## Module Boundaries

```text
games/autonomous-snake/src/
├── index.ts                 # GameModule export only
├── manifest.ts              # Versions, budgets, capabilities
├── config/schema.ts         # Versioned configuration
├── state/types.ts           # Serializable authoritative state
├── rules/                   # Pure ordered rule systems
├── ai/                      # Observations, policies, pathfinding, fallback
├── generation/              # Board/food/hazard generation and validators
├── influence/               # Effect catalogue and eligibility predicates
├── presentation/            # Render snapshot and semantic cue adapters
├── persistence/             # Game snapshot codecs and migrations
└── testing/                 # Headless runner profiles, fixtures, seed corpora
```

The package depends only on public shared contracts. Provider SDKs, database clients, OBS control, React application state, audio playback, and operator-dashboard code are forbidden imports.

## Authoritative State

```ts
interface SnakeState {
  schemaVersion: number;
  runId: string;
  tick: number;
  movementStep: number;
  lifecycle: GameLifecycle;
  board: BoardState;
  snake: SnakeBodyState;
  objectives: ObjectiveState;
  hazards: HazardState[];
  portals: PortalState[];
  modifiers: TimedModifier[];
  progression: ProgressionState;
  ai: SnakeAgentState;
  influence: InfluenceRuntimeState;
  result?: SnakeRunResult;
}
```

Coordinates, durations, scores, sequence values, and occupancy counts use integers. Entity and effect collections have deterministic order. Presentation handles, callbacks, current time, provider identities, raw text, promises, and global randomness are excluded.

## Board Representation

The board uses a dense cell-index model for predictable performance:

- `cellIndex = y * width + x`;
- bitsets or typed arrays for playable, obstacle, hazard, food, and occupancy queries;
- ordered body deque plus occupancy map;
- precomputed neighbor table per topology/profile;
- portal mapping and time-aware hazard state;
- incremental free-cell and occupancy counters.

Board dimensions and eligible cells are configuration-bounded. Large variants must pass memory, pathfinding, rendering, and mobile-readability budgets.

## Authoritative Step Order

1. validate lifecycle and scheduled commands;
2. start/expire timed modifiers at the declared step boundary;
3. build observation and obtain a bounded AI action or fallback;
4. validate reversal, transformed destination, and current legality;
5. classify collision using tail-vacate and growth rules;
6. commit head/body movement atomically;
7. resolve food, objective, hazard, portal, and modifier consequences;
8. update score, length, occupancy, milestone, record candidate, and terminal state;
9. generate/repair the next required objective;
10. emit semantic events, normalized signals, and checksum material.

No asynchronous callback can commit between these systems.

## Random Streams

- `world-generation`: board topology and fixed content;
- `objective-spawn`: food/objective candidates;
- `hazard-schedule`: authored hazard variations;
- `agent-policy`: intentional strategy/tie diversity;
- `event-director`: optional events;
- `audience-tiebreaks`: vote ties;
- `cosmetic-variation`: non-authoritative presentation/audio only.

Each stream has a recorded algorithm/version. Adding a cosmetic draw cannot perturb food or AI decisions.

## AI Algorithms

Phase 2 implements focused components behind stable interfaces:

- legal move evaluator;
- flood-fill/reachable-space estimator;
- tail-reachability test;
- articulation/bottleneck risk estimator;
- bounded BFS/A* objective planner;
- cycle/Hamiltonian strategy for compatible profiles;
- candidate scorer with versioned weights and hard constraints;
- state/action loop detector;
- deterministic fallback.

Search work is capped by node/decision budgets. Caches are scoped to the run or board version and invalidated deterministically.

## Procedural Content

Board generation pipeline:

1. select versioned profile/theme;
2. construct playable connected topology;
3. add fixed obstacles, portals, and hazard anchors;
4. validate connectivity, safe start, required clearances, capacity, and profile features;
5. repair deterministically within bounded attempts;
6. extract difficulty/diversity features;
7. fall back to a known-good profile while preserving the original run/diagnostic identity.

Food/objective placement derives candidates from current state, excludes illegal cells, applies reachability and risk policy, ranks deterministically, and records repair/fallback. It never secretly changes the run seed.

## Influence Boundary

The game exports effect definitions and pure eligibility predicates. Accepted requests arrive only as normalized scheduled commands. Placement effects receive prevalidated candidate IDs or deterministic parameters—not arbitrary coordinates from chat/provider data. The reducer records application once by idempotency key and emits an auditable effect result.

## Render Snapshot

The adapter exposes privacy-safe immutable data:

- board dimensions, theme, cell semantic layers;
- snake segment IDs/order/coordinates/direction/interpolation anchors;
- food, hazards, portals, modifier telegraphs;
- progress, length, occupancy, milestone, record, lifecycle and result;
- public AI intent/confidence/mode;
- approved audience acknowledgement state;
- semantic VFX/audio/replay cues and camera hints;
- accessibility/quality variants.

Rendering may interpolate and animate; it cannot change rule coordinates or timers.

## Snapshot and Replay

Snake snapshots store all authoritative state, random stream states, config/content hashes, tick/sequence, deterministic version, checksum, and durability boundary. Migration is pure and fixture-tested. Unsupported rule or board-profile changes declare a fresh-run boundary.

Replay consumes the initial snapshot/run metadata plus ordered commands/events. Hierarchical checksums cover board, body, objectives, hazards/modifiers, progression, AI strategic state, influence state, and result.

## Error and Degradation Model

- invalid config/board generation: fail initialization or use declared safe profile;
- AI timeout/exception: deterministic fallback, telemetry, public fallback intent;
- impossible objective caused by content defect: repair at a safe boundary or quarantine; never count as starvation loss;
- presentation/audio/provider/telemetry outage: authoritative run continues;
- persistence pressure: bounded buffering; paid-eligible effects may reject/defer;
- invariant/replay divergence: stop and quarantine affected run;
- repeated process crash: breaker, safe intermission, verified restore or fresh run.

## Performance Budgets

Exact thresholds are locked by Phase 1/2 profiling. Required dimensions:

- tick p50/p95/p99/max;
- AI search nodes/time and fallback rate;
- objective-generation time/fallback;
- board/body memory and snapshot size/duration;
- event, command, persistence, and telemetry queues;
- render CPU/GPU frame time, cells/segments/effects, draw calls, texture memory;
- audio voices/buffers;
- headless runs per second;
- 72-hour memory/resource slope.

## Security and Privacy

All configuration/content is schema-validated and versioned. Public data contains no provider IDs, payment data, raw chat, prompts, secrets, stack traces, or host details. Operator actions are typed and audited. Content packs cannot execute arbitrary code. Dependencies and assets are pinned/scanned/licensed.

## Architecture Acceptance

Implementation can exit Phase 1 only when a headless module initializes, moves, eats, grows, collides, resolves, restarts, snapshots, restores, and replays deterministically through shared contracts. Later phases cannot duplicate authoritative rules in renderer, provider, analytics, or fast-simulation code.
