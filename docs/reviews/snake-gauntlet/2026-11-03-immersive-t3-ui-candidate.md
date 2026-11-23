# 2026-11-03 — Autonomous Snake T3 immersive spectator UI: exact-source engineering candidate, not a Gauntlet win

Parent [draft PR #52](https://github.com/my-edutu/Ai_games/pull/52) at `2b328e63a7d57ae126f503c1af5066d0b93aa6db`. No merge/deploy or premature branch movement during live current-head Chromium.

## Problem / benchmark
Real previous [68178 Chromium images](https://github.com/my-edutu/Ai_games/actions/runs/41630840885/artifacts/13230113577) and [63-second footage](https://github.com/my-edutu/Ai_games/actions/runs/41630840885/artifacts/13230168284) show a bright rectangular environment and small mechanical protagonist; this remains a whole-game **SELF REJECTION** against official Snake Pass and ASTRO BOT as a secondary craft bar. A second material defect is the old screen layout: explicit thick header, captions and footer shrink the playable stage (1080p top 122px, bottom 97px; tall mobile top 139px, bottom 98px in CSS), duplicating branding and reading like a dashboard around a game. Existing source has no user-visible display-settings toggle; only `?controls=1` reveals motion/clean-feed, and mobile clean-feed has no discoverable touch exit. No real after-media yet.

## Integrated production change
- `ux-v2.css`: replace framing-heavy dashboard strips with a viewport-dominant continuous 3D scene and restrained legible HUD overlays; explicit 1920p/landscape/tall portrait priorities, fixed viewport margins, stable layout, minimum buttons, less redundant branding, scene-state accent colors, no CSS blur filters or perpetual animations, original menu-over-camera portrait accessibility ordering kept.
- `index.html`: render truthful public-only goal progress, accessible meter/aria text, user-visible Display settings action, keep accessible camera/audio toggles, make development link discoverable in settings rather than persistent gameplay chrome.
- `view-copy.mjs`: bounded goal progress transformation only from immutable public `length/goal` snapshot fields. `app.js`: only poll-diffed aria/CSS variable mutations, no new RAF work or changes to the authoritative runner; proper settings `aria-expanded`, preserving existing camera/mute/reduced-motion/clean feed and touch-to-restore after clean feed.
- `tests/phase3/snake-t3-immersive-hud.test.cjs` and `tests/browser/snake-t3-immersive-hud.spec.cjs`: focused semantic/unit checks; actual source-hashed 1920p and 390px Chromium/WebGL comparisons, geometry/overlap/controls/clean-feed accessibility evidence. No mocks counted as gameplay footage.
- Zero changed simulations, seeded AI/scoring, portal discontinuities, fruit/hazard positions, render passes, 3D assets, adaptive limits or original >=17 true full-desktop renders-per-second gate.

## Verification status / honesty
- Old [2b CI](https://github.com/my-edutu/Ai_games/actions/runs/41641254208): **646 of 661 Node passed, 15 failed**. This is old head and DOES NOT validate the UI candidate.
- Old [2b Chromium](https://github.com/my-edutu/Ai_games/actions/runs/41641254466): **still in progress** at review. Do not cancel and do not claim its screenshots are new UI.
- Source assertions/tests authored but no exact-new-source Node or WebGL execution, GREEN result, before/after image, authenticated 45–90s gameplay or accepted physical-device FPS yet. Latest independently reviewed actual old 68178 strict gate **12 genuine complete renderer submissions vs >=17**. RAF calls, video FPS and GPU fences are not submissions/presents.
- Fresh independent critic not connected: **SELF REVIEW / ACCEPTANCE PENDING**.

## Next honest acceptance
Run exact new-commit full suite plus WebGL screenshots at same legitimate source, record uninterrupted 45–90s true autonomous action and actual unchanged strict gate, screen-reader/contrast/phone landscape, fallback, clean-feed recovery; inspect occlusion/contrast at danger/fruit/portal and revise same T3 if needed. Finish T1 world, T2 acting, T4 repeated strict performance, physical-device display presents/p95, 40+ segment/portal/replay/soak and independent whole-game benchmark before claiming Gauntlet. NEVER MERGE OR DEPLOY.

## Post-stage exact old-head Chromium result (supersedes 'in progress' at authoring time)

[Run 41641254466](https://github.com/my-edutu/Ai_games/actions/runs/41641254466) finished **63/81 PASS; 18 FAIL**. The original strict 1-second full desktop WebGL renderer **16 genuine submissions / required >=17 FAIL**, 736×336 draw buffer; 61 RAFs are not renders or display presents. Recorded frame evidence is from the **old 2b328e source**, NOT the UI candidate, and was not independently visually inspected in this source-staging session. UI source candidate, test execution, new screenshots/autonomous video and whole-game creative/performance acceptance PENDING.
