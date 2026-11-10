# Tower PR68 P0 — Source-authentic cold-start parity and retained original film
Date: 2026-11-11. Stage: **P0 OPEN**. Verdict: **NOT EVALUATED**.

## Evidence / problem
- Inspected Draft PR #68 at `5110351e604de6068eeb5ac6a6d23bf528c0b063`, frozen comparison `1731b380851162741761c5569e2bc152a0869ca9` and original ten-job source film run [42920000723](https://github.com/my-edutu/Ai_games/actions/runs/42920000723). Latest matching technical CI run [42920000704](https://github.com/my-edutu/Ai_games/actions/runs/42920000704) passed before this change, *not* experience quality.
- All eight original 960×600 / 390×844 source browser recording jobs completed; candidate and baseline normal-speed WebMs were retained. Two original guardian/crusher source campaigns succeeded. The pair audit correctly FAILED: frozen desktop danger first rendered source tick **138**, candidate desktop danger first rendered tick **75**, a real **63 tick = 3.15 second** mismatch against the existing **60 tick / 3 second** limit. Seven of eight pairs had their native compositor clock admitted. **No source-to-pixel complete event match or blind review exists.**
- Actual previous source film inspection identifies the larger artistic defect: candidate portrait guardian at original native video ~18–22 seconds has obstructing bronze/ring/rail and intermittent disconnected two-character framing. Passing a source pairing audit would **not** fix this game quality defect.

## Independent cause review
The existing Playwright config starts `scripts/tower-source-capture-server.cjs` in the global webServer fixture **before browser startup**. This spawns the original game’s legitimate 50ms interval authority and waits while Chromium/context/Three assets warm. Different baseline/candidate cold-load times consume source ticks *before the source can be rendered*, and create a strict initial scene provenance mismatch. Because original fixed-step gameplay itself must not change, neither pausing ticks nor cutting/splicing original footage nor weakening the >60-tick veto is acceptable.

## Substantive evidence architecture correction
At code commit [`9761a45ef398c1cbf88f16fdfe366470b27d4db7`](https://github.com/my-edutu/Ai_games/commit/9761a45ef398c1cbf88f16fdfe366470b27d4db7), the identical neutral harness now starts the unmodified original 20Hz host in the individual capture test **only after native-size 960×600/390×844 Chromium video context and page creation**, for both frozen and candidate source checkouts.
- CI-only flag `TOWER_CAPTURE_LATE_HOST_START=1` disables *only* Playwright’s early global webServer; user preview/browser behavior is unchanged.
- A child-owned launch requires the **new process itself** to announce the bound port and a real `/tower/health` response; pre-existing servers cannot be counted. On startup failure the original process is terminated, and each capture owns its host lifecycle and cleans it up on error.
- First direct original public HTTP tick **and** first fully rendered/browser-observed source tick are separately logged in `motion.json` as `sourceHostStartup`. They reveal cold-load lag; neither replaces or overwrites the existing `startScene` provenance rule.
- Frozen original `scripts/serve-tower-stream.cjs`, the real candidate gameplay, physical collision, AI, physics, clock tick, seed, replay, gateway authority and all original WebM recordings remain unchanged. Source gating remains strict.
- New test coverage exercises refusal outside explicit CI, child-bound readiness rather than stale health, deterministic timeout/cleanup, original script argv and unexpected process exit. Tests and exact-head CI **must still execute**; code review does not constitute a passing run.

## Two-pass review
**Specification:** Correct evidence-only scope; original game host remains source-authentic. Absolute video capture, original full-length clips, event signatures, native WebM SHA+clock binding and >60 tick rejection are untouched. Frozen baseline unchanged.

**Engineering:** The new owned-host startup removes pre-browser host tick drift, but baseline-specific game cold-load may still generate a >60 tick **first-rendered** difference; log it and keep P0 failed if it does. Child readiness is bound to its stdout and HTTP health, not another process. Failures must retain diagnostics and cannot count as successful motion.

## Unverified gates and next action
- [Exact implementation quality run](https://github.com/my-edutu/Ai_games/actions/runs/42925426092) was in progress at initial inspection. No local original Node/Three/Chromium run was possible (coding tunnel unavailable).
- The new source-pinned capture will run at **the exact immutable `github.sha` of the capture-request commit**; it is not a moving branch. Demand 10 successful jobs, eight source-provenance pairs, eight honest 60+ second native-video clock calibrations, and independently inspected 390×844/960×600 full-motion clips.
- Immediately inspect the guardian/crusher, real HP0 victory, *grounded walkable gateway*, floor-nine and terminal/restart with event-neighbor original full footage. A purely green CI audit does not solve the live fighter foreground/orbit problem.
- Actual supported-device p50/p95/p99 and memory: **NOT EVALUATED**. Independent blind randomized reviews: LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5**. Full transformation verdict **NOT EVALUATED**.
- Draft PR #68 remains draft; PR #58 untouched. No merge, deploy, force-push or frozen-baseline movement.
