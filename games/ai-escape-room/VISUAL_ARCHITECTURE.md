# Visual Architecture — Renderer V2

`authoritative EscapeState -> buildEscapeRenderSnapshot(v2) -> EscapePresentationController -> /escape-room/state -> app.js -> EscapeRoom3D (Three.js) -> EscapeMechanisms -> WebGL canvas`

The browser cannot call gameplay rules and cannot provide authoritative state. It only consumes immutable, privacy-safe snapshots and moves presentation cameras/effects. `mechanismKind` and `placement` are intentionally non-secret presentation metadata: they choose the physical mechanism and surface/slot, but never expose a solution, hidden fact, seed or oracle path.

## Browser composition

- `bootstrap.js` self-hosts the repository-pinned Three.js module and loads the Escape Room presentation stack. There is no runtime CDN.
- `room3d-polish.js` contains renderer-quality budgets and the four theme palettes.
- `mechanisms3d.js` owns reusable geometry builders for the eight authoritative puzzle primitives plus clue/tool/decoy forms.
- `room3d.js` owns the PBR room shell, furniture, surface-aware placement, AI probe, hazard geometry, raycasting, inspection/room cameras, bounded VFX, adaptive quality and diagnostics.
- `app.js` owns snapshot polling, minimal HUD/captions, dynamic room identity and semantic WebAudio buses.

## Physical placement boundary

`buildEscapeRenderSnapshot` emits deterministic safe placement metadata (`surface`, `slot`, `variant`, `stage`). It is derived from public object identity/type/puzzle stage only. Renderer coordinates are therefore repeatable without exposing authoritative secrets, and clues/locks can be grounded on desks, shelves, walls, consoles, pedestals, the floor or the exit instead of a generic 2D grid.

## Failure boundary

If Three.js/WebGL initialization fails, the verified safe-scene remains available. Renderer, camera, audio, adaptive resolution and VFX failures cannot change the authoritative checksum or legal action set.
