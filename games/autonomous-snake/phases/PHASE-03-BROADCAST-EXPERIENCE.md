# Phase 3 — Premium Broadcast Experience

**Phase status:** Not started  
**Readiness target:** R2 complete streamed vertical slice  
**Viewer-visible outcome:** A full Snake run is visually premium, sonically coherent, immediately understandable on mobile, accessible, automatically framed, resolved with replay and records, and restarted without operator input.

## Objective

Implement the stream-facing player, render adapter, HUD, cameras, VFX, adaptive audio, captions, scenes, replay buffer, clean feed, and output health using the Phase 2 semantic contracts. The presentation must improve comprehension without mutating or duplicating authoritative rules.

## In Scope

- PixiJS or approved 2D presentation application and browser-source build;
- stable render-snapshot entity registry and interpolation;
- theme/asset system with licensed initial assets;
- full board/snake/food/hazard/portal/modifier rendering;
- HUD for length, occupancy, milestone, record, mode, intent, status, and future audience slot;
- countdown, normal, danger, milestone, result, replay, intermission, provider-degraded, recovery, maintenance, clean-feed, and emergency scenes;
- bounded camera, animations, particles, transitions, quality tiers;
- semantic audio engine integration, music states, SFX priority, mix, captions;
- reduced-motion, reduced-flash, color-safe, muted-audio, localization-safe variants;
- output freshness/black/frozen/wrong-scene/silence probes;
- full automatic run-to-result-to-restart broadcast loop.

## Explicit Non-Scope

Live YouTube/Twitch events, paid entitlements, final operator dashboard, production database, production canary, and R5 launch.

## Requirements Addressed

All `FR-SNK-UX-*`, presentation portions of product requirements, `NFR-SNK-PERF-002`, `NFR-SNK-ACC-001`, public privacy requirements, and the broadcast/audio/accessibility production gates.

## Workstreams

### 1. Presentation Host and Render Adapter

Consume versioned immutable snapshots, create/update/remove entities by stable visual ID, interpolate between authoritative steps, reject stale/incompatible snapshots, restore a complete scene from current state, and isolate renderer errors from simulation.

### 2. Board and Entity Rendering

Implement themeable grid, playable mask, head/body/tail hierarchy, food/special-food identity, obstacles, hazard telegraphs, portals, timed effects, and occupancy visualization. Preserve semantic color/shape roles across themes and quality tiers.

### 3. HUD and Scene State Machine

Build the ten-second hierarchy and all lifecycle scenes. Reserve caption/safe zones, bound public text, support clean feed, and separate operator diagnostics. Public recovery copy must distinguish technical restore from game loss.

### 4. Camera, Animation, and VFX

Implement stable overview/framing, bounded head emphasis, milestone/result/replay modes, anticipation-impact-recovery envelopes, density/priority/cooldown, reduced variants, and cleanup on restart/restore. Presentation slow motion remains non-authoritative.

### 5. Audio

Integrate semantic cues, adaptive music states, buses, voice limits, dedupe, ducking, spatial rules where useful, loudness/true-peak targets, intended silence, captions/visual alternatives, missing-asset fallback, and audio context/process recovery.

### 6. Replay and Result

Maintain a bounded render/event ring buffer. At terminal result, focus the decisive authoritative cause, show score/progress/record/integrity, play a short optional replay, preview next run, and restart within the approved intermission band.

### 7. Accessibility and Capture Validation

Test full resolution, phone-size landscape viewing, low bitrate, bright/dark themes, color-vision variants, grayscale, reduced motion/flash, captions, muted audio, localization expansion, and peak event density using the actual capture/encoding chain.

### 8. Output Health and Quality Degradation

Detect stale snapshots, renderer heartbeat loss, black/frozen/wrong scene, missing critical HUD, audio underrun/silence/clipping, aspect/resolution mismatch, and resource pressure. Switch to safe slate, restart component, rebuild from snapshot, verify, then return.

## Test-First Sequence

- render-snapshot schema/version/stale handling;
- entity lifecycle and interpolation independent of authority;
- HUD scene contracts and missing-field fallbacks;
- mobile/crop/contrast/color/caption layout fixtures;
- camera bounds, target loss, rapid event hysteresis;
- VFX priority/dedupe/cleanup/quality tiers;
- audio cue priority, music hysteresis, voice stealing, loudness, missing asset;
- result/replay/restart and restore reconstruction;
- public-data exposure and unsafe-text tests;
- renderer/audio/output failure injection;
- frame/GPU/memory/listener/texture/audio-resource soak.

## Acceptance Criteria

- [ ] Uninstructed reviewers identify goal, progress, danger, and phase within ten seconds at representative phone size.
- [ ] Full runs complete and restart through the public stream application without manual action.
- [ ] Presentation cannot change authoritative checksums under different frame schedules or component restarts.
- [ ] Goal/head/food/hazard/result remain readable at peak approved VFX and HUD density.
- [ ] Reduced-motion, reduced-flash, color-safe, captions, and muted-audio modes preserve meaning.
- [ ] Target frame and audio budgets pass on reference hardware and capture chain.
- [ ] No clipping, unintended sustained silence, missing critical cue, or unlicensed/placeholder asset remains.
- [ ] Result/replay shows the exact authoritative cause and distinguishes technical quarantine.
- [ ] Renderer/audio/output failures activate safe output and recover from the latest snapshot within target.
- [ ] All visual/audio resources and public UI state remain bounded during the phase soak.
- [ ] Spec and quality reviews have no P0/P1 finding.

## Evidence Bundle

Include representative videos/screenshots, comprehension results, accessibility captures, visual regression, loudness reports, asset/licence manifest, frame/GPU/memory profiles, output-failure recordings, result/replay examples, capture configuration, and reviews under `phase-03/`.

## Rollback

Presentation/audio releases are versioned separately from the compatible game module. A failed candidate can revert assets/overlay/presentation while the simulation remains running. If snapshot/render contract compatibility changes, switch to safe slate and deploy the last compatible set before restoring public output.

## Exit and Handoff

Phase 3 exits when the complete autonomous game is watchable at R2 quality without audience input. Phase 4 adds the normalized audience loop to existing contextual HUD, semantic effects, and event-director budgets.
