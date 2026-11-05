# Independent visual review — Game 11, iteration 2

## Verdict

**Cities: Skylines II wins the visible scene and character/vehicle fidelity comparison. The requested benchmark has not been met.** Transport Fever 2 also wins the supporting street-detail comparison. Mini Motorways remains clearer at communicating routes and destinations in its pinned still, although its top-down, low-detail presentation is not a fidelity benchmark.

This is a direct, non-blind pixel review. Provenance is recognizable from the interface and rendering styles; no blind-test result is claimed. No product code was modified.

## Inspected evidence

Actual output, opened as images:

- `/workspace/scratch/f951d9074684/ai-games-city-traffic/public/ai-city-traffic/progress/captures/iteration-2-aerial.png`
- `/workspace/scratch/f951d9074684/ai-games-city-traffic/public/ai-city-traffic/progress/captures/iteration-2-street.png`
- `/workspace/scratch/f951d9074684/ai-games-city-traffic/public/ai-city-traffic/progress/captures/iteration-2-night.png`
- `/workspace/scratch/f951d9074684/ai-games-city-traffic/public/ai-city-traffic/progress/captures/iteration-2-mobile.png`

Pinned references, opened as images:

- `/tmp/city-traffic-references/cities-skylines-ii-4.jpg` — neighborhood, architectural variation, street/lot grounding.
- `/tmp/city-traffic-references/cities-skylines-ii-5.jpg` — actual citizen-inspector gameplay, citizen silhouette and vehicle body/material detail.
- `/tmp/city-traffic-references/transport-fever-2-1.jpg` — avenue, vehicles, citizens, crossings, infrastructure.
- `/tmp/city-traffic-references/mini-motorways-1.jpg` — route/destination hierarchy.

Context read: `evidence/ai-city-traffic/reference-manifest.json` and `public/ai-city-traffic/progress/captures/iteration-2-report.json`. Geometry counts, model counts and implementation comments were not used as evidence of visual quality.

## Criteria and observations

| Criterion | Visible assessment |
| --- | --- |
| Architectural variation and depth | **Reference wins.** City Flow repeatedly uses near-identical window grids, pale wall slabs and red pitched roofs. The street view gives the nearest buildings very large screen coverage, exposing flat dark window panes and repeated frontage treatment. Cities II has more distinct roof forms, setbacks, lot boundaries and surface response. |
| Street grounding and infrastructure | **Reference wins overall.** City Flow has readable curbs, zebra crossings, traffic lights, lamps, parks and waterfront edges. These are real visible strengths. TF2 has a more convincing street cross-section, deeper building bases, richer surface definition and more naturally integrated traffic and pedestrians. |
| People and vehicles | **Reference wins visible silhouette/material quality; close-detail completeness remains unverified.** City Flow visibly includes people with separate limbs and a walking pose, plus several vehicle types. Foreground citizens still look segmented and the bus has a simplified block-like body. The references show more natural human proportions/clothing and stronger separation of body panels, glazing, wheels and trim. The Cities II citizen-inspector view is substantially closer, so absent fine facial detail cannot fairly be treated as proof that no such detail exists. |
| Road and congestion readability | City Flow's dark roads, white crossings and pale blocks make the grid easy to locate. Its still does not visually explain destinations or individual routes as directly as Mini Motorways. The summary counters establish current quantities, not the spatial cause of congestion. A route overlay was not captured. |
| Night | The night image is legible and lit windows are visible. It largely reads as a darker version of the daylight scene, with limited visible pools of street lighting. No matched night reference was supplied, so night benchmark superiority is **unverified**. |
| Mobile | The layout fits the portrait frame, but the large top and bottom panels leave a narrow central area for the city. Vehicles and people are extremely small there. This frame does not establish touch usability or citizen/vehicle detail. |

## Single biggest actionable remaining gap

**The architectural kit still reads as repeated box buildings rather than a developed city streetscape.**

This dominates the image area in both the aerial and street captures, so it has greater immediate visual impact than adding tiny details to distant characters. The same wall/window/roof rhythm repeats across the district; in the close street view, uniform window darkness and shallow frontages make the repetition especially evident.

**Concrete next fix:** replace the nearest street-facing block group with three deliberately different architectural archetypes, then distribute those archetypes through the visible middle distance: a corner shop building with a recessed entrance and arcade/bay, an apartment building with a stepped or recessed upper level and substantial balconies, and a flat-roof commercial building with a distinct glazing rhythm. Give their windows visible reveals, meaningful sill/cornice depth, and glass/material variation at the captured street scale. Preserve the clear road/crosswalk palette while changing building massing, frontage, and surface response.

After making the visual judgment, I inspected implementation to locate this work: `public/ai-city-traffic/world.mjs` → `addBuilding()` is the common building path; the shared surface definitions are in `world-assets.mjs`. That localization does not establish quality by itself.

**Acceptance evidence for this next fix:** capture the same aerial and street cameras from one pinned source revision. At normal display size, the nearest blocks should have distinct silhouettes and street-facing depth, and repeated flat wall/window patterns should no longer dominate the street frame. Then repeat this direct reference review; an improved candidate is not automatically a benchmark pass.

## Comparison limits

Desktop captures are 1920×1080 at reported pixel ratio 1. Mobile is 390×844 at pixel ratio 1. The reference images have different camera height, framing, density and lighting; Cities II's neighborhood is a residential scene, TF2's avenue is much busier, and Mini Motorways is a schematic top-down scene. Those differences prevent a controlled like-for-like ranking of every detail.

The capture report records paused rendering and reduced motion. Its FPS value of zero is not a performance result. These stills establish no claims about animation, traffic correctness, AI quality, audio, sustained performance, or interaction behavior.

The report labels desktop art as `marina-district-1` and mobile as `marina-district-2`. Root reports that only the version marker changed between them, but this set does not independently prove a single immutable candidate because source hashes were not pinned. The next capture should pin source hashes before any release-grade verdict.

