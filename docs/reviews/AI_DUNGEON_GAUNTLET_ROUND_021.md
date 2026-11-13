# AI Dungeon — Gauntlet Round 021: Truthful Combat Facing on Authored 3D Characters

**Date:** 2026-10-31 · **PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49), **DRAFT** · **Starting head:** `6b9f90af1b0c888528c21e06ed904b31799abf37`.

## Proof of gap / quality reference

The genuine Round 19/20 matched WebGL capture (seed `visual-room-art-18`, 18 authoritative ticks) shows small simplified character rigs against repetitive dark masonry. Source inspection revealed a specific additional visual error: the real `app.js` 3D actors previously changed yaw **only while moving**. An actor attacking while stationary kept its last movement heading and could swing away from the opponent. This is a meaningful combat-animation/readability defect, although fixing it does **not** produce higher-polygon art.

Primary outside art bar: genuine *Diablo IV* dungeon footage/stills, including the [publisher's Diablo IV Steam screenshots](https://store.steampowered.com/app/2344520/Diablo_IV/) showing actual monster orientation, nonuniform ground and environmental storytelling. Supporting composition: *No Rest for the Wicked*; combat: *Path of Exile 2*. Reference artwork was **not** imported, traced, or used as a shipped asset.

## Independent increments

1. **Focused test written first:** `028b54b` commits six Node contracts before the planner existed: read-only intent, nearest-adjacent target selection, same-tick defeated target, true axis/wall line of sight, healing/boss AOE exclusion, bounded shortest-arc turning, and strict same-origin integration. The connected workbench was unavailable, so an observed Node RED result was **not** recorded.
2. **Read-only intent planner:** `94974a0` introduces `public/ai-dungeon/facing-plan.js`. It infers only a nearest eligible hostile for actual attack/cultist-bolt actions from the current public authoritative snapshot and real grid geometry; obstacles, missing or distant targets, healing, and radial Warden casts yield no invented aim. Same-tick struck/dead enemies may be faced; stale corpses cannot. This does not claim to know an unexposed authoritative `targetId`. `approachCharacterYaw` uses a 8.5-rad/s clamped shortest arc and respects reduced-motion snap.
3. **Real 3D rig integration:** `eac3061` updates `app.js` to plan facing once per incoming snapshot, smoothly turn each visible Three.js actor during the render loop, and expose exact aligned-vs-eligible actor counts. Both authored GLBs and procedural fallbacks use the existing root; no extra meshes or licensed assets.
4. **Strict server routing:** `1c4bcfb` explicitly serves the new module under `/dungeon/facing-plan.js` without relaxing the Content Security Policy.
5. **Real browser acceptance test:** `d4f5d5d` searches at most 900 actual seeded `DungeonRuntime.step()` frames for a documented adjacent party attack, renders that true public snapshot through the real Chromium/Three.js pipeline, checks decoded authored textures, actor turn alignment and WebGL visibility, and writes `artifacts/dungeon-facing-round21-world-only.png`. It makes no hand-authored combat snapshot or mock image.

## Checks and evidence

- **V8 smoke (NOT a Node CI pass):** the real source evaluated with an original vanguard at (2,2) facing an adjacent enemy at (3,2), producing `yaw=-π/2`; no-target cast produced `null`; wrap across ±π yielded a 0.16-radian shortest delta. This is supplemental only.
- **Full authoritative, software, browser, replay and screenshot checks:** GitHub Actions exact-code-head run [41183045019](https://github.com/my-edutu/Ai_games/actions/runs/41183045019) and integrated catalogue [41183044916](https://github.com/my-edutu/Ai_games/actions/runs/41183044916) were started on `d4f5d5d`; **results initially unverified**. Never infer success from queuing.
- Genuine Round 20 baseline screenshots were inspected before the implementation. **New Round 21 actual browser capture and motion must be inspected after the workflow produces its artifact**; no visual improvement or frame-time claim is established by passing pure tests alone.
- Simulation, AI decisions, damage, physics, RNG streams, replay/save schemas, image assets and licensed content are unchanged. Planner runs at public snapshot updates with at most 18 bounded units. Performance p95/FPS/GPU memory evidence remains open.

## Harsh quality and spec review

This only corrects orientation during eligible attacks. The inferred nearest opponent can differ from the authoritative victim in ambiguous multi-target situations because the current public state lacks explicit action target IDs. The planner intentionally declines to invent aiming for healing or Warden area attacks. Misorientation outside measurable scenes remains possible and needs direct clip review. The existing assets remain stylized low-poly meshes, armor/creature anatomy and animation lack near-AAA detail, repetitive cube walls still dominate, and true texture/lighting sophistication is far below the reference.

**Independent critic:** NOT AVAILABLE (coding-agent workbench tunnel offline), so the judgement above is author self-critique. **Ultracode:** NOT AVAILABLE. **Blind matched Diablo IV comparison:** NOT RUN. **Production readiness:** NOT MET. **Gauntlet:** NOT MET. **PR #49 must remain draft and not be merged.**

**Next largest blocker:** original high-detail hero and enemy geometry, individualized combat animations, material richness and nonrectangular architectural composition. A proper target-ID signal in a versioned read-only combat event is also needed before calling attack choreography completely truthful. Roll back the Round 21 presentation commits if the genuine browser frames reveal degraded readability; do not alter gameplay authority as a workaround.
