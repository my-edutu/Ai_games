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

/**
 * Original low stonework and exceptional high buttresses direct the spectator
 * eye toward real traversal, combat and boss framing. This changes only
 * rendered GPU heights: the complete authoritative grid stays solid.
 */
export function planLegibleWallMass(map,floor,vaultedSites=[]){
 const profiles=planDungeonWallProfiles(map,floor);
 if(!profiles.length)return [];
 const n=map.length,vaults=new Set(Array.isArray(vaultedSites)?
  vaultedSites.filter(p=>Number.isInteger(p?.gridX)&&Number.isInteger(p?.gridZ))
   .map(p=>p.gridZ*n+p.gridX):[]);
 return profiles.map(p=>{
  if(vaults.has(p.z*n+p.x))return 1.16;
  const value=hash(p.x,p.z,floor);
  // Stage real traversed rooms as a low-ruin foreground against distant
  // continuous masonry. Visual heights never change solid grid occupancy.
  if(!p.exposedFaces)return 1.76+(value%3)*.08;
  // Intact single-front piers hold genuinely high stained-glass windows,
  // mounted torches and fractured coping. They establish vertical Gothic rhythm
  // without re-closing the broad fighting and travel vistas between them.
  if(p.exposedFaces===1&&value%5===0)return 1.82+(value%3)*.08;
  // Broad multi-sided junctions are reimagined as a *legible shattered
  // arcade*: sculpted floor-level stonework, not a waist-high stockade
  // covering the living source-skinned shoulders and attack silhouettes.
  // Sparse intact one-face piers and hidden backing walls keep the ruin Gothic.
  // The solid maze grid, navigation, attack blocking and replay do not change.
  return p.exposedFaces>=2?[.78,.86,.94,1.02][value%4]:
   [1.05,1.10,1.16,1.22][value%4];
 });
}

/** Original licensed GLBs stay on single-exposed-face solid wall piers rather
 * than free-standing in the camera-to-combat lane. Presentation only. */
export function planWallSeatedAuthoredMasonry(map,units=[],limit=5){
 const n=Array.isArray(map)?map.length:0;
 if(n<9||n>81||map.some(row=>typeof row!=='string'||row.length!==n)||
  !Array.isArray(units)||units.length>256||!Number.isSafeInteger(limit)||limit<0||limit>5)return [];
 const offset=(n-1)/2,dirs=[[0,-1],[1,0],[0,1],[-1,0]],candidates=[];
 for(let z=2;z<n-2;z++)for(let x=2;x<n-2;x++){
  if(map[z][x]!=='#')continue;
  const exposed=dirs.filter(([dx,dz])=>map[z+dz]?.[x+dx]==='.');
  if(exposed.length!==1)continue;
  const [dx,dz]=exposed[0];
  if(units.some(u=>u&&u.hp>0&&Number.isFinite(u.x)&&Number.isFinite(u.z)&&
   Math.hypot(u.x-(x+dx),u.z-(z+dz))<2.7))continue;
  candidates.push({wallX:x,wallZ:z,approachX:x+dx,approachZ:z+dz,
   x:x-offset,z:z-offset,normalX:dx,normalZ:dz,score:(x*71+z*31+n*17)&255});
 }
 candidates.sort((a,b)=>a.score-b.score||a.wallZ-b.wallZ||a.wallX-b.wallX);
 const sites=[];
 for(const site of candidates){
  if(sites.length>=limit)break;
  if(sites.some(s=>Math.hypot(site.x-s.x,site.z-s.z)<3))continue;
  const {score,...placement}=site;
  sites.push(Object.freeze({...placement,asset:sites.length%3===0?
   'environment/dungeon_pillar.glb':'environment/dungeon_wall.glb',kind:'architecture'}));
 }
 return sites;
}
/** Uniform source-mesh scale, bounded to a real .72m wall footprint and
 * 1.38m height. Broken/empty original assets are not rendered. */
export function planWallSeatedAssetScale(extent){
 if(!extent||![extent.x,extent.y,extent.z].every(v=>Number.isFinite(v)&&v>0))return 0;
 return Math.min(3,.72/extent.x,1.38/extent.y,.72/extent.z);
}
