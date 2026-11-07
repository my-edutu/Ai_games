# AI Dungeon Gauntlet — Round 009: Screenshot-Led Camera and Environment Critic

## Captured proof, not a concept render

Actual Chromium 1440×900 desktop and mobile screenshots from **GitHub Action 37783359471**, [artifact 11553527450](https://github.com/my-edutu/Ai_games/actions/runs/37783359471/artifacts/11553527450):

- `artifacts/dungeon-desktop.png` — live rendering at tick ~30.
- `artifacts/dungeon-mobile.png` — live mobile Warden encounter.
- `artifacts/dungeon-mobile-compact.png` — compact layout.
- `artifacts/dungeon-visual-metrics.json` — measured screenshot luminance, not an invented rating.

This is the **first confirmed 3D scene** for this PR, following real repair of missing Three.js module routes. Authority tests were green; **12/13 browser tests passed**. One browser test failed because optional Web Audio could not transition to `running` in headless Chromium. It is not a WebGL failure, but the audio UI must handle unsupported devices correctly.

## Harsh visual critique

The 3D scene is functioning, but objectively below the Path of Exile 2 visual benchmark:

1. **P0 camera occlusion:** enormous opaque blue/dark foreground walls or scenic perimeter columns occupy much of the desktop scene. The heroes and most encounters are frequently not visible. A cinematic view that conceals its subjects fails the Gauntlet.
2. **P0 overexposed spell/light bloom:** several mobile combat screenshots show nearly white glowing geometry and an enormous Warden dome. Dramatic impact becomes visual noise.
3. **P1 overwhelmingly cool grading:** screenshot-wide metrics: **78.56% lit**, **77.01% chromatic**, but **97.89% classified cool** and only **0.81% warm**. The palette is undeniably colourful but not balanced: blue light dominates the dungeon.
4. **P1 stylised low-poly character assets:** actual rigged GLBs load (HUD indicates 7 real 3D models), but their artwork and action animations remain dramatically below premium ARPG standards.
5. **P1 visual depth and grounding:** details are present but vertical shapes can float behind flat walls and lose spatial clarity. Contact shadows and physically scaled set props are needed.
6. **P2 optional audio:** headless Chrome cannot always supply a running AudioContext, and the button should fail gracefully, not stall the visual test.
7. **P1 source regression:** a prior simultaneous art commit accidentally dropped the visual combat-director import; a separate branch restores it and makes its state testable.

## Builder changes in response

- **Occlusion-aware cinematic camera** now sits higher and wider, with directional foreground wall collapsing extending through the entire viewing corridor instead of 2.8 tiles immediately around the party.
- **Architectural facade cutaway** uses the same camera-ray clearance as base masonry; imported 3D props hide when they occlude the tracked hero.
- **Distant scenery** moved from radius 12–20 (directly adjacent to the camera) to radius 32–42 (true background), with lower density and weaker magical light shafts.
- **Warden visuals** replace the screen-dominating wireframe hemisphere with a low-profile floor ring.
- **Colour grading** now has warm directional light and restrained cyan party glow, less blown-out tone mapping and bloom, and gentler CSS saturation. Future frames must prove this remains colourful without overexposure.
- **Hero and enemy contact shadows** ground animated meshes; restored 3D combat director adds real action-triggered projectiles and slashes.
- **Autonomous spectator direction** switches to interesting combatants at a bounded pace but allows manual selection; close-camera hero screenshots are part of next test gate.
- **More real GLB architecture** and wall-side crates, with stable size caps; no collision or gameplay authority changes.
- **Web Audio resilience** detects unavailable audio output instead of waiting indefinitely; browser test now accepts either a working output device or an explicit blocked/unavailable status.

## Verdict and evidence integrity

**NO GAUNTLET PASS.** Current screenshots are genuine and establish that the code renders a 3D dungeon, not that it reaches AAA quality. This new round's corrected scene still needs a fresh desktop, raw 3D-only and phone screenshot and rigorous review. No comparison win against Path of Exile 2 is claimed.

### Immediate hard critic gate

Latest branch must pass `npm run dungeon:test`, `npm run dungeon:gauntlet`, `npm run dungeon:visual` and produce a **new screenshot where the hero and arena are simultaneously visible**, followed by image-based A/B evaluation. Visual grading and performance are not assessed solely from CSS values or code structure.
