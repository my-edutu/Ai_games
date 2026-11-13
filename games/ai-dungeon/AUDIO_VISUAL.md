# Audio, Visual and Accessibility Standard

The first slice uses real Three.js 3D geometry, movable meshes, articulated extremities, physically shaded materials, volumetric-style scene fog, emissive runes, dungeon masonry and an angled follow camera. All cosmetic interpolation is isolated from the authoritative simulation; quality caps pixel ratio at 1.6 and keeps the number of point lights small.

Primary visual benchmark: matched actual Diablo IV dungeon gameplay, with No Rest for the Wicked for environment composition and Path of Exile 2 for combat. These are comparison references, not assets or claims of matching quality. The game deliberately uses its own assets rather than copying copyrighted models.

**Present gaps:** sound and musical stems, high-fidelity textures, terrain mesh complexity, real skeletal animation and authored hero faces/equipment, material variety, shader VFX, occlusion-aware camera, sound-reactive cues and measured low-end performance. Text captions and health numbers already communicate basic semantics. Reduced-motion disables shadows and idle bobbing; additional reduced-flash and color-vision reviews are necessary before production.

## Round 18 — original sculpted room identity

Deterministically planned 3D wall niches introduce four silhouettes: the Sunken Crypt ossuary/reliquary, Ember Cathedral low forge brazier, Obsidian Vault rotating orrery, and Hollow Sanctum illuminated codex lectern. Shared geometry and PBR materials use capped per-floor instantiation and cleanup. A camera-cutaway hook protects living heroes. Tall repeated glowing monuments were removed; ambient accent emission and shafts were reduced. These are cosmetic improvements, not new collision or simulation rules. See `docs/reviews/AI_DUNGEON_GAUNTLET_ROUND_018.md` for measured evidence and unresolved fidelity gaps.
