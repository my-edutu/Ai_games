# Lighting and Material System

The WebGL shader uses one bounded directional light with ambient, rim and distance-fog terms plus emissive practical surfaces. Practical fixtures include desk lamp, instrument panels, vault indicators and focused puzzle elements. Hazard/time pressure adds controlled red environmental pressure rather than a full-screen modal.

Material families: steel, painted steel, brass, wood, paper, glass/instrument, stone. Solved objects blend toward green; focused mechanisms blend toward amber. Contact-shadow proxies anchor props and furniture without the cost of real-time shadow maps in an OBS browser source.

High-contrast mode keeps semantic color separation. Essential puzzle state is never encoded by color alone because object shape/state and captions remain available.
