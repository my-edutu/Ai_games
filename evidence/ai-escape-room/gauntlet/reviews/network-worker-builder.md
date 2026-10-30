# State worker: builder handoff

Date: 2026-10-30. Owner: `escape_network_builder`. Native browser validation owner: `escape_integration_critic`.

## Problem and implementation decision

The [representative native probe](desktop-poll-continuation.json) establishes that Resource Timing publication is also delayed by main-thread work. Ordinary request 4, without an injected stall, starts at 25,511.5 ms, starts native JSON consumption at 27,321.7 ms, and is aborted at 27,858.0 ms after the deadline drains an empty observer queue. The subsequently published resource entry records the network response ending at 25,519.5 ms. This is the real application order, so a dedicated worker is now warranted. The earlier [independent review](network-independent-review.md) is marked as superseded; all native red reports remain intact.

Implemented plan:

1. Record a failing client contract requiring a worker-owned deadline.
2. Put state fetch, complete JSON consumption and the 1800 ms timeout in a self-hosted dedicated worker.
3. Preserve one pending request, cancellation, evidence epochs, Resume Live and disposal on the page.
4. Bound worker startup separately and disclose unsupported/failed-worker fallback.
5. Verify the production client/worker scripts and actual application polling lifecycle in focused tests, then freeze runtime for independent native checks.

## Resulting behavior

`state-worker.js` accepts only same-origin `/escape-room/state` requests, performs a GET with `cache: 'no-store'`, `mode: 'same-origin'` and `redirect: 'error'`, consumes the entire JSON body, and sends a state or serialized error message. It has one active request and no autonomous polling loop. Its 1800 ms timer aborts genuinely incomplete fetches and is cleared before a completed state is sent to the page. Rendering and delayed page message delivery cannot postpone this timer or cancel that completed body.

`network.js` holds one pending client promise. It routes results by request ID, rejects concurrent reads, drops stale replies, and propagates explicit cancellation to the worker. There is no main-thread state-response watchdog after startup. A completed reply can wait for the page to process it without starting another request or accumulating a polling queue.

Worker startup has a separate **5000 ms ready-handshake deadline**. The client sends no state request until it has received `ready`, and clears the startup timer before sending that request. Consequently a delayed startup message cannot cause the startup watchdog to abort an already-running or completed state fetch. Cancelling during startup clears its timer and terminates the unready worker.

Worker construction/startup failure or an unavailable Worker API selects the bounded main-thread fallback. A ready worker failure terminates the worker, rejects that request, and allows one replacement on the next poll. Two consecutive worker failures select fallback; a successful worker state resets that counter. `window.__ESCAPE_NETWORK_DIAGNOSTICS__` reports the transport and reason, with one warning when live mode degrades. Fallback is not presented as equivalent protection against main-thread starvation.

`app.js` retains the public-state projection and rendering path. Pinning evidence cancels the current read and advances the presentation epoch. Resume Live cancels the previous epoch and requests a fresh frame once the pending call retires. Old results and cancellation errors cannot overwrite pinned evidence or create a false reconnect indication. Full page exit stops the interval, aborts the request, disposes the client/worker and existing renderer/audio resources, and prevents a late `finally` from restarting polling. The existing persisted-pagehide behavior is preserved for BFCache.

No game rules, authority state, seeded decisions, public-state fields or server projection changed. The lead owns the worker asset allowlist/route and capture manifest additions; bootstrap continues loading `network.js` before `app.js`.

## Explicit capture setup

The existing capture scripts intentionally open `?evidence=1` and install a `window.fetch` fixture for `/escape-room/state`. That query selects `evidence-main-thread` transport so the fixture remains effective. Native live-network acceptance must open the ordinary page without `evidence=1` and confirm diagnostics report `transport: 'worker'` and `reason: null`. A capture run does not establish native worker behavior.

## Builder verification

The [initial worker contract failure](network-worker-red.txt) precedes implementation. The final [focused test output](network-worker-green.txt) and [source manifest](network-worker-builder-manifest.json) bind the following successful runs to actual source hashes:

| Test file | Passed | Coverage |
| --- | ---: | --- |
| `gauntlet-network-deadline.test.cjs` | 6 | Completed body with delayed page delivery, missing headers, partial body, prior-completion isolation, public-endpoint restriction, worker concurrency and cancellation. |
| `gauntlet-network-worker.test.cjs` | 12 | Client handshake, one pending request, stale replies, worker replacement/fallback, silent and failed startup, cancellation during startup, capture fixture, unavailable/blocked Worker, invalid URLs and disposal. |
| `gauntlet-network-presentation.test.cjs` | 3 | Actual application polling/lifecycle code: pinned queued result, immediate Resume Live and stale epoch, full page exit/BFCache. |
| `gauntlet-network-capabilities.test.cjs` | 2 | Retained fallback-only timing precision and missing-observer edge cases. |
| `gauntlet-server.test.cjs` | 4 | Existing server malformed-target, asset/MIME, evidence allowlist and public privacy assertions. |

Total: **23 network assertions plus 4 existing server assertions, all passing**. `git diff --check` is clean. The harness executes the production worker and client source in separate VM contexts and can hold page message delivery while completing worker reads or firing worker deadlines. These tests verify protocol and lifecycle behavior; they do not substitute for browser scheduling and real transfer evidence.

## Native acceptance still required at handoff

The integration critic owns the frozen-runtime check of actual worker use, completed native state delivery while the page stalls, a real before-headers timeout, a real headers-present partial-body timeout, recovery, and lifecycle behavior. No Chromium process was launched by this builder. A native pass must have its own source manifest and must preserve the earlier observer failures.

The fix isolates the network deadline from rendering. It does not claim that a blocked page can immediately draw a fresh frame, that fallback has worker isolation, or that these checks establish a production soak or graphics performance result.
