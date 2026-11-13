/**
 * One structural grammar for the actual entry -> ordinary encounter -> Warden
 * expedition. Visual planning ONLY: consumes a read-only public map/snapshot;
 * cannot open doors, replace obstacles, move a unit or promise fake passages.
 */
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const roles=Object.freeze(['entry','ordinary','warden']);
const valid=(map,exit,floor)=>Array.isArray(map)&&map.length>=9&&map.length<=64&&
 map.every(r=>typeof r==='string'&&r.length===map.length&&/^[.#]+$/.test(r))&&
 Number.isSafeInteger(floor)&&floor>=1&&Number.isInteger(exit?.x)&&
 Number.isInteger(exit?.z)&&map[exit.z]?.[exit.x]==='.'&&map[1]?.[1]==='.';
const key=(x,z,n)=>z*n+x;
const point=(i,n)=>({x:i%n,z:Math.floor(i/n)});
const hash=(x,z,f)=>{let v=(Math.imul(x+79,73856093)^Math.imul(z+113,19349663)^Math.imul(f+11,83492791))>>>0;v=Math.imul(v^(v>>>15),2246822519);return(v^(v>>>13))>>>0;};
const freezeList=list=>Object.freeze(list.map(item=>Object.freeze(item)));
const manhattan=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const chebyshev=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.z-b.z));
function path(map,from,to){
 const n=map.length,start=key(from.x,from.z,n),goal=key(to.x,to.z,n);
 if(map[from.z]?.[from.x]!=='.'||map[to.z]?.[to.x]!=='.')return [];
 const parents=new Int32Array(n*n).fill(-1),queue=[start];parents[start]=start;
 for(let i=0;i<queue.length&&parents[goal]<0;i++){
  const p=point(queue[i],n);
  for(const [dx,dz] of DIRS){
   const x=p.x+dx,z=p.z+dz,index=key(x,z,n);
   if(x<0||z<0||x>=n||z>=n||map[z][x]!=='.'||parents[index]!==-1)continue;
   parents[index]=queue[i];queue.push(index);
  }
 }
 if(parents[goal]<0)return [];
 const result=[];for(let i=goal;result.length<=n*n;i=parents[i]){
  result.push(point(i,n));if(i===start)return result.reverse();
 }
 return [];
}
function openness(map,p){
 let count=0;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)
  if(map[p.z+dz]?.[p.x+dx]==='.')count++;
 return count;
}
function chooseEncounter(map,exit,units,base){
 const start={x:1,z:1},n=map.length;let best=null;
 const enemies=Array.isArray(units)?units.slice(0,40).filter(u=>
  u&&u.faction==='enemy'&&u.kind!=='warden'&&u.hp>0&&
  Number.isInteger(u.x)&&Number.isInteger(u.z)&&map[u.z]?.[u.x]==='.'&&
  manhattan(u,start)>=5&&manhattan(u,exit)>=5):[];
 for(const u of enemies){
  const inbound=path(map,start,u),outbound=path(map,u,exit);
  if(!inbound.length||!outbound.length)continue;
  const combined=inbound.length+outbound.length-1,offset=Math.abs(inbound.length-1-combined*.48);
  const score=(combined-base.length)*4+offset*1.7-openness(map,u)*.35;
  if(!best||score<best.score||(score===best.score&&u.id<best.id))
   best={point:{x:u.x,z:u.z},inbound,outbound,score,id:String(u.id),source:'real-living-foe'};
 }
 if(best)return best;
 // No encounter is invented when an actual foe is absent. A visually
 // suitable chamber is clearly labelled a topological fallback.
 const candidates=base.map((p,i)=>({p,i,score:Math.abs(i-(base.length-1)*.48)*2-openness(map,p)}))
  .filter(o=>o.i>=4&&o.i<=base.length-6&&chebyshev(o.p,exit)>4)
  .sort((a,b)=>a.score-b.score||a.i-b.i);
 const picked=candidates[0]||{p:base[Math.floor(base.length/2)],i:Math.floor(base.length/2)};
 return {point:picked.p,inbound:base.slice(0,picked.i+1),outbound:base.slice(picked.i),
  source:'topology-only-no-ordinary-foe',id:null};
}
function threshold(map,route,target,role,used,exit){
 const n=map.length,half=(n-1)/2,options=[];
 for(let i=1;i<route.length-1;i++){
  const p=route[i];if(used.some(v=>manhattan(v,p)<4))continue;
  if(role!=='warden'&&chebyshev(p,exit)<=4)continue;
  // The two uprights must stand INSIDE real impassable flank cells; only the
  // elevated arch spans the genuine legal lane.
  for(const axis of ['x','z']){
   const blocked=axis==='x'?
    map[p.z-1]?.[p.x]==='#'&&map[p.z+1]?.[p.x]==='#':
    map[p.z]?.[p.x-1]==='#'&&map[p.z]?.[p.x+1]==='#';
   const through=axis==='x'?
    map[p.z]?.[p.x-1]==='.'&&map[p.z]?.[p.x+1]==='.':
    map[p.z-1]?.[p.x]==='.'&&map[p.z+1]?.[p.x]==='.';
   if(!blocked||!through)continue;
   options.push({p,i,axis,score:Math.abs(i-target),grain:hash(p.x,p.z,role.length)});
  }
 }
 options.sort((a,b)=>a.score-b.score||a.grain-b.grain||a.i-b.i);
 if(!options.length)return null;
 const v=options[0];used.push(v.p);
 return {role,gridX:v.p.x,gridZ:v.p.z,x:v.p.x-half,z:v.p.z-half,
  yaw:v.axis==='x'?Math.PI/2:0,axis:v.axis,clearance:2.25,
  supportCells:v.axis==='x'?
   [[v.p.x,v.p.z-1],[v.p.x,v.p.z+1]]:
   [[v.p.x-1,v.p.z],[v.p.x+1,v.p.z]],
  routeIndex:v.i};
}
function wallFacades(map,site,role,exit,floor,taken,route){
 const n=map.length,half=(n-1)/2,cap=role==='entry'?3:role==='ordinary'?6:9;
 const radius=role==='entry'?4:role==='ordinary'?4:7;
 const options=[];
 for(let z=Math.max(1,site.z-radius);z<=Math.min(n-2,site.z+radius);z++)
  for(let x=Math.max(1,site.x-radius);x<=Math.min(n-2,site.x+radius);x++){
   if(map[z][x]!=='#'||role!=='warden'&&chebyshev({x,z},exit)<=4)continue;
   if(role==='warden'&&chebyshev({x,z},exit)<4)continue;
   for(const [dx,dz] of DIRS){
    if(map[z+dz]?.[x+dx]!=='.')continue;
    const adjacent={x:x+dx,z:z+dz};
    const distance=manhattan(adjacent,site);
    if(distance>radius+1||!route.some(p=>manhattan(p,adjacent)<=4))continue;
    const face=x+':'+z+':'+dx+':'+dz;
    if(taken.has(face))continue;
    const closeness=Math.abs(distance-(role==='warden'?5:role==='ordinary'?2:1));
    options.push({x,z,dx,dz,face,distance,score:closeness*14+hash(x,z,floor)%13});
   }
  }
 options.sort((a,b)=>a.score-b.score||a.z-b.z||a.x-b.x);
 const chosen=[];
 for(const face of options){
  if(chosen.length>=cap)break;
  if(chosen.some(v=>manhattan(v,face)<2))continue;
  // Existing wall is the solid backing: these are shallow, blind alcoves,
  // never a visual promise of another navigable route.
  taken.add(face.face);
  chosen.push({role,gridX:face.x,gridZ:face.z,faceX:face.dx,faceZ:face.dz,
   x:face.x-half,z:face.z-half,yaw:Math.atan2(face.dx,face.dz),
   recessDepth:.22,bearingDepth:.44,blind:true});
 }
 return chosen;
}
export function planConnectedDungeonJourney(map,floor,exit,units=[]){
 const empty=Object.freeze({status:'invalid-or-unreachable',route:Object.freeze([]),
  chapters:Object.freeze([]),thresholds:Object.freeze([]),facades:Object.freeze([]),
  occluderBounds:Object.freeze([]),materials:Object.freeze([]),metrics:Object.freeze({reachable:false,collisionEffects:0})});
 if(!valid(map,exit,floor))return empty;
 const start={x:1,z:1},base=path(map,start,exit);if(!base.length)return empty;
 const encounter=chooseEncounter(map,exit,units,base);
 const route=[...encounter.inbound,...encounter.outbound.slice(1)];
 const mid=encounter.inbound.length-1,half=(map.length-1)/2;
 const chapters=freezeList([
  {role:'entry',gridX:1,gridZ:1,x:1-half,z:1-half,source:'actual-party-spawn'},
  {role:'ordinary',gridX:encounter.point.x,gridZ:encounter.point.z,
   x:encounter.point.x-half,z:encounter.point.z-half,source:encounter.source,
   ...(encounter.id?{sourceEnemyId:encounter.id}:{})},
  {role:'warden',gridX:exit.x,gridZ:exit.z,x:exit.x-half,z:exit.z-half,
   source:'actual-warden-and-exit'}
 ]);
 const used=[],thresholds=[];
 for(const [role,target] of [['entry',Math.min(5,Math.floor(route.length*.15))],
  ['ordinary',Math.max(1,mid-3)],['warden',Math.max(1,route.length-8)]]){
  const t=threshold(map,route,target,role,used,exit);if(t)thresholds.push(t);
 }
 const occupiedFaces=new Set(),facades=[];
 for(const chapter of chapters)facades.push(...wallFacades(map,
  {x:chapter.gridX,z:chapter.gridZ},chapter.role,exit,floor,occupiedFaces,route));
 const bounds=[];
 for(const t of thresholds){
  // Camera volumes may NEVER fill the open arch: two separate real blocked
  // foundation piers plus one vault HIGH above the navigable threshold.
  for(const support of t.supportCells){
   const px=support[0]-half,pz=support[1]-half;
   bounds.push({role:t.role,kind:'solid-blocked-support',
    minX:px-.20,maxX:px+.20,minY:0,maxY:2.49,
    minZ:pz-.20,maxZ:pz+.20,supportCell:support});
  }
  bounds.push({role:t.role,kind:'overhead-vault-crown',
   minX:t.x-(t.axis==='x'?.40:1.18),maxX:t.x+(t.axis==='x'?.40:1.18),
   minY:2.27,maxY:3.85,
   minZ:t.z-(t.axis==='x'?1.18:.40),maxZ:t.z+(t.axis==='x'?1.18:.40)});
 }
 for(const f of facades)bounds.push({role:f.role,kind:'blocked-cell-blind-recess',
  minX:f.x-.54,maxX:f.x+.54,minY:0,maxY:4.05,
  minZ:f.z-.54,maxZ:f.z+.54,supportCell:[f.gridX,f.gridZ]});
 const colors=[
  ['#918475','#292725','#8c7158'],['#866e65','#281e21','#b18b72'],
  ['#788394','#202c3d','#9da9b7'],['#85778d','#28232f','#a58e9b']
 ][(floor-1)%4];
 const materials=freezeList([
  {role:'bearing-stone-and-foundation',color:colors[0],roughness:.91,metalness:.035},
  {role:'solid-blind-recess',color:colors[1],roughness:1,metalness:0},
  {role:'aged-iron-fittings',color:colors[2],roughness:.67,metalness:.36}
 ]);
 const routePoints=freezeList(route.map(p=>({gridX:p.x,gridZ:p.z,x:p.x-half,z:p.z-half})));
 const frozenThresholds=freezeList(thresholds.map(t=>({...t,supportCells:Object.freeze(t.supportCells.map(cell=>Object.freeze(cell)))})));
 return Object.freeze({status:'ready',route:routePoints,chapters,
  thresholds:frozenThresholds,facades:freezeList(facades),
  occluderBounds:freezeList(bounds),materials,
  metrics:Object.freeze({reachable:true,routeCells:route.length,
   uniqueRouteCells:new Set(route.map(p=>key(p.x,p.z,map.length))).size,
   actualOrdinaryEnemy:encounter.source==='real-living-foe',
   thresholdCount:thresholds.length,facadeCount:facades.length,
   walkableGroundObstacles:0,collisionEffects:0,
   source:'actual-authority-map-exit-and-live-enemy-placements'})});
}
