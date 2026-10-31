# Eko Run — Gauntlet visual critic, iteration 3 (8 October 2026)

## Evidence and provenance

- Target: original 3D Lagos-inspired Eko Run, comparable in polish to SYBO's 2026 Subway Surfers City (official product presentation: https://sybogames.com/; product visuals via App Store and Google Play).
- Critic evidence: **actual browser screenshots**, not code or mocked images, from GitHub Actions run **37745525387** (PR #51, `eko-run-gauntlet-captures` artifact 11536931787), generated from head `012047f8ad6dd936c8b5c46af987ba22c2a21194`.
- Captures: `artifacts/eko-gauntlet/desktop.png` (1280 x 720), `artifacts/eko-gauntlet/mobile.png` (390 x 844), `artifacts/eko-gauntlet/progress.png`.
- Verified CI: TypeScript build success, 5/5 host/API tests, 3/3 Playwright browser checks including WebGL canvas and mobile controls.
- Note: screenshot inspection is a direct visual critique. There has **not** been an independently blinded side-by-side test, normal-speed video assessment, or representative-device 3D GPU benchmark. This is not a final official 100-point quality score.
- A later camera/occlusion improvement is in commit `19b16c571df25e3fb58f92b9f7692f2b2209d10a`; it was **not** part of these captures. Re-capture and judge it before closing findings.

## Stop-ship verdict: FAIL — reference bar not achieved

The desktop screenshot has an oversized near-side building covering much of the lower playfield and another large block concealing road geometry. Tayo is small compared with the rest of the frame. There is too much empty sky relative to actionable gameplay. The mobile capture confirms a functioning portrait layout but similarly distant character and visually basic streetscape. A rendered 3D box world is not a finished premium 3D character/level experience.

## Exact critic findings

### EKO-GV-001 — Critical protagonist/path occlusion — STOP-SHIP
**Moment:** Desktop screenshot at approx. 50m progress → **Expected:** protagonist, next hazard and safe route clearly visible → **Observed:** huge foreground shop blocks the street, other foreground geometry competes with Tayo → **Why:** shop rows positioned between camera and runner and camera elevated too far → **Fix applied, pending proof:** move shop rows behind the route, re-orient shop facades and adjust camera zoom/look-ahead (`19b16c5`) → **Verification:** new desktop 1280x720 and mobile 390x844 screenshots at multiple route positions, no ordinary camera-caused deaths.

### EKO-GV-002 — Small, weak character silhouette — MAJOR
**Moment:** Desktop and mobile gameplay screenshots → **Expected:** expressive full-body protagonist readable instantly at compressed-stream size → **Observed:** small toy-sized procedural cuboid figure; facial features, body volume, hands/feet, fabric and animation detail insufficient → **Why:** placeholder articulated primitive character, no production rig/textures → **Fix:** original modeled Tayo asset with skeletal rig, authored locomotion poses and cloth response; preserve one standard authoritative hitbox → **Verification:** capture idle/run/jump/slide/land/fail for all four outfits on bright and dark districts.

### EKO-GV-003 — Generic street-world materials and architecture — MAJOR
**Moment:** Both screenshots, Mainland Morning → **Expected:** visually rich, layered Lagos urban environment with credible street proportions and identifiable behaviours → **Observed:** flat-color cubes, minimally detailed danfo and street furniture; weak shopfront materials and little unique Nigerian spatial rhythm → **Why:** procedural prototype meshes, no texture/normal/material pipeline → **Fix:** original modular architecture kits, detailed buses, road surface, drain/curb geometry, market and crowds; context-rich signs rather than text pasted onto cubes → **Verification:** official-reference-style 16:9 stills and motion at 3 locations per district.

### EKO-GV-004 — Unproved performance — MAJOR
**Moment:** Desktop capture overlay shows **7 FPS** → **Expected:** stable motion with measurable reference-hardware p50/p95/p99 frame time → **Observed:** 7 FPS *in CI Chromium capture*, which may be software-rendered; cannot conclude this is normal GPU performance → **Why:** high mesh/draw-call count plus CI rendering may be involved → **Fix:** report GPU/renderer info, warm-up FPS, draw calls, render timing, quality fallback and representative real-device runs → **Verification:** sustained 60 FPS target on declared supported desktop where feasible, 30/60 FPS declared mobile tier, no gameplay-tick drift or readable-cue degradation.

### EKO-GV-005 — Animated gameplay remains unjudged — MAJOR
**Moment:** Still screenshots only → **Expected:** convincing anticipation/takeoff/airborne/impact/recovery and interesting autonomous behaviour → **Observed:** screenshot captures show motion states but no temporal evidence of animation quality, fair hazard reactions, reroutes or multi-district continuity → **Why:** still-image acceptance can pass with poor game feel → **Fix:** record full uninterrupted run and slow-motion diagnostics, 10+ seeds across six districts; inspect collision/failure logs alongside video → **Verification:** multi-minute real-play normal-speed capture, seeded fairness and replay checks, independent reviewer findings.

### EKO-GV-006 — HUD presentation ahead of game-quality bar — MODERATE
**Moment:** Both screenshots → **Expected:** refined, legible progress information subordinate to action → **Observed:** branded status/HUD is readable and responsive, but large mobile controls/UI consume substantial vertical space and transient banner overlays centre-stage action → **Why:** visual hierarchy over-prioritizes interface and does not fade events sufficiently → **Fix:** tighten and fade event overlays, preserve safe-area touch targets, verify 5-second comprehension with uninstructed testers → **Verification:** phone-size compressed capture and 5-viewer study.

## Current quality gates (this captured commit)

| Goal | Evidence | Gate |
|---|---|---|
| Actual rendered 3D scene | Browser WebGL screenshots exist | BASIC PASS; polish FAIL |
| Existing authoritative 60Hz simulation | 5 passing API checks, live increasing tick | ENGINE CONTRACT PASS; endurance OPEN |
| Playable player/AI modes | API/UI checks; no full controller game-feel footage | PARTIAL |
| Fully developed 3D character and costumes | Four procedural silhouette options | FAIL (production quality) |
| Six distinct living Lagos districts | Generator supports six; limited procedural variants | PARTIAL; visual/gameplay evidence OPEN |
| Detailed buildings/vehicles/crowds/lighting/weather/audio | Basic procedural geometry, static props and simple effects | FAIL |
| Cinematic movement, VFX and camera | Basic follow camera, key-driven limb motion | FAIL |
| Autonomous long-running impressive AI gameplay | Basic hazard heuristic, no soak/campaign evidence | OPEN |
| Live Gauntlet progress page | Real screenshot of functioning dashboard | PASS, but ledger must update with evidence |
| Independent builder/critic, blind A/B until win | No independent subagent or blind reference scoring | NOT STARTED |
| Production quality and R5 | No original production asset pack, formal performance/balance/soak/canary evidence | FAIL |

## Next loop

1. Re-run current HEAD captures to verify camera/occlusion fix, and record before/after images.
2. Get a proper rigged 3D Tayo into runtime with high-quality authored motion; compare real action frames to the reference.
3. Upgrade one **small representative Mainland Morning block** to the full reference quality instead of multiplying low-poly districts prematurely.
4. Rebuild hazard readability and AI reaction tests using normal-speed video. Fix only the highest-severity issue per loop.
5. Continue until objective gameplay/visual bar passes; do not claim a fixed percentage complete or a blind comparison win without corresponding evidence.
