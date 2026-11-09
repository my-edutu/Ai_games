# Tower PR68 — bounded source-body clockwork raycasts and restored actual camera contract

**Run:** 2026-11-09 · **Stage:** P0 OPEN · **Transformation verdict:** NOT EVALUATED
**Parent inspected:** `1621acc80f8bb3d9a7d3a03381a3ce05a3cec601` · **Frozen baseline:** `1731b380851162741761c5569e2bc152a0869ca9`

## Source-evidence and specification finding

The older original-source portrait danger WebM from [workflow 42426089449, artifact 13594459833](https://github.com/my-edutu/Ai_games/actions/runs/42426089449/artifacts/13594459833) showed an enormous foreground clockwork face masking the climber/guardian around native 16–18 seconds. That is historical **e0fe7729** footage; it does not prove the newest open-rim and camera changes fixed or failed. Its recorded JS submission intervals were highly uneven in software WebGL; they are **not GPU-presented FPS nor actual-device measurements**.

The current world renderer already built true world-space unions over the rotating foreground gear plus **rendered post-batch clock-case meshes**, but repeatedly invoked recursive triangle raycasts for every source actor/guardian/landing/hazard silhouette sample **even when the entire genuine decorative assembly was off the ray**. This is a plausible avoidable JS cost; profiling cannot establish how much it costs while the authorized checkout and GitHub runners are unavailable.

Also, the original `tests/phase3/tower-foreground-sightline.test.cjs` still asserted that the submitted camera declared the removed `protectArrival/protectImmediateTrap/protectEarnedGate` variables. Current scene correctly uses `sourceCriticalSightlinePriorities` and independent landing + hazard positions. This was an immediately reproducible **source-contract mismatch** that would veto current CI regardless of actual camera behavior.

## Integrated correction

- `public/infinite-tower-climb/visuals/world.mjs`: use the existing up-to-date **combined world-space AABB** as a conservative Ray broadphase before recursively raycasting the real animated gear and its physically rendered, separately batched backing. A missed full infinite ray provably cannot intersect a triangle inside the box; empty/unusable boxes retain original exact testing. Retain one reused hit array with clearing between gear/backing queries. Keep the original near-screen projection/silhouette fallback (including if the box misses), all four original decorative assemblies, composited alpha policy, hazard/guardian/landing protections, source tick evidence and stale recovery. Expose only bounded per-assembly counters `rayBoundsRejects`, `rayNarrowphaseChecks`, `raySamples` for the next original-frame cost probe.
- `tests/phase3/tower-foreground-sightline.test.cjs`: remove the obsolete invented camera-variable policy assertion and test the **actual shipped source-critical-sightlines module** with independent simultaneous arrival/hazard, genuine airborne gate and terminal refusal. Preserve the submitted-camera ordering requirement.
- `tests/phase3/tower-clockwork-guardian-sightlines.test.cjs`: assert post-batch bound prefilter, retained hit array, maximum eight rays per assembly, and evidence consistency. Existing exact-ray and original scene integration tests remain the authority for regressions.

## Acceptance / quality review

This is **performance-path restructuring and a correctness/CI unblocker**, not a measured faster game or approved action look. The geometry bound includes every relevant world-owned rendered mesh and does not move or hide anything by itself. Visual alpha, actors, source collision, camera choice, combat and seeded replay rules are unchanged. No added shader, triangle, texture, networking, timer or worker; one reusable hit array and two integer counters per bounded query, reused across frames. A genuine performance improvement is NOT measured.

**Executed checks in this run:** exact GitHub HEAD/source/PR draft and baseline inspected; existing old camera assertion compared to current source and found stale; new source and test contracts statically audited. **Not executed:** original Node22/Three.js integration suite, full build, Chromium, matched 60+s current WebMs, two exact-candidate 3,200-tick source campaigns, event-to-native-PTS alignment, device p50/p95/p99/memory, five independent reviewers. The authorized app-development tunnel reported `Tunnel-client has not been seen for 300 seconds`. Latest source quality workflow [42565705715](https://github.com/my-edutu/Ai_games/actions/runs/42565705715) had **zero assigned jobs** and the previous nine-job [42490211469](https://github.com/my-edutu/Ai_games/actions/runs/42490211469) was queued/unassigned.

**Largest actual observed footage defect:** foreground clockwork blocking the climber and guardian at 16–18s in the earlier source-authentic portrait clip. It has **not** been reassessed against the latest candidate; do not claim resolved.

**Next highest impact:** recover executable original checkout or assigned runners, run exact-source new Three.js regression and full suite and two 3,200-tick campaigns; capture current/frozen original 960×600 and 390×844 normal-speed ascent, moving, guardian/crusher, grounded doorway, floor-nine, outcome/intermission/restart with native PTS/source-event binding. Inspect at normal speed and rebuild the largest *current* experience defect. Only after accepted film seek genuinely independent five randomized critics each LOOKS, FEELS, PLAYS and actual-device timing/memory.

**Safety:** no changes to main/PR58, other games, gameplay rules, frozen baseline, PR68 draft state; no merge, force-push or deployment. Independence 0/5 each; stage remains P0 and verdict NOT EVALUATED.
