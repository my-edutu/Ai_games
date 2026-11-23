# Turnve BuildSite Ultra-Real Skill Mentor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the live browser-rendered BuildSite scene with mobile-scaled realism and add a reusable cinematic Skill Mentor system with four interactive trade lessons.

**Architecture:** Keep authoritative concrete-pour simulation state untouched. Add mentor/lesson state as a separate Zustand presentation subsystem, mentor proximity in `PlayerController`, camera focus inside R3F, and lesson UI/voice as adapters. Add a procedural realism layer using Three.js textures/materials/site dressing without remote runtime assets.

**Tech Stack:** React 18, TypeScript, Three.js, React Three Fiber, Drei, Zustand, Web Speech API, Web Audio, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-19-turnve-buildsite-ultra-real-skill-mentor-design.md`

## Global Constraints
- Target is a live WebGL/Three.js browser scene, not a static render.
- Mobile-first 44px+ touch controls; no hover-only functionality.
- Skill scores remain separate from concrete-pour readiness scoring.
- No remote runtime asset dependency.
- Existing relative Vite asset hosting must remain intact.
- Existing BuildSite verification suite must remain green.

---

### Task 1: Skill mentor domain and reducer

**Files:**
- Create: `games/turnve-buildsite/src/skillMentor/types.ts`
- Create: `games/turnve-buildsite/src/skillMentor/skills.ts`
- Create: `games/turnve-buildsite/src/skillMentor/engine.ts`
- Test: `games/turnve-buildsite/src/skillMentor/engine.test.ts`

**Interfaces:**
- Produces `SkillId`, `SkillDefinition`, `SkillMentorState`, `createSkillMentorState()`, `reduceSkillMentor()`, `nearestSkillMentor()`.

- [ ] Write failing tests proving: four skills exist; mentor proximity resolves; lesson starts at step 0; valid step actions advance; invalid action does not advance; weighted score is deterministic; exit returns idle while retaining completion evidence.
- [ ] Run `npm test` and verify the new suite fails because mentor modules do not exist.
- [ ] Implement the types, definitions and pure reducer.
- [ ] Run `npm test` and verify all unit tests pass.

### Task 2: Store integration and proximity

**Files:**
- Modify: `games/turnve-buildsite/src/state/store.ts`
- Modify: `games/turnve-buildsite/src/three/PlayerController.tsx`

**Interfaces:**
- Store fields: `nearbySkillMentor`, `skillMentor`, `dispatchSkillMentor`, `setNearbySkillMentor`.
- Player controller calls `nearestSkillMentor(camera.position.x, camera.position.z)` while free navigation is active.

- [ ] Add/update tests as needed around pure proximity behavior before store wiring.
- [ ] Add mentor state to Zustand without serializing it into authoritative simulation persistence.
- [ ] Wire proximity updates into the player controller.
- [ ] Run unit tests.

### Task 3: Cinematic focus camera

**Files:**
- Create: `games/turnve-buildsite/src/three/SkillFocusRig.tsx`
- Modify: `games/turnve-buildsite/src/three/ConstructionScene.tsx`
- Modify: `games/turnve-buildsite/src/App.tsx`

**Interfaces:**
- `SkillFocusRig` consumes active skill definition and lesson phase.
- On start, snapshot camera position/quaternion/FOV; ease to skill camera; on exit restore snapshot.
- App treats active mentor lesson as navigation-paused while keeping Canvas live.

- [ ] Add pure camera-target helper tests in `skillMentor/engine.test.ts` before implementation.
- [ ] Implement focus targets and interpolation.
- [ ] Add `SkillFocusRig` to Canvas.
- [ ] Ensure touch/keyboard movement pauses during focus and resumes after exit.
- [ ] Run unit/build checks.

### Task 4: Mentor prompt and lesson UI

**Files:**
- Create: `games/turnve-buildsite/src/ui/SkillMentorPrompt.tsx`
- Create: `games/turnve-buildsite/src/ui/SkillLessonPanel.tsx`
- Create: `games/turnve-buildsite/src/skill-mentor.css`
- Modify: `games/turnve-buildsite/src/main.tsx`
- Modify: `games/turnve-buildsite/src/App.tsx`

**Interfaces:**
- Prompt shows mentor/trade and launches lesson.
- Lesson panel shows one active step, safety note, action control, score/progress and exit.
- Lesson action dispatches `COMPLETE_STEP` with the exact expected action type.

- [ ] Write browser test expecting mentor prompt and lesson panel before UI implementation.
- [ ] Verify red browser test.
- [ ] Implement mobile-first prompt/panel with 44px+ controls and safe-area padding.
- [ ] Keep the 3D world visible behind lesson UI.

### Task 5: Mentor voice

**Files:**
- Modify: `games/turnve-buildsite/src/audio/voice.ts`
- Create or modify test: `games/turnve-buildsite/src/audio/voice.test.ts`
- Modify: `games/turnve-buildsite/src/ui/VoiceGuide.tsx`

**Interfaces:**
- `buildSkillMentorIntro(skill, learnerName)` and `buildSkillStepVoice(skill, step, learnerName)`.

- [ ] Add failing voice-copy tests.
- [ ] Implement mentor intro and step speech.
- [ ] Trigger voice only once per intro/step transition when audio is enabled.
- [ ] Run unit tests.

### Task 6: Skill mentor characters and work bays

**Files:**
- Modify: `games/turnve-buildsite/src/three/SiteLife.tsx`
- Modify: `games/turnve-buildsite/src/three/WorksiteTasks.tsx`

**Interfaces:**
- Add Emeka Nwosu (Masonry Mentor) and Tunde Balogun (Welding Mentor).
- Daniel and Grace also expose mentor roles for formwork/rebar lessons.
- Work bays visually reflect active lesson step and completion.

- [ ] Add mentor metadata tests to skill definitions.
- [ ] Add named mentor characters at defined positions.
- [ ] Upgrade masonry, welding, formwork and rebar practice stations with realistic props and step highlights.
- [ ] Run unit/build checks.

### Task 7: Ultra-real procedural environment

**Files:**
- Create: `games/turnve-buildsite/src/three/realism/materials.ts`
- Create: `games/turnve-buildsite/src/three/realism/SiteDressing.tsx`
- Create: `games/turnve-buildsite/src/three/realism/Atmosphere.tsx`
- Modify: `games/turnve-buildsite/src/three/ConstructionScene.tsx`

**Interfaces:**
- `createSiteMaterialTextures()` returns reusable CanvasTextures for concrete/soil/timber/steel/rust/wetness.
- `SiteDressing` accepts quality tier.
- `Atmosphere` consumes weather/time/quality.

- [ ] Add tests for deterministic procedural texture seed helpers/quality tier selection.
- [ ] Implement texture/material factories.
- [ ] Replace flat major surfaces with repeated PBR-style maps.
- [ ] Add puddles, tire tracks, grime, timber, scaffold, pallets, pipes, generator, hoses, rebar bundles, wheelbarrow, lights and barriers.
- [ ] Add fog, tone mapping, physically correct renderer config, contact depth and weather-sensitive surface response.
- [ ] Keep decorative counts reduced on mobile.

### Task 8: Four playable lesson sequences

**Files:**
- Modify: `games/turnve-buildsite/src/skillMentor/skills.ts`
- Modify: `games/turnve-buildsite/src/ui/SkillLessonPanel.tsx`
- Modify: `games/turnve-buildsite/src/three/WorksiteTasks.tsx`

**Interfaces:**
- Masonry: identify → bed → carry/place → align → joint.
- Welding: PPE → equipment → coupon → travel pass → inspect.
- Formwork: identify → line/level → brace → fault → correction → verify.
- Rebar: drawing → spacing → cover → mismatch → record → inspection.

- [ ] Expand reducer tests for all four skill paths.
- [ ] Implement context-specific action controls and 3D highlights.
- [ ] Record completed skill evidence and final score.
- [ ] Run unit tests.

### Task 9: Final report skills evidence

**Files:**
- Modify: `games/turnve-buildsite/src/ui/FinalReport.tsx`

**Interfaces:**
- Add `Skills learned` section showing completed mentor lessons and skill scores without modifying readiness score.

- [ ] Add browser assertion for completed skill evidence.
- [ ] Implement report section.
- [ ] Run browser flow.

### Task 10: Mobile-first browser verification and release

**Files:**
- Create: `games/turnve-buildsite/e2e/skill-mentor.spec.ts`
- Modify existing BuildSite E2E only where legitimate UI contracts changed.
- Keep `.github/workflows/turnve-buildsite.yml` verified-only publication behavior.

- [ ] Verify 390x844 mentor proximity prompt.
- [ ] Verify lesson start, 3D scene remains mounted, camera focus mode marker, step progression and exit.
- [ ] Verify a full skill completion appears in final skills evidence path.
- [ ] Verify existing movement, weather, practical, voice and pitch/report flows still pass.
- [ ] Verify production build and preview smoke.
- [ ] Confirm public `turnve-buildsite-live` branch moved only after green CI.
