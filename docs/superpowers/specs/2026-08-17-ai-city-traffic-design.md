# AI City Traffic Experiment — Approved Design

**Date:** 2026-08-17  
**Game:** Game 11 — AI City Traffic Experiment  
**Repository:** `my-edutu/Ai_games`  
**Decision authority:** The user delegated selection of the strongest professional approach without further preference prompts.

## Viewer promise

Viewers watch an autonomous traffic-control intelligence keep a living city moving through escalating demand waves, incidents, and competing priorities, and they return to see whether the AI can recover flow, beat the mobility record, and avoid a citywide gridlock.

The adversary is not a scripted villain. It is the reconciled pressure created by finite road capacity, changing demand, incidents, imperfect routing, and bounded audience-selected policy trade-offs.

## Product identity

AI City Traffic Experiment is the catalogue's systems-optimization spectacle. The city is the protagonist, traffic flow is the visible objective, and congestion is the danger. It differs from Snake's single-agent spatial optimization and Maze's partial-observation exploration by presenting many-agent emergence, network pressure, policy trade-offs, and recovery at city scale.

### Creative pillars

1. **Flow is visible.** Lane heat, moving vehicles, signal phases, queue pressure, and completed trips show whether the city is improving without requiring a dashboard explanation.
2. **The AI has legible intent.** Public intent states explain the current policy, bottleneck, confidence band, and plan-change reason without exposing hidden reasoning.
3. **Congestion has causality.** Gridlock arises from demand, capacity, closures, route choice, and signal decisions; it is never secretly forced.
4. **Recovery is the drama.** Green waves, rerouting, transit priority, and incident clearance create readable comeback sequences.
5. **Audience influence is policy, not outcome purchase.** Viewers choose bounded eligible trade-offs; no free or paid input guarantees a record, gridlock, win, or loss.

## Comprehension hierarchy

A representative stream frame must answer, in this order:

1. Can the city keep moving?
2. What is the current mobility score and completed-trip rate?
3. Where is congestion concentrated?
4. Which demand wave or incident is active?
5. What policy is the AI applying and why?
6. What bounded audience choice is next?

## Core run structure

A run is a finite city experiment, not an indefinite sandbox.

- **Moment loop:** vehicles advance, queue, cross signals, complete trips, or reroute.
- **Tactical loop:** the signal AI detects pressure and selects a bounded phase or corridor bias.
- **Wave loop:** calm, rush, surge, incident, and recovery bands alter demand and bottlenecks.
- **Run loop:** the city accumulates completed trips and delay until the experiment ends or sustained gridlock produces a legitimate game loss.
- **Stream loop:** a result summary, record comparison, next-city preview, short intermission, and automatic restart preserve momentum.

Primary progress is the **Mobility Score**, backed by completed trips per rolling minute. Secondary explanatory metrics are congestion index, active vehicles, average delay, and current wave.

## Authoritative simulation

The simulation uses a fixed logical tick and a deterministic lane-cell model.

- Intersections form a constructively connected rectangular graph.
- Every adjacent pair has two directed lanes.
- Lanes have integer cell capacity; vehicles occupy one lane cell.
- Movement uses propose, stable conflict resolution, then commit.
- Signals gate intersection entry by north-south or east-west phase.
- All vehicle, command, signal, incident, and event ordering uses stable IDs.
- All authoritative randomness uses versioned named `NamedRng` streams.
- Rendering, audio, browser timing, provider timing, and telemetry cannot mutate authority.

The lane-cell model is selected instead of a rigid-body engine because traffic decisions depend on capacity, queues, route conflict, and signal timing rather than tyre dynamics. It is deterministic, performant at large populations, and visually extensible through presentation interpolation.

## City generation and demand

Generation first builds the connected route network, boundary gateways, lane metadata, and intersection adjacency. Profiles alter topology pressure without violating connectivity:

- `grid`: balanced streets;
- `arterial`: stronger central corridors;
- `ring`: perimeter relief route;
- `mixed`: arterial and local combination.

Demand uses a separate named stream. Origins and destinations are distinct boundary gateways. Spawn attempts, pending demand, repair, and fallback are bounded. Bad seeds remain reproducible.

## Autonomous intelligence

The policy stack is:

1. legality and signal safety;
2. deterministic fixed-cycle fallback;
3. queue-pressure adaptive signal control;
4. bounded congestion-aware rerouting;
5. corridor bias and transit-priority policy;
6. incident-aware strategy and stuck recovery.

No remote model is required. Decision budgets cap intersections evaluated, route expansions, replans, and queued commands. Public intent is templated from validated state.

## Dramatic patterns

The implementation and campaign classifier must produce at least these natural patterns:

- **Rush-hour mastery:** rising demand, stable throughput, new record.
- **Incident cascade and recovery:** closure, rerouting pressure, green-wave recovery.
- **Transit trade-off:** bus priority improves people-throughput while car delay rises temporarily.
- **Near-gridlock escape:** congestion crosses the danger band, then pressure falls before terminal gridlock.
- **Overload loss:** sustained network saturation ends with a clear causal result.

## Audience effect catalogue

The game accepts only normalized, authenticated, moderated, idempotent envelopes. Public free text is not part of Game 11.

- `green-wave-ns`: temporary north-south corridor bias.
- `green-wave-ew`: temporary east-west corridor bias.
- `transit-priority`: temporary bus movement priority.
- `challenge-surge`: schedules a bounded demand increase in a safe future window.
- `incident-relief`: reduces one active closure duration by a capped amount.
- `night-theme`: presentation-only visual theme.

Every effect declares eligibility, cooldown, conflict group, cap, expiry, queue policy, audit state, replay representation, and reversal behaviour. Provider or moderation outage disables affected interactions while autonomous play continues.

## Broadcast experience

The stream source is a dependency-free Node HTTP host plus a canvas client.

- A privacy-safe immutable render snapshot feeds the client.
- Lane heat and width communicate load without color alone.
- Vehicles use shape differences for car, bus, and emergency classes.
- Signals use icon/shape and text-safe status, not color alone.
- The HUD reserves primary space for Mobility Score, flow, danger, wave, record, and AI intent.
- Context cards show incidents and audience windows with bounded dwell.
- Reduced-motion, reduced-flash, caption, clean-feed, mobile, and safe-zone modes are first-class.
- Semantic audio cues are synthesized or mapped from versioned events; audio failure cannot stop simulation.

## Reliability and operations

The runtime owns one authoritative state, one RNG registry, an append-only bounded command/event history, and verified snapshots. Recovery validates schema, versions, checksum, invariants, event continuity, and RNG state. Divergence quarantines the run. Optional failures use typed degradation. Common process, provider, snapshot, renderer, queue, and output faults have chaos scenarios, health probes, runbooks, and rollback boundaries.

## Performance budgets

Reference software budgets are enforced in tests and validation scripts:

- fixed authoritative rate: 10 ticks per second in stream mode;
- maximum supported vehicles: 1,500;
- route search: at most 512 node expansions per decision;
- signal decisions: bounded by intersection count and configured interval;
- audience queue: 64 commands;
- replay/presentation ring: 360 frames;
- live semantic events: 8,192 entries with low-priority compaction;
- render snapshot: at most configured lanes plus supported vehicles;
- local accelerated campaign: deterministic throughput and p99-equivalent guardrails recorded by validation.

## Six phase gates

1. **Foundation / R1:** deterministic graph, vehicles, signals, results, replay checksum, invariants, headless runner.
2. **Core AI and content / R2 core:** adaptive signals, congestion routing, waves, incidents, campaigns, dramatic patterns.
3. **Broadcast experience / R2:** privacy-safe snapshots, premium canvas scene, semantic audio, accessibility, stream self-test, browser checks.
4. **Audience interaction / R3:** normalized effects, idempotency, moderation boundary, votes, reversal, provider degradation.
5. **Reliability and operations / R4 software:** verified snapshots, restore, quarantine, watchdogs, chaos, resource bounds, runbooks.
6. **Production launch / R4 candidate:** release validation, traceability, rollback controls, candidate review, CI integration, external R5 evidence intake.

## Truthful readiness boundary

All six software phases can be completed in this branch. The repository's production standard requires real elapsed 72-hour endurance, seven-day canary, current credentialed provider verification, independently witnessed drills, and an independent exact-candidate reviewer before R5. The release validator must fail closed on missing external evidence and report the highest truthful status as R4 production candidate until those artefacts exist.
