# Marble Survival Tournament

Game 7 is an autonomous five-round marble tournament for continuous browser/OBS broadcast. The standard bracket remains **32 → 16 → 8 → 4 → 2 → 1**, but the September 2026 premium upgrade replaces the old parallel broadcast demo with the same deterministic `MarbleRuntime` used by headless execution.

## Viewer Promise

Watch distinctive numbered marbles compete through a constructed miniature motorsport arena where the visible obstacle, qualification pressure, elimination cause, replay and champion all come from authoritative tournament state.

The current visual direction is **Precision Miniature Motorsport**: warm ivory track surfaces, charcoal structure, restrained metal hardware, physical perimeter rails, visible fasteners, material-shaded marbles, compact spectator HUD and event-driven camera framing.

## Current Software Candidate

- deterministic authority version: `marble-physics-v2`;
- one authoritative live runtime for headless and browser/OBS paths;
- fixed logical 60 Hz authority with bounded host catch-up;
- explicit same-tick finish ordering by crossing fraction, with stable ID only as the exact-tie policy;
- deterministic simultaneous-elimination and all-fall handling;
- moving sweepers share the same transform with renderer and collision authority and transfer bounded relative momentum;
- shield recovery uses a bounded physical recovery state rather than a progress teleport;
- sanitized public snapshots, event-driven camera directives and bounded presentation-only replay;
- spectator-first HUD with qualification cutoff, contenders and clean-feed mode;
- Low / Balanced / High / Ultra presentation presets that cannot change authority;
- procedural semantic Web Audio cues with a six-voice cap and browser-user-gesture start;
- six legacy audience-influence families remain catalogued, but only `wind-vote` is operational in v2; the other five fail closed until their real authority mechanics are rebuilt;
- accepted wind influence is scheduled by `MarbleRuntime`, idempotent, bounded, applies equally to active marbles and moves the record category to `Assisted`;
- snapshot/restore validates deterministic version, checksum, event continuity and influence queue/history bounds.

## Fresh Upgrade Evidence

The frozen runtime implementation commit is `078c385ada92c9ba471f2970f29edf9992c33940`. GitHub Actions run **#63** (`34370268262`) verified that exact runtime with:

- **45 / 45 tests passing**;
- authoritative browser-source self-test passing;
- zero ambient `Math.random`, `Date.now`, `performance.now` or `randomUUID` use in authoritative modules;
- zero production npm vulnerabilities and zero development-tool npm vulnerabilities;
- isolated Chromium captures for 1920×1080 Balanced, Assisted wind, 390×844 Low + reduced motion, and 1920×1080 clean feed;
- no horizontal overflow in those captures; clean feed proved the spectator rails hidden;
- authority performance on Node `v22.22.0`, Linux x64, AMD EPYC 7763:
  - ordinary p99: **0.3672 ms**;
  - forced 32-marble contact-storm p99: **1.3096 ms**;
  - worst sampled contact-storm tick: **6.0501 ms**;
  - declared p99 budget: **8 ms**.

These measurements are Node-side authority evidence, not a claim that every browser/GPU/device sustains 60 FPS.

## Commands

```bash
npm ci
npm run marble:upgrade:test
npm run marble:stream:self-test
npm run marble:stream
node games/marble-survival/scripts/profile-premium-runtime.cjs --enforce
node games/marble-survival/scripts/capture-premium-runtime.cjs
```

Browser examples:

- default Balanced: `/`
- Low presentation: `/?quality=low`
- High presentation: `/?quality=high`
- Ultra presentation: `/?quality=ultra`
- clean feed: `/?clean=1`

## Module Boundaries

- `src/runtime` owns authoritative ticks, lifecycle and legal scheduled influence;
- `src/physics` owns fixed-point movement, collisions and moving-collider truth;
- `src/rules` owns qualification, elimination, tie policy, round advancement and champion adjudication;
- `src/generation` owns deterministic arena/roster generation;
- `src/influence` owns the bounded effect catalogue and authority request schema;
- `src/presentation` owns sanitized snapshots, camera selection and replay copies only;
- `src/persistence` validates authoritative snapshots and restore;
- `public/complete-runtime` consumes public snapshots/events and cannot mutate gameplay;
- `scripts/serve-complete-runtime.cjs` hosts authority plus HTTP/static presentation boundaries.

## Readiness Boundary

This branch has software-candidate evidence only. **R5 / unattended production-ready remains false** until genuine external evidence exists for the required 72-hour endurance run, seven-day canary, independent security and accessibility review, witnessed recovery drill, production provider/credential handling, production capacity, and representative low-end/OBS capture-chain performance.
