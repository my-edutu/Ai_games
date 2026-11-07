# Tower PR68 — P0 native real-time source-story capture (2026-11-07)

**Active stage:** P0 evidence + game-loop truth, OPEN. **Leading transformation verdict: NOT EVALUATED.**
**Existing draft:** https://github.com/my-edutu/Ai_games/pull/68 — `feat/tower-transformation-gauntlet-20261101` on PR58. **Frozen baseline preserved:** `1731b380851162741761c5569e2bc152a0869ca9`.

## Most important inspected full-motion problem (HISTORICAL footage ONLY)
Original native 390×844 portrait **danger** WebMs from GitHub run https://github.com/my-edutu/Ai_games/actions/runs/42104896643 were inspected at normal-speed sampled timestamps. Baseline file duration is **104.64 seconds** and historical candidate **132.80 seconds**, despite the Playwright test formerly scheduling just 68 seconds of sequential `waitForTimeout` calls followed by diagnostics/screenshot work. Actual footage at candidate t=5s shows floor **10**, t=20s shows floor **8** with a small distant climber, and t=50s floor **10**. Thus an apparently long, native-resolution clip is not an event-matched full upper-cap guardian defeat → earned physical doorway → floor-nine story. The previous two-episode capture audit now correctly flags absent story. This is **not** footage of the present candidate and does not prove the current gameplay is bad or fixed.

## Meaningful P0 capture unblocker implemented
Commit [`21f973b6`](https://github.com/my-edutu/Ai_games/commit/21f973b63720062e9a4cd9571d94b9d27ae82e8f) updates the neutral baseline/candidate Playwright recorder, an original-source-only capture-window helper, a test fixture, the nine-job workflow and offline harness (five files). It does **not** change gameplay authority, AI, renderer, freeze SHA, source server or host.

1. **Absolute wall-clock observation pacing:** screenshots and renderer diagnostics no longer add a new one-second wait after every expensive sample; missed observation slots are skipped rather than densely replayed. Unedited source WebM remains native and real-time.
2. **Evidence-driven bounded continuous scene:** every recording runs at least **68 real seconds**. If the correct same-episode source milestones are absent, continue filming *that same live host*, never splice another run or fake a floor. Bounds are ascent 84s, moving 90s, danger 180s, outcome 120s. A missing scene at cap remains explicitly **NOT EVALUATED** and fails the browser evidence test **after saving the original WebM**, rather than falsely reporting a valid scenario.
3. **Baseline safety:** both sources receive the SAME neutral capture observer. Workflow copies only helper/observer/test files into the frozen source checkout; game and source host SHA remain original. Offline harness mirrors this. Source-event alignment is search evidence only, not a verified WebM timecode or blind vote.

**Checks executed:** The standalone capture-window fixture passed 4/4 local Node 22 cases. The exact committed helper was fetched back from GitHub and evaluated with 11/11 in-memory V8 policy, wiring and PR-draft checks; the browser source passed JS parse validation. **Not executed:** original repository Node22 suite, actual dual 3,200-tick game campaign, Chromium full-motion recording, mobile/desktop game, or real-device benchmarks: connected development tunnel returned `Tunnel-client has not been seen for 300 seconds`. The new [nine-job capture](https://github.com/my-edutu/Ai_games/actions/runs/42319036457) and [quality checks](https://github.com/my-edutu/Ai_games/actions/runs/42319036455) are queued as of initial inspection, not passing.

**Independent reviewers:** genuine LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**. Hardware p50/p95/p99 and memory **NOT EVALUATED**. No claim of meaningful experiential improvement is made for capture-harness work.

## Next systemic action
Recover runnable source-host Node22/Chromium or functioning GitHub Actions runners; execute exact-head gameplay tests and **two unchanged 3,200-step guardian/crusher campaigns**, plus the paired 960×600 and 390×844 baseline/current recordings. Verify all source scenes and *watch the original full-motion footage* for a single physical guardian defeat → opened door → grounded trailing-edge threshold → floor-nine continuation → outcome/restart. Fix the largest observed gameplay/camera/actor-clarity issue rather than adding more speculative micro-patches. Independent blind LOOKS/FEELS/PLAYS and physical-device performance are separate P6 gates.

No PR58 changes, no other games, no merge, deploy, force-push, refreeze or draft-status change.
