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

## 2026-10-31 user-direction addendum — clearer gameplay with less text

The user directed continued improvements to the UI, scenes and characters while reducing text during gameplay. This refines the visual contract above under the existing delegated implementation authority. The world and autonomous action remain the main view; intent, milestones and secondary status remain available through progressive disclosure. Deterministic authority, immutable public snapshots, fairness and recovery requirements continue to apply.

### HUD and disclosure contract

- Keep floor, peak height, floor progress and compact icon health/stamina values visible near the scene edges. Show shield charges only when present. Use explicit meter names and values so meaning survives the compact visual treatment.
- Provide seven dock controls: Follow camera, Overview camera, Sound, Reduced motion, Low graphics quality, Fullscreen and Expedition details. Each has a 44 × 44 CSS-pixel target, a stable accessible name, visible keyboard focus and a keyboard-visible tooltip. Toggle pressed states describe the enabled setting; tooltips may describe the next action.
- Use a native Details disclosure for intent, next guardian, progress, score, build, graphics/connection status and the control guide. Escape closes it and restores focus to the summary. The open panel may cover the scene intentionally; normal play starts with the compact layout.
- Keep captions available with sound muted. Place genuine upgrade choices and captions in a shared responsive event area, with separate readable rectangles for short and multiline captions at desktop, phone portrait and short landscape sizes. Upgrade/result cards derive from the public source scene and actual offers/result data.
- Keep Guardian/Danger alerts independent of technical recovery notices. Graphics delay or context recovery must preserve the known gameplay phase alongside its concise recovery explanation. Connection loss labels retained phase information **Last known** and suppresses current captions until fresh state returns. Retained pixels or successful polling alone must not imply that rendering is current.
- Failed viewer controls receive one replaceable six-second transient message that survives healthy polling and run changes. Details retain the explanation under **Last control message**. Replacement and disposal clear the owned timer; a late asynchronous result cannot revive feedback after disposal.

### Scene and character clarity contract

Follow framing composes the actual climber, active landing target and bounded nearby threats locally, including an oblique portrait camera. A landing cue uses contrasting top corners on the real target surface and follows its current public coordinates, including moving platforms. Suppress it for missing targets, terminal/dead states, nontraversal intent and a target already reached in standing contact. The cue does not invent an additional route or alter platform geometry or collision truth.

Character poses use the actual view angle to expose the climbing robot's reaching hand with space between the hand, helmet and pack in both ascent directions. Sentinel and guardian equipment separates the gripping glove, visible maul shaft and head. Enemy health-bar fills must draw above their backing and represent the current public health fraction. These are presentation changes; root position, movement, combat decisions and damage remain simulation-owned.

The attack evidence was corrected to use the real tick 118 → 119 attack edge and one manually advanced renderer callback, yielding a capped **100 ms of character time**. The earlier two-callback `sentinel-strike-peak` filename does not prove peak extension: 200 ms is already in recovery. The corrected sample supports the existing strike pose, so no production strike change was required. A held attack flag must not create a permanent or repeated strike.

### Acceptance evidence and remaining limits

The [2026-10-31 scene-clarity review](../../reviews/2026-10-31-tower-scene-clarity.md) records dated captures, independent critic decisions, focused checks and integrated verification. The current HUD browser evidence covers seven focused cases; exact full-suite totals belong in the dated verification record after the final candidate is checked. Earlier suite totals are historical evidence, not a current working-tree result.

The scoped reviews support the demonstrated HUD corrections, separated reaching hand and maul, and improved phone-frame readability. Exact next-landing recognition remains ambiguous in some inspected poses, and an upper walkway still crowds the nearby guardian's crown. Keep these composition findings open while improving the scene. The corrected strike still establishes a pose only; a continuous normal-speed encounter is needed to judge anticipation, hit timing and recovery together.

No still-image preference, focused test result or recovery check establishes an overall commercial benchmark win, a full moving-output pass, smooth continuous rendering or a hardware/mobile performance-budget pass. The bounded software-renderer cost probe informs further investigation only; it does not change production quality policy. Continue the existing builder/critic loop with actual candidate output and retain these evidence limits in the live journal and review.
