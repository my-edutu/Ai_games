# P0 — Recover original grounded GPU doorway evidence; native hard cut still rejected (2026-11-14)

**Status: P0 OPEN. Leading verdict: NOT EVALUATED.** Original draft PR #68 on PR #58. Immutable baseline `1731b380851162741761c5569e2bc152a0869ca9` unchanged.

## Exact prior gameplay and decisive defect

[Completed original nine-job matched source capture](https://github.com/my-edutu/Ai_games/actions/runs/43617860371) used immutable candidate `d234293ddee112765a8583ddf1812f1fb13e8d3c` against the unchanged frozen baseline, original 20Hz game authority, 25fps unedited WebM, 960×600 desktop and 390×844 portrait. Its eight gameplay jobs and event-pairing job succeeded. **That only confirms source and transport integrity, NOT experience or physically visible crossing.**

Inspected the genuine `danger/{desktop,portrait}/live.webm` at normal speed, including 22–30 seconds. In both, the bronze Clockwork world changes abruptly to a fully purple Floor 9 world; the full-body hero is not filmed crossing the SAME original gate. Strict visible continuous doorway remains **0/2 viewports**. The native original-scene-phase analysis reports **zero measured warm-to-cool bridging seconds**; visible violet cue at approx **26.75s** both views. Source crossing tick **475** searches at about desktop **24.109s** (2.641s cue gap), portrait **24.798s** (1.952s gap). Source event time and native video are not interchangeable clocks. Actual device FPS and memory are NOT EVALUATED.

## Discovered evidence blocker

The exported `physical-doorway-submissions.json` for BOTH views incorrectly reported `NO_RETAINED_BROWSER_AUDIT`, zero returned frames. Cross-checking the unmodified archive's `motion.json.observations[].observedPhysicalDoorwaySubmissionAudit.frames` proves there WAS an authentic, actual Three.js return at real Floor 9 source tick **475** in BOTH views:
- Original physical grounded source receipt tick: **475**; immutable `lastGuardianCrossing` not yet published in the first browser return, so `crossingTick: null`, with distinct `evidenceKind: verified-original-grounded-source-receipt`
- Original retained GPU gateway group: **true** desktop and **true** portrait
- Both living actor and original arch inside safe camera NDC, with unblocked core rays: **true** both viewports
- Actual `renderer.render` return cost at this source tick: desktop **118.2ms**, portrait **97.6ms**; these are software-WebGL returns, **not native paint or hardware frame time**

The exported classification discarded this genuine frame solely because it required an immutable integer `crossingTick`, although the renderer intentionally emits a separately validated source-grounded receipt before the delayed crossing publication. This is a **capture-auditor false negative**, not an absent original GPU arch. Repeatedly extending gateway geometry to solve supposed missing GPU retention would be misdirected.

## Committed P0 unblocker

- [Test-first regression](https://github.com/my-edutu/Ai_games/commit/4dadb03546ef1940508865ce29703e53cb918983): legitimate first source-grounded return, invalid/forged/expired receipts rejected, independent immutable crossing record kept distinct.
- [Capture forensic classifier repair](https://github.com/my-edutu/Ai_games/commit/ed22bcb2e77f51a2498a1bfb9bc9e19d8790f788): group by same run + real source receipt tick; admit a provisional sample ONLY with exact source-verified evidence kind and <=12 ticks; immutable guardian record retains its distinct <=55-tick classification. Report observed grounded receipt frames separately from immutable record frames; never infer an HP-zero victory or a native pixel from provisional evidence.

Direct execution of the updated, fetched production classifier against source-shaped samples: legitimate original grounded source return now classified `RETURNED_WEBGL_PROJECTIONS_ONLY`, 1 GPU owner retained, 1 receipt sample, 0 immutable-record samples, `BOTH_PROJECTED_NOT_NATIVE_PIXEL_VERIFIED`; forged and expired cases rejected. Original archive itself is unchanged. Full exact-head CI and recapture are separately required; no green claim from this direct check.

This change does **NOT** alter playable game physics, real 3D world, source snapshots, actor movement, collisions, guardian health, floor advancement, restart, web browser video or fabricated assets. It repairs the false-negative first-frame evidence blocker and identifies the correct next architectural target.

### Red/green workflow detail and source-gap correction

The [test-first exact-source workflow](https://github.com/my-edutu/Ai_games/actions/runs/43622359217) genuinely FAILED in Phase3 partition 2 on the newly added grounded receipt cases. The [first repaired implementation's workflow](https://github.com/my-edutu/Ai_games/actions/runs/43622422238) exposed a further genuine contract issue: after accepting a null immutable crossing the auditor still subtracted `firstFrame.crossingTick` from `sourceTick`, yielding **475** instead of the true **zero-tick first returned source gap**. Corrected the age calculation to use the same validated typed receipt/immutable anchor that selected the episode; [source-gap correction commit](https://github.com/my-edutu/Ai_games/commit/6f0de286b33ed04ea06b09d8e35f5c01bff4dc84). Executing the updated fetched production module directly now returns firstEpisode `run:475`, first gap `0`, 1 retained original GPU receipt frame, 0 immutable victory-record frames; invalid 13-tick receipts are rejected. Full workflow green is still **pending** at this review amendment.

## Next primary P0 build

On fresh exact-source native candidate capture, compare the classified returned original gate with the *actual* painted video first and identify where old bronze depth/camera continuity is lost between Three return and compositor/native frame. Investigate render-to-present latency and opaque world depth/framing together, not another isolated fade/material adjustment. Preserve authentic Floor 9 onward, result/intermission/restart evidence. Complete technical CI. The original filmed hard cut is still rejected until fixed in **both** viewports.

Required independent fresh-context blind critics: **LOOKS 0/5 · FEELS 0/5 · PLAYS 0/5**. Real supported-device frame-time p50/p95/p99 and memory: **NOT EVALUATED**. No merge, deployment, force-push, PR58 edit, baseline move, unrelated-game change, or draft-state change.
