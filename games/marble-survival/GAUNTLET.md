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
| 4 · Camera | Frame-rate-normalized pursuit easing for server camera directives | Source exists, JS parse checked | Confirm the camera remains stable during cut-line and victory transitions at 30/60/144 Hz |
| 5 · Label/renderer parity | Exact WebGL matrix and interpolated 3D positions drive projected competitor labels; authority/HUD tick data exposed | Source logic and headless assertions added | Verify labels stay locked in recorded moving-camera frames and after tournament restarts |
| CI browser evidence | Push/PR workflow builds authority and runs Playwright screenshots, logs and metrics | Workflow queued; **not a browser pass** | Read artifacts and reject any rendering or clip-space mismatch |
| 7 · Volumetric impact | 3D fixed-point sphere overlap, vertical bounce momentum, airborne clearance above low obstacles | Tests committed, browser results pending | Confirm no phantom collisions and preserve 32-marble tournament balance |\n| 9 · Champion reveal | Animated 3D gold-ring podium and orbiting crown placed around the real authority champion | Source check committed; browser screenshots pending | Blind-review readability, premium optics, scene occlusion and performance |\n| 8 · Spring survival | Later-round electric bumpers, vertical launch and gameplay-backed event/VFX/audio | Tests committed, screenshots pending | Verify launch arc, audio timing, broadcast camera and competition fairness |\n| 6 · Critic workstation | Local PNG/JPEG/WebP import, cryptographic A/B shuffle, manual winner/tie vote, gap notes and JSON export | Source implemented; browser UI check pending | Review independent critics' verdicts against real reference images; same-image smoke test is not a quality comparison |
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

## Loop 5 findings

The original identity layer independently fetched state and reconstructed its own camera. That could make numbered competitor tags drift away from marbles during a cut-line or victory camera move, especially across slow frames or ramp elevations. The renderer now publishes its exact current public snapshot, interpolated marbles and WebGL view-projection matrix to the in-page overlay. The overlay projects labels through that same matrix and uses the same elevation. It retains a polling fallback if the renderer has not produced a fresh frame. The HUD and renderer now expose source-backed tick and arena identifiers for browser tests.

A new GitHub Actions workflow is triggered by pushes to the Gauntlet branch and pull requests against its Marble base. Its pass/fail result is independent evidence; it does not by itself establish visual parity with commercial references.

## Loop 6 — Manual blind comparison

The Gauntlet Lab now includes an on-device A/B critic workstation. Use actual game output from the browser evidence artifacts and a lawful reference screenshot at a comparable camera angle. It randomizes image A/B positions, hides identity labels until the vote and records the strongest visual deficiency. Critic votes and the optional note remain in local storage; use the JSON export to share review evidence. No images are uploaded, no score is manufactured, and merely using the tool does not count as an independent blind visual pass.

## Loops 7–8 — What changed and what remains

The original vertical physics implementation already had ramp heights, gravity and a vertical velocity field but its marble-to-marble collision ignored most height differences. Loop 7 preserves the planar solver for co-height contacts while using full fixed-point 3D sphere distances when two competitors differ in height; non-grounded vertical impulses are replay deterministic and capped. It also makes low blocks, sweepers and bumpers non-collidable when a marble's bottom has cleared their physical top. This does **not** make the entire level a rigid-body 3D world: upper-face contact and moving swept volumes are still incomplete.

Loop 8 builds gameplay atop those capabilities: selected bumpers in the later rounds have bounded, genuinely authoritative vertical launch speed; only an approaching grounded contact launches. The generated bumpers are visually distinguished in the WebGL scene. A new sanitized `marble-launched` authority event drives turquoise VFX, a spatial rising launch cue, and broadcast reporting. The state and presentation layer expose launch metadata without inventing outcomes. A later same-tick authoritative spring launch is retained over an earlier no-impulse overlapping contact in the bounded contact recorder.

**Versioning caveat for promotion:** changing collisions changes deterministic outcomes. Keep this on a draft branch until snapshot/replay compatibility is explicitly versioned or migrations/replay gating are arranged; do not silently promote old stored tournament replays as identical.

**Evidence caveat:** source test cases were committed but the real Node/Chromium suites have not been observed completing in this session. Do not infer 3D correctness or visual parity from their existence.

## Loop 9 — Champion showmanship

The WebGL director now renders a quality-scaled, three-dimensional gold-ring ceremony around a winning marble only when the authority explicitly reports a champion and a resolved/intermission lifecycle. It does not relocate or fabricate the winner. Record real output across normal and clean-feed variants before accepting the result.
