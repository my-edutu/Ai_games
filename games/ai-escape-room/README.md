# Game 8 — AI Escape Room

**The Cipher Vault** is an autonomous escape-room game with a Three.js presentation. The Archivist investigates clues, collects tools, opens mechanisms and attempts to escape while viewers control the camera and presentation. The upgrade adds one developed 3D clockwork protagonist, furnished rooms, physical mechanisms, material maps and a game-focused interface. The authoritative rules and autonomous policy remain in the existing game runtime.

This is an active Gauntlet implementation, preserved in [draft PR #54](https://github.com/my-edutu/Ai_games/pull/54), stacked on [base PR #40](https://github.com/my-edutu/Ai_games/pull/40). The branch is `agent/escape-room-gauntlet-3d-20261030`. Round 05 adds grounded lighting, efficient stable-object batching, full mechanism inspection and a dedicated worker for live state transport. Capture and test manifests identify the exact source each result covers.

**The fixed quality bar from The Room 4: Old Sins remains unmet.** The [independent lighting critic](../../evidence/ai-escape-room/gauntlet/reviews/lighting-independent.md) preferred the new lighting over Round 04 in a concealed-source A/B comparison, but chose the commercial reference in a separate concealed-source comparison. A [separate inspection critic](../../evidence/ai-escape-room/gauntlet/reviews/inspection-independent.md) accepts the complete active vault mechanism in desktop and phone views. Authored room dressing and fine material/construction detail remain the largest visual gaps. These are accepted improvements, not a commercial-quality victory.

The latest Escape Room unit checkpoint is **102 passed, 0 failed**, and the worker-inclusive server self-test reports `ok: true`. Native Chromium evidence exposed false request timeouts when software rendering blocked the main thread; the replacement worker has passed the decisive completed-body/main-thread-stall regression. Remaining recovery, live desktop and full-room rendering-budget checks are undergoing independent acceptance. Historical browser results retain their original source boundaries in the [Gauntlet ledger](../../docs/gauntlet/escape-room.md).

## Run locally

Use Node.js 22 or newer and a browser with WebGL support. Run these commands from the repository root:

```sh
npm ci
npm run build
npm run escape-room:stream -- --port=4177
```

The `escape-room:stream` script also builds before starting. To start the server directly after a successful build:

```sh
node scripts/serve-escape-room-stream.cjs --port=4177
```

The server now defaults to **4177**; the explicit port above also matches the game-specific browser tests and capture script. Open [the game](http://127.0.0.1:4177/escape-room) or [the live progress page](http://127.0.0.1:4177/escape-room/progress). Three.js and the material maps are served locally; the game does not need a third-party asset request at runtime.

| Route | Purpose |
| --- | --- |
| `/escape-room` | Game view, Field Notes and viewing controls. |
| `/escape-room/progress` | Development progress page with dated renderer captures and review verdicts; refreshes its evidence data every ten seconds. |
| `/escape-room/progress/data` | Progress metadata from `evidence/ai-escape-room/gauntlet/progress.json`. |
| `/escape-room/state` | Current sanitized public render snapshot. |
| `/escape-room/replay` | Bounded window of public presentation frames. |
| `/escape-room/health` | Stream output health and safe-scene status. This endpoint is not a GPU performance measurement. |

The optional server environment variable `ESCAPE_ROOM_SEED` selects a reproducible stream seed. It remains server-side. The runtime advances independently of viewers and proceeds through result and intermission states into the next chamber.

## What is implemented

### One protagonist: the Archivist

The cast currently contains **one character**: a clockwork investigator with a ceramic body, brass structure, lens face, articulated grippers, instrument details and a carried archive pack. Its presentation reacts to observation, inspection, solving, danger, celebration and recovery. The character module also supports reduced motion. A character inspection camera is available from Viewing options.

The [Round 03 character closeup](../../evidence/ai-escape-room/gauntlet/captures/round-03/character.png) let the independent critic accept the Archivist as a developed stylized character. Round 04 revises the overview framing, successful-avatar staging and hover-cone visibility in response to that review. New [character](../../evidence/ai-escape-room/gauntlet/captures/round-04/character.png), [room](../../evidence/ai-escape-room/gauntlet/captures/round-04/room.png) and [result](../../evidence/ai-escape-room/gauntlet/captures/round-04/result.png) images document the changed source. The exact wall-side framing tests passed on Round 03; that earlier browser evidence does not automatically extend to later visual edits. Still images do not establish animation quality.

Rigid-part batching reduces the character's mesh submissions from **61 to 39** while preserving the sampled surfaces and bounds across nine pose scenarios. The [comparison record](../../evidence/ai-escape-room/gauntlet/reviews/archivist-efficiency-comparison.json) also records the increased geometry storage; it is not a frame-rate or memory-saving claim.

### Four seeded themes

The existing progression rotates through these theme variants. Seeds determine generated room content; these are not four separately authored, completed campaigns.

| Theme ID | Display name |
| --- | --- |
| `cipher-vault` | Cipher Vault |
| `clockwork-study` | Clockwork Study |
| `chromatic-lab` | Chromatic Lab |
| `archive-zero` | Archive Zero |

The 3D presentation includes paneled architecture, shelving, books, work surfaces, consoles, pedestals, lighting and an exit. The shaped writing bench, upholstered chair, differentiated mechanism stands and varied bookcases are visible in the [Round 05 furniture capture](../../evidence/ai-escape-room/gauntlet/captures/round-05/furniture.png). The lighting pass adds bounded cached static visibility/contact shading, corrects the timber grain scale and removes shiny ceiling patches. Mechanisms and clues occupy physical surfaces derived from the public presentation layout. Placement reserves stable slots before filtering visibility so revealing a clue does not move objects already in view.

Stable opaque components share material batches while their original transforms, bounds and picking surfaces remain available. Articulated components and the complete final-vault/exit assembly remain independent. This reduces submissions while preserving geometry; larger shared bounds can submit more offscreen triangles in closeups. The tradeoff is measured in the ledger.

### Eight mechanism families

`sequence-lock`, `symbol-cipher`, `shape-order`, `tool-dependency`, `switch-network`, `balance-clue`, `direction-pattern` and `final-vault` each have a physical presentation. Their moving parts display authoritative solved state; reduced motion reaches the corresponding pose without prolonged motion. Generated rooms can contain multiple instances of a family.

The interface presents the objective, actual solved/total count, time reserve, hazard state, inventory, discovered mechanisms and the Archivist's public intent. **All locks open** and **Escape confirmed** are distinct states: reaching 100% does not itself declare a successful escape. A successful result retains its public celebration signal through intermission; the physical exit, camera and UI consume that durable signal. The exact Node regression verifies that the real exit stays closed before the escape action and remains open through successful intermission. The Round 03 browser case also passes when polling skips the single result frame. The time reserve is a percentage of the simulation budget, not a wall-clock countdown.

## Viewing controls

These controls change presentation. They do not issue puzzle actions or alter the autonomous outcome.

| Control | Action |
| --- | --- |
| **Room** or `Escape` | Return to the room overview and leave automatic Follow. `Escape` also closes Viewing options. |
| **Follow** or `I` | Follow the current public mechanism focus. |
| Click or tap a mechanism; activate a discovered-lock button | Inspect that physical object. Manual inspection leaves Follow. Click empty canvas while inspecting to return to the room. |
| **Viewing options → Meet the Archivist** | Inspect the character. |
| **Sound** or `M` | Enable sound, then mute or unmute it. Audio starts after this explicit user gesture. |
| **Viewing options → Reduce motion** | Reduce camera, character and mechanism motion. The initial preference follows the operating system unless the URL explicitly overrides it. |
| **Viewing options → High contrast** | Enable the higher-contrast presentation. |
| **Viewing options → Hide interface** or `C` | Toggle the clean feed. **Show interface** restores the controls. |
| **Return to live** | Resume live polling after an evidence frame has been pinned. |

Buttons support keyboard activation and expose their current state. Preference changes update the URL. Supported flags are `muted=1`, `reducedMotion=1`, `highContrast=1` and `cleanFeed=1`; use `0` to disable an explicit preference. For example:

```text
http://127.0.0.1:4177/escape-room?muted=1&reducedMotion=1
```

The `evidence=1` flag identifies an evidence view and explicitly selects the main-thread transport used by capture fixtures. It does not pause the simulation by itself. Capture tooling pins a sanitized frame through `window.__ESCAPE_PRESENT_FRAME__(frame)` and returns through `window.__ESCAPE_RESUME_LIVE__()`. Pinned frames are marked **REPLAY** and stale in-flight live responses cannot replace them. Normal live viewing uses a dedicated worker to fetch and parse state under a 1,800 ms network deadline; completed transfers are not discarded because the renderer later blocks the main thread. Unsupported or blocked workers have a disclosed main-thread fallback. That fallback cannot provide the same isolation from rendering stalls.

## Autonomous authority and public privacy

The server owns the seeded simulation, legal actions, hazards, progression and result. The autonomous policy operates on its observation and discovered facts. The browser consumes immutable `escape-render-v2` snapshots; camera movement, sound and accessibility preferences do not change simulation state.

Public frames expose visible objects, inventory labels, progress, hazard presentation, a concise intent summary and sanitized event labels. They exclude private seeds and run IDs, hidden facts, puzzle solutions, oracle actions and internal decision traces. The replay route returns the same public contract rather than private engine checkpoints. The progress routes allowlist metadata and named PNG captures rather than serving the repository wholesale.

The renderer exposes an explicit `dispose()` lifecycle for its animation frame, event listeners, resize observer and owned rendering resources. On a full page exit, the `pagehide` handler stops polling, aborts the active request, retires the state worker, disposes the renderer and closes audio. The exact Node contracts pass. The Round 03 two-renderer browser lifecycle case verifies stopped callbacks, removed listeners, a lost retired context and shared assets remaining usable by the surviving renderer; that result predates the worker. Later resource and worker checks retain separate source manifests.

The focused public-contract tests compare deterministic runs with and without arbitrary presentation reads and output recovery. The server tests cover state/replay privacy, asset MIME types, malformed request targets and evidence-route traversal. Their retained results and limits are linked in the [ledger](../../docs/gauntlet/escape-room.md#recorded-validation).

## Assets and provenance

The nine bundled 1k material JPEGs come from Poly Haven under **CC0-1.0**: Wood Floor Worn by Dimitrios Savva, Grey Plaster by Rob Tuytel, and Rusty Metal 02 by Rob Tuytel. The [texture source notes](../../public/ai-escape-room/textures/SOURCE.md) explain color, normal, roughness and packed-map interpretation. The [source manifest](../../public/ai-escape-room/textures/sources.json) preserves official source/API URLs, authors, byte counts, source MD5 and local SHA-256 for each file.

Commercial reference screenshots are evaluation material. They are not bundled into or requested by the game. Their URLs, roles and hashes remain in [references.json](../../evidence/ai-escape-room/gauntlet/references/references.json). Downloaded commercial media, source HTML and contact sheets are ignored by Git. The game's own captures, reviews and provenance JSON remain eligible for version control.

## Focused validation

Build first, then run the Escape Room unit and contract suite and server self-test:

```sh
npm run build
node --test --test-concurrency=1 tests/escape-room/*.test.cjs
node scripts/serve-escape-room-stream.cjs --self-test
```

For the upgrade-specific model, mechanism, terminal-transition, disposal, privacy, placement and server checks:

```sh
node --test tests/escape-room/archivist3d.test.cjs tests/escape-room/mechanisms3d.test.cjs tests/escape-room/gauntlet-escape-transition.test.cjs tests/escape-room/gauntlet-renderer-lifecycle.test.cjs tests/escape-room/gauntlet-public-contract.test.cjs tests/escape-room/gauntlet-server.test.cjs
```

Install Playwright's Chromium once, then use the isolated Escape Room configuration. It starts the port 4177 server when needed, uses one worker and gives each test 120 seconds. Chromium uses WebGL-only SwiftShader (`--use-angle=swiftshader-webgl`); automatic trace screenshots are disabled to reduce contention on this host, while action/DOM traces and explicit captures remain available:

```sh
npx playwright install chromium
npx playwright test --config=playwright.escape.config.cjs
```

For just the Gauntlet browser regressions:

```sh
npx playwright test --config=playwright.escape.config.cjs tests/browser/escape-room-gauntlet.spec.cjs
```

The ten-case file checks real autonomous snapshots, batched Follow/escape events, manual viewing controls, maximum mechanism counts, the WebGL fallback, repeated theme changes, character framing, raw WebGL buffer cleanup, skipped-result intermission and renderer disposal. The [integration review](../../evidence/ai-escape-room/gauntlet/reviews/integration-review.md) records nine Round 03 passes and the separate successful Round 04 resource rerun. The original ten-case report retains its one timeout. The wider game-specific configuration also runs the original stream, camera and evidence-pinning checks; the added cases do not establish a pass for all those separate gates.

The retained [original desktop broadcast failure](../../evidence/ai-escape-room/gauntlet/reviews/browser-round04-desktop-red.txt) reads the same tick value after a fixed 700 ms wait. Subsequent native probes established a real main-thread request-timeout race and separately measured an over-budget late room before batching. The test now waits for actual public run-token/tick advancement and matching UI instead of assuming a 700 ms wall-clock cadence. Its 190-submission/150,000-triangle gates are unchanged. A worker and geometry-preserving batching address the measured defects; independent acceptance is in progress.

The latest full Node run is [102/102](../../evidence/ai-escape-room/gauntlet/reviews/unit-regression-round05-worker.txt). It includes exact geometry batching, full inspection bounds, sealed-door geometry, worker deadlines, cancellation, startup failure and cleanup. The [worker-inclusive server self-test](../../evidence/ai-escape-room/gauntlet/reviews/server-self-test-round05-worker.json) is separately scoped. Earlier 67-test, focused and browser runs remain historical evidence; overlapping totals are not added.

The Round 04 resource scenario renders **65 actual frames across five cycles and four themes**. Its samples stay flat at **158 geometries, 21 textures and 13 programs**. The earlier Round 03 raw-buffer test separately stays at **348 outstanding buffers in each of six cycles**. The resource rerun pauses successor animation frames between scripted calls to the real frame method; the full lifecycle case exercises a live animation-frame loop. These checks assess within-run growth and cleanup, not native-GPU throughput or a production soak.

To reproduce comparison captures, keep the game server running on port 4177 and choose a new, unused capture label:

```sh
node scripts/capture-escape-gauntlet.cjs local-review
```

The script runs the autonomous engine, pins its actual public opening/mechanism/result frames and saves room, furniture, character, mechanism, result, mobile and mobile-inspection captures plus a report under `evidence/ai-escape-room/gauntlet/captures/<label>/`. It uses reduced-motion poses and the renderer's low quality tier, calls the real frame method and pauses the animation-frame loop for each stable SwiftShader still. **FPS is deliberately not measured.** Reusing a label overwrites its captures, so retain reviewed evidence under its original label.

The retained [Round 05 report](../../evidence/ai-escape-room/gauntlet/captures/round-05/report.json) records an actual eight-puzzle escape at tick 25, score 5,240 and an empty captured-error list. Its [source manifest](../../evidence/ai-escape-room/gauntlet/captures/round-05/source-manifest.json) binds the captured lighting, batching and inspection revision. Those images precede the sealed-jamb and dedicated-worker changes, so they do not certify those later changes.

| Round 05 still | Draw submissions | Triangles | Quality tier |
| --- | ---: | ---: | --- |
| Room | 112 | 115,832 | Low |
| Result | 120 | 118,316 | Low |
| Desktop mechanism | 41 | 89,234 | Low |
| Phone mechanism | 40 | 89,202 | Low |

These are the actual renderer counters for the captured views, not FPS measurements. Review verdicts bind to image hashes. These captures and software-rendered checks do not establish continuous animation quality, native-GPU frame rate, GPU memory bytes, long-run stability or production capacity.

## Continue the Gauntlet

The lead agent maintains the [ledger](../../docs/gauntlet/escape-room.md), live progress metadata and [draft PR #54](https://github.com/my-edutu/Ai_games/pull/54). Independent builders and critics work on separately judgeable pieces. Each critic inspects real output against the fixed reference, uses blind A/B comparison when feasible and returns the largest remaining gap for another iteration. Round 05's accepted lighting and inspection improvements are retained. New map-storage/specimen-cabinet dressing and finer asset finish are in scratch review and remain outside the captured checkpoint until integrated and rendered. The commercial bar remains unmet. No Ultracode tool was available in this session; subagents performed the builder and critic work.
