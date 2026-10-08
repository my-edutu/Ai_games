# AI Dungeon — Gauntlet Round 006: Combat Direction + Durable Autonomy

## Source critic
The earlier working code had costly weaknesses beyond the still-large AAA art gap: Warden fights were likely over in a few hits; shots didn't have physically staged trajectories; viewers couldn't choose a hero to follow; and the authoritative simulation lived only in RAM. Cached asset geometry could be disposed when its character was removed, and an unused loading map grew indefinitely. Most importantly, there is still no current screenshot-based visual verdict. Source inspection is not proof of rendered quality.

## Actual source implementation
- **3D combat choreographer:** separate rendering module, triggered only from authoritative `action`/`actionTick` changes. Real nearest-enemy projectile shots, spell orbs, melee crescents and hit rings animate in world space; hard budgets cap GPU effects. It never mutates combat outcomes.
- **Warden fight structure:** increased boss survivability, guarded Sentinel phase, Rupture and Eclipse below health thresholds, telegraphed timing changes and genuine enemy reinforcements spawned in free walkable cells with normal autonomous turns. Phase appears in client and Gauntlet telemetry.
- **Follow any hero:** clicking or keyboard-selecting a living squad card redirects only the spectator camera, retaining true 3D movement and the autonomous simulation. High-contrast selected cards, cinematic, chase and tactical angles.
- **Artist asset correctness:** normalizes genuine imported skinned GLB character dimensions / feet placement, uses one-shot attack/hit animation clips, normalizes authored environment prop size and preserves cached shared geometry during actor/world disposal. Removed an unbounded per-character promise map.
- **Unattended durability:** atomic signed snapshot writes every 15 ticks, restore on process restart, fail closed for corrupt/incompatible checkpoints, final flush on graceful signal, stored outside git, health telemetry. Adds real Node replay/durability test.
- **Evidence gates:** browser tests cover selected hero camera, realtime boss status, WebGL-only PNG capture, scene luminance, matching VFX diagnostics; artifacts can be attached in a harsh independent critique.
- **Verified supply-chain metadata:** all **20/20** asset manifest SHA/size tuples match the pinned upstream source repository tree. **Binary download, successful rendering and animation have not yet been verified** on the current GitHub runner.

## Gauntlet verdict
**NOT ACHIEVED / VISUAL NOT ASSESSED**. The workflow for recent revisions has been queued or cancelled on supersession and has not produced a trusted screenshot or compiled/runtime pass here. No blind A/B comparison with real Path of Exile 2 footage has run. The game remains a stylised, not AAA-level, vertical slice.

## Next acceptance work
1. Obtain a latest-commit green TypeScript/node + browser workflow.
2. Inspect the actual raw WebGL canvas at desktop/mobile, real rigged character clips, boss phase telegraphs and game running over extended time.
3. Diagnose the largest observed gap: currently expected to be authored environmental set quality, character materials/animations and scene readability.
4. Fix, repeat and log independent critic results. Do not merge or mark the Gauntlet as complete without those gates.
