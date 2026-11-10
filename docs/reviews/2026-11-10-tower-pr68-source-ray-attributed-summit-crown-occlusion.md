# Infinite Tower Climb — P0 source-ray attribution and open summit-crest reconstruction

**10 November 2026 · Draft PR #68 only · verdict: NOT EVALUATED**

## Original, unaltered game evidence

The [source-pinned original game recording (run 42737729668)](https://github.com/my-edutu/Ai_games/actions/runs/42737729668) contains all eight baseline/candidate scenario/viewport WebMs and 8/8 calibrated native event clocks with no source-story or pair-integrity defects. Its overall ten-job workflow is **FAILED**, not a clean capture acceptance: `authentic-ledge` found clockwork triangle/resource growth across floor rebuilds (120224 vs 127096). Follow-on commit `f58270aa` switches consistent open-pylon geometry across clockwork floors; the later [exact-HEAD quality workflow (42738107384)](https://github.com/my-edutu/Ai_games/actions/runs/42738107384) succeeded. **A post-f582 original video is still absent.**

The immutable candidate danger artifact [13727083599](https://github.com/my-edutu/Ai_games/actions/runs/42737729668/artifacts/13727083599) contains a **390×844, ~72.8s, 25fps original normal-speed** WebM. Native frames near **15–17 seconds** display a huge silver spoked hoop and tall squared frame swallowing much of the real guardian duel. It is not appropriate to credit the recent pylon/grille correction merely for passing CI.

Crucially, source-ticked original camera-ray provenance resolves at **source tick 307**, screen coordinate approximately `[0.04,-0.08]`, a physical hit on **`ActualCapNavigationHalo / ObservedCurrentFloorSummitCrown / Scene`** at camera distance **9.367**, with real guardian around distance **14.709**. A further recorded tick/episode identifies `ActualCapNavigationSpokes`. Meanwhile the four prior tracked decorative-clock sightlines returned screen coverage zero and were BEHIND the action at substantially greater depth. These are authored original Three.js triangle hits, not pixel-perfect segmentation; they decisively redirect the highest-impact fix away from repeatedly moving unrelated biome clock gears.

## Substantive production-path correction

The source-owned objective stage in `public/infinite-tower-climb/visuals/scene.mjs` previously presented a **full 360° radius-2.85 ring with eight solid spokes** on the exterior camera-facing radius **28.85**, ahead of the climber and guardian. At [implementation commit 365905d9](https://github.com/my-edutu/Ai_games/commit/365905d9119217e290ed23029396e23c0bdf8636), the REAL world object is reconstructed as a physically interrupted radius-1.95 forged arch (**115.2° genuine downward daylight gap**) with four perimeter finials, no central spokes. The exact real current-floor cap bearing and height stay source-owned, but the staging radius is now **22.72**, INBOARD of the combat actors rather than in front of them. Its bounded source-tick-only ±0.022rad motion preserves the downward opening; reduced motion has no temporal sway. Existing cap/collision, guardian HP and lock, crusher, real gateway, floor-nine authority, recording cadence, audio/HUD, resource lifetime and frozen baseline are unchanged. Two depth-tested submitted draws and existing disposal remain.

[Focused contract commit 2f5d6dab](https://github.com/my-edutu/Ai_games/commit/2f5d6dab35e9ce7154f51b957679f234e3feb9e4) protects the exact open physical source geometry and inboard pose rather than accepting any unrelated eight-instance draw in the scene. No green CI is taken as aesthetic or commercial proof.

## Exact-source acceptance remains open

- **P0 OPEN / NOT EVALUATED:** new post-change full-motion desktop **960×600** and portrait **390×844** recordings with matching immutable SHA, seed and tier have not yet been inspected. Need especially actual source-tick timecode/frames at 12–26 seconds and the authentic grounded guardian/crusher → walkable gateway → floor nine route, plus full outcome/intermission/restart.
- **Before/after visual:** original culprit identified in filmed source; reconstructed inboard crest code exists but its actual raster improvement and any newly exposed obstruction remain **NOT EVALUATED**.
- **Safety:** exact-HEAD repo quality must finish green; successful older source quality is not sufficient. Original `42737729668` ledge failure remains recorded, never rebranded green.
- **Device:** actual-device frame-time p50/p95/p99 and memory, low/high tiers, desktop/portrait interactions **NOT EVALUATED**. JavaScript callback/submission time is NOT device FPS.
- **Independent blind critics:** LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**. No votes, reviewers, clips or outcomes have been manufactured.

**Next biggest action:** inspect fresh source-pinned 60+s guardian WebMs with retained `ActualCapNavigationHalo` ray hits and frame visual continuity. If the open inboard crown remains dominant, correct that observed object rather than guessing another gear; then verify the gateway/ground-contact/floor-nine and outcome/restart film windows. Stay in P0. Preserve `1731b380851162741761c5569e2bc152a0869ca9`; leave PR58/main unchanged, PR68 draft, no merge, deploy or force push.
