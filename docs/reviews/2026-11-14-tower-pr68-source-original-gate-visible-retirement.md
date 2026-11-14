# Tower PR68 — P0: source-earned original gate's visible retirement (2026-11-14)

## Fixed source, branch safety

- PR #68: https://github.com/my-edutu/Ai_games/pull/68 — open draft, based on active PR58; no merge, deployment, force push, status change or unrelated game edits.
- Frozen baseline from `public/infinite-tower-climb/gauntlet/transformation.json`: **`1731b380851162741761c5569e2bc152a0869ca9`**, unchanged.
- Inspected initial active PR68 head: `6907f6d305254c3e511f84523f7a7f3f9a622895`.
- Targeted original WebGL/audio/source authority only through Tower presentation; deterministic simulator, guardian HP, physics/colliders, movement and outcome/restart untouched.

## New normal-speed footage read in this run — still fails visual P0

The completed 9-job immutable source capture https://github.com/my-edutu/Ai_games/actions/runs/43537587011 pinned candidate **`6907f6d305254c3e511f84523f7a7f3f9a622895`**, seed `tower-transformation-capture-v1`, low tier, true 25fps WebM. Original desktop **960×600** and portrait **390×844** danger films were downloaded and inspected at 22–30 seconds. Both show actual Floor8 bronze/guardian and climb, and then a severe **entire-world bronze-to-purple replacement near 24.5–25.5 seconds** without one readable full-body passage through the same old door. Source reports real guardian HP0 at tick441 and grounded Floor8→9 at tick451. The old film is **NOT** a valid acceptance for the implementation below.

Capture facts: 8/8 baseline/candidate gameplay matrices produced native clips; seven of eight motion jobs succeeded; candidate outcome exported both native views but its strict event-frame-probes step failed and native paired-event job failed. All evidence is retained in the run's artifacts. No blind pair or source-pixel synchronization PASS. Required original 1× matched full-event video: **0/2 desktop and portrait**.

The 10-job exact-source QUALITY gate for pre-change capture source `6907f6d3` **passed** (https://github.com/my-edutu/Ai_games/actions/runs/43537587012). This is a technical check, not evidence of a good game. Earlier source `99c43a7` had 9/10 success, Phase6 unrelated readiness test timed out (exit 124); no edits to Maze or other games.

## Largest source-verified implementation weakness

The existing world retains real bronze cap, arch and extracted load-bearing gallery. Its original gate material opacity had recently gained real 3D source departure and returned WebGL frame validation; however the **GPU group was still deleted unconditionally after five submitted frames and 1.65 rendered seconds**. At that boundary the source player could have left the bronze sill but be partway up the actual Floor9 ascent while the original gateway retained **nonzero alpha**. The entire real arch/gallery would therefore vanish on a timer, even when the source walk and renderer had not finished an optical exit.

This is an observed code-path defect, not proof that it caused all of the original native bronze-to-purple cut. It is an interlocking system gap in the ongoing physical passage reconstruction.

## Implementation (same PR68 branch)

1. **Test-first commit `5466bead0c894709453c323973096dc267348092`** adds true-F9 synthetic fixture contracts for 10m source ascent, 16 actually-returned frames/2.0s, full optical extinction rather than timer deletion, unchanged run/guardian authority and resource limits. Exact-source red CI https://github.com/my-edutu/Ai_games/actions/runs/43538377365 confirmed new tests failed on missing visible-retirement behavior (and structural assertion). Test failures were not hidden.
2. **Production `5a8ac90d99fe2a4bee94213239b8a25256282027`** extends ONLY the source-verified old-gateway display owner to 3 seconds / 60 actual frame returns. Old source authenticity checks, cap/guardian match, physical body support and palette remain mandatory. This does NOT fake frames or leave unbounded resources.
3. **Production `7fb445803242de8a1f00f26548a6f7920e7235dd`** gives the original geometry owner the SAME source/visible-retirement proof as its original cloned material; allows honest ascent beyond the roof to keep that same old GPU object while its material fades; removes it naturally only after old arch and surrounding gallery reach near-zero alpha. Retains explicit **2.8-second + 30-render-frame hard budget** and source-tick/run/roof/restart early invalidation. Hard budget is a safety stop, never an optical acceptance claim.
4. The retained original meshes, physical F9 deck, character, boss and source geometry are unchanged; no new mesh, wall, platform, collider, impostor actor, synthetic replay, renderer pass, physics event or alternate game was authored.

## What is NOT verified

- New 7fb production exact-head test/quality workflow https://github.com/my-edutu/Ai_games/actions/runs/43538463096 was **PENDING** when first observed; no green claim until actual conclusions.
- A **new** exact-immutable-source, 9-job browser campaign must compare frozen baseline vs candidate in 1× desktop/portrait; prior 6907 native film still rejects source-level passage readability.
- If the source-bound actual gateway is not present in raster after the changed retirement, test camera projection/depth, opaque F9 structural occlusion, cold GPU first-return latency, physical skinned crossing, and Floor9 onward with actual normal-speed film. Do not patch another fade in lieu of full-system evidence.
- Real physical device p50/p95/p99/memory, accessibility and independent panel review are not done. **LOOKS 0/5, FEELS 0/5, PLAYS 0/5; leading verdict NOT EVALUATED.**

## Next highest-impact action

Inspect the fresh actual WebMs at 1× from this exact code, especially 22–31 seconds and all Floor9 onward/outcome/restart events, with compositor native PTS vs source event tick441/451 and returned WebGL old gateway opacity/submitted frames. Verify *full body through same old arch* and compare to frozen source films; reject cut or unpaired event. If still discontinuous, reopen P0 for unified physical geometry/camera/scene-construction timing rather than treating tests, alpha or source logs as a pass.

## Returned-WebGL retirement correction on the same P0 slice

- **`4aaccd3e70903333a8e5de3dcfd7be9d194cd087`**: a source update setting the original gate to zero alpha is NOT proof those pixels were submitted. The original group is now allowed to retire naturally only AFTER the actual `noteFrameSubmitted` callback has witnessed a fully transparent original gate, deck and gallery in a real source-matched returned Three.js frame. A stale snapshot/failed frame cannot mark this condition. The prior physical run/source/age/resource backstops remain in force.
- **`db9dfda0327b2f0997a970007c1f62e799e19135`**: expanded tower-only regression contract for the returned all-transparent frame prerequisite. Latest exact-source quality workflow https://github.com/my-edutu/Ai_games/actions/runs/43538967502 was PENDING at documentation; no green claim.
- The previous capture requested by `9c993ec238322d9534e8eb247a53b0c49514f607`, https://github.com/my-edutu/Ai_games/actions/runs/43538863899, is tied to the *earlier* old-gate retirement implementation and **cannot certify this correction**. A new immutable source capture request is mandatory after the final edit.

This correction reduces a specific unrendered-disposal race; it does **not** prove native-video continuity, acceptance, outcome/restart, supported-device fps or independent quality.
