# Phase 1 — Deterministic Foundation

## Objective

Deliver a reproducible symbolic escape-room kernel whose generated rooms are valid, solvable, bounded and recoverable without rendering, provider or model dependencies.

## Completed scope

- [x] Strict configuration schema and production bounds.
- [x] Eight authored puzzle primitive contracts.
- [x] Constructive dependency generation using named RNG streams.
- [x] Typed validator, isolated solver and observable known-good fallback.
- [x] Fixed-step authoritative state, atomic legal actions and bounded history.
- [x] Inspect, take, combine, use, enter-code, activate, wait and exit behavior.
- [x] Result, intermission and deterministic automatic next-room lifecycle.
- [x] Versioned snapshots with config/content compatibility and checksum validation.
- [x] Exact restore equivalence and typed quarantine errors.
- [x] Headless oracle-test policy using the production rule path.

## Determinism envelope

Authoritative generation, visibility, facts, inventory, solved puzzles, score, lifecycle, result, accepted action order, RNG streams, snapshots and final checksum are reproducible. Camera, particles and cosmetic audio remain outside this phase and cannot enter authority.

## Named random streams

- `escape.generation.template.v1`
- `escape.generation.solution.v1`
- `escape.generation.visibility.v1`
- `escape.generation.dressing.v1`
- `escape.generation.decoys.v1`
- `escape.generation.hazards.v1`

`escape.cosmetics.v1` is deliberately isolated and tested not to perturb authoritative generation.

## Exit evidence

- `npm run build` — PASS.
- `node --test tests/escape-room/phase1-generation.test.cjs` — 7/7 PASS.
- `node --test tests/escape-room/phase1-runtime.test.cjs` — 8/8 PASS.
- `node --test tests/escape-room/phase1-*.test.cjs` — 15/15 PASS.
- `npm run escape-room:headless` executed twice with identical output checksum.

## Readiness

Phase 1 is complete at R1 software evidence. No production or external-provider claim is made.
