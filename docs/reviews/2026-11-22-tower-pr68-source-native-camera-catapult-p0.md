# P0 — first Floor 9 returned-camera catapult: source/native evidence and implementation
**Date:** 2026-11-22 · PR #68 stays open/draft · frozen source baseline `1731b380851162741761c5569e2bc152a0869ca9`

## Genuine first-episode observation

Read `AGENTS.md`, design spec and `GAUNTLET.md`, then inspected the 9-job [immutable 2781e9e8 source-pinned campaign](https://github.com/my-edutu/Ai_games/actions/runs/45050256966): all eight unedited 1x baseline/candidate WebMs and source ledge were recorded. Pair-source-events job failed strict acceptance; the matching [quality workflow](https://github.com/my-edutu/Ai_games/actions/runs/45050256979) failed 2/10 (phase3 false negative from escaped regex; separate phase6 Maze-readiness worker 75s timeout). Do not call a completed capture a visual improvement.

The exact-source `original-room-native-alignment.json` joined FIRST original F8→F9 episode: **desktop 51 and portrait 56 renderer-return frames** map to their independent first native film. On both, `firstJointOldNewReturnedSceneIndex=1` and `returnOwnerGapBeforeNextStructure=false`, so original/successor **scene owners coexist** at first return; no evidence yet they are painted together to create convincing scale. Native desktop shows Floor9 HUD about 26.0s and a sustained violet world 27.75s; portrait HUD 25.75s and sustained violet 27.5s. Both have a 1.75-second transitional disconnect.

The largest observed full-motion defect is the **portrait post-director camera catapult**: source-returned camera `[20.585,4.535,46.905]` at ~27.05s to `[37.08,10.341,69.362]` and then x≈79 by ~27.38s while authentic climber stays near `[9,0,23]` on the same walkable Floor9 receiving roof. In unedited video the complete hero disappears around 28.0s when the shot retreats to the giant violet shaft. The original bronze doorway cannot visually accompany that huge discontinuous camera move. This is not a lack of source event or renewed first-episode evidence.

## Production correction — [`1aec7e6e`](https://github.com/my-edutu/Ai_games/commit/1aec7e6e779e3a00cc084174de90b420db9397cb)

A pure camera-bound policy in `visuals/first-floor-nine-camera-departure.mjs` uses the *last successfully submitted same-run Floor9 camera/gaze/skinned hero* plus actual frame time and authentic current hero displacement. For at most 110 Floor9 fixed source ticks after the first successful F9 renderer return, the **final** camera director is prevented from making a sudden unearned outward dolly that miniaturizes the hero. Ordinary tracking, inward recovery, legitimate large source movement, manual and reduced-motion modes are unchanged. After it is applied, the genuine 3D skinned full-body projection and real opaque tower-core sightline may veto it; failure retains the prior composed camera. No new WebGL pass, invented successor architecture or altered guardian/collision/progression is involved.

Added source-authentic >20-unit camera-catapult regression, legitimate movement/restart guards, final integration ordering and resolved the incorrectly double-escaped first-source-room test regex. Isolated Node22 pure-policy tests passed 4/4 against matching algorithm; exact repository CI and native candidate film after correction have **not** been accepted. Sources and proposed camera-bound acceptance counters are persisted in `p0-real-rendered-room-return-timeline-20261122.json`.

## Unmet gate / next highest-impact action

[Quality CI](https://github.com/my-edutu/Ai_games/actions/runs/45056634514) and [new source-pinned capture](https://github.com/my-edutu/Ai_games/actions/runs/45056634524) were queued/running at evidence write. Inspect both original >60s candidate WebMs in 960×600 and 390×844 at 1x around 24–30 seconds, compare the new `firstFloorNineCameraDeparture` counters to genuine native footage and strict source/native events. If any viewport still cuts to a remote world or the physical camera veto rejects the bounded shot, keep P0 OPEN and correct the joined world/camera system, **not** another opacity cosmetic fix.

**Leading verdict: NOT EVALUATED.** LOOKS 0/5, FEELS 0/5, PLAYS 0/5 genuine independent randomized critics; supported real device p50/p95/p99/memory NOT EVALUATED. PR58, frozen baseline, draft status, other games unchanged. No merge, deploy, force-push.
