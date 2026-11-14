# Infinite Tower PR68 — P0: original GPU doorway / successor shaft / horizon as ONE source-owned scene (2026-11-14)

## Guardrails and authoritative source

- Scope: **only** `my-edutu/Ai_games` draft PR #68, branch `feat/tower-transformation-gauntlet-20261101` based on active PR58. No deployment, merge, force-push, draft status change or unrelated game edit.
- **Frozen baseline stays `1731b380851162741761c5569e2bc152a0869ca9`** in `public/infinite-tower-climb/gauntlet/transformation.json`. This run did not alter it.
- Inspected pre-change PR68 SHA: `f9d42b02630a5ca5545f989c06c9b575ec434685`.
- Binding instructions inspected: root AGENTS.md, `games/infinite-tower-climb/GAUNTLET.md`, 2026-11-01 transformation-first design specification and relevant game experience/physics/creative-direction skills.

## Genuine normal-speed candidate diagnosis: hard cut persists

Original nine-job immutable capture at https://github.com/my-edutu/Ai_games/actions/runs/43539090937 was tied to **exact candidate f9d42b02**, low tier, seed `tower-transformation-capture-v1`, native 25 fps. All eight baseline/candidate normal-speed motion jobs yielded videos despite overall campaign failure in event pairing. I downloaded the **actual original** candidate danger archive `tower-motion-candidate-danger-43539090937` (artifact **14092165140**) and inspected desktop **960×600**, portrait **390×844** WebMs and their source sidecars from **22–30 seconds**; no synthetic gameplay or image stand-in.

- **Desktop**: at **25.0s**, original bronze Clockwork upper cap, white/blue climber and mechanical arch are visible. At **25.5s** the HUD displays Floor9 and bronze entrance plane remains partly present while new violet structures appear; by **26.0s** the entire surrounding structure/lighting has been replaced by purple. The player proceeds into real Floor9, but not through an unbroken view of the same old doorway.
- **Portrait**: still bronze at **25.0s**; by **25.5s** the camera shows a dark violet shaft and Floor9 HUD while the climber is no longer shown crossing the original bronze gate; **26–27s** are the next environment. The old/new reveal has no sustained spatial continuity.
- Authentic fixed-step guardian **0 HP tick441**, grounded 8→9 **tick451**, following Floor9 actions and outcome/restart are present in source; they are **not proof of original visible physical doorway crossing**.
- The returned **desktop** Three.js camera witness at first Floor9 tick452 reported BOTH real player and original door within projected safe frame (hero `[.2317,-.1236,.9775]`, old gate `[-.037,-.0209,.978]`), but this is NOT evidence either was painted together in WebM. The native scene-phase sidecar reports `warmToCoolBridgeSeconds=0`.
- Source tick451 floor crossing maps near **22.954s desktop / 23.091s portrait** in matched native evidence, while visible Floor9 HUD appears **25.5s** in both. ~**2.5s end-to-end presentation lag** masks source-earned spatial movement. First F9 WebGL CPU/GPU submission was **~259ms desktop** and **~826ms portrait**; software-renderer return intervals are uneven (desktop p95 **~597ms**, p99 **~1031ms**; portrait p95 **~553ms**, p99 **~901ms**). These are test-run WebGL/submission measurements, **not actual-device FPS**.
- Strict native full-body same-doorway acceptance **0/2**; full cinematic acceptance **NOT EVALUATED**. CI success cannot change it. Overall capture workflow failure and exact-head quality status remain vetoes until their independent conclusions.

## Single largest chosen experience gap and hands-on work

The system had already retained the **real old bronze cap, authentic unlocked gate, and original 3D gallery** with GPU-returned source validation. However, `world.update` could still upload the **opaque Floor9 monumental shaft** after a fixed first *ten* returned frames or 1.25 seconds, even if **that exact same source-verified old gateway was still materially visible** and its separate guardian-passage cosmetic handoff had expired. The sky's final old-weight could likewise fall independently of the actual still-visible original doorway. The result is a scene-wide visual replacement, not a physical entrance.

This execution implements **one integrated, bounded physical presentation contract** across old gate, incoming non-colliding shell and horizon:

1. **Test first `9197424fb09a249c9c52ff27aaf35fd0a57c6374`**: added targeted live ESM module/integration regression covering the genuine F8→9 zero-HP source, late GPU submissions, wrong run/proof, optical exit, stale source and resource hard-budgets, plus actual old-gate light/shadow coherence. This asserts the behavior, not artistic acceptance.
2. **`818988cf2da9f7a735e6cb2ef105e5cdd47400cc`**: `holdIncomingStructuralShell` accepts independent already-published genuine source-gateway material visibility. The noninteractive new shaft stays out of the old physical scene while that actual optical source is still opaque, independent of an expired cinematic cue; same-run, floor, F9 world tick, original GPU owner, authentic source defeat and **max 30 rendered frames/2.8 seconds** strictly bound it.
3. **`26dcc45fb52494de61107ce2899fd514b0d00ff8`**: real Tower `world.update` passes its **existing source-validated old door** proof to the new structural-shell gate. It changes only noninteractive new-floor environment assembly, **never** the true Floor9 collidable ground, moving platform, traps, player, guardian HP, outcome, or progression.
4. **`d05ff3d87613db2ebdb422206fae5758c2a57c38`**: Clockwork→Void horizon, fog, environmental lights and exposure now retain at least the old color weight of the **still-visible same-run original bronze doorway** instead of switching on an independent shorter aesthetic timer. Same optical retirement hard limits, reduced-motion/stale vetoes and replay safety apply.

**Scope truth:** No new geometric gate, HUD, collider, renderer pass, reward, predicted action or actor pose was authored. New code cannot certify that native compositor ultimately paints a good transition or that GPU resource overhead meets supported-device budgets.

## Checks and next mandatory acceptance

- Exact-head quality verification for final source **d05ff3d8**: https://github.com/my-edutu/Ai_games/actions/runs/43541717525 (was PENDING when requested; do not write PASS unless it completes and succeeds).
- Previous original capture: https://github.com/my-edutu/Ai_games/actions/runs/43539090937 (8 original clips exist, **aggregate FAILED** event pairing).
- **A NEW nine-job** immutable candidate+frozen baseline campaign must capture both desktop/portrait at normal speed from the **final source/evidence commit**. Compare the full 60+s actual films at 22–30s AND complete ascent, hazards, authentic guardian/crusher, Floor9 continuation, outcome and restart, aligning source events with actual native frame timestamps. Do not reuse pre-change f9d film as a quality result for d05f.
- If **old original doorway is still not visibly shared with the full-body climber** and structurally connected after this shell/horizon change, next highest-impact P0 must address camera/raster occlusion, old genuine geometry coverage and **software GPU first-return latency**. Do not ship another arbitrary fade timer.
- Hardware p50/p95/p99 and memory: **NOT EVALUATED**. Independent randomized fresh-context critics: **LOOKS 0/5 · FEELS 0/5 · PLAYS 0/5**. No pillar accepted and no blind evaluator verdict.

**Leading transformation verdict: NOT EVALUATED. P0 OPEN.**
