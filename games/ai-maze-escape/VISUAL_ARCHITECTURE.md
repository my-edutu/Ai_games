# Visual Architecture

## Authority boundary
The rebuild does not replace maze simulation, AI, generation, persistence or recovery. The browser continues to receive `/maze/state` and consumes the sanitized public snapshot already used by the broadcast.

## Presentation pipeline
1. Public snapshot enters `computePublicView`.
2. `buildMazeWorld` selects only public cells in the current view.
3. Deterministic presentation helpers derive room archetype/material variation from public state.
4. `GeometryBatch` builds bounded 3D triangles for floors, walls, props, explorer and interactables.
5. `MazeWorldRenderer` applies perspective projection, depth testing, lighting and fog.
6. The existing HUD updates from the same public snapshot and remains secondary.

## Determinism and safety
`presentationSeed` derives bounded visual variation from profile, level, public revision/tick, public cell id and salt. No `Math.random()` is used. Presentation does not mutate the snapshot or runtime and cannot reveal undiscovered geometry.

## Runtime characteristics
The renderer uses one dynamic interleaved vertex buffer and a single triangle draw call per frame. Geometry is rebuilt from the bounded visible public-cell set. The renderer exposes frozen `window.__MAZE_RENDER_STATS__` for browser/performance verification without exposing hidden state.

## Failure behavior
If WebGL2 or shader initialization is unavailable, simulation continues and the existing recovery card presents a visual-recovery message. The fallback does not silently revert to the legacy flat grid.
