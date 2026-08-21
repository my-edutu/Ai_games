# Technical Architecture — AI Battle Royale

## Ownership

- Simulation runtime owns authoritative state and logical ticks.
- Generator owns deterministic arena construction and validation.
- Agent policy consumes observations and emits actions only.
- Rules reducer validates and applies ordered actions/events.
- Influence gateway normalizes fixed-choice requests; reducer owns in-game eligibility/application.
- Presentation adapter creates immutable sanitized snapshots and semantic cues.
- Persistence validates snapshot/replay continuity.
- Supervisor observes progress and selects bounded recovery actions.
- Browser host invokes ticks and serves snapshots; it never implements rules.

## Determinism envelope

Positions, health, shield, ammunition, inventory, cooldowns, actions, hits, damage, deaths, loot, zone state, influence effects, results, records, RNG state, event order and checksums must reproduce. Canvas interpolation, cosmetic particles and oscillator timbre may vary and cannot feed authority.

## Hot-path budget

No network, filesystem, provider, model or rendering call occurs in `step`. Collections are capped. Pathfinding is bounded per contender. Event reduction and conflict resolution use stable IDs.

## Restore boundary

Snapshots carry schema, game, deterministic and configuration versions; seed/RNG state; tick/sequence; payload checksum and state checksum. Restore rejects incompatible or corrupt envelopes, validates invariants and quarantines divergence.
