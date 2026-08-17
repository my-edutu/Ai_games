# Infinite Tower Climb — Design Specification

**Status:** Approved for autonomous execution under the catalogue mandate  
**Game:** Catalogue Game 3  
**Slug:** `infinite-tower-climb`  
**Primary hook:** **HOW HIGH CAN THE AI CLIMB BEFORE THE TOWER BREAKS IT?**

## 1. Product Goal

Build a premium autonomous 2D action-platformer for continuous YouTube/Twitch broadcasting. An AI climber ascends an endless deterministic tower, crosses streamed floor chunks, fights enemies, avoids traps, chooses upgrades, defeats milestone guardians, and attempts to set height and streak records. Runs must fail for causal game reasons, recover automatically from technical faults, and restart without operator intervention.

The stream must answer within ten seconds:

1. current floor and height;
2. next checkpoint or boss;
3. health, stamina and immediate danger;
4. current AI intent and build;
5. record comparison;
6. the next bounded audience decision.

## 2. Chosen Approach

### Recommended: deterministic kinematic platformer

Use a fixed-step custom kinematic controller with integer fixed-point positions and velocities, swept axis-aligned collision, one-way platforms, deterministic moving platforms, authored hazards and bounded projectiles. This gives precise controls, stable replay and testable edge cases without importing a full rigid-body engine.

### Rejected alternatives

- **General-purpose physics engine:** unnecessary solver complexity, cross-host determinism risk and harder simultaneous-contact reconciliation.
- **Grid-only movement:** excellent determinism but insufficient motion expression, anticipation and platforming spectacle.
- **Remote-model controller:** unacceptable hot-path dependency; language models may later propose build themes or commentary but never control authoritative movement.

## 3. Core Run Loop

1. Generate the next validated floor chunk from the run seed, tower theme, difficulty band and content version.
2. Spawn the climber at a verified non-overlapping checkpoint.
3. Produce a legal observation containing visible geometry, hazards, enemies, pickups and allowed lookahead.
4. Select a strategic objective: advance, recover, collect, fight, wait for timing, use ability or retreat.
5. Produce a bounded short-horizon movement plan and validate the action.
6. Advance fixed-step physics, contacts, combat, hazards, pickups and progression in stable order.
7. Commit completed chunks, update height, build and records, then stream the next chunk.
8. At milestones, enter an upgrade room, guardian floor or audience decision window.
9. Resolve death, fall, timeout, guardian defeat, integrity quarantine or operator abort with a typed result.
10. Show decisive replay, build summary, record delta and next-run preview, then restart automatically.

## 4. Authoritative Physics

- Coordinate unit: 1 world unit = 1/1000 logical pixel.
- Fixed step: 50 milliseconds, 20 authoritative ticks per second.
- Player collider: swept AABB with explicit standing, airborne, wall-contact, dash and hurt states.
- Geometry: solids, one-way platforms, ladders/launch pads, moving platforms, hazards, checkpoints, doors and exits.
- Velocity, acceleration, gravity, jump impulse, dash speed and knockback are integer fixed-point values.
- Collision order: commands → abilities → acceleration → integration → swept X → swept Y → platform carry → contacts → combat → triggers → consequences → quantization → invariants.
- Outcome-critical fast movement uses swept collision; no unbounded substeps.
- Simultaneous contacts are sorted by semantic priority and stable entity ID.
- Spawn/restore must validate non-overlap or use the declared checkpoint recovery search.
- NaN, overflow, excessive velocity, unresolved penetration or out-of-bounds truth becomes technical quarantine, never a normal loss.

## 5. Procedural Tower

The tower uses deterministic reusable chunks with connectors and validation metadata.

Launch themes:

- Foundry — conveyors, crushers and heat vents;
- Ruins — crumbling ledges, spikes and dart traps;
- Storm — wind lanes, lightning telegraphs and moving lifts;
- Clockwork — timed gears, doors and rotating hazards;
- Void — disappearing platforms, portals and gravity pulses.

Chunk families include traversal, timing, combat, recovery, treasure, upgrade, checkpoint, guardian approach and guardian arena. The generator must validate:

- connector compatibility;
- traversability under the current movement kit;
- minimum reaction windows;
- safe spawn and checkpoint regions;
- no unavoidable damage or fall;
- bounded entity/contact counts;
- reachable required pickups and exits;
- no repeated chunk pattern beyond configured limits.

Only the current chunk, adjacent lookahead and bounded history remain in live authority. Old chunks compact into summaries and replay evidence.

## 6. Autonomous Climber

Policy stack:

1. legality and immediate-death filter;
2. reflex layer for ledges, projectiles, crush zones and telegraphed hazards;
3. tactical utility evaluation over short movement sequences;
4. route planner over platform/connector nodes;
5. strategic goal manager for health, pickups, combat, checkpoints and record risk;
6. deterministic emergency fallback.

The agent observes only allowed local geometry and telegraphs. It stores a bounded platform graph, current objective, route, confidence band, risk budget, build synergies, recent states and invalidation reason. It detects oscillation, repeated failed jumps, no-height progress and unsafe route churn.

Public intent is templated, for example: `Crossing wind lane`, `Waiting for crusher cycle`, `Retreating to checkpoint`, `Committing to guardian`, or `Fallback: safe landing`.

## 7. Combat and Build Progression

The climber has health, stamina, a primary attack, dash and one equipped active ability. Combat remains kinematic and deterministic: melee arcs, bounded projectiles, telegraphed enemy attacks, invulnerability windows and typed damage sources.

Upgrade families:

- mobility: air control, extra jump charge, wall recovery, dash recharge;
- survival: shield, regeneration after checkpoint, hazard resistance;
- offense: attack reach, projectile, critical window, guardian damage;
- utility: pickup magnet, map preview, safer checkpoint recovery;
- risk: score multiplier with reduced healing or higher enemy pressure.

Upgrade choices use deterministic weighted options and synergy rules. No build may make all future content impossible or guarantee an endless run.

## 8. Audience Influence

Provider-neutral fixed-token votes and bounded eligible effects:

- choose next tower theme;
- reveal one upcoming safe route;
- grant a temporary shield or stamina refill;
- increase wind, enemy density or hazard cadence within validated limits;
- activate a treasure detour;
- choose between two upgrade families;
- add a temporary moving platform or remove one optional obstacle;
- trigger a disclosed risk/reward challenge;
- choose guardian modifier;
- enable Chat vs AI challenge rounds.

Every candidate is prevalidated for traversability, reaction time, pressure cap, expiry, reversal and exactly-once application. Audience input cannot directly move the player, set health to zero, remove the only route, guarantee a record, guarantee death, relocate a checkpoint secretly or choose the terminal result.

## 9. Broadcast Experience

Visual direction: high-contrast neon expedition through a dark monumental tower. The climber and immediate route use the strongest luminance; hazards use shape plus color; distant architecture supplies depth without obscuring collisions.

Required scenes:

- countdown and run reveal;
- normal ascent;
- danger and near-fall;
- checkpoint;
- upgrade choice;
- guardian floor;
- audience window and acknowledgement;
- record break;
- death/fall/result;
- replay and next-run preview;
- provider degraded;
- safe recovery/quarantine;
- clean feed.

HUD hierarchy:

1. floor/height and next milestone;
2. health/stamina and danger;
3. record delta and streak;
4. AI intent and build tags;
5. contextual vote or upgrade card;
6. captions and truthful provider/recovery status.

Desktop, phone-landscape, reduced-motion, reduced-flash, high-contrast, muted and clean-feed layouts are mandatory. Presentation consumes immutable render snapshots and never changes authority.

## 10. Architecture

Game-owned modules:

- `config`: validated rules and tuning;
- `state`: authoritative schemas and invariants;
- `generation`: chunks, tower streaming and oracle validation;
- `physics`: fixed-point integration, swept collisions and contacts;
- `combat`: attacks, damage and enemies;
- `ai`: observation, platform graph, utility policy and stuck recovery;
- `rules`: ordered authoritative step;
- `runtime`: lifecycle, events, snapshots and automatic restart;
- `influence`: bounded audience candidates and application;
- `presentation`: privacy-safe render snapshot, layout, camera and audio model;
- `operations`: health, drills and chaos campaign;
- `release`: exact-candidate validation and readiness score;
- `testing`: headless campaigns and invariants.

The game may import public platform packages but may not import another game’s private implementation or provider SDKs.

## 11. Failure and Recovery

- Invalid generated chunk: quarantine content and regenerate with a deterministic fallback seed.
- AI budget or policy failure: deterministic safe-landing fallback.
- Optional provider/moderation outage: close interaction windows; autonomous ascent continues.
- Renderer/audio failure: intentional safe scene and rebuild from current render snapshot.
- Persistence uncertainty: reject new paid-eligible commands before mutation; preserve verified authority.
- Worker crash: fence the old writer, restore the newest compatible snapshot, replay contiguous commands and verify checksums.
- Replay divergence or impossible physics state: quarantine the run, exclude records, preserve evidence and start a declared fresh run.

## 12. Phase Gates

### Phase 1 — Foundation

Deterministic fixed-point physics, chunk generator/oracle, authoritative lifecycle, headless run, snapshots and replay.

### Phase 2 — Complete autonomous game

Production AI, enemies, hazards, combat, builds, themes, checkpoints, guardians and progression campaigns.

### Phase 3 — Premium broadcast

Animated browser source, camera, HUD, audio/VFX models, accessibility, clean feed, replay and browser captures.

### Phase 4 — Audience interaction

Provider-neutral inputs, ten bounded effects, deterministic votes, Chat vs AI, moderation, idempotency and maximum-pressure campaigns.

### Phase 5 — Reliability and operations

Durable service, exact recovery, leases/fencing, bounded resources, output health, operator controls, drills and chaos evidence.

### Phase 6 — Release governance

Exact-source manifest, traceability, final campaigns, capacity/endurance/provider/safety/drill/canary contracts, score and truthful external blockers.

## 13. Acceptance and Truth Boundary

Software phase completion requires strict TypeScript, deterministic reruns, zero invalid content, zero replay divergence, zero duplicate effects, zero hidden/provider-private exposure, browser verification, chaos recovery and zero open software P0/P1 findings.

The software may score as a production candidate, but `productionReady: true` is prohibited until production-reference capacity and audiovisual evidence, credentialed YouTube/Twitch tests, external safety/accessibility/licence/supply-chain attestations, witnessed drills, a real 72-hour endurance run, a real seven-day canary and an independent exact-candidate signed review all pass.