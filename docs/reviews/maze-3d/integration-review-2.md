# Independent integration review 2

Date: 2026-10-30 19:29 UTC  
Reviewer: fresh engineering/spec critic (`integration_critic_2`)  
Base: `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31`  
Branch: `feat/maze-3d-gauntlet`

## Scope and verdicts

Reviewed the combined staged and unstaged implementation against `docs/superpowers/specs/2026-10-30-ai-maze-escape-3d.md`, with emphasis on the sanitized public boundary, physical terrace connections, route interpolation, ground/camera placement, fallback and recovery, counters, and bounded lifecycles. Reviewed the new untracked terrace test as well. No browser was launched because the integration owner was recording motion. No product code was edited by this reviewer.

**Specification verdict: changes required.** One confirmed reconnect-status defect remains in the app snapshot identified below. Two other confirmed movement/recovery defects were repaired during this review and independently reprobed successfully. A complete browser pass on the final integrated revision remains a verification gate, not evidence of another known bug.

**Engineering quality verdict: conditionally acceptable after the reconnect fix and current browser verification.** No additional load-bearing public-state, terrace-topology, route-through-wall, counter, or resource-retention defect was found in this review. This is not a visual benchmark verdict or a production-readiness claim.

## Remaining confirmed finding

### P2 — Terminal states hide a lost source connection

**Location:** `public/ai-maze-escape/app.js`, `refreshSceneCard()`, lines 34–39 in the reviewed app snapshot; `poll()` catch at line 126; `public/ai-maze-escape/index.html` line 37.

`refreshSceneCard()` returns for `result` and `intermission` before testing `failedPolls`. When polling fails while either terminal scene is displayed, the result remains visible but no visible reconnect indication appears. The only other connection text changed by the catch is `#integrity`, which is `sr-only`. In intermission the screen continues to promise “The next adventure begins automatically.” while it is disconnected and cannot observe the restart. This violates acceptance 5's explicit reconnect requirement during the result/restart loop.

**Reproduction:** Execute the current `refreshSceneCard()` with `rendererState='ready'`, `failedPolls=1`, and the respective public frame. A VM probe using the exact extracted function returned:

| Frame scene | Visible title | Visible message | Graphics banner |
| --- | --- | --- | --- |
| `result`, escape | A way through. | Keys found. A route discovered. The explorer made it home. | Hidden |
| `intermission` | Another garden awaits | The next adventure begins automatically. | Hidden |
| `normal` | Reconnecting to the adventure | The last known view is held while the live source reconnects. | Hidden |

**Required repair:** Preserve the truthful outcome while also exposing lost connectivity in a visible status/banner or terminal-card message. Add a browser regression that presents a genuine result/intermission, fails the next poll, observes the reconnect indication, and then verifies that a successful restart frame clears it.

## Confirmed findings repaired during this review

### P1 — Context restoration replayed stale positions

The initial `contextRestored()` only cleared `lost`/`lastNow`. `update()` continued appending movement while rendering was suspended, so the current live fallback map could switch back to a 3D explorer many moves behind the current public frame.

**Initial reproduction:** With real `MazeRuntime` snapshots for seed `review-recovery`, lose the context at tick 0/cell 133, accept 20 public updates, and restore. Public cell 7 was at `x=-2.4,z=-12`, but the first restored explorer position was `x=14.4,z=4.693333333333333`, with `routeQueue=21`.

**Current disposition: fixed and independently reprobed.** The integration owner changed updates while lost to snap to the latest public snapshot and restoration to reset explorer/camera and warden queues. The same probe now returns `x=-2.4,y=2.8,z=-12`, `routeQueue=1`, and `explorerInFrame=true`.

### P1 — A same-run positional snap could put the explorer outside the camera

The initial branches for missing history, a terminal snapshot, and queue overflow reset the movement cells without resetting `cameraTarget`. The first render could show the newly snapped explorer outside the still-interpolating camera.

**Initial reproduction:** Use the same genuine runtime's tick 0/cell 133 and tick 71/cell 0 frames. The motion queue correctly snapped to one cell, but the explorer projected to `y=1.8947582624787622` in normalized camera coordinates and `explorerInFrame=false`.

**Current disposition: fixed and independently reprobed.** The host now uses `resetPosition(snapshot)` in these branches. The same probe returns the actual target `x=-19.2,y=2.8,z=-12`, `routeQueue=1`, and `explorerInFrame=true`.

Both probes executed the current scene host and real Three vector/camera math with real world construction and real public snapshots. Only the WebGL renderer and articulated character models were replaced by light stubs. They establish host state/camera correctness; actual browser context restoration remains a separate check.

## Load-bearing checks with no further confirmed defect

- **Public knowledge:** Browser modules consume public snapshots and do not import authority/generation state. Terrain uses `snapshot.cells`; coordinate-based height and cosmetic variation reveal no generated secret. Stairs require both cells to be disclosed and an observed passage. Gates use the explicitly disclosed door endpoints. Hidden/skipped warden movement snaps instead of inferring a route.
- **Physical/legal terrace agreement:** The lower-cell stair runs to the higher adjacent floor and does not create a connection at a known wall or unknown endpoint. A downward Three raycast matched all sampled stair risers to `sampleGroundHeight`. A single pre-stair floor-tile seam was 0.04 below the nominal surface, a cosmetic seam rather than a navigation defect. The explorer, wardens, marker, contact shadow, lantern, route, and camera all derive elevation from the same height functions.
- **Skipped public ticks:** `planPublicMotion()` retains intervening observed turns and checks known cells, grid adjacency, and disclosed passage edges before interpolation. Missing continuity snaps. The scene caps explorer queues at 32 and warden queues below 8, and never interpolates across run tokens.
- **Fallback/retry ownership:** The app retains one serialized request chain and one requestAnimationFrame chain. Retry replaces the canvas after disposing the former host; it does not start another poll or render loop. Actual results are independent of the graphics banner. Event handlers are removed from disposed scene canvases.
- **Counters/status truth:** Cumulative steps come from `explorer.steps`, rather than the 240-cell public trail. Discovery remains the real disclosed-cell fraction after escape. Terminal titles distinguish escape from other outcomes and are not fabricated from discovery progress. The reconnect exception is documented above.
- **Resource ownership:** World geometry/material/texture pools are fixed; retired instance batches are disposed; object/animation arrays are replaced; removed wardens are disposed; run transitions clear wardens/routes; frame timing, route history and audio voices/deduplication are capped. Host disposal releases environment/contact textures, route/marker geometry, shadow targets, and renderer resources.

## Verification performed and remaining gaps

Performed:

1. `git diff --check HEAD` — passed.
2. `node --test tests/phase3/maze-3d-presentation.test.cjs tests/phase3/maze-3d-world.test.cjs` — both file suites passed (ten declared focused tests; the local runner reports at file level).
3. Exact scene-host probes for loss/restoration and same-run long-gap snapping — failed before the integration owner's changes and passed against the current scene.
4. Physical raycast versus the ground sampler on the disclosed terrace crossing — all risers consistent.
5. Exact terminal/reconnect status-function probe — confirmed the remaining P2 above.

Gaps, not asserted bugs:

- Fresh complete browser results on the final terrace/character/recovery revision, including actual context loss, retry, and terminal reconnect.
- Actual rendered motion, occlusion, camera visibility during ordinary gameplay and both mobile orientations. This reviewer deliberately did not start another browser or use stills to infer these results.
- GPU/resource measurements across repeated real browser runs and context losses; JavaScript disposal inspection and fixed-pool unit tests do not substitute for that evidence.
- Visual parity with the fixed reference and hardware-GPU performance remain outside this engineering verdict.

## Reviewed source fingerprints

Hashes taken at 2026-10-30 19:29:33 UTC, after the two scene fixes and before any reconnect fix:

| File | SHA-256 |
| --- | --- |
| `public/ai-maze-escape/app.js` | `b39aca93a74d4f0a721497db7f1a69ffe42df7d8862d0d6e96011d92633495bc` |
| `public/ai-maze-escape/scene.js` | `e5f72218da421dc59af4dbe8618ac0828206386cd3f2e15dcb669621ffd34ae5` |
| `public/ai-maze-escape/world.js` | `eb62f02f3fd193f973c081fd903af22d37ece2721ca6a021ff716bd0a01f78aa` |
| `public/ai-maze-escape/map-view.mjs` | `26f3643b293ed8fd51535705542026c0dab2a7f230d15a86d2e013e64aec567d` |
