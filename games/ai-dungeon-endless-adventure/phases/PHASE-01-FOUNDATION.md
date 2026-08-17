# Phase 1 — Deterministic Headless Foundation

## Exit gate

Phase 1 provides strict configuration, connected seeded dungeon generation, objective validation, stable actions and event ordering, automatic floor transitions, bounded histories, canonical replay checksums, snapshot/restore and a headless fallback policy.

## Verification

- TypeScript strict build passes.
- 7 focused Node tests pass.
- Same-seed generation and headless execution match exactly.
- Entrance-to-sigil and sigil-to-gate paths are proven.
- Corrupt snapshots are rejected.
- Authoritative nondeterminism scan reports no ambient randomness or wall-clock use.
- Separate review closed the unsafe room-size edge case with a regression test.

## Readiness

R1 software gate passed. This phase does not claim broadcast, audience, durability, operations or production readiness.