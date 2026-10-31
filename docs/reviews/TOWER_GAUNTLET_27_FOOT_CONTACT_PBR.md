# Infinite Tower Climb — Gauntlet 27: weight, contact and material finish
Date: 2026-10-31
Status: DRAFT, **AAA visual bar NOT PASSED**. This record belongs to a child branch of draft PR #58.

## Quality bar
Use directly inspected in-game **Returnal: Ascension — Tower of Sisyphus** captures for scene lighting, environments, animation, materials and cinematic coherence; **Uncharted 4** for physical traversal contact and **Ghostrunner 2** for movement clarity. Comparison must use real game footage with equivalent field of view and subject scale, with independent blind votes. Borrow design principles, not copyrighted assets.

## Original, measurable changes
- Climber and enemies now use bounded planted-foot stance and lifted-foot swing, via a pure two-link solver based on actual articulated limb pivot offsets. The gameplay root is unchanged.
- Footfalls are emitted only after the cosmetic solver observes the swing-to-stance edge. Scene emits at most three dust motes per event at the corresponding foot, respects reduced-motion and low-quality policies.
- The expedition climber and guardian gain locally authored, reproducible 128x128 albedo/normal/roughness wear patterns. The three maps reuse UVs across materials and dispose with their owning actor. Distant ordinary enemies avoid the new shader maps.
- No changes to simulation authority, physics, collision bounds, player strength, AI, random streams, progression, audience influence, replay or payment logic.
- Minimal gameplay HUD and separate /tower/gauntlet evidence page are preserved; no extra copy overlays.

## RED -> GREEN / exact-source evidence
- Before implementation, the standalone foot-placement contract failed all four tests because the math module was absent. After implementation the same four passed locally.
- Parsed both exact branch source files (characters.mjs and scene.mjs) in V8 without syntax errors.
- Extracted the exact committed pure function and evaluated 120 cycle poses: 150 planted leg observations, 46 raised swing observations; maximum ankle Y/Z error < 3e-16.
- Rebuilt the actual committed deterministic material generator in a constrained DataTexture stub: three 128x128 4-channel textures (196,608 bytes), sampled bytes identical across instances, each resource disposed exactly once.
- Four actual skinned-rig tests and three PBR material resource tests were added to the repository. Their results on the exact GitHub branch are **pending GitHub Actions**, and must not be described as passing until run.

## Critical open gates
1. Run Node 22/Three tests and all existing Tower tests on exact branch; run complete repo suite, TypeScript build, and tower stream self-test. Confirm no contract breaks.
2. Capture legitimate moving authority frames and GPU screenshots before/after with identical seed, camera, scale and quality. The previous still images cannot demonstrate continuous gait.
3. Check 128x128 maps in actual WebGL and on low-tier devices; measure GPU frame p50/p95/p99, shader timings, draw calls, texture count, CPU and memory under crowd/guardian stress, not only host-render submissions.
4. Get actual separate critics to judge matched Returnal/Uncharted/Ghostrunner stills/video blindly; **no independent critic or ultracode was available here**.
5. Verify accessible HUD, low-motion, WebGL context reset, pause/restore, OBS low-bitrate legibility, long soak, canary, security and operations gates. Never call this R5 or production ready before external evidence.

## Safe integration
Review this child feature branch against the advancing `codex/infinite-tower-climb-3d-gauntlet` branch, rather than force-pushing on top of shared work. Rollback: revert the child PR; all changes are presentation-only. Preserve the parent branch's work and audit trail.

## Next critic task
Inspect a 390×844 viewport at the floor-8 guardian encounter and normal-speed climbing footage. Biggest anticipated remaining gap is authored character/environment fidelity, especially silhouette scale, detailed skin/cloth/metal surfaces and sustained performance. Do not record a visual win without side-by-side real captures and an independent verdict.
