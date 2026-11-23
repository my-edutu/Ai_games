# Turnve BuildSite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a reliable 10–15 minute 3D construction internship vertical slice with deterministic decisions, professional artifacts, stakeholder reactions, pitch controls, and an evidence-backed Intern Readiness Report.

**Architecture:** BuildSite is an isolated Vite + React + TypeScript package inside the monorepo. React Three Fiber owns presentation only; Zustand owns authoritative simulation state; pure rule/evaluation functions make decisions deterministic and testable.

**Tech Stack:** React, TypeScript, Vite, Three.js, React Three Fiber, Drei, Zustand, Zod, Vitest, Playwright-compatible browser surface, localStorage.

**Spec:** `docs/superpowers/specs/2026-08-18-turnve-buildsite-design.md`

## Global Constraints

- Learner authority is intern-level; structural approval and pour authorization remain outside learner authority.
- Guided Mode is the default; `?demo=true` must be deterministic and presenter-safe.
- No external API is required for the main flow.
- Presentation cannot directly mutate authoritative simulation state.
- All primary flow buttons must work; no TODO/TBD placeholders.
- Every production claim requires executed verification evidence.

---

### Task 1: Foundation and scenario contracts

**Files:** package/config, `src/simulation/types.ts`, `src/simulation/scenario.ts`, `src/simulation/engine.ts`, `src/state/store.ts`, unit tests.

**Produces:** deterministic state, typed actions, rule effects, metric bounds, readiness calculation, reset.

- [ ] Write tests for PPE gating, hazard discovery, report effects, unauthorized pour consequence, metric bounds, readiness bands, and reset.
- [ ] Add package/build/test configuration.
- [ ] Implement typed scenario/state/action contracts.
- [ ] Implement pure simulation reducer/evaluator and Zustand store wrapper.
- [ ] Run unit tests and production build; record evidence.

### Task 2: 3D site and exploration

**Files:** `src/three/ConstructionScene.tsx`, `PlayerController.tsx`, `InspectionPoint.tsx`, weather/truck/site components, styles.

**Produces:** procedural site, first-person movement, E/click inspection, cinematic intro, hazard state visuals.

- [ ] Add smoke tests for renderer-independent interaction selectors.
- [ ] Build procedural site zones and hazard markers.
- [ ] Add movement, camera bounds/collision approximations, proximity prompts, cinematic intro.
- [ ] Add truck/rain visual state changes and low-performance reductions.
- [ ] Run build and browser smoke flow; record performance/console evidence.

### Task 3: Workplace simulation UI

**Files:** HUD, Site Tablet, PPE induction, dialogue/messages, drawing comparison, checklist, evidence gallery.

**Produces:** guided task progression from induction through pre-pour readiness.

- [ ] Write integration tests for task unlocks, drawing mismatch, checklist truthfulness, and evidence capture.
- [ ] Implement PPE selection and security correction feedback.
- [ ] Implement tablet navigation, tasks, messages, drawings, inspection checklist, evidence.
- [ ] Implement stakeholder contact actions and concise branching responses.
- [ ] Verify keyboard-accessible non-3D UI and pause-while-reading behavior.

### Task 4: Crisis and consequences

**Files:** crisis rules, pitch event controls, consequence timeline, scene reactions.

**Produces:** early truck + rain + missing approval pressure event and multi-order response actions.

- [ ] Write tests for early delivery, correct escalation, communication omissions, unauthorized pour, and delayed-but-safe response.
- [ ] Trigger crisis deterministically from readiness progress/time and via presenter controls.
- [ ] Implement action sequencing, stakeholder trust/frustration effects, waiting-cost/schedule effects, and cause/effect audit.
- [ ] Surface visible truck/weather/barrier/material-protection consequences.
- [ ] Verify no perfect no-trade-off path exists.

### Task 5: Artifacts, TARI, and readiness report

**Files:** artifact editors/evaluator, TARI adapters, report/scoring/export/print.

**Produces:** four required artifacts that affect assessment and a final evidence-backed readiness report.

- [ ] Write tests for artifact completeness, evidence use, inconsistency penalties, authority awareness, scoring, readiness bands.
- [ ] Implement Safety Observation, Draft RFI, Site Diary, Supervisor Update editors.
- [ ] Implement deterministic TARI hints/terminology/help and hint-use tracking.
- [ ] Implement final scoring, strongest/weakest artifact, missed risks, supervisor narrative, cause/effect timeline.
- [ ] Implement JSON export and print-friendly report.

### Task 6: Pitch polish and verification

**Files:** presenter panel, accessibility/settings, audio manager, README/pitch guide, E2E tests.

**Produces:** presenter-safe demo flow and documented operating instructions.

- [ ] Add `?demo=true`, Shift+P presenter panel, reset/jump controls, recommended action sequence.
- [ ] Add captions, reduced motion, text scaling, high contrast, audio controls, loading/error/recovery states.
- [ ] Add critical E2E flow: load → Guided → PPE → inspect → tablet → artifact → crisis → report → reset.
- [ ] Run full tests, production build, browser console check, reset flow, responsive review, and performance review.
- [ ] Fix P0/P1 defects and record remaining external verification blockers without overstating readiness.
