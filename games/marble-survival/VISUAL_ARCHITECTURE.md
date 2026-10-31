# Visual Architecture

## Principle
Simulation authority and visual presentation are separate. The TypeScript runtime owns tournament state, physics, eliminations, winner selection, deterministic events and camera priorities. Browser rendering consumes `/api/snapshot`; it never chooses a winner, rescues a marble, teleports competitors or edits authority state.

## Runtime layers
1. **Authority** — deterministic fixed-point ground-plane simulation under `src/`.
2. **Presentation snapshot** — stable versioned projection of arena, marbles, events and server camera directive.
3. **WebGL2 renderer** — real 3D geometry for the arena and marbles, presentation-only interpolation, rolling orientation, lighting, contact shadows and VFX.
4. **Canvas fallback** — previous renderer remains available when WebGL2 cannot initialize.
5. **HUD/audio** — existing spectator UI and event audio continue to consume the same authority snapshot.

## WebGL renderer
`public/complete-runtime/renderer3d.js` owns shared sphere, box and cylinder meshes, material uniforms, camera matrices, quality-aware DPR, arena geometry and deterministic event particles. Geometry is shared rather than recreated every frame.

## Failure behavior
The WebGL canvas is hidden until a valid authority snapshot is received. If WebGL2 is unavailable, the existing Canvas arena remains visible. Context loss removes the WebGL-ready flag rather than presenting stale authoritative state.

## Physics boundary
The 3D renderer does not claim a vertical rigid-body simulation. Height, gantries, machine housings and sphere rotation are presentation of a deterministic 2D collision world. Any future ramps, gravity, breakable floors or material-dependent mechanics must first become authoritative state before the renderer presents them as gameplay-affecting systems.
