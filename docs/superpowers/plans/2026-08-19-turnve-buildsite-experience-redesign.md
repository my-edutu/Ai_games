# Turnve BuildSite Experience Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Turnve BuildSite navigable on touch devices, alive with construction sound and human activity, visually simpler, and more credible for a work-simulation pitch.

**Architecture:** Keep the deterministic simulation reducer untouched wherever possible. Cross-platform input, audio, character rendering and presentation stay as adapters around the same simulation state so new UX does not fork business logic.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, Drei, Three.js, Zustand, Web Audio API, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-19-turnve-buildsite-experience-redesign.md`

## Global Constraints
- No backend or external asset host is required for the pitch path.
- Touch and desktop must share the same simulation/collision state.
- Tablet has at most four top-level work areas.
- Live HUD does not expose competency scores.
- Sound must respect browser user-gesture/autoplay requirements.
- Full guided pitch flow and mobile-control browser checks must pass before completion.

---

### Task 1: Cross-platform first-person movement

**Files:**
- Create: `games/turnve-buildsite/src/three/input.ts`
- Create: `games/turnve-buildsite/src/ui/TouchControls.tsx`
- Modify: `games/turnve-buildsite/src/three/ConstructionScene.tsx`
- Modify: `games/turnve-buildsite/src/App.tsx`
- Test: `games/turnve-buildsite/src/three/input.test.ts`
- Test: `games/turnve-buildsite/e2e/mobile-controls.spec.ts`

**Interfaces:**
- `normalizeJoystick(dx, dy, radius): { x: number; y: number }`
- `setVirtualMove`, `getVirtualMove`, `addVirtualLook`, `consumeVirtualLook`, `resetVirtualInput`
- `TouchControls({ active })`

- [x] **Step 1: Write failing input tests.** Verify missing input module fails while existing simulation tests remain green.
- [x] **Step 2: Implement pure input primitives.** Clamp joystick magnitude and camera pitch.
- [ ] **Step 3: Write/verify failing mobile browser test.** Require movement joystick, look surface and Inspect button at 390×844.
- [ ] **Step 4: Implement touch controls and connect them to PlayerController.** Touch movement must use existing collision limits and hazard interaction path.
- [ ] **Step 5: Run unit + mobile E2E and commit green state.**

### Task 2: Simplify HUD and Site Tablet

**Files:**
- Modify: `games/turnve-buildsite/src/ui/HUD.tsx`
- Replace structure in: `games/turnve-buildsite/src/ui/SiteTablet.tsx`
- Modify: `games/turnve-buildsite/src/ui/Briefing.tsx`
- Test: `games/turnve-buildsite/e2e/pitch-flow.spec.ts`

**Target information architecture:**
- `Brief` = assignment + progress + blockers + authority
- `Site` = map + hazards/evidence + checklist
- `People` = stakeholder communication
- `Work` = drawing revision + four artifacts

- [ ] **Step 1: Update E2E to require exactly four work-area buttons and no live score panel.**
- [ ] **Step 2: Collapse tablet content into four sections without removing simulation actions.**
- [ ] **Step 3: Replace HUD metric/coach cards with one compact mission bar.**
- [ ] **Step 4: Verify artifact direct-entry still opens Work and the full guided pitch still reaches report.**

### Task 3: Construction soundscape

**Files:**
- Create: `games/turnve-buildsite/src/audio/soundscape.ts`
- Create: `games/turnve-buildsite/src/audio/SiteAudio.tsx`
- Modify: `games/turnve-buildsite/src/App.tsx`
- Modify: `games/turnve-buildsite/src/ui/HUD.tsx`
- Test: `games/turnve-buildsite/src/audio/soundscape.test.ts`

**Sound states:**
- base machinery hum when site navigation is active
- intermittent impact/metal work
- reversing/waiting beep while concrete truck is waiting
- filtered noise rain layer when weather is rain

- [ ] **Step 1: Test sound-state derivation from simulation state.**
- [ ] **Step 2: Implement Web Audio graph created only after Sound is enabled by user gesture.**
- [ ] **Step 3: Add one compact Sound toggle to mission bar; preserve mute state during run.**
- [ ] **Step 4: Verify enabling/muting does not affect simulation determinism or browser flow.**

### Task 4: Humanize workers and stakeholders

**Files:**
- Rewrite: `games/turnve-buildsite/src/three/SiteLife.tsx`
- Create: `games/turnve-buildsite/src/ui/StakeholderPortrait.tsx`
- Modify: `games/turnve-buildsite/src/ui/Briefing.tsx`
- Modify: `games/turnve-buildsite/src/ui/SiteTablet.tsx`

**Character requirements:**
- varied skin tones and PPE
- proportional limbs/torso/head
- facial eyes, nose, mouth and ears
- helmet/brim and reflective vest detail
- named Maya, Ibrahim, Daniel and Grace characters with role labels
- walking, supervising, head-look or gesture animation
- stakeholder portrait illustrations linked to names/roles in UI

- [ ] **Step 1: Replace box workers with human-proportion procedural figures and facial geometry.**
- [ ] **Step 2: Add named stakeholder placements and role labels.**
- [ ] **Step 3: Add portrait component to briefing and People section.**
- [ ] **Step 4: Browser-verify characters render without WebGL/console errors.**

### Task 5: Visual-system redesign

**Files:**
- Create: `games/turnve-buildsite/src/experience-redesign.css`
- Modify: `games/turnve-buildsite/src/main.tsx`

**Palette:** graphite/steel, concrete off-white, safety amber, signal orange/red and verified green. Reduce saturated navy usage.

- [ ] **Step 1: Import final override stylesheet after existing styles.**
- [ ] **Step 2: Restyle landing, mission bar, tablet, crisis panel, touch controls and report for consistent hierarchy.**
- [ ] **Step 3: Add responsive rules for 390×844 and desktop; maintain readable minimum hit targets.**
- [ ] **Step 4: Verify no overlay blocks movement or primary actions.**

### Task 6: Exact-candidate verification and preview

**Files:**
- Modify if needed: `games/turnve-buildsite/e2e/pitch-flow.spec.ts`
- Modify if needed: `games/turnve-buildsite/e2e/mobile-controls.spec.ts`

- [ ] **Step 1: Run all Vitest suites.** Expected: all green.
- [ ] **Step 2: Run production build.** Expected: successful Vite output; record remaining chunk warnings honestly.
- [ ] **Step 3: Run desktop guided Playwright flow.** Expected: evidence-backed readiness report and reset.
- [ ] **Step 4: Run mobile-control Playwright flow.** Expected: touch movement/look/inspect controls visible and usable.
- [ ] **Step 5: Run monorepo CI and preserve unrelated game evidence gates.**
- [ ] **Step 6: Deploy green exact candidate to preview and report remaining hardening gaps without production-ready overclaim.**
