# Visual Architecture

## Runtime layers

1. **Authority** — TypeScript fixed-step simulation under `src/`.
2. **Snapshot boundary** — `createMarblePresentationSnapshot` exposes sanitized, immutable race state/events.
3. **Broadcast server** — `serve-complete-runtime.cjs` serves snapshots, health, static assets and self-hosted Three.js.
4. **Primary renderer** — `public/complete-runtime/arena3d.js` renders the world with Three.js/WebGL.
5. **Safety renderer** — legacy Canvas 2D `app.js` remains live behind the WebGL canvas and is revealed automatically if Three.js/WebGL does not become ready.
6. **HUD** — existing semantic DOM remains accessible and is visually reduced to overlays.

## Spatial mapping

Authority X maps to Three.js X. Authority race Y maps to Three.js Z. A deterministic presentation height profile produces 2.5D elevation without feeding back into results. Obstacle, bumper, sweeper, hazard and finish-line positions are derived from authority geometry, not invented screen coordinates.

## Marble presentation

Marbles use `MeshPhysicalMaterial`, spherical geometry, clearcoat, highlights, cast/receive shadows and geometric patterns. Rolling orientation is integrated from rendered displacement using distance/radius, so translation no longer looks like sliding circles.

## Resilience

The 3D canvas is transparent to the authority. A successful Three.js render sets `.three-ready`; until then, the existing authoritative 2D feed remains visible. Quality changes rebuild presentation resources only.

## Accessibility

Reduced-motion preference removes camera/effect excess. Competitor identity uses stable palette plus geometric pattern/fin, not color alone. DOM HUD/status text remains separate from WebGL.
