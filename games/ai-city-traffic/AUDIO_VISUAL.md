# Audio and visual direction

## City identity

Northshore is a coastal district with warm stone and terracotta midrises, contemporary glass buildings, a civic park and turquoise waterfront. Dressed sidewalks, curbs, crossing stripes, lamps, planters, café furniture, trees, roof equipment and distinct landmark silhouettes create a finished place at aerial and street scales.

Vehicles have class-specific silhouettes, wheels, cabins, glazing, trim and lamps. Buses, taxis, vans and emergency vehicles remain distinguishable. Citizens have articulated limbs, heads, hair, clothes and shoes. Walking, braking and turn indicators follow actual snapshot state.

## Camera and lighting

Aerial view shows the connected network; street view reveals scale and detail; follow view attaches to a real vehicle. Orbit/zoom/pan remain available. Day/night changes presentation without changing the traffic simulation. Reduced-motion mode removes camera easing and reduces cosmetic flashes.

## HUD and audio

The compact interface prioritizes the city, completed trips and queue pressure. Labels and shapes accompany color. Details live in the Experiment panel; review/debug information belongs on the separate progress page.

Audio starts muted and requires a user gesture. Procedural ambience responds to actual city state. Voices are bounded and suspension follows pause/hidden-tab state. Audio failure must not stop traffic.

## Rendering and evaluation

Static architecture and repeated agent parts use instancing. Distant detail and shadow work must be proportional to the active camera and device. The build journal records actual renderer counters and capture-host measurements, with hardware/software-rendering limitations stated.

Inspect ordinary daytime aerial/street scenes, busy junctions, night, follow mode and a 390×844 layout. Do not replace captured gameplay with generated artwork. Actual reference stills are pinned in `evidence/ai-city-traffic/reference-manifest.json`. Compare neighborhood composition and citizen/vehicle detail at similar camera scale and resolution; record differences and do not infer motion or performance from stills.
