---
name: livestream-hud
description: Use when designing or reviewing stream overlays, HUD hierarchy, progress displays, records, AI intent, chat decisions, audience acknowledgements, broadcast safe zones, mobile legibility, scenes, or operator-visible status
---

# Livestream HUD

## Overview

Make the game’s objective, progress, danger, record, and audience opportunity instantly understandable without covering the spectacle. The core principle is **broadcast information hierarchy, not dashboard accumulation**.

## Scope

Use for stream-facing HUD, overlays, scene states, vote cards, public status, AI intent, records, captions, intermission, clean feed, and mobile/crop safety. Operator diagnostics belong in the operator dashboard unless a restrained public state is necessary.

## Non-Negotiable Invariants

- The primary goal/progress is the strongest persistent information element.
- Critical gameplay remains understandable at representative mobile size and after stream compression.
- Public HUD consumes sanitized render snapshots and presentation events only.
- Debug, secrets, raw provider payloads, exact payment details, internal viewer IDs, and private moderation data never appear.
- Color is never the sole carrier of meaning.
- Chat/vote/gift acknowledgements are bounded, rate-limited, sanitized, and lower priority than danger/result truth.
- Layouts respect 16:9, configured safe zones, captions, and common mobile crops.
- Failure, degradation, maintenance, and recovery states are truthful but not alarmist.
- HUD animations/elements clean up across restart, replay, reconnect, and scene transition.

## Workflow

### 1. Define the ten-second questions

The HUD must answer, in order:

1. What is happening?
2. What is the goal?
3. How far has the run progressed?
4. What is the immediate danger or decisive tension?
5. What record/milestone matters?
6. What can the audience do next, and when?

Anything else is secondary or operator-only.

### 2. Create an information hierarchy

Assign each datum to:

- persistent primary;
- persistent secondary;
- contextual card;
- transient acknowledgement;
- intermission/result;
- captions/accessibility;
- clean-feed optional;
- operator-only.

Define maximum concurrent cards, text lengths, dwell times, update rates, dedupe, truncation, and priority. Progressive disclosure beats many always-visible panels.

### 3. Build scene contracts

Specify HUD state for:

- countdown;
- normal play;
- danger/crisis;
- milestone/boss;
- audience decision window;
- accepted/queued/rejected influence acknowledgement;
- win/loss/draw/record;
- replay;
- intermission/next seed;
- provider degraded;
- maintenance;
- safe recovery/quarantine;
- clean feed.

Every scene has required data, optional data, transition, timeout, and fallback when a field is unavailable.

### 4. Design goal and progress components

Use units viewers understand: floor, day, length, survivors, rooms, territory, population, distance, flow, or percentage. Show milestone markers and record comparison without misleading interpolation.

For endless games, expose the current cycle/era/wave and best record so progress never feels undefined.

### 5. Present AI intent safely

Show validated fields such as current goal, short intent, confidence band, obstacle, fallback mode, or plan-change reason. Limit cadence and length so it explains action without becoming a scrolling reasoning log. Never show hidden chain-of-thought, raw prompt/response, or private inputs.

### 6. Design audience interactions

Decision cards state:

- eligible options with icons and plain language;
- disclosed effect bounds;
- countdown based on authoritative window;
- voting/weight rules appropriate for public disclosure;
- result and scheduled/application state;
- rejection/expiry/provider-degraded fallback;
- sanitized contribution acknowledgement.

Paid status may change acknowledgement treatment or eligible weighting only according to policy; it cannot visually promise a guaranteed outcome.

### 7. Test accessibility and compression

Specify minimum rendered font/icon sizes at output resolution, contrast, outlines/background treatments, color-safe variants, motion/flash limits, caption zones, screen-reader/operator labels where relevant, and localization expansion.

Capture at full output, phone portrait viewing of the landscape stream, low bitrate, bright/dark scenes, high VFX density, and color-vision simulations.

### 8. Separate public and operator truth

Public status uses clear states such as “Chat reconnecting—AI continues” or “Restoring verified checkpoint.” Operator UI receives detailed errors, queue depth, versions, alerts, and actions. A technical failure must never masquerade as a normal game loss.

## Required Outputs

- ten-second comprehension hierarchy;
- data inventory and public/operator classification;
- scene/state contract;
- component specifications for goal, progress, danger, record, intent, vote, acknowledgement, result, and recovery;
- safe-zone/crop/resolution grid;
- typography, icon, contrast, color, motion, flash, caption, and localization rules;
- text sanitization, limits, rate, priority, and overflow policy;
- clean-feed and OBS/browser-source requirements;
- representative capture and comprehension test plan;
- HUD performance, cleanup, telemetry, and recovery requirements.

## Review Gate

Pass only when:

- uninstructed viewers identify goal, progress, danger, and current phase within ten seconds;
- phone-size and low-bitrate captures preserve primary information;
- peak VFX plus vote/acknowledgement load does not obscure gameplay;
- all public text is sanitized, bounded, and privacy-safe;
- critical meaning survives grayscale/color-blind and muted-audio tests;
- captions have reserved space and animations have reduced variants;
- provider/recovery states are truthful and distinguish game loss from system failure;
- operator diagnostics remain outside public output;
- clean feed and source restart restore from current render snapshot;
- overlay updates meet CPU/GPU/frame and memory budgets during soak.

## Stop-Ship Failures

- every statistic is permanently visible;
- tiny text designed only on a desktop monitor;
- raw chat or payment text displayed;
- exact internal error/stack trace appears publicly;
- AI chain-of-thought panel;
- vote result visually guarantees an outcome it only influences;
- countdown uses unsynchronized wall-clock and applies after zero inconsistently;
- captions overlap critical goal data;
- debug overlay accidentally enabled in production;
- stale HUD persists after run restart or restore.

## Handoffs

- `game-creative-direction` and `gameplay-progression`: premise, progress, milestone, result hierarchy.
- `autonomous-agent-design`: safe intent schema.
- `audience-interaction` and `crowd-moderation`: choices, disclosures, sanitation, acknowledgement.
- `game-feel-vfx` and `game-audio`: cross-modal priority and safe zones.
- `viewer-retention`: timing and contextual information.
- `performance-optimization`, `security-privacy`, `production-readiness-review`: budgets, exposure, and broadcast evidence.
