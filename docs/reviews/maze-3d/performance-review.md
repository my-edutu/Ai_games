# AI Maze Escape 3D — focused performance diagnosis

Date: 2026-10-30 UTC
Scope: Diagnose the desktop browser test's approximately 53-second frame wait without changing product code or increasing its timeout.
Status: Dominant execution boundary identified; a small browser-launch candidate is identified and its graphics configuration verified. Actual-maze performance with the combined candidate flags remains for the next planned capture/check.

## Finding

**The measured bottleneck is native software graphics and the browser's software compositor/readback boundary, strongly amplified by shared-host CPU contention. It is not the JavaScript scene/world rebuild.** First-use shader work is a secondary startup cost. Screenshot tracing is not required to trigger the readback stalls.

The default Playwright headless browser reports a SwiftShader WebGL device but `gpu_compositing: disabled_software` and `rasterization: disabled_software`. During an actual maze run with Playwright screenshot tracing disabled, Chromium emitted repeated `GPU stall due to ReadPixels` warnings while application GL instrumentation recorded **no `readPixels` calls**. The heavy time is therefore outside the application’s explicit draw/update code. The measured CPU profile and long-task timings corroborate this location.

The smallest promising correction is to enable Chromium's compositor while retaining the same software GL device:

```js
args: [
  '--no-sandbox',                  // retain where the current environment needs it
  '--enable-unsafe-swiftshader',   // existing software-WebGL setting
  '--enable-gpu',
  '--use-angle=swiftshader',
]
```

A bounded browser-info probe confirmed that the **combined** added flags switch compositor and rasterization to `enabled`, while the reported device remains ANGLE/SwiftShader. `--use-angle=swiftshader` alone did not establish a successful maze startup in its bounded probe. No product source or launch configuration was edited during this review, and no FPS improvement is claimed from a feature-status check.

## Evidence from the actual failure

Source: `test-results/maze-3d-the-autonomous-maz-8cdf7-world-from-public-knowledge/trace.zip`.

- The `frames > 2` wait begins at trace time **13,277.908 ms** and completes at **66,013.425 ms**: **52,735.517 ms**. The following public-tick assertion consumes the already-exhausted 60-second test budget. The final assertion is the failure location, not the primary delay.
- The two completed state payloads are real public snapshots: **tick 10 / 23 known cells** and **tick 25 / 77 known cells**, both normal scenes with no disclosed threat.
- State requests themselves complete in approximately **27.5 ms** and **13.0 ms**. The next state request is not initiated for approximately **51.6 seconds**. The source service is not taking 50 seconds to return JSON; the browser stops progressing its polling loop.
- Chromium reports `GPU stall due to ReadPixels` repeatedly around the early rendered frames.
- Screencast frame gaps include **28.25 seconds** and **21.91 seconds**. This is a frame-production/completion stall, not merely slow network readiness.

The original trace does not contain a native CPU/GPU timeline, so its exact native function cannot be proven retrospectively. Attribution to the same graphics boundary is an inference supported by the trace warnings and the instrumented current-code probes below.

## Instrumented current-code measurements

All actual-maze probes use the running service on port 4185, one owned Chromium at a time, and `--enable-unsafe-swiftshader`. Instrumentation is injected into responses in the owned browser; product files are unchanged. It times `scene.update`, `world.update`, route updates, `scene.render`, `renderer.render`, selected GL calls, animation-frame intervals, long tasks, and CDP CPU metrics. Public render diagnostics remain the actual app's diagnostics. No hidden state is injected into the scene.

### Desktop live probe, tracing disabled

Viewport: **1440 × 900**. Actual canvas buffer: **923 × 608**. Device: ANGLE Vulkan SwiftShader. Quality: **balanced**. Observed world: **21 known cells**, **1,203 instances**, **18 terrain batches**, up to **45,678 triangles**, **149 draws**, and two characters.

| Measurement | Observed result | Interpretation |
| --- | ---: | --- |
| `world.update` maximum | 63.5 ms | Bounded rebuild cost, far below the 53-second symptom |
| `scene.update` maximum | 65.6 ms | Motion/props/routes do not dominate |
| All 5 `scene.update` calls | 134.5 ms total | Not a continuous CPU loop |
| First `renderer.render` | 1,265.4 ms | Noticeable first-use shader/GL work |
| Later `renderer.render` calls | 3.4–25.2 ms | JavaScript draw submission is relatively short |
| All 17 `scene.render` calls | 1,490.8 ms total | Does not explain elapsed frame time |
| App frame interval p50 | 966.6 ms | Actual output is far slower than render submission |
| App frame interval p95 | 4,883.1 ms | Startup and native stalls have large tails |
| CDP `ScriptDuration` | 1.595 s | Small fraction of browser task time |
| CDP `TaskDuration` | 19.142 s | Most elapsed task time is outside JavaScript execution |
| CPU-profile native `(program)` | 16.583 s of 20.117 s | Approximately 82% of profiled elapsed samples |
| CPU-profile shader `onFirstUse` | 0.987 s | Real secondary startup cost |

These are elapsed-time samples, not hardware CPU-cycle or GPU timer measurements. Native `(program)` time can include graphics synchronization and host scheduling delay; it does not identify a specific C++ function or prove that every millisecond is active raster computation.

Long tasks repeatedly run approximately 0.6–2.2 seconds after the corresponding JavaScript `scene.render` calls have returned. The first such task lasts 4.19 seconds despite the scene render itself taking 1.29 seconds. This is consistent with native graphics work at the animation-frame/compositing boundary.

Repeated ReadPixels driver warnings occur in this run **without Playwright screenshots or trace recording**. The GL wrapper sees no application `readPixels` call. Turning off trace screenshots alone therefore cannot be claimed to fix the underlying problem.

### Failed-payload reproduction and smaller viewport

A desktop trace-enabled replay using the failure's two public payloads failed to reach the first reported rendered frame before its approximately 30-second hard deadline. This first replay advanced to the 77-cell payload before scene initialization finished; it is not a controlled timing match to the original failure. It is evidence of severe startup sensitivity, not a valid trace-on/trace-off benchmark.

A second replay held the 23-cell first payload for at least five seconds and used **640 × 480** with tracing off. It measured:

- first world update **202.3 ms**;
- first scene update **204.8 ms**;
- first renderer call **4,507.3 ms**;
- first whole scene render **5,660.1 ms**;
- approximately **10.6 seconds** after that render returned before the next one-second diagnostic timer could execute;
- second renderer call **92.3 ms**, second whole scene render **114.8 ms**;
- CPU profile: approximately **14.50 seconds native `(program)`**, versus **3.40 seconds in instrumented GL query calls**.

The full diagnostic collection did not finish before the bounded deadline. The streamed timings and CPU profile are retained. This probe does not support a clean resolution comparison because host load worsened dramatically between runs. It does establish that a scene update of about 205 ms is followed by a much larger delay outside that update.

A detailed native timeline was also attempted with a bounded deadline. It could not finish flushing under this load, so no native-function-level conclusion is claimed from that attempt.

## Shared-host capacity is a material confounder

The cgroup has an **8-CPU quota** (`cpu.max = 800000 100000`). Observed load rose from **16.90** to approximately **66.7–67.9**, with dozens of runnable tasks. Between two sampled cgroup counters, **1,427 of 1,470 quota periods were throttled** (approximately 97%). CPU use over those periods is close to the full quota.

Process inspection found concurrent compile/full-test trees belonging to other catalogue workspaces and, for part of the investigation, another SwiftShader browser. The maze root had correctly paused its own browser/heavy tests. No unrelated process was modified or terminated.

This makes the absolute frame numbers unsuitable as a production-hardware benchmark and prevents a trustworthy resolution or screenshot-overhead A/B. It is a strong explanation for amplification in these current probes. There is no historical host-load sample for the original failed trace, so the degree of contention in that older run remains unknown.

## Browser configuration check and candidate

Two fresh browser-info probes used CDP `SystemInfo.getInfo`.

| Graphics property | Existing launch flags | Add `--enable-gpu --use-angle=swiftshader` |
| --- | --- | --- |
| Reported device | ANGLE / SwiftShader | ANGLE / SwiftShader |
| `gpu_compositing` | `disabled_software` | `enabled` |
| `rasterization` | `disabled_software` | `enabled` |
| `2d_canvas` | `unavailable_software` | `enabled` |
| `opengl` | `disabled_off` | `enabled_on` |

“Enabled” here means Chromium uses its GPU graphics/compositor path with a **software SwiftShader device**. It does not mean a physical GPU is available, and it does not justify a hardware frame-rate claim.

The paired flags target the measured boundary while preserving game rendering, balanced-quality selection, public state, geometry, and authoritative rules. They should first be used for the next already-planned actual-maze capture/check. The browser-info probe alone is insufficient to mark the performance problem fixed.

## Confidence and disposition

| Candidate cause | Confidence | Evidence/disposition |
| --- | --- | --- |
| Scene/world JavaScript rebuild is the dominant stall | **Ruled out in measured probes** | 64–205 ms update versus multi-second native delays |
| Slow state service/network | **Ruled out for original completed requests** | 13–28 ms state responses, followed by a long gap before the next request |
| First-use shaders contribute startup cost | **High** | 0.99 s profile contribution / 1.27 s first renderer call; larger under heavier contention |
| First-use shaders alone explain the entire 53 seconds | **Not supported** | Most time remains outside JavaScript/GL submission, including later frames |
| Screenshot tracing is necessary for the stalls | **Ruled out** | ReadPixels stalls also occur with tracing off |
| Native graphics/compositor/readback boundary is dominant | **High for current probes; moderate-to-high for original trace** | Native CPU samples, long-task gaps, no app readPixels calls, driver warnings, software compositor status |
| Shared CPU contention materially amplifies current probes | **High** | 8-CPU quota, load ~67, 97% of sampled periods throttled |
| Combined compositor flags improve actual maze performance | **Unverified** | Correct feature-status change is verified; actual maze run with both flags remains outstanding |

## Smallest next action and verification

1. Use the paired compositor flags for the next planned actual desktop capture and focused browser check. Keep the **same 60-second test budget**, viewport, production scene, quality auto-selection, public-knowledge assertions, and recovery expectations.
2. Confirm the actual scene still reports **balanced** on SwiftShader, draws real geometry/characters, updates public ticks, and passes its public-cell truth boundary. Record `frames`, time to the third frame, frame p50/p95, console warnings, and CPU/load context. Prefer a live-state test plus the retained original public payloads so failure diagnosis is reproducible.
3. If that run demonstrates improvement, apply the same small launch-argument change consistently to `playwright.maze-3d.config.cjs`, `scripts/capture-maze-3d.cjs`, and `scripts/capture-maze-motion.cjs`. Continue to label captures as software-rendered evidence. Do not change source freshness, result copy, or readiness state merely to satisfy a wait.
4. If it does not improve, leave the performance gate open and perform the same check when concurrent full-suite workloads have finished or on an appropriate hardware reference. Bound full Node-test concurrency to the actual CPU quota when scheduling future shared-host runs. A larger timeout is not a performance fix.

Do not rewrite terrain batching, reduce disclosed geometry, replace the real scene with a test stub, alter authoritative tick semantics, or report a passing performance gate based on the present evidence. `compileAsync` could address the smaller first-shader spike later, but it is not supported as a sufficient fix for the dominant observed stall.

## Retained artifacts and cleanup

The `performance-probes/` directory beside this report contains:

- full live desktop diagnostics and CPU profile;
- bounded replay logs and the smaller replay CPU profile;
- default and candidate CDP graphics-info output;
- host-load counter observations;
- the diagnostic probe scripts and current relevant source SHA-256 hashes.

The default browser-info and paired-flag browser-info probes both closed normally. All rendering probe browsers were closed in `finally`/bounded cleanup; an ownership check found no remaining owned `fixed23` probe process. The browser slot was released to the root before this report was finalized. No product code was changed, no timeout was increased, and no unrelated process was killed.
