# Infinite Tower Climb PR68 — live-bolt + imminent crusher physical stage

**Date:** 2026-11-05  
**Branch:** `feat/tower-transformation-gauntlet-20261101`, [draft PR68](https://github.com/my-edutu/Ai_games/pull/68)  
**Frozen original source:** `1731b380851162741761c5569e2bc152a0869ca9` (unchanged)  
**Played source changed in this slice:** `31a42624770f828d5dbf3ccde09cafe3339ec4f7` and `3133f919958f643847671404344835b2a97dc8c7`  
**Behavioral test source:** `082ef451c22213d612605ba5dd377b8b444efaca`

## Experience problem and connected solution

**Moment:** In the actual upper-cap guardian fight a source-owned hostile projectile may still be airborne after the guardian's warning stops. The autonomous climber responds correctly with `evading-projectile`, but an unrelated, *real* nearby guardian-platform crusher can already have only five source ticks before closing.

**Prior presentation:** The 3D source scene hierarchy's urgent physical-shutter observer only recognized the published charge when the AI intent said `evading-hazard`, so authentic simultaneous bolt+crusher danger could fall back to the guardian-only stage or a dimmer trap, and the ratcheting audio had the same intent gate. The new live projectile observer already existed; it was not being used to sustain the last-moment physical pressure.

**Changed real experience:** A present enemy-owned bolt travelling toward the player, height-aligned near a *living* guardian and within the existing source collision corridor, now keeps the published final-six-tick shutter physically salient even when the agent is evading the bolt. Existing 3D hazard stage, guarded camera attention, action fill-light subject, biome/silhouette quieting and opt-in ratchet share one valid observation. The shutter's own current source location, live charge ticks, real player body bounds and current living guardian remain compulsory. With no genuine projectile or shutter, no extra crisis is staged. No extra gameplay HUD is added.

This continues the SAME full real-game transformation—not an isolated gauntlet win. The next milestone is to observe the full cinematic beat and earned continuation with the live playable source, not to count these changes as an experiential round.

## Implementation and invariants

- `public/infinite-tower-climb/visuals/scene-hierarchy.mjs`: requires the already-existing pure `observedNearbyGuardianCrossfire()` and exact `evading-projectile`/oracle intent to admit *only* authentic last-six-tick published crusher charge alongside the previous `evading-hazard` policy. Active crusher classification still works independently of shot presence. No fabricated guardian shooter ID or forecast impact.
- `public/infinite-tower-climb/visuals/audio.mjs`: source-authentic `observedImmediateTrap(snapshot)` replaces independently duplicated body/intent check in the ratchet priority. Source-adjacent charge crossing, bounded voice budget, opt-in sound and mute controls stay as before.
- `tests/phase3/tower-live-bolt-crusher-stage.test.cjs`: contracts for physically simultaneous source hazard/bolt, oracle intent, active collision, future unearned warning, missing/reverse/player-owned/wrong-height projectile, dead guardian, stale run, invalid dimensions, and no mutation of published snapshots.

**Determinism/replay:** Gameplay authority, physics, AI movement, seeded streams, damage, progression, snapshot contracts and replay checksums untouched. Snapshot observations are readonly. **Memory/GPU:** Existing physical props, the same light/camera/ambience, and existing sound oscillator paths; no new mesh, texture, material, shadow, light, renderer submission or timer. New scanning is bounded by the public snapshot lists. Supported hardware p50/p95/p99 and memory are **NOT MEASURED**. **Accessibility:** Danger also has physical visual shutters; sound is supplementary and opt-in, no color-only critical cue. Actual phone-scale continuous legibility not assessed. **Safety/privacy:** No new external events, IO, secrets, identifiers, telemetry destinations or observer-to-authority commands. **Lifecycle:** All cue state is existing scene/audio state and restarts with their established cleanup, browser-context restoration unverified at this source.

## Evidence truth and two-pass review

Specification pass: Frozen original SHA unchanged, proposal/source/real game all refer to Infinite Tower Climb, current PR68 only; no edits to PR58, no force push, no deployment or merge. Real gameplay outcome and quality remain **NOT EVALUATED**. The common source-readership does not authorize a future hit, earned win or a new score.

Quality pass: The biggest issue is **unverified cinematographic clarity**, not tests. The original-host normal-speed full source-candidate/baseline desktop and portrait capture [42048061695](https://github.com/my-edutu/Ai_games/actions/runs/42048061695) completed **all 9 recording jobs**, covering real ascent, danger, moving-deck, outcome, and authentic ledge. But the candidate is **older** `f13b29f8c5af88b639f4a472d0f9124cce3df73e`, and the finished WebMs have **not been inspected by five independent blind full-motion critics**. Baseline danger artifact `13425843169`, candidate danger `13426319473`, desktop+portrait in each ZIP. Original host/provenance being successful does not establish matched *combat events* or a quality win.

The new playable-source normal-speed desktop/portrait [film capture 42055939880](https://github.com/my-edutu/Ai_games/actions/runs/42055939880) was **PENDING** at inspection. New test-head [technical safety 42056054078](https://github.com/my-edutu/Ai_games/actions/runs/42056054078) was **QUEUED**; prior old-head [42048392598](https://github.com/my-edutu/Ai_games/actions/runs/42048392598) succeeded as a safety contract only. Node tests added but not independently run in the unavailable local worker. The preexisting independent critic/browser worker tunnel and supported hardware were inaccessible in this execution; those requirements cannot be replaced by synthetic model shots or CI WebGL draw-call metrics.

**Required to verify:** Event-match original frozen `1731b380...` and current source `3133f919...` real normal-speed, 60s+ continuous ascent, guardian/active crusher and full outcome/restart, quality low, seed `tower-transformation-capture-v1`, viewports desktop 960×600 and native portrait 390×844. Prove actual guardian defeat, physical unlocked bronze door, floor-nine continuation and genuine terminal transition, without manipulating the seed or frozen baseline. Have five genuinely distinct fresh-context randomized blind reviewers inspect complete videos for each of LOOKS, FEELS, PLAYS: require at least four candidate preferences for **each pillar**, no material regression. Obtain supported-device frame-time tails and memory plus accessibility, replay, recovery, CI veto.

**Rollback:** Revert only the two staging/audio source commits and their observer test on PR68 if video proves occlusion, spurious danger or broken browser audio; do not touch the frozen baseline or PR58. Keep this transformation initiative OPEN until quality evidence is complete.

**Verdict: NOT EVALUATED** (LOOKS 0/5, FEELS 0/5, PLAYS 0/5 genuine independent judgments collected). No AAA, FPS, quality PASS or deployment claim.
