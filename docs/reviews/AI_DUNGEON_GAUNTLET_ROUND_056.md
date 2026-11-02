# AI Dungeon — Gauntlet Round 056: Semantic Ground-Contact Clarity

**Date:** 2026-11-01. **Draft PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49), branch **feat/ai-dungeon-3d-gauntlet-foundation**. **Do not merge.**

**Visual benchmark:** real Diablo IV dungeon gameplay/screenshots; secondary composition reference No Rest for the Wicked and combat reference Path of Exile 2. The benchmark is **NOT MET**. This is a bounded cosmetic clarity improvement, not replacement art or a measured FPS improvement.

## Evidence-led choice and exact implementation

Read root AGENTS.md, the Round 18 architectural review, Round 55 critique and real WebGL world-only capture, actual app/rig/combat code, the game-feel and VFX, creative-direction, and performance skills, plus relevant foundation/browser tests. The Round 55 matched screenshot exposed constantly luminous pale cyan ground circles around idle and moving heroes and foes. Those repeated symbols compete visually with true boss telegraphs and combat actions. The dominant bigger artistic gap remains simplified chibi-proportioned GLB bodies and weapon-contact weight; a provenance-cleared new rig set is outside this independently verifiable increment.

Round 56 reserves original existing actor-ground accent rings only for real authoritative **cast** and **guard** presentation actions. A small soft physical contact shadow remains for each living actor. Idle, move, attack, hurt and deceased actors no longer have two constantly luminous decorative circles beneath them. Real boss warnings, hazards, portal markers, loot, simulation-driven combat flashes and genuine action animations remain unchanged. Reduced-motion keeps a static cast sigil while suppressing decorative movement/corona.

This is implemented inside the existing genuine Three.js viewer, not a CSS tint or screenshot mock: a new pure frozen-style planner in public/ai-dungeon/ground-signal-plan.js, the live contact-projection.js renderer, existing strict same-origin route in scripts/serve-dungeon-stream.cjs and reduced-motion/diagnostic integration in app.js. Exact observed fields groundSignals.subjects, shadows, ritualSigils and coronas are computed from current real actor instances. Resource geometry ownership, cleanup and maximum actor count are unchanged; no new geometry, external models, texture licences or runtime network access were added.

## Test-first sequence and evidence

1. **RED first:** New foundation contracts at commit [58a5905](https://github.com/my-edutu/Ai_games/commit/58a5905596b8e4843e775cec324c53ee2b7cea4a), real Chromium seeded-scene contract [39f9879](https://github.com/my-edutu/Ai_games/commit/39f98794810e80b3edb2a745ff94e735084d7e96), and explicit dedicated foundation discovery [c0d0f01](https://github.com/my-edutu/Ai_games/commit/c0d0f01be0fed3b4bbf177acc78ab3b604cbde82). [Test-only workflow 41295834943, authority job 124816451131](https://github.com/my-edutu/Ai_games/actions/runs/41295834943) passed **142 prior tests and failed three new contracts as expected**, missing the new planner and integrations. This is verified in the actual job log, not assumed.
2. **Implementation:** [dd0b5e3](https://github.com/my-edutu/Ai_games/commit/dd0b5e345225736b57ff87d8aae0c69e8599d46b) pure grounded-contact plan; [22ed03b](https://github.com/my-edutu/Ai_games/commit/22ed03bdaeffec5228144a85318cb270dd2e302c) strict CSP route; [8826690](https://github.com/my-edutu/Ai_games/commit/8826690a22c83b05bfa87d85b57ecccedf6da696) actual WebGL meshes; [f53f90c](https://github.com/my-edutu/Ai_games/commit/f53f90c24fc35ae0f398415d353df49d2cef117c) app diagnostics and reduced-motion pass-through. Browser discovery was added at exact code head [a45f820](https://github.com/my-edutu/Ai_games/commit/a45f820587ba0b05c0f541b03098522e3981a2a3).
3. **GREEN:** [Dedicated authority + real Chromium run 41296015131](https://github.com/my-edutu/Ai_games/actions/runs/41296015131) passed **145/145 Dungeon foundation contracts**, **18/18 presentation/interface tests**, and **24 genuine headless seeds × 900 authoritative ticks with zero replay divergence, highest floor 9** (authority job **124816979917**, headless artifact **13078169630**). Three actual SwiftShader Chromium shards passed **22/22 + 21/21 + 21/21 = 64/64**, jobs **124816980007 / 124816979861 / 124816979707**. The new live test checks asset availability, real renderer, seeded actor actions, shadows and ring visibility, and real canvas pixels. No tests were skipped to get green.
4. **Local isolated source retest:** 145/145 foundation tests passed in the real GitHub workflow source workspace. The local container's browser could launch installed Chromium after host-only video configuration but navigation was blocked by its administrator (ERR_BLOCKED_BY_ADMINISTRATOR); this is **not** a local browser pass. GitHub Actions supplies the genuine browser result. A local live HTTP host successfully served the same-origin plan and public state with 200 responses. No simulated screenshots were used.
5. **Other gates:** [Separate visual workflow 41296015300](https://github.com/my-edutu/Ai_games/actions/runs/41296015300) produced the reproducible source workspace. [Catalogue-wide CI 41296015167](https://github.com/my-edutu/Ai_games/actions/runs/41296015167) was **still in progress at the evidence checkpoint**; do not count it as passed here.

## Matched genuine Chromium/WebGL image critique

Reviewed the Round 55 [actual browser screenshot artifact 13077473096](https://github.com/my-edutu/Ai_games/actions/runs/41291440731/artifacts/13077473096) and Round 56 [actual screenshot artifact 13079446988](https://github.com/my-edutu/Ai_games/actions/runs/41296015131/artifacts/13079446988). These are the same 1440×832 real Three.js canvas, source real DungeonRuntime seed **dungeon-ui-round17**, 18 genuine public simulation steps, world-only (no overlay). Also inspected the **new** seeded [ground-signal real Chromium screenshot in browser shard-1 artifact 13079900526](https://github.com/my-edutu/Ai_games/actions/runs/41296015131/artifacts/13079900526). That test independently passed its 7-subject, 6-living-actor baseline: six shadows, no cast/guard sigils and zero coronas, matching the actual 18-tick public state; one enemy is dead. Action-based caster and guard cases have pure, focused foundation tests, not a separate cinematic comparison.

| Matched real-world sample | Round 55 | Round 56 |
| --- | ---: | ---: |
| Canvas | 1440×832 | 1440×832 |
| Rendered triangles | 105,831 | 103,911 |
| Difference | — | **1,920 fewer** in this single scene |
| Sampled mean luminance /255 | 44.89 | 44.72 |
| Visible heroes / enemies | 3 / 2 | 3 / 2 |
| Textured characters | 7 | 7 |

The new source renders the same characters, camera, floor texture and masonry, without the routine neon halos around hero feet; important environment/portal rings remain. This establishes the intended local clarity change, **not an objectively superior art style, measured GPU speedup, or Diablo IV parity**. Current character models are still anatomically simplified, overlapping and poorly connected to weapons; masonry is still repetitive and tall. Unbiased blind visual judgement and real extended gameplay A/B are absent.

## Architecture, risks, rollback and next step

Only authored cosmetic WebGL scene presentation was changed. There are no edits to authoritative combat, target choice, AI decisions, simulation RNG streams, save/checkpoint versions, replay, hitboxes, pathfinding or economy. Same strict CSP and real snapshot gating remain. The fixed style presets are frozen; actor projection geometry and materials are cleaned by the existing disposal path. Audio, HUD accessibility and livestream moderation behaviour are unchanged.

**Fresh independent critic and ultracode:** not available; the shared worker tunnel did not connect. This is an explicitly limited **self-review**, not an independent expert endorsement. Device GPU p50/p95/p99, memory/frame soak and blinded gameplay comparisons are still unmeasured. Revert the Round 56 code/tests on this draft branch to roll back the rendering policy if it harms visual hierarchy; do not modify main.

**Top blocker:** original properly proportioned, provenance-cleared, higher-detail humanoid and enemy rigs with hand-to-target weapon contact and strong readable attack/recovery staging, then evidence-backed camera/environment contrast and real hardware performance. Until inspected gameplay and independent results demonstrate otherwise, the Diablo IV benchmark and production readiness remain **NOT MET**.
