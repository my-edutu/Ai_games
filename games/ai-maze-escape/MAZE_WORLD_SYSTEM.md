# Maze World System

## Source of truth
The presentation layer receives the existing sanitized maze snapshot. Public cell IDs and neighbor lists remain authoritative; the renderer never invents traversable connections.

## Spatial mapping
Each public maze cell maps to a 1×1 world-space module on X/Z. Floor slabs sit slightly below the traversal plane. Missing neighbor connections create wall prisms with actual height and thickness. Connected public neighbors remain open. Connected but undiscovered neighbors receive a fog volume rather than speculative geometry.

## Room composition
`selectRoomArchetype` uses public topology/state plus deterministic `presentationSeed` variation. Archetypes affect material and non-colliding presentation props only. Examples include pillar halls, service tunnels, root breaches and research junctions.

## Interactables
- Doors render at the midpoint of their authoritative cell pair and visually distinguish open/closed state.
- Keys render at their public cell until collected.
- Trap presentation is emitted only for public cells whose snapshot says `trap`.
- Threats render only from public threat records.
- Exit geometry renders only when `exitCell` is public/non-null and in view.

## Privacy constraint
No renderer path may query or reconstruct undiscovered cell metadata. Unknown space is represented as unknown space.
