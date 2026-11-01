# Infinite Tower Climb — Gauntlet 27: first render before expensive environment conversion

**Scope:** `my-edutu/Ai_games`, draft PR #58, baseline source `20a1d1853808e03e76035f7a9d26f5abb9661861`. **Review classification: SELF-REVIEW**, not a fresh independent critic. Subagents/Ultracode were not available in this session.

## Actual pre-edit evidence and failure

Read `AGENTS.md`, `games/infinite-tower-climb/GAUNTLET.md`, the chronological Gauntlet ledger and the latest viewport/scene/resource reviews. Checked completed source-bound CI rather than treating former pending runs as passing. `Autonomous Games CI 41209289669` **SUCCESS** for baseline 20a1d185; it contains a genuine full **1920 × 1080** desktop.png (`infinite-tower-climb-phase3-capture`, artifact **13045099379**) that was downloaded and directly inspected. Thus the prior fullPage screenshot capture blocker is resolved as a scoped test gate. **The actual screenshot still displays “3D view delayed”** while the tower scene appears; the succeeded capture does not establish real-time performance.

Also downloaded and examined source-bound `Tower Continuous Motion Evidence 41209286284` **SUCCESS**, guardian artifact **13045961295**, including actual desktop/portrait WebM, full PNGs and `motion.json`. Its **software GL renderer-submission interval p95** is 6,134 ms desktop and 3,961.9 ms portrait. These are not physical-device measurements or presented frames and cannot be described as FPS. The earlier bounded and confounded render-cost probe in `2026-10-31-tower-scene-clarity.md` measured ~818 ms low-quality callback median with reflections, ~434 ms with reflection sampling omitted, while admitting darker/flatter metal. This motivated a narrowly reversible quality-tier experiment, *not* a claimed speed win.

## One scoped implementation

The existing scene synchronously called `createReflectionEnvironment` on its first render update, before any `renderer.render(scene, camera)`. Conversion also ran for Low tier, despite Low already reducing DPR, shadows and particles. Source change in `public/infinite-tower-climb/visuals/scene.mjs`:

- **High:** issue the first scene renderer call using existing direct light, then build the existing PMREM radiance source on a later submission. Full High materials, lighting/environment settings and shaders are not permanently downgraded.
- **Low:** explicitly use direct lights without the PMREM environment. Release an owned High target on transition to Low; switching back High recreates reflections after a direct-lit frame. A theme transition or real WebGL context rebuild also restarts the first-frame policy.
- Existing authority, hitboxes, AI decisions, seeded replay, inventory, UI state and event semantics remain untouched. The lower tier can look less metallic; that tradeoff must be checked in real pixels before any Low visual pass. It does **not** lower the official Jusant environment/climbing or ASTRO BOT action/readability bar.

## Red/green tests and verification

**RED:** two focused real-Three CPU renderer-boundary tests failed against original source because PMREM converted before scene render and in Low quality (focused 5 pass, 2 fail).

**GREEN:** 7/7 focused tests, including exact call ordering, four Low submissions without PMREM, High→Low→High target ownership and readiness, and retained resource/failure tests. Related Tower phase-3 suite **104/104 PASS**; `npm run build` PASS; Tower stream-host `--self-test` **ok:true** (authority, privacy, recovery, replay, restart).

Local exact-source Chromium navigation was attempted using installed `/usr/bin/chromium`, but `page.goto(http://127.0.0.1:4175/tower)` returned **ERR_BLOCKED_BY_ADMINISTRATOR**. No new-source WebGL screenshot, hardware FPS, production-grade cold-start timing or normal-speed reference comparison passed in this local environment. Existing remote captures are pre-edit evidence only.

## Self-review and next gate

Specification review: source-only and deterministic authority unchanged; no new gameplay randomness; Low preserves direct illumination and High eventually keeps the original PMREM quality. Quality review: first renderer call no longer waits for PMREM, but GPU frame presentation and materially better experience remain **unverified**. Explicit risk: direct-only Low can darken metals or reduce surface separation. New-source CI and authentic High/Low captures must be inspected. If Low loses critical visual readability, introduce a cheaper legibility-preserving material response instead of declaring success.

**Scoped source/test gate PASS; overall GAUNTLET FAIL/OPEN.** Independent Jusant/ASTRO BOT visual comparison, complete-speed character/climbing/combat motion, accessible UI, target-device sustained FPS and soak are not passed. Keep PR draft; no merge/deploy/force-push. Rollback is simply reverting this small source/test/ledger commit if new real evidence exposes a regression.

**Automatically selected next priority:** inspect exact new-head `Autonomous Games CI` plus genuine High/Low stills, test first-frame recovery and compare material legibility before accepting any performance or visual claim.
