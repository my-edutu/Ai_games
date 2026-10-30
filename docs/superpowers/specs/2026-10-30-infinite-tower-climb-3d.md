# Infinite Tower Climb — 3D Gauntlet

## Authorized goal

The user approved implementing the Gauntlet prompt in this workspace: develop Game 3 into a complete 3D experience with original finished characters, animated environments, camera, effects, sound and UI, preserving autonomous endless runs. The user explicitly delegates implementation choices and requests independent builders and critics, real-output comparison, a separate live progress page and continued iteration. This supersedes the previous specification's 2D presentation choice; its deterministic authority and fairness contracts remain binding.

## Viewer promise and direction

Watch a small, resourceful expedition robot climb an immense ancient industrial tower, survive its machinery and guardians, and discover a different world on every floor. The climber is cobalt blue with ivory ceramic armor, an expressive dark visor, articulated limbs and a copper expedition pack. Neutral architecture is pale weathered stone and dark steel, accented by ember orange, mint navigation lights and biome-specific materials. Readability, a palpable sense of height, character personality and real autonomous decisions are the four pillars.

Primary reference: ASTRO BOT Rising Heat official gameplay, https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4 . Supporting references: https://dont-nod.com/en/games/jusant/ and https://store.epicgames.com/en-US/p/fall-guys . References are quality targets, not licensed source assets.

## Architecture decision

Use the existing pinned Three.js dependency for an actual WebGL scene. Existing fixed-step physics, rules, AI, deterministic replay, generation and restarts retain authority. A curved mapping wraps the existing horizontal traversal coordinate around a genuinely modeled tower; it creates 3D geometry and spatial camera movement without introducing unverified alternative rules. Public snapshots remain the only gameplay input. Presentation interpolation cannot change outcomes. The supported movement remains the game's existing platformer movement, not free-roaming physics.

Serve modules and Three.js locally under the existing tower host; no external runtime CDN. Add a dedicated progress route separate from the game. Preserve all existing accessibility query options and data test selectors.

## Visual contract

- Character, enemies and guardians have distinct modeled anatomy, materials, active poses and damage/attack cues. No primitive proxies presented as finished characters.
- Foundry, Ruins, Storm, Clockwork and Void differ in geometry, palette, atmosphere and moving detail. Platforms and hazards must align to the exact current authoritative positions and extents.
- Character feet are at the authoritative lower collider edge. Animated pose offsets never move the game position.
- The camera reveals the climber, next landing and relevant hazard; follow and overview controls affect presentation only.
- The HUD communicates floor, height, danger, health, stamina, milestone and intent. Full world view dominates; diagnostic counts and Gauntlet status live separately.
- Real sound starts only after a user gesture, is independently mutable, bounded and supported by captions. Reduced motion removes shake and fast ambient motion; high contrast and clean feed remain functional.
- Missing WebGL, lost context and unavailable state show truthful recovery and leave server simulation running. Polling never overlaps and has an abort timeout.

## Benchmarks and gates

Independent critics inspect the running build and full autonomous runs, not just code. Compare matched screenshots and clips to the reference for model finish, motion, world depth, material/lighting separation, hazard readability and coherent integrated presentation. Randomize A/B labels when useful, without claiming reviewer blindness to recognizable games. Ties, missing evidence or self-awarded scores do not pass. Maintain dated progress entries and before/after evidence. No claim of winning the commercial benchmark without an independent evidence-backed win.

Functional gates: original tower suites stay green; moving-platform projection matches collision truth; local modules load without page errors; desktop/phone layouts fit; controls and accessibility work; loss/restart and renderer recovery work; resources remain bounded across floor changes. Observe frame-time distribution and resource counts in the available browser and report hardware limitations honestly.

## Resource limits

One renderer, one animation loop and one state request in flight. Pixel ratio capped at 1.5 (1 on mobile/low tier); maximum 96 ambient particles; at most one shadow-casting directional light with a 1024 map on normal tier. Meshes and per-floor geometries are disposed on floor changes. Event/audio IDs retain bounded recent history and reset on run change. No high-frequency flashing.
