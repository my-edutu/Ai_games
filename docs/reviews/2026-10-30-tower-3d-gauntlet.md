# Infinite Tower Climb — 3D Gauntlet review

Date: 2026-10-30. Branch: `codex/infinite-tower-climb-3d-gauntlet`. Base: `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31`.

## Current decision

**Substantial 3D implementation; commercial benchmark not met.** Independent visual reviewers still prefer the official ASTRO BOT Rising Heat reference. The most recent actual-output playtest could not establish usable moving gameplay: the authority and browser DOM advanced while inspected recordings retained early compositions. This is an open presentation gate, not evidence of a smooth or complete visual experience.

The final source now passes both strong real-WebGL recovery tests and has a valid restored Storm image plus a current Foundry capture with the original stone texture and reflection lighting. Earlier integration attempts timed out during screenshots and context-loss calls; those failures remain recorded below. The new passes establish the tested recovery paths and still output, while complete moving gameplay and the commercial visual bar remain open.

The implementation and evidence are retained as a reviewable draft. No production deployment, main-branch merge, commercial-bar win or hardware frame-rate claim is part of this change.

## Delivered scope

- An actual locally served Three.js world with the original blue/ivory expedition climber, sentinel, ranged shooter and heavy guardian. The cast has articulated locomotion, ascent/descent, landing, strikes, recoil, hurt and defeat poses driven by public game state.
- Foundry, Ruins, Storm, Clockwork and Void environments, curved ledges, modeled hazards, moving machinery, atmospheric depth, pickups, projectiles and bounded effects. The Foundry uses unequal pylons, a recessed furnace iris, connected pipes and open platform supports.
- Follow/overview cameras, restrained expedition telemetry, captions, sound, quality, reduced-motion and fullscreen controls. Phone layouts have measured central clearance and at least 44 × 44 CSS-pixel control targets.
- Opt-in synthesized audio, lifecycle-safe polling, renderer interruption handling, and a separate automatically refreshing journal at `/tower/gauntlet`.
- An original project surface texture with provenance in `public/infinite-tower-climb/visuals/assets/README.md`; no commercial game artwork is included.

The existing seeded fixed-step simulation still decides all gameplay. The 3D route wraps the existing platformer coordinates around the tower. It does not add free-roaming movement or a second physics system. Camera, animation and sound consume public snapshots and cannot change outcomes.

## Fixed comparison bar and review method

Primary reference: [official ASTRO BOT — Rising Heat gameplay](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4). Supporting references: [Jusant](https://dont-nod.com/en/games/jusant/) for scale/atmosphere and [Fall Guys](https://store.epicgames.com/en-US/p/fall-guys) for obstacle readability.

The bar is character finish, visible action, material separation, environmental depth and clarity of the next move in real gameplay. Separate builders and fresh critics reviewed the cast, world, HUD, integration and correctness. Comparisons were source-known; recognizable commercial footage was not represented as a blind evaluation. Ties, missing evidence, test passes and self-awarded scores do not establish a win.

The independent feedback drove closer eye-line framing, readable attack/death cues, lighter platform supports, structural variation, rounded armor, mobile safe areas, bounded material batching and the latest surface/light pass. Remaining visual gaps include repetitive large forms, insufficient variation and physical history, broad lighting, and an unverified character-performance envelope.

### Final-source still review

A fresh critic inspected the final Foundry follow, final portrait capture and restored Storm overview directly against Rising Heat reference frames. **The reference remains preferred.** The final Foundry separates pale architecture, dark tubing and orange trim, and its white/blue climber is readable. The oversized wheel dominates the composition while the upright, small protagonist and intended landing communicate less action. The critic initially read the sentinel opponent as a friendly bystander, exposing an enemy-role readability gap.

The final portrait capture visibly reports a delayed 3D view and displays its recovery card over the central play area; the hero is not visible. That is unsuccessful portrait gameplay evidence, not a recovered-phone pass. It used the explicitly selected high-quality tier at DPR 1, not the phone's default low tier. A still does not establish the duration or cause of that recovery state. This evidence is retained rather than concealed for a cleaner screenshot.

## Review-driven correctness repairs

| Finding | Implemented repair and evidence |
| --- | --- |
| Moving-platform imagery disagreed with collision | Snapshots use the same tick-adjusted platform coordinates as collision. Regression exercises multiple tick positions and preserves authoritative checksum. |
| Malformed request target escaped the HTTP handler | Bounded 400 response; independent probe then served health successfully from the same listener. |
| Consumed events accumulated through restarts | Drain the consumed private queue while retaining monotonic sequence and a 360-entry public replay. Independent probe retained zero consumed events at 250/500/750/1000 steps through nine restarts. |
| Audio/captions leaked across runs | Reset presentation history at a validated run boundary while retaining mute preference; new-run low-tick damage is audible/captioned again. |
| Intermission was rejected as divergent | Lifecycle-aware presentation revision distinguishes result, intermission and restart while preserving checksum-divergence rejection. |
| Transient host recovery remained latched | A subsequent accepted authoritative tick restores normal output. Injected step and presentation failures recover from 503 to 200. |
| Browser back/forward cache restored a dead app | Persisted hide suspends polling; show resumes one poll without disposing the preserved scene/HUD. Request identities reject stale completions. Final unload still disposes. |
| Pending sound enable overrode a later mute | Operation generations keep the latest gesture authoritative and prevent late resume/disposal from reviving sound. |
| Mobile startup exceeded its tier | A single initial quality choice reaches HUD and renderer; phone and low quality cap DPR at 1, including explicit high quality on a phone. |
| Context restoration retained old GPU handles | Retire context-owned resources while context is lost, before renderer caches change generation. The strong negative control reproduced GL error 1282; before the later surface/light pass, the repaired tests passed repeated loss, floor changes, preference preservation and error-free resumed rendering. The latest integration has the separate timeout blocker described above. |

The eight findings from the independent general correctness review were reproduced again after repair and passed. The moving-platform and GPU-generation findings have their own regression evidence.

## Resource and geometry evidence

Character batching preserves articulated geometry while reducing the climber from 53 mesh draws to 10 and ordinary enemy archetypes from 52–54 to 7. These are model submission counts, not whole-frame GPU timings. The latest climber shell has 22,588 triangles in its isolated fixture.

The world fixture covers eight platforms and a heat hazard in each biome. Color-plus-shadow world submission bounds were 86/95/95/82/99 for Foundry/Ruins/Storm/Clockwork/Void. Maximum structural radius was 23.101027 against a 23.4 limit; actor roots use radius 25. Platform tops and angular edges match the declared collision fixture, including moving-platform updates. Animated spike/crusher/void geometry was corrected to remain inside its real active collision extents.

Permanent tests exercise full-circle structural clearance, platform contact, five animated hazard families, bounded rebuilds and exact-once disposal. The independent fifteen-rebuild audit retired 2,332 geometries, 315 materials and 300 instances exactly once. A negative control that bypasses hazard conformance reproduces the original spike overshoot.

The surface helper owns one shared texture per world, supports failed-load fallback, aborts retired requests and closes late-decoded bitmaps. The reflection pass retains one 336 × 256 half-float CubeUV target, approximately 0.66 MiB of color storage, and immediately disposes conversion resources. These numerical ownership checks do not establish hardware speed or final image quality.

A fresh resource critic reproduced and independently verified two further repairs: final disposal now releases the directional-light shadow targets, and a partial reflection conversion releases its output and restores the caller's render state. Reflection failure attempts once per changed theme/context and falls back to direct lighting, with a bounded diagnostic warning, instead of falsely latching context loss. Five permanent failure-path regressions cover these boundaries. The output-ownership adapter uses a narrow per-instance `_allocateTargets` override against pinned Three 0.186; the installed-revision assertion deliberately requires review when that dependency changes.

The final rendering-status patch tracks the last submitted snapshot separately from accepted state. HTTP polling cannot refresh its three-second visible submission timer. Starting/stalled views report degraded status while retaining authoritative result/intermission cards. Hidden time, cached-page return and context restoration have explicit grace/reset behavior. Empty timing distributions report `null`; the history retains at most 240 real visible intervals. This measures renderer-call returns, not GPU completion or presentation.

One instrumented live baseline and one harness-only single-in-flight GPU experiment both failed to obtain usable pixels. The baseline observed a pending fence across two later submissions; the paced experiment prevented that overlap but still had multi-second callbacks and no usable capture. The runs were not matched-state performance comparisons. No production pacing policy was added on that evidence.

## Final source verification

`npm run build` completed successfully. The complete Tower logical suite, including the promoted lighting regressions, completed with **103 passed, 0 failed, 0 skipped** in 155.05 seconds:

```sh
node --test --test-isolation=none \
  tests/foundation/tower-*.test.cjs tests/phase2/tower-*.test.cjs \
  tests/phase3/tower-*.test.cjs tests/phase4/tower-*.test.cjs \
  tests/phase5/tower-*.test.cjs tests/phase6/tower-*.test.cjs
node scripts/serve-tower-stream.cjs --self-test
```

The stream host self-test returned `ok: true`, with stable authority, local browser assets, bounded source/replay, privacy, recovery and an observed restart. The suite's inherited release-readiness scoring tests concern existing software contracts; their scores are not 3D art scores or a commercial-benchmark verdict.

On the final scene source, the two unchanged strong browser tests passed in one worker, within their existing 60-second individual limits. A temporary config used an isolated port and the same test settings. Its initial working-directory setup error occurred before browser creation and was corrected before the test run:

```sh
TOWER_SOFTWARE_GL=1 npx playwright test --config=playwright.tower.config.cjs \
  --grep 'a floor change during WebGL loss|a context loss leaves simulation' \
  --trace on
```

The live host continued during loss. The fixed-snapshot test restored across two actual lost-context floor changes, retained preferences, produced a real canvas image and finished with GL error zero. After both restorations, the stone asset was ready at 1254 × 1254 with one owner, the reflection target was ready at 336 × 256 with zero environment failures, and render submissions resumed. The final small sample included a 3,120.7 ms interval; these checks do not establish smooth playback or a hardware frame rate.

Catalogue CI now selects Tower browser files in a dedicated `tower` project with the correct port-4176 base URL; the existing `catalogue` project excludes those files and retains its prior defaults. Both Tower configurations explicitly enable software WebGL in CI. The Playwright collection check resolves all 12 Tower browser cases to that project. This corrects the inherited Snake base URL for the new relative-URL tests without changing game behavior or test time limits.

## Earlier actual-output failures retained for comparison

The independent critic tested real autonomous hosts in headless Chromium with SwiftShader. Other CPU-consuming browser processes were observed on the shared host and left untouched. Contention is a possible contributor; sole causality has not been established.

| Observation | What it establishes |
| --- | --- |
| High-quality startup recording ended on an empty CONNECTING shell after 60.2 seconds | A real failed attempt. Its initial harness lacked failure diagnostics, so cause remains unclassified. |
| Low-quality default run reached readiness at 36.877 seconds; screenshot timed out at 45 seconds | Actual output/capture failed under the recorded conditions. The browser trace advanced only from frame 7 at 42.84 seconds to frame 9 at 141.12 seconds. |
| Default authority reached floor 4, health-depletion result, intermission and restart | Underlying lifecycle progression, not visible composited progression. |
| Explicit floor-8 guardian scenario recorded genuine damage, result/intermission and new-run DOM states | A real scenario test, not proof that the default agent reached a guardian or that guardian choreography was visibly reviewed. |
| Inspected videos retained early floor-0/floor-8 images | No visual jump, landing, attack, guardian-performance or lifecycle pass can be awarded from those videos. |
| Latest material/light capture reached frame 13 and ready texture with no reported page/shader errors; p95/max interval 21,299.2 ms | Loading and submitted-render progress were observed. The subsequent held-RAF screenshot still timed out at 60 seconds, so final material appearance remains unreviewed. |

The old frame sampler excluded intervals above two seconds. The updated sampler retains long visible intervals in bounded storage. Frame counts and accepted snapshot ticks must be distinguished from submitted snapshots, GPU completion and actual composited visibility.

## Reproduce

```sh
npm ci
npm run build
node scripts/serve-tower-stream.cjs --port=4175
```

Open <http://localhost:4175/tower> and <http://localhost:4175/tower/gauntlet>. See the [Game 3 README](../../games/infinite-tower-climb/README.md) for controls, query options and verification commands, and [GAUNTLET.md](../../games/infinite-tower-climb/GAUNTLET.md) for the continuing lead-agent prompt.

Selected actual images are versioned in [`public/infinite-tower-climb/gauntlet/evidence`](../../public/infinite-tower-climb/gauntlet/evidence). `08-foundry-held-frame.webp` is a real unmodified authoritative tick-118 appearance capture, held for inspection before the new surface/light pass. It is not a moving-playtest result.

Final-source evidence: [`11-foundry-final.webp`](../../public/infinite-tower-climb/gauntlet/evidence/11-foundry-final.webp), [`11-phone-final.webp`](../../public/infinite-tower-climb/gauntlet/evidence/11-phone-final.webp), [`11-restored-storm.webp`](../../public/infinite-tower-climb/gauntlet/evidence/11-restored-storm.webp), and [`11-verification.json`](../../public/infinite-tower-climb/gauntlet/evidence/11-verification.json). The JSON binds the captures to presentation source hashes and records restored texture/reflection readiness. Foundry uses the unchanged tick-118 public snapshot while the renderer keeps running; it remains appearance evidence only.

## Open acceptance gates and ownership

| Gate | Owner / next evidence |
| --- | --- |
| Usable moving output | Renderer owner: diagnose render/capture boundaries and obtain a continuous real-output clip with successive jumps/contacts, attack/impact, guardian, readable result, intermission and restart. Inspect the clip itself. |
| Recovered portrait gameplay | Renderer/HUD owners: reproduce and remove the actual delayed-view blocker, then capture a visible climber, next landing and threat on the intended phone tier. |
| Broader material and scene inspection | World/lighting owners: expand the final Foundry and restored Storm stills to matched multi-biome action views; retain the now-passing final context-recovery evidence. |
| Commercial visual comparison | Independent visual critic: compare new real output directly against the fixed bar and return the largest gap. Current verdict remains reference preferred. |
| Device performance | Renderer owner: measure on intended graphics-capable viewing devices. Do not infer a hardware frame rate from this shared software renderer. |

The Gauntlet journal records active agent work. Its refresh timer does not launch agents or continue coding after the session ends. Ultracode was unavailable in this environment; supported coding and critique subagents were used instead.
