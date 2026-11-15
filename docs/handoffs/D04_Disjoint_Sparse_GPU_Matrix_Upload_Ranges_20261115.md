# D04 — bounded disjoint retained GPU matrix uploads (2026-11-15)

**State:** isolated implementation and regression committed. New-head native CI and genuine Chrome A/V acceptance **not yet verified**. No production or realism-complete claim.

## Scope and first-order defect

Work only in `feat/dungeon-d04-combat-feedback-realism-20261108`, starting at `11c8f8c7db0ddc365c4754f79ed3c58e772eb2b0`. Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324`.

The prior single-span matrix-update coalescer retained bounded JS metadata, but one dirty hit instance at index 0 and one at index 47 widened to a **768-float** (3072-byte) transfer spanning all 48 reserved hit instances. This happened even with only two modified matrix rows. In the actual stalled Chrome frame path, GPU upload pressure is a plausible contributor but is **not proven causal**; the previous browser run still failed strict drawable-HP acceptance.

## Implementation

- [Test-first regression](https://github.com/my-edutu/Ai_games/commit/800988f76a7380f56bdbccfb300bbda1ad216b41): disjoint/adjacent row coverage, 500 invisible-pool edits, conservative malformed-range fallback, full-matrix bounds, and a four-range cap.
- [D04-only source](https://github.com/my-edutu/Ai_games/commit/5d0b1fc0a3584377cde01ef8b8c9e1bcc6c453a7): exported pure planner `planD04MatrixUploadRanges` and `MAX_D04_PENDING_MATRIX_UPLOAD_RANGES=4`, connected directly to retained visual `setRetainedMatrix`. Pending `BufferAttribute.updateRanges` remain sorted, nonoverlapping, matrix-row-aligned and bounded. Adjacent spans are merged; exceeding four ranges deterministically fills the *smallest untouched gap* first. Invalid old ranges fall back to the reserved capacity.
- For two opposite dirty rows, the intended pending values are `[{start:0,count:16},{start:752,count:16}]` rather than `[{start:0,count:768}]`. Four intervals can add bufferSubData calls relative to the single-span algorithm; actual cost must be measured under Chrome before declaring this faster.

No audio recipe, semantic cue, injury authorization, Warden danger marker, renderer/camera/rig, shader, gameplay authority, gameplay file, or default route is changed. The unchanged D04 opt-in remains `?feedback=d04`. Resource budgets remain seven pools, 102 reserved instances, at most seven visual draw calls, eight foley voices, one <=19,200-sample mono noise buffer, bounded queues and the 400ms audio deadline.

## Evidence and limitations

- [Last completed genuine Chrome workflow on previous source](https://github.com/my-edutu/Ai_games/actions/runs/43697968788): native contracts **369/369 passed** and build passed; genuine browser **6 passed, 1 failed**. Six viewpoints produced twelve frame-acknowledged authentic states each, five shared HP-loss state ticks and **zero HP-loss ticks with drawable receipt in all six**. Decoded A/V sample alignment is unverified. This workflow does **not** validate the disjoint range implementation.
- [Regression-only workflow](https://github.com/my-edutu/Ai_games/actions/runs/43702957553): CI queued on inspection, then canceled by newer push; therefore native RED is **unverified**, though the missing export on the regression-only commit is inspection-verifiable.
- [Implementation-head workflow](https://github.com/my-edutu/Ai_games/actions/runs/43703233226): initiated. Native GREEN/build, real WebGL GPU transfers, matched decoded contact-frame and original sound onset are **unverified** until its own results are inspected. Do not attribute the prior 369 passing tests to this revision.

## Review/rollout gate

1. Inspect final-head workflow native results and actual Chrome status; keep strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` as a failure.
2. Confirm actual Three.js `updateRanges` uploads in moving injury and Warden sequences; measure count/bytes and p50/p95/p99/worst renderer times without asserting a GPU timer from post-CPU clock.
3. Independently decode matched real 1440x900 and 390x844 cinematic/tactical/chase WebM plus original PCM; distinguish authoritative HP loss, submitted drawable effect and audible samples. Obtain miss/block/dodge/projectile/spell and Warden warning-release-recovery-counter.
4. Run 20-minute cleanup/voice/consent/mute/reduced-flash/motion and WebGL recovery soak before integration review.
5. Roll back only this isolated source/test patch if driver overhead rises or any effect is missed. **Never merge/deploy** the experiment or modify the legacy default.

**Next dominant acceptance weakness:** genuine mobile drawable HP contact and large renderer submission stalls. Upload-range optimization alone is not evidence of improved physical contact or audio synchronization.
