# Tower PR68 — source-owned single GPU drawing-buffer epoch at the genuine Floor 8→9 crossing

**Stage: P0 EVIDENCE + GAME-LOOP TRUTH OPEN. Leading transformation verdict: NOT EVALUATED.**
2026-11-14. Original inspected head `d206c688594a0e4ef96a38dd5aaca113ca9a177e`. Frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` unchanged. PR68 remains OPEN DRAFT on active PR58; no force push, deploy, merge or other game code changed.

## Rejected original full-motion evidence (immutable)

- [Nine-job authentic candidate/baseline recording 43577249882](https://github.com/my-edutu/Ai_games/actions/runs/43577249882), pinned to candidate `6d51e838cc0a8efedcf891de6d148573cd5de5d6`, baseline exact frozen SHA, low tier, 960×600 desktop and 390×844 portrait. Eight original films recorded at 25fps and paired **8/8** real source timelines; strict native crossing remains **0/2**, and pair-source-events failed. These clips predate THIS code change.
- Downloaded real danger candidate artifact [14106927497](https://github.com/my-edutu/Ai_games/actions/runs/43577249882/artifacts/14106927497); inspected unedited native film at 23.5–30 seconds in both viewports. Desktop: original bronze/Clockwork at 24.75–25s, sudden violet Floor9 HUD/ground ~25.0–25.25s, old doorway does NOT visually follow the actual full-body passage. Portrait: comparable abrupt replacement. Bronze triangles surviving behind a violet first frame are not a convincing threshold.
- Original guardian reaches health zero at source tick **441**, physically earned Floor9 progression at tick **451** (first episode); source events are real, but no native-pixel evidence proves an uninterrupted walk through the same arch.
- Original visual source audit recorded old gateway and hero both projected safely on the *first returned* Floor9 frame, but 0/2 native film acceptance. Original gallery after source clipping ~291 triangles; a projected 3D coordinate is not visible pixels.
- Desktop first F9 observation reported ~**608.9 ms** for a real WebGL `renderer.render()` CPU return and **160.3 ms** CPU world rebuild; portrait first returned sample ~**114.6 ms**. Native video source→first F9 drawn HUD lag was ~1.9s desktop and ~1.5s portrait. These are browser/software-renderer observations, **not measured GPU completion, real supported-device FPS or p95/p99**.
- [Prior exact-code CI 43577249933](https://github.com/my-edutu/Ai_games/actions/runs/43577249933) 9/10 successful; unrelated Phase6 Maze job timeout (124). This remains an honest technical veto, not a quality grade. Never touch that other game.

## One systemic production blocker and repair

The previous *already source-bound* first-floor-nine rendering policy applied scales **0.72 → 0.82 → 0.90 → 0.96 → 1.0**, one ratio per successful submission. That repeatedly resized the WebGL drawing buffer precisely during cold shaders/scene upload and original gateway retention. Resizing can reallocate canvas GPU targets and stall the next frame; the first F9 frame is already expensive. This is a plausible, falsifiable **rendering-continuity** blocker, not proof that it caused the native hard cut.

- **Test-first red commit:** [b852da79](https://github.com/my-edutu/Ai_games/commit/b852da79a75295beab7764eb2cd1dd0a64eb6ad7) adds five focused checks: one reduced allocation until restore; cheap-return early recovery; no false readiness from unknown timings; run/mode/stale safety; renderer-wiring and snapshot immutability.
- **Production policy:** [7b5b3eee](https://github.com/my-edutu/Ai_games/commit/7b5b3eee056f60a4c83dde8535ecb47f4d984e2e) retains one low-tier source-authenticated 0.72 drawing buffer for minimum 4, maximum 8 **actually returned** F9 WebGL frames. It restores to 1.0 only after 2 consecutive measured WebGL returns ≤180ms once minimum frames elapsed, or the eighth returned frame as a finite backstop. No 0.82/0.90/0.96 intermediate allocations, no fabricated source event, extra renderer, floor/actor interpolation, collision or AI change.
- **Renderer integration:** [c6a6c295](https://github.com/my-edutu/Ai_games/commit/c6a6c295954e82b41061e928e658d7fcf1f3c40c) passes the existing `rendererReturnedAt-sceneReadyAt` observation to the cold framebuffer controller only **after** the real renderer returns. Unknown/nonfinite costs do not qualify as fast; source-run, quality, spectator, stale, reduced-motion, reset/context-loss constraints remain.

This deliberately changes rendering cadence and bounded low-res period, **not gameplay authority**. Each earned crossing has at most two quality-scale transitions (start and restore). Frame return CPU measurement is only a heuristic; actual GPU latency, any introduced soft image/blur and played motion remain unverified.

## Required P0 acceptance after this run

New exact-code quality results are **NOT EVALUATED** at review creation. Native film improvement **NOT EVALUATED**: trigger a fresh nine-job immutable candidate campaign by updating `capture-request.json`, then inspect normal-speed unedited film plus real source/renderer/projection traces around 23–30s on desktop 960×600 and portrait 390×844. Compare first-F9 WebGL-return distribution, number of drawing-buffer reallocations, actor/gate visibility and rest-of-loop outcome/restart against the same frozen baseline. If native still hard-cuts, prioritize actual shared world/camera geometry occlusion and source→native presentation synchronization over any new fade policy. Do not promote P0 for only a successful test or faster CPU return.

Independent fresh-context randomized A/B reviewers **LOOKS 0/5 · FEELS 0/5 · PLAYS 0/5**; actual supported device p50/p95/p99 and memory **NOT EVALUATED**. All P1–P6 experience gates remain open.
