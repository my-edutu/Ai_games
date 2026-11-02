// Reproducible presentation-only erosion of the dungeon's upper masonry.
// Solid cells and pathfinding remain entirely owned by the authoritative map.
const OPEN_SIDES=[[-1,0],[0,-1],[1,0],[0,1]];
const CROWNS=[2.50,2.60,2.70,2.82,2.94];
function hash(x,z,floor){
 let n=(Math.imul(x+43,73856093)^Math.imul(z+91,19349663)^Math.imul(floor+17,83492791))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return(n^(n>>>16))>>>0;
}
export function planDungeonWallProfiles(map,floor){
 if(!Array.isArray(map)||map.length<7||map.length>64||!map.every(row=>typeof row==='string'&&row.length===map.length))return [];
 const size=map.length,offset=(size-1)/2;
 const level=Number.isFinite(floor)?Math.max(1,Math.min(10000,Math.floor(floor))):1;
 const profiles=[];
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  if(map[z][x]==='.')continue;
  const exposedFaces=OPEN_SIDES.reduce((n,[dx,dz])=>n+(map[z+dz]?.[x+dx]==='.'?1:0),0);
  const seed=hash(x,z,level);
  // A short repeating range gives irregular broken parapets without spikes,
  // new walkable gaps, mesh allocations, or camera-obscuring tall towers.
  const height=exposedFaces?CROWNS[seed%5]+(exposedFaces>=2?.07:0):2.6;
  profiles.push({x,z,worldX:x-offset,worldZ:z-offset,height,exposedFaces});
 }
 return profiles;
}
