# Infinite Tower Climb 2.5D Visual Rebuild Implementation Plan

> **For implementers:** Execute with the repository TDD/verification workflow. Keep `games/eko-street-run/**` untouched.

**Goal:** Replace Infinite Tower's dashboard/debug-canvas presentation with a cinematic, world-first, GPU-accelerated 2.5D autonomous climbing experience while preserving deterministic gameplay authority.

**Spec:** `games/infinite-tower-climb/VISUAL_ARCHITECTURE.md`

**Architecture:** Preserve `TowerRuntime -> immutable TowerRenderSnapshot -> TowerPresentationController`. Extend presentation-safe snapshot/camera data, replace the public renderer/HUD, add procedural theme/animation/VFX/audio systems, then broaden browser capture and acceptance evidence.

**Tech Stack:** TypeScript authority/presentation contracts, static browser JavaScript, native WebGL2 + WebAudio, CSS overlay HUD, Node test runner, Playwright, GitHub Actions.

---

### Task 1 — Lock the visual contract (RED)
- Add `tests/phase3/tower-visual-rebuild.test.cjs` asserting WebGL2 world rendering, compact HUD, real climber/guardian render paths, five environment kits, animation states, pooled VFX/audio, and broadcast camera modes.
- Update the old layout expectation that required a 280px side dashboard.
- Push and record the expected CI failure against the old renderer.

### Task 2 — Presentation contract and camera (GREEN)
- Extend `presentation/snapshot.ts` with grounded/checkpoint/guardian-safe metadata.
- Rebuild `presentation/layout.ts` so stage is full-frame and overlays do not reserve a side column.
- Rebuild `presentation/camera.ts` with smooth X/Y tracking, look-ahead, dynamic zoom and deterministic scene focus modes.
- Keep existing authority tests green.

### Task 3 — World-first browser renderer
- Replace `public/infinite-tower-climb/app.js`, `index.html`, and CSS.
- Add native WebGL2 renderer and procedural art helpers served from the Tower stream host.
- Render layered background/midground/gameplay/foreground with fog, parallax, occlusion, lighting cues and shadows.
- Convert platforms/hazards to themed architectural modules rather than flat rectangles.

### Task 4 — Character, guardians, animation and physicality
- Add articulated climber mesh/silhouette and state-driven animation blending.
- Add guardian/enemy silhouettes, telegraphs and defeat/presence effects.
- Add landing squash, dust/debris, knockback/hit responses and camera impulses without changing authoritative collision truth.

### Task 5 — VFX, audio, HUD and long-session variation
- Add bounded pooled VFX and WebAudio cue/music layers.
- Add compact broadcast HUD, boss bar, contextual AI intent and milestone cards.
- Map foundry/ruins/storm/clockwork/void to visually distinct kits and milestones at 10/25/50/100/250/500/1000.

### Task 6 — Browser evidence and three quality passes
- Expand `tests/browser/tower-stream.spec.cjs` to capture baseline-compatible desktop plus seven named visual situations using deterministic seeded/preview presentation modes without mutating authority.
- Record frame/render metrics and no-console-error assertions.
- Run Pass 1 build, Pass 2 director critique/fixes, Pass 3 timing/polish/fixes.

### Task 7 — Documentation and final gate
- Create `ART_DIRECTION.md`, `CAMERA_SYSTEM.md`, `ANIMATION_SYSTEM.md`, `VFX_AUDIO_SYSTEM.md`, `PERFORMANCE_REPORT.md`, `VISUAL_ACCEPTANCE_REPORT.md`.
- Run CI build/tests/self-test/Playwright; inspect statuses and captured evidence availability.
- Compare branch to base and verify zero changes under `games/eko-street-run/**`.
- Mark every final acceptance item PASS/INCOMPLETE with evidence; never infer a pass from documentation alone.
