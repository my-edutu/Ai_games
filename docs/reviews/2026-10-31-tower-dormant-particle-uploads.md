# Infinite Tower Climb — Gauntlet 24: dormant particle uploads

**Review classification: SELF-REVIEW.** The coding-agent / fresh-context critic tunnel was unavailable (`Tunnel-client has not been seen for 300 seconds`). Independent comparison against official Jusant or ASTRO BOT Rising Heat has **not** occurred.

## One evidenced inefficiency

On PR head `ec2bad14868043e3e875cfde830522d7e2273e70`, the fixed-size 96-particle point system flagged all three `BufferAttribute.needsUpdate` values every render, whether any particle existed or not. `burst()` deliberately suppresses particles for Low quality and reduced motion. Since Three increments buffer versions on every `needsUpdate=true`, these dormant frames requested recurring unchanged position/color/size buffer uploads. This is a relevant waste, not a claim that it explains all of CI software-GL delays.

The change checks prior life **or prior size** before updating a particle and marks attributes dirty only if those data changed. Prior size catches run resets where `clearActors()` clears life while sizes still need a final zero upload. Active high-quality damage bursts retain their updates, velocity, lifespan, coloring and original shaders. No graphics-quality setting, visual asset, physics, seeded simulation, privacy, replay or collision behaviour was altered.

## Evidence and validation

Before editing, downloaded and visually inspected actual WebGL screenshots and WebM filmstrips in [Tower Continuous Motion 41199583023](https://github.com/my-edutu/Ai_games/actions/runs/41199583023), [guardian artifact 13041459952](https://github.com/my-edutu/Ai_games/actions/runs/41199583023/artifacts/13041459952), source `e2e01efa`. These show actual gameplay, but are neither an exact current-head performance benchmark nor evidence of this change.

Extracted source-pinned [Tower Realism review inputs 13041454331](https://github.com/my-edutu/Ai_games/actions/runs/41199583003/artifacts/13041454331) with locked dependencies; the particle loop matches the current head and the newer impact allocation was mirrored in the local fixture. A new real Three `BufferAttribute.version` regression failed on the old loop: after two idle reduced/Low submissions, versions advanced **[2,2,2] → [4,4,4]** despite no active particle. After the correction, idle versions stayed fixed. Switching to High/non-reduced and accepting an actual same-run player health loss still incremented versions and visibly-sized particles, then stopped updating once life/size reached zero.

**Local:** focused 1/1 PASS; affected lifecycle, lighting and animation tests 25/25 PASS; `npm run build` PASS; `node scripts/serve-tower-stream.cjs --self-test` PASS (`ok:true`). This is a locally replayed source-bound subset, not a claim of a complete exact-head suite. `ec2bad` Autonomous Games CI 41202919128 was in progress at the pre-edit check. New exact-head CI and actual GPU comparisons are not counted PASS until completed and inspected.

## Gate and follow-up

**Scoped redundant buffer update PASS; overall Gauntlet NOT ACHIEVED.** No sustained hardware FPS, measured memory slope, independent environment/climbing comparison, attack anticipation/contact/recovery review, accessibility or full soak is proven. Next check exact new-commit CI and real GPU impact artifacts before any new visual claim. No merge, force-push or deployment; PR #58 stays draft.

## Post-commit exact-source GPU and CI checkpoint

[Combat Impact Evidence 41204654198](https://github.com/my-edutu/Ai_games/actions/runs/41204654198) completed **SUCCESS** at source `9f00b66`. Downloaded its [artifact 13044256868](https://github.com/my-edutu/Ai_games/actions/runs/41204654198/artifacts/13044256868) and inspected all four original desktop (960×600) and portrait (390×844) WebGL PNGs, not just diagnostics. JSON establishes an authentic consecutive authoritative tick **268→269**, guardian health **8→7**, `observedEnemyImpacts=1` and no reported page errors in each view. The focused GitHub test and build steps passed.

**Important new visual failure:** in both portrait screenshots the guardian itself is outside the 390px canvas, despite the Guardian HUD and combat contact telemetry. A ring-like cue is partly clipped along the left edge; the capture cannot prove the guardian hit is readable. Desktop includes the guardian below and left of the climber. Therefore capture integrity **PASS**, portrait encounter/contact readability **FAIL/open**. Treating the successful workflow as a portrait visual-quality pass would be incorrect. The particle-buffer cleanup itself is non-visual; screenshots do not prove reduced memory traffic, hardware FPS or full-speed animation.

**Automatically selected next priority:** camera-to-guardian/contact visibility on portrait at source-matched damage tick, with a failing regression and actual GPU before/after inspection, preserving the guardian's authoritative position and the Jusant/ASTRO BOT quality bars. Independent critic, full-speed combat recovery, accessibility, intended-device presented frame times and soak remain open.
