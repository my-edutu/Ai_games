# Infinite Tower Climb — Gauntlet 42: Gameplay-first Spectator Controls

**Intent:** Reveal the world during normal autonomous gameplay. Keep floor, height, health/stamina, genuine danger and accessible captions on screen; put camera, sound, graphics, fullscreen and detailed AI intent behind a small optional menu.

**Context:** The old global bottom toolbar permanently occupied the gameplay center. Parent PR58 Gauntlet41 independently corrected the radial ledge snap and inspected 32 real WebGL screenshots. This child only changes the interface and progress page, not the running 3D scene or physics.

**Implementation:** One 46px trigger toggles existing camera/audio/motion/quality/fullscreen/details controls. The details card anchors above the tray and remains inside the viewport, scrolling itself. Escape closes details first, then tray with focus restored. Outside taps close without stealing focus; clean-feed hides all controls. Existing handlers and recovery statuses remain.

**TDD:** Two new event regressions first failed against original HUD (RED), then 12/12 HUD tests passed (GREEN). Actual Chromium executed shipping HTML/CSS/HUD code in isolated content at desktop 960x600, portrait 390x844, small phone 320x568, and short landscape 844x390: 5/5 Playwright checks, zero page JS errors, including panel bounds, focus, Escape, controls, outside tap and clean feed. TypeScript build, 141/141 Tower phase3 tests and Tower host self-test all passed locally.

**Limitations:** Browser visuals show true interface markup without an active simulation frame; not a full game screenshot, not AAA comparison and not hardware FPS. No independent critic available because the coding-agent tunnel is disconnected. Exact-branch GitHub Actions full suite and browser checks still required; commercial blind visual A/B, complete motion, device performance and soak remain OPEN.

**Non-goals:** No seeded authority, physics, AI, collision, scoring, gameplay cameras, WebGL renderer changes, additional HUD copy or backend changes. No merge or deployment.

**Result:** Scoped HUD UX/keyboard/viewport gate PASS locally; overall Gauntlet 90% NOT ACHIEVED.