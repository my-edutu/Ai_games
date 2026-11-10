# Infinite Tower Climb — P0 source-owned structural visibility and exact-head recapture

**10 November 2026 | Draft PR #68 only | verdict: NOT EVALUATED**

## Real-game evidence (before physical reconstruction)

The completed [original capture at bdb1b83b](https://github.com/my-edutu/Ai_games/actions/runs/42727101974) archived 16 original 60+s desktop/portrait WebMs. The [unchanged candidate portrait danger WebM](https://github.com/my-edutu/Ai_games/actions/runs/42727101974/artifacts/13723232240) is **390×844, 25fps and 72.52s**. I inspected native frames at 12, 14, 15, 16, 17, 18, 20, 22, 24, and 26 seconds. At native **15–17s**, huge dark bronze structural frames and a silver clockwork ring occupy the middle of the live fight, often between the climber and guardian. At 26s a floor-nine scene is visible; these sparse samples alone do not verify continuous gateway foot contact or event-to-visible-frame timing.

The same artifact's unmodified `camera-occlusion-forensics.json` includes genuine source-linked and retained original triangle-owner samples. At source ticks **298, 304, 310, 343**, optical rays resolve `['Mesh','tapered-structural-pylon','floor:8:clockwork']` (`LatheGeometry`) around world **x≈6–9,z≈15–17**; additional recorded rays intersect `GuardianGateInset` and `GuardianSealCounterweightRail`. This is an exact original authored mesh attribution, **not** a claim of final pixel-perfect silhouette ownership. The [ungraded original event pairs](https://github.com/my-edutu/Ai_games/actions/runs/42727101974/artifacts/13723049128) have 16 recordings, 8/8 native clock calibrations, no provenance/source-story defects and `fullMotionPaired=false`.

## Real source change already present when this run began

[Scene commit e1c54871](https://github.com/my-edutu/Ai_games/commit/e1c54871e4baf950183ca5ec9724b67c2416f081) physically rotates the clockwork-specific **secondary solid pylon** from a=.67 to 1.40 radians while keeping the original structure in other five-biome contexts; it also substitutes physical 2×2 daylight bronze grilles for opaque guardian seal wing slabs. This preserves the guardian lock/HP state, real collision, crusher, authoritative cap, world route and source gate. [Regression commit 6d41d78b](https://github.com/my-edutu/Ai_games/commit/6d41d78b9fd5e829243f979a45064eee4ede391a) adds source-geometry clearance checks; its [exact-head quality run](https://github.com/my-edutu/Ai_games/actions/runs/42729702639) succeeded. **No post-e1 source-pinned WebM had been captured or inspected at review creation.** Do not treat green CI as proof of better looks/feels/plays.

The previous bdb1 ten-job workflow had all eight native film branches and pairing successful but failed one authentic-ledge job because test-fixture copying omitted `mesh-provenance.mjs`; commit 2f078980 repaired the fixture and current quality is green. A previous failed workflow must not be reclassified green.

## This execution's verification unblocker

This review and the updated `capture-request.json` and `transformation.json` intentionally request a **new, exact immutable github.sha recording** against the frozen baseline `1731b380851162741761c5569e2bc152a0869ca9`. The request file is a GitHub Actions path trigger, not a substitute for film. It must produce the genuine original-client 960×600 and 390×844 normal-speed 60+s ascent, moving, danger and outcome recordings. Inspect native danger **12–26 seconds**, pylon-owner evidence, real guardian+crusher cause/effect, grounded gateway crossing, floor-nine onward and actual outcome/restart; reject cropping, visibility regression or hidden hazard. Review outcome/restart and platform motion in their full source-paired films, not isolated stills.

**Evidence exclusions:** No original browser is available from the disconnected development tunnel in this run. Original CI and captured bdb1 footage are genuine; new scene's running visual benefit is **NOT EVALUATED**. Actual supported-device p50/p95/p99 and memory **NOT EVALUATED**; independent randomized fresh-context blind LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**. No reviewers have been invented.

**Precise next decision:** Inspect the new recording once present and compare to bdb1 and immutable baseline; if solid pylon/grille still blocks true upper-cap actions, locate the source-authored mesh at exact culprit ticks and reconstruct it. Do not advance beyond P0 without original image-event and full-loop proof. Keep PR68 draft; no merge, deploy, force push, PR58 or main edit.
