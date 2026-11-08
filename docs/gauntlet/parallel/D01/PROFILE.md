> **2026-11-08 integration note:** The original locally staged capture-only package below has now been added to the separate D01 Draft PR #73 (not the shared PR #49). Its test/evidence status remains historical until new exact-head runs complete. The related production drawing-surface fix is documented in `RENDER_SURFACE.md` in the same directory.

# D01 — Source-frame delivery and truthful Dungeon WebM capture

**Status: LOCAL CAPTURE CORRECTION IMPLEMENTED; ACTUAL GAME PERFORMANCE / MATCHED BEFORE–AFTER NOT VERIFIED. Do not merge, deploy or claim an FPS improvement.**

**Repository:** `my-edutu/Ai_games`; existing *open draft* PR #49 `feat/ai-dungeon-3d-gauntlet-foundation`. Remote branch head inspected 2026-11-08: `f6bbfb3eb5f7b18a5b0e5d786d354724896883cb`; the shared branch changes concurrently and the local coding tunnel was disconnected. This deliverable is a **standalone local patch, not a GitHub commit**. M1 pinned reference `281735d0910c6b2443648af976003d50412ee324` is unchanged.

## What was established — do not conflate these measurements

- The current production scene has a foreground `requestAnimationFrame` interval probe in `postfx-budget.js` and a separately measured synchronous `renderer.render(scene,camera)` duration in `app.js`. Both are valid *but neither is GPU elapsed time*. `renderer.info.render.frame` counts renderer submission; it cannot prove composition or encoder completion.
- Prior **Round 48** receipt reported a **single** direct-render sample **11 ms**, rendered direct buffer **420,529 pixels** (650,000-pixel software cap) and foreground callback-delivery p95 **2,366.6 ms**. They are not a controlled matched per-frame decomposition. They establish a serious gap in attribution, not proof that software raster is the dominant cost.
- Prior **Round 57** GitHub Actions artifact `13083021022` contained real Chromium Dungeon scene WebM (13.72 s, 25-fps nominal timestamps, 343 decoded frames). At 160×90 grayscale with mean-adjacent-pixel absolute-change threshold 0.45, **324/342 adjacent pairs looked near-static** and **18/342 showed a perceptible difference**. A static room, intentional holding pose, compression and recording duplicates all affect this metric. This is **not** 18 actual rendered frames and not a claimed gameplay FPS. Recording provenance: [Round 57 run 41304068008](https://github.com/my-edutu/Ai_games/actions/runs/41304068008), source commit `ebf79ead8c1e988c816d7f17e64e7d8a4d81b256`, not the current PR head.
- Current PR head workflows were queued when inspected. No hardware GPU p95/p99, real source-frame rate under matched source recording or authoritative-state loss rate was measured here.

## Change: source-coupled manual video frames, not timer-generated fakes

`capture-dungeon.cjs` instruments the **unmodified actual Dungeon WebGL scene** through a local test browser and captures `canvas.captureStream(0)` and `CanvasCaptureMediaStreamTrack.requestFrame()` **only when a new renderer frame ID appears**. This replaces using a nominal 25-fps Playwright WebM file as direct proof of motion. It does not fabricate game state, actors, contact frames or extra simulation ticks.

The source ledger captures bounded timestamps, renderer IDs, synchronization wall-time, foreground callback wall-time, draw calls, triangles, current framebuffer pixels, scene frame index, genuine public state (run, tick, floor), and manual recorder frame requests. The independent Chrome Performance domain records cumulative CPU task, script and layout time, JS heap and DOM node counts, *not GPU/compositor timers*. Video bytes, stop confirmation, frame request failure and track disposal are separately reported. All observations have fixed upper bounds (2,400 per bounded list, 24 MiB recorded chunks, 45-second limit).

The capture CLI uses actual seeded `DungeonRuntime.create(seed).step().publicState()` snapshots through existing `/dungeon/state`, on a reproducible 350-ms authority clock (matching the server tick, independently of its 190-ms HTTP poll) for two different fresh browser contexts. **Source input sequence matches; callback scheduling and rendered snapshot subsets are not guaranteed identical.** `--live` uses the real advancing server and explicitly marks scenes unmatched. Recording success and source draw completion remain independent acceptance gates.

**No gameplay production source, renderer resolution policy, camera, art, HUD, authority, boss logic, persistence, AI, hazard rules or WebGL assets were modified.** Renderer performance optimization must wait for matched evidence showing which cost dominates. `postfx-budget.js` does not need a speculative rewrite; the existing dirty-wall instance matrix cache is already present in the current source.

## How to run locally against the exact checked-out PR

From the project root after `npm ci` and `npm run dungeon:assets`:

```bash
npm run build
node scripts/serve-dungeon-stream.cjs --port=4181
# Separate shell: identical precomputed genuine authority snapshots, desktop
node scripts/m1-parallel/D01/capture-dungeon.cjs --seconds 12 --seed d01-benchmark --advance 18 --out artifacts/d01-desktop
# Genuine authority at mobile resolution
node scripts/m1-parallel/D01/capture-dungeon.cjs --seconds 12 --seed d01-benchmark --advance 18 --out artifacts/d01-mobile --mobile
# Unmodified live server (explicitly unmatched; check actual tick rate)
node scripts/m1-parallel/D01/capture-dungeon.cjs --seconds 12 --live --out artifacts/d01-live
# Decode actual recording; never equate nominal WebM FPS with source motion
node scripts/m1-parallel/D01/video-frame-audit.cjs artifacts/d01-desktop/d01-world-manual-frames.webm
node --test tests/foundation/dungeon-m1-d01-capture-ledger.test.cjs
npx playwright test -c scripts/m1-parallel/D01/dungeon-d01.playwright.config.cjs
```

`capture-profile.json` splits unrecorded and recording trials. Compare their **actual render-submission interval p50/p95/p99**, **callback wall times**, **synchronous render cost (software-WebGL only)**, Chrome CPU script/task/layout counters, resource accounting, public tick progression and frame requests/encoded file. The A/B in this script is *recorder off versus recorder on at the same source commit*, **not** a code-before/code-after performance improvement claim. A real code-before/code-after must pin separate commit SHAs and use the same seed/viewport/driver/window with sufficient repeats.

## Test evidence acquired without live repository access

- **7/7 Node foundation tests passed** locally, including red-then-green CDP counter contract, bounded args, frame ID de-duplication and real run-restart accounting.
- Isolated Chromium **canvas capture mechanism smoke test** passed locally with a genuine onscreen moving **2D** test canvas (not the Dungeon): 132 observed drawn frames, 132 manual `requestFrame` requests, 132 actually decoded output frames, 57,075 encoded bytes, recorder stopped, media track ended, 0 page errors. This validates recorder plumbing only, **not real 3D rendering speed or preserved hero motion**. Chrome GPU/WebGL was unavailable in that isolated container; the genuine Dungeon browser test could not execute.
- New **separate** real-Dungeon Playwright test requires advancing true `DungeonRuntime` snapshots, actual renderer submissions, distinct recording requests, non-empty encoded WebM, stopped tracks and no browser exceptions. It has been syntax checked but **not run against the repository**. The existing global browser test discovery configuration was deliberately not changed.

## Resource accounting and unverified acceptance gate

| Metric | Captured | Limit / interpretation |
| --- | --- | --- |
| Simulated ticks, runs, floor | Real public snapshots delivered to page | No modifying authority; restart distinguished from rollback |
| Render submission IDs and intervals | JS update of `__DUNGEON_RENDER_DIAGNOSTICS__` | 2,400 observations maximum, not GPU completion |
| JS callback wall-time, Chrome CPU counters | rAF wrapper and CDP Performance | Not browser composition or GPU/encoder CPU |
| Direct render synchronous wall | Scene's existing telemetry | Only on reported software WebGL; still not a GPU timer |
| Draw calls, triangle count, framebuffer pixels | Three.js existing telemetry | Sampled at last submitted frame, not frame-wide peak |
| Encoded WebM, requestFrame count | MediaRecorder + manual track | 24 MiB encoded memory budget; must audit actual decoded output |
| Recording duration | CLI 3–45 seconds | Session bounded, track explicitly stopped |
| WebM near-static picture pairs | ffmpeg downsample | Visibility heuristic, not live source FPS |

Before any performance claim, acquire reproducible screenshots and **real uninterrupted motion** for: 1) Day-1 / floor-one exploration; 2) continuous genuine combat; 3) actual Warden hazard and damage; 4) floor transition; 5) 390px mobile. Match seed/ticks/driver/viewport, record at least 3 repeats per condition with recorder on/off and exact source IDs. Identify dominant CPU/render/GPU/compositor/encoder cost using browser profiler and GPU timer **where available**. Test true authority run/tick progression, actor count and drawing fidelity. Reject an FPS improvement gained by hiding actors, disabling hazards, skipping authority, reducing essential quality or artificially increasing timeouts.

**Current verdict: CAPTURE CORRECTION READY FOR REAL-DUNGEON TESTING; PERFORMANCE IMPROVEMENT NOT ESTABLISHED.** The PR remains draft. Local workspace tunnel disconnection blocked integration and real-game A/B, so no GitHub branch or main was mutated.
