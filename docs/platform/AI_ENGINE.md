# Shared Autonomous AI Engine

## Mission

Provide bounded, observable, replay-compatible decision services for all autonomous catalogue agents. The engine coordinates legality, tactical policies, strategic planners, stuck detection, fallback, scheduling, and optional model-assisted proposals without becoming the authority for gameplay state.

## Architecture

```text
Authoritative State
  → Game Observation Adapter
  → Decision Scheduler
  → Constraint/Legality Layer
  → Reflex/Tactical Policy
  → Strategic Planner
  → Optional Model Proposal Adapter
  → Candidate Evaluator and Stable Tie-Break
  → Validated Action Envelope
  → Simulation Engine
```

The game module defines observations, actions, hard constraints, and success signals. The shared AI engine provides policy interfaces, scheduler, budgets, instrumentation, replay inputs, and failure handling.

## Agent Contract

Every agent type declares:

- stable agent type and entity ID;
- observation schema/version;
- action schema/version;
- hidden-information policy;
- decision cadence and triggers;
- hard legality/safety constraints;
- tactical and strategic policy IDs/versions;
- decision time/search/memory/token/cost budgets;
- plan/goal state schema;
- fallback action policy;
- stuck/loop detector configuration;
- public intent-summary template keys;
- benchmark/evidence profile.

## Decision Scheduler

The scheduler prevents population spikes from breaking ticks. It uses stable priority and fairness rules based on urgency, decision deadline, agent role, last decision tick, and stable agent ID. It enforces:

- maximum decisions per tick and per wall-clock interval;
- per-agent and global CPU/search expansion budget;
- pathfinding/request concurrency;
- remote proposal concurrency/rate/cost;
- stale work cancellation;
- deterministic reduction and tie-breaking;
- degraded scheduling under resource pressure.

Critical reflexes may run every tick if bounded. Strategic planning normally runs on meaningful invalidation triggers or budgeted intervals.

## Policy Layers

### Hard Constraints

Pure checks remove illegal, unsafe, unauthorized, or impossible actions. No learned, strategic, model, or audience influence may bypass them.

### Reflex Policy

Handles imminent collision, lethal hazard, invalid plan, required stop, emergency evasion, or mandatory rule response with small bounded logic.

### Tactical Policy

Uses game-appropriate behaviour trees, utility scoring, flow fields, short path search, local simulation, steering, or finite-state logic.

### Strategic Planner

Selects goals, routes, resource allocation, alliances, build plans, encounter approach, or long-horizon intentions. It produces a plan with age, confidence, prerequisites, next action, and invalidation reasons.

### Optional Model Proposal

Used only for language/puzzle hypothesis or broad strategy tasks where deterministic methods are insufficient. It proposes; it never mutates state or bypasses validation.

### Fallback

A deterministic bounded policy guarantees continuity when any advanced layer times out, returns invalid output, loses connectivity, exceeds cost, or is disabled.

## Observation Rules

Observations are immutable serializable values derived by the game module. They include only permitted information and may represent uncertainty explicitly. They never expose:

- hidden opponent/world data outside game rules;
- provider identities/payment details;
- operator secrets/debug state;
- presentation-only particle/camera data;
- future random outcomes;
- raw model or chat content unless the game explicitly requires sanitized approved text.

Observation construction has a budget and may use spatial queries/caches that are deterministic and versioned.

## Action Rules

Actions contain agent ID, decision tick, action type/version, payload, policy version, and optional public intent key. The simulation validates legality against current state; stale actions fail atomically. Actions do not contain executable callbacks or provider/model objects.

When multiple agents conflict, the game’s deterministic rule—not scheduler completion order—resolves the result.

## Planning and Replanning

A plan records:

- goal and target;
- assumptions and prerequisites;
- route/subgoals;
- expected progress;
- confidence band;
- creation/last-validated tick;
- invalidation predicates;
- fallback/escape action.

Replan triggers include invalid target, blocked route, large environment change, resource threshold, plan timeout, audience event, milestone, stuck signal, or strategic cadence. Hysteresis prevents oscillation.

## Stuck and Pathology Detection

Detectors monitor bounded windows for:

- no meaningful progress;
- repeated states or action cycles;
- two-state oscillation;
- repeated failed path/action;
- unreachable goal;
- excessive replan rate;
- deadlock/resource starvation;
- planner timeout/fallback storm;
- herd synchronization or congestion;
- exploit loop that inflates score/resources without progress.

Recovery escalates from local alternate action, short retreat, goal reconsideration, route reset, deterministic safe reposition only if game rules explicitly permit it, plan abandonment, and finally terminal/phase-specific anti-stall policy. Recovery is recorded and never hidden as ordinary success.

## Model-Assisted Boundary

A model request includes minimized versioned context, task schema, deadline, cost/token cap, privacy classification, and correlation ID. The adapter provides:

- provider/model/version abstraction;
- circuit breaker, timeout, cancellation, concurrency, and rate limit;
- structured response parsing;
- prompt-injection and unsafe-content handling;
- legal-action/current-state validation;
- stale response rejection;
- optional privacy-safe cache;
- external proposal event recording when authority uses the result;
- deterministic candidate selection/tie-break;
- no raw chain-of-thought storage or display.

Model absence for an entire run must be a tested scenario.

## Visible Intent

The engine emits a bounded `PublicIntentSummary`:

```ts
interface PublicIntentSummary {
  agentId: string;
  tick: number;
  goalKey: string;
  intentKey: string;
  obstacleKey?: string;
  confidenceBand: 'low' | 'medium' | 'high';
  mode: 'normal' | 'replanning' | 'fallback' | 'recovering';
  changeReasonKey?: string;
}
```

Copy is rendered from approved game templates and public parameters. Cadence is limited so the overlay explains meaningful changes rather than every thought.

## Shared Policy Interfaces

The platform provides interfaces for:

- behaviour trees/state machines;
- utility functions and stable candidate ranking;
- grid/navigation graph/A* with expansion limits;
- flow fields for large populations;
- hierarchical planning;
- local forward simulation with rollout limits;
- steering/avoidance;
- goal/blackboard memory;
- model proposal adapters;
- benchmark runners and trace visualization.

Games choose only what they need. Policies are composed behind the agent contract rather than inheriting one universal “AI brain.”

## Telemetry

Record bounded aggregate signals:

- decision count and latency percentiles;
- search expansions/path length/replan count;
- legal/invalid/stale action rate;
- policy/fallback/model use;
- timeout/budget/circuit-breaker events;
- stuck type, detection delay, recovery outcome;
- goal completion/progress/strategy diversity;
- remote token/cost/cache/availability where used;
- scheduler backlog and fairness;
- public intent update count.

Decision traces for debugging are sampled, privacy-safe, seed/replay-linked, and retained according to policy—not emitted as unbounded metrics.

## Testing

Each game supplies:

- ordinary and adversarial observation/action fixtures;
- legality and hidden-information tests;
- deterministic action/tie-break fixtures;
- deadline/budget/fallback tests;
- stale/invalid/model-malformed tests;
- stuck/oscillation/deadlock/recovery seeds;
- maximum-population scheduler benchmarks;
- strategy diversity and outcome distributions;
- provider/model outage full-run campaigns;
- public intent safety/accuracy tests;
- replay comparison of decisions and results.

## Acceptance

The engine is ready for a game when:

- the game implements observation/action/constraint/fallback contracts;
- peak scheduling meets tick budgets;
- remote services can remain disabled for full runs;
- every selected action is validated and replay-represented;
- stuck and budget failures recover within defined limits;
- no hidden/private data leaks into observations or intent;
- benchmark campaigns provide measurable capability and pathology evidence;
- identical recorded proposals and inputs reproduce selected authoritative actions.
