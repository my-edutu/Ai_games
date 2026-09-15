# VFX and Audio System

## VFX

Implemented presentation effects are bounded and state-linked: excavation dirt, tunnel/event pulses, rain, heat shimmer, puddles/wet soil, queen-danger emphasis, predator emphasis and foreground depth. The effects list has a hard cap and expired entries are removed.

## Audio

The existing semantic audio cue contract is preserved. WebAudio voices remain capped and cues observe cooldowns. Current sound is still a restrained synthesized cue layer rather than a finished multi-bus environmental soundscape.

## Status

- Semantic event cues: implemented/preserved.
- Voice bounding/cooldowns: implemented/preserved.
- Aggregate rain/wind/dig ambience: PARTIAL / requires further polish.
- Adaptive music-state layering: MISSING.

These gaps are intentionally not marked complete until real browser/audio verification is available.