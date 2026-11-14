# Pass199 — reuse only previously witnessed Thornback GPU rig (2026-11-07 UTC)

**Existing draft PR #53; branch `feat/maze-3d-gauntlet`; fixed official Nintendo Captain Toad quality gate NOT MET. Never merge, deploy, force-push or relax screenshot/resource thresholds.**

## Exact previous-head evidence

The [Pass198 exact-source WebGL workflow 42415871810](https://github.com/my-edutu/Ai_games/actions/runs/42415871810) successfully ran all 86 Maze presentation/unit tests and the native WebGL capture step, but **failed** the unchanged six-real-run geometry spread check. The actual Chromium log recorded run starts **37, 37, 42, 42, 46, 46**, spread **9 versus max 8** (each under the separate strict 100 cap); the **public-guide BufferGeometry ID stayed 148**, while the world remained 9 geometry classes, current public character count 1, public referenced scene geometry count 37 at each sample and four textures. Pass198's guide-buffer reuse therefore did **not** cure the renderer-registration drift. This is a confirmed regression, not a subjective visual verdict.

[Whole CI 42415871818](https://github.com/my-edutu/Ai_games/actions/runs/42415871818) passed **696/696 Node tests**, then stopped before browser checks at unrelated missing `tiny:stream:self-test`. Do not call whole CI green.

Prior original full-frame source-bound 320/390 pressure-stage screenshots passed strict ±0.95, but the actual small-screen puzzle still reads as crowded masonry, not Nintendo-level original 3D action. The Pass198 workflow's new native captures have **not** yet been independently downloaded/hash checked/reviewed.

## Single worthy production work unit

Stop disposing and recreating complete Thornback Three.js rigs on every *public* appearance, disappearance and run reset: reuse **at most one previously observed** rig, kept fully detached from the scene while dormant, preserving original mesh/material/geometry identities rather than relying on the renderer's eventual registration cleanup. Neutralize gait, heading and all body alert/withdrawal motion before reuse. The live `wardens` map still contains **only** threats in the current published snapshot; no private/future map data, extra antagonist, fake cue, additional UI, AI/collision authority or geometry is introduced. Genuine second concurrent guardians allocate independently and dispose if the bounded cache is already occupied. Final scene disposal frees the dormant rig.

A focused installed-Three unit test simulates six reused real articulated guardian poses and asserts reset, mesh/material identities, shared primitive teardown. Existing unchanged exact-browser six-run limits and native screenshots are the decisive gates, not an invented pass from this source code.

## Verdict and next independent gate

**Production candidate, NOT YET tested/rendered.** Require exact-new-HEAD GitHub CI passing the unchanged public six-run geometry spread <=8 and each sample <100, strict no-crop 320/390/844/1280 native screenshots with genuine source/UTC hashes, no hidden guardian cue or altered gameplay, plus fresh independent visual criticism against the official Nintendo benchmark. Shared coding workspace and fresh-context agents/Ultracode were unavailable with tunnel `NOT_FOUND`; no independent critic or hardware-GPU FPS claim. If verified, the next biggest player-visible task is a coherent full-frame Pip/Thornback pressure encounter and clearer original authored stage, not another cosmetic hinge.
