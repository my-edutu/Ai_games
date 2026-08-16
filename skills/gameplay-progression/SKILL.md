---
name: gameplay-progression
description: Use when designing or reviewing core loops, objectives, levels, milestones, checkpoints, upgrades, records, run structure, restart cadence, long-term progression, or renewable autonomous gameplay
---

# Gameplay Progression

## Overview

Create layered progress that makes every moment meaningful, every run readable, and every restart desirable. The core principle is **visible forward motion plus renewable risk across nested time horizons**.

## Scope

Use after the viewer promise and basic rules exist, before detailed balancing or implementation phases. This skill defines loops, progression units, milestones, rewards, setbacks, terminal states, records, and replayability. It does not set final probabilities or manipulate outcomes for retention.

## Non-Negotiable Invariants

- One primary progress measure is permanently legible during play.
- Second-to-second actions feed minute-level goals, which feed run and long-term goals.
- Progress creates new decisions or pressure, not only larger numbers.
- Setbacks preserve understandable causality and meaningful recovery paths.
- A run has an intentional ending or a declared endless-mode renewal structure.
- Loss and restart are designed entertainment states, not technical interruptions.
- Records and milestones are rebuildable from authoritative events.
- Persistent progression cannot make future outcomes guaranteed or make new viewers unable to understand the current run.
- The progression system has anti-stall, anti-runaway, and content-renewal rules.

## Workflow

### 1. Define nested loops

Document five horizons:

- **moment loop**: action, feedback, immediate state change;
- **tactical loop**: short objective, threat, or choice;
- **run loop**: visible goal, escalation, terminal outcome;
- **session/stream loop**: multiple runs, records, tournaments, eras, or chapters;
- **catalogue/community loop**: seasons, shared achievements, themes, or events that do not invalidate game truth.

For each horizon state trigger, decision, progress, tension, feedback, completion, and reset.

### 2. Choose progress currencies

Use one primary viewer-facing unit such as length, floor, room, day, survivors, territory, population, distance, or throughput. Add at most a few secondary units that explain strategy.

For every currency specify:

- source and sink;
- cap or growth law;
- visibility and update cadence;
- relation to difficulty;
- loss/reset behaviour;
- record definition;
- anti-exploit rule.

Avoid multiple counters competing as “the real goal.”

### 3. Build milestone grammar

Milestones should change the experience. Define:

- cadence bands;
- announcement and anticipation;
- mechanical unlock or environment shift;
- reward/choice;
- difficulty or novelty change;
- checkpoint and recovery impact;
- record and audience opportunity;
- audiovisual identity.

Use small, medium, and major milestones so the stream has frequent progress without exhausting major moments.

### 4. Design escalation axes

Increase challenge through a controlled combination of:

- speed/time pressure;
- spatial constraint;
- enemy/hazard complexity;
- resource scarcity;
- information uncertainty;
- objective concurrency;
- agent coordination;
- environmental change;
- cost of mistakes;
- audience-event eligibility.

Do not scale only health, damage, speed, or population. Introduce new decisions before raw-stat inflation.

### 5. Define setbacks and recovery

Catalogue setbacks by severity: friction, tactical loss, major reversal, terminal loss. For each define causality, feedback, retained progress, recovery path, and anti-spiral rule.

Recovery must not be a hidden rescue. It may arise from declared checkpoints, earned resources, safer choices, authored comeback mechanics, or eligible audience effects.

### 6. Design terminal resolution and restart

Specify win, loss, draw, abandon, integrity quarantine, and endless-cycle boundary. The result sequence includes:

- clear cause;
- score and progress;
- records and notable moments;
- audience contribution summary;
- short replay/celebration or failure beat;
- next-run seed/theme preview;
- automatic countdown and restart.

Target intermission bands protect momentum without erasing the result.

### 7. Add long-term structure carefully

Use seasons, tournaments, eras, achievements, collections, unlocked themes, or statistical history. Long-term progression should primarily add variety, identity, and goals; permanent power must remain bounded and transparent.

Persistent worlds require entity retirement, history aggregation, rollover, and an intentional reset/era system to avoid infinite state and inaccessible stories.

### 8. Model progression as distributions

Define target bands for:

- run duration;
- progress reached;
- win/loss/draw;
- milestone arrival;
- setback and recovery;
- record frequency;
- strategy/content diversity;
- interaction opportunity count;
- endless-cycle length;
- no-progress and runaway cases.

Use accelerated seeded simulations and representative replays to validate them.

## Required Outputs

- nested-loop map;
- primary/secondary progress currency table;
- milestone ladder and audiovisual identity;
- escalation matrix;
- setback/recovery taxonomy;
- terminal result/intermission/restart state machine;
- checkpoint, persistence, season, and reset rules;
- record definitions and event sources;
- target progression distributions and simulation plan;
- anti-stall, anti-runaway, exploit, and content-renewal rules;
- requirement-to-phase mapping.

## Review Gate

Pass only when:

- a viewer can identify current progress and next meaningful milestone immediately;
- every loop has a renewable decision and reset;
- milestones alter mechanics, environment, choice, or stakes rather than only displaying a badge;
- challenge expands across multiple axes;
- setbacks and recoveries remain causal and replayable;
- all terminal states produce a satisfying automatic continuation;
- long-term systems do not require unbounded live state or guarantee future success;
- target distributions include ordinary, exceptional, pathological, and endless cases;
- records are deterministic and auditable;
- each implementation phase ends with a runnable loop.

## Stop-Ship Failures

- several equally prominent primary goals;
- progression is only exponential numbers;
- difficulty is only faster enemies or more health;
- invisible rubber-banding rescues or kills agents;
- checkpoint removes all stakes or loss erases all context;
- intermission requires operator action;
- persistent upgrades make outcomes inevitable;
- no policy for indefinite runs, stalled agents, or runaway populations;
- one scripted seed represents progression quality;
- long-term history remains forever in live memory.

## Handoffs

- `game-creative-direction`: verify loops express the fantasy.
- `difficulty-failure-balancing`: calibrate distributions and comeback strength.
- `game-economy-rewards`: design resources, sinks, rewards, and persistent value.
- `procedural-generation`: ensure content grammar supports milestone variety.
- `viewer-retention`: validate pacing and curiosity at stream timescales.
- `game-analytics-experimentation` and `simulation-qa`: measure progression distributions and regressions.
