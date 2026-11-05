# AI Battle Royale — approved Gauntlet application

The user approved applying the Gauntlet prompt on 2026-10-30. This authorizes implementation and independent review in an isolated feature branch. The lead chooses the approach. No fixed number of review rounds or lowered commercial bar is authorized.

## Goal and identity

Build game 6 as a complete 3D autonomous battle royale for livestream spectators. Original, individually recognizable combatants fight across a sunlit coastal science-fiction outpost as an encroaching storm concentrates the fight. Loot, movement, cover, weapons, damage, eliminations, victory and automatic restart must be actual simulation outcomes. The presentation title is LAST LIGHT / AI BATTLE ROYALE. The creative palette is warm sandstone and teal ocean, ivory buildings, coral details and vivid chartreuse broadcast accents.

## Fixed reference pack

- Fortnite Zero Build gameplay: https://www.youtube.com/watch?v=BIFM5e4OFfI — primary character, world, movement and combat presentation reference.
- Apex Legends gameplay deep dive: https://www.youtube.com/watch?v=cEReUkZjjN4 — character identity and action clarity.
- PUBG Global Series 9 finals: https://www.youtube.com/watch?v=AXvBJXq5USk — observer cameras and match communication.

Source page/video availability is verified. Visual reference inspection must be recorded separately. An inaccessible reference is an evidence gap, never a pass. Independent critics compare real runtime captures at equivalent scales; use randomized labels where comparison can genuinely be blinded. Every verdict records the biggest remaining evidenced gap. The integrated game must pass too. No claim of outperforming these games is permitted without actual comparative evidence.

## Approach and constraints

The repository has no battle royale implementation. Add game-owned TypeScript authority and a standalone Three.js ES module presentation using pinned local dependencies. Reuse the public seeded RNG and checksum packages. This follows existing stream-host conventions without rewriting adjacent games. Authoritative logic runs at 20 fixed ticks per second; browser frame rates cannot affect outcomes. No paid or external audience control is enabled. Public endpoints are read-only. All effects, geometry and sound are original procedural content; commercial reference material is only linked for evaluation.

Every public snapshot is an independent immutable view. Bounded event history, population, particles, voices, geometries and listener cleanup are required. Replay/checkpoint restore validates version, checksum and ranges. Invalid restore must not silently resume. Input-free autonomous operation and renderer reconnection are required. Gameplay has running/countdown/intermission lifecycle states, with no invented production readiness.

## Shared integration contract

`games/ai-battle-royale/src/runtime.ts` exports `BattleRoyaleRuntime`: `constructor(seed: string, options?: {agentCount?: number; matchTicks?: number; intermissionTicks?: number})`, `step(): void`, `snapshot(): RoyaleSnapshot`, `checkpoint(): object`, `static restore(checkpoint): BattleRoyaleRuntime`. Options must validate and have finite bounds. Seed defaults in host, not runtime. A complete match resolves to one survivor or a truthful draw if everyone is eliminated, then restarts.

Snapshot shape (additional metadata may be included):

```ts
interface RoyaleSnapshot {
 schemaVersion: 1; matchId: number; tick: number; time: number;
 phase: 'countdown'|'running'|'intermission'; countdown: number;
 remaining: number; winner: string|null;
 zone: {x:number;z:number;radius:number;nextRadius:number;stage:number;secondsToShrink:number};
 map: {size:number;buildings:Obstacle[];covers:Obstacle[]};
 agents: Array<{id:string;name:string;archetype:string;color:string;x:number;z:number;yaw:number;hp:number;shield:number;kills:number;alive:boolean;weapon:string;ammo:number;intent:string;action:string;hitTick:number;fireTick:number;targetId:string|null}>;
 loot: Array<{id:string;x:number;z:number;kind:string;active:boolean}>;
 events: Array<{id:number;tick:number;kind:string;actor:string|null;target:string|null;text:string;x:number;z:number}>;
 checksum: string;
}
interface Obstacle {id:string;x:number;z:number;w:number;d:number;h:number;kind:string}
```

Map covers 120 units centered at (0,0); walkable ground y=0; obstacles are axis-aligned solid rectangles consistent across movement, ray obstruction and rendering. Characters are about 2.8 units tall. Yaw zero faces +Z; `atan2(dx,dz)` faces a target. `time` is seconds since match start. Render update receives the copied snapshot and never sends game actions.

`public/ai-battle-royale/world.js` exports `createBattlefield(THREE, map)` returning `{group, update(snapshot, elapsed), dispose()}`. It constructs terrain, ocean, distant landforms, architecture matching obstacle rectangles, rich cover and foliage. Render-only details stay outside traversable routes or are nonblocking surface detail.

`public/ai-battle-royale/characters.js` exports `createCombatant(THREE, agent)` returning `{group, update(agent, dt, elapsed), dispose()}`. It provides articulated original humanoids, readable gear/face silhouettes, archetype differences, coherent materials, weapon and body animation for running/aiming/firing/reloading/healing/elimination. Rotation convention above is binding. Actor interpolation is renderer-owned, so update animates local rig and does not overwrite group world transforms.

The host serves `/royale/`, `/royale/state`, `/royale/health`, `/royale/dev/` and locally pinned Three ESM files. Browser supports director/follow/tactical cameras, selecting agents, mute, reduced motion and clean feed. Camera/user controls never mutate authority.

## Observable acceptance checks

- All roster entries render recognizable 3D bodies and functioning animation, equipment and state feedback.
- A coherent complete 3D environment with no missing resources or WebGL errors.
- Fixed seeds reproduce checkpoints; restore reproduces continuation; bounded state across many restarts.
- Collision prevents walking or shooting through solid buildings; AI moves purposefully and resolves complete matches.
- A viewer can identify remaining contenders, danger, focused combatant and result at desktop and phone sizes.
- Repeated full matches resolve and restart without user input; technical failures cannot masquerade as victory.
- Actual browser capture and independent specification/visual/functional review with findings fed into builders.
- Live development page records current build, screenshots, reference links, review history and open gaps. It is separate from player UI.

Fortnite parity, production streaming certification, 72-hour soak and external canary remain evidence-gated. Record remaining gaps candidly while continuing to improve.
