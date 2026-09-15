# Art Direction — Lost Facility Inside Ancient Ruins

## Core identity
The maze is an ancient subterranean complex that has been partially occupied, excavated and retrofitted by a failed research operation. Old stone remains the dominant architectural mass; facility infrastructure appears as interventions rather than a second unrelated world.

## Material language
- Ancient layer: dark stone, worn masonry, moss, roots, collapsed fragments, pillars and shrine forms.
- Facility layer: oxidized metal, service rails, restrained cyan instrumentation, rust, emergency red and warm utility light.
- Objective layer: keys and exit use warm gold / pale green contrast so gameplay remains readable.
- Danger layer: traps and threats use restrained red rather than full-scene neon.

## Room archetypes
`ruin-corridor`, `service-tunnel`, `root-breach`, `machine-pass`, `torch-gallery`, `junction-lab`, `pillar-hall`, `collapsed-sanctum`, `dead-end-cache`, `archive-shrine`, `research-nexus`, and `exit-vault`.

Archetypes are selected deterministically from public cell state and topology. They are visual composition choices only and never change collision, pathfinding or outcomes.

## Composition rules
The world must remain legible at broadcast scale. Props stay inside safe visual zones and do not imply obstacles unless the authoritative maze already blocks that passage. Unknown directions terminate in darkness/fog. UI stays subdued so the maze carries the visual hierarchy.

## Anti-patterns
Do not return to cell-grid lines, floating debug dots, full-screen neon, random theme mixing, decorative hazards unsupported by state, fake hidden rooms, or UI panels that dominate the world.
