# D04 — Stop re-uploading an unmeasured, invisible blade ribbon

**Date:** 2026-11-12. **Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`.
**State:** IN PROGRESS / genuine physical combat A/V **NOT ACCEPTED**.
**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`.
**Acceptance:** `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`.
Never merge main or Draft PR #49; preserve the legacy default and opt-in `?feedback=d04`.

## Observed reason and narrow improvement

The previous completed genuine Dungeon/Chrome run [43277958439](https://github.com/my-edutu/Ai_games/actions/runs/43277958439) passed five browser cases but correctly failed strict original HP-loss frame admission, `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. The same run recorded 1,987.1ms / 3,461.6ms worst desktop legacy/preview direct WebGL calls and 2,968ms / 2,931.9ms worst mobile legacy/preview calls across **unpaired** continuous samples; these values do **not** establish causation or exact matched-frame deltas. Earlier original canvas+Opus WebMs decode to only eight desktop and nine mobile VP8 frames with largest respective gaps 5.707s and 4.658s. Neither recording is sample-synchronized or proof of physical contact. In the browser's real software renderer, D04-only avoidable CPU/GPU-buffer work is worth reducing, but remains unproven as the dominant multi-second stall cause.

Source inspection found that while an authentic skinned wrist was **stationary**, the D04 trail slot deliberately contained no measured sword passage, yet `advance()` still wrote `hideMatrix()` to that same already-hidden instance every frame and marked the entire eight-slot `trail` instance buffer dirty. Stalled-frame invalidation repeatedly did the same. Repeatedly uploading an *invisible* trail cannot improve realism.

## Patch and invariant

- `public/ai-dungeon/physical-feedback-visuals.js`: retain one boolean `matrixHidden` on each of the existing at-most-eight trail slots. The emission matrix starts hidden, and subsequent unmeasured, still-hidden advances age the slot without re-writing its matrix or marking its pool dirty. A new authentic wrist sample still writes the visible ribbon immediately; an existing ribbon transitioning back to absent/invalid is cleared **once**; dead/interrupted/expired slots still clear their matrix. Every other retained pool and its authority liveness policy remain unchanged.
- `tests/foundation/dungeon-d04-held-warning-gpu-update.test.cjs`: add a production-module/instanced-mesh contract with a real-by-fixture authored wrist. Four stationary frames must not rewrite the invisible matrix or mark the GPU buffer dirty. Actual measured wrist displacement must make the existing ribbon visible; cessation must clear it once and thereafter avoid redundant writes. This is not a genuine browser animation recording.
- No new geometry, shader, draw call, buffer, audio node, contact claim, rig, camera, light or authoritative game change. The seven-pool/102-instance maximum is unchanged. There is no impact/audio-budget change, and no relaxation of 400ms staleness, opt-in/mute, reduced motion/flash, deduplication, scene cleanup or frame submission.

## Red / green and independent review

1. The test-first commit [b7b1bd0](https://github.com/my-edutu/Ai_games/commit/b7b1bd0e7069a11bd32e6a7e5e12f858723c671e) ran in [CI 43286278041](https://github.com/my-edutu/Ai_games/actions/runs/43286278041): one expected **new** `a never-measured melee ribbon` assertion failed. This is observed red, not a fabricated test-first claim.
2. The implementation commit [847ef0c](https://github.com/my-edutu/Ai_games/commit/847ef0cfd3b53ced98d2f6de3d50290b17a74581) ran in [CI 43286384940](https://github.com/my-edutu/Ai_games/actions/runs/43286384940): **223/223 native contracts passed**, and the isolated contracts job completed successfully after the production build. The real-browser job was still in progress at this handoff's recorded inspection, so this candidate has **no newly verified real A/V acceptance result**.
3. The originally attached genuine WebMs, inspected independently with FFprobe, remain older **unaligned** recordings (desktop actual VP8 587×339, mobile VP8 386×517). They are not fresh 1440×900/390×844 matched three-viewpoint video evidence.

**Specification check:** Only D04's retained physical-feedback visuals, a focused D04 contract and this handoff change. The default route remains legacy, `?feedback=d04` remains opt-in, and no unauthorized ownership edits occur.

**Quality check:** A single bounded boolean per active ribbon makes the zero-motion behavior idempotent. The test verifies transition in both directions and dormant frames, as well as absence of false HP/contact claims. It does not measure GPU execution time. Further genuine Chrome evidence is required to show whether the live D04 frame-time distribution changes. An artifact from CI and a native unit test cannot establish sword impact synchronization or Diablo-IV parity.

**Rollback:** Revert implementation commit `847ef0c` and test commit `b7b1bd0` on this D04 branch only. Do not revert unrelated work, merge or force-push.

**Next dominant weakness:** Intermittent multi-second genuine WebGL submission stalls (also present with legacy and recorder off), leading to expired real HP-loss impact art and suppressed late audio. Correlate the new matrix-pressure telemetry with receipt-specific stall phases and test warmup, without attributing causation from unpaired samples. Still outstanding: three-viewpoint matched moving desktop/mobile before/after clips, Warden warning→release→recovery→earned counter, real miss/block/dodge/projectile/spell/HP impact comparisons, original decoded PCM-onset alignment, reduced-mode accessibility checks and 20-minute cleanup/soak.
