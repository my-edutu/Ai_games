# Game 3: gameplay clarity, scenes and cast

## Outcome

The user asked to keep improving Game 3 while removing excess gameplay text. Three independent critics preferred the new complete image in a randomized blind comparison with the previous committed Foundry capture. The official [ASTRO BOT — Rising Heat](https://gmedia.playstation.com/is/content/SIEPDC/global_pdc/en/games/pdps/a/as/astro-bot/dlc/video/astro-bot-dlc-05-rising-heat-en-29oct24.mp4) reference still wins their source-known comparison for action, route composition and environmental depth. There is no overall benchmark or live-motion pass.

The game now keeps compact floor/height, icon vitals and seven accessible controls at the edges of the view. Optional Details contains intent, milestones, connection information and the control guide. The scene frames local encounters, reduces the Foundry furnace's dominance and marks only the actual active landing with contrasting top corners. The cast has clearer hostile equipment, destination-aware hero eyes, camera-aware reaching hands and bounded damage recoil.

Three build/review passes returned real output failures to separate builders. The final scoped reviews accept the HUD corrections, separated airborne hand, correctly sampled strike silhouette and distinct guardian hammer. The new phone frame is preferred in blind comparison and communicates the actual upward-left direction; confidence in the exact landing remains low. The upper cap still crowds the nearby guardian's crown. These are open findings in the journal, not a completed commercial-bar win.

## Evidence and independent review

The comparison used the same unmodified authoritative tick118 at 960×600. Randomized image **A** was the new candidate, **B** the previous committed image. Each critic locked a preference before reading source or learning identities. All three chose A with approximately0.90 confidence. Camera, cast and HUD changed together; this is a whole-image preference, not an isolated attribution.

Thirteen actual browser captures were saved across desktop, independent default-low portrait, genuine airborne state, nearby guardian, upgrade/result, optional details and retained rendering delay. All reported zero page/GL errors. The first five captures span one documented source change: the landing-cue cache key gained `worldWidth`; reversing exactly that prefix reproduces the initial hash, and all fixtures have the same world width. The additional eight captures have identical initial/final presentation hashes.

Published evidence is in [`12-verification.json`](../../public/infinite-tower-climb/gauntlet/evidence/12-verification.json), [`13-verification.json`](../../public/infinite-tower-climb/gauntlet/evidence/13-verification.json) and the final [`14-verification.json`](../../public/infinite-tower-climb/gauntlet/evidence/14-verification.json). The live journal at `/tower/gauntlet` has a selectable capture gallery and retains earlier failures. Raw captures and separate critic reports remain in the working evidence directory.

The second pass saved ten of eleven requested images with stable source hashes and no page/GL errors; the high-quality desktop Ruins screenshot timed out. The final pass saved six images at identical presentation hashes: both phone jump directions, the nearby phone guardian, a desktop stepped strike, high-quality Foundry and explicitly low-quality desktop Ruins. An interrupted first capture process saved two of six views; two separate tail batches completed the remaining four and closed their owned resources. The low-quality Ruins image does not establish a high-quality pass.

### Final independent judgments

| Area | Evidence | Scoped judgment |
| --- | --- | --- |
| HUD | Blind caption comparison, actual upgrade/recovery images, layout/accessibility cases and lifecycle checks | Candidate preferred. Captions and upgrade cards no longer overlap; known danger survives recovery; stable control names and independent six-second feedback pass. |
| Phone scene | Blind same-state tick 379 comparison, locked before identities were disclosed | Candidate B preferred. Upward-left direction matches `f1:p3`; directional confidence 0.52, exact-landing confidence 0.35. The lower deck still competes. |
| Cast | Separate blind pose comparison, opposite-direction phone capture, timed strike and guardian evidence | Candidate A preferred at about 0.80 confidence. Hand/head/pack separation, the 100 ms forward jab and hammer grip/shaft/head separation pass for these supplied views. |
| Desktop scene | Source-known final Foundry high and Ruins low captures | No immediate blocking composition regression. Foundry hero/sentinel are fully visible on the shared deck. Ruins retains wide separation and a competing lower landing. |
| Code | Independent diff review, frozen-input/camera/marker probes and lifecycle checks | No blocking correctness findings. Eight frozen snapshots, 144 finite camera poses, four reused marker updates and four lifecycle cases pass. |

The two blind pair keys differ because each comparison was randomized separately. Static preferences cannot establish full motion, impact synchronization, phone strike readability or complete cast coverage.

### Truthful limits

- Held authoritative snapshots establish appearance. They do not establish moving camera quality, animation continuity, gameplay feel or frame rate.
- The tick11 floor8 warning is a **shooter** telegraph; the guardian is far above. The later tick272 proximity capture contains the actual nearby guardian.
- A long-held `attacking` snapshot outlasts the hero's edge-triggered strike. A separate capture accepts the real tick118→119 transition and executes one renderer callback before holding the image. It establishes a stepped attack pose only.
- The retained-delay capture pauses renderer callbacks after real pixels exist while ordinary polling and the production stale-render timeout continue. It verifies that recovery notice's layout, not spontaneous driver-stall recovery.
- Guardian and upgrade inspections explicitly start at floors8 and3. They are inspection scenarios, not claims of default-run achievement.
- The sentinel's authoritative threat is contact overlap. Its rules do not emit a sentinel telegraph; no live sentinel-telegraph claim is made.
- Software-renderer frame intervals remain slow. The captures do not establish a hardware or mobile performance budget pass.

## Critic findings and resulting changes

| Area | Observed gap | Result |
| --- | --- | --- |
| Phone camera | A real wide jump reduces hero height to about 6% and clips much of the destination. | Bounded oblique framing makes the hero about 15.5% of the same viewport height. Real direction is more legible; exact-landing priority remains open. |
| Nearby guardian | An upper platform hides the guardian's head. | Thinner front fascia preserves the real platform top/extents and reveals the face. Crown clearance remains incomplete in the phone proximity image. |
| Cast | Mauls resemble block fists; the rising hand merges with the helmet or hides behind the body. | Separate grip, shaft and head; actual view angle selects a visible reaching arm. The inspected guard/jump silhouettes pass. |
| Health bars | Opaque fill is covered by transparent backing. | Both elements now use explicit transparent draw ordering; actual captures and a Three.js render-list regression show the fill. |
| Captions | Upgrade card overlaps captions in portrait and short landscape. | Shared flowing event layout preserves separate measured rectangles, including multiline content. |
| Recovery | Known Guardian/Danger disappears during retained graphics delay. | Phase and recovery coexist; stale transport state is labeled Last known. Genuine upgrade/result data stays available. |
| Controls | Changing action labels conflict with pressed-state semantics; healthy polling clears failures immediately. | Stable setting names, keyboard tooltips and replaceable six-second feedback with timer/disposal coverage. |

The details panel and normal result capture are readable and in bounds. The short retained-delay notice leaves the scene visible. Short-landscape card readability does not establish that a moving protagonist is unobstructed in that layout.

## Verification status

The final build, all **129 Tower logical tests** and the stream-host self-test pass. All **19 browser cases pass** across two nonoverlapping invocations: seven new HUD layout/accessibility cases and twelve real WebGL/stream cases. The latter includes repeated context loss with intervening floor changes, preserved camera/quality/motion preferences, advancing renderer submissions and zero final GL errors. The focused final builder checks were cast 11/11, composition/world/resources 21/21 and HUD/client/presentation 32/32. These overlap the full logical suite and are not additive totals. `git diff --check` passes.

The initial final browser launch was blocked from binding port 4186 by the restricted executor; no test ran in that attempt. Its log is preserved separately, and the run with local-server permission is the actual browser gate. Two new remote CI-only commits were inspected and fast-forwarded without replacing any working presentation edits. They add a reproducible input artifact workflow; an artifact itself is not a pass verdict.

The working environment briefly disconnected during the final HUD review write. On recovery, all presentation edits, thirteen captures and manifests were verified intact. The critic completed the interrupted report write; no failed or incomplete output is counted as a pass.

## Remaining acceptance work

The next visual comparison should establish the exact intended landing without competing decks and expose more of the nearby guardian's crown at the same authoritative positions. Continuous normal-speed footage on an adequate graphics host is still required for motion, attack timing, camera transitions and intended-device performance. Preserve authority, immutable snapshots, replay, bounded resources, one renderer/RAF and real context-restoration behavior. Keep draft PR #58 and the live journal reviewable; these visual iterations do not establish production readiness.


## Bounded software-renderer cost probe

A separate agent held the browser lease and tested pinned committed source at 390 × 844, DPR1, low quality, with the same real tick118 snapshot. Each variant ran once, with20 sampled callbacks after readiness and five warmups. Geometry remained77 draw calls and164,320 triangles.

| Variant | Callback p50 | Callback p95 | Worst |
| --- | ---: | ---: | ---: |
| Existing low quality | 818.1ms | 1467.8ms | 1611.0ms |
| Reflection sampling omitted | 434.4ms | 878.4ms | 1007.4ms |
| Reflection and stone relief sampling omitted | 415.7ms | 720.4ms | 955.6ms |

Reflection sampling is a useful candidate for further low-tier work. The visual tradeoff was darker, flatter metal; removing relief further flattened stone without improving the mean callback interval. The single serial experiment has shared-host load, caching and ordering confounders, and used older pinned presentation source. No production quality policy changed from this result.

The attempted `gl.finish()` boundary did not establish GPU completion: its call duration stayed near zero despite long callback gaps. Historical raw field names are explicitly corrected in the [preserved data](../../public/infinite-tower-climb/gauntlet/evidence/13-render-cost-probe.json). Screenshots establish final pixels only. The probe had zero page/GL errors and closed its owned browser/server. This is not a smooth-motion, hardware-FPS or leak-free result.

## Attack sample timing correction

The initial capture harness description incorrectly assumed a50ms character delta cap. The scene caps at500ms and the character wrapper at100ms. One paused callback can therefore sample100ms; two can sample200ms, within recovery. The historical `sentinel-strike-peak` filename does not prove peak extension. Raw/public records preserve the images and hashes while correcting that interpretation. The confirmed rising-arm issue is separate: the actual oblique camera hides the far arm behind the body.
