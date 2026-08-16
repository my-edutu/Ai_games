---
name: game-audio
description: Use when designing or reviewing music, sound effects, ambience, adaptive audio states, mixing, loudness, spatialization, voice limits, captions, asset licensing, or long-session audio reliability
---

# Game Audio

## Overview

Use sound to clarify state, create anticipation and impact, support emotional pacing, and remain comfortable during hours-long streams. The core principle is **semantic hierarchy before sonic quantity**.

## Scope

Use for music systems, ambience, SFX, UI cues, audience acknowledgements, mix architecture, accessibility, assets, streaming output, and audio health. It consumes semantic game events; it cannot create authoritative outcomes.

## Non-Negotiable Invariants

- Every gameplay-critical cue has a visual or caption alternative.
- Audio is driven by semantic events and normalized game signals, not direct private state mutation.
- Priority, voice limits, cooldowns, deduplication, ducking, and peak control are explicit.
- Constant maximum intensity is prohibited; silence and contrast are designed states.
- Long loops avoid obvious repetition and listener fatigue.
- Loudness, true peak, clipping, and stream compression behaviour are measured.
- Missing assets or audio-device/engine failure cannot stop the simulation.
- Assets have verified licence, provenance, version, naming, memory, and replacement metadata.
- Viewer/user text is never spoken or sampled without moderation and explicit policy.

## Workflow

### 1. Build the semantic cue map

For each game event define:

- purpose: information, anticipation, impact, reward, danger, failure, audience acknowledgement, ambience;
- priority and interruptibility;
- intensity derived from validated event data;
- cooldown/dedupe group;
- spatial or non-spatial treatment;
- caption/visual alternative;
- missing-asset fallback;
- telemetry key.

Avoid one bespoke sound callback per mechanic; use reusable semantic categories with game-specific assets.

### 2. Design the mix bus architecture

At minimum separate:

- master;
- music;
- ambience;
- gameplay impacts;
- movement/foley;
- UI/HUD;
- audience interactions;
- voice/narration where approved;
- emergency/system state.

Define bus priorities, side-chain/ducking rules, compression/limiting, spatial width, mute/solo controls, and operator override.

### 3. Create adaptive music states

Map music to a bounded state machine such as:

- intermission;
- calm/progress;
- anticipation;
- danger;
- crisis/boss;
- recovery;
- celebration;
- failure;
- safe maintenance.

Specify entry/exit thresholds, hysteresis, minimum dwell time, transition bars, stingers, stem intensity, fallback track, and no-music periods. Avoid rapid state flapping.

### 4. Define SFX hierarchy and density

Assign criticality:

1. terminal/integrity/emergency;
2. immediate danger and major outcome;
3. milestone, reward, and audience effect;
4. tactical action and movement;
5. ambience and cosmetic variation.

When voices exceed budget, drop or merge lower-priority cues. Use distance, visibility, salience, and recent repetition to choose variations.

### 5. Mix for livestream reality

Test through the actual capture and encoding chain. Define integrated loudness and true-peak targets compatible with the channel, then measure:

- ordinary play;
- dense combat/contact storm;
- celebration/failure stinger;
- paid/free audience acknowledgement;
- intermission and maintenance;
- silence detection;
- mobile speaker intelligibility;
- headphones fatigue.

Keep system/emergency sounds distinguishable without alarming viewers unnecessarily.

### 6. Design long-session variation

Use layered ambience, long-form stems, controlled variation, context-aware sample pools, repetition scoring, and quiet periods. Never randomize at a rate that makes replay authoritative; cosmetic audio may use its own non-authoritative stream.

### 7. Plan accessibility and safety

Provide captions or visual icons for critical cues, independent volume controls where exposed, reduced-intensity variants, no essential reliance on spatial direction alone, and moderation for any displayed/spoken viewer content.

### 8. Engineer reliability and assets

Specify preload/stream policy, decode format, memory budget, pooling, voice cleanup, device/context resume, reconnect, output probe, unintended-silence threshold, underrun/clipping telemetry, hot replacement, and licence manifest.

## Required Outputs

- semantic event-to-cue matrix;
- adaptive music state machine;
- bus/mix/ducking architecture;
- priority, voice, cooldown, and density budgets;
- loudness/true-peak targets and capture-chain test procedure;
- accessibility/caption mapping;
- long-session repetition strategy;
- asset manifest and licence requirements;
- memory/decode/preload/stream budgets;
- audio health, degradation, restart, and operator-control plan;
- representative recordings and automated checks required by each phase.

## Review Gate

Pass only when:

- critical states remain understandable with audio muted;
- event storms stay within voice, loudness, CPU, and clarity budgets;
- adaptive states do not flap and include quiet contrast;
- mobile/stream-encoded recordings preserve important cues;
- no clipping or sustained unintended silence occurs in evidence captures;
- missing assets and engine/device restart degrade safely;
- loops and sample pools survive long-session repetition review;
- all assets have licence/provenance and bounded memory lifecycle;
- public viewer acknowledgements are sanitized and proportionate;
- audio telemetry and operator controls expose failure.

## Stop-Ship Failures

- one sound for every event with no priority;
- constant crisis music;
- clipping accepted because the limiter catches it;
- critical danger conveyed only by stereo direction;
- raw chat text-to-speech;
- unlicensed placeholder music in release builds;
- audio crash stops gameplay;
- audio buffers/listeners grow during soak;
- no capture-chain measurement;
- celebration/gift cue masks a more important failure or danger cue.

## Handoffs

- `game-creative-direction`: emotional and material language.
- `gameplay-progression`, `viewer-retention`, `difficulty-failure-balancing`: state and pacing signals.
- `game-feel-vfx`, `livestream-hud`: cross-modal hierarchy and accessibility.
- `game-architecture`: semantic event and process boundary.
- `performance-optimization`, `long-running-reliability`, `production-readiness-review`: resource, health, soak, and evidence gates.
