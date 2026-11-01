# Infinite Tower Climb — Gauntlet 40: source-bound ledge transition evidence

**Chosen failure:** G39 portrait tick 298 looks as if the airborne climber is supported on the lower deck. A held still cannot distinguish foot depth, camera projection or transition pose; do not blindly rewrite the rig.

**Evidence inspected before editing:** actual downloaded G39 GPU portrait, G39 review and ledger, AGENTS.md and Tower GAUNTLET.md, source, PR reviews and completed CI. G15 Landing CI SUCCESS and G15 catalogue FAIL. G39 Ledge and Motion CI SUCCESS, catalogue CI CANCELLED. Official Jusant and ASTRO BOT Rising Heat remain the user-approved bars.

## Test-first RED verified

Test-only commit [64a3009](https://github.com/my-edutu/Ai_games/commit/64a30094ce0efcf152261cbcd7bd704846f2915a). [Tower Ledge Contact Evidence #41269613034](https://github.com/my-edutu/Ai_games/actions/runs/41269613034) failed on the intended missing source function, with npm ci/build and all existing ledge tests passing. Logs explicitly show: shipped source must offer measured projection for real lower-deck ambiguity. Browser step was skipped, not passed.

## One scoped implementation

- scene.mjs diagnostics now project both real animated ankle joints and radial samples of the actual nearest lower platform to normalized device coordinates. This does not modify camera, geometry, physics, AI, replay, shadows, assets or materials. Projections alone cannot prove raster occlusion.
- Browser tests now render ten ordered, real authoritative snapshots around the first authentic raised fingertip, on desktop and portrait, pinning exact tick/checksum before every PNG. All states come from the same seeded session with no manipulated pose.
- Dedicated real-source unit test checks anatomical joint projections, deck identity and immutable authority. Existing Tower Ledge evidence workflow runs it and uploads complete source-bound PNG and JSON traces.

**Exact-source GREEN CI and actual GPU artifacts: PENDING.** No visual improvement or sustained frame rate is claimed. These are separately rendered ordered stills, not live-motion or intended-device FPS evidence.

**Critic:** The connected coding-worker tunnel returned NOT_FOUND (not seen for 300 seconds). No subagent or Ultracode execution occurred. Explicit SELF-REVIEW, independent gates OPEN.

**Overall Gauntlet 90: NOT ACHIEVED.** Draft PR retained; no merge, force push or deployment.

**Automatically suggested next priority:** download exact-source ordered desktop and portrait PNGs, inspect root/ankle/deck projected NDC alongside pixels; correct a measured false-platform-support or radial transition defect with RED-GREEN, then independently assess full motion and Jusant/ASTRO BOT comparison.
