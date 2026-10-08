# Marble Survival — Gauntlet run log

**Baseline:** `agent/marble-survival-2-5d-mainline` / PR #38. This baseline is a WebGL2 presentation on top of a fixed-step deterministic tournament. It is **not** proven visually equivalent to commercial references, and its authority is **not** a full vertical rigid-body 3D simulation.

## Inspectable standards

- **Primary visual:** Marble It Up! Ultra — compare actual 3D sphere detail, lighting, arena construction, moving machinery, camera composition and effects.
- **Primary experience:** Marbles on Stream — compare actual autonomous tournament legibility, eliminations, streamer controls and viewer entertainment.
- **Optional obstacle-showmanship:** Fall Guys — comparison of elimination timing and readable obstacle silhouettes, not a mandate to copy proprietary art.

Only compare real captures at identical or documented viewport and quality settings. Never confuse CSS concept art, source tests, mockups, or render predictions with real gameplay. Score mechanics separately from visual presentation. Do not proclaim a win unless blinded independent reviewers consistently select the candidate.

## Current delivered passes (2026-10-08)

| Pass | Implementation | Current proof | Critic's open challenge |
| --- | --- | --- | --- |
| 1 · Character optics | Clearcoat specularity, fresnel edge light, secondary illumination and rolling internal ribbons in WebGL shader | Source exists, JS parse checked | Compare screenshots of different identities against Marble It Up! Ultra; fix muddy/dull/rubber-like material |
| 2 · Measurable rendering | Real FPS samples, draw calls and triangle counts broadcast to a same-origin viewer page | Source exists, JS parse checked | Profile 1920×1080 and mobile GPU; verify no frame regressions |
| 3 · Tournament arena | Quality-scaled stands, emissive rails and floodlight gantries outside collision geometry | Source exists, JS parse checked | Browser-review occlusion, camera framing, arena visibility and readability |
| Lab | `/gauntlet.html` page, `/gauntlet-progress.json` status log, authority metrics refresh and sourced journal | Source exists, JSON shape checked | Run and screenshot dashboard + compare honest evidence |

**Unverified:** Visual parity, GLSL compilation on a live GPU, Playwright browser results, game stability, screen captures, comparative critic verdict, source-test pass in CI, and actual FPS on target devices.

**Still missing:** authoritative vertical 3D rigid-body simulation and collision, ramps/jumps as real physics, richer mechanical obstacles, cinematic replay system, audio and scene art maturity, long-session and accessibility evidence.

## Launch and view

From repository root on Node 22+:

```sh
npm ci
npm run build
node --test tests/foundation/marble-gauntlet.test.cjs tests/foundation/marble-3d-presentation.test.cjs
node games/marble-survival/scripts/serve-complete-runtime.cjs --self-test
node games/marble-survival/scripts/serve-complete-runtime.cjs
```

Open `http://localhost:4317/` for the actual game and `http://localhost:4317/gauntlet.html` for the live lab. Open both tabs on the same origin to observe broadcast FPS. If the actual arena falls back to Canvas 2D, FPS is intentionally unavailable, not fabricated.

The lab reads `/api/snapshot` every 2 seconds, source-backed progress JSON every 15 seconds, and live WebGL performance messages when a running arena tab is open. Iteration status is **explicitly committed to source**, not automatically asserted by agents or manufactured by the dashboard.

## Required next builder / critic cycles

1. **Run** the real server and inspect desktop + mobile viewport screenshots, video, shader compilation, authority/HUD parity, native frame time, FPS, and draw calls.
2. **Blind A/B:** strip brand labels; compare equivalent race camera scenes against the two reference games; have an independent critic pick the biggest perceptual/gameplay mismatch with evidence.
3. **Fix one judged gap**, add a focused regression check, update `gauntlet-progress.json`, capture before/after evidence and repeat.
4. **Keep authority honest:** presentation can decorate positions, but cannot fabricate a marble's outcome, obstacle collision or terrain height.
5. **Never close visual acceptance** on source checks alone. The user can stop the loop at any time.

## Repository safety

This Gauntlet branch is based on PR #38's isolated Marble implementation, not current `main`. Bring it into that PR's base branch after review, then resolve any divergence with current main separately. Do not blindly merge old game revisions over newer Eko or unrelated projects.
