# Game 4 Route Surface Gauntlet — implementation plan

**Spec:** docs/superpowers/specs/2026-10-31-thousand-floors-surface-identity.md

**Goal:** Improve distinct 3D floor identity at gameplay distance while retaining exact gameplay semantics.

**Task 1** — Test-first: add regression coverage for deterministic ten-district surface identity, bounds, lifetime budgets and static allowlisting. Build a single platform-surface.js presentation module; integrate into environment rendering, not simulation/worker. Check npm run test:floors and TypeScript builds.

**Task 2** — Run actual game in Chromium, inspect matching desktop/portrait floor 006/102/403/902 captures and gameplay frame. Return largest critic finding for a further pass and log verified output. Update /floors/progress, preserve the draft PR and never claim ASTRO BOT parity without credible blind tests.

**Review focus:** Ground contact unchanged; exit and arrows unobscured; no fake walkable bridges; no extra textures; no mobile route occlusion; handle old saves and reload; clean disposal on floor transition.

**Ruling:** Keep follow camera unchanged in this increment to preserve prior verified landing visibility. This means the protagonist can remain small in wide framing, which remains a Gauntlet gap.
