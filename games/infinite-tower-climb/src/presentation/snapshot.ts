import{checksum}from'../../../../packages/replay/src/index';
import type{TowerState}from'../state/types';
import{platformAtTick,guardianArenaExitX,guardianArenaSealHeight}from'../generation/chunks';

function deepFreeze<T>(value:T):Readonly<T>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);
    for(const child of Object.values(value as Record<string,unknown>))deepFreeze(child);
  }
  return value as Readonly<T>;
}

export interface TowerRenderSnapshot{
  version:1;
  runToken:string;
  revision:number;
  tick:number;
  lifecycle:TowerState['lifecycle'];
  floor:number;
  theme:string;
  worldWidth:number;
  chunkBaseY:number;
  chunkHeight:number;
  player:{x:number;y:number;vx:number;vy:number;halfWidth:number;halfHeight:number;facing:-1|1;health:number;maxHealth:number;stamina:number;maxStamina:number;shieldCharges:number;state:string;score:number;attacking:boolean;grounded?:boolean;groundedPlatformId?:string};
  // Published only for the opt-in physical cap guardian. Same source exit as AI and rules.
  guardianExitX?:number;
  // Live-only source geometry: a legal double jump cannot clear the living seal.
  guardianSealHeight?:number;
  // Source-owned witnessed physical 8→9 event survives dropped client frames;
  // absent on frozen/default and on unrelated game scenarios.
  lastGuardianCrossing?:TowerState['lastGuardianCrossing'];
  platforms:Array<{id:string;kind:string;x:number;y:number;width:number;height:number}>;
  hazards:Array<{id:string;kind:string;x:number;y:number;width:number;height:number;active:boolean;chargeTicksRemaining?:number}>;
  enemies:Array<{id:string;kind:string;x:number;y:number;halfWidth:number;halfHeight:number;health:number;maxHealth:number;active:boolean;telegraph:boolean;telegraphTicksRemaining?:number;telegraphTotalTicks?:number;staggerTicksRemaining?:number;facing:-1|1;attackCooldown:number}>;
  projectiles:Array<{id:string;owner:'player'|'enemy';x:number;y:number;vx:number;vy:number}>;
  pickups:Array<{id:string;kind:string;x:number;y:number;value:number}>;
  buildTags:string[];
  upgradeOffers:Array<{id:string;family:string;name:string}>;
  intent:{mode:string;summary:string;confidencePermille:number;fallback:boolean;targetPlatformId?:string};
  progress:{height:number;floorProgressPermille:number;nextGuardianFloor:number;recordDelta:number;floorsCleared:number};
  dangerPermille:number;
  result?:{reason:string;kind:string};
  authorityChecksum:string;
  publicChecksum:string;
}
function activeHazard(h:{activeFromTick:number;activeEvery:number;activeFor:number},tick:number){return tick>=h.activeFromTick&&((tick-h.activeFromTick)%h.activeEvery)<h.activeFor}
export function observedHazardChargeTicks(
  h:{activeFromTick:number;activeEvery:number;activeFor:number},
  tick:number,window=12
):number{
  if(![h.activeFromTick,h.activeEvery,h.activeFor,tick,window].every(Number.isSafeInteger)||
    tick<0||h.activeFromTick<0||h.activeEvery<=0||h.activeFor<=0||
    h.activeFor>=h.activeEvery||window<=0)return 0;
  const remaining=tick<h.activeFromTick?h.activeFromTick-tick:
    (()=>{const phase=(tick-h.activeFromTick)%h.activeEvery;
      return phase<h.activeFor?0:h.activeEvery-phase;})();
  return remaining>=1&&remaining<=window?remaining:0;
}
// Legacy/default snapshots keep their exact key order and pinned public checksum.
// The live stream explicitly opts in to observed windup ticks; historical-v1
// replay captures and their frozen provenance are not silently rewritten.
export function createTowerRenderSnapshot(state:TowerState,options:{includeWindupTicks?:boolean}={}):Readonly<TowerRenderSnapshot>{
  const chunk=state.chunks.find(c=>c.floor===state.floor)??state.chunks[state.chunks.length-1];
  const activeEnemies=state.enemies.filter(e=>e.floor===state.floor&&e.active);
  const dangerousProjectile=state.projectiles.some(p=>p.active&&p.owner==='enemy'&&Math.abs(p.position.x-state.player.position.x)<80000&&Math.abs(p.position.y-state.player.position.y)<50000);
  const dangerousEnemy=activeEnemies.some(e=>Math.abs(e.position.x-state.player.position.x)<70000&&Math.abs(e.position.y-state.player.position.y)<50000);
  const dangerousHazard=chunk.hazards.some(h=>activeHazard(h,state.tick)&&Math.abs(h.x+h.width/2-state.player.position.x)<65000&&Math.abs(h.y+h.height/2-state.player.position.y)<50000);
  const floorHeight=Math.max(1,chunk.exitY-chunk.baseY),floorProgress=Math.max(0,Math.min(1000,Math.floor((state.player.position.y-chunk.baseY)*1000/floorHeight)));
  const nextGuardianFloor=state.floor>0&&state.floor%state.config.guardianInterval===0?state.floor:state.floor+state.config.guardianInterval-state.floor%state.config.guardianInterval;
  const lifecycleRevision={running:0,result:1,intermission:2}[state.lifecycle];
  // The genuine 20-Hz cap-exit plane is immutable world geometry, not a
  // projection of the guardian's current height. A recoil, knock-up or death
  // must never shift the rendered bronze gate away from the walkable exit.
  // Historical/unflagged public snapshots keep their original keys/checksum.
  const arenaCap=state.config.guardianArenaHazards===true&&
    state.config.guardianSecondWind===true&&chunk.guardian
    ?chunk.platforms.find(p=>p.id===`f${state.floor}:cap`):undefined;
  const guardianExitX=arenaCap&&state.enemies.some(e=>e.floor===state.floor&&
    e.kind==='guardian'&&(e.active||(e.health<=0&&!e.active)))
    ?guardianArenaExitX(arenaCap):undefined;
  const base={
    version:1 as const,
    runToken:checksum({runId:state.runId}),revision:(state.tick*1000+state.stats.floorsCleared)*3+lifecycleRevision,tick:state.tick,lifecycle:state.lifecycle,
    floor:state.floor,theme:chunk.theme,worldWidth:state.config.worldWidth,chunkBaseY:chunk.baseY,chunkHeight:chunk.height,
    player:{x:state.player.position.x,y:state.player.position.y,vx:state.player.velocity.x,vy:state.player.velocity.y,halfWidth:state.player.halfWidth,halfHeight:state.player.halfHeight,facing:state.player.facing,health:state.player.health,maxHealth:state.player.maxHealth,stamina:state.player.stamina,maxStamina:state.player.maxStamina,shieldCharges:state.player.shieldCharges,state:state.player.state,score:state.player.score,attacking:state.player.attackCooldown>0&&state.player.attackCooldown>=state.config.attackCooldownTicks-3,
      // Opt-in source-owned cap contact (not a cosmetic Y/state guess).
      // Omitted from frozen historical/default public snapshots and checksums.
      ...(state.config.guardianArenaHazards===true&&state.config.guardianSecondWind===true
        ?{grounded:state.player.grounded,groundedPlatformId:state.player.groundedPlatformId}:{})},
    platforms:chunk.platforms.map(p=>platformAtTick(p,state.tick)).map(p=>({id:p.id,kind:p.kind,x:p.x,y:p.y,width:p.width,height:p.height})).sort((a,b)=>a.id.localeCompare(b.id)),
    hazards:chunk.hazards.map(h=>({id:h.id,kind:h.kind,x:h.x,y:h.y,width:h.width,height:h.height,active:activeHazard(h,state.tick),...(options.includeWindupTicks?{chargeTicksRemaining:observedHazardChargeTicks(h,state.tick)}:{})})).sort((a,b)=>a.id.localeCompare(b.id)),
    enemies:state.enemies.filter(e=>e.floor===state.floor).map(e=>({id:e.id,kind:e.kind,x:e.position.x,y:e.position.y,halfWidth:e.halfWidth,halfHeight:e.halfHeight,health:e.health,maxHealth:e.maxHealth,active:e.active,telegraph:e.telegraphUntilTick>state.tick,...(options.includeWindupTicks?{telegraphTicksRemaining:Math.max(0,Math.min(8,e.telegraphUntilTick-state.tick)),...(e.kind==='guardian'?{staggerTicksRemaining:Math.max(0,Math.min(state.config.guardianSecondWind===true&&state.config.guardianArenaHazards===true?14:10,(e.staggerUntilTick??0)-state.tick)),...(state.config.guardianSecondWind===true?{telegraphTotalTicks:e.telegraphUntilTick>state.tick&&(e.telegraphDurationTicks===6||e.telegraphDurationTicks===8)?e.telegraphDurationTicks:(e.health>0&&e.health*2<=e.maxHealth?6:8)}:{})}:{})}:{}),...(options.includeWindupTicks&&state.config.guardianSecondWind===true&&e.kind==='guardian'?{guardTicksRemaining:Math.max(0,(e.guardUntilTick??0)-state.tick)}:{}),facing:e.facing,attackCooldown:e.cooldown})).sort((a,b)=>a.id.localeCompare(b.id)),
    projectiles:state.projectiles.filter(p=>p.floor===state.floor&&p.active).map(p=>({id:p.id,owner:p.owner,x:p.position.x,y:p.position.y,vx:p.velocity.x,vy:p.velocity.y})).sort((a,b)=>a.id.localeCompare(b.id)),
    pickups:state.pickups.filter(p=>p.floor===state.floor&&!p.collected).map(p=>({id:p.id,kind:p.kind,x:p.position.x,y:p.position.y,value:p.value})).sort((a,b)=>a.id.localeCompare(b.id)),
    buildTags:[...state.build.upgradeIds].slice(-6),upgradeOffers:state.pendingUpgradeOffers.map(o=>({id:o.id,family:o.family,name:o.name})),
    intent:{mode:state.ai.mode,summary:state.ai.intent,confidencePermille:Math.round(state.ai.confidence*1000),fallback:state.ai.mode==='recovering',targetPlatformId:state.ai.targetPlatformId},
    progress:{height:state.stats.maxHeight,floorProgressPermille:floorProgress,nextGuardianFloor,recordDelta:state.stats.maxHeight-state.config.launchFloor*state.config.chunkHeight,floorsCleared:state.stats.floorsCleared},
    dangerPermille:dangerousProjectile||dangerousHazard?1000:dangerousEnemy?750:state.player.health<=2?650:150,
    result:state.result?{reason:state.result.reason,kind:state.result.kind}:undefined,
    ...(guardianExitX!==undefined?{
      guardianExitX,guardianSealHeight:guardianArenaSealHeight(state.config)}:{}),
    ...(state.config.guardianArenaHazards===true &&
      state.config.guardianSecondWind===true &&
      state.lastGuardianCrossing &&
      state.floor===state.lastGuardianCrossing.toFloor &&
      state.tick>state.lastGuardianCrossing.sourceTick &&
      state.tick-state.lastGuardianCrossing.sourceTick<=12
      ?{lastGuardianCrossing:state.lastGuardianCrossing}:{}),
    authorityChecksum:checksum({tick:state.tick,floor:state.floor,player:state.player,enemies:state.enemies,projectiles:state.projectiles,pickups:state.pickups,build:state.build,result:state.result})
  };
  const snapshot={...base,publicChecksum:checksum(base)};
  return deepFreeze(snapshot);
}
