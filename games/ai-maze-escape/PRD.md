# AI Maze Escape — Product Requirements Document

**Status:** Approved  
**Primary record:** Highest escaped level; fastest verified escape within a maze-feature band  
**Core promise:** Viewers watch an autonomous explorer discover an unknown maze, form and revise a route plan, survive escalating threats, and find a hidden exit.

## Product Vision

AI Maze Escape is an endlessly renewable partial-observation game for livestreams. Each run generates a deterministic maze with a guaranteed solution, then limits the explorer’s knowledge to visible and remembered cells. The AI must explore frontiers, collect keys, unlock doors, interpret clues, avoid traps and moving threats, and reach the exit. Levels grow across topology, scale, uncertainty, locks, hazards, time pressure, and audience influence. Runs automatically resolve, replay the discovered route, update records, and begin again.

## Viewer Promise and Principles

Within ten seconds, a viewer can identify the explorer, known map, unexplored frontier, current objective, level, time/danger, and record. The AI’s visible map and intent must make exploration feel reasoned rather than random.

Principles:

1. Unknown space creates tension; the solution remains valid and auditable.
2. Exploration decisions are visible through frontier, route, memory, and hypothesis cues.
3. Difficulty adds decisions, not only maze size.
4. Audience influence changes pressure or information within bounded valid rules.
5. Wrong turns and failure have understandable causes; technical defects do not count as losses.
6. The game continues without remote models or audience providers.

## Non-Goals

- unrestricted natural-language control;
- hidden exit relocation after generation;
- unsolvable mazes presented as fair difficulty;
- remote-model dependency for movement;
- paid guaranteed hints, escape, capture, or records;
- storing every discovered cell/event for unbounded persistent worlds;
- raw chain-of-thought display.

## Core Loops

- **Moment:** observe visible cells → update map → choose legal move/action → reveal consequences.
- **Tactical:** explore a frontier, acquire a key/clue, bypass a hazard, or evade a threat.
- **Run:** discover the exit route and escape before death/capture/time failure.
- **Stream:** result and route replay → record → next maze preview → automatic restart.
- **Audience:** choose bounded information, environment, or threat modifier → apply at safe window → show adaptation and consequence.

## Functional Requirements

### Rules and Generation

- `FR-MAZ-001`: Every run MUST be generated from versioned configuration and named seeded streams.
- `FR-MAZ-002`: The generator MUST guarantee at least one valid start-to-exit solution under the authoritative key, door, hazard, and movement rules.
- `FR-MAZ-003`: Keys MUST be reachable before their required locks; one-use/ordered dependencies MUST be validated.
- `FR-MAZ-004`: Start, exit, checkpoints, clues, hazards, and moving-threat spawns MUST satisfy clearance and safe-response constraints.
- `FR-MAZ-005`: Generation and repair MUST terminate within bounded attempts and use a known-good fallback with diagnostics.
- `FR-MAZ-006`: Visibility, memory, fog, discovered-map state, doors, inventory, health/time, and threat state MUST be authoritative and replayable.
- `FR-MAZ-007`: Terminal results MUST distinguish escape, trap/death/capture, declared timer failure, operator abort, and integrity quarantine.
- `FR-MAZ-008`: Result, route replay, records, intermission, and next run MUST complete automatically.

### AI

- `FR-MAZ-AI-001`: The AI MUST act only on permitted observations and remembered information.
- `FR-MAZ-AI-002`: The AI MUST maintain a bounded belief/map model containing discovered cells, frontiers, doors, keys, hazards, threats, and confidence/age.
- `FR-MAZ-AI-003`: The policy MUST combine legal safety, pathfinding on known space, frontier utility, dependency planning, threat avoidance, stuck detection, and deterministic fallback.
- `FR-MAZ-AI-004`: The AI MUST revise plans after new evidence, failed hypotheses, audience events, moving threats, or blocked paths without oscillating indefinitely.
- `FR-MAZ-AI-005`: Optional model-assisted puzzle hypotheses MUST be asynchronous, validated, bounded, and replaceable by deterministic fallback; movement continuity MUST NOT depend on them.
- `FR-MAZ-AI-006`: Public intent MUST expose concise validated states such as exploring, returning for key, testing route, evading threat, or fallback—not raw reasoning.

### Progression and Content

- `FR-MAZ-PROG-001`: Level/depth is the primary persistent progress, with current maze discovery and route objective secondary.
- `FR-MAZ-PROG-002`: Difficulty MUST scale across topology, size, branching, loops, vertical/layered sections, visibility, dependency depth, threats, hazards, timers, and objective concurrency.
- `FR-MAZ-PROG-003`: Milestones and bosses/special mazes MUST alter rules or decisions and have distinct presentation.
- `FR-MAZ-PROG-004`: At least three dramatic patterns—efficient solve, wrong-turn recovery, and threat-driven escape/near-failure—MUST occur within approved distributions.
- `FR-MAZ-PROG-005`: Generated feature and route diversity MUST be measured; different seeds alone are insufficient.

### Broadcast and Audio

- `FR-MAZ-UX-001`: The stream MUST permanently show level, known-map progress, current objective, time/danger, intent, and record.
- `FR-MAZ-UX-002`: Known, remembered, uncertain, hidden, locked, hazardous, and exit-relevant states MUST be visually distinct without relying on color alone.
- `FR-MAZ-UX-003`: Camera/map presentation MUST preserve orientation and reveal discoveries clearly at mobile size.
- `FR-MAZ-UX-004`: Semantic events MUST drive footsteps/movement, reveal, key, lock, hazard, threat, chase, exit, failure, and result cues with accessible alternatives.
- `FR-MAZ-UX-005`: Countdown, exploration, chase, vote, result, route replay, intermission, provider-degraded, recovery, maintenance, and clean-feed scenes MUST exist.

### Audience Interaction

- `FR-MAZ-INT-001`: Inputs MUST use the shared gateway, moderation, idempotency, audit, and Event Director.
- `FR-MAZ-INT-002`: Launch effects MUST include bounded hint/reveal, eligible door state, fog, clue trade-off, threat modifier, obstacle/event, theme, and next-maze choice.
- `FR-MAZ-INT-003`: No effect MAY make the current maze unsolvable, relocate the exit secretly, create unavoidable immediate capture, or guarantee escape.
- `FR-MAZ-INT-004`: Votes MUST use pre-authored options, deterministic windows/ties, caps/cooldowns, visible application, and replay.
- `FR-MAZ-INT-005`: The game MUST remain complete with all interactions disabled.

### Operations

- `FR-MAZ-OPS-001`: Runs MUST persist versions, seed streams, map/discovery state, events, snapshots, results, route, records, interactions, and integrity checksums.
- `FR-MAZ-OPS-002`: Snapshot restore and event replay MUST match uninterrupted state and route outcomes.
- `FR-MAZ-OPS-003`: Supervisor/output health MUST detect stalled exploration, repeated loops, process/provider/render/audio/persistence failure, and resource growth.
- `FR-MAZ-OPS-004`: Operators MUST have typed audited controls for interactions, safe scene, snapshot, verified restore, fresh run, component restart, rollback, and halt.

## Non-Functional Requirements

- identical version/config/content/seed/event input produces matching checksums;
- pathfinding/planning and generation meet declared p99/worst budgets;
- discovered-map, histories, caches, render/audio resources, and queues remain bounded;
- goal/frontier/danger/result remain understandable on mobile and with audio muted;
- raw provider/payment/text/private reasoning never enters game/public state;
- accelerated campaigns cover a statistically justified set of feature strata and pathological seeds;
- a 72-hour production-candidate soak and seven-day canary are required before R5.

## Launch Effect Set

- reveal one eligible frontier region;
- grant a bounded directional clue or route-quality hint;
- open or close one eligible non-critical door for a fixed window;
- add bounded fog/visibility pressure;
- activate a validated threat route or chase modifier;
- place one safe temporary obstacle or shortcut;
- choose between clue, key, time, or risk/reward options;
- select next maze profile/theme.

Paid support maps only to eligible disclosed effects or capped voting privileges, never guaranteed escape/capture.

## Success Metrics

- ten-second comprehension;
- escape, failure, time, route efficiency, discovery, backtrack, dependency, and level distributions;
- generator validity/repair/fallback/diversity;
- AI planning latency, fallback, stuck/loop, hypothesis revision, threat recovery;
- meaningful discovery/event cadence and dramatic-pattern diversity;
- interaction status, duplicate application, consequence visibility, provider degradation;
- tick/frame/audio/output/recovery and resource stability.

## Launch Acceptance

R5 requires all six phase gates, deterministic solution/replay integrity, validated partial-observation AI, statistically supported difficulty and diversity, safe interaction effects, readable accessible broadcast, stable long-run resources, verified recovery and rollback, current provider/security/privacy/moderation evidence, a 72-hour soak, seven-day canary, and independent production-readiness `PASS`.
