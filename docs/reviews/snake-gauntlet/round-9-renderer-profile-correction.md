# Round 9 renderer-measurement correction

Source: isolated run 41128720595, checkpoint bf4a523af361986456dfe5334fd1952de381b411. All six diagnostic conditions completed without a reported GL/page error; the production gate still fails at 5.442 FPS, seven submitted real draws, maximum gap 316.7 ms. Twelve of thirteen focused browser tests pass.

The first diagnostic version is retained as raw evidence, **not accepted completion timing**. Independent review found that Chromium Blink implements WebGL `finish()` as a flush. Thus `completedDrawFps`, `finalGpuDrainMs`, and the direct-render completion probes do not establish completed GPU work. The official source retrieved was current Chromium source; the exact bundled Chromium 140.0.7339.16 tag was not retrieved. Zero-duration flushes and outstanding queries in this run are consistent with that limitation.

Primary reference: https://chromium.googlesource.com/chromium/src/third_party/+/master/blink/renderer/modules/webgl/webgl_rendering_context_base.cc

The returned non-disjoint GPU queries remain observations, but coverage is incomplete: full app returns 1/9, minimal full scene 5/12, direct scene 0/8. Both full-scene samples also include an adaptive-quality cache rebake at unchanged DPR 0.4. Their 13.40 versus 19.92 FPS cannot establish isolated compositor cost. Full app changes polling, DOM/layout/paint and compositing together.

The strongest supported direction is to investigate dynamic rendering, since the returned full-scene query intervals are about 26–27 ms while stable cache-copy queries are roughly 3–4 ms. This is not a reliable subtractive attribution or a passing performance claim. Main-thread update/submission wall time is much smaller, around 2 ms in these samples. The next diagnostic locks fixed scale, uses bounded asynchronous fence completion, suspends new draws only while draining outside cadence measurement, and retains timer-query ownership until results resolve or explicitly time out.

WebGL2 specifies asynchronous fence and query-result visibility across event-loop tasks; a single callback need not resolve a query: https://registry.khronos.org/webgl/specs/latest/2.0/

No production renderer or performance gate was changed on this evidence alone.
