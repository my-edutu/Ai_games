# AI Escape Room gauntlet — independent integration review

**Additional existing compatibility gate remains open.** After the focused scenarios below completed, the original desktop broadcast test failed its fixed 700 ms tick comparison. Follow-up native tracing identified a real fetch/body watchdog race and measured 230–238 draw calls against the preserved limit of fewer than 190. A Resource Timing observer fix is now **rejected by representative native evidence**, including an ordinary non-injected request that still aborted after a 7.4 ms completed network transfer. See `desktop-compatibility-review.md`; no full existing-desktop pass is claimed.

Status: **all ten focused browser scenarios have passing evidence across two explicit source checkpoints; the twelve focused Node assertions also pass**. Round03 completed with nine browser cases passed and one broad resource-stress case timed out before its assertions. The targeted resource rerun then passed against the frozen round04 renderer in 95.7 seconds. It uses the same 65 real public frames and unchanged resource assertions, but pauses the renderer's successor RAF between scripted calls to its actual frame method so redundant software-GPU draws do not consume the test budget. This is not represented as one ten-case green run against the same source revision.

| Checkpoint | Result | Evidence |
|---|---|---|
| Round03 functional, camera, privacy-continuity and lifecycle browser scenarios | 9 passed; the resource loop timed out before assertions | `browser-round03-full.json`, `integration-source-manifest-round03.json` |
| Latest frozen renderer, four-theme replay resource scenario | 1 passed; all five cycle samples exactly flat | `browser-round04-resources-green.json`, `integration-source-manifest-round04-resource.json` |
| Four focused Node files | 12 assertions passed | `node-focused-final.txt` |

## Independently demonstrated defects

| Defect | Original evidence | Verification state |
|---|---|---|
| Follow stays on the prior mechanism when `object-revealed` follows `puzzle-solved` in one tick | `browser-camera-red.json`, `integration-camera-red.md` | Exact browser regression passed after the event-order fix. |
| Escape camera transition is skipped when `result` follows `escape` in one tick | Same report and note | Exact browser regression passed after the event-order fix. |
| Revealing clues moves existing objects because placement uses the visible-array index | `placement-red.txt` | The unchanged invariant passes after stable placement reservation. |
| Replaced vault instances retain GPU buffers while ordinary geometry counters remain flat | `browser-character-buffer-red.json`, `trace-gpu-buffer-red.zip` | Exact browser regression passes: outstanding buffers remain 348 in all six replay cycles. |
| Wall-facing character camera collapses its subject distance and crops the Archivist | Same report, `character-left-wall-red.png` | Full real actor Box3 corners fit inside the camera frustum beside both actual left- and right-wall mechanisms; both explicit green captures were visually inspected. |
| Successful intermission closes the physical exit and drops the durable success signal | `terminal-transition-red.txt` | Exact real-engine/real-mesh Node regression and the browser case skipping the single result frame both pass. |
| Room renderer lacks an explicit disposal API for RAF, listeners, observer and GPU resources | `teardown-red.txt` | Interface and full two-renderer browser lifecycle regressions pass, including live RAF, listener, observer, context and shared-cache assertions. |

## Completed positive evidence

- Public-contract suite: **6/6 passed**. It includes twelve complete depth-12 autonomous runs across four themes and three seeds per theme, full mechanism counts, hidden-value/key exclusion, immutable projection, 150 steps of arbitrary layout/recovery reads without authority drift, automatic room transitions, and stable physical placement.
- New renderer-disposal interface and successful-intermission physical exit regressions: **2/2 passed** after independently rerunning the exact previously failing tests.
- Production request-handler suite: **4/4 passed**. It checks malformed target rejection without killing subsequent requests, actual JS/texture assets and MIME types, progress no-store behavior and allowlisted capture paths, traversal rejection, and public state/replay privacy.
- The completed round03 browser run passes manual inspection/character/room controls, both event-order camera regressions, all twelve physical and UI mechanisms, truthful 100%-pre-exit versus confirmed-escape presentation, rewind to a closed door, WebGL-unavailable state continuity, full-body wall framing, raw GL buffer disposal, full renderer disposal, and durable successful intermission.
- Round03 raw buffer counts in `gpu-buffer-samples-green.json`: six cycles each retain exactly **348 buffers** and **107 geometries**. Allocations grow from 751 to 2766 while deletions grow from 403 to 2418, demonstrating retirement rather than merely avoiding rebuild work.
- Round03 full lifecycle data in `renderer-lifecycle-green.json`: the retired renderer drew 87 calls and ran two real RAF frames before disposal; no callbacks advance after disposal; all six captured listeners are removed; its context is lost; none of 20 shared assets emits disposal; the surviving renderer retains its context and draws 87 calls.
- The latest renderer's resource stress run stays exactly flat in all five cycles: **158 geometries, 21 textures, 13 programs, 246 cached geometries, 16 shared scenery textures, 20 dynamic groups**. Each cycle renders three real production frames in each of four themes, then an identical opening frame after a high-contrast/theme rebuild: 65 actual renderer frames in total. The before/after hash comparison found no source changes during this run. Samples are in `webgl-resource-samples-green.json`.
- Earlier, the original broad replay/theme test stayed flat at 107 geometries, 20 textures, 15 programs and 160 cached geometries. A separate GL buffer test still caught a lifecycle defect that those coarse counters did not expose. The historical and current absolute counts are from different visual revisions; only within-run growth is being assessed.

## Test files

- `tests/browser/escape-room-gauntlet.spec.cjs`: actual UI controls, real terminal frames, all twelve mechanisms, character frustum bounds, GPU resource stability and renderer lifecycle.
- `tests/escape-room/gauntlet-public-contract.test.cjs`: authority, privacy, maximum-depth completeness and stable placement.
- `tests/escape-room/gauntlet-server.test.cjs`: executes the real request handler, replacing only listener/timer registration to avoid creating or crashing a second server.
- `tests/escape-room/gauntlet-renderer-lifecycle.test.cjs`: loads the real renderer modules and checks the disposal interface contract.
- `tests/escape-room/gauntlet-escape-transition.test.cjs`: uses real authoritative lifecycle snapshots and the actual physical exit builder/animator to distinguish pre-exit, result and intermission.

## Browser environment and failures kept separate

The target is the existing localhost:4177 server. No additional server has been created or stopped by this reviewer. Chromium is launched with SwiftShader and one test worker. Functional/resource tests use the renderer's low quality setting and real production EscapeRuntime snapshots. The server privacy/route tests are independent of browser fixture delivery.

Two later runs timed out during fixture startup/protocol handling, before their correctness assertions, and are retained as failures rather than counted as verification:

- `browser-rerun-timing-failure.json`: original 60-second test timeout.
- `browser-postfix-startup-blocked.json`: 120-second timeout with reduced trace screenshot overhead; unbound-handle/startup errors persisted.

The completed round03 run uses in-page fixture responses rather than cross-process route callbacks, preserving the exact same engine frames and assertions. Readiness polls by timer. This removes the repeated route.fulfill protocol traffic seen in the failed traces. Automatic trace screenshots are disabled; explicit character captures and action/DOM traces remain. Exact launch arguments and the tested source hashes are in `integration-source-manifest-round03.json`.

`browser-round03-full.json` retains the full **9 passed / 1 timed out** result. The timeout occurred in the 65-state replay/theme loop at 120 seconds before its resource assertions. Its original trace is preserved as `trace-resource-round03-timeout.zip`; it is not reported as a resource leak or as a pass. Only this stress case's scheduling changed for the successful targeted rerun. The dedicated full lifecycle case tests a live, naturally scheduled RAF loop.

After round03, the source owner changed furniture detail, overview framing, successful-avatar staging and hover-cone visibility. These edits are outside the nine-case round03 browser checkpoint. The latest resource-only run is bound to the newer files by its separate manifest. Those later visual changes require their own capture/pose evidence; this review does not silently extend earlier camera captures to later source hashes.

The focused Node rerun command was:

```sh
node --test --test-isolation=none tests/escape-room/gauntlet-public-contract.test.cjs tests/escape-room/gauntlet-server.test.cjs tests/escape-room/gauntlet-renderer-lifecycle.test.cjs tests/escape-room/gauntlet-escape-transition.test.cjs
```

The browser runs used the temporary isolated Playwright config with one worker, the manifest's SwiftShader launch arguments, a 120-second timeout and no second web server. The targeted run used `--grep 'WebGL geometry, textures and programs'`. No existing test was weakened or removed.

These tests do not establish native-GPU frame rate, production soak stability, or a visual benchmark win. The manual-controls browser case took 119.0 seconds and the raw-buffer case 108.2 seconds on the shared software-rendered host, so the 120-second isolated-suite budget has little timing margin there. The original browser suite and its draw-call budget gate remain separate from these added cases.
