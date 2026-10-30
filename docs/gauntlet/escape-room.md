# AI Escape Room — Gauntlet ledger

## Goal and fixed bar

Build a complete 3D autonomous escape-room experience: a developed protagonist, finished physical rooms and mechanisms, readable game UI, reliable full escape runs, and truthful independent comparisons.

**Bar:** compare our actual room and mechanism captures directly with the selected official PC screenshots of **The Room 4: Old Sins**, judging authored construction, material separation, lighting, framing and readable physical detail at equivalent viewing purposes.

The fixed set contains one Old Sins room-wide view and two mechanism closeups. A selected **Escape Simulator** screenshot supports character silhouette and scene-integration review. **Escape Academy** was proposed as a supplementary direction, but it is not in the captured comparison set and no verdict is attributed to it. Source URLs, roles, retrieval metadata and image hashes are retained in [references.json](../../evidence/ai-escape-room/gauntlet/references/references.json).

**Round 03 checkpoint: the new build wins against the baseline; the fixed commercial reference still wins.** The [latest independent review](../../evidence/ai-escape-room/gauntlet/reviews/round-03-independent.md) preferred A for all four compared views. Only after the review was locked did [unblinding](../../evidence/ai-escape-room/gauntlet/reviews/round-03-unblinding.json) identify A as Round 03 and B as the baseline. The separate fixed-reference verdict remains a failure. No benchmark victory, production readiness or hardware performance claim has been established.

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

Baseline: branch `agent/escape-room-2-5d-rebuild` at `ad5ae46d82351f732d1e4e84db26e624eb381151`. Work is on `agent/escape-room-gauntlet-3d-20261030`. A repository HEAD value does not bind an uncommitted capture to source; independent reviews bind their verdicts to the exact image hashes they inspected.

## Working loop and ownership

The lead agent chooses the approach and divides the goal into the smallest independently improvable, judgeable pieces. Important pieces receive a builder and a separate critic with fresh context. Current work spans scene craft, the protagonist, mechanisms, interface and integration; this is a working split, not a fixed architecture or a limit on later decomposition.

Critics inspect the real output against the fixed bar, use blind A/B comparison when feasible, identify the largest remaining gap and send it back to the builder. Keep iterating until the output wins or the user stops the run. No fixed number of rounds or automatic numerical threshold constitutes a win.

The lead records the new captures, verdict, remaining gap and validated behavior on the progress page. **Ultracode was not available as an installed tool in this session.** Separate builder and critic subagents were used; the run must not be described as having used Ultracode.

## Implemented scope

- **One protagonist:** the Archivist, a modeled clockwork investigator with lens face, articulated grippers, a carried archive pack and public-state-driven poses. This is the current cast; a finished multi-character roster is not implied.
- **Four seeded theme variants:** Cipher Vault, Clockwork Study, Chromatic Lab and Archive Zero, within the existing autonomous progression.
- **Eight mechanism families:** sequence lock, symbol cipher, shape order, tool dependency, switch network, balance clue, direction pattern and final vault, with physical construction and solved-state articulation.
- **Room presentation:** architecture, furniture, shelving, contextual props, lighting and local CC0 wood, plaster and metal material maps.
- **Interface:** a large 3D stage; objective, actual lock count, time reserve, public intent, inventory and discovered mechanisms; room/follow/object/character viewing, explicit sound activation, reduced motion, high contrast, clean feed and pinned evidence replay.
- **Authority boundary:** autonomous rules, seeded decisions and result ownership remain in the game runtime. Presentation consumes sanitized snapshots. Stable placement is computed before visibility filtering, while only visible objects are projected publicly.
- **Durable result presentation:** a real successful escape keeps the public celebration signal through intermission. The physical exit, camera and UI consume that signal; a 100%-unlocked frame before the escape action remains distinct.
- **Lifecycle:** the renderer exposes `dispose()` for its animation frame, listeners, observer and owned resources. Full page exit stops polling, aborts the request, disposes rendering and closes audio. Exact Node contracts are green; complete browser lifecycle verification remains pending.

The [Round 03 character closeup](../../evidence/ai-escape-room/gauntlet/captures/round-03/character.png) establishes an identifiable, developed stylized Archivist in the critic's judgment. This resolves the prior missing-character evidence problem. Its presentation remains incomplete: the overview clips most of the character, the result places it high against a shelf, and the hover cone needs refinement. The portrait crop was accepted in the supplied still, but that still does not establish navigation or access to every control.

Rigid-part batching reduces the character's mesh submissions from **61 to 39**, with nine sampled pose/surface/bounds comparisons retained in [archivist-efficiency-comparison.json](../../evidence/ai-escape-room/gauntlet/reviews/archivist-efficiency-comparison.json). Triangle count stays at 12,526; the report's visible-geometry storage rises from 134,796 to 224,036 bytes. This is a submission-count change with an explicit storage tradeoff, not an FPS or memory-saving claim.

## Comparison history

| Evidence | Verdict | Largest remaining gap |
| --- | --- | --- |
| [Baseline review](../../evidence/ai-escape-room/gauntlet/reviews/baseline-independent-visual-review.md) | Reference wins | Room reads as a geometric blockout: insufficient architecture, material craft, character development and mechanical construction. |
| [Round 01 review](../../evidence/ai-escape-room/gauntlet/reviews/round-01-independent.md) | Reference wins | Focal assets remain simple repeated forms; uniform glossy wood and limited contact definition weaken the room. |
| [Round 02 review](../../evidence/ai-escape-room/gauntlet/reviews/round-02-independent.md) | Reference wins | Focal mechanisms lack layered housings, connected parts and fine material variation. Character framing, portrait composition and exit depth also remain blockers in the inspected images. |
| [Round 03 review](../../evidence/ai-escape-room/gauntlet/reviews/round-03-independent.md) and [unblinding](../../evidence/ai-escape-room/gauntlet/reviews/round-03-unblinding.json) | Round 03 wins all four A/B views over the baseline; fixed reference still wins | Authored construction and staging of the dominant desk/chair/pedestal ensemble and mirrored shelving. Character overview clipping, result placement, exit depth and mechanism finish also remain visible gaps. |

Earlier fixed-reference comparisons were independent and unblinded. In Round 03, the critic inspected eight randomized A/B images and sent the preference verdict before the alias mapping was revealed and before opening the four fixed references or separate character closeup. This was **chronology-blinded**, not a matched-scene controlled experiment: presentation and camera differences made the level of development visible. The subsequent fixed-reference review was explicitly unblinded. Relative improvement is not an absolute pass.

Round 03 retains [room](../../evidence/ai-escape-room/gauntlet/captures/round-03/room.png), [character](../../evidence/ai-escape-room/gauntlet/captures/round-03/character.png), [mechanism](../../evidence/ai-escape-room/gauntlet/captures/round-03/mechanism.png), [result](../../evidence/ai-escape-room/gauntlet/captures/round-03/result.png) and [mobile](../../evidence/ai-escape-room/gauntlet/captures/round-03/mobile.png) images, an [actual-run report](../../evidence/ai-escape-room/gauntlet/captures/round-03/report.json) and a [source manifest](../../evidence/ai-escape-room/gauntlet/captures/round-03/source-manifest.json). The run escaped at tick 25 with eight of eight puzzles solved; the capture report has no page errors. Presentation files were frozen during capture and their hashes recorded separately. The review binds its verdict to the image hashes.

Captures use production runtime snapshots, reduced-motion poses and the low quality tier. They call the actual renderer frame method and pause its animation-frame loop for stable Chromium/SwiftShader WebGL stills. **FPS is deliberately not measured.** Still images establish neither animation quality nor interaction behavior. Later source changes require fresh evidence and do not retroactively alter earlier verdicts.

## Confirmed integration regressions

The following status is based on retained execution evidence inspected for this documentation update. Passing subsets from different runs are not one combined final pass.

| Defect | Correction and evidence | Current acceptance status |
| --- | --- | --- |
| **Batched camera events:** a reveal after a solve masked the new focus; a final result event masked escape framing. | Renderer processes unseen event batches rather than only the last event. [Original failures](../../evidence/ai-escape-room/gauntlet/reviews/integration-camera-red.md) and `browser-camera-red.json` record both failures. Both named camera regressions pass in [browser-character-buffer-red.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-character-buffer-red.json). | Focused red-to-green demonstrated for both regressions; final combined browser run pending. |
| **Unstable prop placement:** revealing a hidden clue changed an existing object's slot. | Reserve slots from the complete immutable room definition before filtering visibility. [placement-red.txt](../../evidence/ai-escape-room/gauntlet/reviews/placement-red.txt) records the failure; [public-contract-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/public-contract-green.txt) records the placement regression passing. | Red-to-green demonstrated and covered by the retained 65/65 unit checkpoint. |
| **GPU instance cleanup:** retired vault instances retained two buffer objects per replay cycle even with flat Three.js geometry counts. | Source now disposes retired `InstancedMesh` objects separately from owned batch geometries. [Resource review](../../evidence/ai-escape-room/gauntlet/reviews/integration-resource-character-red.md) and [browser-character-buffer-red.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-character-buffer-red.json) preserve the failure and raw create/delete-buffer evidence. | Fix implemented; post-fix raw-buffer regression result pending. Flat geometry/texture counters alone do not establish cleanup. |
| **Character framing beside walls:** clamping an outward camera offset collapsed its distance and cropped the actor. | Source contains a revised character framing calculation and presentation pose. [Resource/character review](../../evidence/ai-escape-room/gauntlet/reviews/integration-resource-character-red.md), [browser-results.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-results.json) and the retained `character-left-wall-red.png` document the actual crop. | Round 03 closeup visibly shows the developed character. Post-fix left/right wall browser assertions remain pending; overview clipping is a separate, still-visible composition problem. |
| **Success lost during intermission:** the physical exit closed and the durable success signal disappeared after the result frame. | Public celebration now persists through successful intermission, and exit/camera/UI use it. [terminal-transition-red.txt](../../evidence/ai-escape-room/gauntlet/reviews/terminal-transition-red.txt) and [terminal-transition-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/terminal-transition-green.txt) retain the exact real-engine/real-mesh regression. | Exact Node regression passes, including the closed pre-escape exit. Skipped-result browser scenario pending. |
| **Missing renderer teardown:** no explicit boundary released animation scheduling, listeners, observer and owned GPU resources. | `dispose()` and full-page `pagehide` cleanup are implemented. [teardown-red.txt](../../evidence/ai-escape-room/gauntlet/reviews/teardown-red.txt) and [teardown-contract-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/teardown-contract-green.txt) retain the exact interface regression. | Node interface contract is green. It does not establish the full browser lifecycle/resource result, which is pending. |

## Recorded validation

| Retained artifact | Demonstrated result | Limit |
| --- | --- | --- |
| [unit-regression-final-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/unit-regression-final-green.txt) | **65 passed, 0 failed:** the combined Escape Room Node regression checkpoint. | A source checkpoint; not a browser pass, a visual acceptance verdict or proof for later furniture changes. |
| [server-self-test-green.json](../../evidence/ai-escape-room/gauntlet/reviews/server-self-test-green.json) | `ok: true`; authority stability, browser assets, bounded-source checks, renderer source, public privacy, recovery and restart checks all report true. | Server self-test, not a production soak or browser resource proof. |
| [focused-model-lifecycle-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/focused-model-lifecycle-green.txt) | **15 passed, 0 failed:** character, mechanism, exact terminal transition and renderer disposal-interface checks. | Overlaps the 65-test checkpoint; do not add these totals. |
| [terminal-transition-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/terminal-transition-green.txt) and [teardown-contract-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/teardown-contract-green.txt) | **1/1 each:** independent reruns of the exact formerly failing Node regressions. | The full browser skipped-result and disposal scenarios remain pending. |
| [public-contract-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/public-contract-green.txt) | **6 passed, 0 failed:** complete maximum-depth runs across all four themes, public privacy/counts, presentation/recovery isolation and stable placement. | Focused Node run, not the complete Escape Room suite. |
| [server-green.txt](../../evidence/ai-escape-room/gauntlet/reviews/server-green.txt) | **4 passed, 0 failed:** malformed targets, browser assets/MIME types, evidence-route allowlisting and public state/replay privacy. | Handler-level integration checks, not a production network or security certification. |
| [browser-character-buffer-red.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-character-buffer-red.json) | **2 passed, 2 failed:** the two batched-camera corrections pass; character framing and GPU buffer cleanup fail in that run. | This is a failing browser batch and must not be reported as green. |
| [browser-resources-initial.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-resources-initial.json) | **1 passed:** geometry, texture and program counters stayed bounded in that particular repeated-theme test. | The later raw-buffer check found a leak that these counters could not detect. |

**The ten-case Gauntlet browser suite is ongoing. No final browser pass is recorded for this checkpoint.** The lead integration agent owns the completed report, exact commands, source identity and any remaining failures before final handoff. Earlier startup/protocol timeouts remain retained in [browser-rerun-timing-failure.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-rerun-timing-failure.json) and [browser-postfix-startup-blocked.json](../../evidence/ai-escape-room/gauntlet/reviews/browser-postfix-startup-blocked.json); they did not reach their correctness assertions and do not verify the fixes. The [independent integration review](../../evidence/ai-escape-room/gauntlet/reviews/integration-review.md) separates those failures from completed behavior checks. Do not sum overlapping reports or silently replace failed evidence with successful reruns.

Focused commands, after `npm run build`:

```sh
node --test tests/escape-room/*.test.cjs
node scripts/serve-escape-room-stream.cjs --self-test
npx playwright test --config=playwright.escape.config.cjs
```

The ten-case browser defect suite is `npx playwright test --config=playwright.escape.config.cjs tests/browser/escape-room-gauntlet.spec.cjs`. The wider isolated configuration also includes the stream, camera and evidence-pinning files. It uses one worker, port 4177, 120-second test timeouts and WebGL-only SwiftShader (`--use-angle=swiftshader-webgl`). Automatic trace screenshots are disabled to reduce host contention; explicit captures and action/DOM traces remain. Current fixtures deliver the same production frames in-page to avoid repeated cross-process response callbacks. Browser setup and a capture reproduction command are in the README.

## Next acceptance work

| Owner | Evidence required before acceptance |
| --- | --- |
| Lead integration agent | Complete and retain the current browser run, including raw buffer cleanup, both wall-side framing assertions, skipped-result intermission and full renderer teardown. Preserve the 65/65 Node and green self-test checkpoint separately. Bind later validation to the exact integrated source. |
| Scene/furniture builder and fresh visual critic | Address the largest Round 03 gap: give the dominant desk/chair/pedestal group individually proportioned construction, selective detail and convincing grounding; vary the mirrored shelving. A separate proposal is being developed in `/tmp` and is not part of the captured Round 03 checkpoint. Integrate only after review, then capture and judge the changed room. |
| Character/scene builders and integration critic | Keep the developed Archivist visible in the room overview and compose the result with a purposeful position near the exit. Refine the conspicuous hover cone and show an actual interaction state. Closeup acceptance does not resolve wide-view staging or pending wall-side browser assertions. |
| Mechanism builder and fresh visual critic | Preserve the now-developed vault silhouette and part hierarchy while improving shaped housings, component depth and differentiated material finish against the fixed safe/workbench references. |
| Scene/UI builders and fresh visual critic | Retain the improved portrait composition and readable controls. Verify navigation and focused mechanism access at 390×844; the accepted lateral crop in one still does not prove access to the full room. |
| Scene builder and integration critic | Give the open exit a destination with convincing spatial depth and compose the final character/door relationship. Preserve the now-tested durable success signal and the distinction between all locks open, actual escape and the next-room transition. |
| Lead and independent critics | Obtain independent output-wins verdicts for every important piece and the whole game before declaring victory; continue the loop while any important comparison still favors the reference. |

## Evidence and asset policy

Only actual renderer captures and completed runtime tests support acceptance. Source inspection, generated imagery, implementation claims and test counts cannot establish visual parity. A tie is not a win. SwiftShader runs do not establish hardware performance, GPU byte usage, a production soak or deployment readiness.

The application uses CC0 material maps from Poly Haven; [SOURCE.md](../../public/ai-escape-room/textures/SOURCE.md) and [sources.json](../../public/ai-escape-room/textures/sources.json) retain authorship, license and file provenance. Commercial comparison media is used only for evaluation. Root `.gitignore` excludes those downloaded media/HTML/contact-sheet files while preserving reference JSON manifests and the game's own captures/reviews for version control. Reproduce missing reference downloads from the manifest and verify their hashes before reusing the comparison set.

The existing review and capture artifacts remain immutable evidence for their rounds. New output uses a new capture label and a new review record; the progress page is the evolving index, not permission to rewrite prior results.
