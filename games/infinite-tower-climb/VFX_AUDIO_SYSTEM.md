# VFX and Audio System

## VFX hierarchy

1. Terminal / guardian / milestone cues.
2. Immediate hazards and enemy telegraphs.
3. Shield, projectile and impact cues.
4. Pickups and route indication.
5. Ambient atmosphere.

Critical silhouettes remain above ambient spectacle. Full-screen danger tint is low-alpha and bounded. Reduced-motion removes camera shake and animated transitions.

## Implemented presentation effects

- Theme-specific atmospheric glow and weather/star treatments.
- Platform edge/emissive treatment and moving-platform lights.
- Hazard-specific heat, spike, crusher, lightning and void-pulse visuals.
- Guardian core/arm glow and telegraph ring.
- Shield field, projectile trail/glow and rotating pickup treatment.
- Floor-change milestone burst using a bounded pool.
- Foreground cable occlusion and scene vignette.
- AI route trajectory cue.

## Budget

`MAX_PARTICLES=96`. The pool evicts oldest particles before allocation can exceed the cap. No gameplay authority depends on an effect being visible.

## Audio

The existing `TowerAudioDirector` remains the semantic source for captions/music-state/cue priority. The browser maps those authoritative presentation cues to lightweight WebAudio oscillator feedback after user interaction permits audio playback. Mute mode suppresses browser sound while captions remain available.

This is a functional reactive sound layer, not a final authored music/SFX asset library. A production audio pass still requires recorded/designed footsteps, machinery, sector ambience, guardian music stems and mastered mix assets.