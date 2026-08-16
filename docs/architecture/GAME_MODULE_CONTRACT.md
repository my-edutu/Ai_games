# Game Module Contract

## Purpose

Define the mandatory boundary between the shared autonomous livestream platform and each game. A conforming game is deterministic under replay, headless-testable, provider-neutral, presentation-separated, and self-describing.

## Package Shape

A game package exports one `GameModule<State, Config, Action, Observation, RenderSnapshot>` object. The concrete TypeScript contract will preserve the semantics below.

```ts
export interface GameModule<S, C, A, O, R> {
  readonly manifest: GameManifest;
  readonly configSchema: VersionedSchema<C>;
  createInitialState(context: RunInitContext<C>): S;
  getLifecycle(state: Readonly<S>): GameLifecycle;
  buildObservation(state: Readonly<S>, agentId: AgentId): O;
  chooseFallbackAction(observation: Readonly<O>, context: DecisionContext): A;
  validateAction(state: Readonly<S>, agentId: AgentId, action: Readonly<A>): ActionValidation;
  step(state: Readonly<S>, input: TickInput<A>): TickResult<S>;
  getSignals(state: Readonly<S>): GameSignals;
  getInfluenceCatalogue(config: Readonly<C>): readonly InfluenceDefinition[];
  evaluateInfluence(state: Readonly<S>, request: Readonly<InfluenceRequest>): InfluenceEligibility;
  toRenderSnapshot(state: Readonly<S>, context: RenderContext): R;
  serializeSnapshot(state: Readonly<S>): SerializedGameState;
  restoreSnapshot(snapshot: SerializedGameState, context: RestoreContext): S;
  summarizeResult(state: Readonly<S>, context: ResultContext): RunResult;
  validateState(state: Readonly<S>): StateValidation;
}
```

The implementation may divide systems across focused files. This public interface remains the only shared-platform entrypoint.

## Manifest

`GameManifest` declares:

- stable game ID and human-readable title;
- semantic game version;
- supported configuration and snapshot schema versions;
- target authoritative tick rate and render rates;
- supported aspect ratios and clean-feed capability;
- agent types and maximum populations;
- deterministic algorithm version;
- required and optional shared capabilities;
- supported audience influence classes;
- accessibility features;
- minimum production evidence profile;
- content-pack compatibility rules.

Changing a value that affects authoritative results requires a game-version or deterministic-algorithm-version change.

## Lifecycle

All games use the shared lifecycle:

- `initializing` — validates configuration and generates initial content;
- `countdown` — presents the goal and run identity before authoritative play;
- `running` — normal authoritative ticks;
- `paused` — tick does not advance; only eligible lifecycle commands apply;
- `resolving` — freezes new influence and completes terminal effects, scoring, and records;
- `intermission` — presents result, replay moments, records, and next-run countdown;
- `terminated` — immutable final state for the run;
- `quarantined` — integrity failure prevents truthful continuation.

A game cannot invent lifecycle names that the supervisor cannot interpret. Game-specific phases live inside `running` state.

## Run Initialization

`RunInitContext` contains:

- run ID;
- game and deployment versions;
- validated configuration;
- run seed and named random-stream factory;
- scheduled content-pack versions;
- prior records allowed for comparison;
- start tick and logical start time;
- feature flags that were resolved before the run;
- privacy-safe channel context.

Initialization must return identical state for identical inputs. It cannot read wall-clock time, network state, global randomness, local filesystem state, or provider payloads.

## Tick Input and Result

`TickInput` includes:

- authoritative tick number;
- fixed delta represented as an integer or exact rational unit;
- ordered validated agent actions;
- ordered scheduled system and influence commands;
- named random streams scoped to the tick;
- deterministic configuration view.

`TickResult` includes:

- next immutable authoritative state;
- ordered semantic gameplay events;
- accepted and rejected action results;
- progression/record updates;
- requested lifecycle transition;
- optional snapshot recommendation;
- invariant violations;
- deterministic checksum material.

The module cannot perform persistence, analytics network calls, provider acknowledgements, audio playback, rendering, or arbitrary logging inside `step`.

## Actions and Observations

Observations contain only information the agent is permitted to know. Hidden information stays absent rather than being marked hidden. Observations must be serializable so decision bugs can be reproduced.

Every action has:

- stable action type;
- actor ID;
- decision tick;
- schema version;
- action-specific payload;
- optional public intent summary ID.

Validation is pure and distinguishes malformed, unauthorized, illegal-now, stale, conflicting, and accepted actions. Rejected actions do not partially mutate state.

## State Rules

Authoritative state must:

- be serializable without executable closures or provider objects;
- use stable entity IDs;
- avoid unordered iteration where order can change outcomes;
- represent time in ticks or exact logical units;
- route all randomness through named streams;
- remain valid under `validateState` at configured invariant checkpoints;
- bound collections or declare compaction/retention rules;
- preserve sufficient history for rules while moving analytics history to events/projections.

Floating-point use is permitted only where deterministic behaviour has been verified on supported runtimes or where quantization/fixed-point reconciliation makes results stable.

## Game Signals

Every game emits normalized signals in `[0, 1]` where applicable:

- progress toward the run’s primary visible objective;
- immediate danger;
- tension;
- novelty;
- visual density;
- recent meaningful-event intensity;
- agent confidence or plan stability;
- recovery/stuck risk;
- estimated remaining run band;
- celebration and failure severity.

Signals guide presentation and eligible event selection. They cannot directly rewrite outcomes.

## Influence Catalogue

Every effect definition states:

- stable effect ID and display name;
- free, paid-eligible, operator-only, or scheduled source classes;
- authoritative, choice/vote, cosmetic, informational, or presentation-only effect class;
- disclosed outcome bounds;
- configuration parameters and validation;
- game-state eligibility predicate;
- cooldown, conflict group, queue policy, and per-run cap;
- danger/progress/novelty budgets;
- acknowledgement and rejection copy keys;
- reversal/refund behaviour;
- replay representation;
- accessibility and content-safety notes;
- tests required before enablement.

No effect can guarantee a winner, force a paid loss, award cash-equivalent returns, bypass moderation, or use hidden undeclared probability changes.

## Render Snapshot

The render adapter returns an immutable, privacy-safe snapshot containing only information needed for scene composition:

- entities with stable visual IDs and transform/state data;
- camera targets and framing hints;
- goal, progress, danger, run, record, and countdown data;
- semantic animation, VFX, audio, and replay cues;
- public agent intent summaries;
- recent audience acknowledgements after display-name sanitization;
- accessibility variants and caption keys;
- interpolation data between authoritative ticks.

Render code may interpolate, animate, and choose cameras. It may not create authoritative collisions, score, rewards, deaths, or records.

## Snapshot Compatibility

Serialized state includes game ID, game version, schema version, deterministic algorithm version, run ID, seed metadata, tick, checksum, and payload.

Each supported migration is pure, versioned, tested with fixtures, and either:

- produces state that replays identically from the migration boundary; or
- declares a fresh-run boundary and refuses mid-run restoration.

Unsupported or invalid snapshots return a typed error; they are never coerced silently.

## Result Contract

`RunResult` includes:

- terminal reason and lifecycle status;
- win/loss/draw/aborted/quarantined classification;
- primary and secondary scores;
- progress achieved;
- run duration in ticks and presentation time;
- records set or tied;
- notable event references;
- audience contribution summary without sensitive data;
- next-run configuration hints constrained by balancing policy;
- integrity status and final checksum.

## Error Classes

- `ConfigurationError` — invalid versioned configuration; do not start run.
- `ContentGenerationError` — generator failed bounded validation attempts; use a safe seed/content fallback or abort initialization.
- `InvariantViolation` — authoritative truth may be compromised; snapshot evidence and quarantine or recover.
- `UnsupportedSnapshotError` — restore cannot proceed safely; try an older compatible snapshot or start fresh.
- `DecisionBudgetExceeded` — use deterministic fallback action and emit operational event.
- `InfluencePolicyError` — reject effect and preserve audit trail.
- `PresentationAdapterError` — simulation continues; restart/degrade presentation.

Errors must include stable machine codes and privacy-safe structured context.

## Headless Capability

Every game exports a runner able to:

- execute a requested number of runs or ticks without renderer/audio/providers;
- set seed ranges and configuration variants;
- inject normalized scheduled events;
- collect results, invariant failures, performance, and distribution metrics;
- verify replay checksums;
- stop on configured critical failures;
- produce a machine-readable evidence report.

## Required Tests

A conforming module has:

- configuration and schema tests;
- initial-state determinism tests;
- action validation and rule unit tests;
- state invariant property tests;
- named random-stream isolation tests;
- identical-input replay checksum tests;
- snapshot round-trip and migration tests;
- influence eligibility, cooldown, conflict, cap, reversal, and idempotency tests;
- render-snapshot privacy and immutability tests;
- headless campaign tests;
- lifecycle and terminal-result tests;
- performance and bounded-state tests.

## Acceptance Checklist

A module is contract-complete when:

- it implements every required interface with versioned schemas;
- identical initialization and tick inputs produce identical results;
- all authoritative randomness is named and recorded;
- invalid actions and effects fail atomically with typed reasons;
- presentation and provider code are absent from authoritative systems;
- state serializes, validates, restores, and replays;
- the game continues under optional-service failure using declared fallbacks;
- headless campaigns produce usable balance and reliability evidence;
- the game documentation identifies every exception to catalogue defaults;
- contract tests pass in CI.
