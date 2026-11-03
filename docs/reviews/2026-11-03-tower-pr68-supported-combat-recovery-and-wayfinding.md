# Infinite Tower Climb PR68 — guardian duel → survival recovery → visible 3D route

**2026-11-03 | Same whole-game transformation | NOT EVALUATED**

## Connected playable experience

The existing autonomous climber could lunge off the source supporting cap to chase a patrolling guardian, or spend a melee cooldown when the real physics would turn it away for safety. At critical health it would also engage an enemy rather than withdraw toward a currently visible safe health pickup; the world-space route stones vanished during the AI's resource decision.

This continuation connects the actual tactical AI, observed-world safety and actual 3D viewer feedback. Supported guardian and ordinary melee now use present-deck guarded evasion; an inward safety move cannot spend an attack or optional pulse ability cooldown against an enemy in the other direction. At genuinely critical health, after real projectile/telegraph reactions, autonomous policy may retreat to an existing on-support health pickup only when the currently observed body corridor has no active hazard or living enemy and the next steering step stays supported. It never forecasts moving enemies, future hazard phases or guaranteed collection.

The actual Three.js route stones reuse their existing bounded instanced draw to show a modest green, on-deck source-intended health path on the observed supporting platform. They are suppressed when pickup identity is ambiguous, danger blocks the corridor, source intent disagrees, or transport is stale/outcome/restart. No new HUD text, render pass, network call, physics/collision or RNG. The scene now passes the observed supporting deck to the route renderer during a recovery intent instead of a nonexistent next jump.

Implementation source: [9659b457](https://github.com/my-edutu/Ai_games/commit/9659b45745479968a808186d4a750f330510ee63). Changed: games/infinite-tower-climb/src/ai/policy.ts, public/infinite-tower-climb/visuals/route-intent.mjs and visuals/scene.mjs; focused authority and 3D safety tests in tests/phase2/tower-guardian-cap-engagement.test.cjs, tower-encounter-counterplay.test.cjs, and tests/phase3/tower-route-intent.test.cjs.

## Evidence — not a quality verdict

- Frozen playable baseline: 1731b380851162741761c5569e2bc152a0869ca9, unchanged. PR58 is untouched; PR68 draft, unmerged, undeployed.
- Prior source full native desktop/portrait nine-job capture [41598209556](https://github.com/my-edutu/Ai_games/actions/runs/41598209556) and source-safety [41598755807](https://github.com/my-edutu/Ai_games/actions/runs/41598755807) completed successfully, but PRECEDE this implementation.
- Current 9659b457 exact-source normal-speed [capture 41605065339](https://github.com/my-edutu/Ai_games/actions/runs/41605065339) and [technical check 41605065376](https://github.com/my-edutu/Ai_games/actions/runs/41605065376) were IN PROGRESS when first inspected. Their later outcomes must be checked; do not infer success from old results.
- Real event-matched >=60s before/after across ascent, danger/guardian and complete genuine outcome/restart is NOT independently assessed. Reviewer workspace connector returned: Tunnel-client has not been seen for 300 seconds. Genuine independent blind reviews: LOOKS 0/5, FEELS 0/5, PLAYS 0/5.
- Native supported-device p50/p95/p99 frame-time, memory, accessibility, replay, robustness and full recovery remain unverified. No AAA, sustained FPS or quality victory claimed.

## Technical contracts / risks

The decision uses only public currently observed fixed-step state; historical-v1 is unchanged. No hidden information, simulation state mutation, replay/checksum shape change, data collection, provider calls or assets. Graphics uses exactly the pre-existing instanced stones, depth tested and reduced-motion stable, and clears on terminal/restart/stale. The tactical recovery is not a guaranteed heal and is intentionally refused with multiple eligible health items because public intent does not identify a single item. A poor viewer understanding of the guardian's telegraphed attack, real HP-driven gate release and authentic ending on phones remains the biggest systemic experience gap.

Acceptance continues with exact-source recorded source-event aligned genuine full-motion videos, five independent randomized blind reviewers (>=4/5 separately for LOOKS/FEELS/PLAYS), hardware performance, accessibility, replay/recovery and no serious regressions. If recovery decisions or glyphs mislead viewers, revert this PR68 source cluster as one cohesive slice, keeping PR58 and baseline untouched.
