# Autonomous Snake Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic headless Autonomous Snake R1 vertical slice with validated config, fixed-step rules, seeded named RNG, deterministic fallback AI, snapshots/replay, automatic restart, telemetry summaries, and reproducible tests.

**Architecture:** Shared contracts and deterministic utilities live under `packages/`; authoritative Snake logic lives under `games/autonomous-snake/src/` and has no renderer/provider/database dependencies. The run loop is synchronous and integer-only; snapshots include RNG stream state and checksums so restored execution can be compared to uninterrupted execution.

**Tech Stack:** TypeScript 5.x, Node.js 22+, dependency-free Node test runner for R1 verification, deterministic property-loop tests, JSON headless runner output.

## Global Constraints

- No `Math.random`, wall-clock time, async callbacks, provider SDKs, database clients, OBS code, React state, or presentation code in authoritative state transitions.
- Rule order follows `games/autonomous-snake/TECHNICAL_ARCHITECTURE.md`.
- All authoritative coordinates, counters, durations, scores, and occupancy values are integers.
- Named RNG streams are isolated; objective generation uses `objective-spawn` only.
- Corrupt or incompatible snapshots fail with typed errors.
- Game outcomes are distinct from technical outcomes such as tick caps/quarantine.

## Task 1 — Contracts, config and RNG
- [x] Add root TypeScript build/test configuration.
- [x] Add versioned Snake config and reject invalid dimensions/targets.
- [x] Add named deterministic random streams with snapshot/restore.
- [x] Prove same-seed reproducibility and stream isolation.

## Task 2 — State and objective generation
- [x] Add serializable integer-grid authoritative state.
- [x] Add deterministic initial body placement.
- [x] Spawn food only from free cells with bounded termination.

## Task 3 — Authoritative rules
- [x] Add reversal validation and fixed movement.
- [x] Implement configured tail-vacate semantics.
- [x] Implement food collection, growth, score and occupancy.
- [x] Classify wall/self collision and victory separately.
- [x] Emit deterministic semantic rule events.

## Task 4 — Minimal autonomous policy
- [x] Filter to currently legal actions.
- [x] Prefer adjacent safe food.
- [x] Score immediate reachable space with stable tie ordering.
- [x] Keep this explicitly bounded as the Phase 1 fallback, not production AI.

## Task 5 — Lifecycle and signals
- [x] Add synchronous `SnakeRuntime` coordinator.
- [x] Emit initialized/move/food/growth/collision/victory/result/intermission/restart events.
- [x] Automatically restart after terminal intermission.
- [x] Expose normalized progress signals.

## Task 6 — Snapshot and replay
- [x] Canonically serialize/checksum authoritative data.
- [x] Snapshot state, config, seed and all named RNG stream states.
- [x] Reject corrupt and unsupported snapshots with typed errors.
- [x] Prove restored execution matches uninterrupted checksums.

## Task 7 — Headless and property verification
- [x] Add deterministic multi-run CLI/runner.
- [x] Distinguish game terminals from technical tick-cap outcomes.
- [x] Run 100-seed × 250-step invariant corpus.
- [x] Run 100-run/100,000-tick reproducibility corpus twice and compare byte-for-byte.
- [x] Record throughput/memory baseline and forbidden-authority scan.

## Task 8 — Evidence and review
- [x] Run clean build and full test suite.
- [x] Store measured evidence and known limitations.
- [x] Confirm no known correctness P0/P1 within R1 scope.
- [ ] Independent PR review and merge.

## R1 Boundary

R1 validates the deterministic headless foundation only. The minimal fallback can enter long safe cycles on large profiles; production survival/pathfinding AI remains Phase 2. Renderer/audio, provider integrations, audience effects, durable persistence, operator tooling, 72-hour soak and public launch are not Phase 1 claims.
