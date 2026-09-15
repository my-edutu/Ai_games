# Eko Run Phase 4 — Mainland Morning Vertical Slice Implementation Plan

**Goal:** Build the first recognizably Lagos Eko Run vertical slice as deterministic presentation derived only from immutable public snapshots/events, with a real Three.js scene adapter, camera contract, multimodal cue plan, presentation quality tiers and measurable five-second comprehension.

## 22-skill design lock

- **Creative direction:** Mainland Morning communicates Lagos through road/drainage geometry, yellow public transport forms, commerce, mixed modern/residential frontage, movement and morning energy—not flags or generic “African” props.
- **Gameplay/progression:** primary progress and safe route stay visually above environment detail; Phase 4 does not add new authoritative hazard consequences.
- **Difficulty/fairness:** traffic/roadwork glimpses are presentation-only previews until Phase 5 fairness contracts own collisions.
- **Procedural generation:** no Phase 4 world randomness; the slice is authored and deterministic so later generation has a benchmark.
- **Economy:** no monetized/cosmetic mechanic can alter route clarity.
- **Platformer review:** player → safe route → immediate danger preview → progress → world → ambience hierarchy is enforced structurally.
- **Architecture:** `snapshot/events -> world model -> Three.js adapter`; Three.js never enters authority modules.
- **AI:** future autoplay receives no hidden visual-only information.
- **Determinism:** same snapshot/options yield same presentation model independent of render rate.
- **Physics:** world meshes do not create collision truth.
- **Audio:** cues derive from semantic/world facts and retain visual/caption alternatives when muted.
- **Feel/VFX:** motion intensity is bounded/reduced-motion aware and never obscures route cues.
- **Livestream/retention:** five-second model exposes district, player, route, progress, and upcoming decision space.
- **Audience/moderation/security:** no viewer text/provider/network dependency in the slice.
- **Reliability:** presentation can be recreated after renderer restart from snapshot/options.
- **Performance:** quality tiers remove ambient/distant detail before route/player/cue information.
- **Analytics:** comprehension metrics are observational only.
- **QA/production:** TDD + 3 adversarial reviews + exact-head CI; no overall production-readiness claim.

## Tasks

1. Add `three@0.186.0` as the pinned MIT presentation dependency and keep it outside authority imports.
2. Author RED Phase 4 tests for Mainland Morning identity, hierarchy, camera, accessibility, quality tiers, Three.js reconstruction and authority isolation.
3. Implement `src/presentation/world/` contracts: district model, quality tiers, camera, audio/cue plan, scene projection and Three.js adapter.
4. Add a 30-second representative evidence runner that samples first-run traversal states, outfits, mobile/desktop/low-tier/muted/reduced-motion modes and measures presentation generation.
5. Run adversarial review pass 1; add failing regression and minimal fix.
6. Run adversarial review pass 2; add failing regression and minimal fix.
7. Run adversarial review pass 3; add failing regression and minimal fix.
8. Gate Phase 4 with focused tests + Phase 1–3 regressions + Three boundary scan + performance evidence + full catalogue CI.
9. Record results, 100-point experience review, Lagos identity review, camera causality log and review-pass evidence.

## Phase 4 non-goals

Authoritative danfo/traffic/pothole/drain/crowd consequences, collision volumes, unavoidable-combination validators and hazard recovery are Phase 5. Full district expansion is Phase 10. Final HUD/audio mix/mobile controls remain later phases.