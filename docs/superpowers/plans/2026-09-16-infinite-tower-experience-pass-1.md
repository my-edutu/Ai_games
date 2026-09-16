# Infinite Tower Climb Experience Pass 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace repetitive platform ascent with expressive wall-jump/mantle traversal, deterministic sector room grammar, landmark floors, and choreographed encounter slots while preserving Tower authority and replay guarantees.

**Architecture:** Extend `TowerChunk` with sanitized room metadata and deterministic encounter slots; generate platforms/hazards from bounded theme templates; add contact-driven mantle and explicit wall-jump physics; teach the autonomous policy to use wall jumps only when route geometry requires them; place enemies from encounter slots; expose the room identity through the existing public snapshot and renderer. Presentation remains downstream of authoritative state.

**Tech Stack:** TypeScript deterministic simulation, named seeded RNG, Node test runner, Canvas2D presentation, Playwright browser evidence, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-16-infinite-tower-experience-pass-1-design.md`

## Global Constraints

- `games/eko-street-run/**` is read-only.
- Preserve deterministic authoritative state, replay checksums, named RNG, bounded entity counts, recovery behavior, and public/private state separation.
- No presentation code may mutate authoritative simulation.
- New generation must remain seed-stable and solvable by the autonomous agent.
- Existing accessibility, clean-feed, portrait, reduced-motion, high-contrast, browser evidence, chaos, release-validation and nondeterminism gates remain mandatory.

---

### Task 1: Lock room-grammar and movement contracts RED

**Files:**
- Create: `tests/phase2/tower-room-grammar.test.cjs`
- Create: `tests/phase2/tower-movement-mastery.test.cjs`
- Modify: `tests/phase3/tower-visual-rebuild.test.cjs`

**Interfaces:**
- Requires future `TowerChunk.roomArchetype`, `TowerChunk.landmarkName`, `TowerChunk.encounterSlots`, `TowerAction.wallJump`, `TowerStats.wallJumps`, `TowerStats.mantles`.
- Produces failing acceptance contracts before production changes.

- [ ] Write a generation test asserting same seed/floor produces identical room metadata and geometry; sampled themes expose multiple archetypes; floor 25 has a landmark; every encounter slot references a real platform.
- [ ] Write physics tests asserting wall jump fails without a wall, succeeds from a solid-wall contact with deterministic away/up velocity, and mantle lands on a legal platform top.
- [ ] Add source/browser-contract markers for `roomArchetype`, `landmarkName`, `wallJumping`, `mantling` and room diagnostics.
- [ ] Run CI and confirm failures are exactly missing room/movement contracts.
- [ ] Commit `test(tower): require room grammar and movement mastery`.

### Task 2: Add deterministic room grammar and landmark metadata

**Files:**
- Modify: `games/infinite-tower-climb/src/state/types.ts`
- Create: `games/infinite-tower-climb/src/generation/room-grammar.ts`
- Modify: `games/infinite-tower-climb/src/generation/chunks.ts`
- Modify: `games/infinite-tower-climb/src/presentation/snapshot.ts`

**Interfaces:**
- `roomGrammar(theme,floor,rng,config)` returns `{roomArchetype, landmarkName?, platforms, hazards, encounterSlots}`.
- `encounterSlots` roles are `pressure|blocker|crossfire|guardian-stage` and reference generated platform IDs.

- [ ] Add the new chunk metadata types and public snapshot fields.
- [ ] Implement three deterministic archetypes per theme using only solid/oneway/moving platforms and existing hazards.
- [ ] Add landmark selection for floors 10/25/50/100/250/500/1000 with wider reveal/staging geometry and reduced unavoidable hazard pressure.
- [ ] Replace the alternating six-platform generator with room-grammar output while preserving spawn/checkpoint/exit semantics and checksums.
- [ ] Run generation/determinism tests and full build/test.
- [ ] Commit `feat(tower): add deterministic sector room grammar`.

### Task 3: Add wall-jump and mantle physics

**Files:**
- Modify: `games/infinite-tower-climb/src/state/types.ts`
- Modify: `games/infinite-tower-climb/src/runtime/run.ts`
- Modify: `games/infinite-tower-climb/src/physics/step.ts`
- Modify: config initialization only if a constant is required; avoid new user-facing config unless tests prove necessary.

**Interfaces:**
- `TowerAction.wallJump:boolean`.
- Wall jump uses the wall contact direction discovered during the horizontal collision pass and applies a fixed bounded horizontal impulse plus existing `jumpImpulse` vertically.
- Mantle is contact-driven when the player overlaps a platform side near its top edge and vertical speed is bounded; it snaps to platform top + halfHeight and emits a `mantle` semantic event in the rules layer if that layer owns events.

- [ ] Add `wallJump:false` to all action constructors/default validation paths.
- [ ] Track wall-jump/mantle stats and new player states.
- [ ] Implement deterministic wall-jump and mantle mechanics without randomness.
- [ ] Ensure one-way platforms cannot be used as solid wall-jump walls.
- [ ] Run focused movement tests, replay determinism and full build/test.
- [ ] Commit `feat(tower): add wall jump and mantle traversal`.

### Task 4: Teach autonomous AI the new traversal vocabulary

**Files:**
- Modify: `tests/phase2/tower-ai.test.cjs`
- Modify: `games/infinite-tower-climb/src/ai/policy.ts`
- Modify: `games/infinite-tower-climb/src/ai/graph.ts` only if route metadata is insufficient.

**Interfaces:**
- Policy continues priority: projectile safety → hazard safety → guardian → enemy → stuck recovery → traversal.
- During traversal, if airborne beside a solid wall and target center is above/away beyond ordinary air-control reach, choose `wallJump:true` and move away from the contacted wall.

- [ ] Add RED AI test for a seeded wall-jump route and a regression proving projectile evasion still outranks traversal tricks.
- [ ] Implement the minimal wall-jump route decision without hidden future geometry.
- [ ] Run AI tests and deterministic campaign samples.
- [ ] Commit `feat(tower): let autonomous AI use wall-jump routes`.

### Task 5: Choreograph encounters from room slots

**Files:**
- Modify: `games/infinite-tower-climb/src/generation/content.ts`
- Modify: `tests/phase2/tower-content-campaign.test.cjs`

**Interfaces:**
- Enemy generation consumes `chunk.encounterSlots` instead of fixed platform indexes.
- `pressure` prefers shooter, `blocker` prefers sentinel, `crossfire` creates bounded separated enemies, `guardian-stage` reserves the guardian platform and reduces ordinary pressure.

- [ ] Add tests proving all spawned enemies originate from valid encounter slots and guardian-stage never exceeds `maxEnemiesPerFloor`.
- [ ] Implement slot-driven deterministic enemy composition.
- [ ] Add campaign assertions that sampled runs still progress and technical outcomes do not increase.
- [ ] Commit `feat(tower): choreograph deterministic room encounters`.

### Task 6: Present room identity, landmarks and movement mastery

**Files:**
- Modify: `public/infinite-tower-climb/app.js`
- Modify: `public/infinite-tower-climb/index.html` only if a small landmark label hook is needed.
- Modify: `scripts/serve-tower-stream.cjs`
- Modify: `tests/browser/tower-stream.spec.cjs`
- Modify: `tests/phase3/tower-visual-rebuild.test.cjs`

**Interfaces:**
- Renderer reads public `roomArchetype` and `landmarkName`.
- New diagnostics: `roomArchetype`, `landmarkVisible`, `movementState`.
- Evidence scenarios: `room`, `landmark`, `movement` in addition to existing normal/high-floor/hazard/guardian/jump/theme/milestone.

- [ ] Add RED browser/source tests requiring room metadata and landmark/movement diagnostics.
- [ ] Add room-specific structural motifs keyed by authoritative archetype, not theme inference alone.
- [ ] Add landmark reveal treatment and readable sanitized landmark name in non-clean-feed mode; clean feed remains world-only.
- [ ] Add wall-jump/mantle presentation poses/accents driven by player state.
- [ ] Add evidence scenarios and screenshots: `room-grammar.png`, `landmark-reveal.png`, `movement-mastery.png`.
- [ ] Run Chromium and inspect the captures manually for distinct composition, readable routes and unobstructed gameplay.
- [ ] Commit `feat(tower): present rooms landmarks and movement mastery`.

### Task 7: 22-skill review and full verification

**Files:**
- Modify: `games/infinite-tower-climb/TWENTY_TWO_SKILL_REVIEW.md`
- Modify: relevant audit docs only where evidence actually changed.

**Interfaces:**
- Uses source tests, campaign telemetry, nondeterminism, chaos, release validation and browser artifact evidence.

- [ ] Re-review all 22 skills using current implementation, closing only evidenced findings.
- [ ] Record any new stop-ship defects using Moment → Expected → Observed → Why → Severity → Exact improvement → Verification.
- [ ] Run the complete `Autonomous Games CI` workflow on the final commit.
- [ ] Confirm Tower self-test, nondeterminism scan, Tower Phase 5 chaos, Tower Phase 6 release validation and Chromium all pass.
- [ ] Download and visually inspect the Tower capture artifact.
- [ ] Confirm PR/branch diff contains zero `games/eko-street-run/**` modifications.
- [ ] Commit `docs(tower): update experience pass review evidence`.

## Self-review

- Spec coverage: movement mastery, room grammar, landmarks, encounter choreography, presentation/evidence and 22-skill verification are all mapped to tasks.
- Placeholder scan: no deferred implementation placeholders are used; later authored-audio/narrative/soak work is intentionally outside this pass rather than hidden as TODOs.
- Type consistency: room metadata is carried by `TowerChunk` into the public snapshot; `wallJump` is the only new action bit; mantle is contact-driven; encounter slot roles are consistent across generation/content/tests.
