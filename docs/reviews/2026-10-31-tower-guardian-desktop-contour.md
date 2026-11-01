# Infinite Tower Climb Gauntlet 21 — desktop guardian contour and exact GPU evidence

**Date:** 2026-10-31. **PR:** [draft #58](https://github.com/my-edutu/Ai_games/pull/58). **Source:** [07c8f517](https://github.com/my-edutu/Ai_games/commit/07c8f51744472232b2e04f138de8277844ae8ff2). **Review:** explicit **SELF-REVIEW**, not independent (coding/critic tunnel returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`). No Ultracode or independently run critic was claimed.

## Evidence-first target

Read current PR head, AGENTS.md, GAUNTLET.md, ledger, available PR reviews/threads (none), completed CI, and downloaded the actual prior GPU artifact **13037809569** (run [41189391725](https://github.com/my-edutu/Ai_games/actions/runs/41189391725)). Directly inspected 960×600 and 390×844 PNGs, both from the authoritative floor-8 tick 258 snapshot, checksum `87440ff6`. Prior after-desktop diagnostic: `occludedGuardianCaps=0`, with the upper deck still opaque across the crown/hammer. Portrait already reports 1. The exact fd6d035 full CI [41189957594](https://github.com/my-edutu/Ai_games/actions/runs/41189957594) and Autonomous CI [41189961006](https://github.com/my-edutu/Ai_games/actions/runs/41189961006) were independently verified **success** before editing.

**Single chosen failure:** desktop cap ray tests sampled only two world-space points at the animated head center/+0.24; neither crossed the cap, despite its visible overlap with an outer crown edge.

## Source and proportional red–green

`public/infinite-tower-climb/visuals/scene.mjs` now samples **nine bounded, reused** points at the animated `armored-head` bone's visor, side and upper contours, including a small 0.05-unit extrusion-bevel guard. Existing `world.revealGuardianSightlines` ray tests and cap-owned materials remain unchanged; per-frame work is nine bone-local-to-world transforms and at most nine ray tests per guardian per platform. No new dynamic geometry, materials, audio, authority or physics. Empty sightlines continue to restore solid caps and depth writes.

New `tower-encounter-composition.test.cjs` regression reproduces actual Gauntlet 20 960×600 camera position `[-6.025937,37.390184,44.979434]`, guardian x 151973 at floor 8, physical cap geometry and an actual articulated guardian. The prior two rays must miss; new contour points must hit the cap, soften it, restore on clear view, reuse the array and preserve the immutable authoritative snapshot. The test **FAILS** on exact old fd6d035 source (`sampleGuardianCrownSightlines is not a function`) and **PASSES** with candidate. CI explicitly checks this historical red/green pair. GPU browser spec also requires `occludedGuardianCaps > 0` on the real current desktop render, not on the older baseline.

**Local evidence:** 29/29 affected scene/cast/world tests PASS; TypeScript build PASS; host self-test `ok:true` (authority, assets, privacy, recovery, restart). A broader local Tower command exceeded its time limit after case 133 — NOT a complete-suite PASS. Local system Chromium's `page.goto` failed `ERR_BLOCKED_BY_ADMINISTRATOR` at 127.0.0.1, so local browser verification is a blocker, not a PASS.

## Downloaded exact-source GPU and CI review

- [Guardian GPU run 41193582658](https://github.com/my-edutu/Ai_games/actions/runs/41193582658) **PASS**; artifact **13039053724** downloaded and inspected. Four actual PNGs/JSONs, 960×600 and 390×844, before/after from real held tick **258**, checksum `87440ff6`, zero page/WebGL/render errors.
- New candidate's after-desktop `occludedGuardianCaps=1` (was **0** in Gauntlet20 after-desktop); visual transparency across crown and hammer visibly improves. Exact consecutive after-desktop images differ at **19,870 pixels** by more than 8 RGB in at least one channel. The workflow's own `before` is older Gauntlet19 baseline `374e8`, so this cross-artifact comparison is the fair direct immediate-predecessor check.
- The portrait after image still records `occludedGuardianCaps=1`; only **112 pixels** differ from the preceding Gauntlet20 portrait after, so no large new portrait improvement is claimed.
- [Tower Realism run 41193582661](https://github.com/my-edutu/Ai_games/actions/runs/41193582661) **PASS 587/587 full catalogue logical tests**, host contract `ok:true`. [Landing GPU run 41193582664](https://github.com/my-edutu/Ai_games/actions/runs/41193582664) **PASS**. [Autonomous Games CI 41193585607](https://github.com/my-edutu/Ai_games/actions/runs/41193585607) was **in progress**, not counted passed, when the ledger was drafted.

## Critic verdict and next priority

**Scoped PASS:** the real held desktop guardian/cap regression is now detected; cap transparency visibly changes desktop without degrading the previous phone view. The source, exact fixtures, red/green CI, browser diagnostics, source hash and artifact are traceable. **Scoped remaining FAIL:** the translucent deck and weapon are still compositionally crowded; this is not a clean, independently rated commercial-quality silhouette.

**Overall GAUNTLET NOT ACHIEVED.** The output has NOT beaten official [Jusant](https://dont-nod.com/en/games/jusant/) environmental/climbing imagery or [ASTRO BOT Rising Heat](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4) animation/readability in an independent blind comparison. Four held frames and 8 renderer submissions are not continuous motion, frame pacing or device FPS; intended-device accessibility, sustained stability/soak and independent critique remain open.

**Next largest gate:** obtain actual **normal-speed continuous-action** evidence (guardian telegraph, attack/impact, ledge traversal and recovery with camera/cap transitions), evaluate temporal clarity and collision/replay truth, and separately record intended-device sustained FPS/frame-time/memory, followed by fresh independent Jusant/ASTRO BOT comparison. No merge, deployment or force-push. Roll back the scene/test/workflow source commit to remove this incremental visibility change; all prior gameplay remains intact.
