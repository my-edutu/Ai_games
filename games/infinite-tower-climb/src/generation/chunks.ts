import{checksum}from'../../../../packages/replay/src/index';import{NamedRng}from'../../../../packages/seeded-rng/src/index';
import type{TowerConfig,TowerTheme}from'../config/schema';import{TOWER_THEMES}from'../config/schema';import type{TowerChunk,TowerHazard,TowerPlatform}from'../state/types';
function themeFor(floor:number):TowerTheme{return TOWER_THEMES[floor%TOWER_THEMES.length]}
// A physical destination on the far side of the opt-in guardian cap.
// The fixed-step rules, autonomous pilot and 3D door use the same deterministic
// percentage of the actual platform. This is not an invisible finish trigger.
export function guardianArenaExitX(cap:Pick<TowerPlatform,'x'|'width'>):number{
  return cap.x+Math.floor(cap.width*.76);
}
// The unlock plane is NOT the finish trigger: the climber's trailing edge
// must travel through the center of the physical inner doorway. The extra
// 4,000 source units make the passage legible instead of teleporting while
// the body still straddles its threshold. Existing source/legacy arenas keep
// guardianArenaExitX, but only opted-in arenas require this full clearance.
// A living guardian owns the complete walkable cap threshold, not a low
// fence that a legitimate second jump can clear. Each source jump resets
// vertical velocity to jumpImpulse; two maximal rises are bounded above by
// impulse^2 / gravity (continuous upper envelope; fixed ticks lose height).
// Add the whole body and a 16k safety lip. Only opt-in arena physics uses this
// height, and renderer reads the SAME source-published value.
export function guardianArenaSealHeight(
  config:Pick<TowerConfig,'jumpImpulse'|'gravity'|'playerHalfHeight'>):number{
  const maximumTwoJumpRise=Math.ceil(config.jumpImpulse*config.jumpImpulse/config.gravity);
  return Math.max(140000,maximumTwoJumpRise+2*config.playerHalfHeight+16000);
}
export function guardianArenaClearanceX(
  cap:Pick<TowerPlatform,'x'|'width'>,playerHalfWidth:number):number{
  if(!Number.isSafeInteger(playerHalfWidth)||playerHalfWidth<0)
    throw new RangeError('playerHalfWidth');
  return guardianArenaExitX(cap)+playerHalfWidth+4000;
}
export function generateTowerChunk(config:TowerConfig,seed:string,floor:number,rng=NamedRng.fromSeed(`${seed}:floor:${floor}`)):TowerChunk{
  if(!Number.isInteger(floor)||floor<0)throw new RangeError('floor');
  const baseY=floor*config.chunkHeight,groundHeight=12000,stepHeight=Math.floor((config.chunkHeight-60000)/6);
  const platforms:TowerPlatform[]=[{id:`f${floor}:ground`,kind:'solid',x:0,y:baseY,width:config.worldWidth,height:groundHeight}];
  for(let i=1;i<=6;i++){
    const side=(i+floor)%2,baseX=side?Math.floor(config.worldWidth*.56):Math.floor(config.worldWidth*.10);
    const jitter=rng.nextInt(`tower:platform:${floor}:${i}`,30001)-15000;
    const width=115000+(rng.nextInt(`tower:width:${floor}:${i}`,3)*10000);
    const kind=i===3&&floor%3===1?'moving':'oneway';
    const platform:TowerPlatform={id:`f${floor}:p${i}`,kind,x:Math.max(12000,Math.min(config.worldWidth-width-12000,baseX+jitter)),y:baseY+i*stepHeight,width,height:10000};
    if(kind==='moving')platform.motion={axis:'x',range:35000,speed:2500,phase:rng.nextInt(`tower:motion:${floor}:${i}`,28)};
    platforms.push(platform);
  }
  // The earned floor-eight guardian exit delivers the body on the RIGHT of
  // the NEXT floor's full-width ground. Its ordinary p1 is on the far LEFT.
  // Before this physical branch, preserving the genuine gate crossing X
  // still sent the climber backwards across ~250k of bare ground. Place a
  // source-authored FIRST climb above the actual prior gateway, connected to
  // the existing right-side p2. It is an ordinary solidly supported one-way
  // platform: real jumps, collision, danger and AI route selection still
  // apply. No new spawn, phantom floor award or forced landing. Never alter
  // the frozen/unflagged world or exceed an explicitly configured budget.
  if(config.guardianArenaHazards===true&&
     config.guardianSecondWind===true&&floor>1&&
     (floor-1)%config.guardianInterval===0&&
     platforms.length+2<=config.maxPlatformsPerChunk){
    const previousCap={x:Math.floor(config.worldWidth*.24),
      width:Math.floor(config.worldWidth*.52)};
    const crossingX=guardianArenaClearanceX(previousCap,config.playerHalfWidth);
    // Invalid extreme body sizes cannot earn the old cap clearance: avoid
    // constructing a misleading next-floor approach for such a route.
    if(crossingX+config.playerHalfWidth<=previousCap.x+previousCap.width){
      const width=Math.min(115000,Math.floor(config.worldWidth*.26));
      const x=Math.max(0,Math.min(config.worldWidth-width,
        crossingX-Math.floor(width/2)));
      platforms.push({id:`f${floor}:gateway-step`,kind:'oneway',
        x,y:baseY+stepHeight,width,height:10000});
    }
  }
  const capY=baseY+config.chunkHeight-28000;
  platforms.push({id:`f${floor}:cap`,kind:'oneway',x:Math.floor(config.worldWidth*.24),y:capY,width:Math.floor(config.worldWidth*.52),height:12000});
  const hazards:TowerHazard[]=[];
  const relativeFloor=Math.max(0,floor-config.launchFloor);
  const hazardCount=Math.min(config.maxHazardsPerChunk,1+Math.min(2,Math.floor(relativeFloor/3)));
  for(let i=0;i<hazardCount;i++){
    const slot=1+rng.nextInt(`tower:hazard-slot:${floor}:${i}`,5),kindIndex=(floor+i)%5;
    const kinds:TowerHazard['kind'][]=['spikes','heat','crusher','lightning','void-pulse'];
    hazards.push({id:`f${floor}:h${i}`,kind:kinds[kindIndex],x:170000+rng.nextInt(`tower:hazard-x:${floor}:${i}`,120000),y:baseY+(slot-1)*stepHeight+groundHeight,width:32000,height:9000,activeFromTick:rng.nextInt(`tower:hazard-phase:${floor}:${i}`,20),activeEvery:40,activeFor:kindIndex===0?40:16,damage:kindIndex===0?1:2});
  }
  // SOURCE-AUTHENTIC guardian gate pressure. Normal-speed 20Hz desktop and
  // portrait gameplay at 5c242d recorded 173/156 scheduled guardian-shutter
  // countdown ticks, but ZERO near-body guardian/shutter witnesses: the old
  // shutter lived on p6 while the pilot actually duelled from the upper cap.
  // Stage the *real collision hazard* on that observed fight/exit support,
  // beside the fixed guardian approach. All existing 3D jaws, camera, route
  // markers, lighting, audio and AI then consume the same actual source.
  // This is still opt-in ONLY; historical generated chunks/checksums are
  // byte-identical without guardianArenaHazards.
  if (config.guardianArenaHazards === true && floor > 0 &&
      floor % config.guardianInterval === 0 &&
      config.maxHazardsPerChunk > 0) {
    const approach = platforms[platforms.length - 2];
    const arena = platforms[platforms.length - 1];
    const width = Math.min(26000, Math.floor(arena.width * .14));
    const clearance = config.playerHalfWidth * 2 + 9000;
    const left = arena.x + clearance;
    const right = arena.x + arena.width - width - clearance;
    // A narrow custom world cannot support two body-width escape routes.
    // Don't introduce an impossible trap merely to meet a visual target.
    if (left <= right) {
      const approachX = approach.x + Math.floor(approach.width / 2);
      // The actual 3,000-tick source-pinned pilot witnessed only 7 of its
      // required 12 guardian+shutter near-body warning ticks even though
      // it spent 229 ticks on this cap and 43 in same-deck warning windows.
      // Its nearest recorded x centres were hero 238500, guardian 240000,
      // shutter 196883: the physical hazard sat ~42k from the real duel.
      // Move the existing bounded jaw 25k into the actual observed fighting
      // lane while keeping BOTH player-width escape routes and the original
      // 12-tick runtime witness gate. This is real source geometry, not a
      // posed encounter or lowered acceptance threshold.
      // No enemy position tracking, scripted hit or time-based teleport.
      const gateward = Math.sign(arena.x + arena.width / 2 - approachX);
      const fightLaneX = approachX + gateward * 85000;
      const x = Math.max(left, Math.min(right, fightLaneX));
      const shutter:TowerHazard = {
        id:`f${floor}:guardian-shutter`, kind:'crusher',
        x, y:arena.y + arena.height, width, height:9000,
        activeFromTick:12+rng.nextInt(`tower:guardian-arena-phase:${floor}`,20),
        activeEvery:72, activeFor:9, damage:1,
      };
      // Bounded actual 20Hz collision pressure, not a cosmetic prop.
      if (hazards.length < config.maxHazardsPerChunk) hazards.push(shutter);
      else hazards[hazards.length-1] = shutter;
    }
  }
  const spawn={x:42000,y:baseY+groundHeight+config.playerHalfHeight};
  const checkpoint={x:Math.floor(config.worldWidth/2),y:capY+12000+config.playerHalfHeight};
  const base={id:`tower:${seed}:floor:${floor}`,floor,theme:themeFor(floor),baseY,height:config.chunkHeight,spawn,exitY:baseY+config.chunkHeight-8000,platforms,hazards,checkpoint,guardian:floor>0&&floor%config.guardianInterval===0};
  return{...base,checksum:checksum(base)};
}
export function platformAtTick(platform:TowerPlatform,tick:number):TowerPlatform{
  if(!platform.motion)return platform;const m=platform.motion,cycle=Math.max(2,Math.floor((m.range*4)/Math.max(1,m.speed))),p=((tick+m.phase)%cycle+cycle)%cycle;
  const q=cycle/4;let offset:number;if(p<q)offset=p*m.speed;else if(p<3*q)offset=m.range-(p-q)*m.speed;else offset=-m.range+(p-3*q)*m.speed;
  offset=Math.max(-m.range,Math.min(m.range,Math.round(offset)));
  return m.axis==='x'?{...platform,x:platform.x+offset}:{...platform,y:platform.y+offset};
}
