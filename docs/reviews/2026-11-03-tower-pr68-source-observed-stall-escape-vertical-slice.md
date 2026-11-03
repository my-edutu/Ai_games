# Infinite Tower Climb — purposeful source-observed escape during a stalled expedition

**Date:** 2026-11-03. **Initiative:** SAME open PR68 whole-game transformation (ascent → guardian → real result/restart). **Frozen baseline:** 1731b380851162741761c5569e2bc152a0869ca9. **Experience gate:** NOT EVALUATED, 0/5 blind LOOKS, FEELS, PLAYS.

## Observed systemic defect addressed in code
The existing height-stall fallback alternated left and right **on consecutive 20Hz authority ticks**, overriding the tactical launch and air-brake controls even when a generated, connected platform was immediately available. This can make a stalled climber shiver at the edge while the camera/3D route stones lose their selected destination. A successful next jump must use the *actual observed graph* and physical controller, never a decorative target.

## Connected playable change
- Tactical live policy now uses existing same-source connected route selection, supported-deck launch steering, air braking, hazard-clear lanes, earned recovery jump and bounded boost in the stall branch. No new physics force, AI oracle, RNG, score, client authority, hidden platform or engine.
- If the current observation has no real graph edge or airborne destination, it **does not invent a jump, dash or waypoint**. Fixed-step stagnation and recovery continue to own the outcome. Historical tactical:false v1 remains unchanged to protect pinned old replay.
- The real world-space 3D intent stones and follow camera now track only these specifically named, source-backed rescue decisions, including the same body-clear landing lane when active hazards block a deck midpoint. Existing marker draw is reused, marked warm amber; stale, combat, unknown target, no-route and terminal states retire it.
- Existing opt-in local synthesizer can identify the resulting genuine target replan; no autoplay, text HUD, extra network call or extra mesh batch.

## Engineering and quality posture
Focused source state/replay-compatibility tests and real Three.js world-marker/camera regressions accompany the change. **Running the checks is not the transformation outcome.** Independent browser/worker workspace currently reports `Tunnel-client has not been seen for 300 seconds`; this branch source cannot yet be independently viewed at full normal speed. GitHub Actions on older source 4c8c7ddd: [real gameplay run 41636620319](https://github.com/my-edutu/Ai_games/actions/runs/41636620319) completed **9/9** scoped capture jobs, and [quality contract 41636620488](https://github.com/my-edutu/Ai_games/actions/runs/41636620488) completed as a **technical safety** result. Their clips predate this rescue, are not event-matched blindly judged A/B and are not supported-device performance.

**Next same initiative:** run exact-new-source desktop and native portrait 60s normal-speed ascent, guardian and real terminal/restart, source-event align to the unchanged baseline, audit live rescue, collision and visible guardian against the real capture, obtain five independent randomized full-motion opinions on each quality pillar and native device frame tails/memory and accessibility/replay/recovery checks. If the rescue causes new falls, revert this focused source/visual coupling in PR68; don't alter PR58 or baseline. No merge/deploy, no quality score inferred.
