# Infinite Tower Climb — P0 original-film physical triangle attribution

**Date:** 10 November 2026. **Scope:** Draft PR #68, `feat/tower-transformation-gauntlet-20261101`, based on unchanged PR #58. **Leading transformation verdict: NOT EVALUATED.**

## Source-pinned film before implementation

The newer [9 November 2026 original source-pinned ten-job capture](https://github.com/my-edutu/Ai_games/actions/runs/42722974373) at candidate `9db4f6bc631f4a1edab230a4a40bce4da236bfed` completed. Its [candidate danger artifact](https://github.com/my-edutu/Ai_games/actions/runs/42722974373/artifacts/13720833464) contains an unmodified native **390×844, 25 fps, 72.64-second WebM**. I opened the actual film, sampled its source video at native **15 and 17 seconds**, and inspected the attached original camera-occlusion sidecar. The giant steel ring and bronze rectangular frames **still dominate the real climber/guardian shot**, despite the newly raised and reduced upper-right decorative rotor. This is **not** an improvement proven by the last geometry test or completed CI. Around native 25s floor nine becomes visible, and later frames show an outcome/restart, but sampled imagery and indexed game events are **not** uninterrupted event-matched acceptance.

The source-owned post-batch camera ray witnesses include `floor:8:clockwork / rigid-material-batch` triangles, around world y≈34–42, at real observed source ticks. The static batching merges authoring meshes by material and discards their names. It was **not possible to identify which authored metal tube, ring, support or frame actually caused each ray hit**, so another guessed scene relocation would be irresponsible.

## One integrated evidence-unblocker, not another cosmetic tweak

- `088d61fa622105da4eb6960e8a86a0fa597db1d4` adds pure `originalMeshPath` and `sourceTriangleOwner` helpers. They map non-indexed, zero-based submitted triangle faces to original authoring object hierarchies and instance indices using bounded sorted ranges.
- `516e57e200b7dbd7a6d1a96eb1fb627472db8415` modifies the **real** `batchRigid` path to preserve half-open per-authoring-part face ranges directly on each merged floor-owned `BufferGeometry.userData`. One range per authored mesh/instance is stored **only at floor rebuild**, not per frame or per triangle. Existing rigid geometry/draws and actor, platform, enemy, crusher, gate and simulation authority are unchanged.
- `e6a4804e66583148e6d0349401a9ef905e42d1a3` extends the **existing** opt-in portrait source-tick physical ray witness with `originalAuthoring` resolved from the **actual hit object's geometry** and `faceIndex`. It performs no additional raycasts and does not alter visibility, rendered WebMs, gameplay, physics, AI, source-clock calibration or user telemetry outside opt-in capture.
- `30d29b4f80cc5fc4fef32aa575d203b002664e76`, `7452d631e414b602cc7711360b340a312a64766f`, `11a338432ab79869f6cbcd3caca77faef0b2af4b`, and `9c094857f80728d083eeec07dcd4e14f1729c6a3` adapt the existing real Three.js test import bridges, make the source-host owner-ray fixture execute the real provenance helper, and assert complete original submitted face ownership, no false out-of-bounds attribution, released floor-nine old mesh ownership and unchanged game snapshot.

This is an evidence collection *unblocker*. Passing source tests cannot demonstrate that the huge foreground steel ring has been physically corrected. New original WebMs must contain named `originalAuthoring.authoringPath` for the obstructing source triangle at 15–18 seconds; until then the actual offending authoring component remains unknown.

## Open verification gates and next decisive action

At review creation, the previous exact-source [10901908 quality run](https://github.com/my-edutu/Ai_games/actions/runs/42723151855) is green. New tests and film **must be verified at the latest exact immutable HEAD**; no synthetic critic, arbitrary quality score or screenshot-only pass is permitted. Independent blind critics: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Actual supported-device p50/p95/p99 and memory: **NOT EVALUATED**. Full 60+s matched normal-speed anonymous baseline/candidate playback, precise floor-nine physical crossing and outcome/restart *raster-event* match: **NOT EVALUATED**.

**Next decisive action:** run original exact-HEAD quality and source-pinned ten-job gameplay capture; inspect `cameraRayMeshOwnerSamples.probes[].hits[].originalAuthoring` against native 390×844 danger **13–22 seconds** (and 960×600). Identify which original physically rendered assembled clockwork/structural piece occupies the guardian shot. Only then reconstruct that specific art/camera relation, preserving the genuine moving deck, warning, guardian/crusher counterplay, earned grounded gateway, floor nine onward and true result/restart. Repeat real film, supported devices, and genuinely independent blind comparisons. **Stay P0 OPEN.**

Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` remains unchanged; PR68 stays draft. No merge, deployment, force push, PR58 or main edits.
