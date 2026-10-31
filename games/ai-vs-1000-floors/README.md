# THOUSAND — AI vs 1,000 Floors

Game 4 is a finite, autonomous 3D ascent through ten districts. An original explorer and its companion traverse generated platforms, wait for timed hazards, collect relics and save progress toward Floor 1,000. Clearing the last floor ends the campaign.

![Actual Game 4 review capture](../../evidence/thousand-floors/captures/iteration-4-desktop.jpg)

## Run the game

From the repository root with Node 22 or newer:

```sh
npm ci
npm run floors:stream
```

Open **http://localhost:4184/floors/**. The live review page is **http://localhost:4184/floors/progress**. All runtime dependencies and art are local; no API key or external model is required. The server binds to localhost by default. Use `PORT` or `--port=4184` when invoking the server directly to select another port.

Pause/resume, playback speed, camera and opt-in sound are in the bottom controls. Settings provide scene quality, reduced motion, clean feed, checkpoint recovery and a confirmed fresh start. Keyboard: Space pauses, C changes camera, M toggles sound; Escape closes settings. Keyboard shortcuts do not override form controls.

Progress is saved in this browser. A checkpoint is the next floor entrance after every ten cleared floors; e.g. clearing Floor 10 establishes Floor 11. Invalid or incompatible saves are preserved until the viewer explicitly chooses Start fresh. Clearing browser storage removes local progress.

## Inspect later districts

`/floors/?review=101`, `?review=401` and `?review=901` replay the actual simulation to the requested floor. Review mode is visibly labelled and never replaces normal saved progress. It can take longer to initialize than the normal game.

## Verify

```sh
npm run test:floors
npm run test:floors:browser
```

On a software-only graphics host, the verified functional profile is `FLOORS_TEST_QUALITY=low npm run test:floors:browser -- --trace off`. It uses the actual supported low tier. High-quality visuals are captured separately; no hardware frame-rate guarantee follows from these tests.

The core is TypeScript; `src/index.ts` exposes the public API. The browser worker imports an ESM build of exactly that core. Presentation lives in `public/ai-vs-1000-floors/`; the localhost server is `scripts/serve-thousand-floors.cjs`.

## Current quality verdict

**Playable candidate under active review; the ASTRO BOT reference bar has not passed.** The campaign currently selects one generated route per floor and uses a deterministic hazard-waiting policy. It is not an open-ended planner. Ten visual districts do not mean 1,000 individually authored rooms. Production deployment, long-duration soak and live audience integrations are not established by this candidate.

See [live progress](../../docs/gauntlet/thousand-floors/PROGRESS.md), [fixed reference evidence](../../docs/gauntlet/thousand-floors/reference-evidence.md), [production gates](PRODUCTION_READINESS.md) and [current phase](phases/01-gauntlet.md).
