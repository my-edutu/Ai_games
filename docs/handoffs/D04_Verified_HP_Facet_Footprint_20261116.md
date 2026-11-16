# D04 — Verified HP facet footprint: isolated acceptance increment (2026-11-16)

**Status: source-level RED/GREEN verified in an isolated V8 harness; native corrected-head CI, real WebGL pixels and original-audio synchronization unverified. NOT accepted for integration.**

## Evidence and decision

The latest completed Chrome workflow [43876938555](https://github.com/my-edutu/Ai_games/actions/runs/43876938555) used real DungeonRuntime combat state, six original soundstage/canvas recordings (cinematic, tactical and chase, desktop and 390px), and an unchanged strict verdict. Twelve authority ticks included five shared genuine HP-loss ticks; **zero were universally confirmed drawable across all six viewpoints**. Three observed injury receipts were stale by 1.464–4.113 seconds; a principal measured interval lay within WebGL renderer submission, not D04's recorded visual CPU pass. Other contacts lacked individually submitted witnesses. The recordings are unaligned: **no contact-to-decoded-PCM result**. This remains the dominant acceptance blocker and must not be misrepresented as repaired by geometry.

The review of the original screenshots and current source exposed a subordinate visibility defect in **verified actual-HP injury only**: each tetrahedral fragment had a 0.073-unit radius, a tiny silhouette when the spectator is reduced to 390px. The existing deterministic body-local shell, muted material, 380ms maximum ordinary effect retention, and 400ms audio deadline are independent. The chosen isolated change increases only the shared retained injury tetrahedron radius to **0.105 units** (about 44% larger linear radius), without brightening its material, adding sprites, inventing a blade/contact direction, or changing projectiles/dust.

## Source changes and limits

- `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs`: test-first regression requires strict canonical same-tick HP injury, a 0.10–0.11 scene-unit injury tetra radius, unchanged 0.072-unit dodge dust, 4 admitted instances at low severity, total 102 reserved, one active draw, and opacity no higher than 0.51.
- `public/ai-dungeon/physical-feedback-visuals.js`: one geometry constructor `TetrahedronGeometry(.073,0)` → `TetrahedronGeometry(.105,0)`; retained pool positions, effect count and budget remain unchanged. Existing reduced-flash opacity stays 0.22.
- Source execution in an isolated **actual-module V8** harness with minimal Three.js stand-ins and the real `isCanonicalVerifiedCombatFoleyCue` implementation: pre-change contract **RED** (actual radius 0.073); corrected contract **GREEN** (actual radius 0.105), canonical witnessed injury emitted, 4 hit instances, 102 reserved, 1 active draw, normal opacity 0.48, dust radius 0.072. This is a *source-contract check*, NOT a Node test-suite pass or a rendered-pixel claim.
- The latest previously completed branch workflow passed native contracts/build but **failed** the seventh genuine browser acceptance test; no corrected-head browser run or matched visibility/PCM evidence is verified here. The coding tunnel was unavailable, so full native commands and new Chrome capture could not be executed in this session.

## Review gates

**Specification:** the code changes only D04-owned retained HP VFX and its test; no gameplay, attack source, actual damage, rigs, camera, lights, projectiles, sound synthesis, consent/mute or accessibility toggles change. Legacy remains default and only `?feedback=d04` opts into this experiment. No external audio is added.

**Quality:** changing geometry globally for the hit pool may modestly increase on-screen coverage, but it cannot rescue a multi-second renderer stall or establish a pixel-level mobile readability gain. Fresh authentic frame pairs must inspect occlusion, visual clutter, and consistency across camera angles. Explicit rollback: restore the hit tetra constructor to 0.073 and remove the new regression.

**Next dominant work:** identify which **actual HP** is presented in submitted pixels and at what time on all six genuine moving viewpoints; separately decode and align the original generated Opus/PCM against the acknowledged frame clock. If post-submission stalls continue, hand off renderer investigation to its owning session without editing protected renderer/camera/lighting/authority files. Then complete Warden warning/release/recovery/counter, miss/block/dodge/projectile/spell cases, consent/mute/reduced-flash/motion, restart cleanup and 20-minute soak before any integration or parity claim.
