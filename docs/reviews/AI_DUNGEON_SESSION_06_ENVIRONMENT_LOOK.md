# AI Dungeon — Session 6 environmental surfaces and lighting (review handoff)

**Scope:** Game 9 / Draft PR #49, independent review branch `feat/dungeon-environment-look-session6-20261108`.
**Forked from exact source:** `f6bbfb3eb5f7b18a5b0e5d786d354724896883cb`, 8 November 2026.
**Status:** **IN PROGRESS — NOT TRANSFORMED**. This is a production-path implementation candidate, not a visual quality verdict.

## Original material asset provenance

`public/ai-dungeon/environment-look-plan.js` is original procedural code written for this workstream. Its albedo, tangent-normal and roughness buffers are computed by a deterministic integer hash and tileable masonry/floor patterns; there are no downloaded/licensed bitmap images or generated unlicensed asset references. Existing verified KayKit CC0 GLBs and textures are unmodified. The existing wall masonry albedo, 256px relief maps, woven fabrics and scene meshes retain their original licensing and ownership.

The stable, immutable role IDs are `masonry`, `floorStone`, `carvedStone`, `dampStone`, `agedMetal`, `brass`, `timber`, `hangingCloth`, `soot`, and `magicInset`. Each carries plausible roughness, metallic response, bounded normal strength, material family and target texture scale. `timber` and `soot` are descriptors for existing/future environmental dressing; this session does **not** create props or redesign Session 5 geometry.

## Production wiring

- `app.js`: existing shared instanced walls, trim and floor opt in by name. On a **floor/run rebuild only**, the hardware path makes two 128×128 original PBR normal/roughness textures for masonry, three original albedo/normal/roughness maps for the floor and shares stone maps with trim. Software WebGL deliberately retains its established inexpensive albedo and roughness scalar path, rather than adding more sampling to an already struggling CPU rasterizer. Five texture allocations max per floor, all previous detail textures explicitly disposed at transition.
- `environment.js`: 256px original wall/floor albedo and relief preserved; all stone/aged-metal/brass/cloth/environmental magic materials receive named physically based surface profiles. Torch emission and actual cutaway-aware point-light intensity are bounded by the floor preset, preserving authoritative Warden warning/recovery modulation.
- `biome-atmosphere.js`: existing damp pools, crystal insets and structural backdrops use physically differentiated surfaces and less additive glow. No new geometry, source light, particle, combat VFX or authority.
- `app.js` lighting: use preset-dependent ambient multiplier, moon intensity, visibility-preserving exponential fog and ACES exposure. Existing encounter portrait key/fill positioning, boss exposure and authoritative danger cues retain ownership elsewhere. No additional light, shadow atlas, post-processing pass, camera change or game-state mutation.
- `scripts/serve-dungeon-stream.cjs` serves the pure material-role/texture plan as a strict, static same-origin module under existing CSP.

## Resource budget and accounting

| Item | Bound | Lifetime |
| --- | ---: | --- |
| New GPU texture maps (hardware) | 5 maps × 128 × 128 RGBA8 = **327,680 B raw** | one floor; disposed on the next |
| New GPU texture memory with full mip chain | **≤ 440,000 B** (estimated RGBA8 payload; actual driver overhead and alignment unmeasured) | same |
| New GPU texture maps (known software rasterizers) | **0** | existing albedo retained |
| New light/shadow sources, passes, geometries | **0** | existing resources reused |
| Extra source data buffer in JS during build | ≤ 2 × 3 × 128 × 128 × 4 B transient | one floor build |
| Renderer resource diagnostics | `environmentLook.detailTextureCount`, `detailTextureRawBytes`, `normalMapsEnabled`, `roughnessMapsEnabled`, `fogDensity`, `additionalLights` | read-only |

Existing 128px masonry albedo and 256px original decorative relief maps are **not** included in the additional texture count. The five-texture budget is a bound, not an assertion of measured VRAM residency.

## Integration requests to Sessions 1 and 5

**Session 5** should attach `mesh.material.userData.environmentMaterialRole` (or construct materials from the immutable descriptors) to any new masonry/stone/aged metal/timber/cloth/soot geometry. Never convert decorative geometry into authority; maintain original map coordinates, occluders and navigation. New architectural modules may consume `getEnvironmentMaterialRole(name)` without importing Three.js or altering lighting.

**Session 1** should profile both GPU enabled and software fallback paths after integration. Report draw calls, p95 frame *delivery* separately from measured GPU timings, shader compilation/allocation counts, map disposal and memory changes across 5 consecutive floors. If normal and roughness maps hurt p95 materially, selectively remove expensive maps before lowering actor, hazard or simulation quality.

**Other owners:** Do not apply these roles to character meshes, weapon trails, boss cues or attack materials without the respective owners' review.

## Matched evidence and quality gates

**Locked before** throughout M1: `281735d0910c6b2443648af976003d50412ee324`, actual [baseline gameplay captures](https://github.com/my-edutu/Ai_games/actions/runs/41302939553/artifacts/13081734898).

**Candidate after:** a dedicated genuine-Chromium test `tests/browser/dungeon-environment-look.spec.cjs` now records a real WebGL canvas and environment material/light/budget diagnostics. The foundation test checks deterministic exact pixel arrays, stable material roles, preset bounds, resource caps and production routing.

**NOT YET VERIFIED:** exact-code CI success; inspected before/after matched scene, floor, camera and movement; hardware material-readability evidence (CI SwiftShader intentionally uses scalar fallback); device GPU shader and frame-time regressions; side-by-side combat and Warden reachability; mobile screenshots; independent blind preference votes. Do **not** interpret a source diff, an isolated screenshot, a software WebGL fallback or green tests as proven visual improvement.

## Review verdict, risks and rollback

This is a substantive surface-contract and lighting integration, but not a complete material-art rebuild or an AAA-quality certificate. Legacy 256px facade albedo/detail remains separate from new 128px core tile atlases; role descriptors define the future shared scale, not proof every UV has been migrated. Floor-only map generation can still introduce a shader recompile; production GPU residency and mobile device limits require real measurement. Keep Draft PR #49 untouched while this side PR is evaluated.

Rollback: do not merge the Session 6 review branch; production/authoritative state remain unchanged. No database, save schema, AI decisions, physics, camera, combat visuals, animation controller or character meshes are modified.
