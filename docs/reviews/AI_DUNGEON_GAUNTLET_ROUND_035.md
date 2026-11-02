# AI Dungeon — Gauntlet Round 035: Party-space architectural reveal

**Draft PR #49; starting parent:** `92fe68abc221cd563ca7c03d25c7e2ef3e464552`. **Status when authored:** implementation and local focused/authority tests complete; exact-commit new Chromium capture and integrated CI not yet verified. **The Diablo IV fidelity bar is NOT MET.**

## Proven visual gap and baseline

Reviewed genuine real WebGL Round 34 desktop screenshot `dungeon-drapery34-real-webgl.png` from [run 41213105660](https://github.com/my-edutu/Ai_games/actions/runs/41213105660), artifact 13047720563, seeded `visual-room-art-18`, authoritative tick 18. Square black-blue masonry roofs visually crowd the three-party encounter and conceal much of the textured floor, despite previous 3/3 unoccluded actor raycast evidence. No mockups or claimed Diablo IV parity.

## Independent, verifiable increments

1. New pure `party-visibility-plan.js` returns `sightline`, `nearby` or `none`, limited to five finite subjects and a 2.6 m hero-space radius. Sightline obstructions continue clearing to the existing low foundation, blocks beside the party lower to 0.88 m, and distant room boundaries remain intact.
2. Structural wall instances, decorative wall facades, parapets, wall weathering and foreground details use the shared render-only clearance policy. This changes no gameplay grid, pathfinding, combat, replay hashes, inventory or persistence. No extra asset license, textures, point lights or collision meshes.
3. A fixed genuine `DungeonRuntime` public snapshot seed/tick feeds a new Chromium WebGL test that checks textured actors, real hero occlusion, finite bounded wall clearances and draw calls, no page errors, and captures an actual `#world` canvas screenshot. The read-only diagnostic `cutawayNearbyWalls` supports review.

## Test-first receipt (local checkout based on exact parent source)

Three new foundation tests were written and observed **RED (3 failed, missing planner/integration)** before the feature existed, then green after implementation. Local `npm run dungeon:test`: **76/76 PASS**. Interface/presentation/progress Node tests: **17/17 PASS**. `npm run dungeon:gauntlet`: **24 seeds × 900 ticks**, zero deterministic discrepancies, highest floor 9, 401 floor advances and 89 restarts. `npm test` did not complete within the local 120 s execution limit; **no full-catalogue pass claimed**.

The new actual browser screenshot, mobile responsiveness/performance, new exact-commit CI, multi-seed image review and independent blind matched reference preference have **not** passed review at document creation. This is a testable rendering hypothesis, not confirmed artistic preference.

## Harsh reviewer verdict

The new reveal could expose more scene and actors, but may make wall silhouettes seem unnaturally cropped or remove atmosphere. Genuine post-commit matched screenshot and browser video must be judged before accepting it. The largest remaining fidelity blocker remains low-detail original hero/enemy models and animations, weak stone material detail, oversized combat glows and lack of cinematic lighting, independent art criticism, mobile frame p95 and soak. No subagent critic or ultracode was available; author-only review is not independent. **Keep PR draft; do not merge.**
