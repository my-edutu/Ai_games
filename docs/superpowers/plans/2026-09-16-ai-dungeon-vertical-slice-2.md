# AI Dungeon Vertical Slice 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Every behaviour change uses red-green-refactor and every completion claim requires fresh verification evidence.

**Goal:** Make Game 9 materially closer to a commercial action-roguelike vertical slice by adding deterministic room identity, a real three-phase boss, event-driven combat choreography, adaptive audio treatment and capture-based experience gates without weakening autonomous/replay/reliability guarantees.

**Architecture:** `DungeonRuntime` and `stepDungeonRules` remain the only gameplay authority. Generation adds deterministic semantic metadata and boss behaviour remains rule-owned; presentation consumes immutable snapshots and semantic events and may animate, shake, trail, pulse or sound them without feeding anything back to authority. Browser quality tiers degrade cosmetic density only.

**Tech Stack:** Node.js 22, TypeScript 5.8, CommonJS build, Node test runner, HTML5 Canvas 2D, Web Audio, Playwright Chromium, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-16-ai-dungeon-vertical-slice-2-design.md`

## Global Constraints

- Work only on `agent/game-09-ai-dungeon-vertical-slice-2` and Game 9/shared contracts strictly required by Game 9.
- Preserve fixed-step authoritative simulation and named seeded randomness.
- Presentation cannot mutate authoritative state, time, collision, AI knowledge or combat outcomes.
- Do not add external runtime dependencies or unlicensed art/audio.
- Low quality and reduced motion must preserve gameplay-critical telegraphs, objective, HP, danger and intent.
- No merge, deployment, force-push, R5 claim, 72-hour claim or seven-day-canary claim.
- Use failing tests first for every behaviour change.

---

### Task 1: Deterministic biome and room-role grammar

**Files:**
- Modify: `games/ai-dungeon-endless-adventure/src/state/types.ts`
- Modify: `games/ai-dungeon-endless-adventure/src/generation/dungeon.ts`
- Modify: `games/ai-dungeon-endless-adventure/src/content/catalogue.ts`
- Test: `tests/phase2/dungeon-vertical-slice-2.test.cjs`

**Interfaces:**
- Produces `DungeonBiome = 'ashen-catacomb'|'drowned-archive'|'void-observatory'`.
- Produces `DungeonRoomRole = 'entrance'|'combat'|'ambush'|'shrine'|'treasure'|'elite'|'boss-approach'`.
- `DungeonFloor.biome` is stable for identical generation inputs.
- `DungeonRoom.role` is assigned deterministically after topology/objectives are known.

- [ ] **Step 1: Write RED generation tests.**

Assert that every generated floor has an allowed biome, every room has an allowed role, the entrance room resolves to `entrance`, the gate-side room resolves to `boss-approach`, identical seeds reproduce identical floor metadata, and a seed corpus exercises at least two biomes and three non-fixed room roles.

- [ ] **Step 2: Run `npm run test:dungeon:phase2` in CI and confirm the assertions fail because biome/role metadata is absent.**

- [ ] **Step 3: Add state types and deterministic role assignment.**

Use a dedicated named stream `grammar-v2:room-role` for non-fixed room roles and `theme-v2:biome` for biome selection. Do not consume the existing topology/objective streams for presentation/content semantics.

- [ ] **Step 4: Make encounter population consume room roles.**

Guardian/boss remains gate-bound. Standard enemy placement prefers semantic rooms using dedicated `encounters-v2:*` streams with bounded fallback to legal walkable cells. Mimics prefer treasure/ambush, hounds prefer ambush/combat, seers prefer combat/elite, and ordinary enemies prefer combat.

- [ ] **Step 5: Re-run Phase 1/2 deterministic tests and confirm GREEN.**

---

### Task 2: Three-phase chapter boss with causal telegraphs

**Files:**
- Modify: `games/ai-dungeon-endless-adventure/src/rules/step.ts`
- Test: `tests/phase2/dungeon-vertical-slice-2.test.cjs`

**Interfaces:**
- Phase 1 when `hp/maxHp > 2/3`.
- Phase 2 when `1/3 < hp/maxHp <= 2/3`.
- Phase 3 when `hp/maxHp <= 1/3`.
- Emits `boss.phase-changed` once when entering Phase 2 or 3.
- Uses existing telegraph values (`boss`, `ranged`, `leap`) so AI/public contracts remain compatible.

- [ ] **Step 1: Add RED tests for all three phases.**

Construct a controlled boss arena. Assert Phase 2 emits `boss.phase-changed` and prepares a ranged telegraph at distance 2–4 with line of sight. Assert Phase 3 emits its transition and prepares a leap at distance 2. Assert unchanged HP band does not repeatedly emit the phase-change event.

- [ ] **Step 2: Add RED causality tests.**

A boss ranged/leap resolution must not damage Astra when line of sight/range becomes invalid between telegraph and resolution. A valid telegraph followed by a valid resolution may damage her.

- [ ] **Step 3: Implement minimal deterministic boss state machine.**

Phase 1: heavy adjacent committed strike. Phase 2: ranged flame telegraph from distance 2–4, otherwise reposition/committed close strike. Phase 3: telegraphed leap from distance 2, otherwise stronger committed melee. Revalidate legality at impact.

- [ ] **Step 4: Re-run focused enemy/campaign/replay tests and confirm GREEN.**

---

### Task 3: Public semantic combat choreography contract

**Files:**
- Modify: `games/ai-dungeon-endless-adventure/src/presentation/snapshot.ts`
- Modify: `games/ai-dungeon-endless-adventure/src/presentation/semantic.ts`
- Test: `tests/phase3/dungeon-vertical-slice-2.test.cjs`

**Interfaces:**
- `DungeonRenderEvent` additionally exposes bounded `entityId`, `cell`, and `value` fields when present in the authoritative event.
- `DungeonPresentationCue.animation` is one of `move|melee|ranged|guard|heal|hit|defeat|telegraph|boss-phase|milestone|result|ambient`.
- Cues may expose sanitized target metadata but never private/hidden state.

- [ ] **Step 1: Write RED cue-contract tests.**

Map representative movement, melee, ranged, guard, heal, damage, defeat, telegraph, boss-phase, milestone and result events and assert exact animation categories. Assert public render events preserve only bounded public event metadata.

- [ ] **Step 2: Run `npm run test:dungeon:phase3` in CI and confirm RED because animation metadata is absent.**

- [ ] **Step 3: Add animation classification and event metadata.**

Keep priority sorting/cue bounds unchanged. `boss.phase-changed` is a boss-priority cue with `boss-phase` animation and distinct audio id.

- [ ] **Step 4: Re-run Phase 3 tests and deterministic snapshot checks.**

---

### Task 4: Browser combat envelope, biome treatment and adaptive audio

**Files:**
- Modify: `public/ai-dungeon/app-core.js`
- Modify: `public/ai-dungeon/app-art.js`
- Modify: `public/ai-dungeon/app-scene.js`
- Modify: `public/ai-dungeon/app-audio.js`
- Modify: `public/ai-dungeon/app-main.js`
- Modify: `tests/browser/dungeon-stream.spec.cjs`
- Modify: `tests/phase3/dungeon-broadcast.test.cjs`

**Interfaces:**
- Bounded presentation-only action envelopes keyed by semantic cue id.
- Hero/enemy rendering consumes current action pose but never mutates snapshot/authority.
- Biome styles derive from `snapshot.environment.biome`.
- Low/reduced-motion preserves semantic poses/telegraphs while suppressing camera translation/pulsing/shake.

- [ ] **Step 1: Add RED source/browser assertions.**

Require an action-envelope budget, biome-style table, semantic animation use, boss-phase audio cue, and browser exposure of animation metadata under normal and reduced-motion modes.

- [ ] **Step 2: Implement bounded action envelopes.**

Combat cues create short presentation envelopes with anticipation/impact/recovery progress. Melee/ranged/guard/heal/hit/boss-phase affect vector pose, trail/impact ring and camera impulse within hard budgets. Expired envelopes are removed every frame.

- [ ] **Step 3: Add biome and room-role visual motifs.**

Use stable vector/material accents only. Preserve the existing ancient-stone hierarchy and add subtle role motifs; do not turn room roles into HUD clutter.

- [ ] **Step 4: Add adaptive semantic audio cues.**

Add bounded cues for melee impact, ranged release, guard/heal and boss phase. Maintain voice limit, cooldowns and priority. Missing/disabled audio remains non-blocking.

- [ ] **Step 5: Capture and inspect desktop, phone landscape, low/reduced, clean feed and boss encounter evidence.**

Reject overflow, console/page errors, hidden telegraphs, unreadable HP/objective/intent, or effect clustering.

---

### Task 5: Versioning, benchmark-review gate and full verification

**Files:**
- Modify: `games/ai-dungeon-endless-adventure/src/manifest.ts`
- Modify: `games/ai-dungeon-endless-adventure/README.md`
- Create: `docs/reviews/2026-09-16-ai-dungeon-vertical-slice-2-review.md`
- Optionally create: `skills/gameplay-capture-critic/SKILL.md` only if no existing repo skill provides the required capture-based review method.

**Interfaces:**
- Manifest versions truthfully identify the changed generator/content/rules/presentation candidate.
- Review record ties findings to exact branch SHA, CI run and capture artifacts.

- [ ] **Step 1: Increment affected versions only.**

Increment generator/content/rules/presentation identifiers in accordance with actual changed authority and snapshot contracts. Do not modify unrelated game versions.

- [ ] **Step 2: Run fresh full verification.**

Required gates: `npm test`, Dungeon stream self-test, authoritative nondeterminism scan, Phase 5 chaos, Phase 6 validation, Dungeon Playwright/capture workflow, and exact-SHA GitHub Actions.

- [ ] **Step 3: Inspect generated captures, not only exit codes.**

Record visible strengths/defects and keep the review focused on combat readability, encounter identity, boss spectacle, clutter, mobile legibility and low-quality preservation.

- [ ] **Step 4: Record truthful readiness.**

Software can remain/return to R4 when all software evidence is green. R5/production-ready remains blocked by the existing external evidence gates unless independently supplied.