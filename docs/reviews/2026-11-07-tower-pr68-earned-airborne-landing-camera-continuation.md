# Infinite Tower Climb — real landing lane versus oversized panoramic cap

**2026-11-07 · [open DRAFT PR #68](https://github.com/my-edutu/Ai_games/pull/68) · P0 OPEN · transformation verdict NOT EVALUATED**

## Inspected state before implementation

- Exact inspected PR68 HEAD: `293435de1c1d5a24e2f894ea78afaa684aa6b61a`; active base PR58 and the immutable frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` were not edited.
- Read AGENTS.md, the approved transformation design, GAUNTLET.md, transformation.json, the actual source-driven scene, camera guards, physical gate presentation and historical recording status. Historic candidate danger portrait (2026-11-05, source 8fd9018f, **not current HEAD**) showed the hero disappearing into a wide floor-eight machinery panorama. The gateway walk and same-episode guardian/crusher-to-restart were not legibly verified.
- [Capture 42330014076](https://github.com/my-edutu/Ai_games/actions/runs/42330014076): all 9 jobs queued, no artifacts at inspection. [Exact-source quality 42330170579](https://github.com/my-edutu/Ai_games/actions/runs/42330170579): queued. Available remote development terminal reported disconnected tunnel >300 seconds. Current source gameplay/video and hardware remain unexecuted.

## One larger systemic composition gap, not another decorative patch

In the actual `composeFollowView()` camera solver, airborne non-guardian traversal always placed BOTH distant edges of a very wide landing platform into the hard perspective-fit set, even after the authoritative pilot published its currently observed `air-control` or landing-brake intent and `observedSourceLandingX` selected an actual in-deck arrival lane. This forces the whole cap into a portrait panorama and reduces the climber to a distant figure precisely during an approach where landing weight, readable steering and moving-deck arrival matter.

[Implementation `a06fb2d2f2af`](https://github.com/my-edutu/Ai_games/commit/a06fb2d2f2afaed49d657c2b25be7250a4515017) modifies the **real** `public/infinite-tower-climb/visuals/scene.mjs` perspective fit, adding `observedLandingShotSpan()` in `visuals/landing-shot-span.mjs`, with source-only [Node regressions](https://github.com/my-edutu/Ai_games/blob/a06fb2d2f2afaed49d657c2b25be7250a4515017/tests/phase3/tower-observed-landing-shot-span.test.cjs). An airborne wide deck now asks for a focused view of an actually declared target lane and substantial adjacent braking surface. For an illustrative source-deck width of 280,000 and body half-width 9,000, the hard-fit landing extent contracts from the entire 280,000 span to 92,000, **only if** the current active player/target/intention and sourced selected lane all match. The fully modeled destination remains unchanged.

Unchanged: game authority, physics, RNG/replay, AI decisions, colliders, the moving platform itself, hazards, actual terrain/destination, texture and shader budgets, and full platform fit when intent is unknown, deck is short, body grounded, source stale, or target differs. Genuine airborne guardian duels retain their existing different two-body composition. No invented safe landing or victory event.

## Checks, criticisms and truth

- Local Node 22 stand-alone helper scenarios: 8 source-shaped invariants passed (wide physical span, actual selected lane, cap edge, short deck, unknown intention, standing, stale, wrong target, off-deck invalid value). New committed `node:test` fixture has five source-focused test cases but **was not executed in the original repository** because the remote executable workspace remains disconnected.
- Static replacement was limited to the source module import and wide-landing fit in `scene.mjs`; the existing full-deck, two-body and source-safe camera guards remain downstream. No current-source browser clip, 3,200-tick game campaign or device frame-time p50/p95/p99 was obtained. Latest source-HEAD workflows are not certified.
- Critical regression to inspect in actual **normal-speed** film: the tighter chosen lane could hide other useful deck edges or distant crusher and could require noisy swing-to-pan after a genuine pilot decision change. Do not treat a larger avatar still frame as an experience win; review full 960×600 and 390×844 footage with same-source event alignment, especially moving decks and the authentic guardian gateway.
- LOOKS **0/5**, FEELS **0/5**, PLAYS **0/5** genuinely independent blind critics. Performance on actual supported devices **NOT EVALUATED**. Quality **NOT EVALUATED**.

**Next highest-impact action:** recover an immutable executable Node 22/Chromium worker, execute the exact-head original 3,200-tick guardian/crusher-to-floor-nine-result/restart campaigns and the frozen baseline vs new candidate full-motion captures. Judge actual lane continuity, scale and hazard readability over time; fix the largest causal or visual issue in those genuine recordings, reopen P0 until accepted. Do not advance stage, rewrite baseline/PR58, merge, deploy, force-push or change PR draft status.
