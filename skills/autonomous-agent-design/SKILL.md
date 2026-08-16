---
name: autonomous-agent-design
description: Use when creating or reviewing autonomous game agents, NPC intelligence, planners, behaviour trees, utility systems, pathfinding, model-assisted decisions, visible intent, fallbacks, or stuck detection
---

# Autonomous Agent Design

## Overview

Build agents that appear purposeful because they perceive valid game state, choose legal actions under bounded budgets, adapt to uncertainty, and fail intelligibly. The core principle is **layered bounded autonomy with deterministic continuity**.

## Scope

Use for the player AI, enemies, citizens, armies, traffic, colony agents, puzzle solvers, and high-level directors whose decisions affect gameplay. This skill does not define the game’s fantasy or secretly tune outcomes; it consumes rules and balance targets.

## Non-Negotiable Invariants

- Observations contain only information the agent is allowed to know.
- Hard legality and safety constraints dominate every policy or model proposal.
- Decisions have explicit tick, time, memory, expansion, token, and cost budgets.
- Every advanced policy has a deterministic fallback that can continue the run.
- Remote inference never blocks authoritative continuity.
- Agent actions are schema-validated, replay-represented inputs; policies do not mutate state directly.
- Stuck, oscillation, repeated-loop, no-progress, and pathological exploitation are detectable.
- Public intent summaries are concise validated explanations, not hidden chain-of-thought.
- Evaluation uses distributions and adversarial seeds, not a few showcase runs.

## Workflow

### 1. Define the agent contract

For each agent type document:

- responsibility and success criteria;
- observations, hidden information, and uncertainty representation;
- action catalogue, preconditions, costs, and durations;
- decision frequency and planning horizon;
- hard constraints and forbidden actions;
- local memory, shared knowledge, and retention;
- terminal, disabled, and recovery states.

Build observations as serializable snapshots so every decision can be reproduced.

### 2. Choose the simplest sufficient policy stack

Use layers in this order:

1. legality/safety filter;
2. reflex responses for immediate hazards and invalid plans;
3. tactical policy such as rules, utility scoring, behaviour tree, flow field, or short search;
4. strategic planner for goals and resource allocation;
5. optional learned/model-assisted proposer for problems that genuinely require it;
6. deterministic fallback and emergency action.

Do not add a model where authored algorithms meet the required variety and performance.

### 3. Specify decision budgets

Declare per-agent and global limits:

- decisions per tick/second;
- CPU time or search expansions;
- pathfinding nodes and replans;
- memory/state size;
- remote requests, tokens, cost, deadline, concurrency, and cache;
- degraded-mode policy under population or host pressure.

The scheduler must preserve fairness and deterministic ordering when many agents need decisions simultaneously.

### 4. Design strategic continuity

Represent current goal, plan, next action, plan age, confidence, observed risk, and invalidation reason. Replan only on meaningful triggers or budgeted intervals; constant replanning produces jitter and cost.

Use deterministic tie-breaking and named random streams for intentional behavioural diversity.

### 5. Handle failure and uncertainty

Define responses to:

- no legal action;
- unreachable target;
- stale path;
- conflicting agents;
- partial observation;
- unexpected hazard;
- planner timeout;
- malformed or refused model output;
- resource exhaustion;
- repeated state loop;
- contradictory strategic goals.

Fallbacks should be safe but not necessarily optimal; visible imperfections can create drama if they remain credible.

### 6. Design public explainability

Expose only validated fields such as:

- goal: “Reach checkpoint 12”;
- observation: “North route blocked”;
- intent: “Searching for safer path”;
- confidence band;
- fallback status;
- plan change reason.

Use copy keys or templated summaries. Never stream raw prompts, private viewer content, debug dumps, or hidden model reasoning.

### 7. Evaluate behaviour

Create benchmark suites for ordinary, edge, and adversarial seeds. Measure:

- success/survival/progress;
- action legality;
- decision latency and budget violations;
- fallback and timeout rates;
- stuck/loop frequency and recovery time;
- path/strategy diversity;
- resource efficiency;
- fairness across equivalent agents;
- exploit and hidden-information leakage;
- remote inference cost and availability impact;
- subjective believability using representative replays.

Compare versions using identical seed/event corpora.

## Model-Assisted Decisions

Use remote models only when the task benefits from language, broad puzzle hypotheses, long-horizon narration-aware strategy, or content interpretation unavailable to deterministic systems.

Required boundary:

- asynchronous proposal request outside the hot tick path;
- minimized, privacy-reviewed prompt;
- strict structured response schema;
- deadline, cancellation, rate, cost, and concurrency limits;
- validation against legal actions and current state version;
- stale-response rejection;
- deterministic recorded selection if a proposal affects authority;
- cache only when semantics and privacy allow;
- deterministic fallback and circuit breaker;
- provider/model version recorded for analysis.

## Required Outputs

- agent contract table;
- observation and action schemas;
- policy-stack diagram and rationale;
- constraint and decision-budget table;
- goal/plan/invalidation state model;
- stuck and fallback state machine;
- deterministic ordering/tie-break/random-stream rules;
- public intent-summary schema and copy examples;
- benchmark seed corpus and metrics;
- remote-model boundary and cost/privacy/reliability plan where applicable;
- adversarial scenario and regression plan.

## Review Gate

Pass only when:

- every action enters authority through validation;
- no observation leaks forbidden information;
- peak populations meet global decision budgets;
- remote/model absence for the full run does not stop progress;
- repeated-state, no-progress, and oscillation tests recover within game-specific limits;
- identical observations, policy version, seed stream, and external proposals yield identical selected actions;
- benchmark distributions meet target bands without one hard-coded showcase path;
- public intent remains accurate, bounded, safe, and useful to viewers;
- fallback use and budget violations are observable.

## Stop-Ship Failures

- model call per authoritative tick;
- retry-until-success inference;
- policy mutates state or reads hidden internals directly;
- unbounded A*, Monte Carlo, or planner search;
- all agents replan simultaneously without scheduler budget;
- raw chain-of-thought displayed;
- random tie-break uses ambient randomness;
- stuck detector only restarts the entire game;
- benchmark excludes losing or adversarial seeds;
- “smart” declared without measurable behaviour.

## Handoffs

- `game-architecture` and `deterministic-simulation`: authority, ordering, schemas, replay.
- `gameplay-progression` and `difficulty-failure-balancing`: goals, challenge, acceptable imperfection, target distributions.
- `procedural-generation` and `game-physics`: valid worlds and movement constraints.
- `livestream-hud`: safe intent visualization.
- `performance-optimization`, `simulation-qa`, `long-running-reliability`, `security-privacy`: budgets, campaigns, fallbacks, and model/input risk.
