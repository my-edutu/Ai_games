# Autonomous Snake Gauntlet live ledger

Goal and approval: user approved the 3D Gauntlet prompt on 2026-10-30.

Branch: `feat/autonomous-snake-3d-gauntlet`.

Bar: Snake Pass official runtime media, with ASTRO BOT secondary scene inspiration.

Status: baseline capture and first implementation underway. Benchmark victory is unproven.

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
