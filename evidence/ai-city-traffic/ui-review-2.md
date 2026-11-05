# City / Flow — fresh UI closure review

**Reviewer:** independent UI closure critic; product source read only.  
**Review time:** 2026-10-30 20:54 UTC.  
**Candidate:** actual iteration-3 output captured at 20:49:43 UTC, with `sourceStable: true`.  
**Scope:** interface hierarchy, mobile occlusion, control affordances, accessible queue interpretation, feedback, and closure of the first UI review. No browser was launched by this critic; the lead's eight-test runtime run is separate and was still active at handoff.

## Verdicts

**UI specification: FAIL — one P2 queue-accessibility closure gap remains.** The supplied mobile overlay-plus-Experiment capture does not expose the busiest-junction numeric cue added for interpretation without color. The relevant label is placed underneath the sheet. Primary aggregate metrics and the main controls are visible, and the broader mobile layout is substantially improved.

**UI quality: FAIL — revise the queue fallback, then inspect the actual revised output.** The phone composition is now credible, but the open experiment state still does not show where its queue pressure is concentrated without color. A low-priority contrast issue also affects the unbacked masthead over dark buildings in Follow view.

These verdicts do not assert failures in unexecuted controls. The previous paused-speed and Escape defects are corrected in the inspected source; their runtime closure remains pending the lead's current browser run. No UI-specific P1 was demonstrated in this review.

**Commercial comparison: NOT ESTABLISHED.** This review did not demonstrate a commercial win over Cities: Skylines II, and the references were recognizable rather than blinded. No movement, animation quality, audio quality, sustained FPS, or touch accuracy can be passed from these stills.

## Evidence actually inspected

Viewed all six actual iteration-3 images using the image inspection tool:

- `public/ai-city-traffic/progress/captures/iteration-3-aerial.jpg`
- `public/ai-city-traffic/progress/captures/iteration-3-street.jpg`
- `public/ai-city-traffic/progress/captures/iteration-3-follow.jpg`
- `public/ai-city-traffic/progress/captures/iteration-3-night.jpg`
- `public/ai-city-traffic/progress/captures/iteration-3-mobile.jpg`
- `public/ai-city-traffic/progress/captures/iteration-3-mobile-experiment.jpg`

Also viewed the actual pinned reference images at `/tmp/city-traffic-references/mini-motorways-1.jpg` and `/tmp/city-traffic-references/cities-skylines-ii-3.jpg`. The former is a route-network scene without visible interface controls. The latter is a population information view with a contextual analysis panel and map legend; its usefulness here is information-layer hierarchy, not a directly matched traffic benchmark.

Read the Gauntlet specification, game PRD and audio/visual direction, repository Livestream HUD and Game Creative Direction skills, earlier `evidence/ai-city-traffic/ui-review-1.md`, actual earlier `ui-red-probe.json`, current HTML/CSS, relevant control/HUD/render portions of `main.mjs`, queue-overlay rendering in `world.mjs`, and the capture script/report. Current hashes of the four inspected product files exactly match the capture report. Every scene reports `marina-district-3` and simulation tick 366. This is a coherent source/output set.

The images were captured paused, with reduced motion enabled. Reported FPS values of 0 or 1.5 in these paused captures are not runtime-performance measurements.

## Closure of the previous UI findings

| Earlier finding | Closure assessment | Evidence and remaining limit |
|---|---|---|
| UI-01: excessive persistent mobile chrome | **Closed visually at 390 × 844** | Top tools finish around y=184; compact activity strip starts around y=656. The uninterrupted center is approximately 470 px instead of the prior approximately 290 px. Branding and redundant copy no longer dominate the center. A shorter phone was not captured in this set. |
| UI-02: small phone touch controls | **Source and visual revision accepted; runtime bounds pending** | Main tools, camera buttons, playback, speed buttons, panel close, demand input, and policy controls now have authored 44 px dimensions/minimums. The actual phone image is visibly less cramped. Exact browser bounds and touch operation belong to the active runtime check. |
| UI-03: legend hidden during Experiment | **Legend portion closed; non-color queue interpretation incomplete** | The queue legend is visibly present inside the mobile panel. The new numeric map cue is obscured in this state; see UI-06 below. |
| UI-04: paused speed toast says running | **Source corrected; runtime closure pending** | `setSpeed()` now selects `Speed set to N×. Resume to continue.` when paused. The old actual red probe remains historical evidence of the previous defect, not evidence of the new behavior. |
| UI-05: Escape blocked by focused controls | **Source corrected; runtime closure pending** | Escape is processed before the interactive-target filter, closes the panel, and returns focus to Experiment. Keyboard opening deliberately focuses the demand slider. A native help dialog takes precedence. Actual keyboard behavior still requires the lead's current test results. |

The open mobile panel now has a large close target, internal overflow, sticky heading, and sticky legend anchor in source. Its temporary coverage is a reasonable tradeoff for editable controls. The finding below concerns the missing queue information within that state, not a blanket objection to a phone sheet.

## Remaining P2: UI-06 — the only numeric junction cue is hidden behind the phone experiment panel

### Observed outcome

In the actual 390 × 844 Experiment-plus-overlay image, the legend reads “Junction queues / Clear / Busy,” but there is no visible junction queue count or location cue. The aggregate top metric reads 21. The experiment sheet covers approximately y=250–700; most active junctions sit behind it. The transient toast also overlaps the lower part of the sheet in this capture, but that is not the cause of the missing busiest-junction label.

### Source and deterministic corroboration

`updateQueueCallout()` selects a single busiest signal, projects it into the current camera, and positions a DOM callout at the resulting screen point. The CSS assigns `.queue-callout { z-index:-1; }`, below ordinary HUD cards in the HUD stacking context. It has no panel-specific alternative. If the selected junction falls outside the viewport guard, the label is hidden with no fallback.

Using the current compiled simulation at the capture's seed 11026 and tick 366, the first busiest signal is `j0`, with **3 queued vehicles**. Using the recorded mobile camera position `(212.5, 200, 237.5)`, FOV 45, aspect 390/844, and the source's projection height 0.4 projects its anchor to approximately **x=182.55, y=302.12**. That is inside the open panel's heading/upper-content area. This calculation is a source-based corroboration, not a browser visibility measurement. It explains the absence visible in the actual screenshot.

### Why this remains load-bearing

The game direction calls for labels/shapes alongside color, and the Livestream HUD criterion says color must not be the sole carrier of meaning. Keeping the gradient key is necessary, but the only local numerical explanation disappears during the exact task in which the player is adjusting demand and signals. The aggregate 21 says how much queueing exists across the city; it does not identify its concentration. A source-level callout element is insufficient when the actual composition hides it.

### Requested correction

Keep a compact numeric queue summary available within the open mobile panel when the overlay is active, derived from the same snapshot. Retain a meaningful visible cue when the busiest junction is outside the visible city region. The implementation can choose a small panel summary, an unobscured callout/fallback, or an equivalent solution; it should avoid requiring color alone or placing a label over a control. The normal map label should remain available after the panel closes.

### Focused acceptance evidence

Capture overlay on with Experiment open after the toast expires, then close the panel and capture the same state. Verify the displayed busiest count equals the authoritative snapshot and that a viewer can identify the pressure without needing the green/amber distinction. Check an offscreen busiest junction or deliberate camera pan so the fallback is exercised. Use real layout/visibility evidence rather than `hidden === false` alone, because an element may be present yet covered.

## P3: UI-07 — Follow-view masthead loses contrast over the tower

The actual iteration-3 Follow image places the dark green CITY / FLOW mark, kicker, and district text over a dark blue-green building at the upper left. They become nearly invisible. The primary statistic and control cards retain their light backgrounds and remain readable, so this is lower priority than UI-06.

The masthead uses direct text with a minimal drop shadow and has no adaptive backing for daytime camera movement. A restrained backing/scrim or consistent light/dark treatment would preserve identity across camera positions. Reinspect the same actual Follow angle after any change; a night-only rule is insufficient for this daytime scene.

The lower-left explore hint is also very faint against some daytime street surfaces. It is supplementary guidance rather than a missing control, so it is included as the same contrast-polish category, not promoted to a separate blocking finding.

## Reference-grounded quality observations

The candidate now preserves a coherent hierarchy in its real phone view: title/state, four compact metrics, scene tools, a large city area, a short activity strip, and a two-row control dock. Selected controls have more than color alone: filled areas, labels, and icons. The desktop cards and main toolbar remain distinguishable in aerial, street, Follow, and night images. These are meaningful improvements.

The supplied Mini Motorways scene makes routes, vehicles, destinations, and the motorway easy to trace with strong separation and restrained visual density. It supports a route-readability comparison only; it contains no control UI from which to infer better touch controls, keyboard behavior, or panel design. City / Flow's scene is much denser and uses a different perspective, so those should not be scored as equivalent workloads.

The Cities II information view retains a legend beside the active layer and subdues background detail to keep the measured categories salient. City / Flow now retains its mobile legend, but its open panel hides its only numeric spatial cue. That is the actionable information-hierarchy comparison; it does not establish overall superiority or parity with Cities II.

## Handoff

Return UI-06 to the UI builder, with UI-07 as polish while editing the same presentation layer. The lead's browser test output is expected at `/tmp/city-traffic-browser-tests-3.log`; it was still active when this report was finalized. Update the prior functional closures only from its actual results. Obtain a fresh panel-open/panel-closed mobile capture after the queue fix, then use a fresh critic for the remaining closure. No product source was edited by this reviewer.

### Candidate fingerprints

| File | SHA-256 |
|---|---|
| `public/ai-city-traffic/index.html` | `d0662d2a2366ec6c39b9fc8f1f595ebbedf788ed5f1cf5fbc3c2d2bf67d3002a` |
| `public/ai-city-traffic/styles.css` | `c19b438144c257ec991d6c15bce524448a6964469cc493ca311d02ecc529d73c` |
| `public/ai-city-traffic/main.mjs` | `e0dc50b8e579baffb2e7c76caeab5a15c4e9ee1c3a46592ee5c6dd0cd9fefe1b` |
| `public/ai-city-traffic/world.mjs` | `2057b018c7be23c37c6b986a99f653477e2af06335a76095e8c621f779d1555a` |
