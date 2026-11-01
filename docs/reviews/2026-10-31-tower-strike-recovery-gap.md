# Infinite Tower Climb — Gauntlet 29: stale strike recovery at low frame cadence

**Scope:** Draft PR #58; parent `b865611d701a9749d9d001fd6b3a5cafddb61932`; isolated 3D skinned-climber presentation only. **Review status: SELF-REVIEW.** A separate critic worker was attempted, but the coding-agent tunnel was disconnected (`NOT_FOUND: Tunnel-client has not been seen for 300 seconds`); no independent verdict is attributed.

## Required pre-edit real evidence

Inspected downloaded source-matched Tower Landing Evidence run [41216199043](https://github.com/my-edutu/Ai_games/actions/runs/41216199043), artifact `13047801752`, including actual 960×600 desktop / 390×844 portrait GPU screenshots. Downloaded Tower Continuous Motion Evidence run [41216199047](https://github.com/my-edutu/Ai_games/actions/runs/41216199047), artifact `13048466992`; inspected its actual desktop WebM video and timed frames at 4, 12, 24, 40, 55 and 70 seconds, as well as the machine-readable diagnostics. The source SHA file in the evidence matched `b865611d701a9749d9d001fd6b3a5cafddb61932`. On the CI software renderer, submitted-frame interval p95 was 2128.1ms desktop and 1254.3ms portrait. These are **not** presented hardware frames or real-device FPS. The Guardian, climber and environment are visible in sampled frames; full anticipation/contact/recovery and commercial visual parity are **not proven**. Latest broad Autonomous Games CI run [41216203722](https://github.com/my-edutu/Ai_games/actions/runs/41216203722) was **CANCELLED**, not a success; the dedicated Landing, Motion, Combat, Guardian and Realism evidence workflows completed successfully.

## ONE failure reproduced before editing

The real climber rig's `workshop.finish.animate()` caps animation step size to 100ms (a sensible gait protection), but the strike lasts 260ms. A legitimate `attacking: true` sample after a 500ms render gap shows a skinned-arm strike, and then a 500ms later `attacking: false` sample still retains an old mid-recovery strike because both frames use only a 100ms animation increment. This is a visibly misleading action state during documented slow render-submission conditions. The test uses the **actual shipping articulated model and posed skinned vertices**, not a mocked pose.

## Implementation

In `public/infinite-tower-climb/visuals/characters.mjs`, retain the existing 100ms bounded rig delta for gait/ordinary animation and retain the first authentic strike pose. For a subsequent non-attacking snapshot after a presentation-clock gap greater than 260ms, allow the strike recovery age to catch up by that observed gap. Death/hurt still immediately cancels attacks. Normal 60Hz timing is unchanged, and the root position/orientation are still host-owned. No new assets, GPU draw calls, collisions, authority data, seeds, AI actions, score, replay or user-visible HUD changes.

The only other source changes are two regression cases in `tests/phase3/tower-character-rig.test.cjs`: one proves an actual skinned attack pose survives the initial 500ms gap, fully resets after the next 500ms absent attack, preserves world root and yields to death in both motion modes; the other preserves a normal-cadence recoil/recovery envelope.

## Reproduction and scoped verification

- **RED**, parent: slow-frame test failed on *obsolete recovery still posed*.
- **GREEN**, changed source: both new tests 2/2 PASS, existing related rig/camera/stream cases 23/23 PASS.
- Full Tower Phase-3: **111/111 PASS**; `npm run build`: **PASS**; `node scripts/serve-tower-stream.cjs --self-test`: **ok:true** with authority, browser assets, privacy, replay, recovery and restart.
- Actual downloaded **parent-source** GPU evidence inspected; **no post-edit authentic GPU/video or device FPS proof** from this change. The CPU rig test does not claim to establish complete normal-speed motion.
- New-head CI and downloadable pixel comparison are mandatory before any visual PASS. A failed/blocked browser or a cancelled workflow must remain recorded, never upgraded to PASS.

## SELF-REVIEW and next gate

Specification check: only event presentation is changed; observed attack and historical position remain truthful; normal frame intervals preserve existing timing. Quality check: this prevents an obsolete punch being visibly held during multi-second stalls, but does not improve character geometry, remove GPU stalls or establish reference-quality action. Potential tradeoff: on a very slow system a recovery step can look abrupt; require actual source-matched video with fast/slow contact and guardian/hit proof to judge. Rollback is the one conditional attackAge increment. **Overall Gauntlet NOT ACHIEVED.** Independent Jusant environment/climbing, ASTRO BOT Rising Heat action/readability comparisons, full motion, accessible UI, hardware FPS and soak remain open.

**Automatically selected next priority:** Source-matched GPU capture of the real attack/contact/recovery sequence (including a real slow-render scenario), then measured intended-device performance and independent commercial comparison. 
