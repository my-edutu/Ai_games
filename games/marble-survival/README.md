# Marble Survival Tournament

Game 7 is an autonomous, deterministic marble tournament built for continuous YouTube/Twitch broadcast. A seeded field of personality-driven marbles progresses through five elimination rounds—32→16→8→4→2→1—while fixed-step physics, procedural arenas, bounded audience influence, premium presentation, and automatic recovery keep the stream truthful and self-sustaining.

## Viewer Promise

Watch recognisable numbered marbles survive increasingly dangerous obstacle arenas until one champion remains. Round, survivor count, qualification quota, leading/favourite/endangered marbles, bracket progress, and the next audience opportunity remain understandable at a glance.

## Current Implementation Status

- Phase 1 deterministic foundation: verified by local build, 12 focused tests, forbidden-nondeterminism scan, snapshot corruption test, and accelerated twin-runtime headless execution.
- Phase 2–6 implementation follows the approved plan in `docs/superpowers/plans/2026-08-17-marble-survival-tournament.md`.
- Production promotion remains gated by genuine 72-hour soak and seven-day canary evidence.

## Commands

- `npm run build`
- `node --test tests/foundation/marble-*.test.cjs`
- `node scripts/run-marble-headless.cjs [seed] [tournaments]`

## Module Boundaries

`src/runtime` owns authoritative ticks and lifecycle. `src/physics`, `src/rules`, `src/ai`, `src/generation`, and `src/influence` are deterministic rule modules. `src/presentation` emits privacy-safe snapshots/cues only. `src/persistence` validates snapshots. Provider adapters, payment systems, OBS, databases, and operator authentication remain outside the game package.
