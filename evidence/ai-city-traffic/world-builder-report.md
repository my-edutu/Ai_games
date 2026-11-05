# City world builder — working evidence

## Current handoff — near-vehicle revision 4

**Revision 4 is promoted and stable for the next real browser capture.** The fixed Cities: Skylines II quality bar remains unmet: the independent revision-3 critic preferred the new architecture in a blind candidate comparison, then identified near-camera vehicles as the largest remaining gap. This owner read `traffic-visual-review-3.md`, opened the actual `iteration-3-follow.jpg`, and re-opened the close Cities citizen/vehicle reference before this pass. Parked purple/white cars, the crossing van and the bus were explicitly included in the work.

Only `world.mjs` and `world-assets.mjs` changed. All development was staged in `/tmp/city-world-round4` while the root ran browser checks against unchanged revision 3. After the complete staged fixture passed and the root released the browser, both complete modules were promoted. The asset superset was renamed first, then the module, preserving a runnable intermediate state. The old served hashes were checked before promotion. Exact rollback files remain in `/tmp/city-world-round4/previous`.

### Completed focused vehicle changes

- **Distinct body families:** sedan, hatchback and SUV models now have different cabin lengths, roof profiles, rear glazing and deck shapes. Longitudinal body sections vary shoulder width, hood/trunk height, nose taper and lower sill. The taxi shares the developed sedan shell; van, ambulance and bus retain their own proportions and body fittings.
- **Actual wheel openings:** the lower sides of the body shell rise around the tire openings. Separate curved painted fender lips and dark liners frame the voids. This is real geometry rather than black circles painted onto an unbroken body box.
- **Separate glazing and structure:** mildly curved windshield, rear-window and side-window patches have continuous surface normals, rubber seals, A/B/C pillars, belt trim, wipers and mirror housings. Car roofs are painted curved caps rather than the top of one solid glass prism.
- **Wheels:** rounded tire cross-sections, tread grooves, a distinct rim ring, split spokes, center caps and separate brake discs replace the flat cylinder/star treatment. Existing travel-derived wheel rotation and steering remain; parked wheels stay fixed.
- **Front and rear identity:** shaped headlamp panels and lower lamps, grille slats, badges, recessed license-plate pockets, separated bumpers, wrapped tail lenses and reverse-light sections give the ends more structure. The van adds outlined sliding/cargo doors, handles, rear glazing and vertical rear lamp assemblies. The bus has shaped roof/rear/front surfaces, individual glazing bays, fitted mirrors, wipers, passenger-door leaves, route signs, engine louvers and taller rear light housings.
- **Material separation:** one original 256×128 equirectangular data texture supplies the local sky/street reflection environment shared by vehicle finishes. Paint uses restrained clearcoat; glass is a low-roughness dielectric finish; metal and rubber have separate responses. Three generates and caches one PMREM from that data texture. No external asset, scene capture, per-frame reflection pass or network dependency is introduced. Night reduces reflection intensity. Headlamp and tail-light emissive output is multiplied by the actual instance color, preserving per-vehicle lamp/braking distinctions and dimmer parked lamps.
- **Ground contact:** detailed vehicles retain a body contact shadow and add a tighter underbody layer plus four small tire-contact shadows. These are pooled in the existing transparent batch. Moving models still do not cast cached directional shadows.

Parked and active vehicles use the same model families, material definitions, distance selection and detailed assemblies. No separate low-quality parked-car model remains. Distant models retain a small independent body/glass/tires representation; near details restore inside the existing 92 m distance.

The architecture, roads, vegetation placement, waterfront, authoritative signal/queue binding and citizen models were preserved. Static counts remain exactly 72 batches / 28,456 authored instances. The vehicle additions use 99 pooled dynamic batches total, 36 shared materials, 236 tracked source/merged geometries and 8 locally generated textures in Node; the browser adds the sign atlas and internally cached PMREM resources. The original texture's disposal event releases the renderer's PMREM target, as checked in the installed Three.js implementation.

### Verification and measured geometry cost

Reproducible fixture: `/tmp/city-world-round4/verify.mjs`. Output: `/tmp/city-world-round4/verification.json`. It imports the preserved revision-3 modules and the staged revision-4 modules, so the before/after comparison remains reproducible after promotion.

Both modules passed `node --check`. The complete fixture passed against installed Three.js 0.186.0. A separate import of the **promoted product module** successfully created, updated and disposed the world and reported `marina-district-4`.

| Same deterministic 40-vehicle / 48-citizen fixture | Revision 3 color triangles / visible meshes | Revision 4 color triangles / visible meshes |
|---|---:|---:|
| Aerial `(170,160,190)` | 360,730 / 79 | 360,046 / 79 |
| Follow `(-63.7,10.5,-70.680239)` | 521,602 / 154 | 668,822 / 162 |
| Street `(28,4.2,112)` | 471,664 / 157 | 564,784 / 165 |

These are **scene measurements before camera frustum culling**, not browser timings. Follow-view triangles increased approximately 28%; street-view triangles increased approximately 20%; aerial cost is effectively unchanged. An initial staged version was heavier; repeated small fittings were reduced to a smoothly shaded 44-triangle chamfer, and thin rods, liners and wheel subdivisions were reduced while retaining the important body/window/arch forms. The table records the final promoted version.

Assertions passed for:

- Frozen snapshot immutability and finite instance transforms.
- Pool capacity at the actual authority maximum of 144 vehicles / 48 citizens, including parked scenery; zero truncation.
- Identical wheel transforms when the unchanged snapshot was presented at a different elapsed time; changed wheel transforms after actual snapshot movement.
- Matching detailed tire/brake-disc counts.
- A ray through the outer wheel opening reaching only the recessed inner body shell, demonstrating the actual open arch.
- Outward windshield normals.
- One valid shared local environment texture, correct equirectangular mapping and reduced night intensity.
- Instance-color lamp shader injection matching the installed shader's `vColor` type.
- Actual NS green / clearance red and incident cone activation/removal.
- No moving shadow casters, motion-cache purge after entity removal, and repeated disposal leaving zero owned scene children/materials/geometries/textures.

### Settled source identity

| File | SHA-256 |
|---|---|
| `public/ai-city-traffic/world.mjs` | `549980ee6c365d8a5cb03eb0b9ed232bc7a5a6b438e7a62150cfe9879e84b09e` |
| `public/ai-city-traffic/world-assets.mjs` | `b06b3a8af08990aab5a1cb4a49295b38794e2fcd3eb1e19c0fae2feec7c66524` |

### Remaining review work and limits

Root was notified that both art modules are settled. This owner did not launch a browser. The root's next actual capture must check shader compilation, initial PMREM creation, near-view cost and the visible result at the same follow camera. The Node fixture does not establish GPU shader success or visual quality. The staged and prior modules remain available if that capture exposes a concrete fault.

The environment is an original approximate sky/street reflection source, not a live reflection of each nearby object. The models remain procedural; interiors behind opaque glazing are not simulated. More developed vehicle geometry/materials do not close the separately identified citizen, foliage, night-lighting and commercial-reference gaps. A reference win has not been claimed.

---

## Historical handoff — architectural revision 3

**The revised art files are stable and runnable. The benchmark is still unmet.** The independent iteration-2 review judged Cities: Skylines II the winner. This owner read `/workspace/scratch/f951d9074684/traffic-visual-review-2.md` and directly inspected the actual iteration-2 aerial and street captures before this pass. The largest supported gap was repeated box massing, dark window grids and near-identical red roofs. The detached context buildings also lacked streets, paving and believable lot connections.

For this focused round, ownership returned to **world.mjs and world-assets.mjs only**. The interface builder owns `main.mjs`; this round did not edit it. No browser was launched by this owner, and there is no new visual-pass or FPS claim.

### Focused plan and completed changes

1. Replace the repeated architecture with three distinct massing/frontage families and put them in the existing street view.
2. Replace detached surrounding boxes with connected, paved city blocks and a planted boundary.
3. Preserve instancing, distance LOD, full nearby agents and snapshot authority; run syntax, real creation and focused fixtures before capture handoff.

The 46 main district buildings are now deliberately mixed: **15 historic buildings, 10 arcade blocks, 11 stepped apartments and 10 commercial blocks**. The named park, market hall and twin glass landmark remain separate.

- **Arcade blocks:** the shop bodies sit 1.1 metres behind open extruded arches, columns, capitals and ground paving. Upper floors bridge the recess. Projecting glazed bays, deep window reveals, physical sills, smaller upper windows and Juliet balconies break the wall plane. A low mansard/hip roof, dormers and chimneys replace the common long gable; slate, muted bronze and terracotta vary the roof palette.
- **Stepped apartments:** broad floor slabs and balconies extend 1.5–2 metres beyond the room glazing. Solid end dividers, glass balustrades and planted balconies are visible volumes. The top two floors step back, a taller stair core offsets the silhouette, and a timber/glass penthouse and pergola finish the roof.
- **Commercial blocks:** two unequal-height wings, wider paired windows, occasional timber cladding, substantial horizontal cornices and a double-height glazed entrance atrium replace the narrow repeated window grid. Flat roofs have parapets, planted terraces and compact equipment.
- **Street placement:** the large block west of the street camera at plot `(0,96)` is now an arcade building; the west side of Marina Square `(48,96)` is a stepped apartment. The neighboring Marina building is commercial. These families also recur through the middle distance, so the change is not limited to a single demonstration building.
- **Glazing:** one original local data texture gives panes a soft vertical sky/room color response. Instance tints vary their color, while retained warm/cool window materials still light selected panes at night. This is an inexpensive authored surface response, not a real reflection probe.
- **Context:** 24 paved outer blocks with 48 low-detail buildings now share connected road extensions, curbs, planted courtyards, entrance paths, hedges and benches. Two boundary bands use low-poly planted berms and the existing tree LOD. Isolated striped boxes on empty grass were removed. These are static surroundings beyond the simulation graph, with no invented moving traffic.

All features share the existing material and instance batches. Three reusable geometries were added: a hip roof, an open arcade span and a window reveal. Window reveals use the same near-distance filtering as detailed frames. Nearby citizen/vehicle models, camera-dependent LOD, cached static shadows, contact shadows, real signal states, queue state and roadworks binding are preserved.

### Exact verification and cost evidence

Both edited modules passed `node --check`. A Node fixture using installed Three.js 0.186.0 actually called `createWorld`, `update` and `dispose`. It supplied a recursively frozen snapshot of 40 vehicles, 48 pedestrians and 16 signals; tested the day aerial, the revised UI street position, then night with queues and roadworks.

| Fixture view | Color triangles | Visible meshes | Initial static shadow triangles | Initial static shadow meshes |
|---|---:|---:|---:|---:|
| Aerial `(170,160,190)` | 360,730 | 79 | 53,744 | 9 |
| Street `(28,4.2,112)` | 476,966 | 157 | 84,624 | 10 |
| Same street, night/queues, roadworks cleared | 476,096 | 157 | 84,624 | 10 |

These are **scene counts before camera frustum culling**, not browser timings or rendered FPS. Static shadow work is cached by the UI. The revision-2 street fixture used a different position, so these street counts are not a controlled before/after performance comparison. Aerial geometry increased to support the larger connected surroundings and structural architecture; the visible mesh count remains bounded.

Focused assertions passed:

- The frozen snapshot serialized identically before and after all presentation updates.
- No populated instance transform contained a nonfinite value.
- No dynamic agent mesh casts a cached directional shadow.
- The actual NS signal green was `6cdb9b`; clearance became `ef4938` red.
- The incident showed 11 cones and clearing it set the cone pool count to zero.
- Removing all moving agents purged the motion cache.
- Two calls to `dispose()` left no owned scene children and zero tracked geometry/texture resources.

A separate fixture exercised the **actual authority limits of 144 vehicles and 48 citizens**, at the revised street camera with night, queues and roadworks enabled. It recorded 550,330 color triangles / 160 visible meshes, zero nonfinite transforms, zero truncation, 34 detailed nearby vehicles and 8 detailed nearby citizens. Disposal succeeded. It is also a scene resource check, not a performance guarantee.

Current infrastructure: 72 static batches including alternate LOD meshes, 28,456 authored static instances, 91 pooled dynamic batches, 130 geometries, 34 shared materials and 7 textures in Node. The browser adds the locally drawn sign atlas. Art marker: `marina-district-3`.

### Settled source identity for capture

| File | SHA-256 |
|---|---|
| `public/ai-city-traffic/world.mjs` | `2057b018c7be23c37c6b986a99f653477e2af06335a76095e8c621f779d1555a` |
| `public/ai-city-traffic/world-assets.mjs` | `6707e87f89e3b0bca54f1a01c598a4aab36c2634f15b4819f1fdeb8269131597` |

### What remains for the independent capture review

Root/UI have been told the art files are stable. Actual revision-3 aerial and street captures must establish whether the new shapes, recesses and surface response read at normal display size; this cannot be established by function names, triangle counts or this author's intent. The UI changed the street camera height to 4.2 and target height to 2.8, so that framing difference must be disclosed in the before/after review. A new source-pinned comparison is still required, and the fixed Cities benchmark remains unchanged.

Known artistic limits remain: original procedural architecture, approximated interior/reflection response, lightweight foliage and articulated stylized people. Large commercial asset/library fidelity has not been claimed. Added context increases aerial geometry; root must use actual browser measurements to assess the practical cost.

---

## Historical record — initial delivery and rendering revision 2

The sections below retain the earlier implementation and performance evidence. Their earlier pending-capture statements describe that point in the work; the current handoff above supersedes them.

## Scope and plan

Owner: city_world_builder. Initially authorized files: `public/ai-city-traffic/world.mjs` and supporting original model/material modules under the same directory. The root later explicitly authorized targeted performance changes in `public/ai-city-traffic/main.mjs`: passing camera data, cached 1024 static shadows, contact shadows for moving agents, on-demand paused drawing, and diagnostic adaptive resolution. Other UI, authoritative simulation, server, tests, and deployment remain with their assigned owners.

1. Construct a deterministic, connected visual city on the supplied road geometry, with authored neighborhoods and a waterfront. Reserve sidewalks and intersection approaches.
2. Build detailed pooled vehicle and articulated citizen presentation from immutable simulation snapshots; bind lamps and analytical overlays to actual signal/queue state.
3. Verify module syntax, finite scene transforms, immutable snapshot consumption, entity pooling, disposal, and rendering cost. Integrate actual screenshots supplied by the root agent.
4. Record specification and visual quality findings without claiming an unavailable external reference A/B pass.

## Required guides read

Read `AGENTS.md` locally and `skills/game-creative-direction/SKILL.md`, `skills/procedural-generation/SKILL.md`, `skills/game-feel-vfx/SKILL.md`, and `skills/performance-optimization/SKILL.md` from pinned repository revision `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31`.

## Visual contract

- Original procedural geometry and local procedural material maps; no external/CDN assets.
- All moving people and vehicles consume snapshot coordinates. No generated cosmetic traffic competes with authoritative agents.
- Front direction +Z; simulation road centerlines -72, -24, 24, 72; plot extents reserve at least 10 units from each road centerline.
- A cream/terracotta coastal district, detailed façades, pitched roofs, trees, civic park, market pavilion, glass landmark, marina promenade, and surrounding context.
- Instanced static geometry and bounded dynamic pools; no per-agent Three.js lights.
- `createWorld(THREE, scene)` returns update/dispose plus inspection handles. Day/night options change presentation only.

## Delivered files and API

- `ai-games-city-traffic/public/ai-city-traffic/world.mjs`
- `ai-games-city-traffic/public/ai-city-traffic/world-assets.mjs`
- `ai-games-city-traffic/public/ai-city-traffic/main.mjs` — only the subsequently authorized renderer/performance changes.

No other project files were modified by this owner. No commit was created by this owner.

`createWorld(THREE, scene)` returns:

```js
{
  update(snapshot, elapsedSeconds, {
    night: false,
    trafficOverlay: false,
    reducedMotion: false,
    reducedFlashes: false,
    cameraPosition: { x: 170, y: 160, z: 190 },
    cameraMode: 'aerial',
  }),
  dispose(),
  root,
  stats,
  getStats(),
  landmarks: [{ name, x, z, height }],
}
```

The supplied `THREE` namespace is the only rendering dependency. The world adds a named child group, and owns neither renderer nor camera, lights, fog, application state, or simulation. `dispose` is idempotent and releases tracked geometry, material, texture, and instance resources.

## Authored result

The core district has 25 plots with approximately 46 individually dressed midrise buildings, two civic parks, a three-bay market hall, an offset two-shaft glass office landmark, and a corner clock tower. Façades contain individual recessed windows, local sign atlas panels, framed shop glazing, striped awnings, balcony slabs and rails, flower boxes, shutters, horizontal courses, corner trim, gutters, roof courses, chimneys, skylights, solar panels, service equipment, and planted roof terraces. Buildings use cream, warm stone, terracotta, sage, and blue glass rather than arbitrary primary colors.

Street dressing includes curbs, pavement joints, zebras, stop bars, direction arrows, parking lines, manholes, storm drains, curb trees with trunks/branches/leaf cards, lamps, benches, bins, bus shelters, signs, café tables/chairs/umbrellas, planter beds, a tiered fountain, a sculpture garden, and 48 visibly parked cars. The coastal edge has a stone quay, paved promenade, palms, mooring jetties, six complete moored boats with furled sail details, and a rocky breakwater with a beacon. Lower detail masonry blocks and vegetation continue the surrounding city beyond the central simulation district.

Moving models include three car silhouettes, taxi, delivery van, city bus, and emergency ambulance. Rounded and lofted bodies have sloped glazing, cabin roofs, pillars, mirrors, handles, bumpers, grilles, number plate panels, four tires, modeled rotating alloy hubs, headlights, tail lamps, and kind-specific equipment. The bus has glazing divisions, passenger doors, HVAC, and a local route display; the ambulance has body markings and an alternating beacon; the taxi has its roof sign and checks. Turn indicators and brake lamps read actual optional route/braking snapshot fields. Front wheels steer from changes in actual snapshot yaw, and hub rotation accumulates actual traveled distance, so stopped or paused agents do not pretend to move.

Citizens have scaled torsos, shoulders, hips, upper/lower legs, articulated knees, upper arms and forearms, hands, neck, face, ears, eyes, nose, mouth, hair, optional longer hair and backpacks, and shoes. Clothes, skin tones, hair, and height use a bounded deterministic cosmetic palette. Gait comes from `walkPhase` and `speed`; all position and direction come from snapshots. Feet move between road and sidewalk height without altering authority.

Night presentation lights selected windows, shops, lamp heads, modeled vehicle lamps, and bounded additive ground light pools. It changes no simulation state. Water movement is cosmetic and respects reduced-motion mode; beacons and indicators have steady reduced-flash variants.

## Simulation alignment

The simulation owner confirmed lane offsets of ±3.3 m; travel +Z uses x=road+3.3 and travel +X uses z=road-3.3. Painted crossings are centered at ±8.8 m. Signal heads are on their approaches' curb sides and face incoming traffic. `ns`/`ew` illuminate only the correct vehicle green; `walk`/`clearance` produce all-red vehicle heads. Pedestrian lamps follow the `walk` phase.

The queue overlay colors actual per-junction queue pressure from green at zero to amber/coral at 12 or more queued agents. It does not invent density data.

`snapshot.incident` reveals 11 shoulder cones, striped barriers, a warning sign, a road patch, and materials beside the authoritative Market `j5>j6` lane, x[-12,12], z=-27.3. Props are on the shoulder near z=-29.15 to -30.25 and leave the lane open, matching its 3 m/s speed restriction. The UI owner was told to describe this as a slowdown rather than a full closure.

## Verification performed

1. `node --check public/ai-city-traffic/world.mjs` and `node --check public/ai-city-traffic/world-assets.mjs` passed.
2. Instantiated the world against installed Three 0.186.0 in Node. A deeply frozen snapshot with all model kinds, citizens, signals, night, queues, and roadworks was consumed without mutation or exception. All geometry positions and all populated instance transform entries were finite.
3. Verified populated instance counts remain within allocated capacities. Final presentation caps are 512 moving vehicles and 512 citizens, above current authoritative caps of 144/48. Any overflow is reported explicitly by `truncatedVehicles`/`truncatedPedestrians`.
4. Verified first NS signal lenses: inactive red `261b17`, inactive amber `27241b`, active green `6cdb9b`. After a clearance snapshot: active red `ef4938`, inactive amber `27241b`, inactive green `192922`.
5. Verified incident adds 11 cones and removal reduces their instance count to zero. Queue overlay with two supplied signals has two instances, and disabling it reduces count to zero. True right-turn snapshot generated two indicator lamps.
6. Verified night window emission is 0.9 and returns to zero in day presentation. All lights remain presentation-only; there are no per-agent or per-streetlamp Three.js lights.
7. Verified removed vehicles are purged from the motion cache even if a replacement snapshot uses the same tick. Removing all agents gives zero motion entries.
8. Called `dispose()` twice: the supplied scene had zero remaining owned children, and tracked geometry/material/texture/motion resource counts were zero.
9. Profiled the initial heavy artificial workload of 260 vehicles/180 citizens. Reduced small rounded component tessellation and cached instance colors, then removed per-part Object3D Euler/quaternion callback work and per-frame channel-list allocations based on a Node CPU profile. Geometry fell from approximately 2.85M to 2.04M triangles at that artificial workload. Repeated immutable snapshots now skip transform uploads while cosmetic water time continues.

## Rendering budget evidence and limits

Before the integrated browser feedback, a Node profile with 144 vehicles/48 citizens, night, queue overlay, and active roadworks counted 137 visible meshes and about 1.407M triangles before renderer shadow passes. This was an early resource check, not sufficient rendering evidence.

A 120-update Node CPU sample at that artificial maximum-authority population recorded p50 4.84 ms, p95 29.64 ms, p99 36.98 ms, and worst 52.49 ms. This is a shared container CPU observation, not a GPU frame-time guarantee; it also preceded the unchanged-snapshot upload skip and the distance LOD work.

### Integrated browser bottleneck and second art revision

Root's actual first browser run at 1440×1000, DPR 1, 40 vehicles and 48 citizens reported **238 renderer calls, 2,214,204 triangles including shadow work, and approximately 0.4 fps on the shared software graphics device**. Capturing was too slow. This failed the practical rendering requirement and triggered another implementation pass; the theoretical population profile was not used to dismiss it.

Art revision is now `marina-district-2`, visible in `getStats()` for reload verification. The following changes address the measured cost:

- Window recess/glazing uses outward quads rather than overlapping six-sided boxes; close window frames retain a physical sill with thinner front trim. Balcony bars use lighter faced geometry.
- Window frames, balcony rails, local signs, and leaf cutouts are distance filtered. Nearby street details remain; distant detail is omitted only where it cannot materially contribute to the view.
- Volumetric trees and shoreline rocks switch between fine and coarse crown meshes by actual camera distance. Both preserve the authored positions, scale, colors, and overall silhouette.
- Vehicles at a distance use lofted 3D body/cabin silhouettes, tires, and modeled lamps. The near camera restores mirrors, plates, body trims, detailed wheels and hubs, windows, doors, equipment, and the complete model family.
- Distant citizens retain separately colored articulated bodies, head/hair, legs and arms. Nearby citizens restore facial features, detailed limbs, hands, accessories, and shoes. Neither level invents positions or gait state.
- Dynamic meshes cast no baked directional shadows. A single pooled soft contact-shadow layer follows actual vehicle/citizen transforms. Only significant static architecture and crown meshes cast the directional shadow map.
- `main.mjs` caches a 1024 static directional shadow map, passes the camera to the presenter, and stops drawing a paused frame once camera/lighting/overlay/snapshot/resize changes settle. Camera and night transitions continue to draw.
- Sustained measured low fps can reduce only 3D resolution in steps to 0.65; diagnostics report `graphics.mode`, `reductions`, shadow resolution, distance LOD, paused rendering mode, and rendered frame count. This is visible as measured diagnostics, not an implied frame-rate guarantee.

After these changes, a Node geometry inspection at the **same 40 vehicle / 48 citizen population** recorded:

| View | Color triangles | Visible color meshes | Initial static shadow triangles | Initial shadow meshes |
|---|---:|---:|---:|---:|
| Aerial (170,160,190) | 265,278 | 72 | 32,820 | 7 |
| Street (27,6,20) | 544,026 | 150 | 92,660 | 8 |

These are scene counts before camera frustum culling, not fresh browser GPU timings. The root must reload revision 2 and measure actual renderer results. Steady frames reuse the cached static shadow map. The near view restored 27 of 40 detailed vehicles, 24 of 48 detailed citizens, and 2,777 detailed static instances in this fixture.

Current infrastructure has 66 static batches including alternate LOD meshes, 27,208 unique authored static instances, and 91 dynamic pooled batches, mostly inactive in any one view. Node tracks 34 materials, 127 geometries, and six textures; browsers add the local sign atlas.

Final headless regression after the LOD pass: frozen snapshot remained unchanged; NS green was `6cdb9b`; clearance red was `ef4938`; 11 roadwork cones appeared and then cleared to zero; the close fixture restored both detailed vehicles and its detailed citizen, and the aerial fixture switched both to their coarse models; there were zero nonfinite populated transforms, zero moving shadow casters, zero retained motion entries after removal, and zero owned scene children/resources after repeated disposal. All three edited modules passed `node --check`.

## Separate review passes

**Specification review:** complete model families consume actual snapshots; direction is +Z; road/crossing/incident geometry matches the supplied authority; truth-bound signals, queues, gait, wheel movement, indicators and brake behavior are implemented; day/night affects presentation only; no network assets or external service are needed; resources are bounded and disposed. No simulation, server, test, or unrelated UI file was modified. The renderer changes were explicitly authorized by the root after the actual software-GPU bottleneck.

**Quality review:** the scene has a coherent authored coastal identity, multiple building silhouettes, multiple scene landmarks, rooftop and street detail, volumetric vegetation, human-scale moving models, and day/night material hierarchy. Geometry winding was checked and corrected on vehicle cabin surfaces and road arrows. Crown detail uses leaf cutouts over solid volumetric canopies. Bus shelters were shifted behind the pedestrian corridor, and roadwork props remain clear of the active lane.

## Remaining visual risks and expected gaps

- Actual browser aerial and street renders have not yet been supplied to this owner. Screen-space occlusion, tone mapping, shadow artifacts, and composition still need the root agent's capture/review loop before visual completion is claimed.
- The root resolved the earlier reference-media retrieval block. This owner directly inspected `/tmp/city-traffic-references/cities-skylines-ii-4.jpg` (neighborhood oblique) and `cities-skylines-ii-5.jpg` (actual gameplay citizen/vehicle inspector), with source URLs and hashes in `/tmp/city-traffic-references/manifest.json`. They establish the required density, material finish, grounded cars, human scale, and scene hierarchy. An integrated revision-2 game image has not yet been compared by this owner, so a primary-reference A/B pass or win has not been claimed. The supporting Transport Fever reference remains distinct from the Cities benchmark.
- Window interiors, glazing reflections, foliage, and building detail use original lightweight procedural approximations rather than authored photogrammetry/PBR packs. Characters are complete articulated stylized figures, not scanned realistic humans.
- Agent placement is exactly as supplied by the simulation. Citizens currently follow its street/crossing network and do not independently enter park interiors; parked cars and moored boats are static scenery.
- There are no moving boats, off-network traffic, cosmetic fake pedestrians, dynamic headlight shadow maps, reflection probes, or simulated weather. Such additions would require separate authority or rendering scope.
- The work-zone location is deliberately bound to the current authoritative `j5>j6` incident. If that incident moves, its presenter coordinates must be updated alongside the network contract.
- The scene is visually dense; mobile performance and worst-case shadow cost remain for root-level browser validation. Reduce cosmetic shadow cost before removing true signal or agent cues if a lower quality tier is needed.

Owner remains available for fixes after the root agent supplies real renders.
