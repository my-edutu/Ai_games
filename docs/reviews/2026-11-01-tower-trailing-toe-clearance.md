# Infinite Tower Climb — Gauntlet 49: unloaded boot must clear genuine upper-deck stone

Date: 2026-11-01. Parent HEAD: \`b257f3e69c21ee34a5e6524c46d382ef8be59162\`. Draft PR #58. **Self-review only:** worker/critic/Ultracode tunnel was unavailable; no independent assessment is claimed.

## Before editing: real source-bound GPU, not a synthetic screenshot

Exact parent [Tower Ledge CI 41294596912](https://github.com/my-edutu/Ai_games/actions/runs/41294596912) finished SUCCESS. Downloaded artifact **13078733552**, verified \`source-sha.txt\` matches \`b257f3e\`, and inspected 32 actual WebGL PNGs (16 source-ordered ticks × desktop 960×600 and portrait 390×844), compared with 32 original G47 PNGs from artifact **13077420692**. Tick300 changed 1,114 desktop and 1,816 portrait pixels (>8 maximum-channel RGB); tick301 changed 2,533 and 5,952. The held screenshots show an authentic deck crossing but do not establish true toe collision, complete animation or FPS.

The actual shipped Three rig, replayed at the authentic t300 lead-load state against the real Y6 top, revealed a more specific error: the *unloaded* boot pitches through opaque walking stone. Its heel/middle/toe sample Y coordinates before the change are **6.21326348 / 6.03703444 / 5.86080540**, meaning the trailing toe is **13.92cm below** the physical surface while the loaded leading sole is [6,6,6]. This is a 3D rig fixture measurement, not GPU-image depth telemetry.

## Red → green implementation

Added a focused original-rig regression in \`tests/phase3/tower-ledge-geometry-contact.test.cjs\` for both opposite camera views, three actual boot sole points, the loaded leading foot, and a mismatched-platform exclusion. It failed on the unmodified source **0/1** with the toe at Y5.8608054. Corrected \`characters.mjs\` to level only the unloaded foot whose toe is both inside the actual deck walking ring and below the slab, and only inside the existing genuine platform/run/tick and lead-sole contact window. The lead boot, root, scene transform, authority, hitboxes, physics, AI, RNG, replay, GPU allocations and draw-call count stay unchanged.

The new exact real-rig regression passes **1/1**. At both camera angles, the loaded boot heel/middle/toe remains [6,6,6] while the unloaded boot rises to **Y6.02259646** across all three points, retaining a one-foot weight-bearing distinction. Wrong-deck presentation remains unchanged. Related ledge tests **24/24 PASS**, Tower phase-3 logical **153/153 PASS**, \`npm run build\` PASS, and Tower stream-host self-test \`ok:true\`, final tick600 checksum \`7725eefc\` with authority/privacy/recovery/restart PASS.

**GPU still PENDING for this new source** until exact-commit CI finishes, its downloadable artifact marker is verified and the actual images are inspected. The parent G48 WebGL pass does **not** transfer to this change. Source-only scoped correctness PASS; overall Gauntlet **FAIL/OPEN**. Official [Jusant](https://dont-nod.com/en/games/jusant/) and ASTRO BOT Rising Heat visual standards remain mandatory. Full normal-speed action, independently judged reference comparison, accessibility, intended-device sustained FPS and soak remain unverified. No merge/force-push/deployment.

**Automatically suggested next priority:** inspect new exact-source t299–301 desktop/portrait screenshots for the trailing boot and any newly exposed clipping, then prove continuous hand→foot→push-off motion at actual speed before awarding a motion quality gate.
