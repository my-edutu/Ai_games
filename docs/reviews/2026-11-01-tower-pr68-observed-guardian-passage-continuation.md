# Infinite Tower Climb — source-witnessed guardian release passage, same transformation PR68

**Date:** 2026-11-01. **Draft:** [PR #68](https://github.com/my-edutu/Ai_games/pull/68), based on the still-open 3D [PR #58](https://github.com/my-edutu/Ai_games/pull/58). **Frozen baseline:** `1731b380851162741761c5569e2bc152a0869ca9`. **Status:** NOT EVALUATED.

## Experience defect and cohesive response

A genuine guardian's health gradually separates the original bronze seal in the previous 3D build, but the authority often advances to the next floor **on the same fixed tick as the lethal hit**. The old cap is rebuilt out of the view immediately, so the physically earned release is hard or impossible to see in normal-speed gameplay. This continuation completes that same *encounter → release → ascent* presentation slice, rather than treating the earlier door, AI, camera or sound as separate accepted rounds.

The live scene now detects a **same-run, running-to-running, strictly tick-increasing, adjacent-floor source transition from an actually observed active guardian**. On that event alone, a short original 3D passage appears *inside* the new floor's non-walkable tower core, while the real climber continues using unchanged authoritative collision, autonomous policy and fixed-step timing. Tall structural piers, a lintel, independently splitting bronze leaves, a physical crest and restrained opening/wake geometry give a readable spatial response. The follow camera briefly accommodates the real source-triggered passage without additional HUD text; the existing opt-in defeat/release chord in `visuals/audio.mjs` already recognizes the same real adjacent-floor transition.

The passage is a **presentation-only memory**, not a collider, teleporter, guessed win or new gameplay route. It lasts at most 2.9 seconds of non-stale renderer time; reduced motion shows fully open stable leaves instead of movement. It has finite shared geometries, no shadows, no audio device activation, no network work and explicit disposal on restart, context loss/rebuild and teardown. The observer never changes public snapshots or replay authority. If the critical source frames were missed, it will not invent a celebration.

## Source and safety ledger (not a quality score)

- Added `public/infinite-tower-climb/visuals/guardian-passage.mjs` for exact authoritative two-snapshot gating and bounded original geometry/pose.
- Connected actual live rendering, camera framing, source transitions, lifecycle recovery and diagnostics in `public/infinite-tower-climb/visuals/scene.mjs`.
- Added `tests/phase3/tower-guardian-passage.test.cjs` covering truthful activation, false-source rejection, split-door geometry, reduced motion, stale transport, cleanup and live-scene integration. These tests **cannot establish subjective quality or hardware FPS**.
- Prior full safety run at [41338390049](https://github.com/my-edutu/Ai_games/actions/runs/41338390049) passed on `7970b80` **before this implementation**. New head run [41342933572](https://github.com/my-edutu/Ai_games/actions/runs/41342933572) started after source changes; its final result must be inspected before calling it passed.
- The [new genuine six-scenario video workflow 41342863466](https://github.com/my-edutu/Ai_games/actions/runs/41342863466) is source-pinned to implementation `2182612677a6a27c98f6244ebc069cd042438e0c`, including normal-speed desktop and portrait coverage; it was pending at this review. It is **not** independent quality review.
- Previous [source-pinned capture 41338137780](https://github.com/my-edutu/Ai_games/actions/runs/41338137780) completed five of six recording-integrity jobs. Both frozen-baseline outcome layouts still failed to show the entire authentic result→intermission→restart sequence. Keeping the frozen baseline unchanged is mandatory: do not synthesize the one-tick result or mislabel a run-token change as visible outcome footage.
- The local coding/browser/worker tunnel responded `NOT_FOUND` this execution; no independent browser observation, fresh-context critic fan-out, native hardware or frame-time measurements were available here. The new source still needs review in real video.

## Current acceptance

**NOT EVALUATED:** no new candidate clips have been visually inspected, no complete paired baseline terminal/restart, independent LOOKS/FEELS/PLAYS votes remain **0/5 each**, supported-device p50/p95/p99 and memory are missing, and CI for the final implementation must be verified. No AAA, sustained FPS or Gauntlet transformation victory is claimed.

**Biggest remaining gap:** confirm that the source-witnessed release is genuinely observed and spatially legible during real uninterrupted guardian combat and actual adjacent-floor advancement in both desktop and portrait captures; test whether its short display, camera framing and added transparent geometry introduce motion/visibility or low-tier tail regressions. If no recorded guardian floor transition occurs in the matched danger seed, report that fact rather than counting a mocked scene. Baseline terminal-frame visibility and independent randomized blind review remain separate blockers.

**Safety/branch posture:** PR58 untouched; PR68 is draft and open. No force push, merge or deployment. Preserve the transformation and the historical baseline across further runs.
