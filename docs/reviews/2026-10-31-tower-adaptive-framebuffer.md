# Infinite Tower Climb — Gauntlet 28: honest adaptive desktop framebuffer

**Scope:** `my-edutu/Ai_games`, existing draft PR #58, parent `3933af667eb44dd93f5421ea141b806942265ff3`. **Review: SELF-REVIEW.** The separate critic / coding-agent tunnel was unavailable. The official Jusant environment/climbing and ASTRO BOT Rising Heat action/readability comparisons remain required and unpassed.

## Pre-edit real-output evidence

Fetched the *actual completed* parent-source CI. `Tower Landing Evidence` run **41211177243 SUCCESS**, artifact **13046552464**, and `Tower Combat Impact Evidence` run **41211177254 SUCCESS**, artifact **13045884902** contain original GPU PNG screenshots and checksums that were downloaded and inspected before implementation: 960 × 600 desktop, 390 × 844 portrait, fixed climbing and guardian-contact snapshots. Beacon/hero and guardian are visible in the inspected screenshots, but the materials remain less rich than Jusant and the clips are not complete motion. Held frames and software-GL renderer submissions are **not** presented FPS. `Tower Continuous Motion Evidence` **41211177258 SUCCESS**, `Tower Guardian Canopy Evidence` **41211177268 SUCCESS**, and `Tower Realism Evidence` **41211177239 SUCCESS** at this parent. Broad `Autonomous Games CI` **41211183020 CANCELLED** during browser capture, **not a pass**. The last successful full-resolution CI 41209289669 (source 20a1d185) captured a real **1920 × 1080** frame that visibly retained **“3D view delayed”**; this remains an unsolved quality blocker.

## ONE chosen issue and source changes

Repeated slow rendering on large desktop canvases blocks continuous spectating. The shipped scene had only user-chosen High/Low pixel density, with no adaptation under sustained slow *returned scene-renderer calls*. Introduced a bounded desktop drawing-buffer governor without hiding a problem or changing graphics tier: two consecutive `update + renderer.render` calls of at least 180ms trigger one 20%-scale reduction with cooldown, flooring at 60%; a sustained series of 90 calls of at most 35ms gradually restores each 10% step. Invalid or hidden measurements are ignored. This is **not a hardware GPU timer or an FPS estimator**. The chosen High/Low quality remains unchanged, preserving High's geometry, shadows and eventual environment reflections.

The scale is applied **before the following frame** so resizing cannot wipe the just-submitted picture; explicit quality switches and context restoration reset it. On phones under 700 CSS px, the existing one-pixel-per-CSS-pixel rule remains untouched. Scene diagnostics expose base/current DPR, scale, adaptation count and measurement caveat. The **existing Graphics row inside the details drawer** truthfully discloses `High · adaptive 60% render` (or Low), with no new live HUD clutter. A smaller render buffer can soften image detail and is **not** an improved commercial-bar score.

Files: `public/infinite-tower-climb/visuals/scene.mjs`, `public/infinite-tower-climb/visuals/hud.mjs`, new `tests/phase3/tower-adaptive-resolution.test.cjs`, `tests/phase3/tower-hud.test.cjs`, this review and the chronological `progress.json`.

## Test and actual-output verification

- **RED** against parent code: 4/4 new adaptive-resolution tests failed (missing governor and unchanged backing ratio). After implementation, a test-harness fixture error (`world.diagnostics` absent) was corrected without weakening assertions.
- **GREEN:** 14/14 focused adaptive/HUD tests; whole Tower phase-3 suite **109/109 PASS**; `npm run build` **PASS**; stream host self-test **ok:true** (authority, privacy, replay, restart, recovery true).
- A full cross-phase Tower suite was attempted with Node 22.16.0, which lacks `--test-isolation=none`; retry without the flag **timed out** after 157 recorded passing subtests. **No overall full-suite pass** is asserted from that attempt.
- A new local `/tower` host returned **HTTP 200**, but real Chromium navigation to `http://127.0.0.1:4175/tower?quality=low` returned **`net::ERR_BLOCKED_BY_ADMINISTRATOR`**. Therefore **no new-source real GPU screenshot, video, hardware frame-rate or performance improvement is verified locally**.

## Self-review and gates

Specification: presentation-only adaptation; deterministic authority, collisions, AI, replay, source privacy, and user-chosen tier stay unchanged. Quality: reduced desktop framebuffer may produce softer edges, but avoids discarding character assets, shadows, lighting or motion fidelity, and is explicitly disclosed. The duration threshold is a cautious unverified heuristic, not evidence of a speed win. New-head CI and actual 1920 × 1080 captures are essential before calling any improvement passed visually. Maintain reduced-motion, mobile legibility and WebGL recovery contracts; regressions must trigger rollback/revision.

**Scoped RED/GREEN + build + host PASS; actual new-source visual/performance and full-suite gates OPEN. Overall GAUNTLET FAIL.** Independent Jusant/ASTRO BOT comparisons, full-speed contact/attack/recovery motion, accessible UI, intended-device measured FPS and long soak remain OPEN. No merge, deployment or force-push.

**Automatically selected next priority:** Obtain and inspect exact new-commit CI 1920 × 1080 GPU screenshots and continuous WebM; check honest graphics-detail disclosure, pixel softness versus scene readability, whether stalled overlay clears without false live claims, and mobile sustained motion. If new rendered frames remain slow, profile shader/overdraw/hardware bottlenecks rather than awarding a performance PASS.
