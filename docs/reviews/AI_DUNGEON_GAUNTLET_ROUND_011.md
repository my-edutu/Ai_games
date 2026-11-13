# AI Dungeon Gauntlet — Round 011: Telegraph Counterplay and Measured Occlusion

**Gauntlet visual bar:** authentic Path of Exile 2 gameplay, **NOT ACHIEVED**.

## Harsh-critic observations
The previous real desktop/mobile captures (Action 37783359471) proved a 3D dungeon with live characters, but the heroes were often hidden behind architectural scenery. Simple scene-wide colour statistics and HUD card counts were poor substitutes for **visible characters on the rendered stage**. The Warden's explosive spell had a warning but the autonomous AI could not intentionally respond, making spectacle mechanically shallow.

## Source improvements
- **Actual 3D ray tests**: the camera runs bounded, 1.25-second-spaced ray intersections from the eye to the real world-space position of each autonomous hero's head and torso. It checks only 3D maze masonry and opaque props, not UI labels. Public render diagnostics record tested actors and unoccluded/occluded counts.
- **Scene art culling**: free-standing columns, arches, braziers, shrines, banners, and guardian statues are conditionally cleared in the eye-to-character corridor. Scene cutaway geometry runs after camera positioning, not before.
- **Warm-vs-cold palette**: in-world torches use real warm directional glow against the cold magic, addressing a prior actual screenshot that was overwhelmingly blue.
- **Boss counterplay**: autonomous heroes respond during the tick after a Warden telegraph by leaving the AoE if a legal safe tile exists, otherwise invoking a timed guard that absorbs most damage on the next wave. A guard is a real game-state decision and never an invented render.
- **Combat art**: the 3D effects director renders a magical defensive circle, the procedural character rig adopts a blocking stance, and the loaded GLB clips look for shield/block/defend actions with idle as an honest fallback.
- **Tests**: unit fixture asserts the Warden's warning has a tangible reaction and mitigates damage. Chromium browser captures will require real projected heroes and at least one camera-ray unoccluded hero, plus full UI/portrait responsiveness.

## Acceptance still outstanding
- Latest TypeScript compile and seeded deterministic tests: **PENDING CI**.
- New raw WebGL and phone screenshots after composition fixes: **PENDING CI**.
- Real GLB character screenshot and animation inspection: **NOT YET REASSESED** after this change.
- Proof of a blind preference over genuine Path of Exile 2 captures: **NOT ATTEMPTED**.
- AAA-quality authored animations, textures, scene choreography and continuous production stability: **NOT ACHIEVED**.

**Do not infer a visual quality win from a green headless test or renderer metrics alone.** A green CI + a real screenshot/clip critique is the next required Gauntlet gate.
