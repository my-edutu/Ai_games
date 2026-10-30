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

Independent visual review of these captures is underway. The commercial reference has not been beaten. The session's agent-thread limit prevents starting another fresh context; the existing separate critic is reused without labeling that review as a fully fresh-context comparison.

## Round 6 — display-cache evidence and next correction

Commit `c953c64d21059fe6eb2dc9f7cb094655ddaba48e`, [isolated run 41121933969](https://github.com/my-edutu/Ai_games/actions/runs/41121933969), again passes 11/12 browser checks. Complete desktop metrics now record **5.242 FPS**, six actual draws over 1144.6 ms, and a maximum gap of 266.6 ms. The cache is active (22 hits / four builds), so stale-cache bypass is not the cause. The unchanged 17 FPS / below-250 ms gate remains failed.

Independent actual-image review finds the new and preceding cached PNGs byte-for-byte identical, including all 614,400 decoded pixels. The prior fine static-edge difference against direct rendering persists without a new color/quantization regression. Exact report and desktop metrics are retained in this review directory.

The next candidate follows the character critic: keep the large eyes, blend their outer support into the lid green, remove redundant gold mouth rims and slim the neutral cavity while retaining the eating pose. A lower detail camera preserves the tested facial size while opening the upper frame to scenery. Water now uses one original procedural flowing texture instead of the visible analytic plaid pattern. A measured rendering-budget response replaces the fixed slow-device resolution reduction. These changes require new actual captures; no win is claimed.
