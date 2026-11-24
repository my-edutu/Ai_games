# Pass280 — restore the original native WebGL visual gate without relaxing the physical rail contract

2026-11-11 UTC. Existing open Draft PR #53, branch `feat/maze-3d-gauntlet`. Source parent `aaa99a88e4cc337095c59e658ba33aa84401240e`.

## Verified blocking failure

The exact-parent [Pass279 native WebGL run 43094832318](https://github.com/my-edutu/Ai_games/actions/runs/43094832318) finished **FAILURE** in the real `maze-visual` job **before browser screenshot generation**: `tests/phase3/maze-3d-pressure-counterbalance.test.cjs:203`, test 58 of 126. Its assertion demanded that both jaw pivot Z origins equal **0.12**, but production [Pass279](https://github.com/my-edutu/Ai_games/commit/aaa99a88e4cc337095c59e658ba33aa84401240e) intentionally moved BOTH complete physical hinge groups to `(±.68,-.035,.44)` to try to clear Pip's lower-body view. 125 other Maze presentation tests passed in this exact failing workflow. Therefore there are **no original Pass279 WebGL screenshots to accept**, and the previous visual candidate has NOT been validated.

## Production-related source correction, not an assertion relaxation

Keep the original complete two-jaw placement and real hazard-clock-driven motion intact. Change the stale earlier-stage test to require the exact **new mirrored 3D pivot coordinates** of BOTH connected jaw groups: X = -0.68/+0.68, Y = -0.035, Z = 0.44. Preserve the existing Pass261 continuous plinth, rooted guide cheeks, front blade, source-activated rotation, physical Box3 tile bounds over all pressure/recovery/reduced phases, hidden/reset and fixed GPU class counts. The separate Pass279 rail test still checks the forward/lowered roots and actual blade meshes. No test thresholds or budget reductions, no changes to AI, collision, HUD or camera.

## Acceptance status

This is a **CI blocker repair**, not a new art or gameplay win. Exact-new-HEAD focused tests, six-run geometry budget (<100), live 320/390/844/1280 Chromium WebGL frames and SHA-matched untouched PNGs must run again. Review the genuine 390px pressure frame for actual lower-body occlusion and distinct moving jaws, including strict ±0.95 NDC, Pip >0.49, withdrawal ≥0.70, 44px controls and no private map reveal. A successful source test alone is **not** an independent Captain Toad quality win. Prior reviewed [Pass278 original screenshot evidence](./pass-279-native-pressure-portrait-shear-stage-2026-11-11.md) remains the last inspected visual comparison. Fresh-context critic and Ultracode unavailable; do not claim detached acceptance. PR OPEN DRAFT, do not merge, deploy or force-push.
