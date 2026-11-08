/**
 * A truthful secondary cloister loop from the existing authoritative dungeon.
 *
 * This planner does NOT create movement or alter map/units/hazards. It finds
 * two points on the existing main expedition, leaves through genuinely open
 * tiles never used by that route, and reconnects to the same legal itinerary.
 * When no loop exists it explicitly returns NONE and no alternate art.
 */
const DIRS=Object.freeze([[1,0],[0,1],[-1,0],[0,-1]]);
const K=(x,z,n)=>z*n+x;
const cheb=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.z-b.z));
const man=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const hash=(x,z,f)=>{let n=(Math.imul(x+37,73856093)^Math.imul(z+53,19349663)^Math.imul(f+23,83492791))>>>0;return Math.imul(n^(n>>>15),2246822519)>>>0;};
const fixed=xs=>Object.freeze(xs.map(x=>Object.freeze(x)));
const NONE=Object.freeze({
 status:'no-authoritative-side-loop',detour:Object.freeze([]),rejoinedRoute:Object.freeze([]),
 facades:Object.freeze([]),inlays:Object.freeze([]),occluderBounds:Object.freeze([]),
 materials:Object.freeze([]),metrics:Object.freeze({
  connected:false,branchOnlyCells:0,activeHazardCells:0,hazardFree:false,
  navigationEdits:0,combatEdits:0,fakeDoorways:0,source:'none'})});
const valid=(map,floor,exit,main)=>{
 const n=map?.length;
 if(!Array.isArray(map)||!Number.isInteger(n)||n<9||n>64||
  !map.every(r=>typeof r==='string'&&r.length===n&&/^[.#]+$/.test(r))||
  !Number.isSafeInteger(floor)||floor<1||!Number.isInteger(exit?.x)||
  !Number.isInteger(exit?.z)||map[exit.z]?.[exit.x]!=='.'||
  main?.status!=='ready'||!Array.isArray(main.route)||main.route.length<9||
  main.route.length>n*n*2)return false;
 const route=main.route;
 if(route[0]?.gridX!==1||route[0]?.gridZ!==1||
  route.at(-1)?.gridX!==exit.x||route.at(-1)?.gridZ!==exit.z)return false;
 return route.every((p,i)=>Number.isInteger(p?.gridX)&&Number.isInteger(p?.gridZ)&&
  map[p.gridZ]?.[p.gridX]==='.'&&(!i||
  Math.abs(route[i-1].gridX-p.gridX)+Math.abs(route[i-1].gridZ-p.gridZ)===1));
};
function findDetour(map,from,to,blocked,exit){
 const n=map.length,start=K(from.x,from.z,n),goal=K(to.x,to.z,n);
 const parents=new Int32Array(n*n).fill(-1),depth=new Int16Array(n*n);
 const queue=[start];parents[start]=start;
 for(let head=0;head<queue.length&&parents[goal]<0;head++){
  const at=queue[head],x=at%n,z=Math.floor(at/n);
  if(depth[at]>=28)continue;
  for(const [dx,dz] of DIRS){
   const nx=x+dx,nz=z+dz,other=K(nx,nz,n);
   if(nx<1||nz<1||nx>=n-1||nz>=n-1||map[nz][nx]!=='.'||
    blocked.has(other)||parents[other]>=0||
    (other!==goal&&cheb({x:nx,z:nz},exit)<=4))continue;
   parents[other]=at;depth[other]=depth[at]+1;queue.push(other);
  }
 }
 if(parents[goal]<0)return [];
 const out=[];
 for(let i=goal;out.length<=29;i=parents[i]){
  out.push({x:i%n,z:Math.floor(i/n)});
  if(i===start)return out.reverse();
 }
 return [];
}
export function planAlternateDungeonGallery(map,floor,exit,main,units=[],traps=[]){
 if(!valid(map,floor,exit,main))return NONE;
 const n=map.length,half=(n-1)/2;
 const route=main.route.map(p=>({x:p.gridX,z:p.gridZ}));
 const primary=new Set(route.map(p=>K(p.x,p.z,n)));
 const ordinary=main.chapters?.find(c=>c.role==='ordinary');
 const middle=ordinary?route.findIndex(p=>p.x===ordinary.gridX&&p.z===ordinary.gridZ):
  Math.floor(route.length*.48);
 const preference=(middle>=0?middle:Math.floor(route.length*.48))+4;
 const hazards=Array.isArray(traps)?traps.slice(0,64).filter(t=>t&&t.active===true&&
  t.disarmed!==true&&Number.isInteger(t.x)&&Number.isInteger(t.z)):[],
  hazardKeys=new Set(hazards.map(t=>K(t.x,t.z,n)));
 let best=null;
 // Fixed bounded candidate corpus; evaluated ONCE when building a real floor.
 const stride=Math.max(1,Math.ceil(route.length/60));
 for(let i=2;i<route.length-5;i+=stride){
  if(cheb(route[i],exit)<=4)continue;
  for(let j=i+3;j<=Math.min(i+12,route.length-3);j++){
   if(cheb(route[j],exit)<=4||route[i].x===route[j].x&&route[i].z===route[j].z||
    // Architectural branch and rejoin must not appear to bypass a genuine
    // ordinary encounter; both anchors remain on the same side of its cell.
    (middle>=0&&i<middle&&j>middle))continue;
   const blocked=new Set(primary);
   blocked.delete(K(route[i].x,route[i].z,n));
   blocked.delete(K(route[j].x,route[j].z,n));
   const path=findDetour(map,route[i],route[j],blocked,exit);
   if(path.length<5||path.length>24||path.length>(j-i+1)*2+8)continue;
   const fresh=path.slice(1,-1);
   if(fresh.length<3||fresh.some(p=>primary.has(K(p.x,p.z,n))))continue;
   const activeHazards=path.filter(p=>hazardKeys.has(K(p.x,p.z,n))).length;
   const changed=path.length-(j-i+1);
   const postEncounter=i>=middle?0:10;
   const score=Math.abs((i+j)/2-preference)*1.4+postEncounter+
    Math.abs(changed)*.56+path.length*.24+activeHazards*9+
    (hash(route[i].x,route[j].z,floor)%17)*.003;
   if(!best||score<best.score)
    best={i,j,path,score,activeHazards,changed};
  }
 }
 if(!best)return NONE;
 const point=p=>({gridX:p.x,gridZ:p.z,x:p.x-half,z:p.z-half});
 const detour=fixed(best.path.map(point));
 const rejoinedRoute=fixed([
  ...route.slice(0,best.i).map(point),...best.path.map(point),
  ...route.slice(best.j+1).map(point)
 ]);
 const enemies=Array.isArray(units)?units.slice(0,40).filter(u=>
  u?.faction==='enemy'&&u.hp>0&&Number.isInteger(u.x)&&Number.isInteger(u.z)):[];
 const allActors=Array.isArray(units)?units.slice(0,40).filter(u=>
  u?.hp>0&&Number.isInteger(u.x)&&Number.isInteger(u.z)):[];
 const reserved=new Set((main.facades||[]).map(f=>
  f.gridX+','+f.gridZ+','+f.faceX+','+f.faceZ));
 const possible=[];
 // Mount physical dressing on EXISTING stone adjoining the lateral passage.
 // The traversable cells contain no upright, furniture, or fictitious stair.
 for(let k=0;k<best.path.length;k++){
  // Include the genuine branch/rejoin portals: an open service hall may not
  // touch a wall midway, but its real thresholds still meet solid masonry.
  const p=best.path[k];if(cheb(p,exit)<=5)continue;
  for(const [dx,dz] of DIRS){
   const x=p.x+dx,z=p.z+dz;
   if(map[z]?.[x]!=='#'||man({x,z},p)!==1)continue;
   const face=[x,z,-dx,-dz].join(',');
   if(reserved.has(face)||enemies.some(u=>man(u,p)<=2))continue;
   possible.push({gridX:x,gridZ:z,faceX:-dx,faceZ:-dz,
    x:x-half,z:z-half,yaw:Math.atan2(-dx,-dz),
    routePosition:k,rank:hash(x,z,floor)%31,blind:true,depth:.16});
  }
 }
 possible.sort((a,b)=>a.routePosition-b.routePosition||a.rank-b.rank||
  a.gridZ-b.gridZ||a.gridX-b.gridX);
 const facades=[],occupied=new Set();
 for(const f of possible){
  if(facades.length>=12)break;
  const key=K(f.gridX,f.gridZ,n);
  if(occupied.has(key)||facades.some(other=>man(
   {x:f.gridX,z:f.gridZ},{x:other.gridX,z:other.gridZ})<2))continue;
  occupied.add(key);
  facades.push(f);
 }
 const safeInlays=best.path.slice(1,-1).filter((p,i)=>
  i%2===0&&cheb(p,exit)>4&&
  !hazardKeys.has(K(p.x,p.z,n))&&
  !allActors.some(u=>man(u,p)<=1));
 const inlays=safeInlays.slice(0,18).map((p,i)=>({
  ...point(p),yaw:(hash(p.x,p.z,floor)%4)*Math.PI/2,
  width:.72+((hash(p.x,p.z,floor)>>>9)%4)*.045,
  depth:.78+((hash(p.x,p.z,floor)>>>13)%3)*.046,
  drawHeight:.021,collisionHeight:0,role:'true-lateral-route-paving',index:i
 }));
 const bounds=facades.map(f=>({kind:'real-wall-buttress',role:'alternate-cloister',
  minX:f.x-.56,maxX:f.x+.56,minY:0,maxY:3.34,
  minZ:f.z-.56,maxZ:f.z+.56,supportCell:[f.gridX,f.gridZ]}));
 const palette=[
  ['#877967','#242421','#a18b73'],['#8b736e','#281d21','#af9a81'],
  ['#708092','#1c2634','#a0b0bd'],['#80758e','#252032','#ad9fb8']
 ][(floor-1)%4];
 const materials=fixed([
  {role:'bearing-service-stone',color:palette[0],metalness:.035,roughness:.92},
  {role:'blind-iron-seal',color:palette[1],metalness:.29,roughness:.74},
  {role:'worn-service-paving',color:palette[2],metalness:.015,roughness:.96}
 ]);
 return Object.freeze({status:'ready',branch:{gridX:route[best.i].x,gridZ:route[best.i].z},
  rejoin:{gridX:route[best.j].x,gridZ:route[best.j].z},
  detour,rejoinedRoute,facades:fixed(facades),inlays:fixed(inlays),
  occluderBounds:fixed(bounds),materials,
  metrics:Object.freeze({
   connected:true,branchIndex:best.i,rejoinIndex:best.j,
   branchOnlyCells:best.path.length-2,detourCells:best.path.length,
   alternateJourneyCells:rejoinedRoute.length,
   activeHazardCells:best.activeHazards,hazardFree:best.activeHazards===0,
   facadeCount:facades.length,pavingInlays:inlays.length,
   navigationEdits:0,combatEdits:0,fakeDoorways:0,
   source:'existing-authority-loop-only; no autonomous-pathfinding changes'
  })});
}
