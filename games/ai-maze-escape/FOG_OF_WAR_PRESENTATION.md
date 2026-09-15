# Fog of War Presentation

## Principle
Unknown space must feel unknown without leaking hidden maze state.

## Implementation
The browser builds a set of public cells from `snapshot.cells`. When a known cell has a connected neighbor that is not present in the public set, `drawFogVolume` places a dark 3D volume beyond that opening. This uses only information already permitted by the existing public snapshot.

The fragment shader also applies distance fog based on camera-to-fragment distance. This softens distant architecture and prevents the labyrinth from reading as a uniformly lit technical diagram.

## Discovery behavior
As the authoritative snapshot exposes new cells, fog geometry at those public frontiers is replaced by real architecture on the next frame. The presentation does not retain or pre-render hidden rooms.

## Readability
Known floor/wall geometry remains visible near the explorer through local light contribution. Frontier fog is intentionally darker than discovered space. Keys, traps and exits are drawn only when their public state is available.

## Evidence gate
Actual browser captures must be reviewed for sufficient contrast between discovered architecture and frontier darkness; this document does not claim volumetric-quality acceptance until screenshots are inspected.
