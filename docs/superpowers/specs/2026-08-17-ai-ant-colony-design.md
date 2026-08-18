# AI Ant Colony / Ecosystem — Approved Design

## Product intent

AI Ant Colony is an autonomous, always-on livestream simulation in which a colony scouts, forages, excavates, raises brood, defends its queen, adapts to weather and predators, and either reaches ecological ascension or collapses. The objective must be understandable within ten seconds, while the colony's long-term history, individual ant activity, pheromone trails, crises, recoveries, and audience votes create layered spectator stories.

The game follows the Autonomous Snake reference architecture: one deterministic authoritative simulation, immutable presentation snapshots, provider-neutral audience commands, reproducible replay/snapshots, bounded operations, evidence-gated release governance, and automatic result/intermission/restart. Snake code is a pattern source only; Ant Colony owns its rules and never imports another game's private implementation.

## Readiness truth

The implementation can complete all six software phases and reach an R4 operations candidate. R5 production readiness remains blocked until real production-reference audiovisual/capacity evidence, credentialed YouTube/Twitch operation, external safety/accessibility/supply-chain review, witnessed drills, a real 72-hour endurance run, a real seven-day guarded canary, and an independent exact-candidate review pass. No CI simulation may be represented as that external evidence.

## Spectator loop

1. **Read the colony:** population, queen health, food, brood, nest depth, strategy, threat, day/season and progress are always visible.
2. **Watch purposeful motion:** workers follow pheromone fields, scouts discover resources, diggers expand tunnels, nurses tend brood and soldiers intercept threats.
3. **Anticipate a crisis:** weather, resource pressure, predators, crowding and brood demand create readable risk.
4. **Observe adaptation:** the strategic director switches between forage, expansion, defense, recovery and brood-boom modes.
5. **Influence safely:** viewers vote on bounded, disclosed interventions that cannot guarantee survival, extinction, records or prizes.
6. **Celebrate milestones:** first harvest, new chambers, population bands, queen recovery, predator defeats and ascension produce semantic broadcast moments.
7. **Continue automatically:** extinction, ascension or legitimate stagnation enters a result scene, intermission and deterministic fresh run.

## Authoritative architecture

```text
normalized commands
  -> lifecycle and audience eligibility
  -> environment/event director
  -> queen and brood progression
  -> strategic colony planner
  -> per-ant observation and bounded policy
  -> stable intent/conflict resolution
  -> movement, excavation, foraging and combat
  -> predator actions
  -> pheromone deposit/diffusion/decay
  -> progression, result, semantic events and checksum
  -> immutable render snapshot / durable evidence
```

Only `AntColonyRuntime` owns mutable gameplay state. Rendering, audio, browser polling, provider adapters, persistence writers, analytics and operator controls consume snapshots/events or submit validated commands. They cannot mutate authority directly.

## World model

The world is an integer grid with a declared surface row. Cells use compact numeric tile codes:

- `0 soil`
- `1 tunnel`
- `2 surface`
- `3 nest chamber`
- `4 rock`
- `5 water pocket`

Parallel bounded integer arrays hold food, moisture, discovery and four pheromone fields: home, food, alarm and excavation. All arrays have exactly `width * height` entries and are included in replay checksums. Generation is constructive: the initial nest, queen chamber and surface entrance are carved first; food and obstacles are layered afterward; validation proves an entrance-to-nest route, legal initial placements, resource bounds and maximum entity budgets. Generation has no retry loop.

## Colony and entities

The queen is a dedicated entity with health, egg cadence and production statistics. Ants have stable integer IDs, caste, position, energy, health, carrying state, task, goal, intent summary, confidence, stuck counter and deterministic movement bias. Brood has stable IDs and exact egg, larva and pupa ages. Predators have stable IDs, kind, position, health and intent.

Ant castes:

- **worker:** primary forage and transport;
- **scout:** broad exploration and resource discovery;
- **nurse:** brood and queen support;
- **digger:** controlled excavation and chamber building;
- **soldier:** alarm response and predator interception.

Cells have a configured ant capacity rather than exclusive occupancy. Movement conflicts are resolved using stable priority and entity ID ordering. No collection is unbounded.

## Determinism envelope

Gameplay truth reproduces from game/deterministic/schema/config/content versions, seed, normalized command sequence and tick count. Authoritative time is integer ticks. Randomness uses the shared `NamedRng` with isolated streams for world, colony, brood, predators, event director and audience ties. Iteration and conflict reduction use stable numeric ordering. Presentation-only particles, interpolation and generated audio may be cosmetic and cannot feed authority.

Checksums include all outcome-relevant state, queued commands, named RNG state and next event sequence. Snapshot restore validates metadata, checksum, array lengths, entity IDs, coordinates, resource ranges, lifecycle consistency and event continuity. Divergence or corrupted evidence produces a typed quarantine result.

## Autonomous intelligence

The policy stack is deliberately authored rather than remote-model dependent:

1. legality and tile/capacity filter;
2. emergency responses for starvation, queen danger and adjacent predators;
3. caste-specific local utility scoring over legal neighboring actions;
4. pheromone-guided navigation and deterministic direction bias;
5. colony strategy selection at bounded intervals;
6. safe fallback to rest, return-home or local exploration;
7. stuck/oscillation detection and goal invalidation.

The public intent is a bounded template such as “Returning food to the queen chamber” or “Reinforcing the eastern alarm trail”; hidden scoring details and chain-of-thought are never exposed.

## Ecosystem and progression

Day, season and weather derive from logical ticks. Food regrows within caps; rain changes moisture and surface abundance; drought raises consumption pressure; predators enter under bounded cooldown/cap rules. Brood consumes stored food through exact stage durations. Colony strategy and caste recruitment react to food-per-ant, brood load, tunnel capacity, queen health, threat and progress.

Progress bands are `founding`, `growing`, `established`, `thriving` and `ascendant`. Ascension requires population, nest and reserve thresholds together; it cannot be produced by one audience effect. Extinction requires queen loss or complete loss of viable ants and brood. No-progress timeout yields a legitimate `stagnation` game result, not a technical timeout.

## Audience influence

The provider-neutral gateway accepts normalized events with opaque viewer tokens, provider IDs, idempotency keys, option IDs and bounded entitlement weight. It applies schema validation, moderation/sanctions, age windows, per-viewer/per-window rules, global caps, deduplication and emergency disable before a command can be scheduled.

Effect catalogue:

- nectar bloom;
- gentle rain;
- scout surge;
- tunnel direction vote;
- alarm beacon;
- shade canopy;
- fungus-garden pulse;
- predator warning;
- colony-theme vote (cosmetic contract only);
- bounded challenge pressure.

Every effect has eligibility, candidate generation, maximum magnitude, cooldown, duration, expiry, reversal and audit semantics. Effects cannot directly set terminal state, kill the queen, create target population, erase all predators or guarantee records.

## Broadcast experience

The browser source is a responsive Canvas 2D ant-farm cross-section with premium dark naturalistic styling, animated pheromone glows, nest layers, readable ant caste accents, predator silhouettes, weather ambience and event pulses. The HUD prioritizes colony health, population, food, brood, strategy, threat and progress. A side narrative rail shows validated intent and recent semantic events. Desktop 16:9, phone landscape, clean feed, high contrast, reduced motion, muted audio and captions are first-class states.

Operator controls are hidden unless `?controls=1`. They provide pause/resume, speed, restart, effect-disable and safe-scene controls without sharing authority with the public page. Generated Web Audio cues are semantic and optional; muted or unavailable audio never changes gameplay.

## Reliability and operations

The software phase provides checksummed append-only command/event/audit records, bounded snapshots, single-writer generation fencing, exact snapshot restore, deterministic replay, older-snapshot fallback, quarantine on corruption/divergence, bounded queues/histories, health signals, output-stall classification, crash-loop protection and typed operator commands. File-backed scripts use atomic temp-write/rename patterns and never place secrets in evidence.

The supervisor distinguishes optional provider outage, recoverable runtime replacement, output degradation, integrity quarantine and security/policy rejection. Autonomous play remains complete with audience providers absent for the full run.

## Release governance

The release manifest freezes source identity, deterministic/config/content/presentation versions and evidence checksums. The assessor verifies software evidence against the exact candidate, rejects stale or synthetic external claims, and reports `PASS`, `BLOCKED_EXTERNAL` or `FAIL`, highest truthful readiness and explicit blockers. Material changes invalidate canary and dependent evidence.

## Performance budgets

Reference software budgets for a 64 x 40 world and 384 ants:

- authoritative p95 tick under 12 ms on the CI reference host;
- maximum authoritative tick under 40 ms in the bounded campaign;
- snapshot payload under 2.5 MB;
- live in-memory events at or below configured capacity;
- per-ant policy evaluates at most five actions per tick;
- pheromone work is linear in cell count with double-buffered integer arrays;
- no network, file I/O, model inference or unbounded path search in the tick;
- browser source has no horizontal overflow at 1920 x 1080 or 640 x 360.

These are software/reference gates, not claims about a production encoder or GPU.

## Test and evidence design

Each phase adds focused Node tests plus full regressions:

- Phase 1: config, generation, invariants, deterministic twin runs, snapshot restore, lifecycle restart and headless corpus;
- Phase 2: caste legality, pheromone guidance, strategy changes, brood, predators, ecosystem campaign, diversity and performance;
- Phase 3: immutable/privacy-safe render snapshots, camera/audio semantics, responsive layouts, browser capture, accessibility and recovery;
- Phase 4: validation, moderation, dedupe, deterministic votes, bounded effects, zero-audience and provider-outage campaigns;
- Phase 5: event/audit integrity, writer fencing, recovery, corruption quarantine, bounds, supervisor/output health and chaos;
- Phase 6: release manifest, exact evidence binding, final campaigns, capacity/endurance semantics, drills, canary invalidation and fail-closed readiness assessment.

## Phase gates

1. **R1 deterministic foundation:** one complete reproducible headless run, invariants, snapshot/restore and automatic restart.
2. **R2 gameplay candidate:** credible colony intelligence, ecosystem, progression and campaign evidence with zero P0/P1 findings.
3. **R2 broadcast candidate:** premium accessible browser source and immutable presentation boundary.
4. **R3 interaction candidate:** provider-neutral, moderated, idempotent, bounded and replayable audience influence.
5. **R4 operations candidate:** durable authority, verified recovery, bounded resources, output protection and audited controls.
6. **R4 software-complete candidate / R5 blocked externally:** exact-candidate governance and fail-closed readiness machinery with honest external blockers.
