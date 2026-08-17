# AI Dungeon: Endless Adventure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:executing-plans` or `superpowers:subagent-driven-development`. Every behaviour change follows red-green-refactor and every phase closes with specification and quality reviews.

**Goal:** Deliver Game 9 as a deterministic, autonomous, stream-ready endless tactical dungeon with six complete software phases and an honest R4 release candidate.

**Architecture:** A strict TypeScript game module owns fixed-step authority. Seeded generation, AI and rules emit versioned semantic events, checksums and snapshots. Provider-neutral audience, presentation, audio, persistence and operations remain adapters outside authority.

**Tech stack:** Node.js 22+, TypeScript 5.8, CommonJS build, Node test runner, HTML5 Canvas, Web Audio and Playwright Chromium.

## Global constraints

- Work on `feat/game-09-ai-dungeon` until reviewed.
- Reuse public shared packages; do not import private code from another game.
- Use named seeded streams and integer logical time for every authoritative outcome.
- Keep renderer, audio, provider, storage and optional model calls outside authoritative ticks.
- Bound every collection, queue, retry, search, effect and generated artefact.
- Critical information needs visual/caption alternatives and reduced-motion/colour-safe modes.
- Audience effects cannot guarantee victory, death, records or unavoidable terminal harm.
- A phase passes only with reproducible evidence and zero open P0/P1 findings.
- R5 and `productionReady:true` require genuine external production evidence.

## Phase 1 — Deterministic headless foundation

1. Write failing tests for config rejection, seeded topology equality, mandatory reachability, bounded generation, legal movement/combat, event sequence, lifecycle, checksum equality, restore and corruption rejection.
2. Implement Dungeon contracts, strict config, state, connected room/corridor generation, validator, deterministic repair and safe fallback.
3. Implement stable action ordering, integer movement/combat/interactions, events, runtime, snapshots and headless runner.
4. Run focused, replay, stress-seed and affected catalogue tests.
5. Review Phase 1 specification, architecture, fairness, resource bounds and determinism; fix all P0/P1 findings.
6. Commit `feat(dungeon): complete deterministic headless Phase 1`.

## Phase 2 — Autonomous RPG, progression and economy

1. Write failing tests for hidden-information isolation, legal actions, tie-breaks, path budgets, stuck recovery, enemy archetypes, boss phases, loot caps, stacking, source/sink events and progression.
2. Implement bounded observations, utility goals, A* pathfinding, reflexes, fallback and public intent.
3. Implement Mireling, Bone Warden, Ember Seer, Void Hound, Mimic and chapter boss behaviours with telegraphs.
4. Implement capped relics, potions, gold/essence, rewards, chapter milestones, records and automatic restarts.
5. Run deterministic campaigns, economy extremes and adversarial seeds.
6. Critique AI believability, character distinction, combat causality, build diversity and progression readability; fix P0/P1 findings.
7. Commit `feat(dungeon): complete autonomous RPG Phase 2`.

## Phase 3 — Premium broadcast UI, vector characters, VFX and audio

1. Write failing tests proving public snapshots omit private memory, cap entities/history, expose objective/danger hierarchy, map semantic cues and report output health.
2. Implement immutable snapshots, semantic presentation/audio models and a one-authority HTTP stream host with validation, limits, health and self-test.
3. Implement responsive Canvas dungeon, vector silhouettes, fog, telegraphs, restrained VFX, camera focus and density caps.
4. Implement accessible HUD, captions, keyboard controls, colour-safe/reduced-motion modes and result/restart scenes.
5. Implement bounded Web Audio buses, semantic SFX and adaptive calm/exploration/danger/boss/recovery/result states with silent degradation.
6. Run 16:9, mobile, reduced-motion, accessibility, freshness, recovery and overflow browser checks.
7. Critique UI hierarchy, mobile legibility, silhouettes, animation density, sound hierarchy/fatigue and pacing; fix P0/P1 findings.
8. Commit `feat(dungeon): complete premium broadcast Phase 3`.

## Phase 4 — Audience interaction and Chat vs AI

1. Write failing tests for validation, moderation, idempotency, scheduling, vote tie-breaks, caps, cooldown, expiry, conflicts, reversal, outage, disable and no-guarantee rules.
2. Implement provider-neutral normalisation and eligible relic vote, route, reveal, shield, elite-for-reward, theme and challenge effects.
3. Reject stale, over-cap, disabled, unavoidable-harm and guaranteed-success effects.
4. Implement vote windows, exactly-once ledger, acknowledgements, expiry/reversal and bounded pressure decay.
5. Add sanitized poll/queue/disclosure/fallback state to the public scene.
6. Run duplicate/reorder/burst, zero-audience, outage, fairness, moderation and replay campaigns.
7. Critique monetization pressure, Astra's agency, UI crowding, acknowledgement sound priority and disclosure; fix P0/P1 findings.
8. Commit `feat(dungeon): complete audience interaction Phase 4`.

## Phase 5 — Persistence, recovery, operations and chaos

1. Write failing tests for writer fencing, reservation/commit sequence, duplicate recovery, corrupt snapshots, divergence, crash breaker, frozen output, queue/history bounds and safe controls.
2. Implement a storage-adapter-neutral append-only authority journal with lease epoch, snapshots, restore verification and integrity quarantine.
3. Implement supervisor heartbeat, restart budget/backoff/breaker, component isolation, maintenance scene and output probes.
4. Implement RBAC-ready typed controls that cannot arbitrarily edit authority.
5. Implement chaos scenarios for crashes, corruption, duplicates, stale lease, provider/audio/output failures, event storms and resource pressure.
6. Run recovery equivalence, accelerated endurance, bounded-resource, output and rollback exercises; document exact operator actions.
7. Critique operational visibility, recovery truth, safe scenes, UI health and restart loops; fix P0/P1 findings.
8. Commit `feat(dungeon): complete reliability and operations Phase 5`.

## Phase 6 — Release governance and handoff

1. Write failing tests requiring exact candidate/config/content/test evidence, zero P0/P1 findings, campaigns, browser/chaos/security/rollback evidence and truthful external-evidence blocking.
2. Implement an assessor that passes complete internal software gates as R4 while keeping `productionReady:false` until real external evidence passes.
3. Implement deterministic baseline/pressure/restore/economy/interaction/resource/stream/chaos/traceability validation and frozen candidate checks.
4. Extend CI to build/test Game 9, scan authoritative paths for ambient nondeterminism, self-test the stream and produce Phase 5/6 artifacts.
5. Write runbook, rollback, R5 intake, final review and exact-command handoff; update catalogue truth.
6. Perform separate specification, architecture, gameplay/AI/characters, UI/accessibility, audio, audience, security/privacy, reliability/performance and release reviews.
7. Fix every load-bearing finding and rerun the Game 9 suite plus available catalogue checks.
8. Commit `feat(dungeon): complete AI Dungeon Phases 1–6`, push the branch and open a draft pull request with evidence and explicit R5 blockers.