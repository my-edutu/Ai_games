---
name: procedural-environment-art
description: Use when designing or reviewing procedural rooms, biomes, dungeon dressing, props, landmarks, silhouettes, materials, lighting, spatial storytelling, repetition control, or environment readability in autonomous games
---

# Procedural Environment Art

## Purpose

Turn deterministic level topology into a coherent authored-looking place without allowing presentation logic to mutate gameplay authority.

## Core rule

Procedural variety is not random decoration. Every generated space needs a stable visual identity, traversal readability, landmarks, controlled repetition and a clear hierarchy between gameplay-critical and cosmetic content.

## Workflow

1. Derive visual zones from authoritative rooms, corridors, objectives and encounter spaces.
2. Assign one primary archetype per room; never independently randomize every tile into unrelated themes.
3. Give objective rooms stronger identities: sanctuary/entrance, ritual/sigil, treasure/chest, shrine/recovery and boss/gate.
4. Select biome-level material and lighting families before individual props.
5. Dress rooms with bounded prop kits appropriate to the room archetype and biome.
6. Reserve empty space around paths, combat centers, telegraphs, objectives and camera focus points.
7. Add landmark objects to reduce maze-like sameness and improve spectator orientation.
8. Use deterministic variants so identical authority produces identical presentation evidence.
9. Test screenshots at exploration, dense combat, boss, reward and low-health states.
10. Degrade decorative density before removing gameplay-critical silhouettes or cues.

## Required systems

- room-to-archetype mapper;
- biome palette/material families;
- deterministic prop placement with hard caps;
- landmark/hero-object placement;
- corridor dressing rules distinct from room dressing;
- objective-room kits;
- lighting state per biome and dramatic state;
- collision-safe decoration masks;
- repetition detector for excessive identical props/materials;
- quality tiers for low-end rendering.

## Quality gates

Pass only when:

- a screenshot can communicate the current biome and room purpose without HUD text;
- adjacent rooms have coherent identities rather than per-tile visual noise;
- paths and attack telegraphs remain readable under maximum dressing;
- props do not appear inside characters, gates or critical interaction space;
- repeated rooms still differ through layout-aware dressing rather than arbitrary color changes;
- boss arenas read as deliberate spaces before the boss attacks;
- deterministic replay produces the same dressing for the same floor state;
- decorative content remains bounded during endless play.

## Stop-ship failures

- random props scattered uniformly across every walkable tile;
- a single room mixing unrelated visual archetypes;
- decorations obscuring combat or objective readability;
- biome swaps implemented only as background color changes;
- procedural content depending on ambient randomness or wall-clock time;
- visual generation modifying authoritative collision, reward or AI state;
- unbounded prop/light counts;
- every room having identical density and silhouette.
