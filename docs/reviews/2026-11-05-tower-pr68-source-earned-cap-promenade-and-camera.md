# Infinite Tower Climb PR68 — Source-earned cap promenade and continuous gate camera

**Date:** 2026-11-05  
**Review role:** Builder engineering/specification review, **not** an independent full-motion critic.  
**Frozen reference:** `1731b380851162741761c5569e2bc152a0869ca9` — never reset.  
**PRs:** [Transformation PR #68](https://github.com/my-edutu/Ai_games/pull/68) stays draft; [3D Tower PR #58](https://github.com/my-edutu/Ai_games/pull/58) untouched.

## Real-game problem and source checked

Inspected PR68/PR58 live heads, AGENTS.md, the binding 2026-11-01 transformation specification, `games/infinite-tower-climb/GAUNTLET.md`, `transformation.json`, the actual production `guardian-passage.mjs`, `scene.mjs`, finale and audio presentation, 3D-source acceptance tests, recent GitHub Actions run and the previous source-grounded review. Older normal-speed desktop/portrait recordings show the prior gameplay but **do not show these new source versions**, and cannot be used for quality votes.

Even with an earned gateway and a defeated guardian, the traversal **between the last combat beat and the real cap exit** was weak: the scene presented a distant unlocked bronze door, while the continuous lens increased attention mainly at the last approach. The viewer could miss the payoff across the actual final walking interval. Do not solve this with HUD arrows, synthetic waypoints, a teleport or a camera cut.

## One cohesive playable experience

1. **Physical wayfinding on existing cap:** Place twelve shallow, weathered-bronze metal inlays directly on the real authoritative `f8:cap` surface, along its existing `.38 → .76` span toward the source-earned exit. Project every inlay with the same public cylindrical `pointFor` map and the actual gate anchor; these are noncolliding visual fixtures, **not a newly walkable bridge**.
2. **Visible physically earned progress:** The original inlays become restrained warm-to-pale alloy as the actual source-observed climber moves along the cap. The leading edge softly marks the nearby direction; no arbitrary presentation time, seed RNG, future position, fabricated victory or HUD text advances them. Duplicate/stale ticks cannot visually rewind progress. Incomplete/nonfinite position does not poison the material colors.
3. **One continuous camera escort:** During the genuine observed unlocked-cap stage, real inlay progress now adds a bounded `<=0.34` gateward accompaniment before the last narrow-door arrival, retaining the same lens, actor-safe projection rescue, guardian/hazard priority, normal camera smoothing and overview/reduced-motion conventions.
4. **Correct floor handoff:** Upon genuine source advancement, old cap inlays retire immediately. Fallen armor, severed power connection and physically opened bronze threshold already carry into the established floor-nine transition; no ghost cap appears on the new floor. Restart/dispose clears inlay GPU instance and owned material resources.
5. **Restore the existing technical guardrail:** Previous exact-head [run 42087625640](https://github.com/my-edutu/Ai_games/actions/runs/42087625640) failed **1 of 1,044 tests** at `tests/phase3/tower-guardian-passage.test.cjs:271`: a test sent a `1.1s` animation update but the actual scene clamps each call at `0.5s`. The contract now uses bounded incremental frames rather than weakening or bypassing the real effect-retirement requirement.

## Files and reviewable commits

- `public/infinite-tower-climb/visuals/guardian-passage.mjs` — source-grounded 3D metal promenade, progress, source tick guard, lifecycle and diagnostics: [409be4f3](https://github.com/my-edutu/Ai_games/commit/409be4f3f997cfb27389b388c01065d151756628), [a4e1166f](https://github.com/my-edutu/Ai_games/commit/a4e1166fecd6aa51d05b768f843031157430324b).
- `public/infinite-tower-climb/visuals/scene.mjs` — bounded physical-walk camera lead: [0addd133](https://github.com/my-edutu/Ai_games/commit/0addd133d607c362f87c2e82e6dd10339b40a4a8).
- `tests/phase3/tower-guardian-passage.test.cjs` — source-aligned actual cap-height geometry, no collider, observed walk, stale snapshots, restart and guarded source-derived camera: [53f014cd](https://github.com/my-edutu/Ai_games/commit/53f014cdd36150d5a0693ebbbb10a163727cfc2d), [017c296f](https://github.com/my-edutu/Ai_games/commit/017c296f75bbe61403967766564fd1765e016e24).

**Engineering budget:** One additional twelve-instance, no-shadow standard-metal draw, sharing preexisting box geometry, one new owned material and twelve small per-observation instance-color updates. No extra light, shadow pass, physics shape, route authority, combat HP, AI policy, RNG, replay or network event; **real supported-device frame times and memory remain unmeasured**. No copied reference content.

**Safety/test state at this review:** Changes committed via GitHub's source-checked file API. Full Node/browser replay and native-device tests have **not been executed locally** because the independent workspace/browser connection reports `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`; GitHub Actions [exact-source safety workflow](https://github.com/my-edutu/Ai_games/actions/runs/42096809345) queued at inspection. The [original-host desktop+portrait normal-speed source capture](https://github.com/my-edutu/Ai_games/actions/runs/42096602329) is pending on an earlier code SHA and **does not cover the final inlay guard commit**. Both outputs must be rechecked at final candidate source SHA. A captured candidate is not a blind comparative quality review.

## Separate specification and quality critique

**Specification:** The new wayfinding is purely presentation from genuine source cap and climber coordinates. It neither grants an extra platform nor predicts a winning path. Source tick monotonicity, bounded frame deltas, recovery and reduced motion are preserved. The old guardian-to-floor-nine vertical slice remains open rather than relabeled as an unrelated achievement.

**Quality:** The metal inlays may be occluded in narrow portrait recordings, and the cap color cue could be too subdued under dark tower lighting. The camera lead must be examined against actual high-stakes crushers and live bolts for unintended crop. These are **open observational risks**, not solved by code review. A genuine device performance measurement is required before claiming the extra draw safe.

## Experience gate — STILL NOT EVALUATED

- **LOOKS:** 0/5 genuine independent blind full-motion judgments.
- **FEELS:** 0/5.
- **PLAYS:** 0/5.
- No matched new-source real browser >=60-second full-motion **everyday ascent, guardian/crusher and outcome/restart** A/B across desktop 960×600 and portrait 390×844. Identical seed/tier/viewports alone does not establish matching gameplay events.
- No supported-device p50/p95/p99 frame-time and memory measurements; no fresh-context independent whole-build verdict or completed accessibility/replay/recovery acceptance.
- Current capture jobs remain nonfinal/unassessed. **No AAA parity, frame-rate, device pass, or transformation PASS claim.**

**Next systemic gap:** Run source-identical capture at the final implementation, inspect *the whole normal-speed action* for guardian fall → inlaid cap crossing → bronze gate → floor nine → complete result/restart, compare frozen baseline by actual event anchors, then obtain five truly independent randomized blind critics for each pillar and hardware/robustness evidence. Continue the same PR68 transformation and do not merge, force push or deploy.

**Rollback:** Revert only the PR68 inlay/camera implementation commits if the visual route or camera regresses, leaving original guardian/PR58 code untouched.
