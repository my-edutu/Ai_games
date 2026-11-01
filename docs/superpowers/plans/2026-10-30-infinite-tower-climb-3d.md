# Infinite Tower Climb 3D Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent implementation and review. The user's explicit parallel builder/critic instruction authorizes concurrent work on the disjoint modules below.

**Goal:** Replace the 2D tower presentation with a polished, integrated 3D world, animated characters, functional spectator controls and a separate evidence page.

**Architecture:** Existing authoritative simulation feeds immutable snapshots to a Three.js browser scene. World and characters share a documented cylindrical coordinate map; an independent DOM HUD consumes the same snapshots. Root integrates the host, renderer, sound, tests and evidence.

**Tech Stack:** Existing Node/TypeScript runtime, Three.js 0.186.0, ES modules, browser Web Audio, Playwright.

**Spec:** docs/superpowers/specs/2026-10-30-infinite-tower-climb-3d.md

## Global Constraints

- Authoritative simulation and replay remain the source of truth; visual transforms never write to them.
- Scope is Infinite Tower Climb. Do not change other games or shared production governance.
- Reference and win criteria remain fixed; a working prototype is not an automatic Gauntlet pass.
- Keep data-testid contracts and reducedMotion, highContrast, muted, cleanFeed query options.
- No external runtime CDN; Three.js served from the installed, pinned package.
- No fixed round limit. Each meaningful piece receives separate fresh-context real-output criticism.
- Original modeled characters and scenery; no copied commercial assets.

## Review Focus

1. Moving platforms: visual support must agree with physics at the current tick.
2. Floor/run transitions: no teleporting camera, stale score, reused dead pose or leaked geometry.
3. Slow/offline state and WebGL context loss: truthful status, non-overlapping polling, recovery.
4. Small screens/reduced motion/clean feed: game, danger and necessary information remain readable.
5. Long runs: bound render/audio history, dispose old meshes, demonstrate loss and automatic restart.

## Shared module contract

Browser modules live in public/infinite-tower-climb/visuals/. Import Three.js with `import * as THREE from '/tower/vendor/three.module.js'`.

Root-owned coordinates.mjs exports `SCALE=10000`, `RADIUS=24`, `ARC=2.2`, `angleFor(x,width=480000)`, and `pointFor(x,y,baseY=0,width=480000,radius=25)` returning `{x,y,z,angle}`. This maps x to an arc about the tower Y axis, y to `(y-baseY)/10000`, and z positive toward the default camera. The tower shell's outer radius is 22.8, platforms occupy radii 22.5–28 and characters stand at radius 25. Models have +Y up and +Z forward, with their origin at the soles.

### Task 1: Tower architecture, terrain, hazards and biome atmosphere

**Owner:** environment builder. **Files:** visuals/world.mjs only (optional world-materials.mjs).

**Interfaces:** `createTowerWorld()` returns `{group, update(snapshot,dt,time,options), dispose(), diagnostics()}`. `group` is THREE.Group. update rebuilds bounded per-floor geometry only on run/floor changes, updates effective platform positions every snapshot and animates cosmetics; options includes `{reducedMotion, quality}`. It consumes coordinates.mjs. Exports `THEMES` mapping names to `{name,sky,fog,accent,ambient,sun}` values for root lighting. No renderer/camera/DOM ownership.

- [ ] Build full modeled tower, distant silhouettes, warm layered depth, curved physical ledges and distinct five biome details.
- [ ] Model all hazard families aligned to snapshot extents and active flags. Rich structure without hiding climb surfaces.
- [ ] Dispose retired geometry/materials and report objects/geometries in diagnostics.
- [ ] Inspect real host screenshots and revise from a separate critic's biggest gap.

### Task 2: Character cast and animation

**Owner:** character builder. **Files:** visuals/characters.mjs only.

**Interfaces:** `createClimber()` and `createEnemy(kind)` return `{group, animate(state,dt,time,options), dispose()}`. Mesh roots are positioned/rotated/scaled by root scene. Native climber height 2.8 units, width roughly 1.8; native enemy height 2.8 except guardian 5.6. Animate input contains `{state,vx,vy,facing,health,maxHealth,telegraph,active}`; velocities are authoritative fixed units. options includes `{reducedMotion}`. Geometry origin at sole Y=0, forward +Z. Local root transform is untouched by animate.

- [ ] Produce original detailed articulated blue/ivory robot with face, backpack, hands/feet and recognizable silhouette.
- [ ] Provide distinct sentinel, shooter and guardian construction and posing.
- [ ] Animate idle, running, rising, falling, dash, hurt/dead and telegraph from real state; no unrelated choreographed gameplay.
- [ ] Run in the integrated scene and revise after independent visual/animation review.

### Task 3: Spectator UI and usable controls

**Owner:** HUD builder. **Files:** index.html, styles.css, ux-v2.css, visuals/hud.mjs only.

**Interfaces:** `createHUD({onCamera,onSound,onMotion,onQuality,onFullscreen})` returns `{update(frame,diagnostics),status(message,kind),dispose()}`. Root implements callbacks; controls send presentation requests only. No scene/physics/network ownership. Update uses the existing frame.snapshot, frame.scene, frame.audio. Preserve existing IDs required by old app plus data-testid contracts until integration.

- [ ] Full-bleed canvas with elegant minimal expedition HUD, original title and large clear floor/height.
- [ ] Meaningful camera/sound/motion/fullscreen controls with accessible names, keyboard focus and pressed states.
- [ ] Responsive desktop, landscape and portrait layouts; high contrast, reduced motion and clean feed.
- [ ] Show genuine upgrade offers, actual result height/cause and recovery state; keep debug and Gauntlet UI separate.
- [ ] Inspect screenshots and revise against independent interface criticism.

### Task 4: Integration, runtime correctness, effects, audio and evidence

**Owner:** lead builder. **Files:** visuals/coordinates.mjs, visuals/scene.mjs, visuals/audio.mjs, app.js, scripts/serve-tower-stream.cjs, snapshot.ts, focused tests, gauntlet/ files and documentation.

- [ ] Save baseline captures. Add failing regression asserting moving platforms in render snapshots match platformAtTick.
- [ ] Correct snapshot projection; verify no mutation of state/checksum and tower unit suites.
- [ ] Serve local modules/Three.js securely. Use scene, cast and world contracts with smooth interpolation, safe floor transition and follow/overview camera.
- [ ] Implement bounded impact/reward/projectile effects, opt-in real audio, stale-response protection and WebGL recovery.
- [ ] Publish separate /tower/gauntlet progress route with references and iteration evidence.
- [ ] Browser-test runtime, controls, visibility, floor/restart, interruption, context recovery and disposal. Capture desktop, mobile, biome and close-up evidence.
- [ ] Separate critics review character, environment, HUD and integrated gameplay. Feed specific gaps to builders and repeat; record honest outcome and remaining reference gaps.
- [ ] Run affected tower and catalogue regression checks, commit reviewable changes and create draft PR on this isolated branch.
