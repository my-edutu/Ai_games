# Autonomous Snake — AI System

**Status:** Approved design  
**AI role:** Control one snake continuously under deterministic bounded decision budgets.

## Objectives

The AI optimizes a lexicographic/weighted set of goals whose order is mode-configured but cannot violate legality:

1. avoid immediate terminal collision;
2. preserve a viable future movement region and access to the tail;
3. advance the current objective/food;
4. improve occupancy, milestone, score, and record potential;
5. manage hazards, special effects, and audience complications;
6. avoid repeated-state/no-progress loops;
7. choose strategies with sufficient variety without sacrificing declared safety targets.

The AI is not required to be perfect. Its errors must be causal, reproducible, and consistent with its observations and budgets.

## Observation Schema

Each decision receives a serializable snapshot containing:

- tick and movement step;
- head, ordered body, direction, pending growth;
- board dimensions/playable mask;
- solid obstacles and authoritative hazards with states/timers;
- food/objectives, portal state, and visible effect fields;
- current length, occupancy, progression band, milestone, score, record comparison;
- remaining mode timers and current modifiers;
- recent actions/events needed for loop detection;
- decision budget and policy version;
- named random stream reference for intentional tie variation.

The AI does not receive future food spawns, future random events, raw audience/provider data, hidden event-director candidates, or presentation-only information.

## Action Schema

```ts
interface SnakeAction {
  type: 'move';
  direction: 'north' | 'east' | 'south' | 'west';
  decisionStep: number;
  policyVersion: string;
  intentKey: SnakeIntentKey;
  confidenceBand: 'low' | 'medium' | 'high';
}
```

The simulation validates direct reversal, current legality, stale decision step, and effect-specific restrictions. Invalid/stale actions fail atomically and trigger fallback where timing permits.

## Policy Stack

### Layer 1 — Legal Move Filter

For each cardinal candidate:

- reject direct neck reversal;
- project next head through portal/edge rules;
- reject non-playable/solid/lethal cells;
- apply the configured tail-vacate and growth rule;
- detect immediate hazard timing;
- record terminal reason for rejected candidates.

If no legal candidate exists, the run resolves as a legitimate trap only after the simulation independently confirms the state.

### Layer 2 — Immediate Safety

For each legal move estimate:

- reachable free-space size after movement;
- whether head can still reach the future tail or a safe cycle;
- articulation/bottleneck and region-partition risk;
- distance from walls/body/hazards adjusted by progression band;
- number and quality of next-step legal options;
- hazard arrival/expiry timing;
- effect/portal consequences.

Moves below hard survivability constraints are eliminated unless every legal move fails, in which case choose the best bounded survival option.

### Layer 3 — Objective Pathing

Candidate food/objective routes use bounded graph search over time-aware occupancy. The initial implementation supports:

- BFS/A* shortest path on grid;
- tail-motion approximation;
- portal/hazard costs;
- special-food reward/risk;
- path validation through simulated prefix or incremental safety checks;
- expansion/time cap.

A shortest route is accepted only when its projected terminal region and tail access meet policy thresholds.

### Layer 4 — Space-Preservation Strategy

When direct food routes are unsafe, choose among:

- follow-tail path;
- maximize reachable region;
- preserve known cycle edge;
- delay food while hazard/effect changes;
- route toward a safe opening/objective anchor.

At high occupancy, switch to a Hamiltonian-cycle or cycle-like strategy when the board profile supports one. Shortcuts are allowed only when they preserve cycle order and safe re-entry.

### Layer 5 — Strategic Mode

Strategic state selects `seek-food`, `preserve-space`, `follow-tail`, `cycle-fill`, `escape-hazard`, or `fallback-survival`. Transitions use hysteresis and triggers: occupancy band, food-route safety, tail-route availability, hazard/event change, repeated state, planning timeout, milestone, or cycle validity.

## Scoring Model

A configurable deterministic candidate score may combine:

- terminal legality (hard);
- future reachable-space ratio;
- tail reachability/cycle validity;
- legal-option count;
- partition/bottleneck penalty;
- hazard risk;
- objective path value and expiry;
- milestone/record value;
- path efficiency;
- repeated-state penalty;
- strategy consistency;
- bounded intentional diversity term from `agent-policy` stream.

Weights and hard thresholds are versioned by mode/progression band. Hard safety constraints cannot be outweighed by score.

## Decision Budgets

Initial target configuration:

- one decision per authoritative movement step;
- cheap legal/safety analysis for all candidates;
- objective search with explicit node and wall-clock/profile budget;
- optional deeper lookahead only when occupancy/risk and host budget justify it;
- global decision p99 below the game’s share of the authoritative tick budget;
- no network or remote model call;
- all caches bounded to current board/run and invalidated deterministically.

Exact thresholds are established by Phase 2 profiling and become configuration plus tests.

## Stuck and Loop Detection

Track bounded hashes/features for head, direction, body or compressed occupancy, objective, strategic mode, and meaningful progress. Detect:

- repeated cycle without objective progress outside intended cycle-fill;
- alternating actions/states;
- repeated failed path replans;
- objective unreachable under current model;
- excessive tail-follow duration;
- fallback storm;
- decision budget violations.

Recovery sequence:

1. invalidate current route;
2. expand candidate strategy set within budget;
3. switch objective/food candidate if valid;
4. prefer safe space/cycle strategy;
5. use deterministic emergency move;
6. if authoritative state has no valid objective due to content defect, invoke game repair/quarantine—not teleport the snake.

## Fallback Policy

Fallback is local, deterministic, and always available:

1. legal move with largest immediate reachable-space score;
2. prefer tail reachability;
3. prefer more next legal options;
4. avoid hazards and recent repeated direction pattern;
5. stable direction order plus named-stream tie variation.

A timeout or exception produces telemetry and public `fallback-survival` intent; it cannot freeze the run.

## Public Intent

Approved intent keys:

- `seeking-food`;
- `taking-safe-detour`;
- `preserving-tail-route`;
- `avoiding-trap`;
- `escaping-hazard`;
- `following-cycle`;
- `replanning-after-chat-event`;
- `fallback-survival`;
- `record-push`.

The overlay updates on meaningful strategy change or bounded cadence. It may show confidence and obstacle key but not search trees, raw scores, private reasoning, or unsupported certainty.

## Optional Future Model Use

Remote models are unnecessary for movement and excluded from the reference release. A later approved feature may generate public commentary or propose high-level mode/theme strategy outside the tick. It must be privacy-safe, schema-bounded, stale-aware, cost/rate-limited, recorded where authoritative, and fully optional.

## Evaluation Corpus

Seed strata include:

- open boards at low/medium/high occupancy;
- corridors, chambers, rings, portals, and bottlenecks;
- moving/timed hazards;
- standard/special food placement bands;
- near-complete boards;
- trap configurations with one safe move;
- tail-vacate edge cases;
- event sequences with obstacle/fog/speed/shield;
- no-audience and maximum allowed Chat vs AI pressure;
- restore at ordinary and high-risk ticks;
- known regression seeds.

## Metrics

- legal/stale/invalid action rate;
- decision p50/p95/p99/max and node expansions;
- reachable-space/tail-access at death;
- occupancy, duration, food, milestones, record rate;
- failure reason by board feature and strategy;
- fallback, timeout, stuck, oscillation, and recovery;
- strategy time share and transition rate;
- path efficiency versus survivability;
- seed/route/dramatic-pattern diversity;
- checksum repeatability.

## Acceptance

The AI passes Phase 2 when it completes the benchmark corpus within decision budgets, all actions are legal/replayable, full runs require no remote service, stuck and timeout conditions recover or resolve safely, target progress/failure distributions are statistically supported, high-occupancy behaviour uses valid long-horizon strategy, and public intents accurately describe state transitions without exposing hidden reasoning.
