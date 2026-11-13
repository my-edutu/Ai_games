# AI Dungeon — Authored 3D Art Sources and Integrity

## Why

Procedural cones and cylinders cannot satisfy the user's Path of Exile 2 visual-quality target. We are replacing fallback silhouettes with **real skeletal GLB characters with animation clips** and adding authored dungeon architectural pieces. This is a material improvement in authenticity, **not AAA parity**: KayKit itself is stylised low-poly and does not approach Path of Exile 2 in rendering fidelity.

## Exact external material

- **Content:** KayKit Adventurers characters, KayKit Skeletons characters, KayKit Dungeon Remastered architectural assets, with CC0 accessory textures.
- **Original author:** Kay Lousberg (KayKit, https://kaylousberg.itch.io/).
- **Adapted models:** `sion-rgb/tactical-slash` (processed, normalized GLBs with retained texture names and animation sets).
- **Source revision:** `8bf8d835cb7afa7cb3f4d893b0966c6b4e9b7727`.
- **License:** **CC0 1.0**; original-source and derivative provenance: https://github.com/sion-rgb/tactical-slash/blob/main/THIRD_PARTY_ASSETS.md.
- **Machine-verifiable files:** `games/ai-dungeon/assets/manifest.json`, each file has its expected **Git blob SHA-1** and exact size. Download is rejected on mismatch.
- **Distribution:** binaries are not bundled in the GitHub branch. `npm run dungeon:assets` fetches and verifies 20 pinned binaries under ignored `public/ai-dungeon/models/`; strict mode (`npm run dungeon:assets:strict`) fails if incomplete. No third-party CDN is required **when playing**; the browser loads assets only from the local application host.
- **Offline:** the existing custom procedural 3D models stay available when binary art is not present. The game and HUD explicitly report authored-rig count versus fallback. Asset download is never a hidden gameplay dependency.

## Source-to-game character map

| Autonomous role | Pinned GLB |
|---|---|
| Ashen Vanguard | `player/player_swordsman.glb` |
| Wildshadow Ranger | `player/player_archer.glb` |
| Starweaver Mystic | `player/player_priest.glb` |
| Revenant | `enemy/enemy_swordsman.glb` |
| Cultist | `enemy/enemy_priest.glb` |
| Eternal Warden | `enemy/enemy_swordsman.glb` (larger, original tinting and boss effects) |

The authored models are loaded via Three.js's matching **GLTFLoader** and cloned with **SkeletonUtils** for proper skinning. Animation mixers map autonomous `idle`, `move`, `attack`, `cast` and `hurt` signals to available authored action clips, with the procedural rig as a visible fallback. The source's animations vary by character; specific clips may fall back to idle until visually reviewed.

## Operational commands

```bash
npm ci
npm run dungeon:assets:strict   # acquire authentic model files and verify hashes
npm run dungeon:stream          # local gameplay with authored models; offline fallback if absent
npm run dungeon:visual          # take actual browser screenshots
```

**Security notes:** no arbitrary user-controlled asset path, fixed /dungeon/assets/ routes, bounded content size, pinned origin+commit, content hash checks before saving, plain JSON asset manifest, no marketplace/payment hooks. Imported meshes are cosmetic, not simulation authority. Consider a first-party artifact mirror and git LFS for reliable deployment before production.

## Remaining gap

The models are **real GLB skeletal animations** but still stylised low-poly, not AAA-quality final assets. The next independent critic must inspect real screenshots and clips, including animation transitions, exposure, silhouette and texture load failures. No screenshot A/B judging has been performed in this turn.
