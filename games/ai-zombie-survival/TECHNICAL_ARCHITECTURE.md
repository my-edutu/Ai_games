# Technical Architecture

`simulation.ts` owns authoritative state and fixed-step transitions. `world.ts` creates seeded districts, structures, loot, survivors, zombies and barricades. `director.ts` selects camera events without mutating gameplay. `presentation.ts` creates detached render snapshots. `visuals.ts` maps gameplay action into readable poses/palettes. `web/app.ts` renders Canvas 2D isometric presentation and compact HUD.

The game has its own ES2022 TypeScript build and no runtime dependency on another game package.
