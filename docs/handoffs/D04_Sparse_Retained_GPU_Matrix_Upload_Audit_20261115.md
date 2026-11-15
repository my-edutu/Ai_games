# D04 — Bounded retained GPU instance-matrix uploads (2026-11-15)

Status: **isolated implementation committed; new-head native and genuine Chrome acceptance UNVERIFIED**. This is not a claim of improved real-game frame rate or sample-synchronized original sound.

## Scope and observed motivation

Branch only: `feat/dungeon-d04-combat-feedback-realism-20261108`. Starting head `2406f4ab412021cb1206402eaf4d86d5e1c9018f`. The previous optimization set each retained InstancedMesh's `count` to its occupied prefix, reducing submitted instance vertices but still left each dirty `instanceMatrix` on Three.js's possible full-buffer-upload path. A 5-chip HP impact can touch 5 of 48 reserved hit matrices. Sparse updates can reduce CPU-to-WebGL upload pressure, but do not prove D04 caused previous large renderer stalls.

The last completed real Chrome trial on the starting head was [workflow 43692936453](https://github.com/my-edutu/Ai_games/actions/runs/43692936453). Its contracts job passed. Real-preview ran 6 successful cases and 1 failed strict acceptance: `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. The six viewpoints (cinematic/tactical/chase; desktop 1440x900 and mobile 390x844) held 12 frame-acknowledged public states per view, 5 common genuine HP-loss ticks and **0** HP-loss ticks with an affirmative drawable receipt in all six. Slow-phase records included desktop 3,377ms advance-to-submit with 3,370ms renderer time; mobile 4,451ms with 4,448ms renderer time. These are wall-clock submission measurements, not GPU-completion evidence or causal proof.

## Implementation and reviewable commits

1. [Focused regression](https://github.com/my-edutu/Ai_games/commit/7480edca85f2d8ffbcfe4a00900da342f5c79413) demands per-instance matrix upload ranges.
2. [First source implementation](https://github.com/my-edutu/Ai_games/commit/6c547ff7ff07c4711a394d778c7cfb0c00de28ca) routes all ten runtime retained-matrix writes through a single bounded helper; one-time construction leaves its preexisting upload semantics.
3. [Invisible-pool churn regression](https://github.com/my-edutu/Ai_games/commit/7287ece3fd38720e4bc7d0c56453cd985c97d29a) covers 160 emit/reset cycles while the renderer cannot clear upload ranges.
4. [Bounded coalescing](https://github.com/my-edutu/Ai_games/commit/64d08db9f186f40637302c1ce65decbbe6d89aa8) merges the pending `BufferAttribute.updateRanges` into one interval spanning modified matrix rows. An unsupported adapter retains the preexisting `needsUpdate` behavior. Invalid ranges are conservatively widened to the reserved pool capacity.

Only `public/ai-dungeon/physical-feedback-visuals.js` and `tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs` changed across these commits. No main, Draft PR #49, `games/ai-dungeon/src`, rigs, camera, global lighting, other session branches or default mode changed. D04 remains strictly opt-in via `?feedback=d04`.

## Verification status and limitations

- **Actual source-function smoke GREEN** in an isolated JavaScript execution: five contiguous modified instances merged into one `start=0,count=80` float range; 500 simulated matrix rewrites kept one bounded pending interval; after a simulated renderer `clearUpdateRanges()`, updating instance 30 produced the narrow `start=480,count=16` range. This does **not** exercise real Three.js/WebGL or prove any native foundation test passed.
- The focused Node regression was **committed test-first**, but RED execution on the test-only commit was not available because the connected coding tunnel was offline. The new-head Node GREEN/build and genuine Chrome browser acceptance are **unverified**; do not carry forward the 368/368 native result from the previous head as if it verifies these changes.
- Real recordings from the prior Chrome artifact include VP8 frames and Opus tracks, but sparse decoded frame delivery and existence of an audio stream do **not** prove visual HP contact or synchronized PCM.
- Retained limits unchanged: seven pools, 102 reserved instances, at most seven added effect draw calls, eight original foley voices and one <=19,200-sample mono noise buffer. Causality remains HP-only for injury and source-only for misses/releases; WebAudio click opt-in, mute, reduced motion/flash, deduplication, frame-receipt checks, cleanup and the 400ms deadline are unchanged.

## Next dominant acceptance weakness

Run branch-head `npm ci`, `npm run build`, `node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs`, and `npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs` in a genuine checkout. Capture actual WebGL buffer-update counts/timing **before and after** this optimization; inspect frame-paced and realtime 1440px/390px match views. The strict real damage verdict remains the acceptance gate: independently decode visible HP injury frames with audio PCM onset, plus real Warden warning/release/recovery/counter, miss, block, dodge, projectile, spell and 20-minute soak. Report failed or absent evidence as such; no relaxation of the frame/audio deadline or fabricated scores.
