# Infinite Tower Climb — real simultaneous danger as a coherent 3D pressure chamber (2026-11-04)

**Scope:** Existing [draft PR #68](https://github.com/my-edutu/Ai_games/pull/68), branch `feat/tower-transformation-gauntlet-20261101`; no merger of PR58 or other games. Frozen source **`1731b380851162741761c5569e2bc152a0869ca9`** unchanged.

**Source implementation:** [`8e1466188f9cec03e3f44c570702650065e81d9c`](https://github.com/my-edutu/Ai_games/commit/8e1466188f9cec03e3f44c570702650065e81d9c); integration test-fixture compatibility [`cc28c894117aa991f91a157bb48d035d00c00f55`](https://github.com/my-edutu/Ai_games/commit/cc28c894117aa991f91a157bb48d035d00c00f55). This is an internal engineering continuation of ONE complete-game transformation, **not** a Gauntlet quality PASS.

## Real gameplay problem and connected change

The previously implemented fixed-step agent can choose a physical deck exit around two simultaneously armed shutters, yet the 3D world and camera could still depict only the nearest trap. A portrait viewer could mistake a real evasive decision for random motion because the second source-observed threat was absent from the shot. Large tower materials already compete with gameplay readability in sampled real portrait footage.

This continuation makes the **whole warning → physical anticipation → autonomous reaction** a shared visual sequence:
- Each genuine published 1–12 fixed-tick warning now drives one **16-piece real 3D chamber**, not just eight suspended teeth: the same opposed jaws move with the schedule, four substantial ground-pressure rails define the area, and four counterweight pylons make the machinery read as one connected object. No extra collision or synthetic hazard. The existing optional source-entry sound and actual climber defensive animation continue to respond to the same current decision.
- At a genuine grounded `evading-hazard` choice with **two nearby simultaneously scheduled/active hazards**, the source-validated camera composer can consider both as one bounded subject. If only one is observed, or events are stale, terminal, airborne, remote, unsupported, or too widely separated, no pairing is invented. Actual combat/guardian/landing composition still has priority.
- The prior camera used only ticks 1–8 of a published 12-tick warning; it can now observe the complete real warning period when the pilot is taking action. Early anticipation does not manufacture a future activation or change the AI clock.

## Source/safety review

Affected: `public/infinite-tower-climb/visuals/hazard-pressure.mjs`, `public/infinite-tower-climb/visuals/scene.mjs`, `tests/phase3/tower-authentic-hazard-pressure.test.cjs`. Existing `createTowerHazardPressure` still owns clearing, disposal, graphics restoration and source-bounded diagnostics. All new steel uses its **same single depth-tested instanced draw**, 96 maximum normal, 48 low-tier instances; no new shader, shadows, lights, texture, network, UI words, random seed, fixed-step logic, or replay mutation. Reduced motion uses static physically legible warning posture. VM composition fixtures that deliberately remove ES module imports need an undefined-helper guard; the shipped browser import is always present. Tests explicitly check both-source pairing, replay-pure observation, quality caps, stale/result/airborne rejection and idempotent matrices.

**Technical status:** Previous `aeb2441` safety run [41804207184](https://github.com/my-edutu/Ai_games/actions/runs/41804207184) succeeded, **not** certification of this changed source. Latest candidate [41808748405](https://github.com/my-edutu/Ai_games/actions/runs/41808748405) and real gameplay film [41808748747](https://github.com/my-edutu/Ai_games/actions/runs/41808748747) were pending at review. If tests/actual film expose an error, fix before another experience assessment.

## Authentic evidence and the blocking gap

The **older** source-bound [41803900209](https://github.com/my-edutu/Ai_games/actions/runs/41803900209) captured 9/9 successful source-play jobs (baseline and previous candidate, desktop and portrait), but those clips **precede this code** and are not sufficiently event-aligned for blinded preference scoring. The new chamber and grouping have **not** been inspected in newly captured 60+ second unedited footage. In particular, check that two simultaneous trap bodies are visible with the real climber and do not diminish mobile silhouette, and that result/intermission/restart is authentic for baseline and candidate.

**Quality status: NOT EVALUATED.** There are **0 of five genuine independent blind votes** in each of LOOKS, FEELS and PLAYS; no fresh-context critics or target-device p50/p95/p99 and memory evidence was available. Scene code and CI cannot self-certify a better game. No AAA/production/FPS claims. Next step remains matched source SHA, seed, quality and viewport, three >=60s event-aligned gameplay pairs in desktop and portrait, five independent blind full-motion critics (>=4/5 each pillar), and safety/performance/accessibility/replay gates. Leave draft open; do not merge/deploy/force-push.

## Connected sonic material — same vertical slice

A follow-up actual-game source commit [`8f61ef18e16f7216b893be42bcd4f94569ffcc3b`](https://github.com/my-edutu/Ai_games/commit/8f61ef18e16f7216b893be42bcd4f94569ffcc3b) adds a restrained opt-in metal ratchet in the final four **published** ticks of a genuinely nearby trap charge. It uses an adjacent prior source snapshot to prove crossing, so it cannot invent an advance warning, repeat from an identical packet, or play an unrelated first-frame alarm. The original start-of-warning and actual hazard-activation cues remain. This is the *same* live AI + physical shutters + camera + audio encounter, not a second isolated Gauntlet milestone.

Technical validation at exact source [41809316108](https://github.com/my-edutu/Ai_games/actions/runs/41809316108) and normal-speed desktop/phone capture [41809316245](https://github.com/my-edutu/Ai_games/actions/runs/41809316245) were PENDING at final code inspection. None of the required five fresh blind full-motion critics has scored this build. Supported-device frame-time/memory and accessible independent viewing remain missing. **Experience status stays NOT EVALUATED.**
