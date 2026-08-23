# AI Zombie Survival — Production Design Specification

**Date:** 2026-08-17  
**Game:** Game 10 — AI Zombie Survival  
**Working title:** Last Light Protocol  
**Status:** Approved implementation design  
**Base:** `main@68493d9d90d244797f052ebe2bb1d8b1895a64c8`

## Viewer promise

Viewers watch an autonomous survivor squad fortify a failing refuge by day and withstand escalating zombie hordes by night, returning to discover how many days the squad survives, which strategy it adopts, and whether a damaged base can recover before the next assault.

The adversarial premise is simple: finite supplies, growing horde complexity, weather, breached defenses, injuries, and competing preparation priorities steadily reduce the squad's margin for error. Audience influence may create bounded opportunities or complications, but it cannot purchase a win, a death, a record, or an unavoidable terminal outcome.

## Product goals

1. Make the current day, phase, base integrity, survivor status, and horde pressure understandable within ten seconds at mobile viewing size.
2. Produce renewable rule-driven dramatic patterns: prepared dominance, breach-and-recovery, resource gamble, heroic rescue, cascading collapse, and last-stand evacuation.
3. Run autonomously without a provider, remote model, operator, database, renderer, or audio engine in the authoritative loop.
4. Reproduce gameplay truth exactly from versioned configuration, seed, normalized commands, snapshots, and named RNG state.
5. Survive provider outages, duplicate/reordered events, process restart, corrupt snapshots, renderer failure, queue pressure, and long unattended operation without inventing continuity.
6. Reuse catalogue contracts and operational conventions while keeping all Zombie-specific rules inside `games/ai-zombie-survival`.

## Non-goals

- photorealistic gore, horror imagery that depends on graphic detail, or raw viewer text;
- direct player controls in the stream-facing build;
- remote LLM decisions in the authoritative tick;
- unbounded open-world persistence;
- pay-to-win, pay-to-kill, loot-box economics, or hidden outcome forcing;
- a second game engine or framework separate from the repository's TypeScript/Node platform.

## Creative pillars

### Resourceful survival

The squad survives through visible trade-offs between materials, ammunition, medicine, food, power, time, and position. Unexplained rescues and invisible stat changes are forbidden.

### Preparation becomes consequence

Every daytime choice affects the next night. A reinforced east wall, an unsearched clinic, a repaired generator, or a tired guard must create a legible consequence.

### Intelligent teamwork

Four role-specialized survivors coordinate through bounded utility planning: Scout, Builder, Medic, and Guard. The public HUD exposes validated goal, intent, confidence band, and plan-change reason without hidden chain-of-thought.

### Breach, recovery, and sacrifice

Walls can fail without ending the run immediately. Survivors may retreat, repair under pressure, cover an injured teammate, or abandon a resource site. Losses remain causal and replayable.

### Unattended broadcast clarity

Day/night contrast, silhouettes, camera framing, captions, semantic sound, and restrained effects make the game readable for hours while recovery and maintenance states remain truthful.

## Progression and run structure

The primary progress unit is **Day**. Secondary strategic units are base integrity, survivors alive, horde remaining, and the five shared resources.

- Moment loop: observe threat or task, choose a legal action, receive immediate semantic feedback.
- Tactical loop: complete a scavenging route, build or repair a defense, eliminate a breach group, heal or extract a survivor.
- Day/night loop: prepare during daylight, survive the horde at night, receive a dawn report and next-day forecast.
- Run loop: reach the configured evacuation day or lose all survivors/the command core, show causal result and records, then restart automatically.
- Stream loop: compare best day, evacuation streak, damage prevented, survivor rescues, and named dramatic patterns across runs.

Default standard profile uses a fixed 10 Hz tick, 360 preparation ticks, 540 horde ticks, 20 evacuation days, and an 80-tick result/intermission. Test and accelerated profiles shorten durations without changing rules.

## World and generation

The authoritative world is a bounded integer grid. A constructive generator creates:

1. a centered refuge with command core, generator, storage, medical bay, and perimeter wall segments;
2. four edge spawn gates with at least one validated route to a perimeter target;
3. accessible resource sites for materials, ammunition, medicine, food, and power;
4. obstacles and cover that preserve survivor and horde path budgets;
5. audience-effect anchors and camera interest points;
6. extracted features such as route length, bottleneck count, cover density, resource risk, and gate pressure.

Generation has bounded attempts, deterministic repair, a versioned known-good fallback, typed diagnostics, and no secret reseeding. Every generated world must satisfy reachability, spawn separation, entity budget, and mandatory resource constraints.

## Authoritative state and order

Only `ZombieRuntime` mutates gameplay state. State is serializable and excludes wall clock, DOM, audio, provider objects, callbacks, and secrets.

Each active tick executes in this total order:

1. lifecycle/operator commands;
2. due validated audience influence;
3. phase transition and forecast/horde scheduling;
4. survivor observations and bounded decisions in stable entity order;
5. survivor movement/task resolution;
6. zombie spawning, flow-field decisions, and movement;
7. survivor attacks, zombie attacks, damage, healing, building, repair, and resource transactions;
8. breach/core/result/progression evaluation;
9. semantic events, invariant checks, and checksum material.

All randomness comes from named streams: `world`, `resources`, `weather`, `horde`, `survivor-ties`, `loot`, `audience-ties`, and `cosmetic-authority-free`. The cosmetic presentation may vary independently but cannot enter authority.

## Entity and economy model

Survivors have stable IDs, roles, integer health/stamina, grid position, action, target, cooldown, carried resource, status, public intent, and stuck counters. Zombies have stable IDs, type, health, speed cadence, attack cooldown, gate origin, target, and status.

Zombie types are Walker, Runner, and Brute. Difficulty increases through composition, simultaneous gates, route pressure, weather, scarcity, objective concurrency, and mistake cost before raw health inflation.

Resources use append-only transactions and bounded balances:

- materials: walls, barricades, and repairs;
- ammunition: ranged attacks and defensive emplacements;
- medicine: treatment and emergency stabilization;
- food: daily upkeep and stamina recovery;
- power: lights, generator defenses, and medical capacity.

Every source, sink, cap, rejection, and reversal is evented. Zero-audience runs remain complete.

## Autonomous AI

The policy stack is:

1. legality and hard safety filter;
2. immediate reflexes for lethal proximity, invalid targets, and trapped cells;
3. per-survivor utility scoring over a bounded action catalogue;
4. team strategy selection from `fortify`, `stockpile`, `balanced`, `rescue`, and `last-stand`;
5. deterministic fallback and emergency retreat;
6. stuck/oscillation/no-progress detection with bounded replanning.

Day actions: scavenge, deliver, build, repair, heal, rest, guard, reposition. Night actions: attack, cover, repair, heal, retreat, intercept, hold, reposition. Decisions use only allowed observations and fixed node/action budgets. Remote model absence for the entire run changes no continuity requirement.

## Audience interaction

Provider adapters normalize authenticated YouTube/Twitch evidence outside the game. The game accepts only privacy-safe fixed-choice requests. The effect catalogue includes supply priority, fortification sector, scout route, spotlight, generator boost, medicine cache, ammunition cache, fog bank, runner surge, and next-weather choice.

Each effect has stable ID, eligibility predicate, disclosed bounds, cooldown, conflict group, per-run/global cap, deterministic scheduling, expiry, acknowledgement, reversal policy, audit record, and replay command. Duplicate IDs apply at most once. Moderation, entitlement, persistence, or audit outage fails closed for paid-eligible effects while autonomous play continues.

## Presentation and audio

The broadcast uses an HTML Canvas client served by a dependency-free Node host. Presentation consumes immutable public snapshots and semantic events.

Persistent hierarchy:

1. day and phase;
2. next phase countdown or horde remaining;
3. base integrity and survivors alive;
4. current team strategy and short AI intent;
5. resources and next milestone;
6. record comparison;
7. bounded audience opportunity/status.

Scenes cover countdown, preparation, dusk warning, horde, breach crisis, dawn report, result, replay, intermission, provider degraded, recovery, quarantine, and clean feed. High contrast, reduced motion, reduced flash, captions, muted comprehension, 16:9 safe zones, mobile crops, and low-bitrate readability are required.

Audio is semantic: calm preparation, dusk anticipation, horde pressure, breach crisis, dawn recovery, evacuation, loss, and safe maintenance. Voice counts, cooldowns, priority, ducking, and missing-audio fallback are bounded. Every critical cue has a visual/caption alternative.

## Persistence, recovery, and operations

Snapshots include game/deterministic/schema/config/content versions, run ID, seed, tick, event sequence, RNG streams, state checksum, and payload. Restore validates compatibility, checksum, invariants, event continuity, and replay checkpoints before resuming.

A single-writer lease fences stale authority. The supervisor separately probes process heartbeat, tick progress or declared idle, snapshot age, persistence acknowledgement, render freshness, expected scene, audio intent, provider state, queue pressure, and resource bounds. Integrity uncertainty enters quarantine or fresh-run recovery; it never silently continues.

Queues, events, snapshots, dedupe records, acknowledgements, particles, listeners, timers, and logs have explicit caps/retention. Chaos scenarios cover worker kill, duplicate/reordered influence, provider outage, persistence lag, corrupt newest snapshot, renderer/audio failure, black/frozen/wrong-scene output, queue saturation, credential revocation, and host restart.

## Performance budgets

Reference software targets:

- authoritative 10 Hz tick: p99 below 50 ms at maximum configured 512 zombies and four survivors;
- ordinary tick: p95 below 15 ms;
- deterministic decision budget: at most 64 candidate evaluations per survivor decision;
- flow-field rebuild: bounded to grid cells and only when target topology changes or cadence expires;
- public snapshot: below 256 KiB;
- live semantic events: at most 2,000 retained in memory;
- influence queue: at most 128 pending items;
- browser source: 60 FPS target, 30 FPS minimum quality tier, critical HUD preserved;
- memory/handles/queues: no unbounded positive slope in engineering soak.

## Analytics and records

Metrics derive from stable events and classify technical/quarantined/test runs separately. Required distributions include day reached, run duration, evacuation/loss, failure cause, breach/recovery, survivor death/rescue, resource starvation/hoarding, strategy mix, horde composition, stuck/fallback rate, influence lifecycle, tick/frame/output health, restore time, and dramatic pattern.

Records are deterministic projections: best day, fastest evacuation, survivors evacuated, nights without breach, damage prevented, rescues, and longest recovery streak.

## Phase gates

1. **Phase 1 — Deterministic Foundation (R1):** config, world, state, rules, lifecycle, checksum, snapshot/restore, replay, headless runner, invariant/property evidence.
2. **Phase 2 — Core AI, Hordes, Economy, Progression (R2):** role policies, team strategy, flow fields, combat, resources, building, weather, wave generation, campaigns, balance/dramatic-pattern evidence.
3. **Phase 3 — Broadcast Experience (R2 streamed):** immutable render snapshots, Canvas host, HUD/camera/VFX/audio contracts, accessibility, output health, browser capture.
4. **Phase 4 — Audience Interaction (R3):** normalized fixed-choice influence, moderation/rate/idempotency, deterministic votes, caps, reversal, outage/no-audience evidence.
5. **Phase 5 — Reliability and Operations (R4):** durable evidence, lease/fencing, verified recovery/quarantine, supervisor, RBAC, bounded resources, chaos drills and runbook.
6. **Phase 6 — Production Validation and Launch Governance (R5 candidate):** exact-source manifest, traceability, campaign/capacity evaluators, real-duration contracts, provider/external attestations, drills, canary controller, rollback and fail-closed assessor.

Software implementation may be complete while final R5 remains `BLOCKED_EXTERNAL`. Production-ready language is allowed only after credentialed current providers, production-reference audiovisual/capacity evidence, external safety/accessibility/licence review, independently witnessed drills, a real 72-hour frozen-candidate endurance run, a real seven-day canary, and an independent exact-candidate final review cause the assessor to return `PASS / R5 / 100 / productionReady=true`.

## Review decision

This design is approved because it preserves the catalogue's deterministic and provider-neutral architecture, creates a distinct preparation/crisis spectator fantasy, avoids a heavyweight dependency, provides bounded large-horde behavior, makes every phase independently runnable, and keeps the final production claim evidence-based.