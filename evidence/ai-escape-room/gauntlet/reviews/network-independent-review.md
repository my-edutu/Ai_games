# Independent review: state polling deadline

Date: 2026-10-30. Reviewer: `escape_network_builder`, separately assigned from the implementer and native-browser reviewer. Scope: inspect the existing helper, application call order, focused tests, and retained native evidence. No runtime code was changed and no Chromium process was launched for this review.

**Subsequent evidence supersedes this checkpoint's provisional decision.** The integration critic's [representative native probe](desktop-poll-continuation.json) reproduces the abort after immediate native JSON consumption, including ordinary request 4 without an injected stall. Its deadline sees no available observer records despite the later recorded 7.4 ms completed transfer. The worker replacement and its validation boundary are recorded in [network-worker-builder.md](network-worker-builder.md). The earlier reasoning and failed artifacts below remain preserved as a chronology of the evidence, not current acceptance of the observer approach.

## Decision

Retain the current Resource Timing helper while the representative native gate is completed. The available evidence does **not** justify introducing a dedicated state worker yet. This is a proportional implementation decision, not final browser acceptance.

The application starts `response.json()` immediately after a successful `fetch()` response, without an intervening delay. `network.js` creates a per-request observer before fetching, records matching completed fetch entries, drains queued observer records when the 1800 ms deadline callback runs, and aborts only when it has not observed completion. Cleanup retires the timer and observer. The application still bounds polling to one request, fetches the same public same-origin state endpoint, and preserves the evidence epoch, request-abort and Resume Live flow. No authority boundary or capture-fixture transport changes are needed.

The timer remains a main-thread timer: 1800 ms is its scheduled deadline, not a guarantee of exact wall-clock abort during a blocked event loop. Completion protection also depends on the browser making the request's Resource Timing entry observable. Neither limitation should be described as solved independently of native evidence.

## What the retained evidence establishes

| Evidence | Finding | Acceptance boundary |
| --- | --- | --- |
| [Original live probe](desktop-poll-probe.json) | Actual successful network responses were aborted during immediate native JSON consumption under renderer stalls. Requests 1, 3 and 4 show abort/body-error events; their recorded network transfers were approximately 5–8 ms. | Genuine original failure. Preserve this report. |
| [Current-helper probe](desktop-poll-completed-transfer.json) and [source manifest](network-native-probe-manifest.json) | Immediate native JSON requests 2, 4 and 5 complete after approximately 1868, 2189 and 1978 ms from fetch start, with no corresponding abort. The public state advances. | Encouraging evidence for the actual application order. Elapsed time alone does not establish that the deadline callback ran before the successful continuation. |
| Same current-helper probe, request 1 | The injected 1900 ms delay occurs **before calling native `response.json()`**. That request aborts, and `completedTransferSurvivedDelay` is `false`. | A real failed stronger consumer-delay case, but it changes the application's body-read order. Keep the failure and describe its scope; do not turn the report into a pass. |
| Same current-helper probe, throttled phase | At 256 bytes/s an actual request aborts before a headers event. | Proves the incomplete-header path remains bounded when the timer can run. Does not establish an incomplete-body timeout after successful headers. |

## Focused test review

Independent execution on Node v24.22.1:

```sh
node tests/escape-room/gauntlet-network-deadline.test.cjs
node tests/escape-room/gauntlet-network-capabilities.test.cjs
```

Results: 3/3 and 2/2 assertions pass. The combined `node --test` invocation also exits successfully, reporting the two test files as passing file-level subtests in this environment.

These tests cover matching completed transfers, incomplete transfers, unrelated/earlier entries, positive zero-duration timing entries, unavailable observation, and cleanup. They supply synthetic observer records and a deferred body promise. They prove the helper's decision logic; they do not prove when Chromium publishes a native Resource Timing entry. The retained red reports remain necessary evidence.

## Remaining native gate and owner

The integration critic owns both cases, using real responses and the frozen runtime:

1. Start native `response.json()` immediately, then stall the main-thread continuation beyond the scheduled deadline. Record the body-read start, deadline callback, native completion and any abort. To establish completion protection specifically, observe the deadline callback while the application completion is still pending, then require a successful body completion without an abort. Continue to verify visible public-state progress.
2. Throttle the actual response sufficiently to obtain successful headers while leaving the body incomplete at the deadline. Approximately 2 KB/s is a proposed probe setting, subject to the real response size. Require headers before abort, no completed body/update from that request, and subsequent recovery when throttling is removed.

If the first representative case still aborts a completed transfer, reopen the implementation decision with that concrete failure. A worker can then be evaluated against the same bounded-request, public-state, capture, cancellation and lifecycle requirements. Do not weaken the second gate to obtain the first.

## Reviewed source hashes

| File | SHA-256 |
| --- | --- |
| `public/ai-escape-room/app.js` | `df403474932905c3f1b7cefebf45c424b84c304c3b52cc33ed12fbb4db176c57` |
| `public/ai-escape-room/network.js` | `7afe7958e6fa5742acb60f349ac833d949a6318c954ea35fd6589725c1b4c424` |
| `desktop-poll-probe.json` | `60a3750631d3b0f16e930868d5408897dd5c2c3231be86799186ecef00d1a870` |
| `desktop-poll-completed-transfer.json` | `219de758aa895f065fb846d975351981878cd3eccde0068765551652365384ed` |
