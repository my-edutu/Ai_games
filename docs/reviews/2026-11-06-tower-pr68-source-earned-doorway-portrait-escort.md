# Infinite Tower Climb — physically earned doorway portrait continuity (2026-11-06)

**Stage:** P0 remains OPEN. **Playable implementation:** [8620d9150776f9d4a84161620aa9a4dedabae40f](https://github.com/my-edutu/Ai_games/commit/8620d9150776f9d4a84161620aa9a4dedabae40f); based on still-open PR58. **Frozen baseline (unchanged):** `1731b380851162741761c5569e2bc152a0869ca9`. **Transformation verdict:** **NOT EVALUATED**. LOOKS 0/5, FEELS 0/5, PLAYS 0/5 genuinely independent full-motion critics.

## Largest observed systemic defect
Historical authentic source-pinned portrait danger frames showed the living guardian within the crop in only 5/13 relevant observations, the original exterior gate in 0/13. Later source additions created a **physical inner-deck walkable doorway** after an actually defeated guardian; however its appearance and the climber's **walk across it** still lacked inspected current-source full-motion proof. The actual renderer protected hero/guardian/landing from foreground clocks but **did not protect the doorway after guardian defeat**. This is a grounded suspect, not an observed verdict on today's changed head.

## Connected real-game fix (not a mockup or a gameplay shortcut)
- `public/infinite-tower-climb/visuals/scene.mjs` keeps the **same 3D camera** on the authentic source-earned guardian threshold during the living, grounded floor-eight approach. A bounded post-combat gaze proposal is accepted **only if** the real gateway's projected crop improves while the entire skinned climber and both solid-core sightlines remain safe. Invalid or weak proposals roll back, reduced-motion keeps established camera, guardian/landing/hazard retain higher priorities.
- `public/infinite-tower-climb/visuals/world.mjs` was **not rewritten**. Its existing low-cost decorative clockwork/gear sightline protection now receives the source-earned gateway as its third target after selected landing and imminent physical hazard; no new geometry, shader, draw, collider or authoritative platform.
- `visuals/guardian-gateway-framing.mjs` is a pure deterministic projected-body/door framing veto; `tests/phase3/tower-earned-gateway-frame.test.cjs` checks crop gain, invalid/behind-camera source, actor-bounds/core-blocking veto and anti-oscillation.
- The unchanged normal-speed neutral recorder adds `observedEarnedGatewayFrame` from actual renderer diagnostics, separately from live boss lock. It **does not certify that bronze raster pixels were visible or that body crossed the threshold**. The nine-job source-pinned recorder workflow now includes focused safety tests.

This is a meaningful connected camera/world/capture correction on the **existing original 3D game**. The physics, seed, AI route, guardian HP/damage, crusher, threshold collision, floor progression, restart, HUD and PR58 baseline are untouched.

## Validation and blockers
- **Completed:** isolated pure Node 22 acceptance run 4/4; exact GitHub multi-file fast-forward push to SAME draft PR68 branch; known frozen baseline constant preserved.
- **NOT performed:** exact-source full repo build/Node+browser integration, new 60+s full-motion WebM review or event-matched baseline/candidate clip assembly. The live workspace/browser tunnel was disconnected (`NOT_FOUND: Tunnel-client has not been seen for 300 seconds`).
- [Source-head integrity workflow](https://github.com/my-edutu/Ai_games/actions/runs/42139392027): pending. [9-job original-host desktop/portrait WebM workflow](https://github.com/my-edutu/Ai_games/actions/runs/42139392049): pending and footage not inspected. Historical [source 8fd complete 9/9 capture](https://github.com/my-edutu/Ai_games/actions/runs/42104896643) does not cover the new code.
- **Hardware:** real device p50/p95/p99 and memory NOT MEASURED. **Blind independent critics:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5. CI green or a pure helper test is never experience acceptance.

## Precise next P0 action
Obtain **native unedited normal-speed** exact-new-code desktop 960×600 + portrait 390×844 films, inspect guardian HP→collapse, actual 3D threshold and the skinned climber **crossing** it, same-run transition to floor nine, moving deck and authentic outcome/restart. Audit whether full-body/gateway simultaneous crop truly improves and no foreground clocks conceal the reward. Align 60+s continuous state-matched episodes to frozen baseline; repair largest **film-observed** defect before evaluating with five independent randomized fresh-context critics per LOOKS, FEELS and PLAYS and actual supported-device performance.

**Operational controls:** same open draft PR68, unchanged PR58 edits and frozen baseline, no force-push/merge/deploy/quality fabrication. Rollback is ordinary non-force revert of source change after evidence of regression.
