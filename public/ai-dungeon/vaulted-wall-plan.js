/**
 * Spatially directed, seeded-map-only architecture along a real dungeon route.
 * No authority RNG, combat input, collision or simulation mutation occurs here.
 * Instead of decorating random distant blocks, the original Gothic bays form
 * readable acts around the path the autonomous party can actually traverse.
 */
const MAX_BAYS=72;
const DIRS=Object.freeze([
 {dx:0,dz:1,yaw:0},{dx:1,dz:0,yaw:Math.PI/2},
 {dx:0,dz:-1,yaw:Math.PI},{dx:-1,dz:0,yaw:-Math.PI/2}
]);
function hash(x,z,floor){
 let n=(Math.imul(x+41,374761393)^Math.imul(z+19,668265263)^Math.imul(floor+3,2246822519))>>>0;
 n=Math.imul(n^(n>>>13),1274126177);
 return(n^(n>>>16))>>>0;
}
const gridPoint=(index,n)=>({x:index%n,z:Math.floor(index/n)});
function journey(map,exit){
 const n=map.length,start=map[1]?.[1]==='.'?n+1:map.flatMap((row,z)=>[...row].flatMap((value,x)=>value==='.'?[z*n+x]:[]))[0];
 if(!Number.isInteger(start))return [];
 const destination=Number.isInteger(exit?.x)&&Number.isInteger(exit?.z)&&exit.x>=0&&exit.x<n&&exit.z>=0&&exit.z<n&&map[exit.z][exit.x]==='.'?exit.z*n+exit.x:-1;
 const parents=new Int32Array(n*n).fill(-1),queue=[start];parents[start]=start;
 let target=start;
 for(let cursor=0;cursor<queue.length;cursor++){
  const index=queue[cursor],{x,z}=gridPoint(index,n);
  target=index;
  if(index===destination)break;
  for(const {dx,dz} of DIRS){
   const nx=x+dx,nz=z+dz,other=nz*n+nx;
   if(nx<0||nz<0||nx>=n||nz>=n||map[nz][nx]!=='.'||parents[other]>=0)continue;
   parents[other]=index;queue.push(other);
  }
 }
 if(destination>=0&&parents[destination]>=0)target=destination;
 // The dungeon may contain disconnected incidental rooms; never invent a path.
 const reversed=[];
 for(let at=target;at!==start&&reversed.length<n*n;at=parents[at]){
  if(at<0)return [];
  reversed.push(at);
 }
 reversed.push(start);
 return reversed.reverse();
}
function routeProximity(map,route){
 const n=map.length,depth=new Int16Array(n*n).fill(32767),index=new Int16Array(n*n).fill(-1),queue=[];
 for(let i=0;i<route.length;i++){
  const at=route[i];if(depth[at]===0)continue;
  depth[at]=0;index[at]=i;queue.push(at);
 }
 for(let head=0;head<queue.length;head++){
  const at=queue[head],{x,z}=gridPoint(at,n);
  for(const {dx,dz} of DIRS){
   const nx=x+dx,nz=z+dz,other=nz*n+nx;
   if(nx<0||nz<0||nx>=n||nz>=n||map[nz][nx]!=='.'||depth[other]<=depth[at]+1)continue;
   depth[other]=depth[at]+1;index[other]=index[at];queue.push(other);
  }
 }
 return {depth,index};
}
export function planVaultedWallBays(map,floor,exit,{maxBays=MAX_BAYS}={}){
 const n=map?.length;
 if(!Number.isInteger(n)||n<9||n>64||!Array.isArray(map)||
    !map.every(row=>typeof row==='string'&&row.length===n)||
    !Number.isSafeInteger(floor)||floor<1)return Object.freeze([]);
 const cap=Math.min(MAX_BAYS,Math.max(0,Number.isFinite(maxBays)?Math.floor(maxBays):0));
 if(!cap)return Object.freeze([]);
 const path=journey(map,exit),near=routeProximity(map,path),half=(n-1)/2;
 const chapters=Array.from({length:4},()=>[]);
 for(let z=2;z<n-2;z++)for(let x=2;x<n-2;x++){
  if(map[z][x]!=='#'||Number.isInteger(exit?.x)&&Number.isInteger(exit?.z)&&
    Math.abs(exit.x-x)+Math.abs(exit.z-z)<=4)continue;
  const key=hash(x,z,floor);
  const fronts=DIRS.map((d,i)=>({...d,adjacent:(z+d.dz)*n+x+d.dx,i}))
   .filter(d=>map[z+d.dz][x+d.dx]==='.')
   .sort((a,b)=>near.depth[a.adjacent]-near.depth[b.adjacent]||
    ((key>>>((a.i+1)*3))&7)-((key>>>((b.i+1)*3))&7)||a.i-b.i);
  if(!fronts.length)continue;
  const front=fronts[0],routePosition=near.index[front.adjacent];
  const chapter=routePosition<0?((key>>>11)&3):
   Math.min(3,Math.floor(routePosition*4/Math.max(1,path.length)));
  // Main nave, ruined chapel, fortified aisle and reliquary court each have
  // unmistakable original geometry, not merely different recoloured cuboids.
  const style=(chapter+((key>>>9)&1))%4;
  chapters[chapter].push({gridX:x,gridZ:z,x:x-half,z:z-half,
   yaw:front.yaw,faceX:front.dx,faceZ:front.dz,style,chapter,
   routeDistance:near.depth[front.adjacent],key});
 }
 for(const group of chapters)group.sort((a,b)=>a.routeDistance-b.routeDistance||a.key-b.key||a.gridZ-b.gridZ||a.gridX-b.gridX);
 const result=[],taken=Array(4).fill(0);
 // Round-robin each architectural act to keep a recognisable progression.
 // Spatial separation also avoids excessively dense silhouettes at combat.
 while(result.length<cap&&chapters.some((group,i)=>taken[i]<group.length)){
  for(let chapter=0;chapter<4&&result.length<cap;chapter++){
   const group=chapters[chapter];
   while(taken[chapter]<group.length){
    const candidate=group[taken[chapter]++];
    if(result.some(p=>Math.abs(p.gridX-candidate.gridX)+Math.abs(p.gridZ-candidate.gridZ)<2))continue;
    const {key,...site}=candidate;result.push(Object.freeze(site));break;
   }
  }
 }
 return Object.freeze(result);
}
