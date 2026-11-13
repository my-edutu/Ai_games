# Infinite Tower PR68 — P0 first-episode native video phase and clock repair (13 November 2026)

**Stage: P0 EVIDENCE + GAME-LOOP TRUTH OPEN. Leading assessor verdict: NOT EVALUATED.** Source-frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9`; no baseline movement, PR58 edits, promotion of draft PR68, deployment, merge or force-push.

## Exact source and genuine 1× original film evidence

At inspection, PR68's immutable source head was `1f0fd40ca011a2665b244f6fb6d6b8026bc188f2`. Its [nine-job source-pinned capture 43377023425](https://github.com/my-edutu/Ai_games/actions/runs/43377023425) ended **FAILED**: the nine-job workflow recorded all eight original baseline/candidate 60s+ ascent, moving-deck, guardian-danger and outcome scenario WebMs, but final source-to-native comparison remained **0/2**. The failed pairing remains an acceptance veto; completed recordings are not review wins. The original candidate danger ZIP is [artifact 14014613773](https://github.com/my-edutu/Ai_games/actions/runs/43377023425/artifacts/14014613773). It contains unmodified desktop 960×600 and portrait 390×844 WebMs with immutable source and sidecar hashes; desktop film ~72.2 seconds, portrait ~73.36 seconds.

I inspected full-source sidecars and actual native WebM frames surrounding the **first** Floor8→9 guardian victory (22–31 seconds), not a later restart episode. In both, source tick **451** genuinely crosses the threshold. The original bronze roof/gateway and moving full-body character enter a visibly different violet next-floor shot without a demonstrably continuous through-the-same-door full-body physical action. P0 remains failed; a GPU-retained old gateway and an 8→9 HUD glyph alone cannot make that scene a convincing playable handoff.

## Highest-impact verified new blocker: first native video episode mis-selected in portrait

The prior `native-scene-phase.json` sidecar for the **same original portrait WebM** reported the apparent first 8→9 HUD change at **66.75 seconds** and chromatic cool scene at **67.75 seconds**, while calibrated immutable **episode 0** source already crossed at **23.869 seconds**. It produced a spurious **42.881 second** source-to-drawn-HUD interval. Both 66.75/67.75 are actually **episode 1 after restart** (source event at 65.722 seconds). This created an invalid first-episode clock comparison and concealed what the original first crossing looked like.

Direct original 4fps native pixel inspection established the actual **first** portrait HUD 8→9 at **25.25 seconds** and sustained violet appearance near **26.50 seconds**. At **22.25 seconds**, one isolated 9-shaped white connected component occurs amid a genuine 8 run. The previous classifier vetoed every first-episode event when any 9 was seen in the preceding twelve glyphs; hence it erroneously matched the next run at 66.75. For the palette, the physical bronze/violet overlap produces intermediate purple fractions ~0.13–0.14 over several sampled frames before a sustained >0.22 cool scene; requiring all immediately preceding three seconds to be warm favored the **later** full-cool episode. Both observations are from the *original*, hash-bound WebM and do not fabricate frames, source events, or hardware metrics.

For desktop, the real **first** HUD changes at **24.75 seconds**, violet scene at **25.50 seconds** and the episode-0 source event appears at **23.198 seconds**. These remain materially asynchronous. With the repaired first-episode selector, portrait source-to-native HUD is approximately **1.38 seconds** rather than the false **42.881 seconds**. Desktop remains approximately **1.55 seconds**. These are 4fps drawn-HUD/source-event diagnostics, **not** measured GPU performance or proof of true body contact.

## Cohesive source-authentic harness repair in this run

- `scripts/tower-native-hud-floor.cjs`: tolerate **one isolated** stray 9-shaped glyph during an otherwise sustained 8 episode, reject multiple or persistent earlier 9 samples, and require four consecutive genuine 9 glyphs after first transition. This selects the correct original first episode without relaxing source, hash, native clock or final acceptance checks.
- `scripts/tower-native-scene-phase.cjs`: find a sustained first cool segment after an actual prior three-second warm environment with a **bounded up-to-two-second intermediate chroma bridge**. This avoids misidentifying episode 1 when the first physical floor transition is naturally blended, while still marking chroma as NOT physical floor/crossing proof.
- `tests/phase3/tower-native-hud-floor.test.cjs` and `tests/phase3/tower-native-scene-phase.test.cjs`: reproduce the first-episode vs second-run ambiguity, an isolated bogus 9, invalid double 9, gradual warm/mixed/cool progression, and non-sustained violet noise.

Verification has two distinct layers: exact original pixel observations and regression contracts are grounded as above; **the changed code's own exact-head CI and recaptured artifact are not yet proven green**. Do not treat this harness repair as a playable-quality win. No gameplay authority, character, collision, guardian, input, camera, physics or source clock was changed.

## Source CI and remaining vetoes

The original [exact-source quality run 43377023381](https://github.com/my-edutu/Ai_games/actions/runs/43377023381) **FAILED**: integrity and most catalogue partitions passed, but one Tower Phase 3 worker received a runner shutdown while executing `tower-retained-source-cap-world.test.cjs`; the unrelated Maze Phase 6 test timed out. Do not rewrite unrelated game files or count shutdown as passing. The new code must be checked under its **own exact SHA**.

**Primary remaining viewer-experience defect:** even with first-episode native clocks diagnosed correctly, both videos still lack a satisfying continuous full-body body-through-original-bronze-door transition. Next production work must address common real geometry, occlusion, moving hero/camera and world material staging, not adjust arbitrary timers or stage advancement. Additional P0 blockers are native timing calibration of frozen baseline outcome, complete outcome/restart source+pixel alignment, full original 1× event-matched films in both viewports and remaining exact-head CI. Only after real physical P0 quality is verified should P1 begin.

Independent randomized fresh-context human critics: **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Actual supported-device p50/p95/p99 and memory **NOT EVALUATED**. Overall transformation: **NOT EVALUATED**.
