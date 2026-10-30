# Game 4 interface contract

This contract is shared by independent builders. Propose changes to the lead before breaking an interface.

## Simulation API

Exports from games/ai-vs-1000-floors/src/index.ts:

```ts
createCampaign(seed: string): CampaignState
stepCampaign(state: CampaignState, ticks?: number): void
getRenderSnapshot(state: CampaignState): RenderSnapshot
generateFloor(seed: string, floor: number): FloorLayout
validateFloor(layout: FloorLayout): string[]
serializeCampaign(state: CampaignState): string
restoreCampaign(serialized: string): CampaignState
recoverToCheckpoint(state: CampaignState): void
getStateChecksum(state: CampaignState): string
TOTAL_FLOORS = 1000
TICK_RATE = 30
```

The state is mutable only inside the simulation owner. Returned render snapshots are deeply frozen independent values. All renderer coordinates use +Y up, x/z ground plane. Hero positions are at the feet. Coordinate bounds: x/z within -14..14; ordinary surfaces y within 0..4; each floor is a local coordinate frame. Hero rendered height approximately 2.1 world units. Route nodes must be on or connected to actual surfaces.

```ts
type Point = {x:number; y:number; z:number};
type HeroAction = 'idle'|'walk'|'run'|'wait'|'jump'|'land'|'hit'|'recover'|'celebrate';
type District = { index:number; id:string; name:string; color:string; accent:string };
type Platform = Point & {id:string; width:number; depth:number; kind:'spawn'|'path'|'exit'|'rest'};
type Hazard = Point & {id:string; kind:'sweeper'|'pulse'|'gate'|'crusher'; radius:number; period:number; activeTicks:number; phase:number};
type Collectible = Point & {id:string; kind:'energy'|'relic'};
type FloorLayout = {
  floor:number; district:District; variant:number; name:string;
  platforms:Platform[]; route:Point[]; hazards:Hazard[]; collectibles:Collectible[];
  spawn:Point; exit:Point;
};
type RenderSnapshot = {
  schemaVersion:1; seed:string; tick:number; floor:number; totalFloors:1000;
  completedFloors:number; checkpointFloor:number;
  status:'running'|'transition'|'recovering'|'complete';
  intent:string;
  hero:Point & {heading:number; action:HeroAction; health:number; maxHealth:number};
  layout:FloorLayout;
  collectedIds:string[];
  hazardStates:{id:string; active:boolean; phase:number}[];
  stats:{relics:number; retries:number; hazardsAvoided:number; elapsedTicks:number};
  events:{seq:number; tick:number; floor:number; type:'jump'|'land'|'collect'|'hit'|'checkpoint'|'floor'|'recover'|'complete'; detail:string}[];
};
```

`heading` is radians: rotation.y=0 faces +Z, positive rotates toward +X. Hazard phase is 0..1 normalized and authority-derived. Events are a bounded recent ring with monotonic seq, not the entire campaign log. The renderer must accept an empty recent-event list.

## Renderer API

```js
import { createFloorScene } from './scene.js';
const view = createFloorScene(canvas, { onError: (message) => {}, reducedMotion: false });
view.setSnapshot(snapshot);
view.update(deltaSeconds, elapsedSeconds);
view.resize(width, height, pixelRatio);
view.setCamera('follow'); // 'follow' | 'wide' | 'orbit'
view.setQuality('high'); // 'high' | 'low'
view.setReducedMotion(true);
view.dispose();
view.getDiagnostics(); // { geometries, textures, drawCalls, triangles }
```

Scene imports `three` by bare module specifier; the app supplies its import map. The viewport is a full-screen canvas behind a restrained HUD. Scene creation must throw a meaningful error if WebGL is unavailable. Model/environment/material helpers may have private exports chosen by their builder. The scene cannot write to the snapshot or localStorage or alter gameplay rules. It must dispose generated floor resources when changing floors.

## Worker bridge

Root owns the worker. The worker imports the browser build of the core at `/floors/runtime/games/ai-vs-1000-floors/src/index.js`. Commands are init with optional saved string, pause, speed (1/2/4), restart, and checkpoint-recover. UI settings never enter authoritative seed/content. The worker returns snapshot, save, error, and initialized messages. Exact save survives page reload; checkpoint recovery is an explicit separate mechanic.

## Ownership

Campaign builder owns `games/ai-vs-1000-floors/src/` and its core tests. Scene builder owns `scene.js`, `character.js`, `environment.js`, `materials.js`. Lead owns HTML/CSS/app/worker/audio/progress/server/build config, review evidence and integration. Do not edit another owner's files without coordination.
