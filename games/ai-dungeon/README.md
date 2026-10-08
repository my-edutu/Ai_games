# AI Dungeon — Endless Adventure

**Status: first executable 3D vertical slice, not AAA or production ready.** The original catalogue listed AI Dungeon as a planned game with no runtime. This change establishes an autonomous dungeon simulation and a real browser-based Three.js presentation, with local telemetry and a Gauntlet quality page.

## Run locally

1. Install dependencies: `npm ci` (Node 22 or later).
2. `npm run dungeon:test`
3. `npm run dungeon:gauntlet`
4. `npm run dungeon:stream`
5. Open http://localhost:4181/dungeon or http://localhost:4181/dungeon/gauntlet.

To capture browser evidence: `npm run dungeon:visual` (requires Playwright Chromium installation). The stream continues while the web page is closed. Do not expose this reference server publicly without deployment controls.

## Gauntlet Round 5 — real 3D authored character upgrade

The optional **integrity-verified CC0 GLB asset pipeline** now replaces primitive fallback characters with authored, textured, skeletal animated characters: Knight/Vanguard, Archer/Ranger, Mage/Mystic, skeleton opponents and a larger tinted Warden. Authored dungeon pillars and walls are placed as cosmetic landmarks. Missing files preserve a functional procedural character fallback rather than a broken render.

`npm run dungeon:assets` pulls 20 pinned character/environment binaries to an ignored local directory; `npm run dungeon:assets:strict` enforces complete receipt and Git blob SHA matching for screenshot-gate CI. This requires network access the first time; no external requests occur during game rendering.

The spectator view now includes themed cinematic lighting, atmospheric set extensions, HUD palettes by floor, minimap, world-space HP/damage and status overlays, scripted floor-reveal presentation, user-selected camera types, trap devices and opt-in audio cues.

**Pending:** GitHub runner validation and actual screenshot/video inspection of the new authored assets. Even after validation, source models remain stylised low-poly, not Path of Exile 2-level AAA art. See [pinned asset provenance](assets/PROVENANCE.md).

## Implemented vertical slice

- Seeded 19×19 dungeon with guaranteed navigable routes, farthest reachable exit, limited shortcuts, relics, miniboss and enemies.
- Three allied character classes: Ashen Vanguard, Wildshadow and Starweaver. Deterministic group decisions, ranged attacks, tactical healing and enemy pursuit.
- Persistent per-expedition floor, gold, kills and progression; defeat restarts after a bounded intermission.
- Versioned checksum save/restore; bounded event history; renderer receives only public snapshots.
- Actual Three.js meshes, articulated character rigs, dynamic fog/lights, dungeon stonework, portal, relics, environment variations, HUD, camera tracking and reduced-motion handling.
- Isolated live Gauntlet progress page and repeatable multi-seed simulation campaign.

## Known boundaries

The models are procedural, not production-quality authored AAA models. AI tactical behaviour, enemy diversity, combat readability, assets, audio, persistence across server restarts, provider gateways, mature replay pipeline, long-haul soak, and blind A/B reference judging all require further measured iterations. Headless stability cannot certify visual parity with Path of Exile 2 or a full broadcast launch. The server retains one in-memory authoritative game. No paid influence or provider SDK is enabled.

See [Gauntlet operating protocol](../../docs/gauntlet/AI_DUNGEON_GAUNTLET.md) and [production readiness](PRODUCTION_READINESS.md).
