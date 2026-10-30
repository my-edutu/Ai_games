# AI vs 1,000 Floors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. The user explicitly requests independent builder/critic loops. Independent files may be built in parallel; review every important piece and the integrated game.

**Goal:** Deliver a complete finite 3D autonomous campaign and a live evidence page, then iterate against the fixed presentation references.

**Architecture:** Game-owned fixed-step TypeScript core, worker authority, immutable render snapshots, Three.js presentation, native HTML/CSS HUD and a static Node launcher. Reuse the public named RNG package. No cross-game private imports.

**Tech Stack:** Node >=22, TypeScript 5.8.3, Three.js 0.186.0, Playwright 1.55.0.

**Spec:** docs/superpowers/specs/2026-10-30-thousand-floors-gauntlet.md

## Global Constraints

- Preserve the finite 1,000-floor campaign, persistent checkpoints and autonomous spectator experience.
- Fixed 30 Hz authority; named seeded randomness; bounded state; immutable render snapshots; same core in browser and Node.
- Original assets; reference imagery is review evidence only. No console-quality or production claims without independent evidence.
- Keep every change inside Game 4 and its minimal build/launcher integration.
- Use the interface contract at docs/gauntlet/thousand-floors/interfaces.md.

## Review Focus

- Corrupt or oversized saves: reject explicitly and offer a new run without destroying the only old save silently.
- Floor 1,000: genuine finite completion, no floor 1,001 or infinite transition.
- Paused/resumed/accelerated presentation: no authority drift; immutable snapshot ownership.
- Small mobile viewport and unavailable WebGL: readable controls and truthful fallback, no blank page.
- Repeated floor transitions: bounded geometry/material/audio/event allocations and deterministic cleanup.

## Task 1: Campaign and autonomous movement

**Files:** games/ai-vs-1000-floors/src/{types,content,simulation,persistence,index}.ts; tests/foundation/thousand-floors-core.test.cjs.
**Interfaces:** Produce the core API and snapshot defined in the interface contract. Renderer and worker consume snapshots, never mutable state.

- [ ] Write failing behavioural tests for seed reproducibility, all-floor content validation, finite completion, safe hazard decisions, checkpoint recovery, immutable snapshots, save corruption and restore equivalence.
- [ ] Implement the TypeScript core and run focused tests; record actual commands/results.
- [ ] Hand off the actual core and test evidence to a fresh specification/quality critic; fix material findings.

## Task 2: Character and 3D environment

**Files:** public/ai-vs-1000-floors/{scene,character,environment,materials}.js.
**Interfaces:** createFloorScene(canvas, options) and renderer methods in the interface contract; import Three.js through the supplied import map. Consume immutable snapshots only.

- [ ] Build an original articulated protagonist, companion, rich dimensional room/sky composition, ten differentiated districts, readable hazards, restrained effects and continuous animation.
- [ ] Inspect real running frames and a moving sequence; exercise resize, reduced motion, context failure and repeated disposal.
- [ ] Give a fresh critic matched reference/gameplay evidence; fix the largest visual gap and recapture.

## Task 3: Browser experience and progress page

**Files:** public/ai-vs-1000-floors/{index.html,styles.css,app.js,worker.js,audio.js,progress.html,progress.js,progress.css,progress.json}; scripts/serve-thousand-floors.cjs; games/ai-vs-1000-floors/tsconfig.browser.json; package.json; tsconfig.json; tests/browser/thousand-floors.spec.cjs; playwright.floors.config.cjs.
**Interfaces:** Worker owns simulation; app sends bounded settings/transport messages and receives snapshots/checkpoints. Server serves /floors/ and /floors/progress with a strict static path map.

- [ ] Write focused browser behaviour assertions for initial render, autonomous progress, pause/resume, camera/speed/sound/settings, save/reload and mobile layout.
- [ ] Implement responsive HUD, worker bridge, opt-in event audio, validated saves, reduced motion/clean feed, error states and the live progress page.
- [ ] Run browser checks and inspect desktop/mobile screenshots; fix real usability and rendering failures.

## Task 4: Integrated Gauntlet and reviewable delivery

**Files:** docs/gauntlet/thousand-floors/*; game documentation; evidence/thousand-floors/*; progress.json.

- [ ] Freeze references and record the honest empty-runtime baseline.
- [ ] Run all-floor and multi-seed campaign checks; validate restart/save and browser memory/resource behaviour.
- [ ] Dispatch independent critics for core, character/environment, HUD and the integrated moving game. Preserve evidence and fix their highest-impact gaps in further rounds.
- [ ] Update the progress page with every meaningful iteration. Complete required game documentation and running instructions.
- [ ] Verify build, focused tests, catalogue tests and actual browser output. Commit to the isolated branch and create a reviewable draft PR. Record the current benchmark verdict without inventing parity.
