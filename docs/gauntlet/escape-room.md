# AI Escape Room — Gauntlet ledger

## Goal and fixed bar

Build a complete 3D autonomous escape-room experience: a developed protagonist, finished physical rooms and mechanisms, readable game UI, reliable full escape runs, and truthful independent comparisons.

**Bar:** compare our actual room and mechanism captures directly with the selected official PC screenshots of **The Room 4: Old Sins**, judging authored construction, material separation, lighting, framing and readable physical detail at equivalent viewing purposes.

The fixed set contains one Old Sins room-wide view and two mechanism closeups. A selected **Escape Simulator** screenshot supports character silhouette and scene-integration review. **Escape Academy** was proposed as a supplementary direction, but it is not in the captured comparison set and no verdict is attributed to it. Source URLs, roles, retrieval metadata and image hashes are retained in [references.json](../../evidence/ai-escape-room/gauntlet/references/references.json).

**Round 05: the fixed commercial reference bar remains unmet.** A fresh [lighting critic](../../evidence/ai-escape-room/gauntlet/reviews/lighting-independent.md) preferred the new lighting over Round 04 in a concealed-source A/B comparison, then chose The Room 4 in a separate concealed-source reference comparison. The [unblinding record](../../evidence/ai-escape-room/gauntlet/reviews/lighting-unblinding.json) binds the aliases to the locked review. A separate [inspection critic](../../evidence/ai-escape-room/gauntlet/reviews/inspection-independent.md) accepts the complete active vault mechanism in desktop and phone views. The largest remaining visual gaps are authored environmental density and fine asset finish. No benchmark victory, production readiness or native-GPU performance claim is made.

## Run and inspect

From the repository root:

```sh
npm ci
npm run build
npm run escape-room:stream -- --port=4177
```

After building, the equivalent direct start is `node scripts/serve-escape-room-stream.cjs --port=4177`. The actual package script is `escape-room:stream`, and the server's corrected default port is 4177.

- Game: [http://127.0.0.1:4177/escape-room](http://127.0.0.1:4177/escape-room).
- Live progress: [http://127.0.0.1:4177/escape-room/progress](http://127.0.0.1:4177/escape-room/progress).
- Setup, controls, content scope, provenance and focused checks: [Game README](../../games/ai-escape-room/README.md).

The progress page reads `evidence/ai-escape-room/gauntlet/progress.json` every ten seconds and serves allowlisted capture images. The lead agent owns updates to that file after each review. A review can be newer than the progress page; its dated artifact is the evidence of record until the page is updated.

Baseline: branch `agent/escape-room-2-5d-rebuild` at `ad5ae46d82351f732d1e4e84db26e624eb381151`. The persistent work is [draft PR #54](https://github.com/my-edutu/Ai_games/pull/54), stacked on [base PR #40](https://github.com/my-edutu/Ai_games/pull/40), on branch `agent/escape-room-gauntlet-3d-20261030`. The draft is a reviewable checkpoint. A repository HEAD value does not by itself bind a capture to source; capture and integration manifests retain the exact tested file hashes, while visual reviews bind verdicts to image hashes.

## Working loop and ownership

The lead agent chooses the approach and divides the goal into the smallest independently improvable, judgeable pieces. Important pieces receive a builder and a separate critic with fresh context. Current work spans scene craft, the protagonist, mechanisms, interface and integration; this is a working split, not a fixed architecture or a limit on later decomposition.

Critics inspect the real output against the fixed bar, use blind A/B comparison when feasible, identify the largest remaining gap and send it back to the builder. Keep iterating until the output wins or the user stops the run. No fixed number of rounds or automatic numerical threshold constitutes a win.

The lead records the new captures, verdict, remaining gap and validated behavior on the progress page. **Ultracode was not available as an installed tool in this session.** Separate builder and critic subagents were used; the run must not be described as having used Ultracode.

## Implemented scope

- **One protagonist:** the Archivist, a modeled clockwork investigator with lens face, articulated grippers, a carried archive pack and public-state-driven poses. This is the current cast; a finished multi-character roster is not implied.
- **Four seeded theme variants:** Cipher Vault, Clockwork Study, Chromatic Lab and Archive Zero, within the existing autonomous progression.
- **Eight mechanism families:** sequence lock, symbol cipher, shape order, tool dependency, switch network, balance clue, direction pattern and final vault, with physical construction and solved-state articulation.
- **Room presentation:** architecture, furniture, shelving, contextual props, lighting and local CC0 wood, plaster and metal material maps. The authored writing bench, upholstered chair, differentiated stands and varied bookcases now receive cached contact/visibility shading and correctly scaled timber grain. The closed exit also has physical side rebates, a threshold and a lower leaf extension.
- **Interface:** a large 3D stage; objective, actual lock count, time reserve, public intent, inventory and discovered mechanisms; room/follow/object/character viewing, explicit sound activation, reduced motion, high contrast, clean feed and pinned evidence replay.
- **Authority boundary:** autonomous rules, seeded decisions and result ownership remain in the game runtime. Presentation consumes sanitized snapshots. Stable placement is computed before visibility filtering, while only visible objects are projected publicly.
- **Durable result presentation:** a real successful escape keeps the public celebration signal through intermission. The physical exit, camera and UI consume that signal; a 100%-unlocked frame before the escape action remains distinct.
- **Complete mechanism inspection:** the real projected geometry is fitted inside the usable desktop/phone viewport, including interface exclusion areas. The active circular mechanism fits; whole-door/casing framing and tiny mobile markings are not asserted as complete.
- **Stable geometry batching:** opaque stable object components share material batches with positions, normals, UVs and picking bounds preserved. The final vault, exit hinge and moving parts retain independent articulation. Full object tests preserve triangles while reducing dynamic submissions.
- **Live state worker:** one dedicated worker owns fetch, complete JSON parsing and the 1,800 ms deadline. A ready handshake precedes requests; cancellation is request-scoped and teardown retires the worker. Evidence fixtures deliberately use the main-thread path. A disclosed fallback remains for unavailable/blocked workers, with the known limitation that it shares rendering stalls.
- **Lifecycle:** the renderer exposes `dispose()` for its animation frame, listeners, observer and owned resources. Full page exit stops polling, aborts the request, disposes rendering and closes audio. Exact Node contracts and the Round 03 full two-renderer browser lifecycle case pass; Round 04 resource stress is a separate recorded checkpoint.

The [Round 03 character closeup](../../evidence/ai-escape-room/gauntlet/captures/round-03/character.png) establishes an identifiable, developed stylized Archivist in the critic's judgment. Round 04 changes the overview framing, successful-avatar staging and hover-cone visibility to address that review's composition findings. New captures document those edits. The nine passing Round 03 browser cases remain tied to their own source manifest; their camera and pose assertions are not silently extended to the later visual revision. Portrait stills also do not establish navigation or access to every control.

Rigid-part batching reduces the character's mesh submissions from **61 to 39**, with nine sampled pose/surface/bounds comparisons retained in [archivist-efficiency-comparison.json](../../evidence/ai-escape-room/gauntlet/reviews/archivist-efficiency-comparison.json). Triangle count stays at 12,526; the report's visible-geometry storage rises from 134,796 to 224,036 bytes. This is a submission-count change with an explicit storage tradeoff, not an FPS or memory-saving claim.

## Comparison history

| Evidence | Verdict | Largest remaining gap |
| --- | --- | --- |
| [Baseline review](../../evidence/ai-escape-room/gauntlet/reviews/baseline-independent-visual-review.md) | Reference wins | Room reads as a geometric blockout: insufficient architecture, material craft, character development and mechanical construction. |
| [Round 01 review](../../evidence/ai-escape-room/gauntlet/reviews/round-01-independent.md) | Reference wins | Focal assets remain simple repeated forms; uniform glossy wood and limited contact definition weaken the room. |
| [Round 02 review](../../evidence/ai-escape-room/gauntlet/reviews/round-02-independent.md) | Reference wins | Focal mechanisms lack layered housings, connected parts and fine material variation. Character framing, portrait composition and exit depth also remain blockers in the inspected images. |
| [Round 03 review](../../evidence/ai-escape-room/gauntlet/reviews/round-03-independent.md) and [unblinding](../../evidence/ai-escape-room/gauntlet/reviews/round-03-unblinding.json) | Round 03 wins all four A/B views over the baseline; fixed reference still wins | Authored construction and staging of the dominant desk/chair/pedestal ensemble and mirrored shelving. Character overview clipping, result placement, exit depth and mechanism finish also remain visible gaps. |
| [Round 04 review](../../evidence/ai-escape-room/gauntlet/reviews/round-04-independent.md) and [unblinding](../../evidence/ai-escape-room/gauntlet/reviews/round-04-unblinding.json) | Round 04 wins room, character, result and mobile over Round 03; the byte-identical mechanism views tie. Fixed references still win. | Physical grounding and material depth: weak local contact definition, broad lighting and insufficiently distinct surface responses. Purposeful dressing, oblique mechanism evidence and portrait inspection coverage remain subsequent priorities. |
| [Round 05 lighting review](../../evidence/ai-escape-room/gauntlet/reviews/lighting-independent.md) and [unblinding](../../evidence/ai-escape-room/gauntlet/reviews/lighting-unblinding.json) | New lighting wins the matched predecessor comparison; the commercial source wins the separate concealed-source comparison. | Authored storage/dressing, fine material variation and constructed hardware finish. More lighting-only iteration is not the largest gain. |
| [Round 05 inspection review](../../evidence/ai-escape-room/gauntlet/reviews/inspection-independent.md) | Active circular mechanism accepted in desktop and phone views; commercial finish still rejected. | Coarse component contours, generalized markings, broad rust treatment and a plain exit reveal. |

Earlier fixed-reference comparisons were independent and unblinded. In Round 03, the critic inspected eight randomized A/B images and sent the preference verdict before the alias mapping was revealed and before opening the four fixed references or separate character closeup. This was **chronology-blinded**, not a matched-scene controlled experiment: presentation and camera differences made the level of development visible. The subsequent fixed-reference review was explicitly unblinded. Relative improvement is not an absolute pass.

Round 04 likewise locked its preference after inspecting all ten A/B images, before the fixed references and named supplementary furniture image. The chronology key was recorded afterward. The final critic keeps the furniture construction and staging improvements, but explicitly finds that lighting, contact grounding and material finish remain below the fixed bar. A tie does not count as a mechanism improvement.

Round 04 retains [room](../../evidence/ai-escape-room/gauntlet/captures/round-04/room.png), [character](../../evidence/ai-escape-room/gauntlet/captures/round-04/character.png), [mechanism](../../evidence/ai-escape-room/gauntlet/captures/round-04/mechanism.png), [result](../../evidence/ai-escape-room/gauntlet/captures/round-04/result.png), [mobile](../../evidence/ai-escape-room/gauntlet/captures/round-04/mobile.png) and supplementary [furniture](../../evidence/ai-escape-room/gauntlet/captures/round-04/furniture.png) images, an [actual-run report](../../evidence/ai-escape-room/gauntlet/captures/round-04/report.json) and a [source manifest](../../evidence/ai-escape-room/gauntlet/captures/round-04/source-manifest.json). The run escaped at tick 25 with eight of eight puzzles solved and score 5,240; the report's error list is empty. The manifest confirms presentation hashes were unchanged during capture.

| Round 04 captured view | Draw submissions | Triangles | Quality tier |
| --- | ---: | ---: | --- |
| Room | 170 | 111,128 | Low |
| Result | 180 | 113,612 | Low |

These counters describe the captured views only. The earlier [Round 03 report](../../evidence/ai-escape-room/gauntlet/captures/round-03/report.json), [source manifest](../../evidence/ai-escape-room/gauntlet/captures/round-03/source-manifest.json) and reviewed images remain preserved. A new capture does not rewrite an earlier review.

Round 05 retains seven actual images, including oblique furniture and phone inspection, in [its capture directory](../../evidence/ai-escape-room/gauntlet/captures/round-05/). The [report](../../evidence/ai-escape-room/gauntlet/captures/round-05/report.json) records the same actual eight-puzzle escape at tick 25 and score 5,240 with no captured errors. The [manifest](../../evidence/ai-escape-room/gauntlet/captures/round-05/source-manifest.json) covers lighting, batching and inspection. **Those stills precede the sealed exit and dedicated-worker changes.** They cannot certify later source.

| Round 05 captured view | Draw submissions | Triangles | Quality tier |
| --- | ---: | ---: | --- |
| Room | 112 | 115,832 | Low |
| Result | 120 | 118,316 | Low |
| Desktop mechanism | 41 | 89,234 | Low |
| Phone mechanism | 40 | 89,202 | Low |

The lighting bake retains two bounded layout caches (466,392 bytes in its recorded allocation probe), adds 4,704 static triangles and removes the expensive static timber shadow pass. Stable dynamic batching preserves every compared triangle while reducing eleven/twelve-puzzle dynamic submissions from 165/179 to 77/81 before the small exit-seal addition. Its additional merged arrays use approximately 3.29/3.73 MB. Larger combined bounds increase submitted triangles in some closeups. [Allocation](../../evidence/ai-escape-room/gauntlet/reviews/lighting-allocation.json), [batch equivalence](../../evidence/ai-escape-room/gauntlet/reviews/dynamic-batching-node-metrics.json) and [culling tradeoff](../../evidence/ai-escape-room/gauntlet/reviews/dynamic-batching-culling.json) remain explicit; these are not FPS claims.

Captures use production runtime snapshots, reduced-motion poses and the low quality tier. They call the actual renderer frame method and pause its animation-frame loop for stable Chromium/SwiftShader WebGL stills. **FPS is deliberately not measured.** Still images establish neither animation quality nor interaction behavior. Later source changes require fresh evidence and do not retroactively alter earlier verdicts.

## Confirmed integration regressions

The following status is based on retained execution evidence inspected for this documentation update. Passing subsets from different runs are not one combined final pass.

| Defect | Correction and evidence | Current acceptance status |
| --- | --- | --- |
| **Batched camera events:** a reveal after a solve masked the new focus; a final result event masked escape framing. | Renderer processes unseen event batches rather than only the last event. [Original failures](../../evidence/ai-escape-room/gauntlet/reviews/integration-camera-red.md) and `browser-camera-red.json` preserve the defects; [browser-round03-full.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-round03-full.json) records both exact regressions passing. | Verified at the Round 03 browser checkpoint. |
| **Unstable prop placement:** revealing a hidden clue changed an existing object's slot. | Reserve slots from the complete immutable room definition before filtering visibility. [placement-red.txt](../../evidence/ai-escape-room/gauntlet/reviews/placement-red.txt) and [public-contract-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/public-contract-green.txt) retain red-to-green evidence. | Also passes in the latest retained 102/102 unit checkpoint. |
| **GPU instance cleanup:** retired vault instances retained two buffer objects per replay cycle even with flat geometry counts. | Dispose retired `InstancedMesh` objects separately from owned batch geometries. [Original resource review](../../evidence/ai-escape-room/gauntlet/reviews/integration-resource-character-red.md) preserves the leak; [gpu-buffer-samples-green.json](../../evidence/ai-escape-room/gauntlet/reviews/gpu-buffer-samples-green.json) records 348 outstanding buffers in all six replay cycles. | Exact raw-buffer regression passes at Round 03. The separate later broad resource test also passes; coarse counters alone are not substituted for this proof. |
| **Character framing beside walls:** clamping an outward camera offset collapsed its subject distance. | Revised framing fits every corner of the real actor's bounds beside both wall mechanisms. [Left](../../evidence/ai-escape-room/gauntlet/reviews/character-left-wall-green.png) and [right](../../evidence/ai-escape-room/gauntlet/reviews/character-right-wall-green.png) green captures were independently inspected. | Exact browser assertions pass at Round 03. Later overview/staging edits have their own Round 04 capture evidence and are not retroactively covered by those earlier hashes. |
| **Success lost during intermission:** the physical exit closed and the durable success signal disappeared. | Public celebration persists through successful intermission, and exit/camera/UI use it. [terminal-transition-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/terminal-transition-green.txt) records the exact real-engine/real-mesh correction. | Exact Node regression and the Round 03 browser case that skips the single result frame both pass. Pre-escape 100% remains distinct. |
| **Missing renderer teardown:** no explicit boundary released scheduling, listeners, observer and owned GPU resources. | `dispose()` and full-page `pagehide` cleanup are implemented. [teardown-contract-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/teardown-contract-green.txt) and [renderer-lifecycle-green.json](../../evidence/ai-escape-room/gauntlet/reviews/renderer-lifecycle-green.json) preserve interface and actual lifecycle evidence. | Node and Round 03 two-renderer browser cases pass: RAF stops, listeners/observer detach, retired context is lost and the surviving renderer retains shared assets and draws. |
| **Main-thread false network timeouts:** completed responses were aborted while software rendering delayed continuations. | A Resource Timing observer candidate passed synthetic tests but failed actual browser continuations, including an ordinary uninjected request. The dedicated worker owns the full network operation. [Native failure](../../evidence/ai-escape-room/gauntlet/reviews/desktop-poll-continuation.json), [builder proof](../../evidence/ai-escape-room/gauntlet/reviews/network-worker-builder.md) and [partial native worker proof](../../evidence/ai-escape-room/gauntlet/reviews/worker-native-probe.json) preserve that sequence. | 23 worker/client assertions pass within the full suite. Actual worker JSON completed during a 2,600 ms main-thread stall and remained deliverable after the old deadline. Other native acceptance cases are still running; the first probe stopped on an unsupported CDP fault-injection command. |
| **Clipped active mechanism:** fixed-distance framing cut off the full vault circle behind the interface. | Fit real transformed bounds within the usable viewport at the existing field of view and bounded camera distance. [Six geometry tests](../../evidence/ai-escape-room/gauntlet/reviews/inspection-green.txt) and separate actual image review pass. | Active circular mechanism accepted on desktop and phone; full casing and fine mobile markings remain qualified. |
| **Closed exit gaps:** side and lower aperture strips showed the passage through a supposedly closed door. | Add physical jamb/rebate, threshold and hinged lower leaf surfaces. [Failing](../../evidence/ai-escape-room/gauntlet/reviews/exit-seal-red.txt) and [passing](../../evidence/ai-escape-room/gauntlet/reviews/exit-seal-green.txt) real-mesh ray tests retained. | Seven affected seal/transition/batching assertions pass; next capture will show the integrated surfaces. |

## Recorded validation

| Retained artifact | Demonstrated result | Limit |
| --- | --- | --- |
| [unit-regression-round05-worker.txt](../../evidence/ai-escape-room/gauntlet/reviews/unit-regression-round05-worker.txt) | **102 passed, 0 failed:** full Game 8 Node suite after lighting, batching, inspection, exit seal and worker. | Exact Node/contract checkpoint, not blanket browser or visual acceptance. |
| [server-self-test-round05-worker.json](../../evidence/ai-escape-room/gauntlet/reviews/server-self-test-round05-worker.json) | `ok: true`; authority, assets including worker, bounded source, renderer, privacy, recovery and restart all true. | Server self-test; no production soak implied. |
| [unit-regression-round04.txt](../../evidence/ai-escape-room/gauntlet/reviews/unit-regression-round04.txt) | **67 passed, 0 failed:** the full Escape Room Node suite at Round 04. | Source checkpoint; no browser, visual acceptance or native-GPU performance claim follows from it. |
| [server-self-test-green.json](../../evidence/ai-escape-room/gauntlet/reviews/server-self-test-green.json) | `ok: true`; authority stability, browser assets, bounded-source checks, renderer source, public privacy, recovery and restart checks all report true. | Server self-test, not a production soak or browser resource proof. |
| [node-focused-final.txt](../../evidence/ai-escape-room/gauntlet/reviews/node-focused-final.txt) and [manifest](../../evidence/ai-escape-room/gauntlet/reviews/node-focused-final-manifest.json) | **12 passed:** six public-contract/placement assertions, four request-handler assertions, terminal transition and renderer-disposal interface. | Independent focused rerun; overlaps the full suite. |
| [focused-model-lifecycle-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/focused-model-lifecycle-green.txt) | **15 passed, 0 failed:** earlier character, mechanism, terminal-transition and disposal-interface checks. | Historical focused run; do not add overlapping totals. The previous full 65-test checkpoint also remains retained. |
| [browser-round03-full.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-round03-full.json) and [manifest](../../evidence/ai-escape-room/gauntlet/reviews/integration-source-manifest-round03.json) | **9 passed, 1 timed out:** functional, camera, wall framing, raw buffers, intermission and full renderer lifecycle pass. | The 65-frame resource loop timed out before its assertions. Keep this report as 9/1; it is not a full green run. |
| [browser-round04-resources-green.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-round04-resources-green.json) and [manifest](../../evidence/ai-escape-room/gauntlet/reviews/integration-source-manifest-round04-resource.json) | **1 passed:** unchanged resource assertions pass on the frozen newer renderer in the targeted rerun. | Separate source checkpoint; successor RAF is paused between actual scripted frame calls to avoid redundant software-GPU draws. |
| [webgl-resource-samples-green.json](../../evidence/ai-escape-room/gauntlet/reviews/webgl-resource-samples-green.json) | Five flat cycle samples: **158 geometries, 21 textures, 13 programs**, 246 cached geometries, 16 shared scenery textures and 20 dynamic groups; **65 actual frames** across four themes. | Assesses within-run growth. Absolute counts from different visual revisions are not comparable as leak evidence. |
| [gpu-buffer-samples-green.json](../../evidence/ai-escape-room/gauntlet/reviews/gpu-buffer-samples-green.json) | Round 03 retains **348 outstanding buffers in each of six cycles**, with allocations and deletions both advancing; 107 geometries remain constant. | Raw buffer-object counts, not GPU bytes. This proof is distinct from the later coarse resource counters. |
| [browser-round04-desktop.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-round04-desktop.json) and [failure output](../../evidence/ai-escape-room/gauntlet/reviews/browser-round04-desktop-red.txt) | **1 failed:** the original desktop broadcast test reads the same tick value before and after a 700 ms wait. | Fails before the draw-submission and triangle-budget gate. Cause under investigation; no budget result is inferred. |

**All ten focused browser scenarios have passing evidence across two explicit source checkpoints. This is not one ten-case green run on the same revision.** The [completed integration review](../../evidence/ai-escape-room/gauntlet/reviews/integration-review.md) describes the source boundaries, unchanged assertions and resource-rerun scheduling. The nine Round 03 cases do not silently certify the subsequent furniture, overview, successful-avatar or hover-cone edits. The newer resource-only proof is bound to those newer files by its own manifest. The original browser suite and its draw-call budget gate are also separate from these added cases.

The original-desktop failure led to separate native probes. Those observed both false request timeouts under main-thread rendering stalls and a late eleven-mechanism room above the unchanged draw budget (230 low-tier calls / 140,336 triangles before batching). The test now waits for actual public run-token/tick advancement and matching UI instead of a fixed 700 ms delay; its 190-call/150,000-triangle limits remain unchanged. Dedicated-worker transport and stable batching address those measured defects. Independent native recovery, full live desktop and eleven/twelve-puzzle budget acceptance remain open. Opening still counters do not substitute for those gates.

Earlier startup/protocol failures remain in [browser-rerun-timing-failure.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-rerun-timing-failure.json) and [browser-postfix-startup-blocked.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-postfix-startup-blocked.json). The Round 03 stress timeout is retained in its report and trace. None is relabeled as a pass or a resource leak. The dedicated lifecycle scenario exercised real scheduled RAF, unlike the targeted resource loop's paused successor frames. No overlapping totals are added.

Focused commands, after `npm run build`:

```sh
node --test --test-concurrency=1 tests/escape-room/*.test.cjs
node scripts/serve-escape-room-stream.cjs --self-test
npx playwright test --config=playwright.escape.config.cjs
```

The ten-case browser defect suite is `npx playwright test --config=playwright.escape.config.cjs tests/browser/escape-room-gauntlet.spec.cjs`. The wider isolated configuration also includes the stream, camera and evidence-pinning files. It uses one worker, port 4177, 120-second test timeouts and WebGL-only SwiftShader (`--use-angle=swiftshader-webgl`). Automatic trace screenshots are disabled to reduce host contention; explicit captures and action/DOM traces remain. Current fixtures deliver the same production frames in-page to avoid repeated cross-process response callbacks. Browser setup and a capture reproduction command are in the README.

## Next acceptance work

| Owner | Evidence required before acceptance |
| --- | --- |
| Lead and fresh visual critic | Preserve accepted lighting and complete inspection; retain the commercial-reference loss. Judge the next captured revision against the same references and source-concealed predecessor views. |
| Lead integration agent and integration critic | Complete native worker timeout/recovery/cancellation, original live desktop, eleven/twelve-puzzle GPU budgets and meaningful post-batching resource checks. Preserve all prior failures and source boundaries. Current 102/102 unit result and worker-inclusive self-test are green; native-GPU behavior remains unproven. |
| Scene builder and fresh visual critic | Finalize the scratch map-storage/specimen-cabinet proposal, verify shelf/side-mechanism clearance, integrate after the current freeze, then inspect actual room/furniture/side views against the fixed library image. Do not accept unrendered additions or exceed the existing performance budget. |
| Character/scene builders and integration critic | Preserve the accepted overview coverage, cleaner hover presentation and character placement at the open doorway. Show a dynamic interaction/exit sequence before extending the still-image acceptance to animation; retain successful intermission through later lighting/framing edits. The earlier wall-framing proof stays bound to Round 03. |
| Material builder and fresh visual critic | Preserve developed vault geometry, all articulation and complete inspection while refining brass/iron/enamel response, fine calibration detail and character joint finish. Avoid increasing the already tight full-room triangle cost. Render and judge the scratch proposal before acceptance. |
| Scene/UI builders and fresh visual critic | Retain the improved portrait composition and readable controls. Verify navigation and focused mechanism access at 390×844; the accepted lateral crop in one still does not prove access to the full room. |
| Scene builder and integration critic | Preserve the improved final character/door relationship while developing the destination's spatial depth. Keep the tested durable success signal and the distinction between all locks open, actual escape and the next-room transition. |
| Lead and independent critics | Obtain independent output-wins verdicts for every important piece and the whole game before declaring victory; continue the loop while any important comparison still favors the reference. |

## Evidence and asset policy

Only actual renderer captures and completed runtime tests support acceptance. Source inspection, generated imagery, implementation claims and test counts cannot establish visual parity. A tie is not a win. SwiftShader runs do not establish hardware performance, GPU byte usage, a production soak or deployment readiness.

The application uses CC0 material maps from Poly Haven; [SOURCE.md](../../public/ai-escape-room/textures/SOURCE.md) and [sources.json](../../public/ai-escape-room/textures/sources.json) retain authorship, license and file provenance. Commercial comparison media is used only for evaluation. Root `.gitignore` excludes those downloaded media/HTML/contact-sheet files while preserving reference JSON manifests and the game's own captures/reviews for version control. Reproduce missing reference downloads from the manifest and verify their hashes before reusing the comparison set.

The existing review and capture artifacts remain immutable evidence for their rounds. New output uses a new capture label and a new review record; the progress page is the evolving index, not permission to rewrite prior results.
