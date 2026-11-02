/**
 * Deterministic architectural composition from the actual impassable tiles.
 * These vaulted recesses remain visual-only: walls stay blocked by authority.
 * Selection is spatially distributed, never consumes gameplay RNG, and avoids
 * the exit court so a genuine boss warning remains readable.
 */
const MAX_BAYS=32;
const DIRS=Object.freeze([
 {dx:0,dz:1,yaw:0},{dx:1,dz:0,yaw:Math.PI/2},
 {dx:0,dz:-1,yaw:Math.PI},{dx:-1,dz:0,yaw:-Math.PI/2}
]);
function hash(x,z,floor){
 let n=(Math.imul(x+41,374761393)^Math.imul(z+19,668265263)^Math.imul(floor+3,2246822519))>>>0;
 n=Math.imul(n^(n>>>13),1274126177);
 return(n^(n>>>16))>>>0;
}
export function planVaultedWallBays(map,floor,exit,{maxBays=MAX_BAYS}={}){
 const n=map?.length;
 if(!Number.isInteger(n)||n<9||n>64||!Array.isArray(map)||
    !map.every(row=>typeof row==='string'&&row.length===n)||
    !Number.isSafeInteger(floor)||floor<1)return Object.freeze([]);
 const cap=Math.min(MAX_BAYS,Math.max(0,Number.isFinite(maxBays)?Math.floor(maxBays):0));
 if(!cap)return Object.freeze([]);
 const half=(n-1)/2,candidates=[];
 for(let z=2;z<n-2;z++)for(let x=2;x<n-2;x++){
  if(map[z][x]!=='#'||Number.isInteger(exit?.x)&&Number.isInteger(exit?.z)&&
    Math.abs(exit.x-x)+Math.abs(exit.z-z)<=4)continue;
  const fronts=DIRS.filter(d=>map[z+d.dz][x+d.dx]==='.');
  if(!fronts.length)continue;
  const key=hash(x,z,floor),front=fronts[key%fronts.length];
  candidates.push({gridX:x,gridZ:z,x:x-half,z:z-half,yaw:front.yaw,
    faceX:front.dx,faceZ:front.dz,style:key%4,key});
 }
 candidates.sort((a,b)=>a.key-b.key||a.gridZ-b.gridZ||a.gridX-b.gridX);
 const result=[];
 for(const candidate of candidates){
  if(result.length>=cap)break;
  if(result.some(p=>Math.abs(p.gridX-candidate.gridX)+Math.abs(p.gridZ-candidate.gridZ)<3))continue;
  const {key,...site}=candidate;
  result.push(Object.freeze(site));
 }
 return Object.freeze(result);
}