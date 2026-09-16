# AI Dungeon — Benchmark Review and Skill Gap

Research date: 2026-09-16

This is a reference set of ten leading or genre-defining action-roguelite/dungeon-ARPG games, **not a ranking**. The purpose is to identify capabilities AI Dungeon should learn from without cloning assets, characters, story, layouts or mechanics.

## Reference set

1. **Hades II** — benchmark for combat readability, audiovisual hierarchy, build choices, encounter pacing and continuous narrative payoff.
2. **Hades** — benchmark for room-to-room pacing, strong silhouette language, reactive storytelling and run identity.
3. **Diablo IV** — benchmark for environmental production value, loot fantasy, build progression, enemy density and world atmosphere.
4. **Path of Exile 2** — benchmark for deep build expression, skill/item interactions, boss volume and endgame content breadth.
5. **Last Epoch** — benchmark for skill specialization, loot/crafting readability and build experimentation.
6. **V Rising** — benchmark for clean top-down combat telegraphs, boss identity, spell selection and readable action in dark environments.
7. **No Rest for the Wicked** — benchmark for painterly environmental depth, weighty spatial combat and authored-feeling traversal.
8. **Ravenswatch** — benchmark for strongly differentiated hero kits, dark-fantasy atmosphere and replayable randomized activities/enemies.
9. **Dead Cells** — benchmark for game feel, attack responsiveness, pattern-readable enemies/bosses, route variation and rapid recovery after failure.
10. **Children of Morta** — benchmark for procedural dungeon identity, multiple biomes, character differentiation, modern lighting over stylized art and story-driven run context.

## Current AI Dungeon against this reference set

### 1. World fidelity — major gap, rebuild started

**Before rebuild:** the game rendered cells, grid strokes and vector icons. The simulation knew rooms but the player/viewer did not experience authored-feeling places.

**Reference lesson:** the best games make regions identifiable without labels through architecture, materials, lighting, props, elevation and encounter composition.

**Action:** keep seven biome families but deepen each into modular environment kits, room-specific prop grammar, landmark silhouettes, foreground/background layers and transition spaces.

### 2. Combat feel — major gap

Authority is stable and deterministic, but presentation does not yet have a complete attack envelope: anticipation -> active window -> hit/miss -> impact -> stagger/knockback -> recovery. Current character art also lacks complete locomotion/attack animation sets.

**Action:** create event-driven animation timelines for melee, ranged, cast, guard, dodge, damage, knockback, death and victory. Add hit-stop only as presentation time, never authority time. Differentiate sword/hammer/bow/staff-style visual language when supported by build state.

### 3. Build expression — major systemic gap

The current relic catalogue is small and mostly direct stat increments. This is much shallower than the build identity seen in Hades/Hades II, Path of Exile 2 or Last Epoch.

**Action:** expand from stat-only relics into bounded deterministic synergies: attack-shape modifiers, guard retaliation, ranged chaining, low-health risk/reward, status interactions, resource conversion and biome/elite conditional effects. Preserve caps and deterministic resolution.

### 4. Boss identity — major gap

There is one generic authoritative `chapter-boss` kind with scaling stats/phases. Presentation can now enter boss mode, but the game needs multiple boss families with mechanics that are recognisable from silhouette and telegraph alone.

**Action:** build at least 5 boss archetypes with unique arenas, attacks, phase transitions, safe zones, adds/environment interactions and audiovisual identities. Do not merely scale HP.

### 5. Enemy ecosystem — moderate/major gap

Existing enemies already have useful tactical identities: swarm, controller, ranged caster, flanker and ambusher. This is a strong foundation, but five non-boss families cannot sustain an endless game.

**Action:** build biome-specific variants and elite modifiers that change behavior, not only stats. Compose encounters around complementary roles and spatial constraints.

### 6. Procedural rooms — major gap

The generator creates connected rectangles/corridors and validates mandatory reachability. That is reliable but visually and tactically simple compared with authored-feeling procedural games.

**Action:** retain the safe graph but add presentation/encounter grammars for combat chamber, treasure, shrine, crypt, library, forge, prison, ritual, flooded room, puzzle room, sanctuary and boss arena. Add doorway placement and obstruction validation.

### 7. Traversal/depth — major gap

The first rebuild adds presentation elevation, but authority remains flat-grid movement. The visual system therefore cannot yet support true stairs, bridges, pits or multi-height tactical traversal that affects play.

**Action:** first use elevation for visual depth only. Then separately design a versioned authoritative height/traversal model if verticality should affect gameplay. Do not let rendering silently invent collision rules.

### 8. Loot fantasy — major gap

Relic choices exist but physical loot fantasy is weak. Top ARPGs make drops, rarity and equipment changes emotionally legible.

**Action:** world pickups, chest opening, rarity beams/glows within accessibility limits, weapon/equipment silhouettes, short pickup cards and build-completion milestones.

### 9. Narrative/watchability — opportunity

AI Dungeon already tracks semantic events and AI intent, which gives it a unique livestream advantage. However, story is still mostly a feed/summary rather than environmental or character storytelling.

**Action:** use real run events to create bounded narrator captions, rivalry/recurrence tags, boss history, relic-combo names, near-death callbacks and run summaries. Never fabricate outcomes.

### 10. Animation/character quality — major gap

Current vector silhouettes are clear but not yet competitive with high-end character animation.

**Action:** articulated layered rigs or licensed/original skeletal sprites/3D models, directional locomotion, anticipation/recovery poses, additive hit reactions, death variants and visible equipment anchors.

### 11. Camera/occlusion — rebuild started

The old camera followed visible cell bounds. The new director has modes but still requires smooth world-space target selection, cutaway/fade rules, boss framing, look-ahead and collision-safe bounds.

### 12. Audio — moderate gap

Adaptive synthesized semantic audio is architecturally sound and failure-safe but lacks the authored texture of benchmark games.

**Action:** biome ambience layers, weapon families, enemy vocals, room acoustics/reverb sends, directional/positional cues, boss motifs and transition stingers while retaining semantic priority/cooldowns.

### 13. Performance — new risk introduced by visual ambition

The former vector renderer was cheap. More depth, lights, particles and animated entities increase long-session risk.

**Action:** establish explicit budgets for draw calls, visible tiles, dynamic lights, particles, animated entities, memory and frame time; progressively migrate to WebGL/Three.js if Canvas becomes the bottleneck.

## Existing skills that should be applied aggressively

- `game-creative-direction`
- `game-feel-vfx`
- `game-audio`
- `procedural-generation`
- `gameplay-progression`
- `difficulty-failure-balancing`
- `autonomous-agent-design`
- `deterministic-simulation`
- `game-physics`
- `performance-optimization`
- `long-running-reliability`
- `simulation-qa`
- `livestream-hud`
- `viewer-retention`
- `production-readiness-review`
- `security-privacy`

## New skills worth adding

### `isometric-world-rendering`
Own projection, modular world geometry, elevation, depth sorting, occlusion, cutaways, lighting and Canvas/WebGL/Three.js renderer boundaries.

### `character-animation-state-machines`
Own animation graphs, anticipation/active/recovery timing, facing, locomotion, additive hit reactions, equipment anchors and transition validation.

### `combat-presentation-director`
Own semantic hit timing, trails, projectiles, hit stop, stagger, knockback, camera impulses, readability and weapon identity while authority stays untouched.

### `boss-encounter-design`
Own boss silhouette, arena grammar, phase logic, attack telegraphs, mechanic escalation, camera/music/light choreography and fairness tests.

### `procedural-environment-art`
Own biome kits, room dressing grammar, prop placement, landmarks, material variation, repetition control and obstruction validation.

### `cinematic-camera-occlusion`
Own follow/look-ahead, combat framing, boss framing, wall fading/cutaways, target switching, shake limits and reduced-motion behavior.

### `spatial-game-audio`
Own positional audio, biome ambience, combat layers, boss states, ducking, voice budgets, reverb zones and long-session fatigue.

### `visual-regression-gameplay-qa`
Own deterministic screenshot seeds, scenario capture matrix, HUD-hidden screenshot tests, pixel/perceptual comparison, browser-size coverage and evidence retention.

### `webgl-performance-budgeting`
Own frame-time/GPU/draw-call/material/light/particle budgets, pooling, instancing, culling, LOD, disposal and soak profiling.

## Recommended execution priority

P0: combat presentation, character animation, world rendering, boss identity, screenshot QA.

P1: procedural environment art, camera/occlusion, loot fantasy, audio identity, performance budgeting.

P2: deeper build synergies, more enemy families, narrative systems and optional authoritative vertical traversal.

## Definition of competitive progress

The rebuild should not be judged by whether it has more particles or a more attractive HUD. It has progressed when HUD-hidden captures show a believable dungeon place; attacks are readable without labels; enemies can be distinguished by silhouette/behavior; rooms/biomes are recognisable; loot and bosses create strong peaks; and the autonomous run remains understandable for long livestream sessions.
