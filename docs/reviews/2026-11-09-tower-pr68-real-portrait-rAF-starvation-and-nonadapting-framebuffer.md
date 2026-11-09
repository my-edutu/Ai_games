# PR68 P0 — Original phone film proves framebuffer controller never engaged

2026-11-09. Draft PR68 only. **P0 OPEN — NOT EVALUATED**. Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` remains unchanged.

## Evidence inspected
- Latest original source-pinned nine-job run: https://github.com/my-edutu/Ai_games/actions/runs/42667914556, candidate `b489786c25a28c6887902821fa7dd61807b11d5c`, guardian candidate artifact https://github.com/my-edutu/Ai_games/actions/runs/42667914556/artifacts/13696879288, frozen baseline portrait danger https://github.com/my-edutu/Ai_games/actions/runs/42667914556/artifacts/13696049891 .
- Downloaded **actual original unmodified WebM** and source-paired observation/event evidence for candidate/baseline portrait danger. Inspected sampled video frames at 4/10/12/14/16/18/20/22–26/28/32/40/55 seconds. A large wheel/case continues to dominate guardian action at 14–18s. These sampled frames do NOT replace full continuous-motion acceptance or blind reviewers.
- Candidate original `motion.json` has 68 portrait render-resolution observations, **all `scale:1` and `adaptations:0`**, despite JS callback/submission gaps **p50=298.1ms, p95=924.9ms, p99=1969ms** (198 samples). Individual scene-call durations are generally 10–30ms. Baseline original gaps p50=426.7ms, p95=1368.2ms, p99=2303.7ms. These are software Chromium submission/callback intervals, **not actual-device FPS**.
- 8/8 native video/source clocks calibrated for searching; candidate source floor8→9 tick451 estimated at native 22.23s but sampled image first displays 9 around 26s. This is not an established causal display-delay measurement. No genuine event-to-pixel match or independent grading yet.

## Substantive connected fix
Commit `59fd238e9bd0bc04b23bf857d5fc8f012466a2cf` changes **the actual original Three.js scene** (not a diagnostic-only test):
- Count persistent visible rAF callback starvation as well as expensive scene-call duration. Three consecutive >=120ms callbacks now permit bounded emergency 3D framebuffer downscaling when scene calls themselves are short. Preserve fast-call legacy threshold, 78% phone/60% desktop floor, original quality tier and CSS-resolution HUD.
- Ignore single 2400ms+ interrupted browser frames; clear pacing on hidden/stale visibility and context loss; require 90 consecutive truly healthy callbacks to restore resolution. Expose `callbackGapMs` with an explicit non-FPS label.
- Extend original `tests/phase3/tower-adaptive-resolution.test.cjs` with pure policy and actual mocked WebGL/RAF scene-path tests, avoiding fabricated GPU behavior.

Isolated extracted JavaScript source-policy probe **PASSED** (eight repeated visible 298ms rAF gaps produce phone scale .78, 2700ms pauses do not). The original Node22/Three suite and new source-pinned WebM at new HEAD **have not yet run or been verified**. Code and isolated probe do not establish improved visual motion or hardware performance.

## Highest-impact next action
Verify exact-head CI and original new 9-job baseline/candidate WebM in both 960x600 and 390x844, source-align genuine gateway/floor-nine/outcome/restart, check new adaptive source diagnostics and native actor clarity. Fix camera/world wheel occlusion if still present. Obtain supported-device p50/p95/p99 and memory, and five genuinely independent blind critics for each LOOKS/FEELS/PLAYS pillar; **0/5 in every pillar currently**. No acceptance promotion; no merge/deploy/force push/draft conversion.
