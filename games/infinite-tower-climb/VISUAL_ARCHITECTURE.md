# Visual Architecture

## Boundary

The authoritative runtime owns gameplay truth. `createTowerRenderSnapshot` publishes immutable presentation data. The browser renderer consumes `/tower/state`; it never writes movement, score, collisions, AI observations or results.

## Render stack

Back to front:

1. **Atmosphere** — sector sky gradient, celestial glow, haze/weather/stars.
2. **Distant tower** — converging structural planes and repeating lights for extreme vertical scale.
3. **Gameplay architecture** — extruded platforms, moving machinery surfaces and hazard-specific forms.
4. **Actors** — pickups, enemies/guardians, projectiles and articulated climber.
5. **Semantic VFX** — route cue, shields, telegraphs, milestone/danger treatment, bounded particles.
6. **Foreground** — cables and structural occluders plus edge vignette.
7. **Broadcast overlay** — compact HUD/captions; removable with clean-feed mode.

## Sector renderer

The existing authoritative themes (`foundry`, `ruins`, `storm`, `clockwork`, `void`) select presentation palettes and environmental treatments. Theme changes do not change simulation rules unless the authoritative generator says so.

## Performance rules

- Device pixel ratio is capped at 2.
- Presentation particle cap: 96.
- Existing authoritative entity caps remain unchanged.
- No per-frame DOM reconstruction outside state-change HUD updates.
- No unbounded timers, emitters or arrays in the visual layer.
- Background detail is procedural and texture-free in this increment.

## Recovery

The renderer remains reconstructible from the latest public snapshot. State polling is single-flight. If presentation state is unavailable, the UI reports recovery while the autonomous simulation continues server-side.