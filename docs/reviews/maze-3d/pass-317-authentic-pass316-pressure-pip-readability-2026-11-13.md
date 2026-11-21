# Pass317 — repair the measured native 390px pressure-approach hero regression

Date: 2026-11-13 UTC. Existing open Draft PR #53; branch `feat/maze-3d-gauntlet`. **Source/test candidate only; fixed Nintendo art/gameplay benchmark NOT MET.**

## Exact incoming evidence and independent test failure

Incoming PR HEAD `081255a6eb447bd4a18111505ab07485e373211a` (Pass316). GitHub [WebGL run 43341438680](https://github.com/my-edutu/Ai_games/actions/runs/43341438680) completed **FAILURE**: six browser cases passed, but the original-source chronology pressure/withdrawal case failed its UNCHANGED `390px Pip width > .49 NDC` assertion. Original full-resolution artifact [13999198500](https://github.com/my-edutu/Ai_games/actions/runs/43341438680/artifacts/13999198500) was downloaded and checked: **35/35 direct PNG-SHA sidecars plus two gate-transition manifest hashes** match their exact native PNGs (**37 verified PNGs total**). The failed authentic 390x844 `public-tide-shear-approach-390.png` belongs to seed `maze-visual-reference-3`, tick 467; its matching JSON records actual Pip `[-.724278786,-.296126116]` width **.428152670 NDC**, physical jaw `[-.084684888,.675315112]` width **.760**, camera half-height **6.915350899**. Both full physical bodies fit their UNCHANGED ±.95 gate, but Pip is visibly too small. This is a genuine visually measurable regression, not a frame-rate or timeout excuse; do not approve Pass316 as a complete visual run.

The same real approach shot was visually inspected at complete native 390x844 resolution and compared editorially with the fixed original [official Nintendo Captain Toad](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) reference. Its monumentally repetitive beige architecture, small Pip, and limited moving-jaw cause/effect are still below that benchmark. No fresh-context blind critic was available because the shared coding tunnel returned `NOT_FOUND`; do not claim independent visual approval.

## One independently measurable, player-visible correction

The existing `publicPhysicalPressureHeroReadabilityHalfHeight` computes an exactly physical, source-bound combined Pip/jaw fit. The verified tick467 requires magnification **1.202842x**, only **0.002842x** beyond a hard-coded `1.20` guard; that premature guard rejected a feasible shot, allowing the native strict scale test to fail. Broaden ONLY the non-withdrawal eligible portrait zoom cap to **1.24**, while preserving the actual in-function `pair width <=1.76`, `vertical <=.88`, required jaw `>=.70`, public-stage guards, separately protected 320 portrait, unchanged physical ±.95 NDC browser asserts and the original renderer camera reframe.

The exact original full geometry predicts a conservative **.515 NDC full Pip** and **.914 full jaw**, horizontal complete pair `[-.8712,.8123]` NDC and vertical envelope **.7031** — strictly inside the original no-crop margin. This is a calculation from the original WebGL proof, **NOT** a claim that the new code has already rendered or earned acceptance.

Added a test replaying the exact 390 full-physical-bounds evidence, checking both real bodies, the unchanged readability/no-crop conditions, no mutation, no unpublished stage, and 320/landscape guard. No test threshold was relaxed. All authoritative AI/gameplay/hazard cells, render resources and UI remain untouched.

## Pending acceptance

A fresh exact-code-commit native Playwright/WebGL run must verify all four viewports, the real approach→pressure→withdrawal sequence, strict 390 Pip >.49, jaw >.70, ±.95, <100 six-reset resource gate, full screenshots/sidecar timestamps/hashes, whole-repo CI and independent fixed-reference art critique. No rendered Pass317 win is claimed. `/maze/progress` is a source journal, not a substitute for browser evidence. PR remains OPEN DRAFT, unmerged and undeployed.
