# AI Dungeon — Gauntlet Round 57: Truth-Locked Chest and Wrist Strike

**Date:** 2026-11-01. Draft [PR #49](https://github.com/my-edutu/Ai_games/pull/49), branch `feat/ai-dungeon-3d-gauntlet-foundation`. **NOT AAA / NOT production ready. Do not merge.** Reference: authentic Diablo IV dungeon gameplay, with No Rest for the Wicked environments and Path of Exile 2 combat.

## Actual code
Round 56's true WebGL captures showed small, crowded stylized KayKit figures with poorly connected melee weapon movements. This separate character milestone adds bounded visual follow-through to original imported GLB **upper chest and right weapon-hand bones**, stacked atop existing shoulder, elbow and planted-leg animations.

- [Pure animation planning `40f3bf5`](https://github.com/my-edutu/Ai_games/commit/40f3bf57765a83cdf38b0db1e664955e19a99312): independently bounded wind-up, strike and recovery for Vanguard, Revenant and Warden. Only a real same-snapshot, grid-valid **distance 1 and target ID** authorizes the pose. Neutral at rest, invalid contact or reduced-motion. No RNG.
- [Renderer `ebf79ea`](https://github.com/my-edutu/Ai_games/commit/ebf79ead8c1e988c816d7f17e64e7d8a4d81b256): binds genuine spine/right-hand skeletal joints from cloned, pinned CC0 rigs. Reverses the prior cosmetic quaternion before each imported AnimationMixer update; reapplies the current pose afterward. Missing bones safely preserve base animations. Diagnostic counts/current angular peaks reflect actual renderer actors.
- No authoritative tick, AI, damage, hitbox, collision, replay, save, network dependency, new external asset or licence change.

## Exact evidence
- **Test-first RED:** [test-only run 41303872280](https://github.com/my-edutu/Ai_games/actions/runs/41303872280), authority job 124840249896: **152/156 passed**, exactly four expected new missing-planner/integration failures.
- **Exact-code authority GREEN:** [run 41304068008](https://github.com/my-edutu/Ai_games/actions/runs/41304068008), job 124840778720: **156/156 foundation**, **18/18 presentation**, **24 seeds × 900 authoritative ticks**, zero replay discrepancies, highest floor 9. A direct pure-planner sweep of 2,520 cases also remained finite and bounded.
- **Genuine Chromium attack test passed** (job 124840778738, 17.0 sec) using a stepped real DungeonRuntime snapshot and unchanged planCombatFacing. [Artifact 13083021022](https://github.com/my-edutu/Ai_games/actions/runs/41304068008/artifacts/13083021022) preserves the true 1440×832 WebGL screenshot `dungeon-melee-r57-authentic-spine-wrist.png` and 13.72-second browser gameplay recording; both were downloaded/inspected, including at ~4 and ~11 seconds.
- R56 [real contact screenshot artifact 13079900526](https://github.com/my-edutu/Ai_games/actions/runs/41296015131/artifacts/13079900526) was also inspected. The same genuine authority corpus is used, **but not camera- or action-age-matched**; no blinded reference A/B conclusion.
- **Full three-shard browser workflow was CANCELLED by concurrent draft-branch commits**, as was the independent visual workflow. Do not count an entire new 65-test browser suite or catalogue CI as green. Verify those against a stable later head.

## Harsh two-pass review
Specification holds: true immutable public-state contact, reversible local-only bones, finite bounds, no authority mutation. Creative review remains **FAIL against Diablo IV**: actual frame still clusters tiny, low-poly characters high in the viewport, and the arm movement is difficult to distinguish at normal spectator distance. Additional articulation is not a proven visual quality win. It also is not a measured FPS improvement. There was no independent critic/ultracode (worker tunnel unavailable), no hardware GPU p95/p99, soak, real context-loss recovery or blind matched A/B.

**Next gate:** new provenance-cleared, anatomically detailed original hero/enemy assets, believable blade-to-target physical staging and camera composition that actually foregrounds valid contacts; then real matched footage and independent criticism. Roll back the two feature commits on the draft branch if they cause clipping. **Do not merge or claim parity.**
