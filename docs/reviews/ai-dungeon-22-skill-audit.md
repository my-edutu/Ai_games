# AI Dungeon — Endless Adventure: 22-Skill Scrutiny Audit

This audit reviews the current rebuild through 22 distinct specialist lenses. It is a working implementation backlog, not a launch-readiness claim.

## 1. game-creative-direction — HIGH
**Finding:** The seven-biome rotation is stronger than the old board view, but the game still lacks a singular visual signature beyond dark fantasy/isometric presentation.
**Improve:** Establish Astra's lantern/light language, recurring abyss motifs, biome-specific silhouettes, and one unmistakable visual motif per chapter.
**Build action:** Add chapter art direction tokens and landmark rules to world projection; prohibit generic prop-only differentiation.

## 2. gameplay-progression — HIGH
**Finding:** Floors, chapters, XP and relics work, but long-run progression is still mostly linear stat growth.
**Improve:** Build families, chapter modifiers, milestone unlock patterns, risk/reward route identity, meaningful floor-to-floor build evolution.
**Build action:** Expanded relic catalogue to 16 items across five families; next add family-aware reward selection and chapter modifiers.

## 3. difficulty-failure-balancing — HIGH
**Finding:** Enemy scaling is deterministic but coarse. Difficulty mostly rises through HP/count growth.
**Improve:** Increase tactical composition, phase pressure, encounter pacing, recovery windows and fair lethal telegraphs.
**Build action:** Chapter boss now gains phase-three ranged pressure; next add encounter-budget composition tests.

## 4. procedural-generation — HIGH
**Finding:** Layout is valid and deterministic, but visual room identity previously varied per tile rather than per room.
**Improve:** Coherent room identities, landmarks, authored-feeling traversal beats, branch purpose and chapter-specific spatial grammar.
**Build action:** Room-level deterministic archetypes implemented; next add landmark placement and room adjacency constraints.

## 5. game-economy-rewards — HIGH
**Finding:** Old reward catalogue was eight mostly flat stat bumps.
**Improve:** Recognizable build families, tradeoffs, synergies and reward-choice tension.
**Build action:** Expanded to assault/guard/arcane/exploration/fortune families; expose build identity publicly and improve autonomous choice scoring.

## 6. game-architecture — PASS / WATCH
**Finding:** Strong separation between authority, public render snapshot and presentation.
**Improve:** Keep all new graphics/camera/animation presentation-only; avoid leaking hidden topology.
**Build action:** New 2.5D world projection derives only from public/known cells.

## 7. autonomous-agent-design — MEDIUM
**Finding:** Astra is deterministic and competent, but combat decision making remains simple: adjacent melee, low-health heal, nearby ranged, then objective pathing.
**Improve:** Threat prioritization, boss telegraph avoidance, resource planning, build-aware tactics and positional intent.
**Build action:** Add boss-telegraph reaction and utility scoring without hidden-state access.

## 8. deterministic-simulation — PASS / WATCH
**Finding:** Strong replayable authority with named RNG and restore tests.
**Improve:** Every new mechanic must retain byte-stable replay and explicit semantic events.
**Build action:** New boss phase derives only from authoritative HP/distance/cooldown state.

## 9. game-physics — MEDIUM
**Finding:** Grid legality is robust but spatial feel is discrete and lacks richer movement vocabulary.
**Improve:** Presentation interpolation, knockback/impact cues, leap visualization, collision emphasis and terrain-height illusion without altering authority.
**Build action:** Keep logical grid movement; add render-only locomotion interpolation and impact envelopes.

## 10. game-audio — HIGH
**Finding:** Bounded ambience and cue cooldowns exist, but sonic identity is still synthesized/generic.
**Improve:** Biome stems, boss phase layers, enemy signatures, relic pickup stingers, directional danger cues and result choreography.
**Build action:** Map world director musicState to richer deterministic layers and phase transitions.

## 11. game-feel-vfx — HIGH
**Finding:** Particles, shake and telegraph rings exist, but attacks still read as icon events more than authored combat.
**Improve:** Anticipation/impact/recovery envelopes, directional strikes, ranged projectiles, hit reactions, boss phase transition effects, restrained screen shake.
**Build action:** Add semantic-event-driven attack trails/projectiles and phase transition cue.

## 12. livestream-hud — MEDIUM
**Finding:** World now dominates the screen and permanent side HUD is removed. Mobile caption regression was caught and repaired.
**Improve:** Build identity, boss phase, objective and danger should be understood in under 10 seconds without covering the world.
**Build action:** Add compact build-family label and phase escalation state; keep side width at zero.

## 13. viewer-retention — HIGH
**Finding:** Endless autonomy and audience influence exist, but minute-to-minute dramatic pattern can flatten between bosses.
**Improve:** Discoveries, near-death recoveries, rare rooms, elite encounters, build spikes, chapter reveals and replayable peak moments.
**Build action:** Add landmark/elite event cadence and event-director hooks.

## 14. audience-interaction — MEDIUM
**Finding:** Influence is bounded, optional, audited and non-terminal.
**Improve:** Make audience choices more visually legible and strategically interesting without becoming pay-to-win.
**Build action:** Visualize route modifiers physically in rooms and expose consequence preview.

## 15. crowd-moderation — PASS / WATCH
**Finding:** Existing normalization, moderation and bounded fixed tokens are strong.
**Improve:** Preserve this boundary as new audience-facing labels/cosmetics are added.
**Build action:** No gameplay expansion may bypass normalized influence commands.

## 16. security-privacy — PASS / WATCH
**Finding:** Public snapshot hides seed/run ID/hidden enemies and topology.
**Improve:** Continue privacy-safe build/reward telemetry and no raw provider identity in presentation.
**Build action:** New build-family data is derived only from public relic IDs.

## 17. long-running-reliability — PASS / WATCH
**Finding:** Restart, recovery, bounded histories and health states are unusually strong.
**Improve:** New animation/VFX pools and world props must remain bounded across multi-hour soak.
**Build action:** Retain hard caps for props, lights, particles, cues and replay windows.

## 18. performance-optimization — HIGH
**Finding:** Current Canvas renderer performs linear tile lookups repeatedly while assembling scene items.
**Improve:** Pre-index tiles/entities by cell, cull earlier, quality-tier atmosphere/lights, cache static room geometry.
**Build action:** Replace repeated `world.tiles.find(...)` calls with a per-frame cell map and add quality degradation rules.

## 19. game-analytics-experimentation — MEDIUM
**Finding:** Strong operational telemetry exists, but creative-quality metrics are limited.
**Improve:** Track encounter duration, boss phase survival, relic family uptake, fallback rate, room discovery, near-death recovery and viewer comprehension proxies.
**Build action:** Add bounded analytics events from existing semantic facts.

## 20. simulation-qa — HIGH
**Finding:** Determinism and invariants are strong; visual/game-feel regressions need more direct coverage.
**Improve:** Boss phase corpora, relic-family property tests, long-run build diversity, screenshot matrices and dense-scene tests.
**Build action:** Added new depth tests; expand browser capture cases for boss/biome/mobile states.

## 21. production-readiness-review — BLOCKED BY EVIDENCE
**Finding:** Internal architecture/testing is strong, but visual rebuild changes reset parts of candidate evidence and still require browser captures, soak and external R5 evidence.
**Improve:** Treat every material visual/gameplay change as candidate-bound and rerun required gates.
**Build action:** Do not claim production-ready until full CI, browser evidence, soak and external evidence are current for the exact SHA.

## 22. isometric-world-rendering — HIGH
**Finding:** Extruded 2.5D geometry, depth sorting, props, lights and physical objectives are now present, but characters/props still use procedural vector primitives rather than authored asset-grade animation.
**Improve:** Better silhouettes, occlusion handling, wall transparency/fade, locomotion interpolation, landmark scale, cast shadows and biome materials.
**Build action:** Add cell-indexed renderer, occluder fade, stronger room landmarks and animation envelopes before considering a WebGL migration.

# Cross-skill priority

### P0 — next implementation loop
- boss phase-three behaviour + telegraph readability;
- build-family reward depth and public build identity;
- boss-aware Astra tactics;
- renderer cell indexing/performance;
- boss/projectile/hit animation envelopes;
- visual regression capture gates.

### P1
- landmarks and authored room composition;
- family-aware autonomous reward choice;
- biome audio layering;
- elite encounter cadence;
- occlusion/transparency system;
- analytics for build and encounter quality.

### P2
- richer chapter modifiers;
- advanced loot synergies;
- additional boss archetypes;
- optional WebGL/Three.js renderer investigation after the Canvas 2.5D quality ceiling is measured with captures.
