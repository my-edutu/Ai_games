# Pass200 — release dormant Thornback GPU registrations without sacrificing its CPU rig (2026-11-07 UTC)

**Scope:** same draft PR #53, `feat/maze-3d-gauntlet`; benchmark Nintendo Captain Toad NOT MET, no merge/deploy/force-push.

## Exact-HEAD diagnosis

The complete source-bound Pass199 [Maze WebGL run 42421811256](https://github.com/my-edutu/Ai_games/actions/runs/42421811256) at commit `ed23ce69a7e9a4f60b4bc5b9f26c5012ccf0bcb4` **FAILED the unchanged 6-run resource test**. Its logged run-start geometry counts were **37,37,42,42,98,98** (spread **61**, maximum **8**), with all six under the separate **100** cap. At every sampled start, only one public Pip and **37 distinct actual visible scene geometries** were referenced, guide buffer ID stayed 148, nine world geometry classes and four textures were recorded. The new detached one-slot dormant Thornback introduced in Pass199 evidently retained renderer-registered buffers beyond the public encounter: 98 registered against only 37 referenced. This is strong source/log evidence, not yet an independently tested root-cause proof.

The same source ran its 87 focused Node/installed-Three checks and live stream successfully, but the strict browser test failed; whole [CI 42421811253](https://github.com/my-edutu/Ai_games/actions/runs/42421811253) stopped at unrelated missing `tiny:stream:self-test`. No full CI success claim. Authentic latest full-frame 320/390 pressure-scene images still have unresolved masonry/interaction hierarchy and no independent Nintendo-parity review.

## One production correction, not a threshold or cosmetic patch

Keep one previously *publicly witnessed* neutralized, fully detached Thornback CPU rig only. When a public encounter disappears, release all GPU-only buffers of its *private* merged rigid geometries and primitive geometries not shared with another living model, leaving the same CPU mesh/material/poses for future public reupload. Three.js `BufferGeometry.dispose()` frees the renderer's registered buffers without destroying CPU positions; the next genuinely disclosed public encounter automatically uploads those unchanged geometries. A group still attached to the scene refuses suspension. Pip/shared live geometry is never evicted; on terminal teardown the same owner/geometry reference rules apply. No private-game navigation/AI/collision access, map leak, new render cue, altered silhouette, camera, HUD, 44px control, threshold or fake resource metric.

An installed-Three regression verifies attached-guard rejection, detached GPU dispose events, preservation of Pip-shared resources, exact GPU reupload-eligible geometry identity and balanced/full rig teardown. **Only new exact-HEAD Chromium/WebGL six-run evidence can accept or reject this repair.** Require <100 each, spread <=8, original 37 untampered full-frame screenshot hashes, current strict NDC and accessible gameplay checks, fresh critic when available. If it fails, do not repeat speculative pooling; trace actual registered geometry ownership and correct the specific cause.

The shared coding workspace/fresh-context critic/Ultracode remain unavailable (tunnel NOT_FOUND); no simulated independent visual verdict. Continue until a documented original gameplay-quality win, not a passing test count.
