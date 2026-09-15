# Eko Run AI System

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Define autonomous Tayo, traffic and selected NPC intelligence contracts without requiring remote inference.  
**Status:** `approved design`; implementation begins in Phase 8 except interfaces reserved in Phase 1.  
**Owning phase:** Phase 8 AI Street Run; Phase 1 owns command/state compatibility.  
**Related:** `TECHNICAL_ARCHITECTURE.md`, `GAME_DESIGN.md`, `TESTING_STRATEGY.md`.  
**Last material review:** 2026-09-15  
**Version:** `AI-1.0`

## Agent Types

### Tayo autonomous runner

Goal: maximize valid run progress/records under the same movement, hazard, checkpoint and result rules as Player Mode.

### Traffic agents

Goal: execute authored lane/route schedules and bounded local responses that create readable traffic timing without remote inference or hidden teleportation.

### Crowd/ambient agents

Most crowds are presentation-only. Any crowd entity that can block or affect authority uses a simplified deterministic occupancy/motion contract rather than unconstrained full-body simulation.

## Tayo Observation Contract

Observations are serializable and contain only legal game information:

- current authoritative tick and movement state;
- player position/velocity and supported movement capabilities;
- current route segment/checkpoint/progress;
- visible/relevant nearby platform/hazard summaries inside an authored perception horizon;
- eligible route branches and their declared high-level features;
- current recoverable resources/momentum state;
- current goal and recent action outcome.

Observations exclude hidden future random draws, provider/private data, presentation-only occluded entities, debug truth unavailable to a human-equivalent controller, and raw model/provider internals.

## Action Contract

Autonomous actions submit the same `EkoRunCommand` family used by human input. AI code never writes position, score, checkpoint or result state directly.

## Policy Stack

1. legality/safety filter;
2. immediate hazard reflex;
3. tactical route/action utility scoring;
4. bounded short-horizon movement plan;
5. strategic checkpoint/risk preference;
6. deterministic fallback.

Remote language/model inference is not required. A later optional model may suggest strategic preferences outside the hot path only if its output is structured, time-bounded, recorded, validated and safely ignorable.

## Decision Budgets

Phase 8 sets measured final CPU budgets. The architectural constraints are:

- no network call in authoritative tick;
- deterministic scheduling and tie-breaks;
- bounded search expansions and planning horizon;
- a global budget prevents all agents replanning simultaneously;
- degraded mode selects simpler legal policies rather than skipping collision/rule checks.

## Goal/Plan State

Tayo AI state may retain current goal, target checkpoint/branch, short plan, plan age, risk estimate, fallback status and last invalidation reason. AI memory is bounded per run and reconstructible or safely reset at declared boundaries.

## Stuck and Recovery States

Detect:

- no-progress window;
- repeated state/action loop;
- left/right oscillation;
- repeated collision at the same route feature;
- unreachable selected branch;
- planner budget timeout.

Recovery uses legal actions: brake/reset intent, choose a valid alternate route, fall back to reflex/tactical policy, or accept a legitimate run failure. Hidden teleport, invulnerability or collision bypass is prohibited.

## Traffic Policy

Traffic behaviour is primarily authored schedule + local state machine:

- approach;
- cue/commit;
- move/cross/pull-out;
- clear;
- cooldown/reset outside player decision horizon.

Authoritative traffic randomness uses the `traffic` named stream and cannot schedule an ordinary unavoidable hit. Visual traffic may be denser than authoritative traffic as long as it cannot change AI/player observations unfairly.

## Public Intent Summary

Later HUD may display bounded validated fields such as:

- Goal: `Reach Checkpoint 3`
- Intent: `Hold speed for the clear lane`
- Risk: `High`
- Fallback: `Safer route selected`
- Plan change: `Danfo crossing blocked prior line`

Raw hidden reasoning, model chain-of-thought, debug search trees and private inputs are never public.

## Evaluation

Phase 8 benchmark corpora include ordinary, dense, weather, narrow-route, recovery, pathological and max-progression seeds. Metrics include progress, legitimate failures, illegal-action rejection rate, decision latency, fallback rate, stuck/loop rate, recovery time, path diversity and resource usage.

AI quality is not established by one showcase seed. Candidate/baseline policies use identical seed/event corpora.

## Phase 1 Boundary

Phase 1 creates action/command/state contracts only. It does not implement Tayo intelligence. A scripted deterministic command fixture may drive the headless foundation route solely to verify authority/replay contracts and is not described as AI.
