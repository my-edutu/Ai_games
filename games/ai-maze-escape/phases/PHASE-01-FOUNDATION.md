# Phase 1 — Deterministic Maze Foundation

**Target:** R1 headless prototype

## Outcome

Generate a seeded solvable maze; move a minimal autonomous explorer from start to exit using complete-information test policy; emit results; snapshot, restore, replay, and automatically start the next seed.

## Scope

Module/config/state/lifecycle, grid/graph rules, constructive generator, oracle validator/solver, start/exit, fixed movement, simple result/record candidate, named streams, events/signals, snapshot/checksum, headless runner and baseline telemetry. No partial-observation production AI, threats, final presentation, providers, or production persistence.

## Test-First Work

Schema and initial determinism; graph connectivity; solution oracle; movement/wall/exit rules; bounded generation/repair/fallback; state invariants; lifecycle/restart; stream isolation; snapshot round-trip; uninterrupted versus restored replay; headless performance.

## Acceptance

- [ ] Every generated fixture has a validated solution and bounded generation.
- [ ] Full headless runs escape or produce typed non-game failure and restart.
- [ ] Identical inputs/checkpoints/results match checksums.
- [ ] Corrupt/unsupported snapshots fail safely.
- [ ] Oracle is isolated behind validation/testing interfaces.
- [ ] Baseline generation/tick/memory/throughput evidence and clean reviews exist.

Evidence goes to `phase-01/`; incompatibility or divergence blocks exit rather than updating golden outputs silently.
