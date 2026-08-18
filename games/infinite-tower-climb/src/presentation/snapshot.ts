import{checksum}from'../../../../packages/replay/src/index';
import type{TowerState}from'../state/types';

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
  player:{x:number;y:number;vx:number;vy:number;halfWidth:number;halfHeight:number;facing:-1|1;health:number;maxHealth:number;stamina:number;maxStamina:number;shieldCharges:number;state:string;score:number};
  platforms:Array<{id:string;kind:string;x:number;y:number;width:number;height:number}>;
  hazards:Array<{id:string;kind:string;x:number;y:number;width:number;height:number;active:boolean}>;
  enemies:Array<{id:string;kind:string;x:number;y:number;halfWidth:number;halfHeight:number;health:number;maxHealth:number;active:boolean;telegraph:boolean}>;
  projectiles:Array<{id:string;owner:'player'|'enemy';x:number;y:number;vx:number;vy:number}>;
  pickups:Array<{id:string;kind:string;x:number;y:number;value:number}>;
  buildTags:string[];
  upgradeOffers:Array<{id:string;family:string;name:string}>;
  intent:{mode:string;summary:string;confidencePermille:number;fallback:boolean};
  progress:{height:number;floorProgressPermille:number;nextGuardianFloor:number;recordDelta:number;floorsCleared:number};
  dangerPermille:number;
  result?:{reason:string;kind:string};
  authorityChecksum:string;
  publicChecksum:string;
}
function activeHazard(h:{activeFromTick:number;activeEvery:number;activeFor:number},tick:number){return tick>=h.activeFromTick&&((tick-h.activeFromTick)%h.activeEvery)<h.activeFor}
export function createTowerRenderSnapshot(state:TowerState):Readonly<TowerRenderSnapshot>{
  const chunk=state.chunks.find(c=>c.floor===state.floor)??state.chunks[state.chunks.length-1];
  const activeEnemies=state.enemies.filter(e=>e.floor===state.floor&&e.active);
  const dangerousProjectile=state.projectiles.some(p=>p.active&&p.owner==='enemy'&&Math.abs(p.position.x-state.player.position.x)<80000&&Math.abs(p.position.y-state.player.position.y)<50000);
  const dangerousEnemy=activeEnemies.some(e=>Math.abs(e.position.x-state.player.position.x)<70000&&Math.abs(e.position.y-state.player.position.y)<50000);
  const dangerousHazard=chunk.hazards.some(h=>activeHazard(h,state.tick)&&Math.abs(h.x+h.width/2-state.player.position.x)<65000&&Math.abs(h.y+h.height/2-state.player.position.y)<50000);
  const floorHeight=Math.max(1,chunk.exitY-chunk.baseY),floorProgress=Math.max(0,Math.min(1000,Math.floor((state.player.position.y-chunk.baseY)*1000/floorHeight)));
  const nextGuardianFloor=state.floor+(state.config.guardianInterval-(state.floor%state.config.guardianInterval||state.config.guardianInterval));
  const base={
    version:1 as const,
    runToken:checksum({runId:state.runId}),revision:state.tick*1000+state.stats.floorsCleared,tick:state.tick,lifecycle:state.lifecycle,
    floor:state.floor,theme:chunk.theme,worldWidth:state.config.worldWidth,chunkBaseY:chunk.baseY,chunkHeight:chunk.height,
    player:{x:state.player.position.x,y:state.player.position.y,vx:state.player.velocity.x,vy:state.player.velocity.y,halfWidth:state.player.halfWidth,halfHeight:state.player.halfHeight,facing:state.player.facing,health:state.player.health,maxHealth:state.player.maxHealth,stamina:state.player.stamina,maxStamina:state.player.maxStamina,shieldCharges:state.player.shieldCharges,state:state.player.state,score:state.player.score},
    platforms:chunk.platforms.map(p=>({id:p.id,kind:p.kind,x:p.x,y:p.y,width:p.width,height:p.height})).sort((a,b)=>a.id.localeCompare(b.id)),
    hazards:chunk.hazards.map(h=>({id:h.id,kind:h.kind,x:h.x,y:h.y,width:h.width,height:h.height,active:activeHazard(h,state.tick)})).sort((a,b)=>a.id.localeCompare(b.id)),
    enemies:state.enemies.filter(e=>e.floor===state.floor).map(e=>({id:e.id,kind:e.kind,x:e.position.x,y:e.position.y,halfWidth:e.halfWidth,halfHeight:e.halfHeight,health:e.health,maxHealth:e.maxHealth,active:e.active,telegraph:e.telegraphUntilTick>state.tick})).sort((a,b)=>a.id.localeCompare(b.id)),
    projectiles:state.projectiles.filter(p=>p.floor===state.floor&&p.active).map(p=>({id:p.id,owner:p.owner,x:p.position.x,y:p.position.y,vx:p.velocity.x,vy:p.velocity.y})).sort((a,b)=>a.id.localeCompare(b.id)),
    pickups:state.pickups.filter(p=>p.floor===state.floor&&!p.collected).map(p=>({id:p.id,kind:p.kind,x:p.position.x,y:p.position.y,value:p.value})).sort((a,b)=>a.id.localeCompare(b.id)),
    buildTags:[...state.build.upgradeIds].slice(-6),upgradeOffers:state.pendingUpgradeOffers.map(o=>({id:o.id,family:o.family,name:o.name})),
    intent:{mode:state.ai.mode,summary:state.ai.intent,confidencePermille:Math.round(state.ai.confidence*1000),fallback:state.ai.mode==='recovering'},
    progress:{height:state.stats.maxHeight,floorProgressPermille:floorProgress,nextGuardianFloor,recordDelta:state.stats.maxHeight-state.config.launchFloor*state.config.chunkHeight,floorsCleared:state.stats.floorsCleared},
    dangerPermille:dangerousProjectile||dangerousHazard?1000:dangerousEnemy?750:state.player.health<=2?650:150,
    result:state.result?{reason:state.result.reason,kind:state.result.kind}:undefined,
    authorityChecksum:checksum({tick:state.tick,floor:state.floor,player:state.player,enemies:state.enemies,projectiles:state.projectiles,pickups:state.pickups,build:state.build,result:state.result})
  };
  const snapshot={...base,publicChecksum:checksum(base)};
  return deepFreeze(snapshot);
}
