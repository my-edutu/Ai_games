# AI Maze Escape — Audio and Visual Direction

**Status:** Approved design  
**Creative aim:** Turn uncertainty into a readable spectacle: darkness becomes mapped knowledge, routes become hypotheses, threats distort the plan, and the exit produces earned relief.

## Visual Language

The maze uses layered cartographic presentation with a strong explorer silhouette. Cells and passages have semantic states: hidden, currently visible, remembered-confirmed, remembered-uncertain, frontier, blocked, hazardous, objective-related, and invalidated. Critical distinctions use value, texture, outline, icon, and motion—not color alone.

The explorer is the primary moving focus. Keys, doors, clues, traps, checkpoints, threats, and exits have distinct shapes and telegraph states. Hidden truth is never accidentally shown in the public view; omniscient solver overlays are debug/post-result only.

## Camera and Map Reveal

Default framing balances local action with orientation. Camera modes include local exploration, route overview, discovery reveal, threat chase, milestone room, exit/result, route replay, intermission, and safe recovery. Zoom/cuts use hysteresis; reduced-motion uses stable framing and fades.

Discovery animates from unknown to visible to remembered state. The route trail distinguishes planned, traversed, abandoned, and current target paths without overwhelming the maze.

## HUD

Persistent hierarchy:

1. level/depth and escape objective;
2. known-map/discovery progress;
3. current target and AI intent;
4. time/health/threat danger;
5. streak/record;
6. next audience window.

Context cards cover key/door dependency, clue update, hypothesis revision, threat alert, vote, milestone, result, provider degradation, and verified recovery. Debug solver information remains operator-only.

## VFX

Use restrained reveal waves, route pulses, key/door mechanisms, trap telegraphs, threat vision/hearing cones where rules permit, dust/ambient particles, exit beacon, and decisive chase/failure effects. Feedback follows anticipation-impact-recovery and semantic priority. Audience effects share one incoming/application/expiry language and never mask threat or exit state.

## Audio

The soundscape combines spatial ambience, explorer movement, map discovery, mechanical locks, clue tones, hazard telegraphs, and directional-but-redundant threat cues. Music states: intermission, exploration, uncertainty, insight, threat, chase, near-exit, escape, failure, and recovery. Hysteresis and quiet periods prevent constant tension.

Priority protects terminal/integrity, immediate threat/trap, exit/key dependency, milestone/record, audience effect, movement, and ambience. Critical directional cues have visual/caption alternatives. Raw chat text-to-speech is prohibited.

## Accessibility and Performance

Provide color-safe patterns/icons, caption-safe zones, reduced motion/flash, muted-audio comprehension, scalable type, localization-safe cards, and no essential reliance on spatial sound. Cap fog shaders, lights, route segments, particles, threat overlays, floating text, replay length, voices, and texture/audio memory. Quality tiers remove ambient detail before map truth or danger.

## Evidence

Representative recordings/captures must include small/large mazes, dense known maps, fog, locks/keys, chase, vote, exit, failure, route replay, mobile/low bitrate, color-safe, muted, reduced motion, renderer/audio restart, and safe recovery. Assets require licence/provenance/version/fallback, and long-soak resources must remain bounded.
