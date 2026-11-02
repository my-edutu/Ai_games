# AI Maze Escape — Audio and Visual Direction

**Status:** Approved design  
**Creative aim:** Turn uncertainty into a readable spectacle: darkness becomes mapped knowledge, routes become hypotheses, threats distort the plan, and the exit produces earned relief.

## Implemented 3D garden viewer

The current stream viewer uses original procedural Three.js geometry: an articulated amber-and-teal expedition robot, a six-legged armored warden, sandstone/jade terraces, carved ruins, vegetation, lagoon water and distinct interactables. Three coordinate-derived elevations are cosmetic; stairs exist only along disclosed legal navigation edges. Characters, route marks and camera targets share the same ground sampler. The public snapshot supplies cumulative steps; discovery is displayed as the actual known fraction, independently of escape completion.

Follow, close and overview cameras support the current viewer. The full-quality renderer includes dynamic shadows and a generated environment reflection; the software tier retains the same rig parts and navigation geometry with reduced character tessellation. Every resource has an explicit bounded owner. A lost graphics context exposes the live public map immediately, and restoration discards stale motion history and resumes at the latest disclosed position.

Sound is an original, bounded oscillator palette of footsteps, key/lock chimes, danger cues, result phrases and quiet ambient resonance. It starts through user activation, caps simultaneous voices at six and retains captions when muted or unavailable. This implementation is not a claim that every music/VFX state in the broader direction below is finished or independently approved.

The separate development journal records actual captures, independent reference verdicts, remaining gaps and verification. Nintendo's Captain Toad imagery is used for comparison only; no reference artwork or character assets are shipped with the game.

## Visual Language

The maze uses layered cartographic presentation with a strong explorer silhouette. Cells and passages have semantic states: hidden, currently visible, remembered-confirmed, remembered-uncertain, frontier, blocked, hazardous, objective-related, and invalidated. Critical distinctions use value, texture, outline, icon, and motion—not color alone.

The explorer is the primary moving focus. Keys, doors, clues, traps, checkpoints, threats, and exits have distinct shapes and telegraph states. Hidden truth is never accidentally shown in the public view; omniscient solver overlays are debug/post-result only.

## Camera and Map Reveal

Default framing balances local action with orientation. Camera modes include local exploration, route overview, discovery reveal, threat chase, milestone room, exit/result, route replay, intermission, and safe recovery. Zoom/cuts use hysteresis; reduced-motion uses stable framing and fades.

Discovery animates from unknown to visible to remembered state. The route trail distinguishes planned, traversed, abandoned, and current target paths without overwhelming the maze.

## HUD

Persistent hierarchy: level/depth and escape objective; known-map/discovery progress; current target and AI intent; time/health/threat danger; streak/record; next audience window. Context cards cover key/door dependency, clue update, hypothesis revision, threat alert, vote, milestone, result, provider degradation, and verified recovery. Debug solver information remains operator-only.

## VFX and Audio

Use restrained reveal waves, route pulses, key/door mechanisms, trap telegraphs, threat vision/hearing cones where rules permit, dust/ambient particles, exit beacon, and decisive chase/failure effects. Feedback follows anticipation-impact-recovery and semantic priority.

The soundscape combines spatial ambience, explorer movement, map discovery, mechanical locks, clue tones, hazard telegraphs, and directional-but-redundant threat cues. Music states: intermission, exploration, uncertainty, insight, threat, chase, near-exit, escape, failure, and recovery. Hysteresis and quiet periods prevent constant tension.

Priority protects terminal/integrity, immediate threat/trap, exit/key dependency, milestone/record, audience effect, movement, and ambience. Critical directional cues have visual/caption alternatives. Raw chat text-to-speech is prohibited.

## Accessibility, Performance, and Evidence

Provide color-safe patterns/icons, caption-safe zones, reduced motion/flash, muted-audio comprehension, scalable type, localization-safe cards, and no essential reliance on spatial sound. Cap fog shaders, lights, route segments, particles, threat overlays, floating text, replay length, voices, and texture/audio memory. Quality tiers remove ambient detail before map truth or danger.

Representative evidence includes small/large mazes, dense maps, fog, locks/keys, chase, vote, exit, failure, route replay, mobile/low bitrate, color-safe, muted, reduced motion, renderer/audio restart, and safe recovery. Assets require licence/provenance/version/fallback, and soak resources must remain bounded.
