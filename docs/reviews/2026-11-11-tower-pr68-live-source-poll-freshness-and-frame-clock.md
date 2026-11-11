# Infinite Tower Climb PR68 — P0 browser freshness and authoritative floor handoff (2026-11-11)

**Stage:** P0 EVIDENCE + GAME-LOOP TRUTH OPEN. **Lead assessor:** NOT EVALUATED.
**Frozen source:** `1731b380851162741761c5569e2bc152a0869ca9`. **PR68:** draft, never merge/deploy/force-push or rewrite PR58.

## Exact prior evidence and largest blocked gameplay truth

Original capture [43091649344](https://github.com/my-edutu/Ai_games/actions/runs/43091649344) pinned candidate `8693c29705275504f8230e7a24c16406af75add0` and the immutable frozen baseline. All eight original baseline/candidate 60+ second source-pinned browser film jobs and the authentic ledge job completed. The final event-relative film comparison FAILED, **0/2 strict event-to-video viewport matches**, despite all 8/8 original source narratives and native WebM transport integrity. A copy of the ungraded full-motion original films remains available from the job artifacts. Exact-source [quality](https://github.com/my-edutu/Ai_games/actions/runs/43091649631) passed, which is not a game-experience score.

Prior original portrait frames ~16–24s show the actual guardian and climber physically separated, or behind bronze gallery supports; a previously sampled native source Floor9 search timestamp preceded the actual painted HUD/violet world switch by ~1.97–2.06 seconds in the prior candidate and by >2 seconds in some other runs. This DOES NOT by itself prove GPU lag: host source, browser-accepted state, completed WebGL call and native composited frame are distinct clocks. No video event or physical threshold contact is fabricated.

## One connected implementation — reduce actual host-to-browser staleness and isolate the lag

- `public/infinite-tower-climb/visuals/live-state-cadence.mjs` and `app.js`: replace the extra fixed 100ms delay **after** each successful fetch/scene update with a monotonic 100ms START-to-START target. One HTTP request at a time remains mandatory, yielding at least 16ms after an overrun. For example, a 150ms response previously had at least 250ms between request starts, and now has a bounded **166ms target** absent unrelated scheduling stalls. The real host remains fixed-step 20Hz. On failures, retain existing 400ms×failures / 3000ms backoff, abort, pagehide and recovery behaviour. This is an actual live game's source freshness change, not a video-time adjustment, simulated tick, screenshot, or fixture.
- `render-progress.mjs` and `scene.mjs`: record browser acceptance and **returned** original Three.js renderer submissions only on actual run/floor/lifecycle transitions, keyed to their authoritative ticks, with a bounded 64-entry ring. This permits identifying whether a Floor8→9 delay comes before accepting the source or after a completed render. It is NOT presented GPU frame proof.
- Original `tower-live-motion.spec.cjs` capture exports those read-only browser transition witnesses to `motion.json` **before the authentic video ends**. Frozen baseline does not implement these diagnostics and is explicitly marked NOT EVALUATED rather than edited. All eight native WebMs remain unmodified.
- Focused Node contract `tests/phase3/tower-browser-source-delivery.test.cjs` checks no overlapping/pile-up poll schedule, unchanged failure backoff, monotonic accepted→submitted evidence, source token/floor changes and bounded ring resources. Exact-source CI is a veto, not a LOOKS/FEELS/PLAYS result.

## Strict acceptance, next action

Compare the next actual candidate source→browser-accepted→renderer-return timeline to source HTTP timestamps and native HUD/chroma timestamps for BOTH 960×600 and 390×844, same seed/tier, >=60s original 1× films. Identify whether the roughly two-second disagreement is transport, main-thread update, WebGL submission or later compositing; fix the dominant REAL lag and re-inspect continuous guardian/crusher collision and the **walked** gateway into Floor9, outcome/intermission/restart. Do not widen event-sync tolerances or call returned renderer frames on-screen.

Implementation code SHA before evidence edits: `6139cbb473e5bf39777f60136cf4ec10caaa2f82`.
Technical quality [43097979632](https://github.com/my-edutu/Ai_games/actions/runs/43097979632) was queued at review authoring; no successful claim. New exact-source original filming is required after an explicit capture-request commit.

**Independent reviewer counts:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5. Supported physical device p50/p95/p99 and memory: NOT EVALUATED. Stage stays P0 OPEN.
