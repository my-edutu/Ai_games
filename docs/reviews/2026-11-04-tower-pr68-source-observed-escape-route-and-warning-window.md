# Infinite Tower Climb — real-world hazard anticipation and deck escape (2026-11-04)

**PR:** [open draft #68](https://github.com/my-edutu/Ai_games/pull/68), same transformation initiative; PR58 kept separate.
**Frozen BEFORE:** `1731b380851162741761c5569e2bc152a0869ca9` — never modified.
**Candidate gameplay implementation:** `8c1b5bd715a99d288c2ff824d3dab26b050ddea6` (source fix `ca785ee7`; source-backed functionality `bdb9e8a7`; tests `56675d91` and `8c1b5bd7`).
**Quality status:** **NOT EVALUATED**. No blind full-motion vote, no comparative improvement claim.

## Biggest actionable deficiency in the connected gameplay slice

The new 3D pressure shutters genuinely communicated a 12-tick scheduled hazard charge, but the autonomous climber ignored its first four ticks and then walked away from the hazard midpoint rather than testing whether a full-body exit could actually be reached on the supporting deck. A centered wide trap could leave the climber still overlapping in the final 3 ticks, with its real evasive jump appearing too late. A trap against a deck edge could invite an obviously wrong retreat.

This continuation connects **the existing 3D shutter warning, fixed-step public AI observation, real deck geometry and ordinary physical evasion** into one encounter. No new UI prose, fake hazard, collider, health modifier, forced outcome or camera prophecy.

1. **Anticipation:** the live tactical agent reacts to the full published 12-tick warning that is already visible in-world, not an invented future hazard. Prior projectile, active trap and hostile windup priorities remain unchanged. The historical-v1 observation and replay path still never receive the opt-in warning.
2. **Grounded decision:** a current supported climber evaluates the two body-width-clear exit positions using its **current** physical deck edges, velocity, movement acceleration and speed cap. It favors an achievable on-deck exit, keeps movement within the existing `guardedEvasion` edge constraint, uses deterministic tie-breaking and leaves authority untouched. This is bounded (12 simulated scalar steps per exit, no RNG, no game-state writes).
3. **No fabricated safe route:** if neither real exit is reachable before the currently published activation, the climber can attempt an ordinary physical jump in the last six 20Hz ticks **while its actual body overlaps** the trap. A viable observed exit retains grounded movement; the final three ticks still permit ordinary jumping if the climber remains trapped. Airborne climbers are excluded from this grounded reflex and continue using the existing safe-landing air controller.

## Verification and regression risks

The source-behavior test now checks reaction on first visible countdown, deterministic tie-breaking, real rightward momentum, edge safety, historical policy separation, genuine descending landing and a truly full-width platform trap with no fictional ground exit. This is **engineering coverage, not a transformed-game score**.

The first exact-source CI after implementation failed strict TypeScript arithmetic for an invalid boolean subtraction, correctly identified and fixed at `ca785ee7`. The test's initial assumption that a rightward 9000-unit/tick climber could not clear 32k units in six ticks was incorrect; the fixture was corrected to demand a grounded right escape rather than a premature jump at `8c1b5bd7`. Full latest exact-source CI and real-game video remain pending; no result is claimed before they complete.

**Spec review:** the proposal respects current public 20Hz observations, current generated platform support, fixed-step action contracts and legacy replay separation. It cannot grant success; a jump is only an input to existing authoritative physics. The opposing projectile/guardian/hazard priorities and no-future-oracle constraint remain in force.

**Critical live-play risks requiring video:** 12-tick early response may become excessively cautious on crowded floors; selecting a deck exit from current position can dither if source geometry moves; an emergency jump may hit overhead hazards or shorten the next route. On portrait, the true charge and the corresponding climber move must both remain visible. If the unedited film reveals poorer movement rhythm or avoidable deaths, change or revert the behavioral policy, not the frozen baseline. Test from *actual source trace*, not curated model poses.

**Performance/accessibility:** constant-size arithmetic; no new render object, network, shader, asset, telemetry or HUD; existing lower-tier and reduced-motion hazard visuals/opt-in audio remain. Source-level bounded CPU work is not real target-phone frame-time/memory evidence.

## Still open for this same transformation

Acquire/inspect source-pinned NORMAL-SPEED >=60s baseline and candidate clips of ascent, hazard/guardian and a genuine terminal/intermission/restart in desktop 960×600 **and portrait 390×844**, matching seed, graphics tier and importantly **gameplay events**, not just timestamps. The neutral baseline outcome browser contract had a pointer-events hit-test false negative; corrected capture [41794292287](https://github.com/my-edutu/Ai_games/actions/runs/41794292287) still failed baseline desktop outcome because its two DOM-visible results did **not** establish two same-run painted result observations followed by restart. This is not evidence that the authentic result never appeared. Do not weaken the witness or alter the frozen source to force a green outcome.

Obtain five independent fresh-context, blind randomized video critics for each of LOOKS, FEELS and PLAYS (4/5 candidate wins **in each**), and supported-device p50/p95/p99 presented-frame tails, memory, replay, accessibility and robustness. The separate browser/worker tunnel returned `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`; do not invent votes. **Current votes: 0/5 in every pillar; assessor NOT EVALUATED.** Technical CI may veto but never establish a quality PASS. Continue SAME initiative on the next run without merging/deploying/force-pushing.
