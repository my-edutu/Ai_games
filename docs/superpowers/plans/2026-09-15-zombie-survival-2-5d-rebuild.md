# AI Zombie Survival 2.5D Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or subagent-driven-development task-by-task.

**Goal:** Build an isolated, deterministic, autonomous 2.5D zombie-survival game package whose presentation reflects authoritative simulation state.

**Architecture:** A fixed-step TypeScript simulation owns gameplay truth. The browser renderer consumes detached snapshots and semantic events, with camera/audio/VFX unable to mutate authority. The package stays self-contained under `games/ai-zombie-survival` so parallel game work remains untouched.

**Tech Stack:** TypeScript 5.8, ES2022, Canvas2D, Web Audio API, Node test runner.

**Spec:** User-supplied AI Zombie Survival complete 2.5D rebuild brief.

## Global Constraints
- Do not modify Eko Street Run or other active game rebuilds.
- Use a fixed authoritative tick and seeded deterministic randomness.
- Presentation cannot mutate authoritative state.
- Viewer influence is bounded, auditable, and cannot guarantee outcomes.
- Keep HUD compact and prioritize visible world action.
- Do not claim screenshot/runtime evidence that was not actually captured.

## Tasks
- [x] Establish deterministic authoritative state and world generation.
- [x] Implement survivor AI, infection, scavenging, repair, combat, and resources.
- [x] Implement zombies, horde reinforcement, crowd separation, barricade pressure, and day/night behavior.
- [x] Implement bounded viewer influence and detached render snapshots.
- [x] Implement event-driven camera director.
- [x] Implement isometric city renderer, articulated survivor/zombie representations, barricades, loot, lighting, weather, VFX, audio cues, and compact HUD.
- [x] Add deterministic, presentation-integrity, camera, visual mapping, and 250-zombie stress tests.
- [x] Run three quality passes and remove presentation-to-authority mutation.
- [x] Measure simulation performance at 25/50/100/250 zombies.
- [ ] Capture runtime screenshots in an environment where browser policy permits loopback/file navigation.
- [ ] Run multi-hour browser/OBS soak and complete adaptive ambience/score.
- [ ] Implement rescue/evacuation mechanics if promoted into the authoritative game design.
