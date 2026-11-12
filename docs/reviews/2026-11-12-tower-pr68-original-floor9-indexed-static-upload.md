# Tower PR68 — P0 measured Floor 9 first-render GPU upload reduction

**12 November 2026 — P0 OPEN. Transformation assessor: NOT EVALUATED.** Original source only: `my-edutu/Ai_games`, existing **open draft PR #68** on PR58 branch. Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` remains untouched. This work only changes candidate world assembly, task-specific tests, evidence and capture request. No merge, deployment, force-push, PR58 rewrite or draft change.

## Exact original evidence before change

- [Original 10-job capture 43150616902](https://github.com/my-edutu/Ai_games/actions/runs/43150616902): eight original source-pinned 60s+ baseline/candidate desktop 960x600 and portrait 390x844 normal-speed gameplay jobs succeeded. The **pair source-events job failed**, no accepted aligned guardian films or independent reviewer votes. Candidate SHA: `c323700d87d90378dc29b17d6cc5f60e6e5d59a2`; frozen baseline unchanged.
- [Authentic original candidate danger artifact 13914301409](https://github.com/my-edutu/Ai_games/actions/runs/43150616902/artifacts/13914301409): inspected the original WebM in both viewports at 1x source timing and timed frame sequence 14–27s. On the upper cap, bronze foreground frames the living boss too busily, then Floor 8 wood/copper is abruptly replaced by Floor 9 purple around **25.25s desktop / 25.50s portrait** without legible uninterrupted whole-body crossing.
- In original `native-scene-phase.json`, source Floor 9 tick451 is at 23.18276s desktop / 23.74173s portrait; original drawn HUD displays 9 about **2.067s / 1.758s later**, **0/2 strict alignment**. The same-run HTTP-accepted tick452 to returned Three.js render is about **1185ms desktop / 942ms portrait**. The return is *not* GPU present/compositor.
- First returned Floor 9 WebGL submission in the corresponding `motion.json` render-work ring: **desktop world CPU rebuild 123.9ms, scene update 126.4ms, renderer.render() return 711.5ms, total scoped submission 837.9ms**; **portrait world rebuild 142.2ms, scene update 143.7ms, renderer return 459.2ms, total 602.9ms**. This identifies a material rendering-side cold transition cost, rather than an unsupported assumption that HTTP polling is the bottleneck.
- Original native video remains FAIL for accepted event synchronization, gateway continuity, guardian/crusher physical action. No actual-device GPU present, p50/p95/p99, memory, or 5 genuinely independent LOOKS/FEELS/PLAYS critics were available.

## Material production change (test-first, not a proved experience win)

- Red contract at `bce0a8cb12d05503a9b26601df01cbfd77ea8cf0` exercises the actual generated void Floor 9 world, not a duplicate mesh generator. It requires preserving authored per-triangle attribution and never increasing estimated static-geometry attribute/index buffer payload.
- `64f49d42d92aa3ea9c55b88ced6f459a5ae623f4` rewrites the real `batchRigid` geometry assembly in `public/infinite-tower-climb/visuals/world.mjs`. Repeated indexed source vertices no longer expand to one full set of position/normal/UV floats **per triangle corner** in favorable rigid batches. An explicit per-batch 16/32-bit index overhead comparison falls back to the original nonindexed output if it would upload more bytes. Three.js draw-call batching, material, lighting, actual platform/hazard geometry, source per-part triangle order and raycaster `faceIndex` authoring ranges remain unchanged.
- `b034c9802323c5847b8393e922fe61208763bdb1` records the actual newly assembled floor static attribute/index bytes and equivalent previously expanded bytes in bounded `world.diagnostics().rigidBatchUploadBudget`. This is a **CPU-side BufferGeometry payload estimate**, not driver memory, actual GPU upload duration, native FPS or user-perceived quality.
- `211c81f5c2b3c4687a3864ea7b5fe7717a0403d7` strengthens the real-world test to require diagnostic agreement with actual assembled buffers.
- Gameplay 20Hz authority, AI, combat, physical crossing checks, recorded source tick/order, sound, HUD, motion and graphics recovery were not changed. Potential risk: indexed meshes alter GPU upload/raycast pathways and must pass exact-head CI, source ray-owner tests and actual 1x capture before acceptance.

## Two independent engineering review passes (not blind gameplay critics)

**Specification review:** selective per-source-part index rebuilding preserves the exact original triangle order, normals, UVs, source owner ranges and no changed physics. Counter ownership resets on floor/graphics disposal and is attached only to the same 3D world. Never infer hero action or win from a reduced number of attribute bytes.

**Quality review:** The previous source-frame renderer-return cost dominates scene CPU, so reducing repeated static vertex uploads is a production-path optimization worth testing. But shader compilation and WebGL driver work may still dominate: do not claim lower latency without a matched original after-film showing p95/p99 and actual 8→9 phase. Validate byte reduction in quality tests; reject the change if device/video evidence reveals cost, raycast regression, missing faces, or arch discontinuity.

## Next P0 gate

Run CI on exact final source SHA; capture immutable baseline/candidate original 60s+ videos for four gameplay situations in 960x600 and 390x844, identical seed and low tier, plus source-ledger and strict native event pair. Compare same run/tick Floor9 first `renderWorkMs`, original drawn HUD phase, genuine door crossing, guardian/crusher hit and uninterrupted Floor9/10/result/restart. Remain P0 until strict event/native acceptance and video UX pass; blind critics 0/5 each, supported device performance NOT EVALUATED.


## Exact-head CI finding and source-triangle contract recovery

[Quality run 43152480067](https://github.com/my-edutu/Ai_games/actions/runs/43152480067) failed **1 real contract** after implementation (1,415 passed; one skipped): the existing original-source guardian-sightline test asserted that `geometry.attributes.position.count % 3 === 0` and that owner face ranges ended at `position.count/3`. That assumption was valid only when every emitted triangle expanded to three distinct GPU vertices. With adaptive indexing it rejected valid actual indexed geometry, even though the new source-to-face attribution indexes submitted *triangles*, not distinct vertices. This is not a permission to bypass that critical provenance guard.

The exact correction at `ba3b878dad60b81fa0ebedecc297fd7b718899a0` requires `(geometry.index?.count ?? geometry.attributes.position.count) % 3 === 0`, checks EVERY submitted index is a real in-bounds vertex, and still requires all original authored triangle ranges to cover the entire submitted index/triangle stream contiguously, without overlaps, gaps or invented ownership. Existing first/last source owner assertions remain. This repairs the nonindexed-only test fixture without weakening the mesh-integrity gate. New exact-head CI **NOT YET VERIFIED** at review update. The earlier red CI remains recorded, not erased.

The real-playable implementation on the PR branch is unchanged by this test correction. The earlier 10-job original after-film request at `d94dd7ba341bdc508552913505dc7fc9acdf5cd0` was still running when this review was amended. A fresh immutable request after the correction is required for candidate SHA identity if the older source is not sufficient. Stage P0 OPEN, LOOKS/FEELS/PLAYS 0/5, device FPS and memory NOT EVALUATED.
