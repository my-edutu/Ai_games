# Infinite Tower Climb — Visual Architecture

## Goal

Make the world occupy approximately 90% of the frame and read as a cinematic autonomous vertical platformer even with every HUD element hidden.

## Compatibility decision

The current public frontend is dependency-free static JavaScript served by `scripts/serve-tower-stream.cjs`; the repository has no frontend bundler or Three.js dependency. Introducing Three.js would require a new browser build pipeline and CSP/package changes unrelated to the authority layer. The rebuild therefore uses native WebGL2 for the world renderer, with a Canvas 2D fallback only when WebGL2 is unavailable. This gives GPU depth, blending, procedural geometry and stable OBS compatibility without changing the TypeScript simulation toolchain.

## Data boundary

`TowerRuntime` remains authoritative. `createTowerRenderSnapshot()` remains immutable and privacy-safe and is extended only with presentation-safe facts such as grounded/checkpoint state. Browser code interpolates snapshots but never writes gameplay state.

## Rendering layers

1. Background: distant tower silhouette, skyline/cloud strata, haze and parallax structures.
2. Midground: structural ribs, conduits, machinery, bridges, elevator shafts and themed architecture.
3. Gameplay plane: authored-looking platform facades, hazards, pickups, climber, enemies, guardians and projectiles.
4. Foreground: cables, beams, smoke and particles that can partially occlude the view.

A compact batch renderer projects world X/Y plus visual Z into clip space, applies fog/depth fade, and draws opaque then emissive/alpha passes. Themes are deterministic functions of floor/theme/tick and do not affect authority.

## Presentation systems

- `TowerCameraDirector`: broadcast modes for ascent, danger, guardian, fall, recovery, result and milestone framing.
- Browser animation state machine: standing→idle/run/sprint; airborne→anticipation/jump/fall; dashing; landing/hard-land; hit/death/recovery; contextual ledge/climb/pull-up presentation only when geometry/velocity supports it.
- Pooled VFX capped at 96 particles with gameplay-triggered dust, sparks, steam, debris, shield, electricity, fire and checkpoint/guardian effects.
- WebAudio synthesizer consumes existing `TowerAudioFrame` cues/music state; failure or autoplay suspension never blocks simulation/rendering.
- Theme kits: foundry, ruins, storm, clockwork, void, each with distinct structure palette, atmosphere, particles and hazard treatment.
- Milestones: floor 10/25/50/100/250/500/1000 alter composition, lighting and event overlay.

## Performance boundaries

No per-frame unbounded arrays. Reuse typed buffers, pool particles, cap decorative structures, cull off-camera detail, clamp device pixel ratio, pause expensive presentation work while hidden, and keep the authoritative entity caps unchanged.
