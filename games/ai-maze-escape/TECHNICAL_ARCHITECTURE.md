# AI Maze Escape — Technical Architecture

**Status:** Approved design  
**Target stack:** TypeScript game module, fixed-step Node.js simulation, grid/graph navigation, PixiJS presentation, shared persistence/audience/telemetry packages.

## Package Boundaries

`src/` separates manifest/config, authoritative state/rules, generation/validation, belief-map and AI policies, threats, influence eligibility, render/audio adapters, snapshot migrations, and headless/testing tools. The package cannot import provider, database, OBS, or operator UI implementations.

## Authoritative State

State includes run/tick/lifecycle, complete maze graph/grid, explorer transform/status/inventory, visibility and discovered-memory representation, doors/keys/clues/checkpoints, hazards/threats, timers/modifiers, progression/record candidate, AI plan/belief metadata, influence runtime, and terminal result. Coordinates and time use integer/fixed units; collections have deterministic order and bounds.

## System Order

1. lifecycle and scheduled commands;
2. timed environment/effect transitions;
3. visibility/perception update permitted for the current step;
4. AI observation and bounded action/fallback;
5. action legality and interaction resolution;
6. movement, doors/items/traps/hazards/threats in stable order;
7. discovery, belief evidence, objective/progression/result;
8. semantic events, render snapshot, checksum, persistence recommendation.

## Generator and Solver Oracle

`world-generation` constructs topology; dedicated streams place dependencies, hazards, threats, clues, and cosmetics. A validator/solver proves start-to-exit solvability under exact rule semantics, key-before-lock order, safe spawn/response, and performance/capacity. The oracle is unavailable to the normal AI and public render before result. Bounded repair/fallback preserves diagnostics and the original failed seed identity.

## AI and Threats

The AI uses a serializable belief graph, bounded known-space search, frontier utility, dependency planning, threat prediction, plan invalidation, stuck detection, and deterministic fallback. Threats use versioned patrol/search/perception policies and stable conflict order. Remote model proposals are optional cold-path inputs only for approved puzzle hypotheses.

## Random Streams

`world-generation`, `dependencies`, `hazards`, `threat-policy`, `agent-policy`, `event-director`, `audience-tiebreaks`, and non-authoritative `cosmetic-variation`. Draw ownership/version is recorded; cosmetic draws cannot perturb solutions or AI.

## Influence and Presentation

Effects receive prevalidated candidate IDs/parameters and pure game-state eligibility. No arbitrary chat coordinate or raw provider payload reaches authority. Render snapshots expose only public knowledge plus semantic entities/events, progress, intent, votes, and safe status; hidden maze truth remains debug/post-result only.

## Snapshot and Replay

Snapshots include complete truth and belief state, stream states, versions/hashes, tick/sequence, checksum, and durability boundary. Restore validates graph/dependency consistency, explorer/threat state, event continuity, and replay checkpoints. Unsupported rule/generator changes require a fresh run.

## Performance and Reliability

Budgets cover generation/solver tails, known-space search/frontiers, threat count/pathing, visibility updates, map memory, render cells/routes/fog, snapshot size/restore, queues, and long-run histories. Use region hierarchy, incremental visibility/path caches, level of simulation for distant threats, bounded route history, and quality tiers. Optional services remain off the tick path; divergence quarantines.

## Security and Acceptance

Content/config is schema-validated and cannot execute code. Public output excludes raw text, identities, payment, secrets, prompts, and debug truth. Architecture exits foundation when headless generation, oracle validation, partial-observation run, snapshot/restore/replay, render snapshot, and terminal restart work through shared contracts with identical checksums.
