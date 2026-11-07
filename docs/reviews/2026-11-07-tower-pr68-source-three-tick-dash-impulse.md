# Infinite Tower Climb — P0 source-physical dash burst continuation

**2026-11-07 | PR #68 remains DRAFT | leading verdict: NOT EVALUATED**

## Frozen baseline and inspection
- Baseline remains `1731b380851162741761c5569e2bc152a0869ca9`. Inspected root `AGENTS.md`, the approved transformation design, `games/infinite-tower-climb/GAUNTLET.md`, current `transformation.json`, actual authoritative 20Hz physics, existing dash-to-airborne fixture, 3D character flight states, and last review.
- At inspected branch HEAD `badb7d37a53fac7c199a81d7584196fc2cf4328b`, [the latest exact-HEAD quality job](https://github.com/my-edutu/Ai_games/actions/runs/42339696777) was queued. [The current source gameplay workflow](https://github.com/my-edutu/Ai_games/actions/runs/42339547219) for `cf327403` still had **9 queued jobs and zero recorded artifacts**, not verified game evidence. The connected /app-projects development tunnel returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`; this container cannot resolve github.com for git clone.
- Re-inspected historic portrait WebMs on disk (baseline 104.64s, candidate 132.80s, 390×844, 25fps; old source, NOT the PR68 code). At candidate 20s the climber is a tiny actor against over-dominant machinery in floor eight. At 50s the film is back on floor ten, not a continuous same-run cap defeat -> open door -> grounded threshold -> floor nine -> outcome/restart. Neither film proves a current-source improvement.

## Largest newly verified gameplay/feel mismatch
Authoritative `stepTowerPhysics` sets dash horizontal velocity to `dashSpeed` (default 17,000 source-units/step) and emits `state='dashing'` for three 20Hz simulation steps after the previous source-state fix. However **an ordinary AI movement decision on tick two immediately clamps this velocity to the ordinary `maxRunSpeed` (default 9,000)** because the movement branch runs before the next dash handling. Thus the real actor visually shows 150ms of dash while its source body physically receives only one fast step when the AI keeps steering. This is not merely a cosmetic mismatch: the reachable airborne lane, obstacle clearance, movement silhouette and kinetic/camera response are inconsistent.

## Real source implementation
- [Test-first 0f5d65ac](https://github.com/my-edutu/Ai_games/commit/0f5d65ac4cdaadcd35d7c05f29715dd33f6934da) adds original-runtime source tests exercising a steering dash over six ticks against unflagged replay, and cancellation at a real world boundary.
- [Physics implementation 98b31bf2](https://github.com/my-edutu/Ai_games/commit/98b31bf239940ca31f94cce5ce94465d35121987): Only opted-in `guardianArenaHazards && guardianSecondWind` live play keeps the already-earned X momentum and fixed facing for the two additional 20Hz dash ticks. Normal air control returns on tick four. Walls/ground/guardian seal still cancel physical movement; no teleport, velocity boost beyond the existing dashSpeed, new RNG/clock, authored cutscene, invulnerability or free jump. Historical/unflagged physics and frozen SHA remain unchanged.
- No PR58 edits. This deliberately changes actual opt-in horizontal position during a continuing AI steering command, unlike the preceding source-state-only fix; deterministic source replay must be rerun and checked, not assumed.

## Tests and two-pass review
- **Specification review:** the authored dash 150ms impulse and published 150ms animation now use the same source-cooldown window. No changed animation timer or independent renderer input. Frozen default behavior preserved behind both flags.
- **Quality review:** checked-in original-runtime tests are **NOT EXECUTED** because the original checkout and worker are unavailable. An isolated V8 execution of the exact fetched updated steering branch passed six source-step checks (ticks 1–3 retain boosted velocity; tick 4 resumes ordinary air control); an isolated collision-cancel probe retained zero velocity after a wall; the committed CJS test parsed. These isolated branch checks are **not** full physics, collision, game, replay, TypeScript build or experiential proof.
- Main regression risk: 16,000 source units of extra travel on a default three-step live AI dash may overshoot a moving-deck landing or alter duel spacing. Physics world/guardian lock must be exercised under live actions. This cannot be signed off by the isolated branch check.

## Acceptance and exact next action
P0 **OPEN**, transformation **NOT EVALUATED**. Current-source 60+s event-aligned baseline/candidate 960×600 and 390×844 films: **NONE**. Original dual unchanged 3,200-tick campaigns: **NOT EXECUTED**. Independent fresh blind reviewers: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Device p50/p95/p99 and memory: **NOT EVALUATED**.

Next: restore a Node22 + Chromium clone or a GitHub runner; execute the exact-original `node --test tests/phase2/tower-airborne-dash-handoff.test.cjs`, affected physics/replay suites and two authentic guardian/crusher campaigns; film the original full-motion 3-scene matched immutable SHA pairs. In particular inspect dash -> apex -> moving-deck landing, hazard overshoot, cap combat, real defeat, visibly opened physical gate, grounded crossing, floor nine, outcome and restart. Reopen the largest demonstrated gameplay/camera problem; do not advance to P1 from a test count.

No merge, deploy, force-push, baseline move, PR58 rewrite or draft-status change.
