# Infinite Tower Climb — Gauntlet 31: a carved Sunken Ruins portal

**Scope:** [draft PR #58](https://github.com/my-edutu/Ai_games/pull/58), exact parent `b2300747266e279dd7f8a2673ee3022a6b4e7fea`. **Review: SELF-REVIEW; independent critic/Ultracode tunnel unavailable** (`NOT_FOUND: Tunnel-client has not been seen for 300 seconds`).

## Actual GPU evidence checked first

The exact-parent [Landing Evidence 41225908032](https://github.com/my-edutu/Ai_games/actions/runs/41225908032) completed SUCCESS; downloaded artifact `13051733778` and personally inspected the actual 960×600 Ruins screenshot plus source SHA in its JSON. The architectural portal fills a large part of the game image, but its repeated rounded cuboids and rectangular dark backing read as a block-model prop rather than carved masonry. The player, intended landing beacon and route are visible. This is held WebGL output, not motion.

Also downloaded exact-parent [Continuous Motion 41225907960](https://github.com/my-edutu/Ai_games/actions/runs/41225907960) guardian artifact `13051357984`: inspected real desktop WebM/contact sheet and 13 authoritative observations with five distinct GPU canvas captures per viewport. Software-GL returned-render-submission interval p95: desktop **1832.8 ms** from 90 samples, portrait **1298.6 ms** from 91 samples. This is not intended-device GPU FPS. Complete transitions and cinematographic parity are open. The exact-head [Autonomous Games CI 41225913315](https://github.com/my-edutu/Ai_games/actions/runs/41225913315) ended FAILURE, specifically three **Tiny Kingdom** browser tests (G057/G058/G063), not a Tower test; Tower dedicated Landing, Motion, Realism and Guardian workflows completed SUCCESS. Do not claim broad CI passed.

## ONE independently judgeable environment failure

The oversized Ruins portal is built from 9 rotated bevelled boxes plus rectangular jambs in one flat edge material, without a genuinely arched inner opening. This is a high-salience departure from the official [Jusant](https://dont-nod.com/en/games/jusant/) scale/material quality bar. Leave the ASTRO BOT Rising Heat action/readability bar unchanged. The improvement must be an original structure, not copied content.

**Implementation:** `world.mjs` now defines a reusable extruded curved and tapered voussoir with thin radial mortar gaps; 11 stone wedges form a proper semicircular arch and keystone. The back aperture follows the inner curve instead of a rectangular void. Ten irregular pier stones replace uniform block jambs. Only the portal uses the existing original weathered-stone triplanar material, scoped to a separate PBR material, and the floor's existing rigid batching keeps the material submission bounded. Architectural geometry stays behind the traversal corridor. No authority/collision/physics/AI/RNG/replay, user controls, paid influence, provider access or background timers changed.

## TDD and verification

**RED before change:** the new actual-Three geometry/integration test failed because the curved voussoir constructor did not exist. **GREEN after change:** focused real world geometry tests **9/9 PASS**, full Tower Phase 3 tests **114/114 PASS**, `npm run build` PASS, and `node scripts/serve-tower-stream.cjs --self-test` returned `ok:true` including authority, privacy, recovery, replay and restart. The new test measures curved wedge geometry, eleven stones and one textured rigid material batch, verifies the world submission bound and proves the count resets on biome change. Existing all-biome corridor, platform contact, hazard, resource-disposal and texture-fallback tests pass.

**Browser blocker:** Local Playwright first lacked its pinned headless executable. Retrying with installed `/usr/bin/chromium` loaded the server but `page.goto('/tower')` failed `ERR_BLOCKED_BY_ADMINISTRATOR`. **No new-source GPU screenshot, reference preference, motion, sustained FPS or accessibility PASS is claimed yet.** GitHub source-matched Tower Landing/Realism CI must publish actual image evidence for the new commit.

## SELF-REVIEW, risks, rollback and next gate

**Specification:** The shape is pure presentation, built behind the 23.4-unit protected corridor, with no change to platform/hazard collision extents, camera intent or deterministic game results. Stone is original project-owned source and geometry is authored here.

**Quality:** More physically coherent silhouette, inner opening and carved stone faceting should improve a large visible landmark. Actual light response, material readability, shadow behavior and the extra arch triangles need independent new-head image and performance review. A taller/darker arch may accidentally compete with the landing target; reject or adjust on source-matched side-by-side if so.

**Rollback:** Revert the source/test/ledger/review commit as one cohesive unit. **Automatic next priority:** Inspect exact new-head Ruins 960×600 and portrait GPU captures against `b230074` same-tick images and review reflected light, clipping, landing/hero legibility and draw counts; then address complete-contact climbing animation and hard measured device performance. The overall Jusant/ASTRO BOT independent visual comparison, whole-game motion, accessible UI, production frame consistency and soak remain FAIL/OPEN. **Gauntlet 90 NOT ACHIEVED.** No merge, force-push or deployment.
