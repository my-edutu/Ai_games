# AI Dungeon — Session 6 environmental surfaces and lighting (review handoff)

**Scope:** Game 9 / Draft PR #49, independent review branch `feat/dungeon-environment-look-session6-20261108`.
**Forked from exact source:** `f6bbfb3eb5f7b18a5b0e5d786d354724896883cb`, 8 November 2026.
**Status:** **IN PROGRESS — NOT TRANSFORMED**. This is a production-path implementation candidate, not a visual quality verdict.

## Original material asset provenance

`public/ai-dungeon/environment-look-plan.js` is original procedural code written for this workstream. Its albedo, tangent-normal and roughness buffers are computed from deterministic hash, smooth periodic mineral noise, woven cloth, oxidised-metal patches, wood grain and architectural masonry courses; there are no downloaded/licensed bitmap images or generated unlicensed asset references. Existing verified KayKit CC0 GLBs and textures are unmodified. The existing wall masonry albedo, 256px relief maps, woven fabrics and scene meshes retain their original licensing and ownership.

The stable, immutable role IDs are `masonry`, `floorStone`, `carvedStone`, `dampStone`, `agedMetal`, `brass`, `timber`, `hangingCloth`, `soot`, and `magicInset`. Each carries plausible roughness, metallic response, bounded normal strength, material family and target texture scale. `timber` is actively used by the existing scriptorium desk and `soot` by its original dark insets; this session does **not** create props or redesign Session 5 geometry.

## Production wiring

- `app.js`: existing shared instanced walls, trim and floor opt in by name. On a **floor/run rebuild only**, the hardware path makes two 128×128 original PBR normal/roughness textures for masonry, three original albedo/normal/roughness maps for the floor and shares stone maps with trim. Software WebGL deliberately retains its established inexpensive albedo and roughness scalar path, rather than adding more sampling to an already struggling CPU rasterizer. Five **core-stone** texture allocations max per floor, all previous detail textures explicitly disposed at transition. The separate wall-setpiece material atlas is detailed below.
- `environment.js`: 256px original wall/floor albedo and relief preserved; all stone/aged-metal/brass/cloth/environmental magic materials receive named physically based surface profiles. Torch emission and actual cutaway-aware point-light intensity are bounded by the floor preset, preserving authoritative Warden warning/recovery modulation.
- `biome-atmosphere.js`: existing damp pools, crystal insets and structural backdrops use physically differentiated surfaces and less additive glow. No new geometry, source light, particle, combat VFX or authority.
- `app.js` lighting: use preset-dependent hemisphere sky/ground bounce colours, directional-key orientation, ambient multiplier, moon intensity, visibility-preserving exponential fog and ACES exposure. Existing encounter portrait key/fill positioning, boss exposure and authoritative danger cues retain ownership elsewhere. No additional light, shadow atlas, post-processing pass, camera change or game-state mutation.
- `environment-look-plan.js` also computes read-only, seed-stable **traffic-polished stone, perimeter dampness and soot tones** from the real walkability map. `app.js` paints only existing floor instance colours; `environment.js` reuses those exact tile colours on existing floor cladding and cutaway backing. No new tile, walkability, combat marker or material instance is created.
- `dungeon-setpieces.js` now shares original albedo, normal and roughness data on actually used wood, metal and woven-cloth details. Other biomes need only two aged-metal maps; scriptorium uses at most seven total. No detail maps are allocated on known software rasterizers or if the chosen floor has no wall setpieces. Faults dispose partial textures and restore scalar PBR.
- `chapter-nave.js`, `warden-court.js`, `vaulted-wall-gallery.js` and `expedition-stonework.js` attach physical stone, brass, aged-metal and floor-stone descriptors to **existing** surfaces; all geometry, cutaway and boss cue behaviour remain unchanged.
- `scripts/serve-dungeon-stream.cjs` serves the pure material-role/texture plan as a strict, static same-origin module under existing CSP.

## Resource budget and accounting

| Item | Bound | Lifetime |
| --- | ---: | --- |
| Additional **core** wall/floor maps (hardware) | 5 × 128² RGBA8 = **327,680 B raw** | regenerated and disposed per floor |
| Additional setpiece maps (hardware) | **0, 2, or 7** × 128² RGBA8 = **0–458,752 B raw** | original landmark maps, shared and floor-owned |
| Combined extra GPU texture data (hardware) | **≤ 786,432 B raw** (≤ ~1.05 MiB with full mip chain) | one floor; excluding existing base assets |
| Additional maps on known software WebGL | **0** | retain scalar-material path |
| New lights / shadow atlases / render passes / geometry | **0** | existing physical-light and mesh resources |
| Additional floor instance tint data | **12 B per walkable tile**, ~3.4 KiB at 285 open tiles | one existing InstancedMesh attribute |
| Source atlas working memory | ≤ 11 × 128² × 4 B for concurrently returned channels, plus transient height arrays | floor build only |
| Read-only runtime diagnostics | `environmentLook.spatialWear`, `ambientDetailTextures`, `detailTextureCount`, `roomArt.materialDetailRawBytes`, `fogDensity`, `hemisphereSky`, `keyDirection` | diagnostics only |

Existing wall albedo, decorative relief, old banners/rugs and imported authored assets are **not** included in added-texture accounting. The bounds are estimated RGBA8 payloads, **not measured driver residency**.

## Integration requests to Sessions 1 and 5

**Session 5** should attach `mesh.material.userData.environmentMaterialRole` (or construct materials from the immutable descriptors) to any new masonry/stone/aged metal/timber/cloth/soot geometry. Never convert decorative geometry into authority; maintain original map coordinates, occluders and navigation. New architectural modules may consume `getEnvironmentMaterialRole(name)` without importing Three.js or altering lighting.

**Session 1** should profile both GPU enabled and software fallback paths after integration. Report draw calls, p95 frame *delivery* separately from measured GPU timings, shader compilation/allocation counts, map disposal and memory changes across 5 consecutive floors. If normal and roughness maps hurt p95 materially, selectively remove expensive maps before lowering actor, hazard or simulation quality.

**Other owners:** Do not apply these roles to character meshes, weapon trails, boss cues or attack materials without the respective owners' review.

## Matched evidence and quality gates

**Locked before** throughout M1: `281735d0910c6b2443648af976003d50412ee324`, actual [baseline gameplay captures](https://github.com/my-edutu/Ai_games/actions/runs/41302939553/artifacts/13081734898).

**Candidate after:** a dedicated genuine-Chromium test `tests/browser/dungeon-environment-look.spec.cjs` now records a real WebGL canvas and environment material/light/budget diagnostics. The foundation tests check deterministic pixel arrays, source-grounded floor wear and light direction, stable role bounds, source routing, and genuine Three.js per-biome texture reuse/explicit disposal. The dedicated browser gate includes a real-authority 390px mobile capture.

**NOT YET VERIFIED:** exact-code CI success; inspected before/after matched scene, floor, camera and movement; hardware material-readability evidence (CI SwiftShader intentionally uses scalar fallback); device GPU shader and frame-time regressions; side-by-side combat and Warden reachability; mobile screenshots (tests authored but no result yet); independent blind preference votes. Do **not** interpret a source diff, an isolated screenshot, a software WebGL fallback or green tests as proven visual improvement.

## Review verdict, risks and rollback

This is a broader environmental surface reconstruction covering real physical-floor wear, multiple biome bounce directions, authored aging response for actual wood/iron/cloth, and shared structural roles; it is **still not** a verified visual-transformation win or an AAA-quality certificate. Legacy 256px facade albedo/detail remains separate from new 128px core tile atlases; role descriptors define the future shared scale, not proof every UV has been migrated. Floor-only map generation can still introduce a shader recompile; production GPU residency and mobile device limits require real measurement. Keep Draft PR #49 untouched while this side PR is evaluated.

Rollback: do not merge the Session 6 review branch; production/authoritative state remain unchanged. No database, save schema, AI decisions, physics, camera, combat visuals, animation controller or character meshes are modified.
