# Architecture — First Dungeon Slice

```text
named seed + immutable source configuration
   ↓
DungeonRuntime (only game authority)
   ├─ iterative DFS maze + bounded shortcuts
   ├─ deterministic BFS pathfinding
   ├─ party tactical decisions / enemy turns / loot / floor state
   ├─ checksum-bearing save/restore
   └─ publicState() privacy-safe projection
            ↓
Node HTTP host (fixed 350ms timer, health + quarantine)
            ↓
GET /dungeon/state
            ↓
Three.js web client (interpolated 3D presentation, no gameplay writes)
            ↓
Gauntlet progress viewer + browser QA
```

`games/ai-dungeon/src/index.ts` is the authoritative core. Gameplay randomness uses repository `NamedRng` streams with floor/run identifiers. The `scripts/serve-dungeon-stream.cjs` host loads the TypeScript compile from `dist/`, steps independently of browsers, and serves vendored Three.js from the installed `node_modules` version. CSP disallows third-party scripts. The client uses only public state, never `seed`, RNG, config or private rules.

`DungeonSave` records deterministic version, RNG snapshot, seed, full state and checksum. Restore rejects incompatible/corrupted snapshots. Currently snapshots are in-memory exports, not durable disk persistence. The server quarantines on simulation errors and returns HTTP 503 rather than silently simulating fabricated states.

Transport is polling at 190ms with only one outstanding request; authoritative time remains 350ms. Geometry scene is rebuilt on floor transitions; actor transforms interpolate between fixed steps. No render frame is an authority input.

This slice is intentionally independent of external chat APIs, model services, databases and payment providers. R5 requires durable writer leases, append-only event storage, integrated supervisor, operations telemetry, restore from last good persisted checkpoint and audited rollout.
