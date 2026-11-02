# Infinite Tower Climb PR #68 — source-observed air-landing control and physical body response

**Date:** 2026-11-02. **Implementation:** [af6525d](https://github.com/my-edutu/Ai_games/commit/af6525d1f95cfc9ee67af2272fed2c5c9feafc74). **Frozen reference:** `1731b380851162741761c5569e2bc152a0869ca9`. **Experience gate:** **NOT EVALUATED**.

## Systemic problem / vertical slice

Real tactical air-control previously kept steering toward the selected platform midpoint without accounting for the climber's current lateral momentum. That can overshoot a narrow/oscillating deck and leave a skinned climber's visual jump unrelated to its actual braking decision. Continue the **same whole-game ascent → danger/guardian → outcome** transformation; this is one connected gameplay, rig and spectator-observability increment, not a successful standalone Gauntlet round.

## Implemented in actual game

- `games/infinite-tower-climb/src/ai/policy.ts`: the LIVE tactical controller now computes a bounded desired horizontal speed from the *present* observed deck center and player velocity, braking with ordinary accepted movement input as it approaches. No new physics, collision, oracle trajectory, remote model or randomness. Historical-v1's original `moveSign` strategy remains unchanged for existing replay provenance. Far travel still retains the source-authentic dash rule.
- The immutable public intent distinguishes a **real deceleration** as `settling-landing`. `scene.mjs`, `route-intent.mjs` and `audio.mjs` keep the very same source-selected landing marker, route reconciliation and audio choice available during that phase; no fake target, extra HUD copy or draw.
- `characters.mjs` uses the real intent and lateral momentum to pose the *existing skinned* torso, helmet, arm and leg bones. This is a brief counterbalance without duplicate models, extra rendering resources or player-root movement. Combat, gripping, damage, stale snapshots and reduced-motion preferences outrank it.
- New `tests/phase2/tower-air-landing-steering.test.cjs` and `tests/phase3/tower-air-brake-pose.test.cjs` check current-deck feedback, braking, baseline-v1 protection, moving support, deterministic repeated observation, original skinned bones and veto priority.

## Two-pass review / risks

**Spec:** The presentation is snapshot-bound; accepted tactical input remains under the real fixed-step authority. The baseline is untouched. No user-visible claim of transformation success. Historic tactical action-stream outcomes are deliberately not asserted identical—new controller alters present LIVE choices, so exact-source replay, reachability and restart regression must be checked.

**Experience/engineering:** Largest unresolved risk is *whole-game route success*. Brake timing might produce short landings for unusual platform widths/air control or weak acceleration, or result in too much counter-lean on mobile. Need source-event-matched original normal-speed desktop and portrait video over everyday ascent, changing moving decks, actual guardian danger and complete result/restart. Existing 41521981388 captured all nine jobs for old source f2b14ad; it is NOT evidence for this new controller. The subsequent source clip workflow 41529987284 was pending at inspection. Previous completed exact-head technical gate e907265 passed at 41522294129; current source af6525d quality gate 41530079910 pending. CI is a veto, not an experience score.

**Independence:** Browser/critic worker tool returned NOT_FOUND (tunnel offline for more than 300s). No blind randomized critics have examined the new real full-motion evidence, so LOOKS / FEELS / PLAYS stay **0/5**. No supported-hardware p50/p95/p99 or memory, real-device accessibility, long-run or replay restoration certification.

**Privacy/security:** No network dependencies, viewer input or personal data; all observed values are existing public, immutable state. Existing rate limits/stream recovery unchanged.

**Rollback:** Revert the air steering/pose commits on the draft transformation branch only, without rebasing or editing concurrent PR #58. Do not merge or deploy. Continue the same transformation; next work must review actual clip pairs and correct any short-landing regressions before quality judgment.
