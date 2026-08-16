---
name: game-feel-vfx
description: Use when designing or reviewing animation feedback, particles, camera motion, impact, anticipation, hit stop, trails, transitions, celebrations, failures, readability, reduced-motion, or visual performance budgets
---

# Game Feel and VFX

## Overview

Translate authoritative events into immediate, readable, satisfying sensory feedback without hiding gameplay or destabilizing performance. The core principle is **anticipation, impact, and recovery arranged by semantic priority**.

## Scope

Use for animation states, particles, camera, screen-space effects, transitions, feedback timing, replay moments, celebrations, failures, and visual degradation. VFX and camera consume render snapshots/events and never mutate authority.

## Non-Negotiable Invariants

- A viewer can read the event before spectacle obscures it.
- Feedback intensity derives from semantic severity, not arbitrary callbacks.
- Critical goal, danger, entity, and path silhouettes remain legible at mobile viewing size.
- Particle counts, lifetimes, emitters, overdraw, textures, camera impulses, and concurrent effects have budgets.
- Reduced-motion and reduced-flash variants are designed, not automatic afterthoughts.
- Camera effects cannot change controls, collision, AI observations, or authoritative time unless a versioned command explicitly does so.
- Repeated/common events receive less visual weight than rare/terminal events.
- Presentation failure degrades or restarts without stopping simulation.
- Effects are pooled/cleaned and remain bounded during soak.

## Workflow

### 1. Build a feedback hierarchy

Classify semantic events:

1. integrity/terminal result;
2. immediate lethal danger or decisive outcome;
3. major milestone, boss, record, comeback;
4. audience influence acknowledgement;
5. tactical hit, collect, movement, choice;
6. ambient world activity.

Define what may interrupt, combine, queue, or be suppressed. Never let a lower-priority paid/cosmetic cue mask a critical game event.

### 2. Design the feedback envelope

For each event specify:

- pre-cue/anticipation;
- source and target emphasis;
- impact frame and timing;
- authoritative versus presentation-only time behaviour;
- particles, trails, decals, shader, flash, text, camera, and audio sync;
- recovery/decay;
- repetition/cooldown;
- accessibility variants;
- telemetry/dedupe key.

Small events may use only one or two channels. Reserve full multi-channel treatment for major moments.

### 3. Protect readability

Define visual hierarchy for protagonist, goal, hazards, interactables, audience effects, background, and debug/operator information. Use shape, motion, value, outline, depth, and spacing—not color alone.

Test ordinary, dense, dark, bright, color-blind, compressed, cropped, and mobile-size scenes. Hide or simplify background/effects before hiding outcome-relevant information.

### 4. Direct the camera

Specify base framing, look-ahead, target switching, zoom bands, dead zones, smoothing, bounds, occlusion handling, split/overview/replay modes, and emergency framing.

Camera impulses have magnitude, frequency, duration, stacking, and cooldown limits. Provide reduced-motion mode and prevent rapid zoom/cut oscillation.

### 5. Budget effects

Declare quality tiers and hard caps for:

- active particles and emitters;
- transparent overdraw;
- full-screen passes;
- dynamic lights/shadows;
- texture/atlas memory;
- trails/decals;
- simultaneous animations;
- floating text/cards;
- camera impulses and slow-motion moments;
- replay buffers.

Degradation order removes cosmetic ambience first, then density/quality; it never drops critical cues.

### 6. Design celebrations, failures, and restart

Every result sequence has:

- authoritative cause and frozen/clear state;
- focus on decisive moment;
- result identity and record treatment;
- brief replay where useful;
- emotional release;
- reset/next-seed transition;
- maximum duration and skip/operator policy;
- safe variant during recovery or provider outage.

Loss should be visually satisfying and causal, not look like a crash.

### 7. Test state cleanup

Exercise scene changes, pause/resume, restore, restart, replay, quality-tier change, renderer crash/reload, and long contact storms. Verify emitters, tweens, timers, listeners, textures, render targets, and camera effects clean up or restore correctly.

## Required Outputs

- semantic feedback priority matrix;
- event feedback-envelope catalogue;
- visual hierarchy and mobile-legibility rules;
- camera state machine and impulse limits;
- VFX/animation/texture/replay budgets and quality tiers;
- reduced-motion, reduced-flash, color-safe, and caption-adjacent variants;
- result/intermission/restart choreography;
- cleanup and renderer-recovery plan;
- representative screenshot/recording test matrix;
- performance and soak evidence requirements.

## Review Gate

Pass only when:

- goal, danger, agent, and decisive event remain readable under peak effect load;
- feedback priorities suppress/merge correctly during event storms;
- mobile and compressed-stream captures pass comprehension review;
- reduced-motion/flash variants preserve meaning;
- camera does not oscillate, expose voids, or hide outcome-critical action;
- peak effects meet frame, overdraw, memory, and draw-call budgets;
- restart/restore leaves no orphaned effects or state;
- result and loss sequences clearly distinguish gameplay outcome from technical failure;
- paid/cosmetic effects never dominate higher-priority danger/result cues;
- renderer restart restores a coherent scene from the latest render snapshot.

## Stop-Ship Failures

- particles and shake used as the default definition of polish;
- full-screen flash without limits/alternative;
- critical state conveyed by color only;
- hit stop mutates authoritative time accidentally;
- camera tracks an entity after death/removal;
- floating text grows without bound;
- low-end degradation removes hazard cues;
- renderer owns score/collision logic;
- loss animation hides the actual cause;
- effect pools/textures/listeners grow during soak.

## Handoffs

- `game-creative-direction`: style constitution and emotional tone.
- `game-physics`: semantic contact severity and transforms.
- `game-audio`: synchronized cross-modal priority.
- `livestream-hud`: avoid hierarchy conflicts and safe-zone collisions.
- `viewer-retention`: dramatic emphasis and replay cadence.
- `performance-optimization`, `simulation-qa`, `long-running-reliability`: budgets, visual tests, and renderer recovery.
