/**
 * Cosmetic stone paving for originally solid cells that a spectator camera
 * temporarily compresses to show living heroes. The grid remains untouched.
 * Under-wall pieces share the existing textured floor InstancedMesh draw.
 */
const EMPTY=Object.freeze([]);
const validMap=map=>Array.isArray(map)&&map.length>=3&&map.length<=65&&map.length%2===1&&
 map.every(row=>(typeof row==='string'||Array.isArray(row))&&row.length===map.length&&
  Array.from(row).every(cell=>cell==='.'||cell==='#'));
export function planCutawayFloorBacking(map,floor){
 if(!validMap(map)||!Number.isSafeInteger(floor)||floor<1||floor>10000)return EMPTY;
 const result=[],offset=(map.length-1)/2;
 for(let z=1;z<map.length-1;z++)for(let x=1;x<map.length-1;x++){
  if(map[z][x]!=='#')continue;
  const yaw=((Math.imul(x+11,17)+Math.imul(z+13,29)+floor)&3)*Math.PI/2;
  result.push(Object.freeze({x:x-offset,z:z-offset,yaw}));
 }
 return Object.freeze(result);
}
export function planCutawayWallTransform(reveal,originalHeight){
 if(reveal==='sightline')return {height:.16,footprint:.36};
 if(reveal==='nearby')return {height:.88,footprint:1.015};
 const height=Number.isFinite(originalHeight)&&originalHeight>=.5&&originalHeight<=4?originalHeight:2.6;
 return {height,footprint:1.015};
}
