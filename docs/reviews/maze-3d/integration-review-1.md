# AI Maze Escape 3D — independent integration review 1

Date: 2026-10-30. Reviewer: integration_critic. Base: `d1678cd`.
Candidate: `.superpowers/sdd/2026-10-30-ai-maze-escape-3d/integration-review.patch`.
SHA-256: `511fca78096b78c99bb273578419d086f4c7fbe965a6a71ab56256bd468bd3cc`.
Reviewed a frozen reconstruction in `/tmp/maze-integration-review-1`; findings refer to that patch, not subsequent builder repairs.

## Verdicts

**Specification: FAIL for the frozen candidate.** Acceptance 5 has an unbounded graphics recovery state; acceptance 7 drops a recorded independent verdict; acceptance 8 lacks regressions for the new failure/recovery and full run transitions. Acceptance 6's measured repeat-run resource/frame evidence remains pending in this candidate. The browser suite running concurrently was not rerun or assumed passing.

**Engineering quality: CHANGES REQUIRED.** Public-snapshot consumption, route interpolation, explicit asset routing and ordinary resource ownership are sound on inspection. Repair the concrete defects below and verify the repaired candidate. This is not an R5 review or a visual-parity verdict; the fixed Nintendo comparison remains open.

## Findings, ordered by severity

### P1 — Context loss can strand output indefinitely

**Location:** `public/ai-maze-escape/scene.js:217-223`, `scene.js:147`; host `app.js:29-33,82-92`.

Loss sets `lost=true`; every subsequent render returns. Recovery depends entirely on a future `webglcontextrestored` event. There is no watchdog, finite retry, fallback activation, or viewer retry control. If the context is permanently lost, the viewer stays on the restoring slate and a frozen/blank canvas while authority continues indefinitely. Initial WebGL failure does have a map fallback, but this runtime-loss path never reaches it.

**Reproduce:** Load the live renderer; invoke `WEBGL_lose_context.loseContext()` and do not restore it (or simulate permanent graphics-device failure). Public ticks continue, while renderer frames stop and the restoring slate never transitions. Static control-flow inspection establishes the missing timeout; no browser was started during root capture.

**Required repair/retest:** Bound waiting for restoration, retain an explicit live map after failure, and provide a controlled reconstruction/retry path. Inject both temporary and persistent loss; assert live public updates, eventual usable output, and single polling/RAF ownership.

### P2 — Fallback/recovering status hides authoritative outcomes

**Location:** `public/ai-maze-escape/app.js:29-40`.

Renderer-state branches precede result/intermission branches unconditionally. A real escape while in fallback continues to show “Map view is available” with “The live explorer continues,” instead of the result. The graphics explanation remains a centered obstruction on the fallback map.

**Evidence:** Executed the exact `refreshSceneCard` function in a lightweight VM with the same escape snapshot: ready displayed “A way through”; fallback displayed “Map view is available”; recovering displayed “Restoring the 3D view.”

**Retest:** Feed production result/intermission/restart frames in no-WebGL and lost-context modes. Preserve outcome clarity alongside graphics status and leave the live map usable.

### P2 — The new steps counter becomes false after 239 moves

**Location:** `public/ai-maze-escape/app.js:53`.

“Steps taken” is `travelledRoute.length - 1`, but the public route is intentionally capped at 240 by `games/ai-maze-escape/src/presentation/snapshot.ts:5`. It stops at 239 for every longer run and undercounts immediately when a viewer joins late.

**Evidence:** Executed 260 accepted alternating legal moves through production `applyMazeAction`, then production `buildMazeRenderSnapshot`: authoritative steps 260; public route length 240; displayed steps 239.

**Retest:** Expose only the existing cumulative public presentation statistic (or truthfully relabel the metric); verify a late join after 260+ moves and a new run resetting it.

### P2 — Production loss reasons never select the loss pose

**Location:** `public/ai-maze-escape/characters.js:82-86`; `scene.js:163-165`; related message `app.js:40`.

The host passes the authoritative reason string. Actual reasons are `capture`, `trap-death`, `timer-expired` and `stagnation`; none occurs in the character loss whitelist. The capture-specific UI also checks `captured`, which is not emitted by production.

**Evidence:** Imported the frozen character module with the existing Three dependency and exercised actual model updates. Every production loss produced torso pitch 0 and eye scale 1; the artificial `failure` token produced the intended .19 pitch and .32 eye scale.

**Retest:** Exercise every production terminal reason through the host/model boundary and confirm the intended terminal pose and capture caption.

### P2 — Progress page labels an independent verdict “Unreviewed”

**Location:** `public/ai-maze-escape/progress.js:50-52`; `progress.json:46-53`.

The stored review has `verdict: "Reference wins"`; the UI reads only `review.status`, falling back to “Unreviewed.” This suppresses the actual independent decision in the required public progress surface.

**Evidence:** Direct evaluation of the shipped record and UI expression yields stored verdict “Reference wins,” displayed status “Unreviewed.”

**Retest:** Render the actual JSON record and assert its independent verdict appears, preserving separate benchmark and verification status.

## Boundary and coverage assessment

- **Privacy/truth:** No new private authority/world imports, seed inference, or undisclosed entity construction found. World geometry derives from disclosed cells and edges; threats derive from visible public threats. Minimap and scene public data remain presentation-only.
- **Routes:** `planPublicMotion` retains observed bends, rejects undisclosed/nonadjacent/unconnected segments and snaps across missing continuity/run changes. The queue is bounded. No additional concrete wall-crossing issue found.
- **Resources:** World geometry/material/texture sets, instance replacement, character disposal, route geometry disposal, audio voice cap/deduplication and histories are bounded on inspection. This does not substitute for repeated-run/context-loss browser memory measurement.
- **Asset server:** Named Three modules and public files are mapped explicitly; the capture basename regex disallows directory traversal. Existing CSP is maintained. No introduced server asset boundary defect found.
- **Tests:** The seven new pure path tests meaningfully exercise route legality. The four new browser tests verify scene existence, basic controls, portrait sizing and progress text, but do not cover WebGL loss/restoration, permanent failure, audio start/mute, result/restart, or repeat-run resource stability. Existing slow-response testing checks serialized polling. Add focused regressions for repaired findings rather than broad redundant reruns.
- **Evidence limits:** Existing 21 focused checks were supplied as prior evidence; no unnecessary rerun or Chromium session occurred. Code inspection cannot establish camera occlusion quality, audio mix quality, actual mobile legibility, GPU performance, or reference parity. Those remain capture/listening/measurement gates owned by the integrated review.

