---
name: gameplay-visual-regression-qa
description: Use when reviewing screenshots, browser captures, visual regressions, HUD/world balance, combat readability, camera framing, clipping, overlap, animation presentation, or spectator comprehension in autonomous games
---

# Gameplay Visual Regression QA

## Purpose

Catch failures that unit tests cannot: flat presentation, unreadable combat, clipping, camera mistakes, bad hierarchy, broken responsive layouts, visual repetition and misleading game states.

## Required capture matrix

Capture representative frames for:

- fresh floor / exploration;
- objective discovered;
- dense ordinary combat;
- ranged telegraph;
- low-health crisis;
- boss phase 1;
- boss phase 2+;
- reward/relic choice;
- floor clear / result;
- reconnect/recovery scene;
- desktop 16:9;
- phone landscape;
- reduced motion;
- clean-feed mode.

## Review sequence

1. **Two-second read:** identify hero, immediate threat and objective.
2. **Ten-second read:** identify floor progress, health/danger and current intent.
3. **World dominance:** verify gameplay world occupies the intended majority of the frame.
4. **Depth:** verify foreground/midground/background separation and coherent occlusion.
5. **Combat:** confirm telegraphs precede impacts and effects do not bury actors.
6. **Camera:** check framing, dead zones, clipping, void exposure and boss arena coverage.
7. **Characters:** compare silhouettes and animation states at actual stream size.
8. **Environment:** check room identity, landmarking, repetition and prop collisions.
9. **HUD:** confirm persistent chrome is subordinate and captions remain accessible.
10. **Cross-mode consistency:** compare desktop/mobile/reduced-motion/clean-feed captures.

## Automated assertions

Where possible, verify:

- canvas has non-trivial world occupancy;
- objective/hero/boss elements remain inside safe frame bounds;
- caption region meets minimum height and does not overlap gameplay-critical controls;
- entity count and effects remain bounded;
- no console errors or unhandled promise rejections;
- no NaN/Infinity coordinates;
- screenshots are non-blank and materially different between dramatic states;
- reduced-motion capture removes shake/large pulses without removing meaning.

## Severity

- P0: blank/black output, authority mismatch, hidden critical truth, crash.
- P1: hero/boss/objective obscured, unreadable telegraph, broken camera, unusable mobile layout.
- P2: obvious repetition, weak hierarchy, awkward clipping, inconsistent material/lighting.
- P3: minor polish, spacing, decorative tuning.

## Gate

A visual pass is complete only when representative screenshots have been captured after the latest code change and all P0/P1 findings are fixed and recaptured. Code review alone is insufficient evidence of visual quality.
