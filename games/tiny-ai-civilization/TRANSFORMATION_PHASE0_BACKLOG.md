# Tiny Kingdom — Phase 0 evidence and rendering-spine backlog (W69)

Status: **ACTIVE — WORK IN PROGRESS, NOT AN EXPERIENCE MILESTONE**.
Repository: `my-edutu/Ai_games`; **open draft PR #64 only**, branch `feat/tiny-kingdom-post-main-gauntlet-20261031`.
Never merge #64 without fresh user authorization. Never modify main, merged #43, or divergent #59/#62.

## Unchanged comparison anchor

G088 baseline: `2f6deb43feb1a1557848d44def53a6109deb1ab1`.
- [Actual G088 desktop/mobile capture](https://github.com/my-edutu/Ai_games/actions/runs/41301740489/artifacts/13081531738)
- [Actual G088 Day-120 scene](https://github.com/my-edutu/Ai_games/actions/runs/41301740495/artifacts/13081222556)
- Latest **inspected** real comparative workday: [W67 same-seed real moving captures](https://github.com/my-edutu/Ai_games/actions/runs/42101461674/artifacts/13452738968). Do not substitute current W69 stills or render probes for a live comparison.
- W67 [real 120-day soak](https://github.com/my-edutu/Ai_games/actions/runs/42101461741/artifacts/13453456462): 28 real people, 37 structures, 150,155 triangles in sampled view, byte-identical seeded replay and zero reported page/GL errors. Ubuntu **SwiftShader software** 36 frames / 8.42s = 4.28 observed FPS; CPU static p95 112.5ms, dynamic p95 40.7ms, total p95 144.8ms. Samples are workload-specific, NOT a hardware-GPU performance result or causal improvement.
- W68 source-matched GPU, soak and matched video jobs were still QUEUED when checked on 2026-11-05. The W68 city-materiality/camera effects are NOT independently verified. Never infer their result from W67.

## One integrated playable scenario (maintain across ALL stages)

**A real farmer harvests at a visible field → a genuinely loaded courier travels along original streets → physically unloads at a stocked market receiving point → credited inventory and citizens' economy visibly respond → the resident returns to an architecturally credible home.** Include actual Day-1, citizen-close, Day-120 grown town and 390px interactions. The authoritative fixed-step world, actual actors and seeded replay are never replaced by props or film-only automation.

## Current top five blockers (ranked by experience harm)

| Priority | Failure and exact last evidence | Next engineering move | Done means |
|---|---|---|---|
| P0 | Severe static CPU/frame stalls: 112.5 ms static p95; 144.8 ms total p95 on real W67 SwiftShader 120-day sample | Map static rebuild, GPU draw submission and upload costs in exact-source comparable scenes; then change scene residency/invalidation rather than adding textures blindly | Paired same hardware/seed/view/camera/Day-120 measured p50/p95/p99 with large reduction, no leaks, no scene objects hidden, 390px responsive |
| P0 | Actual moving citizens require substantial per-frame JavaScript geometry: W67 40.7 ms dynamic p95 | W69 reuse bounded real dynamic JS vertex stream and break down exact actor/worksite/household/weather/upload costs; next shift most expensive stable topology to resident/instanced rendering | One valid GPU-backed baseline report; then measured lower *matched* CPU p95 and sustainable 30+ FPS on documented physical target hardware |
| P1 | W67 full moving workday leaves a real farmer too quickly and mobile homecoming becomes aerial | Validate W68 4.2s documentary hold in new-source uncut film; fix physical sightline, not fake subject or cut invisible scenery | Viewer sees actual worker continuously perform meaningful activity, receives goods physically, same real citizen identity in camera audit |
| P1 | Settlement and people remain obviously low-poly despite denser market | Rebuild contiguous farm, road, granary, market, houses, lighting, natural foliage and character silhouettes as one original visual system using recovered frame budget | Fresh blinded viewers prefer moving candidate over G088 on LOOK, coherent lighting/materials, genuine Day-120 town in frame budget |
| P1 | No verified sustained hardware GPU/mobile 30+ FPS, no separate fresh-context critic verdict | Document device/resolution/workload, capture real hardware GPU timing and mobile interaction videos; ask genuinely separate blind critics when available | Sustained 30+ FPS, p95 frame <=33.3ms on representative hardware, stable memory, accessible 390px, independent look/feel/play preference |

## W69 actual code increment — not a score

- [Test first: desktop and 390px regression](https://github.com/my-edutu/Ai_games/blob/feat/tiny-kingdom-post-main-gauntlet-20261031/tests/browser/tiny-kingdom-w69-world-vertex-stream.spec.cjs).
- [Playable renderer W69](https://github.com/my-edutu/Ai_games/commit/72316929fa03be922c1df094c5643ea37c2a1873): recycle one bounded JavaScript numeric vertex array for genuine dynamic village geometry rather than allocating a fresh ~0.8M-float array on every authoritative frame. This retains every actor, prop, material, triangle and original semantic order. If dynamic vertex count breaches the existing 960,000-float cache bound, drop the scratch for the **next** build without omitting the current frame. Existing exact-mesh cache still handles unchanged camera-only scenes.
- Actual WebGL CPU profiler now reports separate worksite, household, real-economy, ambient, genuine citizen, weather and GPU-upload stages through `window.__tinyKingdom.getFrameProfile()`. New `getDynamicVertexPoolAudit()` exposes allocations, reused frame builds, peak floats, budget and over-budget retirement; neither probe mutates authoritative simulation.
- [Dedicated GPU/browser workflow](https://github.com/my-edutu/Ai_games/actions/workflows/tiny-kingdom-gpu-evidence.yml) will emit 1024px and 390px screenshots plus machine-readable CPU stages.
- V8 parsed the complete updated inline game script and a narrow source-level array-identity check reused the same backing JS array. **No W69 full browser GREEN, new-source 120-day replay, measured FPS or independent footage yet.** A written test before source is not an executed RED. Do not award a performance or visual milestone for source changes alone.

## W70 separate GPU timing and actual visual-audit checkpoint (5 November 2026)

- Exact implementation: [nonblocking WebGL timer 89afe292](https://github.com/my-edutu/Ai_games/commit/89afe292f66890da637968c0ef096073473dd7d4), [desktop/390px contract](https://github.com/my-edutu/Ai_games/blob/feat/tiny-kingdom-post-main-gauntlet-20261031/tests/browser/tiny-kingdom-w70-physical-gpu-time.spec.cjs), and [GPU Evidence workflow](https://github.com/my-edutu/Ai_games/actions/workflows/tiny-kingdom-gpu-evidence.yml). The updated renderer separately profiles GPU driver elapsed time using `EXT_disjoint_timer_query` **when supported on non-software WebGL**, never blocking on a query, and discarding disjoint results. Four pending queries/48 samples maximum. Reports explicit `software-renderer`, `extension-unavailable`, `no-webgl` or `context-failed` rather than inventing hardware timing. A full-script V8 syntax compile passed. Exact WebGL query behavior, new-source mobile, GPU time and FPS are **NOT PROVEN** until real supported-hardware testing.
- I downloaded [actual pinned G088/W67 same-seed film artifact 13452738968](https://github.com/my-edutu/Ai_games/actions/runs/42101461674/artifacts/13452738968) and inspected stills and sampled frames from uncut workday, live-shift, courier market unloading and 390px homecoming. **Observed:** candidate farm/market architecture and trade plaza are denser and navigation cleaner; however the ordinary farmer workday is largely far above planted wheat rather than a clear hand-scale work shot. Live Shift reaches an after-dark resident near the river and eventually shows a wall/doorway dominating the shot. At market, large posts obscure the handoff. Mobile homecoming jumps from a door/person view to overhead town. This is a genuine running-game observation, not an independent blinded critic, W68/W69/W70 footage or an experience PASS.
- User-facing experience scorecard remains A LOOK **NOT PROVEN**, FEEL **FAIL**, PLAY **NOT PROVEN**. B commercial reference **FAIL**. Last verified numeric performance still W67 4.28 Ubuntu SwiftShader software FPS, **NOT** new or physical GPU throughput.
- Current [W70 exact-head GPU/mobile, soak and A/B workflow runs](https://github.com/my-edutu/Ai_games/actions) were queued when checked at `fbed95af0ba5d480017127380d7750ce8c7af50c`. Their result must be read only with matching source SHA; no test-first RED or running PASS claimed. Dynamic-geometry reuse is W69 source implementation and should not be misattributed to W70.

**Next integrated execution:** Once W69/W70 CPU/GPU traces are available, select the measured biggest architectural cost and implement a bounded **retained scene partition** (static worksite buildings/civic buffers, state-dependent stock/house geometry and animated people) driven by actual authoritative dirty keys. Keep all original citizens, deterministic economy, save/replay and triangle ceiling. Do not pivot to decorations. Matched real moving gameplay and actual physical-GPU fps are required before scorecard advances.

## Hourly continuation checkpoint

1. Resolve completed W68 and W69 actual CI, inspect downloadable screenshots/videos, capture 390px and grown Day-120 frames. Record exact SHA of each artifact; never combine metrics from divergent commits.
2. If W69 fails, repair the tested genuine-actor or pool invariant without weakening checks. Ensure scenery, households and all citizens stay visible, checksum replay unchanged and no GL errors.
3. Use newly measured per-stage p95/p99 to identify the largest real render cost. Begin a **multi-run coherent architectural redesign** (resident static/dynamic workstations, actor rig GPU instance/buffer staging, dirty-region invalidation) of the *same actual farm→courier→market→home playable scene*.
4. After measured frame-cost recovery, rebuild the physical medieval environment, then expressive humans, readable full economy and smooth mobile camera, always with matched moving gameplay.
5. Preserve independent scorecards and full chronology. Current A: LOOK NOT PROVEN, FEEL FAIL, PLAY NOT PROVEN. B commercial reference FAIL. Keep draft PR #64 open and unmerged.

## Acceptance boundary

No 30% → 40% checkpoint until rendering impact is **actually measured under a matched representative workload** while preserving real simulation and improving the playable frame. Never infer progress from tests, a code diff, a synthetic benchmark or a pixel-count delta. Real 30+ FPS on documented representative hardware and independent blinded moving-game comparisons remain separate later gates. If unavailable, mark NOT PROVEN.
