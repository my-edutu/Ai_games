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
