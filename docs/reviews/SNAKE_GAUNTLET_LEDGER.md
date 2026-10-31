# Autonomous Snake Gauntlet live ledger

Goal and approval: user approved the 3D Gauntlet prompt on 2026-10-30.

Branch: `feat/autonomous-snake-3d-gauntlet`.

Bar: Snake Pass official runtime media, with ASTRO BOT secondary scene inspiration.

Status: original 3D implementation published as draft PR 52; Gauntlet refinement continues. Benchmark victory is unproven.

Review branch: https://github.com/my-edutu/Ai_games/pull/52

Ruling: preserve deterministic Snake rules and use full 3D presentation — matches the approved goal and existing simulation contract.
Ruling: use disjoint parallel builder modules and separate fresh-context critics — explicitly requested fan-out overrides sequential-only skill guidance.
Ruling: no Ultracode executable, skill or tool is installed — use available subagent orchestration without claiming Ultracode execution.
Ruling: existing user approval covers design/implementation and isolated feature-branch work; no repeated approval checkpoint is needed.

## Evidence log

- Initial source: flat Canvas2D board, segmented luminous snake, dark broadcast panels.
- Dependency installation: pinned npm packages installed.
- Baseline test attempt before installation finished: could not find `tsc`; rerun after successful dependency installation.

## Open gates

- Character craft and motion comparison.
- Environment and full-game composition comparison.
- UI, mobile and accessibility review.
- Functional regression and resource stability verification.
- Fresh independent whole-game verdict.

## Round 1 review and response

Independent world critic: LOSE against Snake Pass. Biggest gaps: dominant repeating floor pattern, small/poorly separated hero, insufficient scene depth; incorrect occupancy and raw planner diagnostics visible.

Round 2 response: quiet world-space weathered stone field; 84.5% reduction in world triangles (427,340 to 66,188); distant scenery layers; larger fruit; correct occupancy and friendly strategy copy (focused tests passed). Static environment shadows and separate soft character contact shadows replace expensive shadow regeneration each frame.

Round 2 capture uncovered an adaptive shadow quality bug: disposing the old shadow map while automatic regeneration was disabled caused GL sampler mismatches and disappearing geometry after the quality switch. Fixed by explicitly requesting regeneration; added a browser regression test. Camera smoothing now follows elapsed time under slow rendering instead of lagging behind the snake.

Baseline test diagnosis: subprocess capture returns EPERM/empty stdout in the default sandbox. Escalated Eko tests pass 2/2 and candidate tests pass 3/3 with byte-identical reproduction. Direct Snake self-test passes; isolated host test still pending.

## Rounds 3–5

- The isolated stream-host suite subsequently passed 5/5.
- Round 3's randomized A/B still comparison gave every character category to the official reference. The key gap was a frog-like face with detached raised eyes. A continuous lofted skull and neck replaced that construction.
- Round 4 actual captures used one frozen public replay frame, preserved as `snake-gauntlet/round-4-public-frame.json`. The character is substantially more developed, but a fresh critic still found weak eye-led expression and assembled-looking mouth rims. Round 5 enlarges the eyes 45%, supports them with continuous cranial masses, and unifies the cream jaw; rendered review remains pending.
- Perspective camera fitting rotates the portrait view along the board's long axis. Distance fog follows viewing distance, and close views target the current interpolated head without positional lag. Actual portrait capture verifies that the board is visible. Operator/viewer toolbar overlap was then corrected in CSS.
- Static world transforms, normals, colors and UVs are baked into 13 material meshes. A frozen-scene browser A/B measured throughput 2.29 → 3.88 FPS and median GPU work 347.6 → 198.9 ms. The visual scene remains intact, but the unchanged 17 FPS gate is still open. A bounded static rendering cache is the next experiment.
- Water coverage, distant-islet depth, asymmetric tree crowns and explicit triangular dormant-hazard markers have been refined; the latest integrated capture is pending.
- Independent code review found three P2 defects: a hidden terminal-recovery slate after successful polling, invisible singleton portal fragments in the safety view, and hidden-tab time forcing low quality. All three were reproduced, fixed and closed on re-review.

## Full regression result

Published checkpoint `40bc6cc1f204d843a1bbd4b2658495ad3ffab069` contains the code covered by the completed full Node regression run: **515 tests passed, zero failed/skipped/cancelled**, duration 324,994 ms. Command: `npm run build && node --test --test-concurrency=4 tests/foundation/*.test.cjs tests/phase2/*.test.cjs tests/phase3/*.test.cjs tests/phase4/*.test.cjs tests/phase5/*.test.cjs tests/phase6/*.test.cjs`. The environment required normal subprocess permissions; the sandbox-only failures were not product failures.

Twelve focused presentation/model checks cover motion continuity, teleport/restart safety, public copy, perspective framing, singleton fallback, visible timing, finite geometry, detail switching, resource bounds and disposal. Browser lifecycle fixtures now come from the real deterministic runtime and include result, intermission and restart. Final browser/cache validation remains open; this Node result does not establish visual or production readiness.

## Isolated browser evidence — round 5

Commit `c07c4123d3a28e505c1f089465c07f455cbe3486` was exercised by the dedicated Snake browser runner: [run 41120340705](https://github.com/my-edutu/Ai_games/actions/runs/41120340705). **11 of 12 checks passed.** Real WebGL/camera behavior, bounded resources, portrait controls, both fallback paths, real runtime lifecycle/reconnect, adaptive shadows, local asset routing, cache resize/context loss, matched direct/cached rendering, landscape and viewer settings pass.

The remaining failure is the unchanged full-HD frame-rate gate: five RAF frames were observed in the one-second measurement, below 18 frames and 17 FPS. This is a real performance failure on the isolated software-rendered runner, not a passing result attributed to local resource contention. The next renderer experiment preprocesses cached display color at cache rebuild instead of repeating tone mapping, color conversion and fog calculations every frame.

Actual new character and portrait captures plus matched cache images are retained in the progress page. The matched captures use the same real public replay frame: steady-frame geometry falls from 74,935 to 11,498 triangles and draw calls from 63 to 51. Their short initial-frame timing samples are insufficient for a sustained speed claim. Exact CI provenance and counts are in `snake-gauntlet/round-5-browser-verification.json`.

Independent visual review of these captures is underway. The commercial reference has not been beaten. At this checkpoint all available concurrent agent slots were occupied; the existing separate critic was reused without labeling that review as fresh. Once a slot became available, a new whole-game critic was successfully started with no inherited context for rounds 7–8.

## Round 6 — display-cache evidence and next correction

Commit `c953c64d21059fe6eb2dc9f7cb094655ddaba48e`, [isolated run 41121933969](https://github.com/my-edutu/Ai_games/actions/runs/41121933969), again passes 11/12 browser checks. Complete desktop metrics now record **5.242 FPS**, six actual draws over 1144.6 ms, and a maximum gap of 266.6 ms. The cache is active (22 hits / four builds), so stale-cache bypass is not the cause. The unchanged 17 FPS / below-250 ms gate remains failed.

Independent actual-image review finds the new and preceding cached PNGs byte-for-byte identical, including all 614,400 decoded pixels. The prior fine static-edge difference against direct rendering persists without a new color/quantization regression. Exact report and desktop metrics are retained in this review directory.

The next candidate follows the character critic: keep the large eyes, blend their outer support into the lid green, remove redundant gold mouth rims and slim the neutral cavity while retaining the eating pose. A lower detail camera preserves the tested facial size while opening the upper frame to scenery. Water now uses one original procedural flowing texture instead of the visible analytic plaid pattern. A measured rendering-budget response replaces the fixed slow-device resolution reduction. These changes require new actual captures; no win is claimed.

## Round 7 diagnosis and round 8 candidate

Actual round-seven images and a 28.72-second browser recording show better context and eye integration but a detached-looking eating jaw. The independent critic retained a LOSE verdict. The next bounded character change uses a connected tapered lower jaw, recessed palate, flexible cheek joins and a maximum opening of 0.105 radians. It adds one small draw call; model/expression/resource checks pass, but actual appearance is pending.

Pacing remains below target: the first combined run records 7.619 FPS, and a repeat records 5.604 FPS. The same frozen real frame at fixed DPR 0.4 produces 9.3589 FPS with dynamic shadow reception versus 9.3580 FPS without it, ruling out shadow filtering as the primary cost in that pair. The unchanged gate remains failed.

A bounded local full-app A/B/A comparison then removed CSS filters and box shadows while retaining rounded clipping and identical geometry. Cadence was 3.248 → 5.419 → 2.393 FPS under shared host load. Every condition submitted real draws, retained its active cache and returned GL error zero. This supports a relative compositing-cost correction, not a 17 FPS pass. The next candidate replaces blur/translucent overlays with opaque green panels and removes blurred stage shadows; layout, clipping, borders and focus behavior are preserved. Exact local data and parser verification are retained.

## Round 8 — exact published build verified

Checkpoint `46ff9a80a0dac70bdd792cc1bbc95493c4cecf1b`, [isolated run 41126688384](https://github.com/my-edutu/Ai_games/actions/runs/41126688384), still passes 11/12 focused browser checks. Desktop pacing is **4.837 FPS**, six real draws over 1240.5 ms, maximum gap 283.4 ms. The same frame at fixed DPR 0.4 records 7.062 FPS with shadow reception and 6.685 FPS without it. Removing interface blur did not produce a passing result.

The full repository run [41126688081](https://github.com/my-edutu/Ai_games/actions/runs/41126688081) passes **518/518 Node tests**, no failures/skips/cancellations, and all stream-host, authority, chaos and release-validation steps. Its browser stage passes 23/24 checks; the same Snake pacing gate is the sole failure. These results are exact-head evidence, not a claim of production or commercial visual readiness.

Actual screenshots and the separate 2,501,510-byte motion artifact were downloaded and inspected. Root review still finds a thin pointed lower jaw and a floating-looking smile crease; an independent whole-game critic is reviewing this output against the official Snake Pass reference. New targeted diagnostic work will separate actual renderer submission, GPU completion and page-compositing costs without altering the production gate. Published progress JPEGs are format conversions of the unmodified browser PNGs, retaining their native dimensions.

The separate whole-game critic confirms a narrow improvement over round 7, but retains **LOSE** against the official commercial reference. It independently identifies the floating dark smile loop and pointed lower-jaw flap as the biggest art gap. Actual motion has held spans; nominal recording frame rate is not evidence of smooth live rendering. Report: `snake-gauntlet/character-critic-round8.md`. This follow-up was nonblind; it is not represented as a masked comparison.

Round 9 candidate: the builder removed the independent smile tube and derived the upper mouth boundary, rounded jaw and flexible cheek joins from the same skull cross-sections. Four-degree chewing, 0.006-unit neutral gap, body/eye behavior and resource bounds are retained. Existing model tests plus 480 expression/LOD/reduced-motion updates pass; real appearance remains pending. A separate diagnostic-only browser test now measures actual renderer wall time, GPU timing/completion, full-app versus equal-size minimal-page cadence, and cache/depth/AA ablations. Partial-scene diagnostics never replace the production pacing gate.

Fresh environment review identifies the courtyard and visible rim as the largest scene gap: they read as a pale grid sheet rather than worn stone. The next bounded world change targets the existing stone family, preserving the plane, board layout, static batching and gameplay contrast. Acceptance requires actual overview and close captures; source-only work does not establish a visual win. The diagnostic reviewer’s late-error integrity finding was fixed before checkpoint `bf4a523` by asserting that `report.failure` is absent.

## Round 9 actual evidence and review response

Checkpoint `bf4a523` isolated run [41128720595](https://github.com/my-edutu/Ai_games/actions/runs/41128720595) passes 12/13 browser checks; only the unchanged desktop pacing gate fails (5.442 FPS, seven actual submitted draws, max gap 316.7 ms). Anonymous unretouched character crops were independently reviewed without access to their mapping: A was the candidate, B the official reference. B won. The biggest remaining character gap is a pale pointed rear-jaw/cheek attachment, not the previously corrected front cap. A fresh builder is tracing that geometry.

Independent performance review caught an invalid completion assumption in the diagnostic's WebGL `finish()` fallback. Raw data is retained with an explicit correction note. The next measurement uses actual asynchronous fences, full query draining, and stable fixed-scale samples. No favorable partial-scene number is substituted for the production gate.

The next world candidate finishes the existing stone family and corrects collapsed masonry side UVs. Model verification preserves all position/normal/index buffers, dynamic prop transforms, and resource counts across three board dimensions; actual visual acceptance remains pending.

Round 10 character diagnosis: a fresh builder used actual still/motion inspection plus a CPU mesh-ID projection to identify the persistent pale prong as the open first body ring beneath the head. The candidate buries that overlap within the skull, attaches the jaw root farther inside the cheek, thickens the shell slightly and removes the competing gold cheek stroke. The projection is diagnostic geometry evidence, not a substitute for actual WebGL visual review. Corrected renderer profiling is independently source-reviewed; actual next-candidate visual and pacing checks remain pending.

## Round 11: idempotent HUD (earlier published checkpoint)

`3f23e6` removed 50 redundant DOM mutations during 650ms of an unchanged public frame without hiding changed captions or recovery copy. Browser CI passed 14/15; actual submitted-frame pacing still failed (10 draws in about a second). See `docs/reviews/snake-gauntlet/round11-hud-stability.md`.

## Round 12: grounded serpent, horizons and stable props (earlier published checkpoint)

`ffe44de` ground-corrected the body's tapered belly and head/neck, filled distant empty headings with continuous cliff/grove geometry and cached stable portals/obstacles with topology invalidation while active traps remained live. Focused CI [41167550976](https://github.com/my-edutu/Ai_games/actions/runs/41167550976) passed 15/16; the unchanged pacing gate failed at **8 actual submitted frames in 1008.2ms**, requiring 17. General CI [41167551002](https://github.com/my-edutu/Ai_games/actions/runs/41167551002) failed browser verification; full local tests for that checkpoint passed 539/539. See `docs/reviews/snake-gauntlet/round12-grounded-landscape.md`.

## Round 13: one-sample flowing water candidate

Base exact branch head `ffe44de2ca27997c260d8a4ce261fe09fc0866a2` with original `world.mjs` Git blob `639b5918bb1135de93178d841182d85f2d0e9614`. Precompose two periodic broad fields and two foam contours in the existing 256×256 map, reducing water fragment reads from **two to one** without changing fog, motion freeze, color, resources, gameplay authority or recovery. A new regression was red on the original two-lookup implementation then green after this change; isolated Snake tests **37/37 passed** and TypeScript build passed. Real Chromium/SwiftShader WebGL stills from a retained public snapshot were visually inspected; no errors. Fixed-scale 0.5 local software-rendering samples submitted 42/40 frames before and 42/44 after over 2.6s per run. These are not a sustained performance improvement or a live-host gate pass. Separate independent review was unavailable (worker tunnel offline). Reference water realism, full-game material depth and hero expression still **LOSE** against Snake Pass. See `docs/reviews/snake-gauntlet/round13-flowing-water.md`.

**Open:** live-host 17-actual-draw acceptance gate, fresh exact-head CI, full catalogue current-source tests, sustained device pacing, independent whole-game visual/motion verdict, and production R5/soak. PR 52 remains draft; no merge or deploy.

## Round 14 · lower eye sockets without hiding the gaze (2026-10-31)

Base: Round 13 branch checkpoint `04f3953cb84491ca4f95e8c92bdcb3c32f0e3a82`. Recovered source archived from exact PR merge SHA, not from a downloaded generic branch. The water improvement was already published concurrently by the scheduled Snake builder; this pass does not duplicate or overwrite that work.

The real Round 12 close-up still showed two high circular eye masses reading like frog stalks. A focused test failed on the original rim crown (0.36585 relative to head) and required a less protruding, forward-set socket with a visible pupil. The first implementation (socket z=0.068) visually FAILED: the skull obscured the eyes. That candidate was rejected and never published. The second implementation (socket z=0.148, y=0.191, scale=1.23) passes the bounded geometry test and shows both amber pupils in a real offline browser capture; existing blink and low/high detail states remain functional.

Local verification: `node --test tests/phase3/snake-*.test.cjs` returned 38 passed, zero failures. `npm run build` exited zero; `node --check` on both edited production modules exited zero. Two attempts at the entire local full suite exceeded the execution allowance while blocked in cross-game campaign tests after test 125, so no fresh full-suite pass is claimed. Chromium/SwiftShader screenshots use a public frozen frame and no web server; they are visual evidence, not live-host frame-rate or independent commercial reference proof. The scheduled worker connection remains unavailable; this is self-review and the whole-game visual benchmark stays LOSE.

The deterministic simulation, all game rules/AI, public snapshot schema, user HUD, mobile/portrait, reduced-motion behavior, hazards, portals and safe fallback are unchanged. One existing eye transform is adjusted with no additional assets, geometry, materials or draw calls; rollback is revert of this single character change. Await exact-head CI and a fresh independent motion/still review before advancing release.

## Round 15 — distant serpent skin shading (candidate, CI pending)

After the combined Round 14 head `982f925`, [focused browser run 41170386701](https://github.com/my-edutu/Ai_games/actions/runs/41170386701) passed **15/16**. Desktop pacing still **failed**, with **10 actual draw submissions in 1006.4 ms**, requiring at least 17. The measured 60.61 RAF callbacks/second are NOT 60 rendered frames. The diagnostics in that run show nontrivial serpent/contacts GPU cost at fixed DPR 0.4, but their separate profiles are not a causal speed comparison.

This exact-source candidate changes only presentation: the continuous body and tapered skull reuse **identical authored pigment textures** but use preallocated Lambert diffuse shaders in distant overview/follow views. The existing close-up PBR bump, roughness, expression and geometry return in the detail view. No per-frame allocations, no extra textures. A new regression toggles the view 120 times, verifies fixed resource budgets, public-path portal discontinuity, pigment identity and empty-scene recovery. Deterministic gameplay, AI, scoring, public snapshot authority, cues/captions, reduced motion, renderer backpressure, fallback and production thresholds are unchanged.

**New head Node tests, browser captures, actual pacing and independent whole-game reference critique pending as of this commit.** No shader-cost reduction is yet counted as an actual FPS win. The specialist tunnel remains offline; review is self-authored and not falsely labeled independent. See `docs/reviews/snake-gauntlet/round15-skin-lod.md`. Stay draft/unmerged/undeployed.

### Round 15 exact-source verification, 2026-10-31

Code checkpoint `2e4fe40f20df532df07ebe4c3c63bcad56205bdb`. Published body/face material source Git blob `1fca1e13c94837d7f65cd1a0df55e79f02569eb7` matches the already verified initial branch update. The new test `tests/phase3/snake-skin-lod.test.cjs` is part of the general passing catalogue: [CI 41171326786](https://github.com/my-edutu/Ai_games/actions/runs/41171326786) **542/542 Node passed**, no failures/skips, TypeScript build and four host checks, authority scan, operations and release-validation steps passed. Browser **27/28**, solely failed the unchanged desktop pacing check: **10 real submitted draws / 1004.9ms vs required 17**. Overall general CI is **red**, not green.

The focused real-browser [run 41171326788](https://github.com/my-edutu/Ai_games/actions/runs/41171326788) passed **15/16**; sole failure: **10 real submissions over 1015.0ms vs 17**, while independent RAF rate was **~60.10 callbacks/s** (not game frame rate). Actual capture [artifact 13031152958](https://github.com/my-edutu/Ai_games/actions/runs/41171326788/artifacts/13031152958), [18.48s motion artifact 13030759114](https://github.com/my-edutu/Ai_games/actions/runs/41171326788/artifacts/13030759114), and [metric artifact 13031297210](https://github.com/my-edutu/Ai_games/actions/runs/41171326788/artifacts/13031297210) were downloaded and inspected.

An identical frozen public replay screenshot (960×640) compared against `982f925` changed **1.912%** of pixels, with mean absolute RGB-channel difference **0.0843/255**; it is a near-identical still, not a performance or whole-game visual win. Exact screenshots, source hashes, comparison methodology and explicit self-critique are in `round15-skin-lod.md`. Official Snake Pass still wins coherent reptilian facial silhouette, richly textured ruins and dynamic water. The 17-real-draw gate remains **FAILED**; do not weaken it or confuse RAF callbacks with rendered/presented frames. No independent whole-game reviewer or R5 production clearance. Remain **draft, unmerged, undeployed**.

## Round 16 — weathered, noncylindrical distant cliffs (2026-10-31)

The latest actual Round 15 close screenshot still shows distant green cliffs as repetitive smooth barrel-shaped towers. This is a visual staging deficit against Snake Pass even though it does not break gameplay. The objective of this slice is richer original cliff silhouettes without adding CPU/GPU work to each frame.

Production change: one shared `buildHeadlandGeometry(THREE)` for every existing distant rock placement. The primitive has 15 nonuniform geological rings, 28 angular subdivisions, eroded overhang ledges, combined low/high-frequency fracture perturbations, continuous averaged normals at the three-wrap UV seam, and a capped top. One existing rock geometry is replaced; the original mats/textures, forest groves, board/coping, gameplay rules and single material-merge static render path are preserved. This is original procedural art, not a copied commercial asset.

RED: `node tests/phase3/snake-headland-relief.test.cjs` failed because the rock-geometry factory was absent. GREEN: after the isolated implementation, geometry topology, bounding/UV/normal continuity, nonuniform stratum/ledge profile and bounded indices passed. The original horizon test passed on 8x8, 28x16 and 40x24 boards, including exact existing SHA hashes for every playable court/coping vertex. Focused Node suite `node --test tests/phase3/snake-*.test.cjs`: 39 passed, zero failures. Source build and shader performance impact on the exact published candidate are to be checked in CI.

Review limitations: no new actual browser capture or independent commercial-reference comparison at this source checkpoint. Static rock triangles rise moderately at cache construction; no per-frame dynamic draw calls are added. Performance and visual win remain **OPEN**. No simulation, AI, scoring, public snapshot, cues/captions, accessibility, moderation, safety fallbacks or release gates change. Revert the single geometry factory and call site to restore the prior headland shape. Keep draft, unmerged and undeployed.

## Revision 2: actual browser critic response

[Exact head `bb6cc7a` focused run 41172211493](https://github.com/my-edutu/Ai_games/actions/runs/41172211493) completed **15 passed, 1 failed**. The unchanged desktop pacing acceptance still failed at **16 actual draw submissions /1003.5ms** (minimum 17), even though animation callbacks averaged ~60.79/s. The frame-buffer size was 1058×483, with an active static cache. This is not a passing FPS result and differs in sampling conditions from prior runs.

The actual [Round 16 first-candidate character and overview captures](https://github.com/my-edutu/Ai_games/actions/runs/41172211493/artifacts/13031403527) showed a prominent failure: rock overhangs read like regularly stacked horizontal discs, not weathered geology. Source-level geometry closure alone did not prove visual quality. **Self-review verdict: LOSE**; no independent critic is claimed.

A new regression asserts nonhorizontal stratification and bounds adjacent radii to avoid disc-like shelves. It failed on the published first-candidate geometry, then passed on a revised 15-level profile with tempered radial steps and gentle angle-dependent vertical bending. Existing seam normals, 13 static batches, no new textures, all scene bounds and exact playable-court hashes remain. The isolated `node --test tests/phase3/snake-*.test.cjs` passed **39 tests, 0 failures** on revision 2. Updated screenshots and performance are pending exact-head CI. This is a continuous user-authorized Gauntlet loop, not a claim of benchmark victory.

## Round 17 — precomposed water palette, bounded rendering cost (2026-10-31)

Starting from exact head `418d49562fc69b0d7e4fddd119d6b0bcd054d0f7`, the prior original water still blended depth/color/foam per fragment after its one filtered field lookup. A fresh [Round 16 exact-head browser diagnostic](https://github.com/my-edutu/Ai_games/actions/runs/41172211493) found a nontrivial water GPU path at fixed DPR 0.4 on a minimal frozen page (45.75 submitted FPS full versus 54.32 without water; query means 10.38ms versus 7.04ms). This is diagnostic only, not a permission to hide water, a production comparison or a benchmark win. Its actual full desktop gate **FAILED**, 16 submissions /1003.5ms versus minimum 17 (60.79 RAF callbacks/s are not rendered FPS).

Candidate: precompute the existing affine broad/foam opaque water RGB palette into the existing 256×256 original periodic RGBA8 texture once, retaining single filtered lookup, moving UV flow, same fog, reduced-motion freezing and all environmental/gameplay geometry. No extra textures, materials, draw calls, render queues or authoritative changes. A new regression exercises precomposed RGB bounds/relation, GL shader/fog, resource limits and flow/reduced-motion behavior; the old shader/texture fails that expectation. The quantization-only arithmetic bound is ≤0.5/255 per channel before filtering, **not** a proven actual screenshot match. **CI, new actual screenshot/motion, visual acceptance and sustained pacing pending.** Roll back the fragment palette and texture packing if regressions appear. Self-review: Snake Pass remains ahead; no fresh independent critic or R5 clearance. See [Round 17 review](snake-gauntlet/round17-water-palette.md). Draft/unmerged/undeployed.

### Round 17 first exact-head browser response and legacy test repair

[Focused CI 41172921802](https://github.com/my-edutu/Ai_games/actions/runs/41172921802): **15/16 browser**, desktop actual renders **10/1005ms <17 required**; 60.70 RAF callbacks/s are not render FPS. Live WebGL [screenshots/trace artifact 13032375781](https://github.com/my-edutu/Ai_games/actions/runs/41172921802/artifacts/13032375781), [14.8s motion artifact 13032430669](https://github.com/my-edutu/Ai_games/actions/runs/41172921802/artifacts/13032430669). Compared to [base `418d495` actual screenshot artifact 13031776438](https://github.com/my-edutu/Ai_games/actions/runs/41172693915/artifacts/13031776438), the identical frozen 960×640 direct image differs by mean RGB **0.031249/255** and max per-channel **1/255** (7.8797% pixels changed at all). Excellent frozen color equivalence; no actual throughput win, full motion or Snake Pass visual parity.

[General CI 41172921698](https://github.com/my-edutu/Ai_games/actions/runs/41172921698) **FAILED** at **543/544 Node tests**, while the new palette regression itself passed. The remaining legacy water test checked >30 unique *raw red bytes* from the former RG broad-field texture; RGB-precomposed aqua visibly contains fewer red quantization levels even though 74 unique RGB tuples remain. Update this test to count perceptually displayed RGB combinations and G/B contour combinations, **retaining >30 and >12 thresholds**, without modifying runtime code or weakening browser ≥17 gate. Real new Node/browser verification after this focused repair remains pending. Review self-authored (tunnel offline); the latest actual character capture also exposed fruit occlusion and the reference still wins. Draft/unmerged/undeployed.

## Round 18 — close-camera foreground fruit sightline (2026-10-31, candidate)

Starting at exact PR 52 head `056eee0f4a659d3fdcedfe4780b753dcaf62363a`, the new detail-only camera computes a bounded angular silhouette clearance to avoid the large fruit masking the serpent face. It changes neither world entities nor authority: food remains in its public cell, the centered face retains its target and camera distance, and overview/follow retain original compositions. A new four-heading, two-aspect Node regression covers actual projected separation and no-op states. An additional real WebGL screenshot probe stages a **clearly labeled synthetic presentation stress fixture**, not a live gameplay frame. [Round 18 analysis](snake-gauntlet/round18-food-sightline.md).

**Status at publication:** tests, the actual browser stress image, fresh full-suite CI and pacing checks are pending. The latest previously verified [focused browser CI 41173330039](https://github.com/my-edutu/Ai_games/actions/runs/41173330039) was 15/16, with **9 actual submissions /1002ms vs minimum 17**; its ~60 RAF callbacks/s are not rendered/display FPS. The commercial reference still wins face craft, environmental richness and motion fluency. The independent worker tunnel is offline; this is self-review, no fabricated independent result. Draft/unmerged/undeployed.

### Round 18 exact-source browser and catalogue verdict (2026-10-31)

Published Round18 production checkpoint [`035216c`](https://github.com/my-edutu/Ai_games/commit/035216c17f547555974370ff142df4d0cacdc263). [Focused CI 41177849409](https://github.com/my-edutu/Ai_games/actions/runs/41177849409) passed **16/17** browser tests including the new true-WebGL *synthetic presentation-only* foreground-fruit stress-capture test; unchanged actual-draw pace **FAILED** at **8/1010.3ms** (minimum 17). [General CI 41177849413](https://github.com/my-edutu/Ai_games/actions/runs/41177849413) passed **545/545 Node tests**, build, host, authority and operational checks; browser **28/29**, failed 8 actual submissions/1007.6ms vs 17. Neither 60+ RAF callbacks/s nor short submitted sample means display-present FPS.

[Current real WebGL screenshots, including clearly labeled synthetic stress fixture](https://github.com/my-edutu/Ai_games/actions/runs/41177849409/artifacts/13034200025), [real 19.08s gameplay video](https://github.com/my-edutu/Ai_games/actions/runs/41177849409/artifacts/13033895958), [metrics](https://github.com/my-edutu/Ai_games/actions/runs/41177849409/artifacts/13033534430). Independently compared previous-source and new-source matched 960×640 real WebGL cached and direct overview PNGs: **both pixel identical (0 differing pixels / 614,400)**. Synthetic food directly ahead of face is visible without covering the face in new screenshot, with some loss of direct frontal expression. Independent critic is still unavailable; official Snake Pass remains ahead on expressive anatomy, materials, water and motion. **Overall LOSE/OPEN.** No performance, device soak, or R5 pass; no merge/deploy. Further detail in [Round18](snake-gauntlet/round18-food-sightline.md).
