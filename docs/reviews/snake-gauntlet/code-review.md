# Autonomous Snake 3D — independent code review

Date: 2026-10-30. Reviewer: fresh `snake_code_review` subagent.

Repository: `/workspace/scratch/c732709c31c7/ai-games`.
Branch: `feat/autonomous-snake-3d-gauntlet`.
Base: `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31`.

Scope: `/tmp/snake-review-package.patch` and the live working-tree presentation modules, server changes, and relevant tests. The later `camera.mjs`, camera fitting/fog changes, and board overview were also read. Review followed `AGENTS.md`, the approved 3D Gauntlet spec, and the repository architecture, reliability, HUD, audio, QA, performance, and security guides. No implementation files were edited. No browser, GPU, or server run was started for this review.

## Fix re-review disposition

**All three findings below are fixed and verified by this reviewer. No remaining actionable correctness finding was established in this review scope.** The original findings and failing evidence are retained below for traceability.

- `app.js:66,75–77` now gives `drawFailed` precedence for both scene visibility and failure title/copy, while successful polls continue updating live HUD data.
- `fallback.mjs:39–45` now fills a disk for singleton paths, preserving non-head portal fragments without inventing a connection.
- `renderer.mjs:182–187` now exposes `resetTiming()`, and `app.js:172` invokes it when visibility returns. The reset affects timing measurement only. It leaves genuine slow visible intervals measurable and does not alter the authoritative simulation or upgrade a deliberately selected low tier.

Re-review execution:

```sh
node /tmp/snake-review-probes-after.mjs
node tests/phase3/snake-camera.test.cjs
```

Results: **3/3 regression probes passed; 2/2 camera projection tests passed.** The timing probe uses the new reset API, matching the production visibility-change hook confirmed in source. A further small no-GPU check verified that nine genuine 50 ms visible frame intervals after a reset still select the low tier, with the hidden interval absent from frame-time percentiles. Thus the pause fix does not suppress the intended adaptive-quality behavior.

The new browser regression for unavailable drawing contexts was reviewed in source. Its green browser execution remains with the lead's browser suite; this reviewer did not claim or duplicate that run.

## Findings

### P2 — Successful polling hides the terminal drawing-failure slate — fixed

Location: `public/snake-stream/app.js:62–66`, with the failing transition at `101–106` and the subsequent successful poll at `136–137` in the reviewed revision.

When WebGL cannot initialize and the 2D fallback also cannot obtain a drawing context, `useFallback()` correctly sets `drawFailed = true` and the recovery scene with an explanation. Every later successful `/snapshot` response calls `updateText()`, whose scene selection ignores `drawFailed` and sets the scene to the normal authoritative scene. The draw loop stays disabled because `drawFailed` is still true. The result is a blank game canvas with the recovery explanation hidden; an available snapshot is incorrectly treated as recovery of the renderer.

The lightweight probe forces both drawing paths to fail while one valid normal snapshot arrives. The observed state is:

```json
{"drawFailed":true,"loading":false,"scene":"normal","title":"The game is still growing"}
```

Expected: the terminal drawing-failure scene and its explanation remain visible while HUD values may continue to update. Renderer failure should take precedence over normal/result/intermission text until a renderer is actually available again. The current browser fallback test covers WebGL failure with working Canvas2D, so it does not cover this branch.

### P2 — The 2D safety renderer omits singleton non-head portal fragments — fixed

Location: `public/snake-stream/fallback.mjs:38–45` in the reviewed revision.

`buildMotion()` intentionally splits the body at portal discontinuities. A path with one point reaches the fallback path loop, which issues only `moveTo()` followed by `stroke()`. That path has no segment to stroke. The first path is subsequently covered by the separately drawn head, but a singleton tail or middle fragment is omitted entirely. Thus occupied cells disappear from the safety view while the authoritative length still includes them.

A valid portal movement pattern on a 10×6 board is `[11,10,0] → [44,11,10] → [45,44,11]` through entry 12 / exit 44. For the final view, motion paths are `[45,44]` and `[11]`. The probe records an ordinary segment for the first path and only a `moveTo` for cell 11; no filled shape or drawable segment covers the remaining occupied tail cell.

Expected: explicitly draw a cap/dot for every singleton path, preserving the discontinuity and all occupied fragments. Add a fallback-renderer regression for a singleton non-head path; the pure motion split test cannot catch this drawing omission.

### P2 — Returning from a hidden tab permanently lowers visual quality — fixed

Location: `public/snake-stream/renderer.mjs:104–117`, together with the intentionally skipped draws at `public/snake-stream/app.js:150–154` in the reviewed revision.

The app stops calling `renderer.draw()` while `document.hidden`, but the renderer retains `lastTime`. The next visible draw computes `measuredDelta` from the last visible timestamp and includes the entire hidden interval in the quality average and frame-time statistics. The quality transition is one-way, so a healthy device can remain at the 0.75 pixel-ratio / 1024-shadow tier after merely switching tabs.

A probe executes the actual renderer orchestration with no-GPU scene factories and controlled RAF timestamps. Twelve visible frames at 60 Hz leave quality `balanced`. The next draw after a simulated 60-second interval changes it to `low`, with reported p95/p99 frame time `60016.67 ms`. There was no slow rendering workload in the probe; the absent draws model the app's explicit hidden-tab behavior.

Expected: reset or suspend the measurement origin across intentional visibility pauses, and exclude those pauses from frame-time statistics. Continue counting genuine slow visible frames; simply suppressing all long deltas would hide the actual low-FPS condition the tier is intended to detect. A retained regression should exercise the production visibility/resume hook used by the fix.

## Reproduction evidence

Self-contained probes are in `/tmp/snake-review-probes.mjs`.

The original probe file preserves the pre-fix reproduction flow. `/tmp/snake-review-probes-after.mjs` is the current verification variant; its only necessary timing-flow adaptation invokes `resetTiming()` before the resumed draw, as the app now does on visibility return.

Run from any directory:

```sh
node /tmp/snake-review-probes.mjs
```

At review time all three assertions failed for the named product behavior (3 tests, 0 passed, 3 failed). The probes load the real source, stub browser/platform boundaries, and leave implementation files unchanged. Direct execution is useful in this sandbox because `node --test` child-process output reports only the file-level failure.

The first probe evaluates the real app orchestration with failed renderer factories and a valid fetch. The second imports the real motion/fallback modules and records their Canvas2D commands. The third evaluates the real renderer with Three's normal math/scene classes and a no-GPU renderer; character/world factories are stubs so this is a timing-state test, not a rendering-performance measurement.

## Other review results

- Focused motion and copy checks passed: `node --test tests/phase3/snake-3d-motion.test.cjs tests/phase3/snake-view-copy.test.cjs` (2 test files passed). Those files contain six focused assertions/test cases.
- The later camera checks passed directly: `node tests/phase3/snake-camera.test.cjs` (2 tests passed). The perspective-fit math, follow/detail target placement, safe overview control, and matching 36-degree FOV were reviewed. No additional camera correctness finding was established.
- Presentation transforms allocate new point/path objects and do not mutate snapshots. The server's authoritative stepping, rules, AI, configuration, and snapshot schema are unchanged by the reviewed diff.
- The runtime keeps two snapshots, 240 frame-time samples, fixed-size body/contact buffers, board-capacity entity pools, and a capped transient audio voice set. World replacement and disposal explicitly release geometry/material/texture/instance resources; context-loss listeners and the resize observer are removed. This is source evidence of bounds and cleanup, not a soak result.
- The static shadow map is explicitly regenerated when the low-quality tier disposes its old target; the earlier missing-regeneration defect is not present in the reviewed code. The new GPU regression for that path was read but was not executed by this reviewer.
- New server asset exposure uses explicit module routes, two specific Three.js filenames, and a constrained evidence filename pattern. No newly introduced path traversal, raw HTML injection, external asset fetch, or public secret exposure was found in the reviewed changes. Existing server/operator contracts were not expanded into an unrelated security audit.
- Audio remains optional and default-muted. Its transient voice set, completion cleanup, two persistent ambience oscillators, and context shutdown are bounded. No further reproducible audio defect was established.

## Review limit and disposition

The three original P2 findings are closed after source re-review and focused verification. No additional actionable correctness finding remains from this review. The browser tests and visual screenshots remain the lead's responsibility; this review deliberately did not compete with ongoing captures. No commercial-quality, benchmark-win, realistic GPU-performance, long-soak, or production-readiness claim is made from this code review.
