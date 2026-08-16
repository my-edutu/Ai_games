---
name: procedural-generation
description: Use when creating or reviewing generated levels, mazes, towers, dungeons, worlds, encounters, puzzles, obstacle courses, ecosystems, content grammars, seed handling, validation, repair, or diversity systems
---

# Procedural Generation

## Overview

Generate effectively unbounded content that remains solvable, fair, varied, performant, replayable, and artistically coherent. The core principle is **authored possibility space plus deterministic construction and proof-oriented validation**.

## Scope

Use for runtime or offline generation of spaces, encounters, waves, puzzles, civilizations, tracks, traffic demand, ecosystems, loot, and event schedules. It does not define the core fantasy or approve balance alone; it supplies valid diverse content to those systems.

## Non-Negotiable Invariants

- Identical generator version, configuration, content pack, seed, and named random streams produce identical output.
- Every generated artefact has explicit hard validity constraints and soft quality objectives.
- Generation uses bounded attempts, repair, and a known-good fallback; it cannot retry forever.
- Critical solvability/reachability is proven or constructively guaranteed.
- Difficulty-relevant features are measurable from generated output.
- Variety is measured across seed corpora; randomness alone is not diversity.
- Generated state and histories remain within memory, time, snapshot, and render budgets.
- Content cannot introduce unmoderated text, unlicensed assets, forbidden combinations, or hidden probability manipulation.
- Bad seeds remain reproducible and enter regression corpora.

## Workflow

### 1. Define the content contract

Specify:

- output schema and semantic layers;
- consumer systems;
- hard constraints that must never fail;
- soft objectives and acceptable ranges;
- difficulty/features extracted from output;
- generation time, memory, and size budgets;
- version, seed, named streams, and content-pack dependencies;
- validation, repair, and fallback behaviour.

Separate authoritative generation from cosmetic variation. Cosmetic changes should not perturb rule-critical random streams.

### 2. Choose a constructive grammar

Prefer methods that guarantee core validity by construction:

- spanning-tree or connected graph before maze decoration;
- guaranteed path before hazards and branches;
- solvable puzzle template before clue/value permutation;
- valid platform chain before optional risk/reward routes;
- resource/ecology constraints before population variation;
- route network before traffic demand;
- room topology before dressing.

Use wave-function collapse, grammars, constraint solving, search, cellular automata, noise, or simulation only with explicit constraints and bounded execution.

### 3. Layer generation

A robust pipeline normally separates:

1. topology and mandatory path;
2. objective placement;
3. hazards/enemies/obstacles;
4. resources/rewards/checkpoints;
5. alternate routes and secrets;
6. audience-effect anchors;
7. visual/audio themes and dressing;
8. navigation, physics, visibility, and performance baking;
9. validation and feature extraction.

Each layer consumes a dedicated named stream so adding decoration does not change solvability.

### 4. Validate hard constraints

Examples:

- all mandatory objectives reachable;
- required keys precede locks;
- spawn and goal have safe minimum separation;
- no unavoidable damage/death unless explicitly designed;
- clearances and slopes match agents/physics;
- checkpoints cannot trap the run;
- puzzle has the intended solution count;
- economy can supply mandatory costs;
- traffic network avoids disconnected demand;
- ecosystem has bounded resources/populations;
- entity, collider, draw, audio, and pathfinding budgets hold.

Validation returns typed failures and diagnostic features, not a boolean only.

### 5. Repair before discard

Use deterministic targeted repairs—move a key, open a link, replace a hazard, add a platform, reduce density—when they preserve the seed identity. Limit repair passes and record them. If validation still fails, use a versioned safe fallback and emit telemetry.

Never silently substitute a different random seed; doing so breaks bug reproduction and declared run identity.

### 6. Measure quality and diversity

Extract features such as path length, branching, dead ends, verticality, openness, bottlenecks, hazard density, rest cadence, reward risk, solution depth, encounter mix, visual density, and expected agent workload.

Across a declared seed sample, measure:

- validity and fallback rate;
- feature distributions and coverage;
- duplicate/near-duplicate rate;
- difficulty correlation;
- strategy and path diversity;
- generation time/memory tails;
- agent success and stuck rate;
- content theme balance;
- rare pathological clusters.

Use novelty archives or stratified seed banks to retain representative extremes.

### 7. Curate runtime pacing

Infinite content needs rhythm. Author grammars for rest, anticipation, challenge, choice, spectacle, milestone, boss/crisis, and recovery segments. The generator may select eligible patterns, but it cannot secretly force outcomes or ignore cooldowns.

### 8. Version and operate content

Record generator, constraint, feature-extractor, content-pack, and theme versions. Provide seed inspection, visual/headless preview, validity report, replay export, blacklist/quarantine for demonstrably broken content, and migration/fresh-run rules.

## Required Outputs

- output and configuration schemas;
- hard-constraint and soft-objective catalogue;
- layered generation pipeline and named stream map;
- constructive guarantees and algorithm rationale;
- validator error taxonomy;
- deterministic repair and fallback policy;
- extracted feature schema;
- seed corpus, sampling strategy, diversity metrics, and thresholds;
- generation performance/resource budgets;
- pacing grammar and theme/content-pack rules;
- debugging/preview/quarantine tools plan;
- tests and production evidence requirements.

## Review Gate

Pass only when:

- hard constraints are constructively guaranteed or automatically proven;
- generation and repair terminate within declared budgets;
- identical inputs reproduce output and diagnostic report;
- fallback rate is below the game’s target and every fallback is observable;
- seed campaigns cover ordinary and extreme feature regions;
- diversity metrics reject near-duplicate statistical texture;
- agent benchmark results correlate with intended difficulty bands;
- generated entities, history, colliders, paths, assets, and effects remain bounded;
- visual dressing cannot change authoritative topology through shared random draws;
- broken seeds become regression fixtures.

## Stop-Ship Failures

- ambient `Math.random` or wall-clock seeding;
- random placement until “it looks okay”;
- unbounded retry;
- reachability assumed from visual inspection;
- key after lock, unavoidable death, disconnected objective, or impossible puzzle;
- retrying with a secret replacement seed;
- only average generation time measured;
- variety claimed from seed count without feature analysis;
- runtime generator blocks authoritative ticks;
- endless worlds retain every generated region in live memory.

## Handoffs

- `game-creative-direction` and `gameplay-progression`: grammar, themes, milestones, pacing.
- `game-architecture` and `deterministic-simulation`: versions, streams, schemas, replay.
- `autonomous-agent-design` and `game-physics`: navigation and movement validity.
- `difficulty-failure-balancing`: map features to target challenge.
- `performance-optimization` and `simulation-qa`: profile tails and run seed campaigns.
