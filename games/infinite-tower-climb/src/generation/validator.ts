import type{TowerConfig}from'../config/schema';import type{TowerChunk}from'../state/types';import{analyzeTowerReachability}from'./solver';
export interface TowerChunkValidation{valid:boolean;issues:string[];reachablePlatformIds:string[];routePlatformIds:string[]|null}
export function validateTowerChunk(chunk:TowerChunk,config:TowerConfig):TowerChunkValidation{
  const issues:string[]=[],ids=new Set<string>();
  if(chunk.platforms.length<6||chunk.platforms.length>config.maxPlatformsPerChunk)issues.push('platform-count');
  if(chunk.hazards.length>config.maxHazardsPerChunk)issues.push('hazard-count');
  for(const p of chunk.platforms){if(ids.has(p.id))issues.push('duplicate-platform');ids.add(p.id);if(p.width<=0||p.height<=0||p.x<0||p.x+p.width>config.worldWidth||p.y<chunk.baseY-50000||p.y+p.height>chunk.baseY+chunk.height+50000)issues.push(`platform-bounds:${p.id}`)}
  if(chunk.spawn.x-config.playerHalfWidth<0||chunk.spawn.x+config.playerHalfWidth>config.worldWidth)issues.push('spawn-x');
  // The opt-in guardian's physically walked cap arrives on the successor
  // ground ROOF at baseY-16k (its ground collider starts at baseY-28k).
  // The original baseY-only hazard validator incorrectly quarantined the
  // complete game whenever a legitimate floor-nine slot-one obstacle spawned
  // on this very roof. Keep the historic bounds for every other floor.
  const guardianSuccessor=config.guardianArenaHazards===true&&
    config.guardianSecondWind===true&&chunk.floor>1&&
    (chunk.floor-1)%config.guardianInterval===0;
  const expectedGroundTop=chunk.baseY-16000;
  if(guardianSuccessor){
    const ground=chunk.platforms.find(p=>p.id===`f${chunk.floor}:ground`);
    // A forged or displaced floor must never acquire lower hazard clearance.
    // The continuous physical support is a condition, not an assumption.
    if(!ground||ground.y+ground.height!==expectedGroundTop)
      issues.push('guardian-successor-ground');
  }
  const minimumHazardY=guardianSuccessor?expectedGroundTop:chunk.baseY;
  for(const h of chunk.hazards)if(h.width<=0||h.height<=0||
    h.x<0||h.x+h.width>config.worldWidth||
    h.y<minimumHazardY||h.y+h.height>chunk.baseY+chunk.height)
    issues.push(`hazard-bounds:${h.id}`);
  const reach=analyzeTowerReachability(chunk,config);if(!reach.startPlatformId)issues.push('spawn-support');if(!reach.routePlatformIds)issues.push('exit-unreachable');
  return{valid:issues.length===0,issues:[...new Set(issues)].sort(),reachablePlatformIds:reach.reachablePlatformIds,routePlatformIds:reach.routePlatformIds}
}
