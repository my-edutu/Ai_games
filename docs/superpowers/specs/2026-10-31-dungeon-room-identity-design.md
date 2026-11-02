# Game 9: Dungeon Room Identity — Round 18 Design

**Intent:** Make the actual 3D dungeon visibly less repetitive, particularly in 1440×900 live captures and phone-sized viewing, without changing the authoritative autonomous game or cluttering its compact UI.

**Observed failure:** Four nearly identical overbright tall monuments, repeating blue walls, and similar rooms hide the biome's identity. Captures from Round 17 show 3/3 real heroes unobscured and an improved UI, but lack architecturally meaningful visual variation.

**Approaches considered:** (1) Replace the procedural world with an asset-heavy prebuilt environment (unbounded load and collision mismatch); (2) replace only the tall light props with a cosmetic texture (low impact); (3) **chosen** — deterministic, wall-hugging, biome-specific sculpted 3D landmarks and reliefs with bounded GPU resources, paired with toned-down magical light emissions. This works with existing map authority and 3D scene ownership.

**Visible promise:** Viewers can recognise crypt, ember cathedral, obsidian vault and hollow sanctum by distinctive sculpture and material silhouette, not only by tinting neon lights. Characters and danger remain the visual priority.

**Scope:** Seeded visual-only placement with spawn/exit protection and camera cutaway; distinct finite PBR sculptural families for each biome; subtle animated elements for magical biomes; reduced glare, preserved accessibility and mobile framing; a real browser screenshot/evidence plus explicit fail/pass gates. No battle rules, RNG streams, navigation, economy, persistence, model licensing, or livestream-provider changes.

**Acceptance:** Visual planner deterministic, max eight landmarks, placed against a real wall, excludes start/exit buffer, non-overlap, supports empty/degenerate maps; all four biomes visibly distinct; render-world diagnostics report positive counts; browser screenshot real; camera visible hero remains >0; no new scene renderer error; cleanup safe; no AAA claim without comparative evidence.
