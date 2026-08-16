# Autonomous Snake — Game Design

**Status:** Approved design  
**Primary fantasy:** A visibly intelligent organism conquers an increasingly hostile grid without closing its own future.

## Creative Pillars

### 1. Legible Intelligence

The snake should look intentional: it anticipates turns, preserves access to its tail, chooses risk when justified, and changes plans after events. Public intent explains goal changes without exposing private reasoning.

**Broken by:** random twitching, unexplained reversals, long idle loops, or a hidden rescue.

### 2. Space Is the Enemy

Growth is success and danger simultaneously. The board should gradually transform from open possibility to a near-complete moving puzzle.

**Broken by:** unlimited empty expansion, teleports that erase constraints, or obstacles unrelated to current space.

### 3. Earned Spectacle

Records, high occupancy, narrow escapes, phase changes, and decisive collisions receive premium treatment. Ordinary food remains satisfying but restrained.

**Broken by:** constant camera shake, flashes, or celebration that makes every bite equally important.

### 4. Renewable Conquest

Seeds, board topology, food objectives, hazards, portals, event patterns, speed bands, and visual themes create different route decisions while preserving the same readable goal.

**Broken by:** cosmetic reseeding with statistically identical paths.

## Authoritative World

The base world is a rectangular integer grid. Each cell is one of:

- free;
- snake head/body/tail;
- solid wall/obstacle;
- food or special food;
- hazard;
- portal entrance/exit;
- temporary effect marker;
- objective/milestone marker where the mode requires it.

The snake is an ordered deque of unique cell coordinates. Movement commits a new head cell and removes the tail unless growth is pending. Rule precedence is explicit:

1. lifecycle/integrity commands;
2. eligible timed effect expiry/start;
3. selected direction validation;
4. portal/path transformation where configured;
5. collision classification;
6. movement/body update;
7. collection/hazard/effect result;
8. progression/score/milestone/result;
9. food/objective spawn and validation;
10. semantic events and checksum.

The common “moving into the current tail cell” case is mode-configured and deterministic; it is legal only when the tail vacates during the same step and no growth prevents removal.

## Primary Progress

- **Length:** current body segments.
- **Occupancy:** snake length divided by eligible playable cells.
- **Milestone:** configured length or occupancy band.
- **Record:** mode/config/version-eligible maximum length/occupancy and optional survival duration.

The HUD permanently prioritizes length and occupancy. Score is secondary and primarily explains bonuses, risk, and comparisons.

## Food and Objectives

### Standard Food

Adds one or configured growth unit, score, semantic cue, and progress. Spawn must satisfy reachability/placement policy.

### Special Food Families

- nutrient cluster: multiple bounded growth opportunities with expiry;
- golden food: high reward with more difficult placement or route pressure;
- stabilizer: removes or reduces an eligible temporary complication;
- multiplier: bounded score/progress modifier, not hidden odds;
- key/objective food: unlocks a portal/gate or completes a phase;
- decoy/choice food: multiple visible options with different trade-offs.

Special food uses authored eligibility and cooldowns. Expiry cannot leave the board without a valid objective.

## Boards and Topology

Board profiles define dimensions, playable mask, fixed obstacles, generator grammar, edge rules, portal support, hazards, visual theme, and difficulty features.

Initial topology families:

- open arena;
- islands and corridors;
- concentric rings;
- chambers with gates;
- moving or phase-shifting barriers at safe boundaries;
- portal lattice;
- shrinking or rotating playable regions only under explicit fair rules.

Generation constructs connected playable space and mandatory route structure first, adds obstacles/hazards/food anchors, validates reachability/clearance, extracts features, repairs deterministically, and falls back to a known-good profile after bounded attempts.

## Hazards

Hazards create strategic pressure without invalid seeds:

- static lethal cells;
- timed pulse cells with telegraph;
- moving blockers on deterministic paths;
- temporary blocked regions;
- trail residues with expiry;
- speed zones;
- visibility/fog presentation effects;
- predator/hostile entity only in later approved mode.

Hazards have telegraph, active, recovery, and cooldown states. A newly activated hazard cannot create an unavoidable immediate death unless the run mode explicitly and transparently defines such a terminal challenge and the placement validator proves a response window.

## Progression Bands

### Band A — Learning the Space

Low occupancy, open routes, normal speed, standard food, strong intent clarity. Purpose: establish competence and current seed identity.

### Band B — Route Trade-Offs

Obstacles, special food, first audience windows, corridor decisions, increased speed or objective pressure.

### Band C — Future-Space Management

Medium/high occupancy, tail-access and region-partition risk, portal/hazard phases, fewer obvious shortest routes.

### Band D — Conquest Crisis

Very high occupancy, cycle/space-filling strategy, rare major events, record comparison, intense but bounded presentation.

### Band E — Resolution or Renewal

Configured conquest objective completes, endless cycle changes board phase while preserving valid state, or a rule-based collision/trap ends the run.

Milestone cadence uses small bites, medium occupancy thresholds, and major phase/record moments. Each major milestone changes at least one decision axis.

## Difficulty Axes

- board dimensions and playable shape;
- obstacle topology, bottlenecks, and region partition risk;
- movement speed and decision deadline;
- food placement risk and expiry;
- hazard type, density, telegraph, and motion;
- portal complexity;
- visibility/information;
- simultaneous objectives;
- audience pressure budget;
- AI compute/search cap by mode;
- penalty for inefficient route/time.

Difficulty never consists solely of speed. Invalid or unreachable content is a defect, not challenge.

## AI Strategy States

- `seek-food`: pursue best safe food route;
- `preserve-space`: reject short route that partitions future space;
- `follow-tail`: maintain survival while food route is unsafe;
- `cycle-fill`: follow or repair a space-filling cycle at high occupancy;
- `escape-hazard`: prioritize immediate validated avoidance;
- `replan`: current assumptions invalidated;
- `fallback-survival`: bounded safe heuristic after budget/solver failure.

The game design exposes these states to presentation through safe intent keys.

## Failure and Victory

### Legitimate Terminal Outcomes

- wall/solid obstacle collision;
- self collision under declared tail rule;
- lethal hazard collision;
- starvation/objective timer expiration in modes that declare it;
- no legal move/trap when all candidates are truly illegal;
- conquest victory at configured occupancy/length/objective;
- endless cycle completion leading to renewal rather than terminal result.

### Non-Game Outcomes

- operator abort;
- incompatible/corrupt restore;
- invariant/replay divergence;
- deployment/host failure that cannot restore.

These are `aborted` or `quarantined`, never counted as normal losses.

## Dramatic Patterns

1. **Mastery:** smooth growth → increasingly narrow routing → cycle strategy → conquest/record.
2. **Recovery:** audience/environment blocks preferred route → tail-follow survival → new opening → regained progress.
3. **Temptation:** risky special food → accelerated growth → partition danger → escape or causal collision.
4. **Pressure Spiral:** repeated inefficient routes → speed/hazard pressure → fallback → terminal trap.
5. **Record Chase:** ordinary start → pace ahead of record → milestone crisis → record set or near-miss.

Seed campaigns track pattern frequency and detect repetitive dominant sequences.

## Anti-Stall and Endless Rules

- No-progress timer counts meaningful food/objective/milestone changes, not movement alone.
- Repeated state/action hashes trigger AI replan/stuck recovery.
- Food spawn validation prevents absent/unreachable objective.
- If no reachable food exists due to a defect, quarantine/repair policy acts; it is not a fair loss.
- Endless mode uses declared phase renewal: theme/topology/hazard rules change at a safe milestone, obsolete transient entities are removed, histories aggregate, and live state remains bounded.

## Run Resolution

1. freeze authoritative result and final checksum;
2. focus decisive cell/path and cause;
3. show result, length, occupancy, duration, milestones, record, mode, and integrity;
4. play bounded replay/highlight;
5. acknowledge relevant audience events without overclaiming causality;
6. preview next seed/profile/theme;
7. automatic countdown and restart.

Target intermission begins short and is adjusted through experiments with comprehension and retention guardrails.

## Content Expansion Seams

Future content can add board profiles, hazard families, food/objective types, snake visual themes, audio themes, approved AI policies, tournament/season structure, and new bounded audience effects without changing the public game module contract. Multiplayer snakes and rich enemies require a separate design/architecture review.
