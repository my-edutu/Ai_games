# Game11 visual review — iteration 4

## Verdict

**The vehicle revision is a clear improvement. The current characters and scene do not meet the requested Cities: Skylines II reference bar.** The largest actionable gap is citizen construction: the three inspected people are recognizably volumetric 3D figures, but their anatomy, clothing shapes, hair and ground contact still read as simple toy figures. This remains evident after reducing them to the reference citizen's approximate on-screen height.

Keep the iteration-4 vehicle direction. Make the next substantial asset pass about a finished citizen system that applies to every runtime citizen, then verify the entire population. The captures closely establish the appearance of pedestrian IDs 1–3; they cannot establish that all 48 are fully developed or that their animation works well.

## Evidence and review method

I viewed the actual pixels before inspecting implementation metadata. I did not inspect product source or launch a browser, and I made no product changes.

1. First, I viewed `/tmp/city-traffic-blind-vehicles/variant-a.jpg` and `variant-b.jpg`, without reading a source report or their mapping. I selected **B** and sent that choice with visible reasons to the root reviewer. The mapping was disclosed afterward: A is iteration 3 follow; B is iteration 4 follow. The locked decision is also recorded in [blind-vehicle-comparison.json](blind-vehicle-comparison.json).
2. I viewed the fixed, actual gameplay references `cities-skylines-ii-5.jpg`, `cities-skylines-ii-4.jpg`, and `transport-fever-2-1.jpg` from `/tmp/city-traffic-references/`.
3. I viewed all 14 iteration-4 captures, including all three citizen closeups, all three vehicle closeups, street, follow, aerial, night and the four mobile views. The follow view was initially viewed as blind variant B.
4. I read [iteration-4-report.json](../../public/ai-city-traffic/progress/captures/iteration-4-report.json) for capture conditions and [reference-manifest.json](reference-manifest.json) for provenance. The manifest identifies the primary references as actual screenshots on the official [Cities: Skylines II Steam page](https://store.steampowered.com/app/949230/Cities_Skylines_II/) and the supporting street reference as a screenshot on the official [Transport Fever 2 Steam page](https://store.steampowered.com/app/1066780/Transport_Fever_2/).
5. I made an analytical crop comparison from those existing pixels. The current people were downsampled to approximately 152 pixels high, matching the primary reference citizen. The crops were not retouched or generated. See [character-scale-comparison-4.jpg](character-scale-comparison-4.jpg).

The references and desktop output are all 1920 × 1080, but their camera angles and world scale differ. Current inspection views show people about 470–526 pixels high, whereas the primary reference citizen is about 152 pixels high. The scale comparison addresses that substantial magnification difference. The reference citizen is seen from a higher angle, so it is useful evidence for silhouette, garment structure and grounding, rather than an exact anatomical orthographic comparison. The suburban reference and the current coastal urban district also have different settings; a rectangular street grid is not itself a defect.

### Capture integrity

| Condition | Recorded evidence | Consequence for this review |
| --- | --- | --- |
| Capture completion | `complete: true`; 14 scenes; `errors: []` | The requested still-image set exists and is complete. |
| Source stability | Eight hashes in `sourcesBefore` and `sourcesAfter`; the maps match; `sourceStable: true` | The set represents one stable captured implementation. |
| Capture time | `2026-10-30T21:24:19.052Z` | Conclusions apply to this captured revision. |
| Resolution | Ten desktop captures at 1920 × 1080; three at 390 × 844; junction-320 at 320 × 700 | The 320-pixel image is explicitly accounted for rather than assumed to be 390 pixels wide. |
| Internal pixel ratio | 1 in all 14 views; standard mode; zero graphics reductions | The review is not comparing an adaptive low-resolution capture against a full-resolution reference. |
| Runtime population | 40 vehicles, 48 pedestrians; no reported truncation | Population counts are established by diagnostics, not by counting visible figures. Counts do not establish asset quality. |
| Simulation state | Desktop tick 363; mobile tick 364; all paused with reduced motion | Still-image evidence does not establish animation, movement continuity, sound or performance. The reported FPS of zero is not a running performance result. |
| Detail and shadows | Distance LOD; citizen closeups report 17, 14 and 19 detailed pedestrians; 1024 static shadow resolution; moving shadows recorded as `contact` | A detailed-entity count does not establish that all 48 assets have been visually inspected. A recorded shadow mode also does not establish convincing visible grounding. |

## Blind vehicle decision

**B was clearly stronger before its provenance was disclosed.** The reasons were local to the vehicles, not the different logo treatment or the additional toast:

- The bus has a framed rear window, a layered rear grille and bumper, and vertical rear lamp clusters. A's rear is a broad simple surface with a dark window and two small lamps.
- The nearby cars have defined window frames, body trim, panel separations, grilles, more legible wheel rims and a clearer tire/rim distinction. A reads as rounded body blocks with minimally separated surface details.
- The crossing van has a more distinct cab/cargo relationship, rear-door divisions, trim and wheel construction.

Both screenshots have the same follow-camera composition and resolution. Their simulation ticks can differ, and their vehicle positions are not exactly identical. The comparison supports a visible improvement in vehicle construction; it is not evidence that iteration 4 has reached the commercial-game benchmark.

## Citizens — largest remaining gap

Evidence: [citizen 1](../../public/ai-city-traffic/progress/captures/iteration-4-citizen-1.jpg), [citizen 2](../../public/ai-city-traffic/progress/captures/iteration-4-citizen-2.jpg), [citizen 3](../../public/ai-city-traffic/progress/captures/iteration-4-citizen-3.jpg), and the scale comparison above. The inspected subjects are runtime IDs 1, 2 and 3. Citizen 3's background also exposes another similar figure, but it does not replace a dedicated inspection of that person.

### What is already visible

The figures have separate heads, hair masses, ears, noses, simple eyes/mouths, necks, torsos, arms, legs and shoes. The sample contains changes in skin tone, shirt color, trousers and hair outline. One background person has a visible dark strap. Citizen 2 is captured in a walking pose while citizens 1 and 3 stand at the curb. These are identifiable people in the world, rather than flat icons.

### Why the requested bar is still unmet

**Anatomy and silhouette:** the round heads and helmet-like hair dominate the body. Torsos are broad beveled blocks, the waist/hip area is a dark slab, arms have little elbow/wrist shaping, and legs read as straight tubes with abrupt ends. Oversized block shoes weaken the relationship between ankle, foot and ground. Citizen 2's pose reads as legs scissoring from the hips; little knee/ankle contour is visible. That is a criticism of the captured pose and mesh silhouette, not a claim about unobserved motion.

**Clothing construction:** the three foreground people share nearly the same short-sleeved top and trouser construction. A small pale shape at the neckline, color changes and a strap do not create the garment volume seen in the reference's jacket, underlayer, trouser folds and separate footwear. Sleeve openings, collars, hems, waist transitions and garment seams need forms that survive at normal gameplay scale.

**Faces and hair:** the sample uses very similar bead-like eyes, simple protruding noses and smooth cap/bun/ponytail masses. The likeness problem is not solved by adding more tiny facial marks. Better head/jaw proportions, brow and cheek planes, hairline shapes and differentiated hair volumes would contribute more at the relevant screen size.

**Variation:** skin and palette differences are established, but the inspected sample repeats its body proportions and garment cut heavily. This does not establish broad variation in age impression, build, height, outfit silhouette or accessory use. The primary reference is only one closely visible citizen, so it cannot itself establish a full variation roster; the supporting Transport Fever 2 scene does show people with more differentiated silhouettes at street scale.

**Grounding:** the closeups lack a clearly legible directional body shadow and convincing foot-centered contact darkness. The pale pavement under citizens 1 and 3 is almost uninterrupted; citizen 2's airborne foot and planted-foot relationship feel weakly anchored. The primary reference citizen has a clear cast shadow and an intelligible support relationship with the road. A diagnostic saying `movingShadows: contact` does not close this visible gap.

### Actionable next batch

1. **Develop the base silhouette first.** Use a human-proportioned head/neck relationship, sloped shoulders, a shaped chest/waist/pelvis transition, tapered upper and lower limbs, visible elbow/knee/ankle changes, distinguishable wrists/hands and shoes with a rounded toe and sole. Keep these readable in a 150-pixel-high figure and coherent in the current inspection camera.
2. **Build several garment silhouettes on that base.** A jacket with an open front and shirt underneath, a short-sleeved shirt with a collar/hem, a coat, and skirt/trouser alternatives would produce visible differences. Use actual sleeve, hem and layer volumes, then add restrained seams or folds. Preserve a consistent art direction across them.
3. **Make variation structural and deterministic.** Vary height/build within believable bounds, hairline/hair volume, garment family and accessories as well as colors. Every runtime citizen should be produced by the same finished system. The evidence need not show 48 individually hand-authored meshes, but it must show that no IDs retain an unfinished fallback.
4. **Repair visible ground contact.** Strengthen near-view contact under the supporting foot and establish a consistent directional cast/body shadow. Verify standing and walking poses on both sunlit and shaded pavement.
5. **Verify the entire population and actual gait.** Capture a numbered roster of all 48 at a comparable inspection scale, inspect representative front/three-quarter/back views of each garment family, and record an actual walking sequence or successive known gait phases. Check bent knees, opposing arm swing, planted feet, shoe clearance and the absence of detached or intersecting limbs. Keep the original IDs 1–3 and camera framing for an honest before/after comparison.

The next pass should be accepted for citizen quality only when the silhouette, garment families and grounding visibly improve at approximately 152 pixels high and the closeups remain coherent. Static extra mesh counts alone are not sufficient acceptance evidence.

## Vehicles — meaningful progress, incomplete material and shape development

Evidence: [car](../../public/ai-city-traffic/progress/captures/iteration-4-vehicle-car.jpg), [bus](../../public/ai-city-traffic/progress/captures/iteration-4-vehicle-bus.jpg), [van](../../public/ai-city-traffic/progress/captures/iteration-4-vehicle-van.jpg), and [follow](../../public/ai-city-traffic/progress/captures/iteration-4-follow.jpg).

The closeups confirm the blind decision. The models now have readable window borders, windscreen wipers, mirrors, handles, panel separations, wheel arches, rims, grilles and bumpers. The bus also has a destination display and distinct door panels; the van's cargo signage and panel lines distinguish its use. These details remain useful in the normal follow view.

The remaining vehicle gap is visible in three related areas:

- **Glazing and cabin depth:** the windows are large, nearly opaque sky-blue panels with limited depth cues. The car has some reflected shape, but the bus and van especially read as filled panels rather than glass enclosing a cabin. More restrained reflections, darker transmission/depth cues, and simple interior silhouettes would help.
- **Integrated shapes:** several rear lamps project as block attachments, front lamps are thin angular pieces, mirrors are blunt boxes, and very similar spoke wheels recur on different vehicle classes. Develop lamps into body openings, improve windshield/roof/pillar transitions, and give bus/van/car wheels appropriate construction.
- **Grounding and materials:** the cars and van have weak visible tire contact shadows in their closeups. Painted bodywork is recognizably different from black trim, but the reference has more convincing curvature, local occlusion and material response. Improve those cues before merely increasing the number of decorative parts.

The Cities: Skylines II vehicle reference shows smoother and more varied body silhouettes, recessed integrated lamps/grilles, convincing glass and stronger shadow relationships at a similar useful object scale. Iteration 4 remains below that level. The next primary asset effort should still go to citizens, because their current construction is more conspicuously unfinished relative to the user requirement.

## Scene and lighting

Evidence: [street](../../public/ai-city-traffic/progress/captures/iteration-4-street.jpg), [aerial](../../public/ai-city-traffic/progress/captures/iteration-4-aerial.jpg), [night](../../public/ai-city-traffic/progress/captures/iteration-4-night.jpg), plus the follow and closeup environments.

The district has a consistent coastal identity. The aerial view has a legible road network, mixed building heights, a landmark tower, parks, a market-like hall, arcades, roofs, waterfront promenades, palms and boats. The street view establishes real depth and scale, curb geometry, markings, signals, shopfronts and balconies. It is a coherent scene rather than an empty test plane.

The primary district reference remains visibly richer in surface grounding and environmental construction. Current street views repeat broad, opaque blue window panels and pristine facade patterns; trees are strongly faceted ball-like clusters; sidewalk expanses are lightly furnished. The reference shows more varied foliage silhouettes, layered shrubs, finer building details, localized surface texture and stronger cast-shadow structure. The current background extends into repeated block types and pale haze, and the flat teal water has little visible surface structure. Those differences make the aerial scene read more like a tidy architectural model than a fully developed inhabited district.

The Transport Fever 2 avenue has much more traffic and pedestrian activity within its frame. That is a different captured demand state, not proof of a simulation failure here. It does show the visual benefit of populated pavements, richer tree form, convincing vehicle materials and a greater density of local street details. Current output records 40 vehicles and 48 citizens; the street image still has a broad empty foreground and sparse visible human activity.

Night establishes a darkened sky/water palette and scattered lit windows. At the supplied aerial scale there is little clearly legible road illumination from streetlights, storefronts or vehicles, so it reads largely as a dark version of the day scene with illuminated windows. No fixed night reference was provided, so this is an intrinsic lighting observation, not a direct night-parity comparison.

After citizens, the most useful scene pass would improve near-view foliage silhouettes, local facade/ground detail and material/shadow response. Preserve the clear district organization while making individual places and surfaces feel less repeated.

## Mobile observations and limits

I also viewed [mobile](../../public/ai-city-traffic/progress/captures/iteration-4-mobile.jpg), [mobile experiment](../../public/ai-city-traffic/progress/captures/iteration-4-mobile-experiment.jpg), [junction 390](../../public/ai-city-traffic/progress/captures/iteration-4-junction-390.jpg) and [junction 320](../../public/ai-city-traffic/progress/captures/iteration-4-junction-320.jpg). The district remains legible and the junction view places the selected intersection clearly in the available central space. The 320-pixel layout still has readable primary counts and a visible queue label.

These small aerial views do not expose enough character or vehicle detail to establish the asset-quality requirement. The open experiment sheet also covers most of the scene, and its lower roadworks section is cropped within the visible panel. This review did not exercise scrolling, controls, navigation or touch behavior, so it makes no interaction-completeness claim.

## Closing assessment

| Question | Assessment |
| --- | --- |
| Is this a real, coherent 3D city scene? | Yes, visibly. |
| Did vehicle rendering improve from iteration 3? | Yes; blind B selection, subsequently identified as iteration 4. |
| Are the closely inspected citizens fully developed to the requested reference bar? | No. Anatomy, garment construction, variation and grounding remain major gaps. |
| Does this evidence establish all 48 citizens are finished? | No; only IDs 1–3 have dedicated closeups. |
| Is Cities: Skylines II visual parity established? | No. Vehicle, character, environment and material gaps remain directly visible. |
| Do these captures establish animation, sound or running performance? | No. They are paused stills. |
| Highest-value next revision | A complete citizen asset and grounding pass applied across the population, with roster and motion evidence. |

The review deliberately distinguishes a successful local improvement from completion of the user's full visual goal. The next iteration should preserve the stronger vehicles while addressing the much larger citizen gap.
