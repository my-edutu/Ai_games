# Infinite Tower PR68 — P0 native guardian scene clearance and callback-clock recovery

Date: 2026-11-09. Stage P0 **OPEN**; transformation **NOT EVALUATED**.

## Scope, immutable source, repository boundary

Only the existing open draft PR #68 branch `feat/tower-transformation-gauntlet-20261101` was changed. The untouched comparator remains `1731b380851162741761c5569e2bc152a0869ca9`; PR58 and main were not changed. No merge, deploy, force push or draft-state change.

## Authentic evidence inspected before implementation

- Native original candidate and baseline portrait danger WebMs from source-pinned nine-job recording [42675366073](https://github.com/my-edutu/Ai_games/actions/runs/42675366073); candidate SHA `62e18f7e40e1ccfa17da6b326eca73f7728b4bc4`, baseline comparator unchanged; candidate native artifact [13699728017](https://github.com/my-edutu/Ai_games/actions/runs/42675366073/artifacts/13699728017), baseline danger [13700785202](https://github.com/my-edutu/Ai_games/actions/runs/42675366073/artifacts/13700785202). The retrieved original 390x844 clips run approximately 72.08 s candidate and 71.88 s baseline. Desktop and portrait were sampled at multiple original native timestamps; **not** an independent blinded full-motion review.
- In the candidate portrait guardian near native seconds 14–18, a giant non-colliding foreground/border clock ring remains compositionally larger than the actual player and guardian. The camera-sidecar's 38 source-tick observations include a real `clockwork-monumental-left-shoulder` rendered with **alpha 1** and projected coverage around 0.07–0.13, despite the action context. The backdrop opacity policy requires >=0.22 coverage and therefore does not solve these observed scenes; adding another alpha tweak would not be an adequate architectural solution.
- Original recording source-pairing [manifest artifact 13700246988](https://github.com/my-edutu/Ai_games/actions/runs/42675366073/artifacts/13700246988) reports eight source-timeline pairs but **two baseline outcome native integrity defects**, an incomplete baseline portrait outcome source sequence (missing sampled `source-result-phase:result`), and only six calibrated native timebase pairs. It is NOT a full source-visible game-loop film acceptance.
- The prior exact-head quality run [42685746254](https://github.com/my-edutu/Ai_games/actions/runs/42685746254) failed **one of 1,285 original Node/Three tests**. The actual integration fixture advanced mocked `performance.now()` only by its 12 ms renderer call, while repeatedly passing `scheduled(now + 240)`. Consecutive rAF callback timestamps were therefore 12 ms apart; `callbackGapMs:12`, resolution scale 1 and zero adaptations in the diagnostic. That fixture did NOT simulate a sequence of 240 ms frame delays.

## Implemented system-level correction

1. `3278b307ae681938195acabe8e61ee979dda9da1` — original integration fixture now advances BOTH actual mock wall time and callback timestamps monotonically by 240 ms while real scene-call cost remains 12 ms. This tests the shipped callback starvation policy rather than falsifying its input; the policy and acceptance threshold are unchanged.
2. `eec7ec152e75771f0e51d42ea186c1ed6de8a194` — actual world-geometry redesign on floor eight: the massive original clock drive was lowered from Y12.5 to Y9.1 and physically scaled from (0.72, 0.76, 0.72) to (0.52, 0.54, 0.54); the independent high-right rotor was raised from Y31 to Y35.5 and scaled from 0.88 to 0.74; the 42-unit open decorative rack dropped from Y6 to Y4 with vertical scale 0.65. These create a clearer **actual 3D vertical battle/approach band** instead of layering additional transparency rules. Original clock faces, three animated gear rotors, open rim geometry, actual collidable platforms, hazards, moving decks, crusher, guardian, earned doorway, and floor-nine authoritative progression are preserved.
3. `80703c7e2b1d991fa121e77111b5ff3cb04faaa2` — original installed Three.js world geometry integration test checks actual floor-eight geometry bounds leave the cap encounter band clear, retains exactly three rotors and source immutability, bounds low-tier draw budget, and verifies all floor-eight decorative hardware retires on authentic floor-nine world rebuild.

## Verification and acceptance limits

- Previous exact-source full suite failed 1/1285 due real fixture timing inconsistency; the revised **exact-HEAD original Node/Three quality** was newly requested by push [42689428953](https://github.com/my-edutu/Ai_games/actions/runs/42689428953), pending at review creation; do not assert green.
- No after-change original WebM from `80703c7e` or later has yet been reviewed. Physical hero/guardian visibility improvement, scene popping, actual smartphone FPS/frametime p50/p95/p99, GPU memory, sustained low/high graphics and sound/HUD experience remain **NOT EVALUATED**.
- Four scenario baseline/candidate normal-speed >60s captures at 960x600 and 390x844 need new exact immutable candidate SHA, native event alignment, and a complete baseline outcome portrait source episode. All original recordings and integrity faults must remain disclosed; no evidence integrity test should be weakened.
- Genuinely independent blinded randomized critics: LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**. No reviewer outcome is invented. **Transformation NOT EVALUATED**.

## Next highest-impact action

Collect the new exact-source nine-job capture, inspect *real motion* from native 14–25 s in portrait and desktop, compare true hero/guardian apparent size/occlusion with unchanged frozen baseline and older film, and determine whether the original guardian→crusher victory→physical gateway→floor nine→outcome/restart is continuously visible with event-matched image timecodes. Verify the geometry-bounds and original rAF fixture on CI, then correct any genuine failing code rather than waiving gate. If the player still reads as tiny, address the full climber/guardian/camera world composition as a connected system before advancing to P1. Device and independent assessor gates remain unfulfilled.

Rollback: revert ONLY these three PR68 changes by normal non-force commits if authentic normal-speed film shows unacceptable action readability, clipping or draw-budget regression. Do not move the frozen comparator or overwrite PR58 work.
