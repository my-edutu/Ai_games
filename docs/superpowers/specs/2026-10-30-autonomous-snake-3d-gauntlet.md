# Autonomous Snake 3D Gauntlet


> **NOVEMBER 1, 2026 — USER-APPROVED TRANSFORMATION OVERRIDE (binding).** The user has explicitly replaced micro-improvement rounds with a **transformation-focused Gauntlet**. The **acceptance criterion** is whether the *real running game* looks, feels, animates, and plays **substantially better as a coherent whole** against its own before version and the fixed Snake Pass/ASTRO BOT art references. A small change passing CI, minor pixel percentages, faster partial scenes, added test count, or another numbered round **never** constitutes a quality win. Deliver integrated world/character/material/motion/gameplay improvements, keep the same milestone open until before/after actual screenshots and uninterrupted autonomous play reveal a large positive change, and require independent critique where available. Preserve the strict 17-actual-render-submission gate and all authority/recovery/accessibility requirements. The new governing quality charter and milestone gates are in [TRANSFORMATION_GAUNTLET.md](../../reviews/snake-gauntlet/TRANSFORMATION_GAUNTLET.md); they supersede older small-slice tactics in this spec and its historic implementation plan. The old 3D design, deterministic gameplay and safety constraints below remain valid.

## Approved goal

The user approved applying the supplied Gauntlet prompt: turn Autonomous Snake into a complete, beautiful 3D game, preserving deterministic autonomous gameplay, and iterate with independent critics against real Snake Pass media. The lead chooses implementation details and continues without requesting another design approval.

## Quality bar

Compare actual runtime screenshots and motion against Sumo Digital's Snake Pass official gallery and Launch Trailer: https://store.steampowered.com/app/544330/Snake_Pass/. ASTRO BOT's official gallery is a secondary environment reference. These references inform craftsmanship, not copied assets or new platforming rules.

Comparison criteria established before implementation: finished continuous snake anatomy and expression; coherent material and lighting detail; authored scene depth and environmental richness; readable head/body/food/danger; smooth truthful movement; complete scene transitions and accessible controls; bounded rendering and uninterrupted autonomous simulation. Record character detail, overview, dense gameplay, collection, result/restart and mobile captures. Use randomized, anonymously labelled comparable captures for visual criticism where practical. No win is inferred from green tests.

## Design

An original verdant ruins diorama: a golden-green expressive serpent navigating a mossy stone garden suspended above water, with authored vegetation, weathered ruins, warm sunlight, cool shadows and restrained atmosphere. The authoritative rectangular grid remains visually readable. An immersive restrained broadcast HUD presents current length, goal, occupancy, best record and meaningful AI intent. The game remains continuously self-playing.

Use the existing pinned Three.js dependency for a client-side renderer consuming existing immutable public snapshots. Keep simulation rules, AI, snapshot schema, score, paid influence and lifecycle unchanged. Provide safe fallback/recovery when WebGL fails. Build reusable character and environment modules, with rendering orchestration separate from the HUD and audio.

## Required behavior

- Actual 3D geometry and lighting, not a pre-rendered background.
- Snake movement respects discontinuities (portals, restart) and never invents an interconnecting body across a teleport.
- A safe board overview remains available; any cinematic camera is presentation-only.
- Public gameplay retains goal, danger and caption comprehension at desktop, mobile landscape and portrait sizes.
- Reduced-motion and mute settings, clean feed, reconnect and result transitions work.
- Rendering resources, particles, audio voices and retained snapshots remain bounded; renderer failure does not stop authoritative simulation.
- A separate live progress page links the actual game and records before/after/reference evidence, independent verdicts and open gaps. Gauntlet is a development workflow, not a gameplay mode.
- No external media asset is copied into the game. Original procedural assets are documented with provenance.

## Completion

Independent critics inspect real output and name the largest remaining gap for each round. A benchmark win requires supporting evidence and fresh whole-game review. Missing evidence or a tie is not a pass. Real production R5 evidence remains separate from visual quality and software tests.
