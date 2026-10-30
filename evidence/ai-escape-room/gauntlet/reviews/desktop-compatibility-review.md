# Existing desktop compatibility gate — follow-up diagnosis

Status: **open; no full desktop-test pass claimed**. The existing render budgets, layout, privacy and control assertions remain intact. The original fixed-sleep failure is retained in `browser-round04-desktop.json`, `browser-round04-desktop-red.txt` and `trace-desktop-original-red.zip`.

**The Resource Timing observer helper is rejected as a complete fix.** Its unit cases pass, and it sometimes exempts a completed transfer correctly, but the representative native probe below reproduces the original abort race on an ordinary request with no injected delay. The source owner is moving the network deadline and body read to a dedicated worker. No further browser verification has been performed against that forthcoming implementation.

## What the original trace shows

The test read tick `4` twice. A 700 ms fixed sleep cannot establish autonomous-loop progress: ticks restart at a new room, and browser work can delay both polling and the observation itself. In this particular trace, however, the public state also really stayed on room 239 / tick 4 while the server continued advancing. The saved trace shows newer responses for room 239 / tick 38, room 240 / tick 24, and room 240 / tick 57. Those responses completed with HTTP 200 in 3.7–11.1 ms, while the visible tick remained `4`. A reconnect warning reports an aborted request during this interval.

`desktop-original-trace-summary.json` contains the compact call, response and console timeline. The two tick reads completed at trace times 47,542 ms and 53,866 ms, so the test's nominal sleep did not correspond to a controlled 700 ms observation interval.

## Native live probe

`desktop-poll-probe.cjs` observes the real live page at 1920 × 1080. It makes no synthetic state responses, quality changes or RAF changes. Its fetch wrapper passes every real request through and logs the native header/JSON/abort phases. Results are saved in `desktop-poll-probe.json`.

The probe demonstrates a real watchdog/body-consumption race:

| Request | Network duration | Headers / JSON start | Abort | Result |
|---|---:|---:|---:|---|
| 1 | 8.3 ms | 1,862 ms | 2,293 ms | `response.json()` rejects with AbortError |
| 3 | 7.1 ms | 10,533 ms | 10,540 ms | `response.json()` rejects with AbortError |
| 4 | 4.9 ms | 13,809 ms | 14,808 ms | `response.json()` rejects with AbortError |

Times in the final three columns are page-relative. Long tasks lasting 1.1–2.3 seconds coincide with these delayed continuations. The app's 1,800 ms abort timer stays active through `response.json()`, so it can cancel a fast, fully received network response while rendering delays body consumption.

Other polls succeed: the actual client advances from room 35 / tick 49 to room 37 / tick 31. The probe's explicit runToken/tick progress check succeeds within 10 seconds. This does not erase the real aborted-response behavior.

## Render-budget finding

The same real runtime probe reaches the diagnostics that the original desktop test had not yet reached:

| Observed state | Quality | Draw calls | Triangles |
|---|---|---:|---:|
| Room 35, tick 49 | High | 238 | 153,040 |
| Room 37, tick 31 | Low | 230 | 140,336 |

The existing gate requires **fewer than 190 draw calls and fewer than 150,000 triangles**. Both observed states exceed its draw-call limit, and the high-quality sample also exceeds its triangle limit. These limits have not been raised or removed. The measurements are counts, not a native-GPU frame-rate claim.

## Focused test repair and next verification

Only the desktop test's progress assertion has been changed: observe a changed `runToken` or a strictly increasing tick within the same run, and require the rendered tick to match that public state. The condition has a **10-second bound**, matching the existing expectation budget; it does not wait indefinitely or replace the real runtime with a fixture. Successful observations attach their identities and elapsed time.

The source owner is addressing the polling lifecycle and draw-budget findings. A focused run of this unchanged full desktop gate is required after those source fixes. No full pass is claimed from the diagnostic probe.

## Native verification of the observer candidate

`desktop-poll-completed-transfer.json` first tested a stronger scenario: postpone starting the first native body read by 1,900 ms. That response aborted. Because production starts `response.json()` immediately, this result alone did not establish a remaining production-order defect and was kept separate.

`desktop-poll-continuation.json` then preserves production ordering: invoke native JSON consumption immediately, and only then block the main thread for a bounded 2,100 ms on request 1. Transparent instrumentation records actual watchdog callback execution and native `PerformanceObserver` callbacks / `takeRecords()` results. The first response still aborts. More decisively, **ordinary request 4 has no injected stall or delay and also aborts**:

| Ordinary request 4 event | Page-relative time |
|---|---:|
| Fetch starts | 25,511.5 ms |
| Native network timing starts | 25,512.1 ms |
| Network response ends, according to the eventual native timing entry | 25,519.5 ms |
| Headers reach JavaScript | 27,321.1 ms |
| Native JSON read starts immediately | 27,321.7 ms |
| Actual watchdog callback fires | 27,857.7 ms |
| Actual `takeRecords()` returns | Empty array |
| Abort signal fires | 27,858.0 ms |
| Native JSON rejects with AbortError | 27,858.4 ms |

The 7.4 ms network transfer was already complete, but its completion record had not become available to the helper at the deadline callback. This disproves the candidate's assumption that draining the observer queue reliably distinguishes network delay from delayed body continuation.

The same probe observes real successful exemptions on requests 2 and 3: the watchdog callback actually runs while JSON is pending, a matching completed fetch timing entry is available, no abort occurs, and the native body later completes. Thus the helper works in some schedules, but is not a dependable fix for this race.

The incomplete-body branch is independently exercised with the real server at **2 KB/s** browser download throttling: request 7 receives HTTP 200 headers and starts native JSON consumption, then the actual watchdog finds no completion record and aborts the incomplete body. This check passed. No body data or authoritative state was fabricated.

All probe browsers are closed. The preserved observer-candidate result is **RED**, despite the nine combined network/helper/server Node assertions passing in `network-and-server-final.txt`. Those unit results cannot substitute for native scheduling evidence.
