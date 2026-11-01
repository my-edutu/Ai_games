# Infinite Tower — authentic terminal and restart experience (2026-11-01)

**Active review:** [draft PR #68](https://github.com/my-edutu/Ai_games/pull/68). **Immutable baseline:** `1731b380851162741761c5569e2bc152a0869ca9`. **Whole-game quality: NOT EVALUATED.** This is a continuation of the single original expedition transformation, not a new Gauntlet pass.

## Biggest experience defect addressed

Real source-pinned 60+ second candidate/baseline browser sessions previously contained 3–6 authentic run token changes but **neither visible result nor intermission** appeared consistently in sampled output. In the default live runtime, `result` lasted one authoritative tick (50ms), shorter than actual heavy WebGL frame submissions. A large 3D finale cannot matter if the actual ending exists for only 50ms. See [failed authentic outcome jobs](https://github.com/my-edutu/Ai_games/actions/runs/41320129399) and the [prior source-pinned full-motion self-review](2026-11-01-tower-pr68-source-pinned-motion-self-review.md).

## Cohesive real-game change

- **PLAYS / complete cycle:** an **opt-in source-authoritative terminal hold** freezes the *actual* ended state for 48 fixed steps (2.4 seconds at the normal 20Hz stream clock) before the original 36-tick intermission and genuine new-run token. No camera, graphics script or capture harness decides when death occurs. The result stays sourced from `makeTowerTerminal`, and normal restarts are unchanged. A preview/capture mode chooses longer 100-tick terminal and intermission windows only to make low-fidelity CI compositor capture observable. It never accelerates simulation.
- **LOOKS / result readability:** the real terminal now produces an original, bounded, four-draw-object, 3D memorial wave: a fallen incomplete crown, fractured route shards and twelve extinguishing column segments. The actual `result.kind` and `reason` choose restrained distinct colors and deformation; falling or health depletion is **never depicted as victory**. The objects are depth-tested at the actual actor position, without fictional landings, collision, premium assets or additional HUD prose.
- **FEELS / closure:** distinct opt-in synthesized game-loss, technical-interruption and operator-stop tones accompany the real result. A muted viewer hears nothing. A verified changed run token after an actual terminal phase receives a light new-expedition cue. Effects/graphics are bounded and clean up on run rollover and GL recreation.

Historical/default configs **omit** `resultHoldTicks`; the default old one-step result transition and serialized public replay fingerprint are intentionally unchanged. New tests assert exact source continuity during hold, true intermission/restart, bounded config, source-only rendered loss variants, reduced motion, cleanup and disposal.

## Evidence and safety, not invented quality

At implementation time no independent blind 5-person LOOKS/FEELS/PLAYS panel, no hardware frame-time p50/p95/p99 or memory benchmark, and no verified six matched normal-speed desktop+portrait clips for the updated source existed. The previous CI software-render tail intervals remain an **unresolved performance concern**, not a supported-device FPS measurement. The local agent/browser tunnel was unavailable (NOT_FOUND); the attached source-level checks need the new CI run for executable validation. Genuine critics must inspect entire actual motion, including a *visible* terminal and restart, rather than this source code.

**Next:** inspect new source-pinned CI gameplay artifact/video and verify terminal→intermission→restart in both viewports and each actual baseline/candidate scenario; preserve quality NOT EVALUATED until whole-game independent 4/5-per-pillar votes, no regressions and real-device performance/replay/accessibility evidence. Do not merge/deploy/force-push.
