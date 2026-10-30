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
