# AI Maze Escape — Third-party art manifest

## Optional rigged Wayfinder base model

- Runtime path: `public/ai-maze-escape/models/wayfinder-rig.glb`
- Original creator: **Quaternius**, Universal Base Characters (Standard), **CC0 1.0 Universal**.
- Original source: https://quaternius.com/packs/universalbasecharacters.html
- Public prepared-model source: https://github.com/programasweights/avatar/blob/main/public/assets/character.glb
- Original prepared-model audit: https://github.com/programasweights/avatar/blob/main/ASSETS.md
- Preserved license: `public/ai-maze-escape/models/QUATERNIUS-LICENSE.txt`
- Git blob SHA: `b3fd79533fdb9fcedd077744f7e120920eb6cc97`
- Size: 741,320 bytes.
- Details: Derived from Quaternius's `Superhero_Male_FullBody.gltf` (Standard pack). The prepared model retains mesh geometry and humanoid skeleton, with matte jade materials and no animations. It is a CC0 asset even though the code remains under its existing repository license.
- Runtime loading: Local-first Three.js GLTFLoader; no CDN request. If loading fails, the existing authored procedural Wayfinder remains the fully functional fallback. No hidden maze state is involved.

**Quality note:** This is a genuine rigged model, but not a finished game hero or a substitute for professionally authored animation, armor, facial expression, and reference-quality art direction. The game remains below the Gauntlet bar.

## Animated Hollow Sentinel ghost

- Runtime path: `public/ai-maze-escape/models/hollow-sentinel-ghost.glb`.
- Original creator: **Quaternius**, **Ultimate Monsters** pack (CC0 1.0).
- Original pack: https://quaternius.com/packs/ultimatemonsters.html
- Prepared model source: https://github.com/ilrein/warptracker/blob/main/public/models/ghost.glb
- Model provenance manifest: https://github.com/ilrein/warptracker/blob/main/ASSETS.md
- License: CC0; Quaternius license dedication also included at `public/ai-maze-escape/models/QUATERNIUS-LICENSE.txt`.
- Git blob SHA: `64a689730f9520be17e2628fa861ed9b1930054c`.
- 288,500 bytes, 1 skinned mesh, 1 skeleton, 8 named animation clips: Flying_Idle, Fast_Flying, Punch, Headbutt, HitReact, Death, No and Yes.
- Runtime: `spectral-assets.js` uses a local GLTFLoader with SkeletonUtils clone and crossfaded fly/idle animation. The procedurally sculpted Hollow Sentinel remains a fallback.
- It is driven only by the publicly visible threat list. No invisible opponent, path or hidden map information is read from the underlying maze.

This model is appropriately licensed but does not make our game visually comparable to an AAA reference without further environment, animation and cinematic work.

## Quaternius Medieval Village MegaKit — real environment meshes

Imported four geometrically authored architectural meshes for known maze passages and an explicitly non-interactive scenic horizon:

| Local GLB | Source mesh | Size | Git blob SHA |
| --- | --- | ---: | --- |
| `models/Wall_Arch.glb` | `glTF/Wall_Arch.gltf` + `.bin` | 10,644 B | `792f472c3dcbc3b8e3392a7992ebbac1abfb89f4` |
| `models/DoorFrame_Round_Brick.glb` | `glTF/DoorFrame_Round_Brick.gltf` + `.bin` | 65,220 B | `214f508127b2431baf7529c1f2ce6356d20e09c3` |
| `models/Roof_Tower_RoundTiles.glb` | `glTF/Roof_Tower_RoundTiles.gltf` + `.bin` | 207,772 B | `e2c6f44b20ad26f9252f1475a69096af07735160` |
| `models/Prop_Vine4.glb` | `glTF/Prop_Vine4.gltf` + `.bin` | 3,320 B | `c79338c80cf2e6134e2a60be5f4ac623f84d902f` |

- **Creator:** Quaternius.
- **Original distribution:** https://quaternius.itch.io/medieval-village-megakit
- **Source repository:** https://github.com/J-Ponzo/gltf-medieval-village-megakit (free Standard subset).
- **License:** Creative Commons CC0 1.0 Universal (preserved in `public/ai-maze-escape/models/MEDIEVAL-VILLAGE-CC0-LICENSE.txt`).
- **Local conversion:** The original glTF mesh geometry and buffer attributes have been bundled into glTF 2.0 binary; upstream texture dependencies were removed, and original in-game PBR palettes assigned in place so every GLB is entirely self-contained, compact, and fetches nothing remotely.
- **Runtime:** `architectural-assets.js` loads optional models once and clones only into already-observed scene sections, capped at 16 decorated actors per rebuild. It does not create game collision or navigation authority.
- **Fallback:** Procedural architecture continues rendering if any imported model is unavailable; assets never gate AI operation.

These are original models from a third-party CC0 kit, **not** a professional custom environment built for this game. Reference-winning art direction and animation still require substantial work.
