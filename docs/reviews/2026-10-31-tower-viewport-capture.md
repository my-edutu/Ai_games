# Infinite Tower Climb Gauntlet 26 — truthful 1920x1080 broadcast capture

Scope: draft PR #58, source baseline 01be15d6553f4de032e76239aa6ab3c0f5f19a2e. Explicit SELF-REVIEW: the connected coding-agent/independent-critic tunnel was disconnected and Ultracode was unavailable.

## Real evidence inspected before the edit
Read AGENTS.md, the Tower GAUNTLET, chronological progress, the latest guardian-contact review, submitted reviews (none) and completed workflow jobs. Downloaded source-bound Tower Continuous Motion artifact 13044696537 from SUCCESS run 41206502692, inspected its real portrait/desktop WebM recordings and GPU frames; also opened genuine Tower Combat Impact portrait artifact 13044830595 from 41206502691. These prove only captured WebGL pixels and real advancing snapshots, not smooth hardware FPS or independently accepted combat motion.

Two successive Autonomous Games CI runs, 41206505773 at 4d057d5f and 41207141034 at 01be15d6553f4de032e76239aa6ab3c0f5f19a2e, completed FAILURE. In each, 38/39 browser tests passed, and tests/browser/tower-stream.spec.cjs timed out after 60 seconds waiting for a 1920x1080 fullPage desktop PNG at line 35, after layout/privacy and animated-tick assertions had passed. GitHub log specifies page.screenshot timeout after fonts loaded, not an assertion failure. This is a repeated test evidence failure; the running game and hardware performance are NOT thereby proven good.

## One scoped source correction
The one-screen Tower root is width/height 100% with overflow hidden. The desktop broadcast test now captures its exact visible CSS-pixel viewport, not fullPage scroll extent. A shared Tower helper rejects any vertical or horizontal document overflow, validates the returned PNG signature and exact 1920x1080 dimensions, and propagates screenshot failures. This preserves the actual rendered scene, HUD, browser viewport, animation/privacy assertions and high-quality desktop settings. It does NOT skip the GPU screenshot, disable WebGL or relax the test timeout. Other screenshots and games are unaffected.

## Red/green and honest gates
RED: the new phase-3 helper tests failed on missing implementation. Stronger mutation RED: restoring fullPage=true made the 1920x1080 test fail 1/3 specifically on the wrong screenshot options. GREEN: restored viewport capture 3/3, related Tower phase-3 suite 102/102, npm run build PASS, Tower host --self-test ok:true with stable authority/replay/privacy/recovery/restart. All tests executed against extracted Tower Realism review input artifact 13044715841 pinned to 4d057d5f; source files at current PR head are identical across the two later documentation-only commits. The mutation was restored before commit.

Browser navigation in this local container returned net::ERR_BLOCKED_BY_ADMINISTRATOR. No new-source GPU screenshot or post-push CI PASS is claimed here. Whether viewport-only capture resolves the SwiftShader stall is an UNVERIFIED hypothesis; if remote CI fails, preserve the failure and profile renderer readback instead of hiding it. Independent code critic unavailable, so both specification and quality passes are SELF-REVIEW, not independent approval.

Scoped CPU contract / unchanged authority: PASS. Exact-head 1920x1080 GPU capture and complete CI: PENDING. Commercial Jusant/ASTRO BOT winner, full-speed guardian anticipation/contact/recovery, accessibility, intended-device presented FPS and soak: OPEN/FAIL. Overall Gauntlet NOT ACHIEVED. PR remains draft, no merge/deploy/force-push.

Next suggested priority: inspect exact-head Autonomous Games CI and desktop.png artifact; if it still stalls, profile/readback the 1920x1080 software WebGL surface without reducing the visual quality gate. Then return to independent full-speed guardian-combat motion and intended-device performance.
