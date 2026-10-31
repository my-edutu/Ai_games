# Infinite Tower Climb — Gauntlet 33: stop capturing untextured stone as finished art evidence

**Source:** draft PR #58, exact parent 80e07884ed215fd2162141398ec5542270cd27d0. **Scope:** Tower Landing Evidence browser capture readiness only. **Review mode:** SELF-REVIEW; separate critic, subagents and Ultracode unavailable because the workspace tunnel returned NOT_FOUND (tunnel-client unseen for 300 seconds). Independent review gate remains open.

## Pre-edit GPU evidence and CI

Downloaded the actual GitHub Actions Tower Landing Evidence ZIP from successful run [41235215471](https://github.com/my-edutu/Ai_games/actions/runs/41235215471), artifact **13054999404**, and inspected 960 x 600 desktop and 390 x 844 portrait PNGs and exact-SHA JSON manifests, not just their success labels. All after manifests identify 80e07884ed215fd2162141398ec5542270cd27d0 and contain no page/render errors. However, after-left-desktop and after-right-portrait record stone surface state **loading**, width 0 and height 0. Only after-left-portrait reports **ready**, 1254 x 1254. Thus 2/3 nominally successful new-gate screenshot captures did not prove the material as it looks after decoding. Valid untextured first frames are acceptable gameplay but are invalid evidence of settled physical materials. Official Jusant environment and ASTRO BOT Rising Heat action/readability bars remain unchanged.

At the parent head, dedicated Landing, Motion, Realism and Guardian CI passed. Full [Autonomous Games CI 41235219315](https://github.com/my-edutu/Ai_games/actions/runs/41235219315) failed on three Tiny Kingdom G057 browser tests; the failure does not establish a Tower fault or an overall pass.

## ONE failure and repair

Added scripts/tower-capture-ready.cjs, which waits for explicit stone-image state **ready** with positive decoded dimensions, then requires two subsequent actual scene-frame submissions before screenshot capture. It fails rather than silently substituting an unfinished material if decode fails or the resource is unavailable, and rejects renderer errors. Wired this into tests/browser/tower-landing-beacon.spec.cjs before the source-matched screenshot and manifest are saved. Added six focused behavior tests in tests/phase3/tower-capture-material-readiness.test.cjs.

This is a proof-quality change, not a claim of upgraded geometry, better graphics or faster rendering. It does not change renderer source, asset content, authority, camera, collision, AI, RNG, replay, public snapshots, UI, game logic or quality tiers. An attempted readiness wait that exceeds the browser timeout is a verification failure, not a visual pass.

## Verification and limitations

**RED:** new behavior test initially failed with MODULE_NOT_FOUND when the helper was absent. **GREEN:** six of six focused helper tests passed on Node 22.16.0 with failure, loading, invalid dimensions, missing follow-on frames, render errors and invalid configuration covered. The new helper passed node --check. The exact parent GPU evidence was inspected as described above.

**Not verified in this environment:** modified Playwright browser capture, npm full build, cross-phase Tower suite, new-source CI GPU screenshots, commercial independent comparison and intended-device sustained FPS. The shared project workspace/browser tunnel was disconnected. The new-head dedicated CI must inspect the same 3 capture manifests; do not infer readiness from a workflow success alone.

**Self-review:** The spec requirement for reliable material screenshots is met in the isolated helper tests. The risk is slower or failed evidence capture when loading never finishes; this is deliberate truthful failure, but needs exact-source browser validation. The screenshot remains a held state and does not prove motion. Rollback is a revert of the single cohesive commit.

**Automatically suggested next priority:** fetch the new-head Landing artifact, confirm all three after-image manifests are stone-ready with real post-load frames, then return to the much larger original-model, environment and climbing-contact quality gaps against Jusant and ASTRO BOT. **Overall Gauntlet 90 NOT ACHIEVED.** PR stays draft. Nothing merged, force-pushed or deployed.
