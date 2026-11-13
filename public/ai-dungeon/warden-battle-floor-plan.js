/**
 * Original physical Warden fighting floor from the real public map.
 * Join adjacent walkable flagstones into a quiet, hand-laid court instead of
 * 49 noisy individual squares competing with the ACTUAL warning cells.
 * No collision, attack, AI, health, rig, RNG or save authority.
 */
const EMPTY=Object.freeze({status:'UNAVAILABLE',stones:Object.freeze([]),coveredWalkableCells:0,collisionChanges:0});
const valid=n=>Number.isSafeInteger(n);
export function planWardenBattleFloor(map,exit,floor){
 const n=map?.length;
 if(!Array.isArray(map)||!valid(n)||n<9||n>41||n%2===0||
  !map.every(row=>typeof row==='string'&&row.length===n&&/^[.#]+$/.test(row))||
  !valid(exit?.x)||!valid(exit?.z)||map[exit.z]?.[exit.x]!=='.'||
  !valid(floor)||floor<1||floor>100000)return EMPTY;
 const half=(n-1)/2,stones=[];
 const x0=Math.max(1,exit.x-3),x1=Math.min(n-2,exit.x+3);
 const z0=Math.max(1,exit.z-3),z1=Math.min(n-2,exit.z+3);
 const open=(x,z)=>map[z]?.[x]==='.';
 let coveredWalkableCells=0;
 const addPlate=cells=>{
  if(!cells.length)return;
  const minX=Math.min(...cells.map(c=>c.x)),maxX=Math.max(...cells.map(c=>c.x));
  const minZ=Math.min(...cells.map(c=>c.z)),maxZ=Math.max(...cells.map(c=>c.z));
  const hash=(Math.imul(minX+17,73856093)^Math.imul(minZ+13,19349663)^
   Math.imul(floor+7,83492791))>>>0;
  coveredWalkableCells+=cells.length;
  stones.push(Object.freeze({gridX:minX,gridZ:minZ,
   x:(minX+maxX)*.5-half,z:(minZ+maxZ)*.5-half,
   yaw:(hash%2)*Math.PI,
   width:minX===maxX?.94:1.97,depth:minZ===maxZ?.94:1.97,
   cells:Object.freeze(cells.map(c=>Object.freeze({x:c.x,z:c.z})))}));
 };
 // A 2x2 / 2x1 / 1x2 physical slab requires EVERY underlying authority
 // cell to be truly walkable. At irregular walls, subdivide rather than
 // bridge a wall, spawn collision, or cover a trapped/blocked tile.
 for(let z=z0;z<=z1;z+=2)for(let x=x0;x<=x1;x+=2){
  const xe=Math.min(x+1,x1),ze=Math.min(z+1,z1),cells=[];
  for(let zz=z;zz<=ze;zz++)for(let xx=x;xx<=xe;xx++)if(open(xx,zz))cells.push({x:xx,z:zz});
  if(cells.length===(xe-x+1)*(ze-z+1)){addPlate(cells);continue;}
  for(let zz=z;zz<=ze;zz++){
   const row=[];for(let xx=x;xx<=xe;xx++)if(open(xx,zz))row.push({x:xx,z:zz});
   addPlate(row);
  }
 }
 return Object.freeze({status:'READY',stones:Object.freeze(stones),
  coveredWalkableCells,collisionChanges:0,source:'actual-walkable-warden-court-connected-plates',
  maxStoneTopMeters:.035});
}

// Renderer-only coverage mask: the instanced mesh count is NOT the floor-cell
// count. A 2x2 slab still covers four real map cells. The previous decoration
// mask accidentally used only each slab's origin and left most of the actual
// boss warning court cluttered despite the new connected geometry.
export function planWardenCourtDetailMask(plan){
 const empty=()=>new Set();
 if(plan?.status!=='READY'||!Array.isArray(plan.stones)||
    plan.stones.length<1||plan.stones.length>49||
    !valid(plan.coveredWalkableCells)||plan.coveredWalkableCells>49)return empty();
 const covered=new Set();
 for(const plate of plan.stones){
  if(!Array.isArray(plate?.cells)||plate.cells.length<1||plate.cells.length>4)return empty();
  for(const c of plate.cells){
   if(!valid(c?.x)||!valid(c?.z)||c.x<0||c.z<0||c.x>40||c.z>40)return empty();
   const key=c.x+','+c.z;
   if(covered.has(key))return empty();
   covered.add(key);
  }
 }
 return covered.size===plan.coveredWalkableCells?covered:empty();
}
