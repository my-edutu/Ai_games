# Infinite Tower Climb — source-grounded takeoff to safe landing corridor (PR #68)

**Date:** 2026-11-02. **Frozen baseline:** `1731b380851162741761c5569e2bc152a0869ca9`. **Playable implementation:** [a8e4c0e](https://github.com/my-edutu/Ai_games/commit/a8e4c0e2044cf11274155933c15a2af32f870cc3) (parent gameplay commit `b63256a`). **Gauntlet verdict: NOT EVALUATED.** The same ascent → guardian → real outcome/restart transformation remains open.

## Actual experience problem and cohesive gameplay change

The existing pilot had begun braking in midair, but still sprinted at an already selected takeoff point with no regard for its lateral speed. In flight it steered toward the *middle* of a platform even while physically above a valid landing lane, wasting its limited deceleration window. That can look like uncontrolled overshoots, especially on narrow phones and moving decks. These are causal play-control defects, not missing CSS polish.

The LIVE tactical AI now (1) calculates a grounded takeoff profile from its current support, selected observed target and actual horizontal velocity, (2) uses the stronger EXISTING ground friction when decelerating, (3) takes a genuinely legal supported jump when the next ordinary step would walk over the deck's safe edge, and (4) brakes over the current platform's clearance-safe **landing corridor**, not a decorative midpoint. Both phases use current observation and unchanged fixed-step physics; no future platform motion or success is inferred. The historical-v1 route controller remains exactly as before, protecting prior replay policy provenance.

A real new `settling-launch` source intent is carried into the existing sparse depth-tested world-space route markers and opt-in route audio. The **same skinned 3D climber** crouches and counterbalances its torso, head, arms and knees when actually braking before takeoff; airborne `settling-landing` retains its existing counterbalance. No new HUD clutter, scene lights, meshes, draw calls, collision layers, secret information, network dependence or invented source events. Injury, attack, stale-stream and reduced-motion safeguards retain priority.

## Checks performed — safety, never experience quality

- Seven actual source/test files changed or added; the correction at a8e4c0e uses the authoritative player half-width, not an absent observation field.
- New deterministic decision tests exercise grounded braking vs historical-v1 takeoff, calm launch, near-launch deceleration, edge-jump fallback and immutable observations. Air tests now cover no needless midpoint chase and out-of-lane reacquisition. New rig tests inspect the original articulated knees/body/helmet, reduced motion, stale state, attack and injury.
- [Exact game implementation CI 41539002447](https://github.com/my-edutu/Ai_games/actions/runs/41539002447) completed **success**: build, transformation verdict contract, repository logic, Tower authority and browser progress-page checks. Earlier provisional b63256a build failed before the half-width fix; it is not counted as a passing run.
- No local full-motion renderer or independent critic was available: the shared browser/worker tunnel returned NOT_FOUND (client unseen for 300 seconds). The new [source-pinned real-game capture](https://github.com/my-edutu/Ai_games/actions/runs/41539002427) was pending. Existing [older-source capture 41529987284](https://github.com/my-edutu/Ai_games/actions/runs/41529987284) completed but was produced from gameplay source `798a1ce`, not this candidate.

## Independent specification and experience critique

**Specification pass:** Actions remain genuine game input, authority is untouched, current public deck bounds and current physics velocity determine decisions, and historical-v1 is unchanged. The base SHA stays frozen. No approval, merge, deployment or upstream PR #58 edits.

**Quality pass not possible:** This implementation may correct avoidable overshoot but could conversely delay launch too much, shorten horizontal jumps, or over-brace in portrait footage. We have **no matched, normal-speed ≥60s source-event-aligned before/after clips reviewed for the new SHA** across everyday ascent, moving danger/guardian and visible result/intermission/restart. We have **0/5 independent blind judgments in each of LOOKS, FEELS and PLAYS**, not five imagined votes. No supported-phone/desktop GPU p50/p95/p99 frame-time, memory, full replay/restoration or screen-reader audit. No claimed higher floor-clearance, mobile smoothness, AAA or quality PASS.

**Next same-slice decision:** Review new native desktop and portrait recordings aligned to floor/tick/platform state; measure genuine launch/land/fall and guardian-cycle behavior on multiple seeds. If a source-backed short-jump, stall or visual counterbalance defect appears, repair the *whole* takeoff → flight → landing system and re-record. Then obtain five fresh, randomized blind critics on actual full motion and hardware accessibility/performance evidence. Keep this PR draft, preserve PR #58 concurrent work and do not force-push, merge or deploy.

**Rollback:** Revert the gameplay implementation commits only on PR #68 if source-authentic clip/replay regressions demand it; retain frozen reference and evidence ledger.
