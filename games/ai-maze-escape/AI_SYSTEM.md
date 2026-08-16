# AI Maze Escape — Autonomous AI System

**Status:** Approved design  
**Agent objective:** Reach the exit using only permitted visibility, memory, inventory, and threat information while remaining within deterministic planning budgets.

## Observation and Belief State

The authoritative game owns complete maze truth. The agent receives a serializable observation containing current position/orientation, visible cells/passages/entities, remembered map with confidence and last-seen tick, discovered frontiers, doors/locks, keys/items/clues, current objective, health/time/resources, audible/visible threat evidence, mode/modifier state, and recent actions/events needed for loop detection.

The belief map distinguishes confirmed open/wall, uncertain memory, unknown frontier, blocked door, suspected hazard, last-known threat position, and invalidated hypothesis. Hidden exit, undiscovered keys, future threat actions, provider data, and omniscient solver information are excluded.

## Action Set

- move through one legal adjacent passage;
- inspect/interact with a visible cell/object;
- collect/use/drop an approved item;
- unlock/open/close an eligible door;
- wait/hide when the mode permits;
- choose a target frontier, key, checkpoint, clue, exit, or safe region;
- deterministic emergency evasion/fallback.

Actions are validated against current authoritative state and fail atomically when stale or illegal.

## Policy Stack

1. **Hard legality and survival:** reject walls, locked passages without capability, active lethal traps, invalid inventory use, and immediate threat-capture states when a legal alternative exists.
2. **Reflex/evasion:** bounded response to visible or predicted near-term threat/hazard.
3. **Known-space pathing:** stable BFS/A* or time-aware search through confirmed traversable graph with explicit expansion budget.
4. **Frontier exploration:** score frontier paths by information gain, distance, branch/dead-end risk, dependency relevance, threat exposure, resource/time cost, and repetition.
5. **Dependency planner:** maintain goals and prerequisites for keys, doors, clues, checkpoints, and exit conditions.
6. **Belief revision:** update confidence from new observations, invalidate stale assumptions, and replan using hysteresis.
7. **Strategic modes:** explore, retrieve-key, unlock-route, follow-clue, evade-threat, retreat-safe, search-exit, verify-hypothesis, and fallback.
8. **Deterministic fallback:** choose the safest legal move toward an unvisited/low-risk frontier or known safe junction; if none exists, use the best legal survival action.

## Partial-Observation Integrity

The policy may query only the belief graph and visible entities. Oracle solution data is confined to generation validation, tests, difficulty analysis, and post-result replay comparison. Automated tests fail if hidden cells or future events enter the agent observation or scoring functions.

## Threat Prediction

Threat models use only declared mechanics and observed evidence: known patrol route segment, last-seen position/velocity, hearing/noise, line of sight, search state, and uncertainty growth. Predictions are bounded horizons with conservative risk; they cannot read the threat’s hidden future random choices.

## Stuck and Hypothesis Recovery

Detect repeated node/action cycles, unchanged discovery/objective over a bounded window, repeated locked-route attempts, frontier oscillation, unreachable current goal in the belief graph, threat evasion loop, planner timeout, and map inconsistency.

Recovery escalates through route invalidation, alternate frontier, return to junction/checkpoint, dependency-plan rebuild, uncertainty reset for contradicted cells, safe wait/evasion, and deterministic fallback. An authoritative unsolvable state triggers content repair/quarantine, not teleport or a fair-loss classification.

## Optional Model Assistance

The reference movement and key/door logic are deterministic. A later puzzle mode may request a structured hypothesis from a remote model outside the hot path. Requests are minimized, privacy-reviewed, deadline/token/cost/concurrency limited, schema-validated, stale-aware, and treated as candidates. The deterministic planner remains capable for the full run, and raw chain-of-thought is neither stored nor displayed.

## Public Intent

Approved summaries include: exploring frontier, returning for key, testing door route, following clue, searching for exit, evading hunter, retreating to safe junction, revising map, and fallback navigation. Intent updates only on meaningful plan changes and may show confidence/evidence band without internal search traces.

## Budgets and Scheduling

Declare movement/decision cadence, path expansion p99/max, frontier candidates, belief-map memory, threat rollout horizon, replan frequency, and global workload for all entities. Large mazes use hierarchical regions, incremental path caches, bounded frontier sets, and deterministic invalidation. Optional model work never occupies the authoritative deadline.

## Evaluation

Seed strata cover trees/loops/chambers/layers, short/long solutions, many dead ends, deep locks, visibility limits, moving threats, one-safe-route states, misleading but fair clues, audience modifiers, restore mid-chase, and known regressions.

Metrics: escape/failure/time/discovery/backtrack, route efficiency versus oracle after result, frontier information gain, dependency-plan success, legal actions, decision latency/expansions, replan/stuck/fallback, threat encounters/recovery, hidden-information leakage, strategy diversity, and replay checksums.

## Acceptance

The AI passes when it never uses hidden truth, meets decision budgets at maximum approved maze size, solves the validated benchmark bands within target distributions, revises contradicted plans without indefinite oscillation, survives full runs without remote services, handles threats and dependencies causally, emits accurate public intents, and reproduces actions/results from recorded inputs.
