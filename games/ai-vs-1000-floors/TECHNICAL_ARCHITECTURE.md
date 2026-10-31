# Technical architecture

## Ownership boundaries

| Layer | Location | Authority |
|---|---|---|
| Seeded content and campaign | `src/` | Floor layouts, timing, health, pickups, progress, checkpoints |
| Browser worker | `public/ai-vs-1000-floors/worker.js` | Sole mutable browser campaign; fixed-step scheduling and saves |
| Presentation | `public/ai-vs-1000-floors/scene.js` and helpers | Snapshot-driven meshes, camera, materials and effects |
| Viewer application | `public/ai-vs-1000-floors/app.js` | Controls, storage, worker transport, accessibility |
| Local serving | `scripts/serve-thousand-floors.cjs` | Allowlisted static assets, local dependencies and health route |

The exact public interfaces are maintained in [interfaces.md](../../docs/gauntlet/thousand-floors/interfaces.md). Core source is compiled to CommonJS for repository tests and to ES2022 modules for the browser using `tsconfig.browser.json`; there is no duplicate hand-written browser rules engine.

## Persistence and bounds

Campaign/save version is 2; render snapshot schema remains 1. The envelope contains the serialized state and a checksum. Restore validates size, shape, seed, finite coordinates, progress/checkpoint relations, legal motion phases, inventory conservation and recent event ordering. Old incompatible saves are explicitly rejected. The event window is capped at 24 entries; there is one current floor layout and a bounded current cast.

The worker saves periodically and on relevant transitions. localStorage is browser-local and may be unavailable; no server durability is claimed. Review mode fast-forwards the real core and never writes the normal save key. Scene transitions dispose geometry/material/texture resources. Static batching must exclude animated ancestry and preserve shadow/material differences.

## Server boundary

The localhost server accepts GET/HEAD only and maps a small asset allowlist, browser runtime JavaScript and local Three.js. Private paths and traversal are rejected. CSP permits local scripts/workers and a hashed inline import map; no remote asset service or model key is required. A successful health route proves the static host is running, not that visual or production quality passed.
