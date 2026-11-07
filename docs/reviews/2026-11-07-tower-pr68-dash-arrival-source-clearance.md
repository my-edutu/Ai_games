# Infinite Tower Climb — P0 source-real three-tick dash arrival clearance

**2026-11-07 | Draft PR #68 | P0 OPEN | Transformation: NOT EVALUATED**

## Evidence inspected and protected scope
- Exact branch head before the change: `dc13dfb78e483bec1fbb534664087492a480d2c2`; frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9` (unchanged).
- Read root AGENTS.md, approved transformation design, Tower GAUNTLET.md, transformation.json, 20Hz physics, generated platform motion, current tactical AI, original-runtime air-landing/boost tests and recent prior dash review.
- Historical candidate portrait film (not current source): distant undersized climber, intermittent floor changes and no continuous guardian defeat -> real crossing -> floor-nine -> outcome/restart.
- Last inspected source-pinned run [42343111746](https://github.com/my-edutu/Ai_games/actions/runs/42343111746): nine jobs `queued`, no runners assigned (`runner_id=0`), **zero artifacts**. This does not prove successful game behavior. Linked development workspace is disconnected (tunnel client NOT_FOUND after 300 seconds); no original TypeScript/Chromium checkout is available here.

## Largest newly confirmed source-level risk
Previous PR68 physics change [98b31bf](https://github.com/my-edutu/Ai_games/commit/98b31bf239940ca31f94cce5ce94465d35121987) turns the source-authentic dash into **three actual 17k-unit 20Hz movement steps**, not one. Yet `observedSafeAirBoost` selected the dash from a model of **ordinary 9k run-speed reach**, never testing whether that committed impulse plus mandatory braking would overrun the observed hazard-free landing pocket. The actual platform/guardian physics remains authoritative; this is an AI commitment/survival gap, not a demonstrated video overshoot.

## Implemented coherent movement decision
- [6566e76b](https://github.com/my-edutu/Ai_games/commit/6566e76b260cf90f7451c80d861ca4507e870f09) test-first source scenarios covering three-tick clearance, both directions, short flight and original autonomous movement.
- [8f478b82](https://github.com/my-edutu/Ai_games/commit/8f478b82856858546ee2e57c062aed437c5d01c4) new pure deterministic `games/infinite-tower-climb/src/ai/dash-arrival.ts` calculates **minimum unavoidable x travel** under actual three-tick physical dash and subsequent maximum countersteering. It forbids an impulse that physically crosses a present clear lane's far edge before feet reach that deck. No randomness, extra state/tick, teleport or renderer-made landing.
- [68d48b5a](https://github.com/my-edutu/Ai_games/commit/68d48b5ad10a94d6dc1e65a33ddf20b518c41ea7) integrates contact tick estimation and hazard/enemy-clear lane screening into **only the fully opted-in live guardian tactical pilot**, preserving the original historical/unflagged policy. The existing AI still takes a real long-lane dash where the minimum braking path fits; no new physical abilities.
- [bf67328a](https://github.com/my-edutu/Ai_games/commit/bf67328a9e49e1518ec84d6151efb393f0e07d4b) additionally tests the actual runtime action -> physics loop in a narrow blocked-deck case and a feasible long-distance crossing.

## Validation, two-pass self-review, remaining limits
- Local Node 22 executed **7/7 isolated pure dash-envelope scenarios** copied from the exact helper algorithm; these validate arithmetic decisions but **not** original checked-out game tests. Full compiled-source Node tests, deterministic replay and the unchanged pair of 3,200-tick playthroughs: **NOT EXECUTED**. Exact-source video for this new head: **NONE**.
- Specification review: opt-in-only, source-observed current platform/hazard/enemy clearance; preserves immutable baseline and PR58. No predicted moving-platform trajectory or future hazard/enemy state, no changed combat/guardian/gateway outcome rules.
- Quality review: the checker is intentionally conservative, so it may suppress a viable but risky dash even when the real moving deck would later drift into reach. Actual scene and policy acceptance cannot be inferred without original tests/normal-speed footage. No p50/p95/p99, memory or true-phone test.
- Independent critics: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**; no blind acceptance or material improvement claim.

## Next highest-impact stage action
**Remain P0.** On an available Node22+Chromium checkout: run `node --test tests/phase2/tower-live-dash-safe-arrival.test.cjs tests/phase2/tower-air-survival-corridor.test.cjs tests/phase2/tower-airborne-dash-handoff.test.cjs` after compiling the repo, replay and 3,200-tick dual source campaigns, then exact source-pinned normal-speed 960×600 and 390×844 matches from frozen baseline and PR68 head. Inspect moving-deck landing after 150ms dash, guardian/crusher victory, real gateway opening, grounded whole-body crossing, floor nine, outcome and restart. Fix the **largest current-source film defect**, potentially conservative boost suppression or tiny hero framing. Only after credible films and hardware safety, seek genuine independent randomized 5-person reviews for each pillar. Do not advance stages on committed code/test counts.

No edits to PR58, other games, frozen baseline, merge, deployment, branch rewrite or PR draft status.
