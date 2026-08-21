# Technical Architecture — AI vs 1,000 Floors

## Authority boundary

Only the simulation runtime may advance gameplay. Presentation, audio, providers, analytics, storage adapters and operator tools consume versioned contracts and return normalized commands; they cannot directly mutate state.

## Ordered authoritative tick

1. lifecycle/operator command;
2. eligible scheduled influence;
3. AI observation and bounded decision;
4. action legality;
5. player movement/interaction;
6. player combat;
7. enemies in stable ID order;
8. hazards/status;
9. pickups/objective/exit;
10. progression/result/checkpoint;
11. semantic events, invariants and checksum.

## Determinism

- integer ticks and values;
- `NamedRng` streams for topology, enemies, hazards, rewards, audience ties and cosmetics;
- initial generation draws remain in the authoritative RNG snapshot;
- stable entity/action ordering;
- no `Math.random`, `Date.now`, `new Date`, `setTimeout` or `setInterval` in authority paths;
- snapshot includes state, RNG streams, event window, policy and runtime restart metadata;
- restore validates version, checksum, config, floor invariants and state ranges.

## Current Phase 1 modules

- `config/schema.ts`: defaults and hard bounds;
- `state/types.ts`: serializable state and public agent status;
- `generation/floor.ts`: path-first generator;
- `generation/validator.ts`: diagnostics and repair;
- `ai/pathing.ts`: bounded BFS;
- `ai/fallback.ts`: continuity policy;
- `rules/step.ts`: authoritative reducer;
- `runtime/run.ts`: lifecycle and event sequencing;
- `persistence/snapshot.ts`: checksummed restore;
- `testing/invariants.ts` and `testing/headless.ts`: evidence.

## Data excluded from authority

Wall-clock timestamps, renderer/audio objects, DOM/canvas handles, provider payloads, viewer names/text, payment data, secrets, callbacks, sockets, database clients, analytics exporters and model prompts/responses.

## Versioning

State schema `1`; deterministic version `floors-r1-v1`; Game 4 R1 version `0.1.0-r1`. Any outcome-changing order, table, RNG ownership or numeric rule increments deterministic/config/content versions and invalidates stale replay evidence.

## Performance budget path

Phase 1 records a baseline. Phase 2 profiles generation, pathing, rules, snapshot and campaign tails; authoritative tick p99 target is below 8 ms, planner p99 below 5 ms, generation p99 below 20 ms, snapshot below 25 ms/512 KiB and accelerated campaign throughput above 10,000 logical ticks/s on documented CI after optimization.
