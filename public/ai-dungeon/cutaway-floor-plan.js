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
 if(reveal==='nearby')return {height:.42,footprint:1.015};
 const height=Number.isFinite(originalHeight)&&originalHeight>=.5&&originalHeight<=4?originalHeight:2.6;
 return {height,footprint:1.015};
}


/**
 * A wall's decorative capstone is not a separate obstruction. When its parent
 * exposed face is lowered for party visibility, collapse this instanced trim
 * to a subpixel foundation marker as well. The original transform is returned
 * untouched when the camera moves away, with no authority/grid changes.
 */
export function planCutawayCapTransform(reveal,cap){
 if(!['none','nearby','sightline'].includes(reveal)||
    !Array.isArray(cap)||cap.length!==6||!cap.every(Number.isFinite))return null;
 const [x,y,z,sx,sy,sz]=cap;
 if(Math.abs(x)>64||Math.abs(z)>64||y<0||y>10||
    sx<=0||sy<=0||sz<=0||sx>4||sy>4||sz>4)return null;
 return reveal==='none'?[x,y,z,sx,sy,sz]:[x,.015,z,.001,.001,.001];
}


/** The floor's textured backing remains visible after a wall is sightline cut. */
export function planCutawayFoundationTransform(reveal){
 if(!['none','nearby','sightline'].includes(reveal))return null;
 return reveal==='none'
  ?{y:.1,height:.21,footprint:1.035}
  :{y:.035,height:.055,footprint:.24};
}

/** An overhead parapet must never turn into a full-width floor slab. */
export function planCutawayParapetTransform(hidden,originalHeight){
 if(typeof hidden!=='boolean'||!Number.isFinite(originalHeight)||
    originalHeight<0||originalHeight>10)return null;
 return hidden
  ?{y:.045,height:.035,footprint:.30}
  :{y:originalHeight,height:.12,footprint:1.04};
}
