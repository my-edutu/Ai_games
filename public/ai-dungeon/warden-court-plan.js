/** Genuine, deterministic Warden Court architecture from the authority map.
 * The previous close-circle test returned ZERO carved wall shields for the
 * real seed visual-room-art-18, because the actual fight has a 7x7 open court.
 * Search the enclosing connected stone instead of pretending an inner wall
 * exists. Never place a facade, tile or attack on an invented map cell.
 */
export function planWardenCourt(map,exit,floor){
 const empty=Object.freeze({origin:0,tiles:[],facades:[]});
 if(!Array.isArray(map)||map.length<7||!exit||
  !Number.isInteger(exit.x)||!Number.isInteger(exit.z)||!Number.isInteger(floor)||
  floor<1||map[exit.z]?.[exit.x]!=='.')return empty;
 const n=map.length,origin=(n-1)/2,tiles=[],facades=[],candidates=[];
 const walk=(x,z)=>map[z]?.[x]==='.';
 for(let z=1;z<n-1;z++)for(let x=1;x<n-1;x++){
  const d=Math.abs(exit.x-x)+Math.abs(exit.z-z);
  if(walk(x,z)){
   // Procession remains a true walkable ring around the original boss spawn.
   if(d>=2&&d<=4&&((x*31+z*19+floor*17)%4)!==0&&tiles.length<32)
    tiles.push({x:x-origin,z:z-origin,yaw:((x+z+floor)%4)*Math.PI/2});
   continue;
  }
  // The original fight deliberately opens seven cells across. Gothic carved
  // shields belong to ACTUAL exterior walls, not to nonexistent inner walls.
  if(d<3||d>10)continue;
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   if(!walk(x+dx,z+dz))continue;
   const facing=dx===1?Math.PI/2:dx===-1?-Math.PI/2:dz===1?0:Math.PI;
   const key=(Math.imul(x+11,73856093)^Math.imul(z+7,19349663)^Math.imul(floor+dx*3+dz*7,83492791))>>>0;
   const quadrant=(x<exit.x?0:1)+(z<exit.z?0:2);
   candidates.push({x:x-origin+dx*.502,z:z-origin+dz*.502,
    yaw:facing,gridX:x,gridZ:z,wallDistance:d,quadrant,key});
  }
 }
 candidates.sort((a,b)=>a.wallDistance-b.wallDistance||a.key-b.key||a.gridZ-b.gridZ||a.gridX-b.gridX);
 const used=new Set(),counts=[0,0,0,0];
 for(const face of candidates){
  if(facades.length>=14)break;
  const id=face.gridX+','+face.gridZ+','+face.yaw;
  if(used.has(id)||counts[face.quadrant]>=5)continue;
  used.add(id);counts[face.quadrant]++;
  const {gridX,gridZ,wallDistance,quadrant,key,...view}=face;
  facades.push(view);
 }
 return Object.freeze({origin,tiles,facades});
}

/**
 * The Warden duel is the authored negative space, not an impassable prop
 * obstacle course. The real 7x7 walkable court keeps its original chapter
 * reliefs, procession and genuine hazards; only generic large freestanding
 * clutter is withheld inside it, and tall wall-side furnishings are kept
 * outside the immediately surrounding masonry. No collision or AI changes.
 */
export function planWardenCourtNegativeSpace(map,exit,x,z){
 const rest=Object.freeze({clearInterior:false,quietPerimeter:false});
 if(!Array.isArray(map)||map.length<7||map.length>64||
  !Number.isInteger(exit?.x)||!Number.isInteger(exit?.z)||
  map[exit.z]?.[exit.x]!=='.'||!Number.isInteger(x)||!Number.isInteger(z)||
  z<0||z>=map.length||x<0||x>=map.length||
  typeof map[z]!=='string'||map[z].length!==map.length)return rest;
 const chebyshev=Math.max(Math.abs(x-exit.x),Math.abs(z-exit.z));
 return Object.freeze({clearInterior:chebyshev<=3&&map[z][x]==='.',
  quietPerimeter:chebyshev<=4});
}
