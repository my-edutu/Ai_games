# AI Battle Royale Gauntlet Implementation Plan

> For agentic workers: use subagent-driven-development with independent critics and repeated repair. User has approved execution.

**Goal:** Complete Game 6 as a polished autonomous 3D battle royale, judged against the fixed references.
**Architecture:** Seeded fixed-step TypeScript authority, immutable JSON presentation, local Three ES-module scene, read-only stream host. Each owned component is independently reviewed; all pieces receive integrated visual and functional review.
**Tech Stack:** Existing Node >=22, TypeScript 5.8.3, Three 0.186.0, Playwright 1.55.0.
**Spec:** `docs/superpowers/specs/2026-10-30-battle-royale-gauntlet.md`

## Global constraints

No other game's private imports; no wall-clock authority or ambient randomness; fixed tick and bounded collections; preserve other games; no fake comparison or readiness passes. The protocol in the spec is shared by all builders. No paid influence or external messaging. `ultracode` is not installed and was disclosed; available subagents execute the loop.

## Review focus

Repeated match rollover; collision/occlusion consistency; renderer reconnection and unavailable WebGL; reduced-motion and mobile HUD; live frame/memory cost during complete matches. Tests must exercise these behaviors rather than mirror code.

## Tasks

- [ ] Authority builder: game runtime, map/roster data, deterministic behavior and checkpoint/campaign tests under `games/ai-battle-royale/src/` and `tests/battle-royale/`. Prove red then green for seeded replay, restore, collision and complete-match restart.
- [ ] World builder: `public/ai-battle-royale/world.js` with coherent coastal sci-fi art direction and solid-geometry correspondence. Validate actual scene with independent critic.
- [ ] Character builder: `public/ai-battle-royale/characters.js` with detailed original rigged combatants and event animation. Validate close-up and motion with independent critic.
- [ ] Integration builder (lead): server, app, scene/camera/effects/audio, accessible responsive HUD, game documentation and live development page. Build, run and capture real output.
- [ ] Independent critics: review running authority, world, characters, UI and integrated build against fixed brief and available references. Return greatest gap to owning builder; repeat while any load-bearing problem remains.
- [ ] Evidence and delivery: record exact commands/results and comparative limitations, commit cohesive changes, push an isolated branch and open a draft PR. Keep live development page honest and resume map explicit.

## Execution ledger

See `docs/reviews/battle-royale-gauntlet-progress.md` for current state and review iterations.
