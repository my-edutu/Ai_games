---
name: character-animation-state-machines
description: Use when building or reviewing gameplay character animation graphs, locomotion, attacks, casting, dodges, blocks, hit reactions, death, equipment anchors or event-to-animation mapping.
---

# Character Animation State Machines

## Objective
Make authoritative actions visibly causal through clean anticipation, action and recovery states while preventing animation from becoming hidden gameplay authority.

## Invariants
- Simulation action/result selects animation; animation never decides whether a hit occurred.
- No sliding or unexplained cell teleportation.
- Every transition has an interrupt/priority policy.
- Hit/death/result states outrank cosmetic idles.
- Reduced-motion mode preserves timing meaning without excessive displacement.
- Animation pools/listeners/tweens clean up on restart/restore.

## Minimum player graph
idle, walk/run, attack, heavy attack if supported, ranged/cast, dodge, block/guard, hit reaction, knockback, interact, loot/open, use item, injured, death, victory and boss-victory.

## Enemy graph
idle, locomotion, detect/prepare, attack/cast/leap, guard/special, hit reaction, stagger/knockback, death and elite/boss phase transition.

## Workflow
1. Inventory authoritative actions/events.
2. Define priority and transition table.
3. Specify anticipation/active/recovery windows as presentation timing tied to semantic events.
4. Add facing, locomotion speed and foot locking.
5. Add equipment/socket anchors.
6. Add additive reactions for hit/shield/status without restarting locomotion unnecessarily.
7. Validate animation under rapid event sequences and restore/replay.
8. Capture representative clips/screenshots for every critical state.

## Review gate
Pass when an observer can infer what the actor is doing without reading labels, attacks never visually connect when authority says miss, locomotion has no sliding, transitions do not pop under event storms and boss states remain readable at stream scale.
