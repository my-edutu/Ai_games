# Game 8 — AI Escape Room

**The Cipher Vault** is an autonomous escape-room game with a Three.js presentation. The Archivist investigates clues, collects tools, opens mechanisms and attempts to escape while viewers control the camera and presentation. The upgrade adds one developed 3D clockwork protagonist, furnished rooms, physical mechanisms, material maps and a game-focused interface. The authoritative rules and autonomous policy remain in the existing game runtime.

This is the **Round 03 source checkpoint** of an active Gauntlet iteration. The new build won the chronology-blinded room, mechanism, mobile and result comparisons against the baseline. **The build still fails the separate fixed quality bar from The Room 4: Old Sins.** The [independent review](../../evidence/ai-escape-room/gauntlet/reviews/round-03-independent.md) and [subsequent unblinding](../../evidence/ai-escape-room/gauntlet/reviews/round-03-unblinding.json) preserve those two distinct judgments. The work does not establish commercial visual parity, production readiness or a performance target.

The retained Escape Room unit checkpoint is **65 passed, 0 failed**, and the server self-test reports `ok: true`. The **ten-case Gauntlet browser suite is still in progress**; no final browser pass is claimed. The [Gauntlet ledger](../../docs/gauntlet/escape-room.md) records the evidence, regression status and remaining acceptance work.

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

The [Round 03 character closeup](../../evidence/ai-escape-room/gauntlet/captures/round-03/character.png) let the independent critic accept the Archivist as a developed stylized character. Its room-wide and result presentation still needs work: the overview clips most of the character, the result stages it high against a shelf, and the hover cone remains conspicuous. The still does not establish animation or interaction quality.

Rigid-part batching reduces the character's mesh submissions from **61 to 39** while preserving the sampled surfaces and bounds across nine pose scenarios. The [comparison record](../../evidence/ai-escape-room/gauntlet/reviews/archivist-efficiency-comparison.json) also records the increased geometry storage; it is not a frame-rate or memory-saving claim.

### Four seeded themes

The existing progression rotates through these theme variants. Seeds determine generated room content; these are not four separately authored, completed campaigns.

| Theme ID | Display name |
| --- | --- |
| `cipher-vault` | Cipher Vault |
| `clockwork-study` | Clockwork Study |
| `chromatic-lab` | Chromatic Lab |
| `archive-zero` | Archive Zero |

The 3D presentation includes paneled architecture, shelving, books, work surfaces, consoles, pedestals, lighting and an exit. Mechanisms and clues occupy physical surfaces derived from the public presentation layout. The placement correction reserves stable slots before filtering visibility so revealing a clue does not move objects already in view.

### Eight mechanism families

`sequence-lock`, `symbol-cipher`, `shape-order`, `tool-dependency`, `switch-network`, `balance-clue`, `direction-pattern` and `final-vault` each have a physical presentation. Their moving parts display authoritative solved state; reduced motion reaches the corresponding pose without prolonged motion. Generated rooms can contain multiple instances of a family.

The interface presents the objective, actual solved/total count, time reserve, hazard state, inventory, discovered mechanisms and the Archivist's public intent. **All locks open** and **Escape confirmed** are distinct states: reaching 100% does not itself declare a successful escape. A successful result now retains its public celebration signal through intermission; the physical exit, camera and UI consume that durable signal. The exact Node regression verifies that the real exit stays closed before the escape action and remains open through successful intermission. The skipped-result browser scenario remains part of the pending run. The time reserve is a percentage of the simulation budget, not a wall-clock countdown.

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

The `evidence=1` flag identifies an evidence view. It does not pause the simulation by itself. Capture tooling pins a sanitized frame through `window.__ESCAPE_PRESENT_FRAME__(frame)` and returns through `window.__ESCAPE_RESUME_LIVE__()`. Pinned frames are marked **REPLAY** and stale in-flight live responses cannot replace them.

## Autonomous authority and public privacy

The server owns the seeded simulation, legal actions, hazards, progression and result. The autonomous policy operates on its observation and discovered facts. The browser consumes immutable `escape-render-v2` snapshots; camera movement, sound and accessibility preferences do not change simulation state.

Public frames expose visible objects, inventory labels, progress, hazard presentation, a concise intent summary and sanitized event labels. They exclude private seeds and run IDs, hidden facts, puzzle solutions, oracle actions and internal decision traces. The replay route returns the same public contract rather than private engine checkpoints. The progress routes allowlist metadata and named PNG captures rather than serving the repository wholesale.

The renderer now exposes an explicit `dispose()` lifecycle for its animation frame, event listeners, resize observer and owned rendering resources. On a full page exit, the `pagehide` handler stops polling, aborts the active request, disposes the renderer and closes audio. The Node disposal-interface contract is green; the full browser resource/lifecycle proof is still pending.

The focused public-contract tests compare deterministic runs with and without arbitrary presentation reads and output recovery. The server tests cover state/replay privacy, asset MIME types, malformed request targets and evidence-route traversal. Their retained results and limits are linked in the [ledger](../../docs/gauntlet/escape-room.md#recorded-validation).

## Assets and provenance

The nine bundled 1k material JPEGs come from Poly Haven under **CC0-1.0**: Wood Floor Worn by Dimitrios Savva, Grey Plaster by Rob Tuytel, and Rusty Metal 02 by Rob Tuytel. The [texture source notes](../../public/ai-escape-room/textures/SOURCE.md) explain color, normal, roughness and packed-map interpretation. The [source manifest](../../public/ai-escape-room/textures/sources.json) preserves official source/API URLs, authors, byte counts, source MD5 and local SHA-256 for each file.

Commercial reference screenshots are evaluation material. They are not bundled into or requested by the game. Their URLs, roles and hashes remain in [references.json](../../evidence/ai-escape-room/gauntlet/references/references.json). Downloaded commercial media, source HTML and contact sheets are ignored by Git. The game's own captures, reviews and provenance JSON remain eligible for version control.

## Focused validation

Build first, then run the Escape Room unit and contract suite and server self-test:

```sh
npm run build
node --test tests/escape-room/*.test.cjs
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

The ten-case file checks real autonomous snapshots, batched Follow/escape events, manual viewing controls, maximum mechanism counts, the WebGL fallback, repeated theme changes, character framing, raw WebGL buffer cleanup, skipped-result intermission and renderer disposal. The wider game-specific configuration also runs the stream, camera and evidence-pinning checks. The 65/65 Node checkpoint, the overlapping 15/15 focused model/lifecycle run and the green server self-test do not establish a browser pass; consult the ledger for the pending browser outcome.

To reproduce comparison captures, keep the game server running on port 4177 and choose a new, unused capture label:

```sh
node scripts/capture-escape-gauntlet.cjs local-review
```

The script runs the autonomous engine, pins its actual public opening/mechanism/result frames and saves room, character, mechanism, result and mobile captures plus a report under `evidence/ai-escape-room/gauntlet/captures/<label>/`. It uses reduced-motion poses and the renderer's low quality tier, calls the real frame method and pauses the animation-frame loop for each stable SwiftShader still. **FPS is deliberately not measured.** Reusing a label overwrites its captures, so retain reviewed evidence under its original label.

The retained [Round 03 report](../../evidence/ai-escape-room/gauntlet/captures/round-03/report.json) records an actual eight-puzzle escape and no captured page errors. Its separately retained [source manifest](../../evidence/ai-escape-room/gauntlet/captures/round-03/source-manifest.json) records the presentation-file hashes frozen during capture. The review binds its findings to the image hashes. These still captures do not establish continuous animation, hardware frame rate, GPU memory bytes, long-run stability or production capacity.

## Continue the Gauntlet

The lead agent maintains the [ledger](../../docs/gauntlet/escape-room.md) and live progress metadata. Independent builders and critics work on separately judgeable pieces. Each critic inspects real output against the fixed reference, uses blind A/B comparison when feasible and returns the largest remaining gap for another iteration. Round 03 used chronology-blinded A/B preference before the unblinded fixed-reference review; its source checkpoint still favors the commercial reference. The next art target is the construction and staging of the dominant furniture grouping, alongside character composition and exit depth. No Ultracode tool was available in this session; subagents performed the builder and critic work.
