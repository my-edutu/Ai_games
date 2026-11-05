# City / Flow — independent UI-08 visual closure

**Reviewed candidate:** iteration-4 captures, recorded 2026-10-30 at 21:24:19 UTC, including the UI revision 5 junction camera change.  
**Reviewer role:** fresh independent visual critic; no product files changed and no browser launched by this reviewer.  
**Scope:** whether the View result reveals J0 and its immediate approaches at 390 × 844 and 320 × 700, with readable queue information and unobstructed critical controls. This is a closure review of the earlier tower-occlusion finding, not a new complete UI, accessibility, or commercial-quality certification.

## Verdict

**UI-08: CLOSED — scoped visual PASS at both requested phone sizes.** The earlier captures place the J0 label over a foreground tower and hide the selected crossing. The new captures expose the crossing from almost directly above: its road surface, crosswalk boundaries, approach lanes, direction arrows, and nearby vehicles can be inspected. Neither a tower nor the persistent queue card covers the selected intersection. The queue summary, View action, and bottom control dock remain readable and visually separate.

**Remaining P1/P2 findings demonstrated within this visual scope: none.** At 320 px the lower queue card cuts off the farther part of the southern approach and some vehicles below it. The immediate approach remains visible between the southern crosswalk and the card. This limits how much of a long queue can be inspected in one frame, but it does not reproduce the earlier failure or prevent understanding the junction. The callout also covers a small portion of the upper crossing area; enough crosswalk and road structure remain visible to identify the correct intersection and trace each approach.

This verdict closes the specific visual defect from `evidence/ai-city-traffic/ui-final-review.md`. It does not upgrade the earlier UI revision 4 interaction tests into fresh UI revision 5 test results. A post-change interaction rerun belongs to the lead's separate evidence.

## Evidence opened directly

I opened the following original files with the image inspection tool at their actual dimensions:

| Evidence | Purpose |
|---|---|
| `evidence/ai-city-traffic/ui-final/390-view-junction.png` | Reproduce the original 390 px obstruction visually. |
| `evidence/ai-city-traffic/ui-final/320-view-junction.png` | Reproduce the original 320 px obstruction visually. |
| `public/ai-city-traffic/progress/captures/iteration-4-junction-390.jpg` | Inspect the new 390 × 844 View result. |
| `public/ai-city-traffic/progress/captures/iteration-4-junction-320.jpg` | Inspect the new 320 × 700 View result. |
| `public/ai-city-traffic/progress/captures/iteration-4-mobile-experiment.jpg` | Check the visible numeric summary and View action in the open panel. |
| `public/ai-city-traffic/progress/captures/iteration-4-mobile.jpg` | Check the surrounding default mobile layout. |
| `/tmp/city-traffic-references/mini-motorways-1.jpg` | Compare the narrower principle of traceable road/vehicle information. |

I also read the prior review, iteration-4 capture report, capture script, approved Gauntlet specification, active ledger, and repository Livestream HUD and Game Creative Direction skills. The review applies their readability and unobscured-gameplay principles; it does not claim their wider comprehension, compression, or production gates have been met.

## Visible comparison

### Before: selected geometry hidden

In both original PNGs, the front glass tower fills the area under the centered **J0 / 3 queued** label. Nearby road fragments are visible beside the tower, but the selected crossing cannot be identified on the ground. A correctly centered label therefore fails to supply an inspectable destination. The original review's P2 is supported by the actual pixels.

### After: 390 × 844

The new image places the selected crossing around the middle of the screen. The northern road runs down between the buildings into the crossing; the east and west roads continue horizontally to the image edges; the southern road continues below the crossing toward the queue card. Zebra stripes, lane arrows, stop markings, and multiple vehicle silhouettes are legible. The buildings occupy the four surrounding blocks instead of standing between the viewer and the intersection.

The approximate selected crossing region is y=360–485. The persistent queue card begins around y=610, leaving a visible stretch of the southern approach below the crosswalk. The **J0 / 3 queued** callout has a small pointer into the exposed road area. It no longer reads as a label attached to a roof. The card separately retains **J0 · Northwest**, **3 queued**, the Clear/Busy legend, and **View**. Top metrics and tools, the camera choices, pause, speed, and Experiment controls remain visually unobstructed.

### After: 320 × 700

The narrower image preserves the same overhead relationship. The crossing occupies approximately y=300–400. The north approach is readable above it; the side approaches, directional arrows, and vehicles remain visible across the frame. The south approach extends from the lower crosswalk to the queue card at approximately y=465. Thus all four directions are traceable through exposed road segments, even though the card shortens the southern context more than it does at 390 px.

The map callout overlaps part of the upper crossing area, but the road opening, lateral crosswalks, and southern crosswalk remain exposed. No critical control is covered. The persistent card's location, number, and View action are legible. The bottom dock remains within the screen with separate camera, pause, and speed controls. Experiment is represented by its compact icon at this width; its accessible name and hit target are interaction questions outside this pixel check.

### Open panel and normal mobile context

The latest Experiment capture visibly retains **J0 · Northwest / 3 queued** and a View action inside the sheet. Its close control, demand slider, rush-hour control, and signal-timing choices remain readable. The ordinary mobile image leaves a substantial central city view between the top information/tools and the activity strip/dock. These observations corroborate that the junction camera fix fits the existing layout. A still cannot establish scrolling, focus return, Escape, or click behavior.

## Diagnostics and provenance

`public/ai-city-traffic/progress/captures/iteration-4-report.json` records **14 scenes**, `complete: true`, an empty errors array, and `sourceStable: true`. Both junction scenes report `webgl: true`, `failed: false`, paused rendering, reduced motion, traffic overlay enabled, pixel ratio 1, and simulation tick **364**. Both show 40 active vehicles and aggregate queued count **22**. The older comparison images were captured at tick 363; this is a one-tick difference, not an identical-state claim.

| New view | Recorded camera position | Recorded camera target |
|---|---|---|
| 390 × 844 | approximately (-72, 172.41, -70.28) | (-72, 0, -72) |
| 320 × 700 | approximately (-72, 174.28, -70.26) | (-72, 0, -72) |

The target matches J0's previously verified ground location. The positions corroborate the near-vertical framing visible in the images; they are not a substitute for the pixel inspection above.

The capture script uses the visible overlay and Experiment buttons, then clicks `#queue-focus` before each junction capture. The report's scene completion and actual output provide recorded capture evidence of that route. I did not execute those interactions myself. The report stores the number of signals rather than the per-signal rows, so the present **3 queued** is verified here as visible UI text, with its earlier truth check attributed to the previous UI review. I do not claim a fresh independent comparison of that number to the tick-364 signal snapshot.

I freshly recalculated all eight recorded source SHA-256 hashes and matched them to the iteration-4 report. In particular:

| Source | SHA-256 |
|---|---|
| `public/ai-city-traffic/main.mjs` | `f049a496982483ab70b2b77eadc8f5768b86c46a6ff3c207563b985244365d6f` |
| `public/ai-city-traffic/world.mjs` | `549980ee6c365d8a5cb03eb0b9ed232bc7a5a6b438e7a62150cfe9879e84b09e` |

The two closure images were independently checked as 390 × 844 and 320 × 700. Their SHA-256 hashes are `3db8ac1afad4ae491d53c4c937dcfbeddbed90e8ffb25ac55ee416a7a6bb4822` and `37cbfdb7f118cb903d12baaa631c0a9488684b4cfb4f1ad259cadb394dd84a48`, respectively.

## Reference comparison and limits

The inspected Mini Motorways still separates the road network, colored vehicles, destinations, and numbered motorway so a viewer can follow connections. The new City / Flow View result now meets the local requirement supported by that reference: its queue cue leads to a traceable part of the network. City / Flow retains denser architecture, shadows, and larger persistent chrome, so this does not establish equal overall congestion readability or a commercial win.

That reference contains no visible external control UI. It cannot substantiate claims about button size, panel usability, keyboard behavior, or control parity. No such claim is made here.

The previous independent UI review recorded **40 passing mechanical checks** and **1 passing dedicated mobile test** before the junction camera change. They remain historical evidence, not fresh passes from this review. This review supplies the missing visual occlusion check. It does not measure real-device touch accuracy, screen-reader behavior, mobile GPU performance, queue motion, transitions, audio, long queues across other seeds/junctions, or uninstructed viewer comprehension. The paused FPS value is not performance evidence.

**Handoff:** UI-08 is visually closed for the recorded J0 state at both required phone sizes. The lead should retain this report alongside the separate post-change interaction result and keep wider benchmark status independently scoped.
