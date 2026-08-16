# AI Maze Escape — Game Design

**Status:** Approved design  
**Fantasy:** A lone intelligence turns darkness into knowledge, then knowledge into a route home.

## Creative Pillars

1. **Discovery is progress:** every meaningful reveal changes the map, plan, or confidence.
2. **Memory matters:** the AI succeeds by building a truthful internal map, not by reading hidden cells.
3. **The maze fights back:** locks, traps, moving threats, fog, and timed changes pressure decisions while preserving at least one valid solution.
4. **Wrong turns create stories:** uncertain choices, recovery, and revised hypotheses are visible and causal.
5. **The exit is earned:** no hidden relocation, forced capture, or guaranteed hint.

## World Model

The authoritative maze is a versioned graph/grid with cells or nodes, passages, doors, keys, clues, traps, checkpoints, threat routes, and one or more exits according to mode. The generator stores the complete truth; the agent observation exposes only visible and remembered state.

Cell knowledge states are hidden, currently visible, remembered-confirmed, remembered-uncertain, or invalidated. Memory can age or become uncertain only under declared mechanics. Public presentation distinguishes the AI’s knowledge from omniscient debug views.

## Generator Grammar

1. Construct a connected topology and select a start/exit whose route satisfies the target feature band.
2. Add optional loops, dead ends, chambers, vertical/layered links, and alternate routes.
3. Place lock/key dependency chains constructively so prerequisites precede locks.
4. Add clues, checkpoints, traps, hazards, threat spawn/routes, and interaction anchors.
5. Validate solution existence/count, safe start, response windows, capacity, path lengths, dependency depth, performance, and content rules.
6. Repair deterministically within a bound or use a known-good fallback while recording the failed seed.

Feature extraction measures size, shortest solution, branching, loops, dead ends, backtrack pressure, chokepoints, dependency depth, visibility, threat exposure, and expected planner workload.

## Game Modes

- **Pure Escape:** exploration and route planning with static hazards.
- **Locks and Keys:** dependency chains and inventory planning.
- **Hunter Maze:** one or more bounded moving threats with telegraphed perception and routes.
- **Memory Fog:** visibility and remembered-state pressure.
- **Gauntlet:** combined authored feature bands and milestone rooms.
- **Chat vs AI:** collective audience complications/opportunities under a pressure budget.

Mode and feature band determine record eligibility.

## Primary Progress

- level/depth across consecutive runs or campaign;
- current maze discovery percentage;
- objective chain completion;
- estimated or known distance to current target where rules permit;
- elapsed logical time and threat pressure;
- escape streak and fastest eligible record.

Discovery is secondary to escape: revealing the entire maze is not always optimal.

## Moment and Tactical Rules

Movement uses fixed grid/kinematic steps. Interactions include move, inspect, collect, unlock, activate, wait/hide, use item, and choose route. Doors, traps, hazards, and threats have deterministic precedence. A move cannot be accepted based on information the agent has not observed.

The AI’s route planner may traverse known safe cells, uncertain frontier edges, or risk states with explicit utility. Hidden truth is used only by validators, threat rules, and replay/debug evidence—not by the normal policy.

## Threats and Hazards

- static trap with visible or discoverable telegraph;
- timed floor/door/environment state;
- patrol monster with deterministic route/perception;
- searching hunter reacting to permitted observations/noise;
- collapsing or one-way passage with declared trigger;
- visibility/fog modifier;
- resource/time pressure.

Every threat has spawn safety, movement budget, perception rules, telegraph, avoidance opportunity, conflict ordering, and terminal semantics. A newly applied audience event cannot create unavoidable immediate capture.

## Progression Bands

- **Orientation:** small readable mazes, low dependency, strong reveal feedback.
- **Exploration:** larger branches/loops, first locks and audience windows.
- **Inference:** partial clues, uncertain memory, multi-step dependencies.
- **Pressure:** moving threats, timers, dynamic doors, route trade-offs.
- **Mastery:** layered/large mazes, combined systems, milestone/boss maze, record chase.

Major milestones change topology, information, dependency, or threat decisions—not only scale.

## Dramatic Patterns

- efficient frontier choices produce a clean escape;
- misleading branch causes costly backtrack and recovery;
- key/door insight converts confusion into rapid progress;
- threat interrupts the planned route and forces a dangerous detour;
- exit is found during a chase or with little time remaining;
- near-record route fails because of a visible mistaken assumption.

Pattern classification comes from events and route history, never hidden scripting.

## Failure and Recovery

Legitimate failures: lethal trap, captured by a rule-valid threat, declared health/resource exhaustion, declared timer expiry, or an irreversible player-state trap caused by legal choices when the mode permits it. Unsolvable generation, missing key, broken door state, AI deadlock, process crash, or replay divergence is a defect/technical result, not a fair loss.

Stuck recovery invalidates routes/hypotheses, selects another frontier, retreats to a known junction/checkpoint through legal movement, or uses a declared resource. It never teleports unless a mode explicitly provides a replayed recovery item.

## Result and Replay

On escape, trace the discovered route, reveal optional omniscient solution comparison after the result, show discovery/backtracking/keys/threat encounters/time/record, and preview the next feature profile. On failure, isolate the rule cause and show the decision/evidence that led there. Technical quarantine uses a separate safe scene.

## Endless Renewal

After each run, level and feature profile advance according to a versioned schedule with periodic milestone mazes, themes, and campaign records. Run state resets; only bounded season/campaign aggregates persist. Generated map and detailed route histories are archived/rolled up rather than retained indefinitely in live memory.
