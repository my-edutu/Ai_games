# AI City Traffic Experiment — City / Flow

Game 11 is an autonomous 3D city traffic experiment. Drivers travel between connected entrances and destinations while citizens walk and cross the district. Viewers can alter demand, compare signal policies and add a temporary roadworks slowdown.

## Run

```bash
npm ci
npm run traffic:stream
```

Open [the city](http://127.0.0.1:4311/traffic/) or [the live build journal](http://127.0.0.1:4311/traffic/progress/). Assets and the simulation run locally; there is no CDN or remote model requirement.

```bash
npm run traffic:headless -- --seed=11026 --ticks=9000
npm run test:traffic
npx playwright install chromium
npm run test:traffic:browser
```

## Controls

Drag to orbit, scroll/pinch to zoom, and right-drag/two-finger drag to pan. Aerial, street and vehicle-follow views use the same city. Space pauses; 1/2/3 choose cameras; F follows another vehicle; N changes lighting; O shows junction queues; M toggles sound; R resets the view; ? opens help. The Experiment panel changes demand, signal timing and roadworks.

## Truthful status

This is a working development implementation with ongoing independent reviews. It is not R5 or production-ready. Actual commercial screenshots are pinned in `evidence/ai-city-traffic/reference-manifest.json`. Independent reviews prefer the revised architecture and vehicles to their earlier versions, but the commercial reference still leads. The iteration-4 evidence includes individual citizens, moving vehicles and corrected phone junction views. Character refinement and integrated review continue. No Cities: Skylines II comparison win is claimed. The build journal records checks, captures and unresolved findings; code tests cannot substitute for that comparison.

For repeatable visual review, run `node scripts/capture-city-traffic.cjs --label=review --jpeg --details`. This saves ordinary gameplay views, individual model views and phone junction views with source hashes and renderer diagnostics; failed or changing output rejects the capture run.

The simulation lives in `src/`; presentation in `public/ai-city-traffic/`; the server in `scripts/serve-city-traffic.cjs`. No other game's private implementation is imported.
