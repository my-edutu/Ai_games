# P0 — offscreen GPU program preparation for the authentic first Floor9 crossing (2026-11-13)

**P0 OPEN · leading assessor: NOT EVALUATED.** Draft PR #68, frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` unchanged. Parent source reviewed: `0cffc907d011d19382217fbf6f54ab832319263a`.

## Direct original-film evidence

The [immutable source-pinned 9-job capture](https://github.com/my-edutu/Ai_games/actions/runs/43428237425) provided two genuine unedited 60s+ recordings. In portrait normal-speed video, around 24.75s the real hero descends beside the bronze cap; at ~25.00s the picture jumps to a violet beam and different camera orientation with the hero already on the new deck. Desktop likewise replaces the bronze world with violet at ~24–26s. Both viewports **fail** continuous same-door body crossing (strict native pairing 0/2).

The desktop FIRST episode accepts Floor9 at source tick451, renders next at tick459; its original scene update is **100.7ms**, CPU world rebuild **88.8ms**, real WebGL return **463.3ms**, total **564ms**. Its SECOND same-session crossing gets **79.5ms** WebGL return. Portrait first tick452→457, WebGL return **100.2ms**, second **67.2ms**. These figures identify a real first-use render bottleneck, but do **not** isolate shader compilation from geometry upload, driver synchronization or camera occlusion.

## Production change, falsifiable hypothesis

A single bounded offscreen `renderer.compileAsync()` operation prepares four ordinary Void-world `MeshStandardMaterial` features on static and instanced geometry after a TRUE returned living Clockwork Floor8 frame. It never displays or manufactures a Floor9 state. Program-owning material references are retained through the first genuinely returned same-run Floor9 frame, then released, with restart, context-loss, disposal and failed-compile cleanup. If no `compileAsync` support it fails closed without changing gameplay. Status reports compilation, source ownership, resource count and errors, explicitly **not** a quality score. This is a performance *candidate*; effect on actual GPU frame-time or video is NOT EVALUATED.

Three independent local Node v22 focused tests passed against the helper (async lifecycle, fail-open error, source restart). An integration source-wiring test was added. No full exact-head CI, first-F9 improved render time, native clip or supported real-device p50/p95/p99 was observed on this commit.

## Hard next gate

First finish the source-pinned [already admitted current capture](https://github.com/my-edutu/Ai_games/actions/runs/43437667025) on its own immutable source; its new first-episode `physical-doorway-submissions.json` will show whether the original gate is present, projected inside camera or obstructed. Subsequently capture this specific candidate SHA under matched seed/tier/viewport on runner capacity and compare first vs subsequent Floor9 WebGL return **and** unmodified native films. Reject the prewarm if frame stalls merely move earlier, memory worsens or both viewports still hard cut. No manufactured reviewers: LOOKS 0/5, FEELS 0/5, PLAYS 0/5; hardware NOT EVALUATED. No PR58 rewrite, unrelated games, deployment, merge or force-push.
