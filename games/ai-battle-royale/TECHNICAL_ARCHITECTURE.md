# Technical architecture

`src/runtime.ts` owns gameplay. `src/world.ts` owns authoritative map/solid geometry. The runtime consumes public shared NamedRng and checksum interfaces only. It is independent of Three.js, browser, audio and providers.

The runtime advances at 20 fixed logical ticks per second. Its serializable state includes named RNG streams, configuration/version, match lifecycle, actors, loot and bounded events. Checkpoints validate schema, checksum and invariants before continuation. A checksum detects corruption and is not an authentication signature for untrusted external storage.

`scripts/serve-battle-royale-stream.cjs` hosts one in-memory authority, fixed-step timer, cached snapshot and allowlisted static assets. `/royale/state` returns an independent immutable public projection; `/royale/health` reports host state. The host quarantines after an authority exception. It does not convert that exception into a game result.

`public/ai-battle-royale/app.js` owns scene, cameras, interpolation, HUD, events and polling. `world.js`, `characters.js` and `audio.js` own their respective presentation resources. Pinned Three ESM is served locally; the game has no CDN runtime dependency. `/royale/dev/` refreshes evidence separately from spectator UI.

Checkpoint serialization/restore is implemented and tested. Durable host checkpoint storage, worker lease, authenticated operator controls and provider broadcast integration are still outside this stream host; process restart begins a fresh seeded session. Do not infer those future platform capabilities from the current API.

## Reviewed presentation boundaries

Render health is independent of network health. Exceptions have a bounded reconstruction budget; failed/context-lost views cannot publish an advancing winner overlay. Late fetch and JSON responses are fenced by lifecycle generation, and teardown aborts pending work. BFCache restoration builds a fresh presentation. Backward ticks reset interpolation/event/audio/director continuity.

The low graphics tier shares cached Lambert replacements while preserving the original Standard materials and owner-managed textures. Quality restoration and world/context/navigation teardown restore originals before disposing replacements. This reduces shader cost without changing the authority or geometry; it does not establish a sustained performance pass.
