---
name: platformer-experience-review
description: Use when designing, building, tuning, or reviewing a platformer where movement feel, character animation, camera, obstacle readability, fairness, level rhythm, visual hierarchy, or spectator clarity materially affect the experience.
---

# Platformer Experience Review

## Overview

Judge the platformer as a second-by-second experience, not as a collection of attractive assets. A feature passes only when players can read it, predict it, control it, feel it, and recover from it at real gameplay speed.

**REQUIRED SUB-SKILLS:** Use `game-creative-direction`, `game-physics`, and `game-feel-vfx` for their domains. Use `performance-optimization` whenever frame time can change control or readability. This skill does not replace deterministic simulation, architecture, accessibility, audio, or production-readiness review.

## Non-Negotiable Invariants

- Control quality outranks cinematic presentation.
- A skilled player must have a readable opportunity to avoid or recover from ordinary hazards.
- Character silhouette remains legible through every costume, pose, VFX state, and camera distance.
- Camera behaviour must reveal decisions before they become mandatory and must not create deaths.
- Background detail, particles, crowds, vehicles, UI, and lighting may never hide the safe path or immediate danger.
- Animation expresses anticipation, action, impact, recovery, and weight without delaying authoritative control unfairly.
- Constant intensity is a failure; levels need readable contrast and recovery space.
- Performance degradation may reduce presentation fidelity but must not change gameplay truth or materially alter input feel.

## Review Workflow

1. **Capture representative moments.** Review first 30 seconds, ordinary traversal, maximum-speed movement, chained jumps, landing after a large fall, moving hazards, dense scenery, near-miss, hit, death, restart, costume variants, mobile viewport, and low-performance mode.
2. **Review at two speeds.** Judge first at normal gameplay speed, then use slow motion/frame stepping to diagnose timing, pose, collision, anticipation, camera, and VFX defects.
3. **Separate the layers.** Score control/physics, animation, camera, level/hazard design, art/readability, world identity, VFX/audio feedback, pacing, accessibility, performance, and spectator comprehension independently before combining them.
4. **Prove obstacle fairness.** For every hazard class record warning cue, first decision point, minimum reaction window, safe response, collision truth, recovery option, and failure cause. “Realistic chaos” is not an exemption.
5. **Run the silhouette test.** Inspect idle, run, jump, apex, landing, slide, hit, recovery, and every major costume against bright, dark, and cluttered backgrounds.
6. **Run the camera-causality test.** Any failure where the player could not see the relevant landing surface, hazard, route, or state change before commitment is a camera/level defect until disproved.
7. **Run the mechanics-only test.** Ignore theme, texture, UI branding, and cultural props. The movement, timing, camera, hazards, feedback, and recovery must still make an excellent platformer.
8. **Run the identity test.** Ignore the title. World behaviour, silhouettes, props, soundscape, traversal situations, and environmental storytelling should make the game recognizably itself rather than a generic platformer with themed decoration.
9. **Record findings in the required contract.** Do not approve from screenshots, trailers, or a single showcase seed.

## Finding Contract

Every material finding uses:

`Moment → Expected experience → Observed experience → Why it succeeds/fails → Severity → Exact improvement → Verification test`

Avoid vague findings such as “make it smoother,” “improve graphics,” or “add more polish.” Name the timing, pose, camera behaviour, readability failure, reaction window, performance condition, or feedback defect that must change.

## Experience Score

Use a 100-point score only after stop-ship review: movement/controls 15, animation 12, character/art direction 10, camera 8, level/obstacles 12, readability/fairness 10, world identity 10, game feel/audio/VFX 8, emotional pacing 5, spectator/replay value 5, accessibility/mobile 3, performance consistency 2.

A high score cannot override a stop-ship defect.

## Stop-Ship Defects

Block the phase gate when any representative build contains:

- ordinary unavoidable or unreadable hits;
- camera-caused failure or hidden landing information;
- frame-rate-dependent control or collision outcomes;
- movement transitions that materially break player intent;
- costume/animation states that destroy the playable silhouette;
- VFX, lighting, crowds, UI, or scenery that obscures actionable gameplay;
- repeated pacing with no anticipation/recovery contrast;
- inaccessible critical cues without a supported alternative;
- performance spikes that materially change control feel;
- cultural identity carried only by labels, flags, stereotypes, or decorative reskins.

## Required Evidence

Produce an evidence bundle containing representative captures, normal-speed and slow-motion notes, hazard fairness table, camera-causality findings, costume/silhouette review, mobile/low-tier capture, frame-time summary, 100-point score, stop-ship status, and exact regression checks for every major fix.

## Handoffs

Use `game-creative-direction` for fantasy and identity, `gameplay-progression` for level rhythm, `game-physics` for movement/collision truth, `game-feel-vfx` and `game-audio` for feedback, `livestream-hud` for spectator hierarchy, `performance-optimization` for frame budgets, `simulation-qa` for seeded coverage, and `production-readiness-review` before launch claims.
