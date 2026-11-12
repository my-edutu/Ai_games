# Infinite Tower Climb PR68 — P0 original cold-floor vertex-stream packing

**2026-11-12. P0 EVIDENCE + GAME-LOOP TRUTH remains OPEN. Leading assessor: NOT EVALUATED.**

Scope: candidate branch `feat/tower-transformation-gauntlet-20261101` only, original draft PR68 based on PR58. Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` remains immutable. No merge, deployment, force update, PR58 rewrite, or draft-state change.

## Inspected genuine previous source and footage

- Latest quality [run 43153180129](https://github.com/my-edutu/Ai_games/actions/runs/43153180129) **completed successfully** on `ba3b878dad60b81fa0ebedecc297fd7b718899a0`. This is a code-quality veto, not viewer acceptance.
- Latest original [capture 43152895528](https://github.com/my-edutu/Ai_games/actions/runs/43152895528) preserved all **eight** source-pinned normal-speed 60s+ baseline/candidate recordings, including 960×600 and 390×844 at candidate `d94dd7ba341bdc508552913505dc7fc9acdf5cd0`. The source-event pair job **failed 0/2** strict film alignment, despite 8/8 film production and no source-integrity defect. Do NOT treat the emitted ungraded pair as an accepted blind evaluation.
- Downloaded authentic original candidate danger [artifact 13914374216](https://github.com/my-edutu/Ai_games/actions/runs/43152895528/artifacts/13914374216), inspected timed real desktop and portrait frames 13–32s. Floor 8 has bronze scaffolding visually competing with both actor and guardian. Around video 25.5s both recordings cut to the violet Floor 9 with no convincingly uninterrupted grounded arch crossing. These samples cannot prove normal-speed viewer acceptance.
- Actual native sidecars: Floor9 source tick451 at **23.141s desktop** / **23.295s portrait**, but drawn Floor9 HUD around **25.5s both**: +**2.359s desktop**, +**2.205s portrait**. Source→browser→returned Three render→native HUD clocks are *diagnostics*, not GPU-present timestamps. Desktop browser→returned Three render **1248ms**; portrait **1440ms**. Do not invent FPS or a verified latency reduction.
- Previously introduced indexed rigid batching preserves face ownership; however each real static material batch still builds **three distinct GPU attribute buffers** for position, normals, UV. First new-floor renderer work is expensive. Avoid a further unmeasured camera or gameplay rule change until the cold-world presentation cost is retested.

## Test-first and implemented coherent P0 renderer improvement

- **RED first** `396bd287073b59a7fdbf7bffece9789ee6ad6873`: strengthen `tests/phase3/tower-rigid-batch-upload-budget.test.cjs` to demand genuine one-buffer per-batch position xyz/normal xyz/UV xy layout, shared InterleavedBuffer identity, accurate sample values, exact original indexed triangle provenance and diagnostic accounting. The [test-first quality run 43156447046](https://github.com/my-edutu/Ai_games/actions/runs/43156447046) FAILED before implementation.
- **Implementation** `0b8c65df0a531a28f04e6d8538a4b39cbfe2aca4`: the actual `createTowerWorld().batchRigid()` now emits one `THREE.InterleavedBuffer` (stride 8, XYZ + normal XYZ + UV XY) and three `InterleavedBufferAttribute` views into the same static vertex stream, instead of three separate GPU attribute buffer uploads. Indexed or nonindexed per-batch decisions, triangle order, originalMeshPath source ownership, material batch draw count, character, guardian, hazards, collisions, movement, camera, accessibility and source 20Hz state remain untouched.
- The genuine static payload remains the **same measured byte count** as the earlier separately allocated indexed/nonindexed batches; this optimization primarily cuts potential cold upload/bind overhead. Counters report both real Three interleaved buffer objects and prior equivalent separate attribute buffers, not measured device memory, upload calls, GPU time or game frames.
- **After-code exact SHA quality:** [run 43156644167](https://github.com/my-edutu/Ai_games/actions/runs/43156644167) **PENDING** at review authorship; no pass or raster improvement claimed. If CI reveals a genuine regression fix it before recapture; never count test numbers as experience.

## Independent engineering reviews (not blind experience judges)

**Specification contract:** zero changes to authoritative gameplay; every rigid source triangle index and per-part source owner ranges survive; reused original normals and UVs follow the same transformed vertex; missing UV remains zero. Exact batch byte accounting and cleanup/reset remain. Source SHA and frozen baseline never substituted.

**Quality risk and mitigation:** Three/WebGL interleaving can alter attribute binding and renderer behavior on cold floor. This may fail to improve shader compilation or software WebGL frame cost and could introduce buffer/owner or missing-face regressions. Source-authentic 60+ second before/after WebMs and actual-device p50/p95/p99/memory are mandatory. Revert this candidate change if CI or after-film identifies regression; a smaller VBO count alone is **not** a positive experience verdict.

## Next P0 acceptance evidence

Capture source-pinned 960×600 desktop and 390×844 portrait original baseline/candidate ascent, moving deck, guardian/crusher, outcome/restart using matching seed/tier. Inspect exact new SHA native phase-to-source events, first Floor9 renderer-return timing and 60s+ full-motion physical passage; compare *not just* byte counts. Main visible defect remains bronze-cluttered boss and discontinuous threshold, with 0/2 strict event-to-film alignment. If render cost remains high, identify the next actual cold WebGL bottleneck rather than blindly layering more camera patches. LOOKS 0/5, FEELS 0/5, PLAYS 0/5 genuinely independent judges; supported actual-device performance and memory NOT EVALUATED. Remain P0.
