# Infinite Tower Climb — coherent biome atmosphere continuation (2026-11-02)

## Status: SAME TRANSFORMATION OPEN / NOT EVALUATED

This is part of the existing transformation-focused draft PR #68, **not a separate
Gauntlet round or a quality win**. Preserve the comparison baseline at
`1731b380851162741761c5569e2bc152a0869ca9`; do not merge, deploy, or
modify PR #58. Official ASTRO BOT Rising Heat / Jusant / Returnal Tower footage
remains a reference for legibility, climbing weight and scene fidelity only;
all geometry and colors in this implementation are original.

## Viewer-facing work in the actual 3D game

The original five Tower biomes now have a source-bound exterior atmospheric
volume at the real climbing lane instead of a motionless background with
occasional combat dust. Foundry has slowly rising warm embers, Ruins has
floating green-gold pollen, Storm Spire has descending angled rainfall,
Clockwork has drifting brass motes, and Astral Vault has cool amethyst dust.
All use one instanced, depth-tested, fog-aware Three.js mesh (40 low-tier or
96 high-tier motes), with one material, one authored tetrahedron geometry and
no new lights, shadow maps, colliders, screen-space HUD or independent update
loop. The change is intended to make the world feel alive during autonomous
movement and the camera orbit. Whether it actually works as cinematic art
requires real video comparison; file inspection alone is insufficient.

Each transform is a deterministic function of the real fixed-step source tick,
floor, biome, real character coordinates and graphic tier. No random stream,
snapshot mutation, new AI decision, authoritatively predicted movement or
replay event was introduced. The ambient layer deliberately dims during a
genuine enemy telegraph, yields completely in reduced-motion, stale and
terminal states, and is reset for a fresh run and WebGL context recreation.
Effects/geometry are properly disposed, with no separately allocated particles
per frame. A source diagnostics field is present for actual normal-speed video
capture; the field does not certify pixel visibility or supported-device FPS.

## Integration and engineering review

Source module:
`public/infinite-tower-climb/visuals/atmosphere.mjs` (new)

Real scene integration:
`public/infinite-tower-climb/visuals/scene.mjs` (create, stage, update,
graphics-reset, visibility, diagnostics, dispose)

Regression:
`tests/phase3/tower-source-atmosphere.test.cjs` covers draw-budget geometry,
repeatable source poses, actual five-biome colors, guardian windup priority,
reduced-motion/stale/death/restart suppression and cleanup. Existing scene
harness fixtures were updated to instantiate the **real** new resource module,
not a fake stub. `tests/browser/tower-live-motion.spec.cjs` records its
source-derived diagnostics during genuine native-layout WebM capture.

Source commits:
- `46bf008d`: original biome atmosphere implementation
- `7bceba8b`: production scene lifecycle and depth integration
- `4b550dd5`: source-behaviour tests
- `8a4f4252`, `5fab4d42`, `8d747a69`: real renderer fixture integration
- `a50f9324`: native capture diagnostics

At review creation, current-source safety and video evidence are **not yet
verified**. Earlier unrelated source `702e716` had safety success at
https://github.com/my-edutu/Ai_games/actions/runs/41458933700,
but that does NOT validate this atmospheric implementation. New exact-head
quality-contract workflow:
https://github.com/my-edutu/Ai_games/actions/runs/41465022589
(initially in progress). New real desktop/portrait motion capture:
https://github.com/my-edutu/Ai_games/actions/runs/41465022329
(initially pending). These are checks to inspect, **not acceptance results**.

## Independent critic / safety pass

The separate worker/browser runtime remains disconnected (NOT_FOUND, tunnel
client unseen >300 seconds), so there are no fresh blind randomized motion
judgments to record. Verified reviews: LOOKS **0/5**, FEELS **0/5**, PLAYS
**0/5**. No native-device frame-time p50/p95/p99, memory or smooth-frame
guarantee. New atmosphere is deliberately small, bounded and opt-out for
reduced motion, but device tails can still regress and must be measured.
No present head has an independently verified AAA or commercial-reference
quality score.

The historical frozen baseline outcome recording in source-pinned workflow
https://github.com/my-edutu/Ai_games/actions/runs/41458093264
still fails to render the entire 50ms result/intermission/restart transition
in its visible normal-speed footage, even though the source tick trace can
prove transitions. Do not treat the trace as rendered motion.

## Next experiential decision

Inspect the actual new candidate source in full-motion native 960x600 and
390x844 WebM at normal speed, alongside state-aligned frozen baseline video.
The key questions are **whether the new five-biome atmosphere strengthens
monumental scale or instead creates distracting foreground artifacts**, whether
the climber, selected deck and true guardian/HP lock stay legible during
movement and combat, and whether the outcome/restart is visibly understandable.
Reject or redesign obscuring effects before enlarging them. Obtain independent
blinded critiques with at least 4/5 candidate preference in each of LOOKS,
FEELS and PLAYS and supported-device performance before declaring this
continuous whole-game transformation successful.
