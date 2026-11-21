# Pass316 — public guardian evasion preserves a real objective route

Date: 2026-11-13 UTC. Existing draft PR #53, branch `feat/maze-3d-gauntlet`. **Candidate improvement; Nintendo visual/gameplay bar NOT independently passed.**

## Start-of-run source and evidence gate

Incoming exact PR HEAD `e1ccb14f819fc9dc3caec934fcb8d7b60418a35d` (Pass315), confirmed open/draft/unmerged. Source-bound [Pass315 WebGL 43339944143](https://github.com/my-edutu/Ai_games/actions/runs/43339944143) remained **in progress** when inspected; no screenshot or art acceptance inferred and no pending artifact hash claimed. Its [whole-repository CI 43339944188](https://github.com/my-edutu/Ai_games/actions/runs/43339944188) completed **FAILURE**, while its actual `Build and test` and `Maze stream host self-test` steps completed **SUCCESS**. Separate Tiny Kingdom OBS self-test and artifact-upload steps failed. The existing fixed reference remains [official Captain Toad: Treasure Tracker](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) with supporting Luigi's Mansion 3 / ASTRO BOT. Previous genuine 390 guardian images [Pass314](https://github.com/my-edutu/Ai_games/actions/runs/43325912165) were rejected as art-quality victory in Pass315's original source review.

Actual live `/maze/progress` and new head-matched screenshots could **not** be independently accessed because the shared coding workspace tunnel returned `NOT_FOUND`; GitHub repository source, PR head and CI were read through the linked connector. Separate builder/critic agent and Ultracode workspace unavailable. This is **NOT** a fresh critic or new rendered pass. Do not treat stale or pending frames as current.

## One meaningful, player-visible decision gap

At a real witnessed straight Pip–Thornback standoff, the current AI permits only non-closing public retreat cells. But when two retreats are equally safe, it picked by visit count/cell number, even if one was a dead end and the other followed a genuinely learned key, exit or frontier route. This yields directionless evasive wandering even after the player has already discovered a solution.

The new deterministic choice **first requires a presently observed, reciprocal open standoff and non-closing safe neighbor**; among such legal retreats, it prefers the shortest **known** continuation to a currently observed needed key, known exit or disclosed frontier. It excludes traps, currently witnessed guardian cells and the current threatened square from the continuation to prevent an immediate U-turn; it honors public doors/inventory. When every objective route is sealed or unknown it preserves the existing original conservative farthest-distance tie-break. No generated map oracle, predicted patrol positions, simulated fight, changed world collision, camera, HUD or GPU resource allocations.

The explicit regression uses hero cell 6, witnessed guardian cell 8 along physical corridor 6-7-8, equally safe north dead end cell 1 and south exit corridor 11-12-13-14-9. The intended real AI step is south to 11; closed public door 11-12 restores conservative north step, and disappearance of public guardian removes evasion. This is test-first contract scope, not proof of full multi-seed gameplay performance.

## Required exact-new-HEAD gate

Focused Maze and monorepo tests; original source-bound WebGL screenshots at 320×740, 390×844, 844×390 and 1280×900, complete SHA-verified PNGs, genuine objective-aware evasion traces and independent fixed-reference art critic. Maintain six-run geometry <100, full Pip/Thornback ±0.95 NDC and guardian withdrawal >=0.70, privacy/public-only AI, 44px controls, reduced motion. Do not claim any benchmark win before real rendered evaluation. No merge/deploy/force push.
