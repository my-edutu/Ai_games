# Pass229 — retain one authentic pressure-encounter renderer (2026-11-10 UTC)

**Existing branch:** `feat/maze-3d-gauntlet` · **starting verified PR HEAD:** `6a21e0ec308cd05b4b2a120efa03786910cd8cc5` · [Draft PR #53](https://github.com/my-edutu/Ai_games/pull/53).

## Original evidence and concrete failure

The exact-HEAD [native browser workflow 42728748092](https://github.com/my-edutu/Ai_games/actions/runs/42728748092) passed 4/5 browser tests, then timed out after 480 seconds at the *third pressure viewport*, line 1607 of `tests/browser/maze-review.spec.cjs`. Its [original artifact 13724860873](https://github.com/my-edutu/Ai_games/actions/runs/42728748092/artifacts/13724860873) contains 30 original PNGs; I rehashed all 28 with individual JSON `imageSha256` manifests and found 28/28 matches. The two gate-before/after desktop images lack individual paired manifests. Original 320×740 and 390×844 pressure shots show Pip and two moving jaws with in-frame real geometry; the 390 diagnostic reports Pip 0.500 NDC wide, the complete trap 1.060 NDC wide, and 6 actual WebGL frames. A 1280×900 **pressure** screenshot does not exist from this workflow, and the unrun six-reset resource check cannot be claimed. Whole-repository CI passed 722/722 Node tests before the unrelated missing Tiny Kingdom script stopped it.

## The single worthy fix

The browser had already built an original source-bound WebGL scene, but the pressure evidence loop navigated/rebuilt the **same complex, immutable authoritative public snapshot** separately at 320, 390, then 1280. That restart pattern burdens shared software rendering and is not how a responsive game survives an orientation/viewport change. The new loop makes only the first navigation; it subsequently resizes the same page/renderer and demands a *new actual WebGL frame* at the new aspect, identical genuine run token/tick, persistent canvas identity, complete source-published pressure jaw and a physically opened hinge. This is more rigorous than allowing a stretched bitmap.

**Unchanged acceptance:** screenshots remain full-page original native captures with per-image SHA, all three sizes including true desktop; no scene mock, hidden-state injection, crop, artificial Pip/trap movement, weaker NDC or min-scale bounds, reduced 44px controls, relaxed geometry budget, or lowered test timeout. Source-authentic chronology/guardian/gate/key checks remain untouched.

## Critical next gate

Run new-HEAD Playwright and confirm the real 1280×900 pressure shot, unchanged 390 physical silhouette, 844 landscape, and six consecutive reset geometries under 100 with <=8 drift. If the desktop still cannot render, inspect source-bound stage diagnostics/browser trace rather than raising an arbitrary timeout or claiming visual progress. Then a fresh independent reviewer must compare full original captures/motion to the fixed official [Captain Toad gameplay reference](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/); current scenery remains repetitive and the complete authored sequence is not yet proven. External coding worker and independent critic connections are unavailable; no local runtime or independent approval claimed.

**Disposition:** evidence-integrity blocker repair pending actual new-HEAD verification. Keep PR open/draft; do not merge, deploy, force-push or disable the hourly Gauntlet.
