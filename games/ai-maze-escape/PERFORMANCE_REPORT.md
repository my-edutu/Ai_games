# Performance Report

## Rendering strategy
The 2.5D renderer is dependency-free WebGL2 and uses one interleaved dynamic vertex buffer. World geometry is generated only for the bounded public view. Floors, walls, props, interactables and character geometry are accumulated into one batch and submitted with one `drawArrays(TRIANGLES)` call per frame.

## Bounded work
- Public view is capped by the existing view computation.
- Planned-route markers are capped by `MAX_TRAIL=240`.
- Device pixel ratio is capped at 2.
- No textures or external models are loaded in the initial pass.
- No ambient random allocation source is used.

## Instrumentation
`window.__MAZE_RENDER_STATS__` exposes only presentation metrics: renderer mode, theme, draw-call count, triangle count, vertex count, visible cell count and current room archetype. It does not expose hidden game state.

## Current evidence
JavaScript syntax was checked before upload. The full repository CI/browser run for the branch head is pending at the time of this report revision.

## Acceptance still required
Record actual browser evidence for:
- no console/page errors;
- desktop and OBS-resolution layout;
- phone landscape compression;
- clean-feed layout;
- stable draw/triangle counts across ordinary maze sizes;
- screenshot review for clipping or excessive geometry.

No FPS or memory number is claimed until measured by a running browser build.
