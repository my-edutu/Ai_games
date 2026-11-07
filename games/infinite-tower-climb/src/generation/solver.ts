import type{TowerConfig}from'../config/schema';
import type{TowerChunk,TowerPlatform}from'../state/types';
import{guardianArenaClearanceX}from'./chunks';

export interface TowerMovementEnvelope{maxRise:number;airTicks:number;maxHorizontalGap:number}
export interface TowerReachability{startPlatformId?:string;reachablePlatformIds:string[];routePlatformIds:string[]|null;envelope:TowerMovementEnvelope}

export function towerMovementEnvelope(config:TowerConfig):TowerMovementEnvelope{
  let velocity=config.jumpImpulse,displacement=0,maxRise=0,airTicks=0;
  for(let tick=0;tick<240;tick++){
    velocity=Math.max(-config.maxFallSpeed,velocity-config.gravity);
    displacement+=velocity;
    airTicks++;
    if(displacement>maxRise)maxRise=displacement;
    if(tick>0&&displacement<=0)break;
  }
  // A climber may build full run speed before launch. Keep a conservative
  // margin for collider width, collision quantisation and late air steering.
  const rawHorizontal=config.maxRunSpeed*Math.max(1,airTicks-2);
  const maxHorizontalGap=Math.max(0,rawHorizontal-config.playerHalfWidth*2-12000);
  return{maxRise,airTicks,maxHorizontalGap};
}

function top(platform:TowerPlatform){return platform.y+platform.height}
function horizontalGap(a:TowerPlatform,b:TowerPlatform){
  if(a.x<=b.x+b.width&&a.x+a.width>=b.x)return 0;
  return b.x>a.x?b.x-(a.x+a.width):a.x-(b.x+b.width);
}
function supportsSpawn(platform:TowerPlatform,chunk:TowerChunk,config:TowerConfig){
  const bottom=chunk.spawn.y-config.playerHalfHeight;
  return platform.y+platform.height<=bottom+1&&platform.x<=chunk.spawn.x&&platform.x+platform.width>=chunk.spawn.x;
}
export function canTraversePlatformEdge(a:TowerPlatform,b:TowerPlatform,envelope:TowerMovementEnvelope){
  const rise=top(b)-top(a);
  if(rise<=0||rise>envelope.maxRise)return false;
  return horizontalGap(a,b)<=envelope.maxHorizontalGap;
}
export function analyzeTowerReachability(chunk:TowerChunk,config:TowerConfig):TowerReachability{
  const platforms=[...chunk.platforms].sort((a,b)=>top(a)-top(b)||a.id.localeCompare(b.id));
  const start=platforms.filter(p=>supportsSpawn(p,chunk,config)).sort((a,b)=>top(b)-top(a)||a.id.localeCompare(b.id))[0];
  const envelope=towerMovementEnvelope(config);
  if(!start)return{reachablePlatformIds:[],routePlatformIds:null,envelope};
  const previous=new Map<string,string|undefined>([[start.id,undefined]]),queue=[start];
  let goal:TowerPlatform|undefined;
  while(queue.length){
    const current=queue.shift()!;
    // A route terminates only at a physically reachable exit. The centre of
    // a short legal climber may remain BELOW exitY while standing on cap:
    // ordinary floors can still earn the exit with a source-legal cap jump;
    // opt-in guardian floors instead allow a supported, full-body horizontal
    // crossing after the actual defeat. Do not invent an early shortcut from
    // p5/p6, and do not rewrite frozen runtime physics or any result state.
    const cap=current.id===`f${chunk.floor}:cap`;
    const centerAtRest=top(current)+config.playerHalfHeight;
    const realCapJump=cap&&centerAtRest+envelope.maxRise>=chunk.exitY;
    const realGuardianWalkway=cap&&chunk.guardian&&
      config.guardianArenaHazards===true&&config.guardianSecondWind===true&&
      guardianArenaClearanceX(current,config.playerHalfWidth)+
        config.playerHalfWidth<=current.x+current.width;
    if(centerAtRest>=chunk.exitY||realCapJump||realGuardianWalkway){
      goal=current;break;
    }
    for(const candidate of platforms){
      if(previous.has(candidate.id)||!canTraversePlatformEdge(current,candidate,envelope))continue;
      previous.set(candidate.id,current.id);queue.push(candidate);
    }
  }
  let route:string[]|null=null;
  if(goal){route=[];let cursor:string|undefined=goal.id;while(cursor!==undefined){route.push(cursor);cursor=previous.get(cursor)}route.reverse()}
  return{startPlatformId:start.id,reachablePlatformIds:[...previous.keys()].sort(),routePlatformIds:route,envelope};
}
export function solveTowerRoute(chunk:TowerChunk,config:TowerConfig){return analyzeTowerReachability(chunk,config).routePlatformIds}
