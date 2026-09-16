import{checksum}from'../../../../packages/replay/src/index';import{NamedRng}from'../../../../packages/seeded-rng/src/index';
import type{TowerConfig,TowerTheme}from'../config/schema';import{TOWER_THEMES}from'../config/schema';import type{TowerChunk,TowerPlatform}from'../state/types';import{buildTowerRoom}from'./room-grammar';
function themeFor(floor:number):TowerTheme{return TOWER_THEMES[floor%TOWER_THEMES.length]}
export function generateTowerChunk(config:TowerConfig,seed:string,floor:number,rng=NamedRng.fromSeed(`${seed}:floor:${floor}`)):TowerChunk{
  if(!Number.isInteger(floor)||floor<0)throw new RangeError('floor');
  const baseY=floor*config.chunkHeight,theme=themeFor(floor),room=buildTowerRoom(config,floor,theme,rng),groundHeight=12000,cap=room.platforms[room.platforms.length-1],guardian=floor>0&&floor%config.guardianInterval===0;
  const spawn={x:42000,y:baseY+groundHeight+config.playerHalfHeight};
  const checkpoint={x:cap.x+Math.floor(cap.width/2),y:cap.y+cap.height+config.playerHalfHeight};
  const base={id:`tower:${seed}:floor:${floor}`,floor,theme,roomArchetype:room.roomArchetype,landmarkName:room.landmarkName,encounterSlots:room.encounterSlots,baseY,height:config.chunkHeight,spawn,exitY:baseY+config.chunkHeight-8000,platforms:room.platforms,hazards:room.hazards,checkpoint,guardian};
  return{...base,checksum:checksum(base)};
}
export function platformAtTick(platform:TowerPlatform,tick:number):TowerPlatform{
  if(!platform.motion)return platform;const m=platform.motion,cycle=Math.max(2,Math.floor((m.range*4)/Math.max(1,m.speed))),p=((tick+m.phase)%cycle+cycle)%cycle;
  const q=cycle/4;let offset:number;if(p<q)offset=p*m.speed;else if(p<3*q)offset=m.range-(p-q)*m.speed;else offset=-m.range+(p-3*q)*m.speed;
  offset=Math.max(-m.range,Math.min(m.range,Math.round(offset)));
  return m.axis==='x'?{...platform,x:platform.x+offset}:{...platform,y:platform.y+offset};
}
