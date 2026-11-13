# AI Dungeon Gauntlet — Round 010: Actual Screenshot Occlusion Findings and Rendering Fix

**Benchmarked against:** the actual source gameplay standards demonstrated by Path of Exile 2 (visual/art bar; not yet blind-comparison scored).

## Evidence inspection (real, not synthetic)
The earlier Chromium Action `37783359471` produced `dungeon-desktop.png` (1440×900) and `dungeon-mobile.png` (390px). Their content was inspected directly in this Gauntlet round. Both captured scenes showed a clearly working game HUD and real 3D masonry, but the stage suffered from severe foreground occlusion. In the desktop shot, a giant dark-blue, angled foreground object filled much of the 3D arena. The mobile scene showed a brightly lit boss area while the heroes were difficult to locate, and the color distribution was overwhelmingly cold-blue. This is not a cinematic-quality composition.

## Specific changes to the actual running scene

1. **Correct full-depth foreground clearing.** The former wall-only cutoff did not hide free-standing columns, ornate arches, hanging banners, decorative shrine groups and guardian statues between the viewer and the heroes. Added a tracked cosmetic foreground layer to the base scene and environment module; the camera-to-subject ray corridor now hides interfering scenery while preserving all the real authoritative maze walls, navigation and hazards.
2. **Correct camera-order culling.** Previously decorative scene cutaways were performed *before* the current frame's camera update, using stale camera angles during transitions. All culling is now performed after the camera is positioned but before Three.js rendering.
3. **Warm/cool scene balance.** Real screenshots found negligible warm light compared with saturated blue. Replaced all-cyan dungeon braziers with emissive warm flames (amber/orange/cream/rose) and matching real warm dynamic point lights; the glowing fantasy accent colour remains elsewhere.
4. **Frame-level composition metrics.** Added a browser-computed camera diagnostic that projects real autonomous hero geometry in 3D and reports visible hero count, pixel height, and whether the followed character is on-screen. This does not count HUD cards or synthetic labels as 3D visibility.
5. **Gauntlet browser screenshot gates.** Added screenshot and runtime checks at 1440×900 and 390×844 with a minimum real projected 3D hero visibility and legibility requirement.

## Explicit unresolved quality gates
- Current-commit Chromium capture and runtime pass: **PENDING**.
- Actual ray-cast object occlusion vs screen-projected hero visibility: projected position alone does not guarantee no overlapping geometry; a direct image critic and optional depth test are still needed.
- Real Path of Exile 2 level-model/texture/animation fidelity: **NOT ACHIEVED**.
- Independent blind A/B evaluation: **NOT RUN**.
- Performance at multiple floors and on low-end mobile: **NOT VERIFIED**.
- UI aesthetics/colour hierarchy: actual screenshot comparisons continue; CSS inspection does not count.

**No false success claim**: these code changes are intended to correct actual measured defects. Re-run the screenshots, test object visibility, continue to the next largest failing visual gap. PR remains in draft.
