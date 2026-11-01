# Infinite Tower Climb — Gauntlet 47: authentic upper-deck sole contact

Date: 2026-11-01. Draft PR #58, exact parent `ef21e7a80e2cdfccb31d19fb4d9c21bb9de60a90`. Scope: one independently judgeable appearance defect, not a production-quality verdict.

## Evidence before editing

Read AGENTS.md, the game's GAUNTLET.md, progress ledger, PR discussion/reviews and completed checks. [Tower Ledge CI 41286962914](https://github.com/my-edutu/Ai_games/actions/runs/41286962914) completed SUCCESS, with 19 focused logical and 4 real Chromium browser cases. Downloaded artifact `13075687420`: 32 source-bound 960×600/390×844 WebGL screenshots with checksums and no recorded page/GL errors, and examined grip tick298, release299, and crossing300. The crossing root was within the true deck band (22.4–27.18), but ankle clearance alone failed to establish sole contact. A local *actual skinned-rig* replay of the original tick300 pose found a modeled leading sole about 0.065 world units over the real Y6 walking surface. This local probe is not a GPU pixel measurement or full-motion pass. The previous broad Autonomous Games CI `41286966854` was still in progress at selection.

## One vertical implementation

Presentation-only `characters.mjs`: measure the modeled lead boot's heel/sole in world coordinates and settle it onto the actual matching intended platform top only during a valid, still-rising, non-gripping crossing, using a bounded height window, radial band, ankle leveling and small body compression. The platform must match `ledgePlatformId`. `scene.mjs`: derive top Y and real upper walking band from the same actual intended platform, passing it only as a rendering hint. No changes to authoritative root, AI, physics, collision, replay, RNG, shaders, resources, external assets or draw calls. No false standing/landing state.

## Test-first checks and review

The new actual Three skinned-rig test was RED on the original source (13/14 passing, one expected failure at the hovering sole); after source change and extra scene-wiring contract, focused GREEN 15/15 and four affected ledge suites 21/21. `npm run build` PASS. Tower stream-host self-test PASS (`ok:true`, tick600, authority checksum `7725eefc`; privacy/recovery/restart true). Local browser with system Chromium failed navigation `ERR_BLOCKED_BY_ADMINISTRATOR`; it is **NOT** a local GPU pass. New-source WebGL artifacts and exact-head CI were pending during implementation.

**SELF-REVIEW ONLY**: fresh-context critic and Ultracode workspace returned `NOT_FOUND` (disconnected tunnel). Specification review: scoped foot-to-real-slab and wrong-platform invariants PASS under actual Three rig. Quality review: still OPEN pending new-source same-checksum GPU screenshots, continuous normal-speed motion, blind official [Jusant](https://dont-nod.com/en/games/jusant/) and [ASTRO BOT Rising Heat](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4) comparison, accessible UI, intended-device sustained FPS and long-run soak. Prior source normal-speed workflow artifact `13075718240` used software rendering with long frame intervals, not hardware performance evidence. Overall Gauntlet **FAIL/OPEN**.

Next: verify exact new-head Tower Ledge CI and inspect 32 source-matched desktop and portrait PNGs before awarding any visual success; then assess whether toe contact persists or snaps during t299–303 under uninterrupted motion. No merge, force push or deploy.