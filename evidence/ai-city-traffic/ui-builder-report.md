# Junction visibility and live entity inspection — 2026-10-30

## Promoted scope

Promoted **only `public/ai-city-traffic/main.mjs`**, after staging in `/tmp/city-ui-round5` and verifying the served source still matched its base hash. No browser was launched. Index, styles, audio, world, authority, build, and tests were not modified. Root owns the coordinated actual captures and independent review.

## UI-08: View now exposes the selected crossing

The previous oblique camera was reproduced against actual Three.js and the current city world: 30 of the 32 tested junction/phone combinations had at least one blocked center or approach sample. J0's center ray met foreground tower metal at roughly y39.6, matching the critic's real screenshot.

View now frames a 66m ground span across the short viewport dimension, with a near-vertical sightline (about0.57° from vertical). It explicitly lowers OrbitControls' minimum polar angle to0.005 for this view, so the control clamp cannot silently restore an oblique position. Ordinary camera presets restore their previous0.12 minimum. J0 at390×844 frames at approximately(-72,172.412,-70.276), targeting(-72,0,-72). The same translated framing works at every crossing.

The persistent truthful queue summary, panel closing, canvas focus, and existing easing/reduced-motion behavior remain intact. No building or vehicle is hidden to make the view pass.

## New bounded operator command

```js
const snapshot = window.cityTraffic.getSnapshot();
window.cityTraffic.command({ type: 'set-paused', value: true });
window.cityTraffic.command({
  type: 'inspect-entity',
  entity: 'pedestrian', // or 'vehicle'
  id: snapshot.pedestrians[0].id, // a current numeric snapshot ID
  view: 'three-quarter', // optional; also front, rear, left, right
});
```

The command changes presentation only. It does not pause implicitly, advance/reset traffic, manufacture citizen statistics, replace models, or render an isolated asset. It validates the entity category, non-negative safe-integer ID, optional angle enum, and membership in the current snapshot before changing the camera. Existing ordinary camera commands/buttons exit inspection and restore their normal orbit limits and panning.

The initial camera is fitted to conservative model envelopes and the viewport. It prefers the road-facing side for a citizen's front three-quarter view. It checks at most16 candidate angles, with at most5 short rays per candidate through actual visible city geometry, from head/body/feet and side samples toward the candidate camera. Casting outward also catches a camera placed inside a building. Intersections within the inspected subject's own envelope are excluded; buildings, other models and scenery remain present. If no clear candidate exists, the command throws a readable RangeError rather than claiming a clear view or hiding geometry. The optional view is a preferred angle; a nearby clear angle can replace it when obstructed.

Inspection follows the selected entity's real x/z movement and supports orbit/zoom. It returns to aerial if that ID leaves the snapshot. Its initial clearance check is not a promise that a moving entity or manually orbited camera stays unobstructed forever. Pausing before comparison captures preserves a fixed authoritative pose.

`getDiagnostics()` now also provides `cameraTarget` and `inspectedEntity` (or null). Inspection diagnostics contain the actual entity type/ID, requested view, selected relative angle and `visibilityCheckedAtTick`; this records when visibility was checked without claiming continuously verified visibility. No new product HUD is added.

## Verification

- `node --check` passed on staged and promoted main.mjs.
- `/tmp/city-ui-round5/check-framing.mjs`: executes the production View function with real Three/OrbitControls and raycasts against actual city geometry. Before:30/32 views obstructed. After:32/32 clear, each with the center plus8 approach-lane samples; all samples inside the viewport. Sizes390×844 and320×700; all16 junctions. Evidence: `framing-red.txt`, `framing-green.json`.
- `/tmp/city-ui-round5/check-inspection.mjs`: executes production inspection/camera functions against the actual warm-start simulation snapshot and current world. Passed33 primary framings across390×844,320×700 and1440×1000 (six current citizens and one vehicle of each of the five current kinds per size),12 additional preferred-angle invocations, and3 wall-time transition checks. Passed15 invalid-input rejection checks. Restoring ordinary aerial controls resets inspection, distance limits and panning. Full serialized simulation is byte-for-byte unchanged. Evidence: `inspection-red.txt`, `inspection-green.json`; Node's ESM package-classification warning is isolated in `inspection-stderr.txt`.
- Root's prior real browser review closed earlier UI findings and passed40 checks plus the focused mobile test; those results predate this change. The new geometry/function checks are not browser screenshots or an independent visual pass.
- Cached1024 shadows, moving contact shadows, LOD camera options, paused rendering, actual diagnostics, fixed-step scheduling, audio and WebGL recovery paths are preserved.

## Current fingerprint and remaining review

`main.mjs`: `f049a496982483ab70b2b77eadc8f5768b86c46a6ff3c207563b985244365d6f`

The complete source/world/runtime identity for these checks is recorded in `/tmp/city-ui-round5/promoted-sha256.json`. Root should capture J0 after View at both phone sizes and inspect a paused current pedestrian/vehicle at matched scale. Actual pixels, character quality, UI quality and benchmark comparisons remain subject to the independent review; no commercial parity or production-readiness pass is claimed.

---

# Focused UI closure refinement — 2026-10-30

## Promoted scope

Prepared this change in `/tmp/city-ui-round4` while root's eight-test browser run was active. Verified the served files retained their exact base hashes while staging. After root reported **8/8 passing on the preceding integrated candidate** and gave GO, promoted only `index.html`, `styles.css`, and `main.mjs`. `audio.mjs`, simulation, world, server, and test files were untouched. No browser was launched for this refinement.

## UI-06: meaningful queue information when the map cue is covered or offscreen

The active overlay legend now contains a compact, persistent junction summary. It moves with the existing legend into the mobile Experiment sheet, so the same real data remain visible while the sheet covers the selected crossing. The summary is independent of the map projection and remains available if the busiest junction is offscreen.

Stable verification handles:

- `#queue-summary`: `data-junction` contains the actual signal ID; `data-queue` contains its actual queued count.
- `#queue-summary-location`: the matching ID plus a location derived from its real x/z quadrant, such as `J0 · Northwest`.
- `#queue-summary-count`: numeric queue count from the first positive maximum in `snapshot.signals`.
- `#queue-focus`: a native 44 px View button that closes the panel and centers an aerial camera on that actual signal. The city canvas receives focus so keyboard orbit controls remain useful.
- `#queue-callout-location`: the same signal ID in the spatial map label, allowing the summary and map cue to be matched without color.

When all signal queues are zero, the summary truthfully says “Junctions clear,” displays zero, and removes the unnecessary View action. Aggregate `metrics.queued` is not substituted for a junction queue. Queue counts are never hard-coded; tests should compare with the current authoritative snapshot, including if the parallel simulation work changes the startup count.

The previous data-layer gradient remains. Existing camera commands, authority commands, rendering diagnostics, fixed-step scheduling, recovery, and pause behavior are unchanged. The new camera View action uses the existing camera transition path and never changes simulation state.

## UI-07 and transient feedback polish

- Added a restrained light backing behind the daytime masthead and a dark backing for night. The backing is a pseudo-element, so existing masthead placement and phone clear-space geometry are unchanged. It does not add another backdrop filter.
- Gave the desktop orbit/zoom hint a small matching backing for contrast over street/building surfaces.
- While the mobile Experiment sheet is open, transient toasts appear at the top identity area instead of covering the sheet's roadworks control or lower copy. Native controls and the queue summary remain uncovered.
- Increased the panel's scroll padding to accommodate its sticky header plus the expanded queue key.

## Verification status

- Staged JavaScript syntax check passed.
- Staged HTML/DOM audit passed: 74 IDs, zero missing literal DOM references, zero duplicate IDs.
- Base-hash check passed immediately before promotion, preventing accidental overwrite of concurrent edits.
- Prior integrated candidate: root reported 8/8 real browser checks passed, including the previous paused-speed, Escape, 44 px, legend, and actual WebGL recovery cases. Those results predate this focused refinement.
- Root owns the new numeric-fallback regression and final uniform captures. Actual pixel visibility, offscreen fallback, 320 px layout, and View action should be judged from those new results. No new visual pass is claimed here.

## Promoted fingerprints

| Source | SHA-256 |
|---|---|
| index.html | `09e5e31da56dc46a97cdeadac1e6ae029b9bee7cfb0e39dfd9ddefc2bee52bdd` |
| styles.css | `41d8d8313313059f5578df05e956ae3415d3fc4abcfc6827fc2d10a893db18d5` |
| main.mjs | `0c8210d1e7d78d256f3e62961280835c961900d93bf5ac5db377aa6a12623f78` |
| audio.mjs | `9b797345abccb9b2a86bf4f49b9f8173349a88315ed0896361e22a7391d87eac` |

---

# UI review revision — 2026-10-30

This section supersedes the original implementation details below where stated. Product changes are limited to `index.html`, `styles.css`, and `main.mjs`; `audio.mjs` is unchanged in this revision.

## Findings addressed in source

- **Mobile scene salience:** removed the repeated district/kicker stack on phone screens, moved the compact statistics row to y=66, and reduced the persistent activity card to a 44 px event/flow strip. The four main scene tools and compass are authored at 44 px, starting at y=140. The expected clear central city band at 390×844 is approximately 470 px rather than the previous roughly 290 px; this is an authored-layout estimate awaiting a new rendered capture.
- **Touch targets:** mobile camera, pause, speed, scene, Experiment, panel-close, follow-next, and help-close targets are at least 44 px. The demand range input is 44 px tall, with a larger thumb. Below 361 px, Experiment uses its labelled icon while keeping the same accessible name and functionality, so its row can retain full-sized speed controls.
- **Queue legend:** the same `#overlay-legend` node moves into a sticky anchor inside the mobile Experiment panel while open. It returns to the HUD when the panel closes or the viewport widens. The active overlay replaces the compact activity strip on phones, giving the legend a reserved space. The old rule hiding the legend during experiments was removed.
- **Non-color overlay meaning:** the actual busiest signal receives one projected label with its real queued-vehicle count. It is absent when the overlay is off, no signal has a queue, or that signal projects outside the usable viewport.
- **Paused speed feedback:** paused state now announces “Speed set to N×. Resume to continue.” The command still leaves simulation ticks unchanged until resume.
- **Keyboard interaction:** Escape is handled before the editable/interactive-target filter, closes Experiment from its slider or policy buttons, and returns focus to the opener. Native help-dialog Escape is given priority and remains native. Opening Experiment with the keyboard deliberately focuses the demand slider.
- **Roadworks truth:** the help, activity-state, and toast copy now describe slowing traffic through a work zone, consistent with the authority's 3 m/s incident lane. No UI text claims a lane closure.
- **Street camera:** the preset is now `(28, 4.2, 112)` looking toward `(25, 2.8, -24)`. Street mode uses a closer-to-horizontal OrbitControls limit so it no longer raises the camera to roughly 12.5 m. Other modes retain their previous polar limit.
- **Camera/lighting latency:** transitions use wall-clock time since their request, not the bounded simulation delta. Camera moves complete in their declared 850/1050 ms presentation interval; lighting uses 650 ms. Low frame rates can delay when an image is actually painted, but cannot multiply a nominal transition's duration by advancing it only 0.1 seconds per frame. Follow easing uses independently bounded presentation time. Authoritative time remains fixed-step with the original ≤0.1 s scheduling contribution and 12-tick catch-up bound.

## Renderer changes explicitly preserved

Root's cached 1024 px static shadows, contact shadows for moving objects, camera-distance LOD options, paused on-demand rendering, adaptive pixel ratio, actual renderer/fps/resource diagnostics, and public authority API remain intact. No world file or simulation file was edited.

## Verification and actual run outcome

- `node --check public/ai-city-traffic/main.mjs` passed.
- DOM audit passed: 69 IDs, no duplicate IDs, no missing literal `$()` references.
- Ran the dedicated eight-test browser configuration once with root's authorization and exclusive browser slot.
- The first test failed before UI assertions because a concurrently edited world file referenced the undefined `addArchitecturalBuilding` function. The trace records the startup ReferenceError at world.mjs:462. This is a known shared-world startup failure, not evidence against a UI change.
- The actual pause/speed regression test **passed** in 30.9 seconds: the paused-speed message was correct, pressed state updated, ticks stayed fixed while paused, and resume advanced ticks.
- The run was intentionally stopped after identifying the shared-world startup defect. Final process status: exit 130; one startup failure, one passed test, one interrupted test, five tests not run. The interrupted experiment test is not a product failure.
- The browser process has exited. No second browser was launched, and no new mobile/camera screenshot was taken from the unsettled candidate. Root owns the final integrated rerun and uniform hashed captures once world files settle.

Trace of the observed startup defect: `ai-games-city-traffic/test-results/city-traffic-real-3D-city--21a6b-autonomous-traffic-advances/trace.zip`.

## Stable UI source fingerprints at handoff

| Source | SHA-256 |
|---|---|
| index.html | `d0662d2a2366ec6c39b9fc8f1f595ebbedf788ed5f1cf5fbc3c2d2bf67d3002a` |
| styles.css | `c19b438144c257ec991d6c15bce524448a6964469cc493ca311d02ecc529d73c` |
| main.mjs | `e0dc50b8e579baffb2e7c76caeab5a15c4e9ee1c3a46592ee5c6dd0cd9fefe1b` |
| audio.mjs | `9b797345abccb9b2a86bf4f49b9f8173349a88315ed0896361e22a7391d87eac` |

---

# City / Flow — interface implementation report

## Scope and ownership

Implemented only the assigned frontend files in `ai-games-city-traffic/public/ai-city-traffic/`:

- `index.html`
- `styles.css`
- `main.mjs`
- `audio.mjs`

No simulation, world, server, build, progress-page, test, or repository configuration files were changed. No commit was made.

Read and applied repository `AGENTS.md`, `skills/livestream-hud/SKILL.md`, `skills/game-audio/SKILL.md`, and `skills/game-creative-direction/SKILL.md`. No Game 11 phase/specification documents were present when the implementation began, so the root agent's explicit integration brief defined this work's interfaces.

## Creative and information hierarchy

The principal view is the real Three.js city. The UI uses compact off-white surfaces, dark green typography, jade selected states, and restrained amber congestion states.

The persistent information order is:

1. **City identity and goal:** City / Flow; Northshore coastal district; “Keep a city moving.”
2. **True progress:** active vehicles, completed trips, average speed converted to km/h, and queued vehicles.
3. **Current activity:** the latest bounded simulation event, signal policy, and rolling completed trips per minute.
4. **Viewer actions:** camera perspectives, pause, simulation speed, city experiment controls, day/night, junction queue overlay, audio, and help.

The public view does not display seed/hash/debug data or benchmark claims. The implementation does not assert a Cities: Skylines II comparison result. `Project progress` links to `/traffic/progress/` in the help dialog and startup error state.

The right-side experiment panel opens initially only at widths of at least 1050 px and heights of at least 660 px. On smaller screens it opens from the bottom dock. It replaces the intent card while expanded on narrow screens, preventing stacked panels from obscuring the city.

## Authoritative state integration

Imports are the agreed interfaces:

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWorld } from './world.mjs';
import { createTrafficSimulation, STEP_SECONDS } from './runtime/simulation.js';
```

The HTML import map uses `/traffic/vendor/three.module.js` and `/traffic/vendor/addons/`. `index.html` imports `main.mjs` dynamically and catches module/startup errors, ensuring a visible recovery action even if a required dependency fails to load.

The initial simulation uses seed 11026, demand 1, and adaptive signals. It advances 360 deterministic ticks before the initial render to populate the streets. The visible elapsed time includes those ticks; the UI does not pretend the run began at zero. A saved crash-recovery state bypasses this warm start.

Simulation scheduling uses `STEP_SECONDS` and an accumulator. The speed buttons change the amount of simulated time scheduled, never the fixed step. Catch-up is capped at 12 ticks per rendered frame; dropped debt is reported in diagnostics. Hiding the page or pausing clears the accumulator. Hidden-tab elapsed time is never used to advance the simulation when the page becomes visible.

HUD values are read from snapshots. The world receives the snapshot unchanged:

```js
world.update(snapshot, presentationElapsed, {
  night,
  trafficOverlay,
  reducedMotion,
  reducedFlashes: reducedMotion,
});
```

No rendering code mutates a simulation snapshot. Performance time controls only presentation, camera easing, and scheduling. Demand, policy, incidents, and resets dispatch simulation commands.

`queued` intentionally follows the simulation contract: stopped road vehicles plus waiting entry demand. The stat tooltip explains that meaning. `flow` is labelled rolling trips per minute. The overlay legend is **Junction queues: Clear → Busy**, matching the world's queue-pressure rendering; it does not claim to depict speed.

## Functional interactions

- Aerial camera: default position `(170,160,190)`, target origin, with a 1.25 camera-distance scale for portrait layouts.
- Street camera: `(28,8.5,112)`, looking along the street toward `(25,5,-38)`, with a 58-degree field of view.
- Follow camera: tracks an actual simulation vehicle; initially prefers an in-district bus, then an in-district vehicle. The selected journey changes automatically if the vehicle completes its trip. “Follow next” cycles actual active vehicles.
- Clicking a vehicle in the city selects its follow camera. Drag gestures do not select; multiple simultaneous touch pointers cancel click selection.
- Drag, scroll, pinch, and pan use OrbitControls. A drag exits follow mode immediately. The compass resets the aerial view.
- Pause/resume, 1× / 2× / 4× speed, demand 0.25–2, rush-hour toggle, adaptive/fixed-cycle signals, and roadworks affect the real simulation.
- Night mode changes scene lighting, sky, fog, exposure, and the world's night presentation.
- The traffic overlay is optional and reports queue pressure.
- The help dialog explains the goal, interactions, measurements, and shortcuts; it includes a real simulation restart.

Keyboard shortcuts: Space pause/resume; 1/2/3 cameras; F next vehicle; N day/night; O overlay; M audio; R reset view; ? or H help. Shortcuts skip input fields, native buttons, links, selects, and editable content. With the city canvas focused, arrow keys orbit and +/− zoom. Native dialog Escape handling remains intact.

Buttons have meaningful accessible names, native semantics, and pressed/expanded states. Keyboard focus is visible. The skip link moves to the main dock. Reduced-motion disables camera-transition easing and OrbitControls damping, as well as CSS motion, and is passed to world rendering. No auto-orbit runs.

## Renderer and lifecycle

The renderer uses ACES tone mapping, sRGB output, antialiasing, a 1.5 pixel-ratio ceiling, and 2048-pixel soft shadows. A hemisphere and warm directional light create the daylight presentation. At sustained measured frame rates below 29 fps for four one-second samples, the renderer lowers pixel ratio to 1; it does not change authoritative simulation logic.

The initialization overlay is dismissed only after a successful render. It shows activity without a fabricated percentage. WebGL context loss stops scheduling and presents a visible reload/recovery screen. Runtime rendering errors do the same. The current simulation is serialized into session storage when possible; recovery text accurately distinguishes whether a state was saved. Reload restores the saved state through `sim.restore`. Normal visits do not automatically persist/restore a previous run.

The page lifecycle disposes renderer resources, world resources, audio sources, controls, and event listeners on non-bfcache page exit. Bfcache returns reset the scheduling clock.

## Audio

Audio is off by default and starts only after an explicit sound-toggle interaction. The original procedural soundscape requires no third-party audio assets or network downloads.

- Coastal wind/surf noise is a bounded five-second buffer with a crossfaded loop.
- Traffic movement intensity and pitch derive from real active vehicle count and speed; follow mode uses the selected vehicle's speed.
- An emergency tone appears only near an actual emergency vehicle in a close camera view.
- UI changes use short, low-gain cues with cooldowns.
- Audio has ambience, movement, emergency, and UI gains, followed by a master compressor.
- Resource budgets are four continuous sources and at most six short voices.
- Pausing or hiding the page fades/suspends audio; resuming restores an already-enabled context.
- Optional audio exceptions disable that audio path and leave the traffic simulation running.

All cues have visible counterparts. No important information depends on sound. Audio diagnostics expose actual context state, enabled/suspended state, active voices, and a measured output-peak sample. Capture-chain loudness, headphone comfort, and long-session listening have not been measured by this subtask and are not claimed as passed.

## Verification handle

`window.cityTraffic` exposes ordinary operator functionality:

```js
cityTraffic.getSnapshot();
cityTraffic.getDiagnostics();
cityTraffic.serialize();
cityTraffic.command({ type: 'set-demand', value: 2 });
cityTraffic.command({ type: 'set-policy', value: 'fixed' });
cityTraffic.command({ type: 'toggle-incident' });
cityTraffic.command({ type: 'set-paused', value: true });
cityTraffic.command({ type: 'set-speed', value: 2 });
cityTraffic.command({ type: 'set-camera', value: 'street' });
cityTraffic.command({ type: 'set-night', value: true });
cityTraffic.command({ type: 'set-overlay', value: true });
```

The additional presentation commands use the same paths as the UI; they do not create test-only authority. Diagnostics include renderer calls/triangles/geometries/textures, measured fps, camera mode/position, paused/night/overlay/speed/reduced-motion state, WebGL/failure state, pixel ratio, dropped simulation debt, simulation tick, selected vehicle ID, audio health, world resource statistics, and recovery status.

`body[data-ready="true"]` and a `city:ready` event indicate a successful first render.

## Verification performed

- `node --check public/ai-city-traffic/main.mjs` — passed.
- `node --check public/ai-city-traffic/audio.mjs` — passed.
- Parsed HTML IDs and compared all literal `$()` references in main — passed: 66 IDs, 22 native buttons, zero missing DOM references, zero duplicate IDs.
- Inspected world queue-overlay implementation and corrected the UI legend to match its exact meaning.

## Integration evidence still owned by root

The frontend was completed while the simulation and HTTP runtime were being implemented in parallel. No running `/traffic/` endpoint was available to this subtask at handoff, so real browser behavior and rendered appearance are not claimed as verified here.

Root's next evidence should cover:

1. Successful real first render, no browser errors, and actual moving vehicles/citizens.
2. Pause tick invariance; speed/demand/policy/incident changes through native controls.
3. Aerial, street, and follow captures; check follow-camera occlusion near building corners.
4. 390 px layout, dock reachability, help dialog, panel scrolling, and zero horizontal overflow.
5. Reduced motion, hidden-tab accumulator behavior, and failure/reload recovery.
6. Audio enable/mute/pause behavior and nonzero measured audio output when enabled.
7. Actual night and junction-overlay rendering, avoiding unsupported benchmark claims.

The world agent was notified that a roadworks toggle needs a visible cone/barrier representation tied to the exact authoritative incident lane. The world agent requested its final location/schema from root/simulation ownership. This interface does not invent a closure location.
