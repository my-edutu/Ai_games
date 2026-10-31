# Game 4: readable authored route surfaces — design

**Intent:** Continue PR #55's fixed ASTRO BOT Gauntlet bar. Real desktop and mobile captures still show identical cream square landing pads across ten districts.

**Chosen approach:** Preserve authoritative contact rectangles, route arrows, hazards, checkpoints, camera and all save data. Add a deterministic, purely cosmetic top-surface generator that reuses existing palette materials and static batching to draw distinct district engravings, edge bands and tesserae. Keep central hazards and navigation unobscured. No dependencies, randomly placed ornaments, new textures, lights or misleading bridges.

**Acceptance:** Ten visually distinct deterministic motifs; no out-of-footprint vertices, no raised cosmetic obstacles, bounded triangle counts; unchanged campaign snapshot and same live-control behavior. Inspect actual 3D captures at matched desktop and portrait settings; report remaining distance from the fixed benchmark honestly. Never claim an independent critic if none was available.

**Non-goals:** No simulated hazards, independent agent routes, physics, live audience integration, new character rigs, or production-readiness claims in this increment.
