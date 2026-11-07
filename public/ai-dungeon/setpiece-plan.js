// Presentation-only spatial planning. No Three.js dependency and no access to authority RNG.
// A saved simulation is never influenced by visual ornament placement.
const DIRECTIONS=[[-1,0],[0,-1],[1,0],[0,1]];
const FAMILIES=['ossuary','forge','orrery','scriptorium'];
function stableHash(x,z,floor){
 let n=(Math.imul(x+151,73856093)^Math.imul(z+397,19349663)^Math.imul(floor+11,83492791))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);
 return(n^(n>>>16))>>>0;
}
export function planDungeonSetpieces(map,floor,exit,maximum=8){
 if(!Array.isArray(map)||map.length<7||!map.every(row=>typeof row==='string'&&row.length===map.length))return [];
 const limit=Number.isFinite(maximum)?Math.min(8,Math.max(0,Math.floor(maximum))):8;
 if(!limit)return [];
 const size=map.length,offset=(size-1)/2,theme=FAMILIES[((Math.floor(floor)||1)-1+4000)%4];
 const candidates=[];
 for(let z=2;z<size-2;z++)for(let x=2;x<size-2;x++){
  if(map[z][x]!=='.')continue;
  if(Math.abs(x-1)+Math.abs(z-1)<=4)continue;
  if(exit&&Math.abs(x-exit.x)+Math.abs(z-exit.z)<=3)continue;
  const nearby=DIRECTIONS.filter(([dx,dz])=>map[z+dz]?.[x+dx]==='.').length;
  if(nearby<2)continue;
  const walls=DIRECTIONS.filter(([dx,dz])=>map[z+dz]?.[x+dx]==='#');
  if(!walls.length)continue;
  const hash=stableHash(x,z,floor),[dx,dz]=walls[hash%walls.length];
  candidates.push({x,z,dx,dz,worldX:x-offset+dx*.36,worldZ:z-offset+dz*.36,
   yaw:Math.atan2(dx,dz),motif:theme,variant:hash%3,score:hash});
 }
 candidates.sort((a,b)=>a.score-b.score||a.z-b.z||a.x-b.x);
 const chosen=[];
 for(const point of candidates){
  if(chosen.every(other=>Math.hypot(other.x-point.x,other.z-point.z)>=2.4))chosen.push(point);
  if(chosen.length===limit)break;
 }
 return chosen;
}
