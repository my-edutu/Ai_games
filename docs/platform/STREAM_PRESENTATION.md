# Shared Stream Presentation Platform

## Mission

Render authoritative game snapshots into a premium, comprehensible, accessible, and recoverable 16:9 livestream composition. Presentation owns cameras, interpolation, HUD, VFX, replays, scenes, captions, and output health; it never owns gameplay truth.

## Inputs

- immutable game-specific render snapshots;
- semantic gameplay and presentation events;
- normalized game signals;
- public AI intent summaries;
- privacy-safe audience acknowledgement states;
- lifecycle, provider, recovery, quality, and maintenance states;
- approved asset/theme/content versions;
- operator presentation commands that cannot mutate authority.

## Scene Model

Required scenes:

- countdown/goal introduction;
- normal play;
- milestone/boss/crisis;
- audience decision;
- result and record;
- replay/highlight;
- intermission and next-run preview;
- provider-degraded autonomous play;
- safe recovery/quarantine;
- maintenance;
- clean feed;
- emergency halt slate.

Each scene declares required data, transition, timeout, fallback, audio state, caption zone, quality tier, and output-health expectation.

## Render Pipeline

1. receive a versioned snapshot and reject stale/incompatible data;
2. update visual entity registry by stable IDs;
3. interpolate transforms between authoritative ticks without feeding state back;
4. select camera state from framing hints and presentation policy;
5. process semantic animations/VFX/audio/replay cues by priority and dedupe;
6. compose world, critical effects, entities, HUD, captions, audience cards, and system status in declared layers;
7. apply accessibility and quality variants;
8. render target frame and emit source-freshness/output metadata;
9. clean expired entities/effects/resources.

## Visual Hierarchy

Priority:

1. authoritative goal, terminal result, integrity/recovery state;
2. immediate danger and protagonist/decisive entities;
3. progress, milestone, record, objective route;
4. audience decision/application;
5. tactical feedback;
6. ambience and cosmetic activity.

Lower-priority layers yield under density. Paid/cosmetic acknowledgements never obscure higher-priority game truth.

## Camera

Games provide targets, bounds, points of interest, and optional mode hints; presentation chooses framing. Camera state includes base tracking, overview, look-ahead, crisis, milestone, replay, result, and safe slate.

Define zoom bands, dead zones, smoothing, target-switch hysteresis, occlusion/edge handling, bounds, impulse stacking/cooldown, reduced-motion variant, and maximum cut/zoom frequency. Camera cannot reveal hidden authoritative information prohibited by the game.

## HUD

Persistent primary elements are goal/progress, current run phase, danger as appropriate, and record/milestone. Contextual elements include AI intent, vote, audience acknowledgement, replay, and provider status. Operator debug never enters public output.

Layouts support configured output resolutions, 16:9 safe zones, phone-size landscape viewing, captions, common crops, clean feed, localization expansion, color-safe icons, reduced motion/flash, and bounded text.

## VFX and Animation

Effects are triggered by semantic events with anticipation, impact, recovery, priority, intensity, lifetime, cooldown, dedupe, and accessibility variants. Budgets cover particles, emitters, overdraw, lights, render passes, trails, decals, floating text, camera impulses, animations, and textures.

Quality degradation removes ambient/cosmetic density before critical feedback.

## Replay and Highlights

The presentation host maintains a bounded ring buffer of render snapshots and semantic events, not an alternate gameplay state. Replay triggers have priority, pre/post duration, speed curve, camera, overlays, audio, cancellation, and memory limits.

Replays never delay authoritative simulation. The stream may show delayed playback while the game continues only if the design clearly indicates live/recap state and returns safely; otherwise use result/intermission moments.

## Asset System

Assets are versioned by game/theme/content pack and include licence/provenance, type, dimensions/format, memory estimate, preload/stream policy, fallback, accessibility variant, and compatibility. Missing noncritical assets use approved fallbacks and telemetry; missing critical readability assets block the affected scene/game readiness.

## Output Health

Probe:

- frame/source timestamp advance;
- black/near-black frame outside declared scenes;
- frozen frame outside declared static scenes;
- missing critical HUD layers;
- wrong scene/lifecycle mismatch;
- renderer heartbeat and frame-time budget;
- capture resolution/aspect ratio;
- audio presence or declared silence through the audio/output integration;
- OBS/browser source connection where available.

On failure, transition to safe slate/source, restart presentation, reconstruct from latest snapshot, verify movement/HUD/audio, then return. Simulation continues unless the game’s broadcast policy explicitly pauses at a safe boundary.

## Performance

Games declare target frame rate and reference hardware. Measure CPU/GPU frame time percentiles, dropped frames, draw calls, overdraw, texture/render-target memory, particles, entity count, DOM/canvas updates, replay memory, and cleanup over soak.

Presentation processing is bounded per frame. Large snapshot updates may be diffed by stable IDs, but diff logic cannot alter authoritative semantics.

## Security and Privacy

Only sanitized public fields enter snapshots/events. Escape all text and bound lengths. No raw chat, provider IDs, payment details, prompts, stack traces, host paths, tokens, or moderation evidence. Debug and operator overlays are separately built and disabled from public capture by default.

## Testing

- scene/lifecycle contract and transitions;
- snapshot version/stale/out-of-order handling;
- entity creation/update/removal and restore;
- desktop/mobile/crop/low-bitrate comprehension;
- color-safe, reduced-motion, reduced-flash, captions, localization;
- peak VFX/HUD/audience event density;
- camera bounds/occlusion/target loss/rapid events;
- replay buffer/cancel/restart/memory;
- renderer kill/reload and output black/frozen/wrong-scene;
- missing assets and quality-tier changes;
- public data exposure scans;
- frame/GPU/memory/listener/resource soak.

## Acceptance

A game presentation reaches production-candidate status when uninstructed viewers understand goal/progress/danger at mobile size, representative scenes meet frame and accessibility budgets, all result/recovery/provider states are truthful, output health automatically detects and restores common failures, no private/debug data can reach public capture, and long-run resources remain bounded.
