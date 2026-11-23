# Snake Gauntlet retry: bounded graphics queue

Base: `5570435860333282fb8815f0bb4c80bdc66c007b`, draft PR 52.

## Diagnosis and scope

Round 10 run 41131060845 recorded 4.655 FPS at the unchanged desktop gate. Its separate live diagnostic changed from 3.992 to 20.865 submitted FPS after a true asynchronous GPU drain, with more than one second of queued work. Those sequential samples motivate a queue-bound experiment; they are not proof of a production speedup.

The renderer now permits at most two outstanding WebGL2 fences. It polls completion with zero wait timeout before resize, uploads or model work and renders the newest available snapshot when capacity returns. It does not retain obsolete frames or block the simulation. Submitted frames, observed completions, skipped callbacks and maximum observed fence latency have separate counters. Observed completion is not a display-present timestamp.

Stalled or failed fences throw into the existing presentation recovery path. Disposal releases live syncs; context loss drops invalid handles. Hidden-tab timing resets do not discard pending work. Browsers without fence APIs retain an explicitly reported unsupported path, not a bounded-queue claim.

The profiler now excludes skipped calls from CPU/GPU sample counts and keeps the last actually submitted snapshot. Completion probes must submit a real frame. Existing scene assets, simulation, camera composition, resolution policy and the 17 FPS / below-250-ms acceptance gate are unchanged.

## Verification before publication

- Recovered renderer and diagnostic source matched original Git blob hashes exactly.
- Red: all 10 new queue tests failed because the gate was absent.
- Red: 2 of 3 new profiler tests failed on skipped-call counting/provenance.
- Green: all 13 focused Node tests passed; both edited files pass `node --check`.
- Test scope: queue bounds, nonblocking polling, completion, timeout, failed/null fences, context loss, idempotent disposal, option validation, skipped-frame accounting and diagnostic-source syntax.
- Local Chromium could not create a WebGL2 context. No local full-game rendering, performance win, independent visual verdict or full-suite pass is claimed. Exact-head GitHub CI is the integration gate.

## Recovery and rollout

The previous workspace was offline, so only verified source bytes were recovered into an isolated scratch directory. This is a continuation on the existing feature branch, not a merge or deployment. Revert this checkpoint to restore prior queue behavior. A successful browser run is still not commercial-quality or production readiness; sustained device/soak and visual review gates remain open.
