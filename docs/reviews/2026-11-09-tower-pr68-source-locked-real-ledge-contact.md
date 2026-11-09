# Infinite Tower PR68 — source-locked real ledge contact
2026-11-09 · P0 EVIDENCE + GAME-LOOP TRUTH — OPEN

## Evidence examined before changing code
- Current PR68 game source and draft PR reviewed at `82fb02dc7afe12598627a58b7cad0e4399018640`; frozen baseline remains `1731b380851162741761c5569e2bc152a0869ca9`.
- The complete 9-job recording run [42606453096](https://github.com/my-edutu/Ai_games/actions/runs/42606453096) successfully recorded **eight** original-host baseline/candidate desktop/portrait 60+ second films, including [candidate danger artifact 13668102830](https://github.com/my-edutu/Ai_games/actions/runs/42606453096/artifacts/13668102830). The event-pair audit reported **8/8 source stories present**, no integrity defects, but **NOT EVALUATED** for experience quality. Encoding and source events do not prove perceived motion or physical-device performance.
- Authentic ledge job from this SAME run failed desktop sequence at source tick **131** (1/4 Playwright checks failed). The 960×600 screenshot and `sequence-desktop/sequence.json` report source airborne contact with rendered root radius **27.6056584261** and **helmetClearanceWorld -0.43**, visibly intersecting the opaque deck. The identical source tick in 390×844 portrait rendered root radius **28.0412** and positive helmet clearance **0.158**. The failure is a **real frame-cadence-dependent presentation intersection**, not a harmless obsolete test. [Actual diagnostic artifact 13668367198](https://github.com/my-edutu/Ai_games/actions/runs/42606453096/artifacts/13668367198).
- Native candidate portrait danger footage at game SHA 82fb02dc still shows the near-side 3D wheel/rack masking or competing with the climber/guardian around video **16–18s** (observed still sampling at 14/16/17/18/19/20s; not accepted uninterrupted motion review). This remains the largest separate visual readability defect.

## Implementation — ONE source-bound P0 ledge-plane integrity fix
- [1b841eba](https://github.com/my-edutu/Ai_games/commit/1b841eba80e40f739222a5f1a530f2089fb4b83d): `scene.mjs` locks the real 3D climber pose to the *actual snapshot-selected* target at two solid-boundary moments: the genuine intended-deck fingertip grip and the authoritative player's boot/sole height crossing the real deck. It preserves damped pose follow for ordinary ascent, run, landings without an observed ledge boundary, falls and combat. World geometry, collision, replay, autonomous AI, guardian rules, exit and progression are untouched.
- [afaf4df3](https://github.com/my-edutu/Ai_games/commit/afaf4df36c94b958ca62d5a4c6a100811c28ef41): the original GPU/Playwright ledge transition now requires genuine source deck fingertip contact **and positive world-space skinned helmet clearance**, in addition to the existing radial/projection checks, in both viewports.
- This is a physically observable 3D presentation correction, **not** a verified visual-quality or motion acceptance. The source rule is deterministic per authoritative snapshot; it does not create any fake contact or mutate authority.

## Separate specification and quality review
**Specification:** PASS at source-contract level only. Frozen baseline unmodified; snapshot, intended deck, real state and boot height gate the presentation adjustment. No default branch, PR58, branch merge or deployment involved.

**Quality:** BLOCKED / NOT EVALUATED. Direct presentation snap at the contact/sole boundary may be noticeable at 20Hz or under browser cadence jitter. Need observe consecutive actual WebGL frames and normal-speed camera motion after the code change rather than argue from numeric invariants. New code has no exact-current-head Node/Three.js or Playwright success yet. Recovered old film cannot validate it.

**Safety/UX:** Does not modify gameplay, HP, damage, projectiles, input controls, replay seed/version, sound, HUD, reduced motion, privacy, persistence or asset budgets. Existing interpolation remains otherwise. Real device p50/p95/p99, memory, mobile hand controls and screen reader testing still NOT EVALUATED.

## Gate state
- P0 **OPEN**.
- Original SHA 82fb02dc: eight video capture jobs succeeded; event pairing succeeded; original authentic ledge job failed 1/4. 3/4 passing stills tests are not an acceptance pass.
- New implementation SHA 1b841eba and test SHA afaf4df3: original-node/full-browser suite **NOT EVALUATED** until exact-SHA CI/film returns. No newer clip exists as of this review.
- Blind reviews LOOKS 0/5, FEELS 0/5, PLAYS 0/5. Verdict **NOT EVALUATED**.
- The frozen baseline SHA remains `1731b380851162741761c5569e2bc152a0869ca9`.

## Exact next action
Run the updated original source-bound ledge desktop+portrait job and full Node/Three suite. Inspect tick 129–139 actual skinned helmet, ankles, and root screen position against source timing, with normal-speed contact/mantle footage; if the newly source-locked pose looks like a snap, stage a source-derived pre-contact transition without allowing deck penetration. Re-capture matched 960×600 and 390×844 60+s baseline/candidate, inspect full 16–20s guardian clockwork obstruction, verify same-run earned guardian/crusher victory → grounded gateway → floor nine → outcome/restart and then rebuild the worst demonstrated systemic visibility defect. No pillar or commercial-quality claim before independent blind and actual-device checks.

## Exact-source CI follow-up

- [Quality run 42609745176](https://github.com/my-edutu/Ai_games/actions/runs/42609745176) at implementation SHA `1b841eba` executed the original Node22 suite and failed **one** file: `tests/phase3/tower-ground-contact.test.cjs` searched for the retired four-argument helper declaration and call; 1269/1270 completed tests passed. Do not count this as green.
- [176ce622](https://github.com/my-edutu/Ai_games/commit/176ce622173537d7ad9535db7c91b20bd59e0823) repairs that source-shape assertion to the new five-argument contract, supplies `.copy()` in its pure vector fixture, and exercises *both* source-triggered boundary locking across three browser blends and ordinary non-contact airborne interpolation.
- [Quality run 42610553152](https://github.com/my-edutu/Ai_games/actions/runs/42610553152), exact test SHA `176ce622`, was **PENDING/unassigned at first inspection**. Any eventual pass remains a veto-only engineering result, not source-bound motion evidence.
