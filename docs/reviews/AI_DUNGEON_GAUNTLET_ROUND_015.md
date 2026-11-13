# AI Dungeon — Gauntlet Round 015: Evidence-Driven Composition and Room Dressing

**Quality goal:** Path of Exile 2 — **NOT MET**. The source changes in this round are pending fresh runtime captures; do not mark a pass on static code alone.

## Harsh critic of actual gameplay screenshot

A real headless Playwright screenshot **was inspected** from GitHub Actions run `37822810747` at commit `b6d211507`. This run's browser and simulation checks completed successfully. The raw WebGL capture `dungeon-3d-world-only.png` is stored in artifact `11570337657` and the full HUD/screenshots in `11569918115`. These are game-generated images, not AI mockups.

- **Failure: sightline:** Render diagnostics for that actual frame reported **0 unoccluded living heroes of 3**; all 3 character rays were blocked by set decoration/walls. This is incompatible with readable gameplay.
- **Failure: camera:** A high, distant viewpoint made actual 3D rigs visually tiny despite a reasonably detailed mesh count; a large share of the viewport was a near-black empty skyline.
- **Failure: HUD:** At 1440×900 the top masthead game's title overlapped the `LIVE AUTONOMOUS RUN` indicator.
- **Failure: scene art:** Repeating rectangular flat wall crowns dominated the scene and obscured designed arches; floors were largely monochromatic masonry. Glowing cyan points were bright but did not replace varied material storytelling.
- **Measured, not scored:** world-only screenshot mean luminance **42.73/255**, coloured area fraction **0.48525**, **134,765** rendered triangles in that sample. This is a **single observed frame**, not a blind A/B result.

**Reference:** Genuine Path of Exile 2 gameplay screenshots offered on the official PlayStation game's page: https://www.playstation.com/en-us/games/path-of-exile-2/ . Its scenes demonstrate legible player/enemy silhouettes, substantial material and surface variation, meaningful illumination and coherent environment composition. We have not run a blinded matched-scene preference test.

## Builder response in code

1. **Root-cause fix:** the camera cutaway was using authoritative map tile coordinates `u.x,u.z` instead of rendered world-space `u.x-9,u.z-9`. This 9-cell coordinate mismatch explains why apparently implemented cutaway logic failed to protect the real model silhouettes. The boss camera midpoint contained the same mismatch. Both now use world-space values.
2. **Tighter camera:** replaced distant fixed cinematic and chase offsets with closer character-sized shots. Widen shots only when living heroes spread apart; allow extra space on compact screens; retain switchable tactical view.
3. **Clear physical detail:** wall parapet/crown instances now obey the same view clearance as main walls, decorated facades and foreground groups. New live `cutawayParapets` diagnostics and browser regression checks make this testable.
4. **Legibility:** removed desktop masthead collision at 1440px, added warm in-world subject key lighting keyed to actual actor state, and added measured screen-space character-size tests.
5. **Material storytelling:** introduced carefully bounded, original procedural woven carpets with distinct colour and heraldry for four dungeon biomes. They are physically flat decorative set pieces and do not alter AI walkability or simulation authority.
6. **Evidence ledger:** live Gauntlet page now records the observed failing frame and links to the actual GitHub Action artifact. New candidate results are explicitly pending rather than presented as a win.

## Acceptance gate (pending)

Latest GitHub Actions authority + browser jobs must complete after this commit. Inspect new raw scene captures and compare directly to the older verified failure. Demand that **all 3 party heroes have clear camera sightlines** across a meaningful multi-frame segment, character occupancy grows, and the header remains unoverlapped. Run a matched official reference A/B on the latest true captures with independent critics. No fabricated scoring.
