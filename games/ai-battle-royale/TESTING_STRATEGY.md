# Testing Strategy — AI Battle Royale

## Layers

- Unit tests: config, geometry, combat, movement, zone, loot, vote, snapshots and assessor.
- Property tests: generation validity, state invariants, bounded collections and legal actions across seeds.
- Deterministic replay: repeat, snapshot boundary and restored continuation checksums.
- Campaigns: run duration, terminal reason, archetype share, fallback and dramatic-pattern distributions.
- Presentation: snapshot privacy/immutability, HUD semantics, audio priority, responsive browser source and accessibility controls.
- Interaction: duplicate, stale, late, burst, tie, disable, outage and bounded audit.
- Reliability: corruption, incompatible versions, stall probes, crash breaker, replay, chaos and rollback.
- Release: traceability, evidence staleness, independent review and external R5 gates.

## Failure policy

Flaky reruns are prohibited. Technical or integrity failure never counts as a match loss. Every discovered bad seed or command sequence becomes a reproducible regression fixture.
