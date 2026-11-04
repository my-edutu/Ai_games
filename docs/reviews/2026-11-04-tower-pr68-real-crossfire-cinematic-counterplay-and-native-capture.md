# Infinite Tower Climb — live shutter/guardian crossfire as one playable experience

2026-11-04 · same transformation-first Gauntlet · draft PR #68 · candidate source `e4525d5756641e19d9d14b29c7d8d074589b04b3`

## Why the real game needed this

The recorded native mobile danger footage had recurring character/guardian/clockwork composition conflicts. The already-shipped source-witnessed shutter scene hierarchy and existing 3D light could elevate an imminent collision during a boss encounter, but **the camera, sightline occlusion and sound still contradicted that priority**. During the most consequential real two-body trap encounter a guardian could dominate the field of view while the actual closing shutter went unseen, or its windup suppressed the physical ratchet warning. This remains an experience hypothesis pending full-motion proof, not a self-certified win.

## Complete playable cross-system slice

1. `public/infinite-tower-climb/visuals/action-staging.mjs`: added pure `guardedCrossfireAimGain`. It rejects camera moves unless the real projected shutter moves into safer screen space and the actual skinned climber (head and boots), live guardian and already-visible airborne landing remain readable; all relevant core sightlines must remain unobstructed, with finite source/clip coordinates. No guessed future trap.
2. `public/infinite-tower-climb/visuals/scene.mjs`: existing Three.js exterior follow camera now permits a bounded local gaze correction toward that CURRENT source-authentic physical shutter during genuinely concurrent live guardian combat; revert if checks fail. Same staging protects the urgent trap from decorative foreground gears when the current selected landing is not already staged and protected. Uses preallocated reusable vectors and existing camera, GPU resources and scene.
3. `public/infinite-tower-climb/visuals/audio.mjs`: the existing opt-in synthetic counterweight ratchet can cut through live guardian telegraph suppression ONLY while the source reports an evading-hazard decision, a 1–6-tick physical shutter charge and immediate real player/hazard collision corridor. Existing first-packet and tick-adjacency controls still rule out fictitious audio. No added asset, voice bus or source-time manipulation.
4. `tests/phase3/tower-crossfire-camera.test.cjs`: protected desktop/portrait composition and negative screen/core/recovery contract tests. Fixed the source-atmosphere guardrail fixture to use a real nearby HP-bearing positioned guardian, rather than inventing priority for a nameless/positionless enemy.

This continues the original **same** gameplay transformation. The camera never updates physics, combat HP, seeded AI, replay checksums, authority, HUD, progression or the authentic result/restart. No new lights, geometry, GPU passes, dynamically retained objects, audio without opt-in, or externally licensed assets. Reduced-motion continues to skip extra movement; mute leaves real physical warning hardware visible.

## Actual real-video and CI findings (not invented quality votes)

- Frozen baseline **`1731b380851162741761c5569e2bc152a0869ca9`** unchanged.
- On 2026-11-04 the PRECEDING playable implementation `eb5b356c59bb8f81201a7fd7df966153b91f16bd` finished all **nine** real, normal-speed source-pinned video jobs at [run 41898321385](https://github.com/my-edutu/Ai_games/actions/runs/41898321385), including baseline/candidate ascent, danger, moving-platform, outcome, and authentic-ledge jobs. Baseline/candidate artifact IDs: ascent `13359195291 / 13358031175`, danger `13357857099 / 13357808344`, moving `13358501533 / 13357519159`, outcome `13359286323 / 13357449590`, ledge `13359860200`. Completion is evidence **capture succeeded**, not proof that episodes match, clips are reviewed, restart is visible, or the game wins blind comparisons.
- Prior exact-head [quality safety run 41898922925](https://github.com/my-edutu/Ai_games/actions/runs/41898922925) FAILED exactly **one** test at `tests/phase3/tower-source-atmosphere.test.cjs:88`: an old fixture demanded weather suppression from `{active:true,telegraph:true}` with NO guardian position, health or source identity. Corrected that fixture. A distant/invalid boss should NOT make local environmental motion disappear.
- New-source gameplay [41908496684](https://github.com/my-edutu/Ai_games/actions/runs/41908496684) was queued/in progress at inspection. New-head safety [41908495833](https://github.com/my-edutu/Ai_games/actions/runs/41908495833) was in progress. Neither is a validated quality outcome yet.
- The independent worker/browser tunnel again returned `NOT_FOUND` (no client for 300 seconds). **LOOKS 0/5, FEELS 0/5, PLAYS 0/5** means no genuine judges, NOT a zero quality score. No supported-device frame-time p50/p95/p99, memory, full-match observation or accessibility/replay integrity verdict.

## Risks, rollback and next whole-experience evaluation

The biggest remaining *experience* deficit is verifying simultaneous visibility of the real climber, close-contact shutter, guardian, landing and progression during normal-speed portrait gameplay and source-matched complete terminal/restart, without uncomfortable camera oscillation. A pure NDC guard is not raster-occlusion proof; examine actual native 390x844 and 960x600 WebM. Stage-light and sound may still outpace the cinematic pose, and true simultaneous boss/trap overlaps may be rare in one seed.

Rollback only the three source crossfire presentation edits if the new current-source full-motion footage shows distracting gaze movement or incorrect hazard emphasis; keep corrected test fixture/contract independently. Preserve PR #58 and the immutable frozen baseline. Complete exact-current-source source-traced >=60s matched video pairs for three meaningful episodes, obtain five distinct randomized fresh-context blind reviewers per quality pillar with 4/5 candidate preferences in EACH, and measure real supported-device tails/memory plus accessibility, replay and robustness. No fabricated AAA, FPS or transformation PASS. PR #68 stays DRAFT, unmerged and undeployed.

## Safety correction after current-source CI

The e452 playable head [quality run 41908495833](https://github.com/my-edutu/Ai_games/actions/runs/41908495833) FAILED one old source-text assertion. The fixture expected a direct `targetPlatform && landingApproach...` ternary as the third protected foreground sightline. The new live-game camera correctly prioritizes an already-present landing, and protects the genuine imminent shutter when no landing is staged. Updated the test to assert BOTH source conditions and explicit priority. This is source-contract correction, not a quality win. Corrected-head CI, complete new-source full-motion inspection and independent critics remain outstanding.
