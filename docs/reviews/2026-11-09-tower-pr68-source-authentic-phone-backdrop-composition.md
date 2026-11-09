# Infinite Tower PR68 — original phone guardian backdrop composition
2026-11-09 · Active gate: P0 EVIDENCE + GAME-LOOP TRUTH — OPEN

## Evidence before implementation
- Examined draft [PR #68](https://github.com/my-edutu/Ai_games/pull/68) at `8e8d015db79ac6eb41e8ed767e959dabce309af4` and immutable frozen baseline `1731b380851162741761c5569e2bc152a0869ca9`; current review scope is ONLY Infinite Tower.
- [Original 9-job capture 42610816382](https://github.com/my-edutu/Ai_games/actions/runs/42610816382) completed all 9 jobs successfully: source-owned ledge & two actual same-run guardian/crusher source campaigns and eight authentic baseline/candidate 960×600, 390×844 normal-speed 60+ second WebMs. [Candidate danger](https://github.com/my-edutu/Ai_games/actions/runs/42610816382/artifacts/13670072777) and [baseline danger](https://github.com/my-edutu/Ai_games/actions/runs/42610816382/artifacts/13670766270) were downloaded and inspected as **original** WebM frames. Original quality run [42610816448](https://github.com/my-edutu/Ai_games/actions/runs/42610816448) succeeded.
- Candidate portrait danger **16–18s**: an enormous clockwork face and structural rack dominate the small gameplay shot while the airborne blue/white hero and guardian compete for space. Baseline samples of 16–18s show both figures more directly, but source episode timelines are not aligned, so these samples **do not certify a fair gameplay A/B**.
- Source camera diagnostic in the candidate artifact at **tick 445** (not proven to be native film second 16) lists `clockwork-monumental-left-shoulder` screenCoverage `0.3507`, nearestWorldDepth `54.94`, actorDepth `20.96`, `inFrontOfActor=false`, `renderedAlpha=1`. The legacy rule rightly preserved a clock **behind** the actual hero for occlusion, but no rule addressed its separately excessive visual backdrop occupancy in portrait.
- Recorded source events show genuine guardian defeat, floor-nine handoff and later outcome, and original ledge browser checks now pass. However native PTS calibration to these **specific visible frames** and direct watched grounded gate crossing/restart remain **NOT EVALUATED**; this is not a P0 finish.

## Integrated change — noncolliding stage backdrop not gameplay masking
**Committed game implementation:** [dfde793d](https://github.com/my-edutu/Ai_games/commit/dfde793de254fdb936b389f46e6aee7e8f8bbe9f).

`world.mjs` adds `observedPortraitActionBackdropOpacity` and runs it **after** normal camera/bounds/three-body/collision-ray checks, ONLY if:
1. A genuine 390×844-class camera has a current visible actor and at least one real projected guardian/landing/hazard/earned-gate endpoint.
2. The actual decorated world-space mesh envelope occupies at least 22% of phone NDC area, with nontrivial centre coverage intersecting the actor or real action midpoint.
3. The assembly is noncolliding decorative clockwork **behind** the hero, with no actual ray hit. A nearby foreground clock still obeys the stronger existing occlusion rules.

Retained world meshes blend their alloy, trim and clock-case opacity with the existing dt/reduced-motion discipline, and now share the inter-assembly alpha budget even for background scenic silhouettes. There is **no invented actor or hazard, no change to deterministic snapshots, AI, guardian/crusher rules, platform collision, physical gateway, controls, floor transitions, or desktop shot**. Bounded per-frame work: at most four existing decorative envelopes and four already projected source partners; no fresh geometry, textures or render submissions.

## Test & critical review
- Seven direct probes executed against the **exact committed exported pure policy**: 0.30 opacity for oversized actor/guardian scenic competition; 0.46 for smaller competition; full opacity for desktop, offscreen guardian, solo hero, edge scenery and invalid input. The new `tower-foreground-sightline.test.cjs` checks these and integration ownership.
- [Exact implementation quality workflow 42618415109](https://github.com/my-edutu/Ai_games/actions/runs/42618415109) was **IN PROGRESS** at implementation inspection. Full native Node/Three/Chromium checks were not executed in the disconnected development tunnel, so no green claim is made for the new source.
- **Specification review:** frozen baseline and source-authority boundaries preserved; fresh original footage and fifth-party votes still pending.
- **Adversarial quality review:** the camera's wheel may partly be authentic source-owned moving-platform machinery (which **must stay opaque**), not just decorative clockwork. A fade of far-background decoration might create momentary ghosting or a contrast discontinuity. The earlier 16–18s sample and tick445 forensics are **not calibrated to each other**, so the newly patched condition may fail to address the dominant actual wheel. Only new normal-speed native film can decide. If true hazard machinery obscures danger, solve camera/world readability rather than fading gameplay surfaces.
- Accessibility, low-tier rendering budgets, p50/p95/p99, actual memory, device support, audio and real user review remain **NOT EVALUATED**.

## Next gate action
The request-file commit triggers a NEW **exact-request-SHA** 9-job baseline/candidate desktop/portrait recording through the existing dedicated workflow, without moving baseline. Inspect 14–24s native phone video, and full ascent/moving/guardian/gateway/floor-nine/outcome-restart continuity. Confirm the absence of new opacity pop or new actor obstruction, and bind PTS frames to source events before independent randomized reviewers.

Independent blind **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. P0 **OPEN**. Verdict **NOT EVALUATED**. Do not merge/deploy/force-push/promote this draft or alter PR58.
