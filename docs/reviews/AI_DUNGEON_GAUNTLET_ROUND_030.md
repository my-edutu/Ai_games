# AI Dungeon — Gauntlet Round 030: visible attack contact, less duplicate combat glare

**Date:** 2026-10-31 · **PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49), draft and unmerged · **exact verified code commit:** [`57fdc4122dc56f3db6b353073015169a810bb8bb`](https://github.com/my-edutu/Ai_games/commit/57fdc4122dc56f3db6b353073015169a810bb8bb).

**Verdict:** This round is a bounded presentation-only functionality/legibility increment. The visual Gauntlet bar of authentic *Diablo IV* dungeon gameplay, supplemented by *No Rest for the Wicked* composition and *Path of Exile 2* combat, is **NOT MET**. This PR is **NOT** production ready.

## Proven gap, observed in actual running game

The prior browser screenshots and Round 29 review show excessive overlapping ground circles around the Warden and tiny, chunky character meshes. Code inspection proved that the real Three.js combat director launched cosmetic projectiles on the **first snapshot identifying an attack/cast** even while the authored animation planner was still staging anticipation (0–0.12 s) and forward movement (0.12–0.28 s). Projectile impact and routine hurt each generated additional luminous floor rings. The **authoritative boss warning circle** is separately controlled in `public/ai-dungeon/app.js` and must remain intact.

The two independently judgeable changes were (1) release attack/cast cosmetics only after a finite rendered-frame wind-up tied to real `actionTick` transitions, and (2) replace ordinary duplicate ring effects with short, bounded body-height hit flashes. The change does not try to create high-detail character models or retarget skeletal animations.

## Test-first implementation

1. **RED before code.** [Test-first CI run 41208119231](https://github.com/my-edutu/Ai_games/actions/runs/41208119231), authority job, recorded **5/63 failing** newly enrolled Dungeon contracts: missing pure combat-beat module, missing deferred cue code/compact-contact behavior, and missing same-origin module route. No production code was changed before the tests were authored and enrolled. The browser test was also extended to use a true `DungeonRuntime` seeded campaign attack, never a fabricated damage event.
2. **Pure finite plan:** `public/ai-dungeon/combat-cue-plan.js` provides immutable per-archetype attack/cast release ages, all in the **0.21–0.33 rendered-frame-second** range, with zero delay for reduced-motion and noncombat actions; pending queue cap **24**.
3. **Live Three.js combat director:** `public/ai-dungeon/combat-director.js` now enqueues only real normalized read-only actor/target data on authoritative `actionTick` transitions, advances each pending cue using existing `advancePresentationActionAge` capped at 0.05 s/frame, releases it after the visible wind-up, and flushes the queue across floor/run reset. Nonterminal ordinary hurts/projectile arrivals use short mesh-based body flashes rather than new big ground rings. Existing authoritative Warden floor telegraph, guard cue, melee slash, game balance, AI, tile movement, RNG and save/replay schema are untouched. All effects and materials remain bounded and disposable; no new art assets or third-party licensing.
4. **Same-origin strict CSP:** `scripts/serve-dungeon-stream.cjs` serves the cue plan at `/dungeon/combat-cue-plan.js`; this adds no third-party requests.
5. **Real browser assertion:** the existing authentic seed `visual-room-art-18` Chromium/WebGL authored-motion test now verifies actual `releasedCues > 0`, `pendingCues <= 24`, zero dropped cues in its one observed encounter, bounded hit flashes and absent browser page errors. It captures a genuine WebGL frame and test video.

## Exact-code evidence

| Gate | Observed | Link |
| --- | --- | --- |
| Focused Dungeon | **63/63 passed** (5 new clarity tests) | [Dungeon run 41208356669](https://github.com/my-edutu/Ai_games/actions/runs/41208356669), authority |
| Separate Dungeon presentation/interface | **17/17 passed** | Same authority job |
| Repository software suite | **585/585 passed** | [Integrated CI 41208356675](https://github.com/my-edutu/Ai_games/actions/runs/41208356675) |
| Shared catalogue Playwright | **15/15 passed** | Same integrated CI |
| Dedicated genuine Chromium/software WebGL | **48/48 passed** (3 shards, 16 each) | [Dedicated browser 41208356669](https://github.com/my-edutu/Ai_games/actions/runs/41208356669) |
| Headless replay | **24 seeds × 900 ticks**, zero replay mismatches, highest Floor **9**, 401 advances, 89 restarts | Same dedicated authority job |
| Reproducible separate screenshot workspace | **Passed** | [Visual run 41208356729](https://github.com/my-edutu/Ai_games/actions/runs/41208356729) |

**Real screenshot and video manually inspected:** [dedicated Chromium shard-1 archive](https://github.com/my-edutu/Ai_games/actions/runs/41208356669/artifacts/13044759599) includes `artifacts/dungeon-combat-clarity-round30-world-only.png` and the full recorded `dungeon-authored-motion-*/video.webm` (**21.56 s**). The unchanged Warden encounter scene was also compared side-by-side with actual [Round 29 Warden captures](https://github.com/my-edutu/Ai_games/actions/runs/41206739033/artifacts/13044632232) and [Round 30 Warden captures](https://github.com/my-edutu/Ai_games/actions/runs/41208356669/artifacts/13045217074) of the same seed/authority tick; image motion/effects vary, and that static frame is **not** an attack contact comparison. These real images show remaining oversized floor glows, very dark regions, repetitive rectangular masonry, and low-detail models. There is **no controlled quantitative improvement estimate** or blind visual preference claim.

## Specification and harsh engineering/artistic review

- **Authority and replay:** no simulation/AI/RNG/persistence code changed; the 24×900 deterministic campaign matches prior verified totals. All new code lives on the presentation side.
- **Memory/performance:** queues capped at 24; existing projectile/impact caps 26/24 and lifetimes remain. Reuses existing Three.js geometries. No new render passes, dynamic lights, remote asset loads, or active physics. p95 GPU frame time and long soak are **NOT measured**, so no performance win claim.
- **Accessibility/stream:** reduced-motion causes immediate combat cue release rather than hiding semantic feedback. The actual small screen/gameplay and broadcast audits remain limited to existing tests; no independent new small-phone visual rating.
- **Harsh visual judgment:** the new timed cue is behaviorally validated but the 21.56s observed game remains toy-like, dark, full of block walls, giant circular floor effects, and low-resolution motion. The original meshes and combat rigs, authentic aligned sword/bow/staff hits, local material contrast and source art direction remain **P1** blockers. Tiny flashes alone do not solve contact/comprehension.
- **Reviewer independence:** external worker tunnel unavailable, so **no independent builder/critic agents, ultracode, blind matched A/B or third-party art preference review**. This is the implementation author's own critical inspection, not an independent rating.
- **Security/licensing:** existing pinned CC0 GLB provenance remains; no new downloaded/copyrighted game assets, no CSP weakening, no external calls.
- **Rollback:** revert Round 30 code/test commits on the PR branch. No authoritative state or schema migration.

**Next highest-priority blocker:** original high-detail anatomically plausible rigged hero/enemy models and real action-synchronized hand-grip, strike, cast and recoil animation. Follow with convincing eroded architectural geometry, high-frequency stone material breakup and localized lighting, then multi-seed fixed-state real-WebGL/mobile performance measurements and external blinded gameplay review. Keep draft PR #49 unmerged.
