# Pass104 — true public-cell terrain reconstruction (2026-11-03; source gate)

## Real source defect, not a GPU timing problem

The existing same-run terrain cache key included only **cell index, known neighbor list and blocked state**, yet real `rebuildTerrain()` uses the sanitized public `trap`, `checkpoint` and `clue` flags to suppress broad ceramic floor shell relief. If such an event appeared on an already-disclosed cell without changing its neighbors, the world rebuilt its hazard/shrine objects but **left the old decorative shell instances underneath**. That is an actual visual/semantic discrepancy in the playable 3D world, and is independent of SwiftShader throttling.

## Builder and separate source-test gate

- **Production:** `public/ai-maze-escape/world.js` now keys the physical terrain batches to the exact known public flags that govern their model. No AI/maze/game authority, navigation, visibility radius, HUD, camera framing, asset, thresholds or render-loop allocations were changed.
- **Regression critic:** `tests/phase6/maze-public-terrain-semantic-rebuild.test.cjs` loads the actual production Three.js world, on a deterministically decorated public court, and verifies all three individually: a newly disclosed trap/checkpoint/clue removes at least five real physical shell instances, restores them deterministically when removed, preserves the same one public cell, does not mutate source frames, and cleans up at new-run reset. The test is independent from the builder file. It may run under Node after npm dependencies install.
- **Strict visual bar unchanged:** native 320/390/844/1280 WebGL evidence, complete Pip/Thornback bounds, full viewport, truthful low-text HUD, real event captions, 44px controls and privacy remain mandatory. This narrow correctness fix is **not** an artistic Nintendo-quality pass.

## Open evidence / review status

Pass103's exact-source focused browser [run 41590979922](https://github.com/my-edutu/Ai_games/actions/runs/41590979922) was **still queued** when this source fault was examined. Its predecessor [41590554584](https://github.com/my-edutu/Ai_games/actions/runs/41590554584) was also queued; whole CI [41590554441](https://github.com/my-edutu/Ai_games/actions/runs/41590554441) was still in progress. The new source commit must receive its own build/Three.js/browser results and dated original images; **no new-source visual approval is claimed**.

The connected shared workspace and subagent/Ultracode tunnel returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`; no fresh-context critic or new graphics capture can be claimed locally. The official [Nintendo Captain Toad imagery](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) still wins on stage direction, character visibility, world variation and authored motion. **Gauntlet not won**. Continue with major explorable scene transformation after exact-source captures, not a test-count victory. Keep [PR #53](https://github.com/my-edutu/Ai_games/pull/53) draft, unmerged, undeployed.
