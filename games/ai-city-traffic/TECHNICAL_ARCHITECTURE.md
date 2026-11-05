# Technical architecture

## Ownership and data flow

`src/simulation.ts` owns traffic state, commands, seeded streams, metrics and checkpoint validation. `src/traffic-network.ts` owns connected road/walk geometry and route planning. Browser and headless Node execution compile these same sources.

`public/ai-city-traffic/main.mjs` schedules fixed steps, owns renderer/camera/lights and controls, and consumes frozen snapshots. `world.mjs` and `world-assets.mjs` own visual assets, instanced pools and snapshot-driven animation. `audio.mjs` owns opt-in bounded audio. Presentation cannot mutate authoritative state.

`scripts/serve-city-traffic.cjs` serves only the game's public assets, compiled ESM authority and the installed Three.js distribution. The listener defaults to 127.0.0.1:4311. No authoritative mutation endpoint is exposed. The live journal is a separate static page whose local JSON evidence refreshes automatically.

## Public simulation interface

`createTrafficSimulation({seed?,demand?,policy?})` returns `step(ticks=1)`, `snapshot()`, `command(command)`, `serialize()` and `restore(serialized)`. `STEP_SECONDS` is 1/30. Snapshots include tick/seed, vehicles, pedestrians, signals, actual metrics, demand/policy/incident and bounded public events.

Vehicles include positions, yaw (0 faces +Z), speed in metres/second, class, dimensions, route/origin/destination, progress, junction reservation context and waiting/braking state. Citizens include position, speed/gait, crossing and waiting state. Signals include phase, remaining logical seconds, queues and reserved vehicle. Metrics separate active, pending, waiting, completed, generated and rejected trips.

## Determinism and bounded work

Authority has fixed logical time, named/versioned RNG streams and stable ordered updates. Browser catch-up is capped; slow output drops scheduling debt rather than increasing the physics delta. Pause and hidden-tab transitions clear accumulated debt. Cosmetic time cannot influence routing.

Serialization includes schema/deterministic/configuration version and a checksum. Restore validates semantics and physical invariants before replacing state. A checksum alone cannot prove a state is valid. Incompatible or corrupt state is rejected.

## Failure behavior

Missing/WebGL failures show a recovery action. Optional audio failures leave traffic running. Rendering failure can retain a verified session checkpoint. Invalid server paths/methods are rejected and private repository files are not exposed. No provider, secret or remote-model dependency exists in the hot path.

## Delivery and rollback

The feature is isolated to its game/public/scripts/tests/docs plus additive package scripts and TypeScript inclusion. Run it through its own server. Roll back the feature commit/branch to remove the route and build commands; existing game engines are not migrated.
