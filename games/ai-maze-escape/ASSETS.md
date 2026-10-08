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
