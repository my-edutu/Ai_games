# Game 11 — independent UI/control/progress critic

**Review time:** 2026-10-30 20:37 UTC  
**Candidate:** working tree at `/workspace/scratch/f951d9074684/ai-games-city-traffic`; actual iteration-2 captures dated 20:34:25 UTC.  
**Role:** independent critic; no product code changed.  
**Status:** provisional, returned to builder for another round. Root's functional browser run is still pending. No browser was launched by this reviewer, avoiding contention with that run.

## Verdicts

**UI verdict: REVISE.** The desktop composition has a coherent visual hierarchy and the main controls are identifiable in the real images. The phone composition gives too much persistent space to secondary information, and its touch controls are unnecessarily compact. A passing functional or accessibility verdict cannot be inferred from these images or from listener wiring.

**Commercial-win status: NOT ESTABLISHED.** Neither the UI review nor the supplied captures demonstrate a win against Cities: Skylines II. The recognizable reference products were reviewed openly; this was not a blind A/B test. Mini Motorways was used only for route and traffic readability, since its supplied still has no control interface to evaluate.

**P1:** No new UI-specific P1 functional failure has been demonstrated by the evidence this reviewer actually inspected. Runtime functionality, audio, performance, and browser recovery remain outside this provisional verdict. This is an evidence limitation, not a pass.

## Evidence actually inspected

Viewed full actual images with the image inspection tool:

- `public/ai-city-traffic/progress/captures/iteration-2-aerial.png` — 1920 × 1080, paused daytime aerial, experiment panel open.
- `public/ai-city-traffic/progress/captures/iteration-2-street.png` — 1920 × 1080, paused street perspective, experiment panel open.
- `public/ai-city-traffic/progress/captures/iteration-2-night.png` — 1920 × 1080, paused night aerial, experiment panel open.
- `public/ai-city-traffic/progress/captures/iteration-2-mobile.png` — 390 × 844, paused daytime aerial, experiment panel closed.
- `/tmp/city-traffic-references/mini-motorways-1.jpg` — official scene with clearly differentiated roads, vehicles, destinations, and a motorway; no controls interface.
- `/tmp/city-traffic-references/cities-skylines-ii-3.jpg` — actual population information view, with a map legend, contextual analysis panel, subdued background, and explicit data layers.

Read `index.html`, `styles.css`, the UI/control/camera/HUD sections of `main.mjs`, `audio.mjs`, the iteration-2 capture report, and progress-page HTML, JS, and JSON. Applied the repository's Livestream HUD and Game Creative Direction review criteria. Consulted Production Readiness Review for evidence discipline; this is not a full readiness assessment.

The capture report has no listed errors, but every inspected scene is paused and its FPS value is zero. Those values cannot establish runtime performance. Desktop reports `marina-district-1`; mobile reports `marina-district-2`. Root says the marker changed after functional world code settled. The next immutable set should still carry uniform hashes and versions. The report's street-camera height is 12.5004, while current `setCamera('street')` specifies 8.5; this may be OrbitControls clamping or a changed source. It needs explanation rather than an assumed match.

## Largest concrete gap returned to builder

### UI-01 — P2 — phone layout subordinates the moving city to persistent secondary content

**Observed:** In the actual 390 × 844 capture, the branding/district/metrics stack occupies the top through approximately y=205; tools and compass extend down to y=277. The activity card runs roughly y=567–699, and the two-row control dock occupies y=728–830. Only about 290 vertical pixels form a completely uninterrupted central city region. Parts of the city remain visible around other overlays, so this is not a claim that the canvas is unavailable. It is a salience problem: the viewer sees a very prominent activity card repeating a broad objective and a small, visually dense road network.

The mobile metrics labels and supporting text are 6–8 px in several places. The visible city is made of similarly colored buildings and roads; vehicles and queues become small details. This weakens the immediate ability to find the pressure point and watch a change affect it. Mini Motorways' supplied scene makes the route network and vehicle/destination categories apparent through consistent high contrast and low clutter. Its lack of visible controls does not justify claiming a control-usability advantage.

**Affected selectors:** the `max-width:650px` rules for `.masthead`, `.district-label`, `.stats-panel`, `.scene-tools`, `.intent-card`, `.control-dock`, and `.camera-controls`; the compact-height mobile rule compounds the same layout.

**Revision requested:** make the activity card compact or contextual on phones; preserve prominent flow/queue information while reducing repeated branding and explanatory copy; use a deliberate minimum clear city area. Keep primary actions reachable without giving the whole lower third to persistent chrome. Opening Experiment should create an intentional temporary control state that can be dismissed easily.

**Retest:** actual 390 × 844 and shorter phone captures, panel closed/open, normal traffic and high demand, plus overlay on. Verify that a viewer can locate a busy junction and a meaningful traffic response without needing to zoom around hidden city areas. A screenshot alone cannot prove touch accuracy.

This is the priority UI revision for the next builder round.

## Other findings

### UI-02 — P2 — mobile touch targets are compressed despite available layout space

**Observed/source-backed:** The pictured phone dock uses small playback controls. CSS sets scene tools to 36 × 36 px, pause to 34 × 34 px, speed buttons to 30 × 32 px with 1 px gaps, and the experiment panel close button remains 23 × 23 px. The demand input's entire box is 20 px tall, with a 14 px WebKit thumb. These are actual authored dimensions, not runtime bounding-box measurements. They make neighboring speed options and the slider harder to operate by touch; the small close target is especially unfortunate for a panel that will obscure the city.

**Affected selectors:** `.icon-button`, `.play-button`, `.speed-controls button`, `.speed-controls`, `.panel-close`, `input[type=range]`, slider-thumb rules.

**Revision requested:** increase touch hit areas and adjacent-control spacing, targeting at least 44 px for the principal phone actions, without requiring the visible glyphs to grow proportionally. Enlarge the slider's interactive height. This is a product usability recommendation, not an asserted automatic WCAG failure.

**Retest:** record real element bounds and use actual pointer/touch actions at phone size, including the demand slider and closing the experiment panel.

### UI-03 — P2 — mobile experiment mode hides the traffic legend

**Source-backed, runtime visual confirmation pending:** `styles.css` explicitly sets `.hud[data-panel-open=true] .overlay-legend { display:none }` under `max-width:650px`. The legend otherwise labels the green-to-amber junction queue scale. A player exploring demand or signal timing loses that key while using the relevant controls. The overlay control stays available, so this is not an unavailable-mode issue; it is missing context during the experiment.

The inspected Cities II information view keeps an explicit legend beside its active data layer. That comparison is meaningful for interpretation of data layers; it does not establish that its entire interface is superior. Mini Motorways' scene also differentiates route categories directly. In the candidate the default view supplies only an aggregate queue number, so an understandable overlay is valuable.

**Revision requested:** retain a compact key inside or adjacent to the experiment panel when the overlay is active. Ideally give busy junctions a non-color cue or count so their meaning does not depend solely on the gradient.

**Retest:** actual mobile overlay-on plus Experiment-open screenshot; check grayscale interpretation if spatial queue severity is intended as critical information. No claim about the actual overlay rendering is made until that screenshot is inspected.

### UI-04 — P2 candidate — speed confirmation contradicts paused state

**Source hypothesis; runtime confirmation required:** `setSpeed()` always says `Simulation running at N× speed.` It does not inspect `paused` and does not resume the simulation. A speed click while paused should therefore leave PAUSED visible but announce that the simulation is running.

**Location:** `main.mjs`, `setSpeed()` (approximately lines 207–213 in inspected source).

**Revision requested if reproduced:** use `Speed set to N×. Resume to continue.` when paused, or neutral wording valid in both states.

**Retest:** pause, select 2× through the real button, record toast/label and unchanged simulation tick.

### UI-05 — P2 candidate — Escape does not close the experiment panel from its focused controls

**Source hypothesis; runtime confirmation required:** the global keydown handler returns when the event target is a button, input, link, or other editing element, before reaching its Escape branch. Experiment opens from a button without moving focus into the panel, and any focused slider or policy control meets the same early-return condition. Escape handling exists in source but appears unreachable during ordinary keyboard use of the panel.

**Locations:** `main.mjs` global keydown handler (approximately 566 onward), `setPanel()`, and experiment-toggle click listener. Native help-dialog Escape behavior is a separate matter and is not alleged to be broken.

**Revision requested if reproduced:** handle Escape before filtering interactive targets; return focus to the opener when closing. On keyboard opening, choose a deliberate useful focus destination.

**Retest:** tab to Experiment, press Enter, press Escape; repeat with focus on demand and policy controls. Verify the panel closes and focus returns to its opener without toggling unrelated controls.

## Positive observations and limits

The real desktop images show readable primary totals, consistent selected-control styling, and a restrained palette. Aerial, Street, Follow, playback, and Experiment have distinguishable groups. Paused status appears both in the upper state label and the activity card, and the pause button becomes a play icon. Day/night control state is visually consistent in the inspected night capture. The central street remains visible between the desktop cards. These are visible properties, not proof that every action works.

Source wiring exists for the visible controls, help, restart, camera, sounds, and failure display. Code exposes truthful snapshot-derived counts and optional-audio error state. None of those facts substitutes for executing the controls. No audible sound was heard in this review, so audio quality and interaction cues have no independent pass here.

## Live progress page

The source at review time declares `NOT VERIFIED` for the commercial bar and `productionReady: false`; these are appropriate. It polls JSON every four seconds and provides a fallback message on update errors. Its capture list is still empty even though the four images are now available. As the integration is in progress, this is an unfinished publication step rather than a discovered broken live page.

Before presenting it as the completed live journal, populate the actual captures, add this critique and the next revision, remove obsolete current-state copy that says candidate review is pending, and preserve historical findings as historical. Its Mini Motorways reference role currently says `Interface and congestion readability`; the inspected still supports route/congestion readability only, not interface-control behavior. No progress-page screenshot or refresh behavior was inspected here.

## Evidence fingerprints

At 20:37 UTC, SHA-256:

| Artifact | SHA-256 |
|---|---|
| index.html | `83c04bfd27be528575bca184264fc0aadafafeb421ea996053e2f5db1a196136` |
| styles.css | `ddd7192fd020c6dba70d7be714fa31b2275d76923d3d949c617b5a646995b809` |
| main.mjs | `0ba82a51ef042c4a4bb3ab132770596b786fd039b279ac06a6c93cc1016a40df` |
| audio.mjs | `9b797345abccb9b2a86bf4f49b9f8173349a88315ed0896361e22a7391d87eac` |
| iteration-2-aerial.png | `8c3f74adbf9dd2bacddf982a0325e1347e7e9ab15d1714374b0bdedb2db37c29` |
| iteration-2-street.png | `9f33c0917679ae75f78927793f36a4608f31aeb1d3fbeae10a99cd2ff8f272e1` |
| iteration-2-night.png | `9ada4f96e8e18ddf76b3654381dceb20a7bb0d2d16dfc01823bb1dc4f89961dd` |
| iteration-2-mobile.png | `f33445a9ad61a1d50afc80e69037519193ceec087184b7d036b1625b663b87c4` |

## Handoff

Root received the mobile-salience gap and exact selectors before this report. Send UI-01 through UI-03 to the UI builder now; reproduce UI-04/UI-05 in the active functional run before classifying them as demonstrated failures. A fresh closure critic should inspect the revised real screenshots and interaction results. Keep UI and commercial-win verdicts separate.
