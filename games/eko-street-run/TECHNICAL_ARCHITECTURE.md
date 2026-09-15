# Eko Run Technical Architecture

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Define module ownership, authoritative state, system order, replay, presentation boundaries, failure behaviour and technical budgets.  
**Status:** `approved` for Phase 1 implementation  
**Owning scope:** Game architecture  
**Related:** `PRD.md`, `GAME_DESIGN.md`, `TESTING_STRATEGY.md`, root/Eko `AGENTS.md`.  
**Last material review:** 2026-09-15  
**Version:** `ARCH-1.0`

## Architecture Decision

Eko Run uses a **deterministic authoritative TypeScript simulation plus a non-authoritative 3D presentation host**. Three.js is a renderer/scene adapter, not the game authority. This keeps movement, hazards, records, AI and replay stable across render frame rates and enables headless simulation.

Rejected alternatives:

- **Three.js/render-loop authority:** rejected because frame delta, renderer stalls and presentation lifecycle would affect outcomes.
- **General rigid-body engine as primary character controller:** rejected for initial platforming because a swept kinematic controller provides tighter control, simpler determinism and clearer tuning. Rich rigid-body presentation may be added where outcomes do not depend on it.
- **Separate AI/headless rules:** rejected because it would invalidate replay/balance evidence.

## Context and Trust Boundaries

Untrusted/external systems include browser input events before normalization, future provider/audience adapters, remote model proposals, stock/content sources and operator requests. They cross validation contracts before authority.

Authority never receives raw provider SDK objects, payment details, chat text, browser DOM objects, Three.js objects, audio nodes, analytics clients or database handles.

## Module Ownership

| Module | Owns | Consumes | Emits | Cannot do |
|---|---|---|---|---|
| `config` | versioned game/run config | static config input | validated config | read wall clock for rules |
| `state` | serializable authoritative types | validated config | initial/copy state | own renderer/provider handles |
| `runtime` | tick, command ordering, streams, checksum | commands + state | next state + semantic events | perform network I/O in tick |
| `physics` | kinematic movement/contact truth | state + movement intent + route geometry | transforms/contacts | use render delta |
| `rules` | checkpoints, hazards, resources, results | contacts/events/state | consequences/events | mutate presentation |
| `generation` | deterministic route content | config + named streams | validated route pack | retry forever |
| `ai` | bounded policy proposals | serializable observations | legal command requests | mutate state directly |
| `presentation` | immutable render projection/camera-ready data | state + semantic events | render snapshots | mutate authority |
| `persistence` | replay/snapshot validation | state/events/commands | restore/replay result | restore unchecked data |
| `influence` | normalized eligible audience requests | shared audience envelope | scheduled commands | see raw payment/provider payload |
| `operations` | health/readiness projection | version/state/probes | operator status | change gameplay secretly |

## Dependency Direction

`apps/hosts → game public exports → shared public packages/contracts`.

Game authority may import pure public shared utilities/contracts. Shared packages never import Eko private modules. Presentation imports authority types/projections; authority does not import presentation. Provider/OBS/payment SDKs are forbidden in `games/eko-street-run/src/{state,runtime,physics,rules,generation,ai}`.

## Logical Time

- Tick rate: **60 Hz**.
- Tick duration: `1 / 60` logical seconds represented by integer tick count plus a fixed constant.
- Real-time catch-up never enlarges the authoritative delta.
- Presentation may interpolate/drop frames.
- Pause/resume is a lifecycle command/state, not implicit wall-clock drift.
- Phase 1 has no authoritative time scaling.

## Coordinates and Numeric Policy

- World unit: **1 unit = 1 metre** for gameplay geometry.
- Phase 1 uses IEEE-754 JavaScript numbers with explicit runtime version floor Node >=22 and supported modern browser engines in later browser phases.
- Outcome-relevant position/velocity values are quantized to `1e-6` world units after authoritative integration steps.
- NaN/infinite values fail an invariant check and quarantine/throw in test/headless execution.
- Phase 2 may tighten/adjust quantization only through a deterministic-version change with replay fixture review.

## Phase 1 Player Representation

Phase 1 implements the smallest movement model needed to prove architecture: horizontal movement and gravity onto a flat route ground. It reserves the kinematic swept-shape design without prematurely implementing Phase 2 jump/slide behaviour.

Phase 2 target representation is a kinematic capsule/rounded proxy with stable swept collision queries and explicit contact precedence. Visual costume geometry never defines collision.

## Authoritative State Schema

Top-level state fields:

- `schemaVersion`, `gameVersion`, `deterministicVersion`, `contentVersion`;
- `runId` generated deterministically from supplied run configuration rather than ambient UUID randomness;
- `rootSeed`;
- `tick`, `nextEventSequence`;
- `lifecycle` (`running | completed | failed | aborted | quarantined | maintenance`);
- `player` (position, velocity, movement state, current checkpoint, progress distance);
- `route` (content version, route ID, checkpoint/finish geometry, active authoritative objects);
- `resources` (Phase 1 includes only structurally reserved bounded values; no economy logic);
- `randomStreams` authoritative stream internal states excluding cosmetic presentation randomness;
- `record` current run progress/result projection;
- bounded diagnostic counters required for integrity, not free-form logs.

No callbacks, Maps with unstable serialization, class instances, DOM/Three/audio/provider objects or closures enter state.

## Version Constants

Phase 1 starts with:

- game version: `0.1.0`
- schema version: `1`
- deterministic version: `1`
- content version: `foundation-1`
- command schema version: `1`
- event schema version: `1`
- render snapshot version: `1`
- persistence snapshot version: `1`

Changing tick/system order, PRNG algorithm, draw ownership, collision semantics, checksum material or numeric quantization requires deterministic-version review.

## Named Random Streams

Root seed is caller supplied. Stable stream names:

- `route` — authoritative generation;
- `traffic` — authoritative traffic scheduling/eligible variations;
- `ai` — intentional AI tie-break variation;
- `reward` — authoritative reward choices;
- `audience` — authoritative vote ties/eligible interaction selection;
- `cosmetic` — presentation-only variation, excluded from authoritative state checksum and forbidden from rule decisions.

Phase 1 implements deterministic derivation and isolation tests even though the Foundation Route does not require random route construction.

## Command Contract

`EkoRunCommand` contains schema version, run ID, target tick, priority, source ID, source sequence, type and bounded payload. Phase 1 supports `move` plus lifecycle/testing-safe commands required by the demonstrator.

Stable total order within a tick:

1. `targetTick`;
2. lower numeric `priority` first;
3. lexicographic `sourceId`;
4. ascending `sourceSequence`;
5. stable command type tie-break only if a fixture intentionally constructs otherwise identical metadata.

Duplicate `(runId, sourceId, sourceSequence)` commands apply at most once. Stale/future-window commands return typed rejection results according to config.

## Authoritative System Order

For every tick:

1. validate/sort scheduled lifecycle and input commands;
2. derive player intent;
3. integrate kinematic motion;
4. resolve ground/contact geometry;
5. resolve hazard/vehicle consequences (none in Foundation Route except bounds/finish semantics);
6. resolve checkpoint/progress/result;
7. emit ordered semantic events;
8. increment/validate bounded state;
9. compute checksum at requested checkpoints/snapshot boundaries;
10. project immutable render snapshot outside mutation authority.

## Phase 1 Foundation Route

- route ID: `foundation-straight-001`;
- ground y = `0`;
- start x = `0`;
- checkpoint center x = `10`;
- finish x = `20`;
- route bounds x = `[-2, 24]` with safe invariant handling;
- no pits, enemies, viewer effects or procedural branches.

Its purpose is proving state/order/replay, not demonstrating final gameplay.

## Semantic Events

Phase 1 event families:

- `run.started`;
- `command.rejected`;
- `checkpoint.reached`;
- `run.completed`;
- `integrity.failure`.

Movement itself is represented in state/render snapshots rather than an unbounded event per frame. Event sequence is strictly increasing.

## Render Snapshot

The render snapshot is a sanitized immutable projection containing version, run/tick, lifecycle, player transform/movement state, route/checkpoint/finish presentation data, progress and recent presentation-relevant semantic events. It excludes stream internals, provider/private data, internal error stacks and mutable references to authority.

## Checksums

Canonical checksum material:

- version fields;
- run ID/seed/tick/lifecycle;
- quantized player/route/resource/record state;
- authoritative named-stream states except cosmetic;
- next authoritative event sequence;
- any outcome-relevant active entity state in stable entity-ID order.

Objects are canonicalized by explicit schema/key order; collections sort by stable IDs. Phase 1 uses a deterministic 64-bit FNV-1a implementation and emits fixed-width hexadecimal strings. Changing the checksum algorithm increments its version metadata.

## Snapshots and Restore

A persistence snapshot includes snapshot version, game/schema/deterministic/content versions, run ID, root seed, tick, next event sequence, authoritative payload and checksum.

Restore sequence:

1. validate schema shape and supported versions;
2. recompute/compare checksum;
3. run state invariants;
4. verify replay/event continuity metadata when a log follows;
5. return a fresh authoritative state object;
6. reconstruct presentation from the restored state.

Mismatch throws a typed integrity error; gameplay never silently continues from divergent state.

## Replay

Replay consists of initial validated config/seed plus normalized accepted command steps and expected optional checkpoint checksums. Replaying uses the same `stepSimulation` production function. There is no alternate fast ruleset.

## Failure Classes

- `ValidationError` — invalid caller/config/command data, no side effect.
- `InvariantError` — illegal authoritative state; halt/quarantine in runtime policy.
- `IntegrityError` — checksum/version/replay divergence; preserve evidence, do not continue.
- `UnsupportedVersionError` — explicit incompatibility.
- `PresentationError` — later renderer/audio error; simulation truth remains valid and presentation may restart.
- `ProviderError` — later external service error; autonomous game continues when safe.

## Performance and Resource Budgets

Phase 1 reference workload is the Foundation Route and deterministic fixture campaigns on GitHub Actions `ubuntu-latest` Node 22.

- authoritative tick: p99 < 4 ms; no repeatable tick above 16.67 ms in the declared foundation workload;
- command batch fixture: bounded maximum commands per tick from config; Phase 1 default 32;
- authoritative active entities: Foundation Route player + route only; future maxima versioned by content phase;
- replay/event arrays in tests/scripts are bounded by explicit fixture lengths;
- no live unbounded log/history retained in authoritative state.

Later renderer/GPU/audio budgets are added when representative presentation exists.

## Security and Privacy Boundary

No secret or viewer identity is needed in Phase 1. The command contract uses generic `sourceId` values supplied by the trusted host/test adapter. Future provider adapters tokenize identity outside game authority. Error objects returned to public presentation use stable safe reason codes, not stack traces.

## Compatibility and Rollback

Phase 1 supports only schema/deterministic/content version 1. Unsupported snapshots fail explicitly. Until migration support is justified, deterministic-version changes start fresh runs rather than pretending compatibility. Rollback may restore a snapshot only when its recorded versions are supported by the rolled-back build.

## Architecture Tests

- fixed tick constant and serializable state;
- no ambient randomness/current time in authority;
- stable command ordering/duplicate suppression;
- same-seed/same-input checksum repeat;
- cosmetic stream isolation;
- render schedule independence;
- snapshot/restore equivalence;
- corrupted snapshot rejection;
- render snapshot immutability/no shared mutable references;
- forbidden presentation/provider imports in authority directories.
