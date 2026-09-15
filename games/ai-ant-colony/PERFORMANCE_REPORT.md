# Performance Report

## Implemented safeguards

- Near/mid/far ant LOD based on on-screen cell scale.
- Bounded visual event list (`MAX_EFFECTS`).
- Bounded semantic audio cues/voices (`MAX_AUDIO_CUES`, `MAX_VOICES`).
- Ant motion cache pruning.
- Deterministic procedural dressing instead of persistent decoration objects.
- No per-ant DOM nodes.
- Existing single Canvas compositing path retained to avoid a dependency/scene-graph migration before measurement.
- DPR capped by the existing renderer resize path.

## Measurement status

The repository CI runs the full build/test suite, stream-host self-tests, chaos/release validation and Playwright browser capture. At the time this report was authored, the rebuild-head CI run had not yet completed, so no new FPS/draw-call/memory number is claimed here.

## Acceptance gate

Do not mark large-colony performance or long-session visual stability COMPLETE until the rebuild commit has passed the repository's Ant Phase 5/6 validations and browser run. If later measurement shows frame instability, the next levers are viewport culling, reduced update cadence for far ants, pooled particles and cached static biome layers.