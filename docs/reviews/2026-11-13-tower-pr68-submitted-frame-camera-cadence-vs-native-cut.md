# PR68 P0 — native-video verified hard cut and cold-WebGL camera cadence

**2026-11-13 · Stage P0 OPEN · Leading transformation verdict NOT EVALUATED.**

## Exact-head and authentic full-motion inspection

PR #68 was confirmed **open and draft** at `e4513ca55b69f7b20d18f90927f44d0be3929e8b`, based on PR58 (frozen source `1731b380851162741761c5569e2bc152a0869ca9`). Read AGENTS.md, the approved transformation design, the Tower GAUNTLET and current source. Inspected latest **completed** nine-job original 1× capture [43412674243](https://github.com/my-edutu/Ai_games/actions/runs/43412674243). Eight baseline/candidate 60-second-plus films and original source event indexes exist; pair-source-events failed strict native comparison **0/2** despite successfully producing ungraded event-aligned duel videos. The matched source baseline does not itself reproduce the candidate's HP-zero guardian defeat; never imply a matching boss victory or identical actions.

I downloaded the unmodified 25fps native comparison films, inspected original full-motion desktop 960×600 and portrait 390×844, and reviewed 22.5–27.0 second first-episode frames. At ~24.6–25.2 seconds, the original warm Floor8 bronze roof/gateway/world is replaced by a differently composed violet Floor9. The actual source reaches tick451, and the drawn HUD changes 8→9 at approximately 24.75s desktop, but the video **does not show the same physical doorway and hero continuously**. Strict native guardian threshold **REJECTED 0/2**. This is the highest-impact experience defect. Image continuity is not proved by source event, rendered geometry survival or green test.

At [exact-head quality 43412674285](https://github.com/my-edutu/Ai_games/actions/runs/43412674285), not all partitions passed (phase3/phase6 failures); CI is not green.

## Unified production fix and test-first scope

An overlooked source-level cause: `animate()` caps a long WebGL stall to `dt=.5s` and passes that entire unpresented gap into **all** camera interpolation/directors. At the cold first Floor9 frame, follow smoothing uses `1-exp(-dt*cameraRate)`; at rate 8 the old camera can travel ~98% of its destination in one unseen step. Later actor/duel/portrait/optical safeguards may spend that same unpresented time, so post-camera gateway tweaks cannot guarantee one continuous shot.

Added `source-submitted-doorway-cadence.mjs` and bound the **existing** 3D camera's interconnected follow, hero rescue, joint-shot, guardian, optical and physical gateway arbitration to a single maximum `1/25s` camera interpolation step when **the same authentic retained original GPU bronze arch is source-proved on the current live Floor9 snapshot**. Ordinary camera, overview, stale, reduced-motion, dead actor and incorrect source epochs retain their original motion. This changes no authoritative physics, world chunk rebase, room/platform geometry, floor progression, restart, collision, audio or extra render pass. It does not slow the fixed-step simulation or the native recording; it limits only how far camera orientation and gaze can leap on a single submitted image after a long software-render gap.

Production source [984209eef37aa489ba3501fbd165aaef3e84c413](https://github.com/my-edutu/Ai_games/commit/984209eef37aa489ba3501fbd165aaef3e84c413). Added `tests/phase3/tower-source-submitted-doorway-cadence.test.cjs` for cold .5s frame, ordinary .02s frame, wrong run/floor/source/overview/stale/reduced-motion rejection and entire 3D camera-path integration. Pure helper was independently exercised with Node v22 locally (2 focused cases passed); exact-head repository CI and *new* real films are **NOT YET VERIFIED**. A correct camera sampling contract is not visual acceptance.

## Required next proof

Request exact-immutable candidate SHA full 9-job normal-speed baseline/candidate capture, matched seed/tier/scenarios, both 960×600 and 390×844, >60s, original PTS. Inspect first 22–31s and complete cycle. Check the **first returned Floor9 frame** for `sourceSubmittedDoorwayCadence.boundedCameraFrames`, source-authentic old gateway, same real 3D hero, visible continued shared roof geometry and camera no-cut. Reject if the gateway is still hidden, source-pixel PTS disagree, hero crops, or Floor9 wall/depth still pops. If rejected, next highest-impact work is full physical world-camera depth/occlusion reconstruction, not another decorative fade.

Actual GPU p50/p95/p99 and memory on supported devices **NOT EVALUATED**. Five genuinely independent blind critics per pillar: LOOKS 0/5; FEELS 0/5; PLAYS 0/5. Safety unchanged: no PR58 edit, force push, merge, deploy, draft conversion, frozen baseline move, or other-game work.
