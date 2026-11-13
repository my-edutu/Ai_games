/**
 * Real source-skinned Warden risk cells and physically sampled actor anatomy
 * own the portrait optical orbit. No new geometry, render pass, RNG, movement
 * or made-up damage events. Only true risk corners can justify a camera move.
 */
const finite=Number.isFinite,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ANGLES=Object.freeze([0,-.40,.40,-.76,.76]),rad=Math.PI/180;
export function orbitThreatCamera(base,angle,size,{reach=1,lift=0}={}){
 // Native portrait-angle search may lower the same actual camera by up to 2.2m;
 // the existing floor-height clamp and authoritative all-corner projection
 // remain mandatory, while the real director separately tests opaque masonry.
 // Retain physical camera and real imported skeletons. Never fake actor
 // dimensions, alter the optical lens, or hide legitimate dangerous cells.
 const limit=(size-1)/2-.65,dx=base.position.x-base.look.x,dz=base.position.z-base.look.z;
 const cs=Math.cos(angle),sn=Math.sin(angle),r=clamp(reach,.8,1.04);
 return Object.freeze({x:clamp(base.look.x+(dx*cs-dz*sn)*r,-limit,limit),
  y:clamp(base.position.y+clamp(lift,-2.2,.8),2.1,28),
  z:clamp(base.look.z+(dx*sn+dz*cs)*r,-limit,limit)});
}
function originalRisk(state,subjects){
 const s=state?.bossWarning,N=state?.map?.length;
 if(!s||s.attackTick<=state.tick||!Number.isSafeInteger(s.attackTick)||
  !Array.isArray(s.cells)||s.cells.length<8||s.cells.length>32||
  !Number.isSafeInteger(N)||N<9||N>41||N%2!==1||
  !state.map.every(row=>typeof row==='string'&&row.length===N)||
  !Array.isArray(state.units)||!Array.isArray(subjects)||subjects.length>5)return null;
 const live=state.units.filter(u=>u?.hp>0&&typeof u?.id==='string');
 const boss=live.find(u=>u.kind==='warden'),hero=live.find(u=>u.faction==='party'&&u.hp>0);
 if(!boss||!hero)return null;
 const body=subjects.filter(p=>p?.visibleActor===true&&typeof p.unitId==='string'&&
  live.some(u=>u.id===p.unitId)&&Array.isArray(p.bodyPoints)&&
  p.bodyPoints.length>=3&&p.bodyPoints.length<=8&&
  p.bodyPoints.every(q=>[q?.x,q?.y,q?.z].every(finite)));
 const bossBody=body.find(p=>p.unitId===boss.id);
 const heroBodies=body.filter(p=>live.some(u=>u.id===p.unitId&&u.faction==='party'));
 if(!bossBody||!heroBodies.length)return null;
 const closest=heroBodies.sort((a,b)=>Math.hypot(a.x-bossBody.x,a.z-bossBody.z)-
  Math.hypot(b.x-bossBody.x,b.z-bossBody.z))[0];
 if(Math.hypot(closest.x-bossBody.x,closest.z-bossBody.z)>7.1)return null;
 const half=(N-1)/2,corners=[];
 for(const cell of s.cells){
  if(!Number.isSafeInteger(cell?.x)||!Number.isSafeInteger(cell?.z)||
   cell.x<0||cell.z<0||cell.x>=N||cell.z>=N)return null;
  const x=cell.x-half,z=cell.z-half;
  for(const dx of [-.47,.47])for(const dz of [-.47,.47])corners.push({x:x+dx,y:.08,z:z+dz});
 }
 return {corners,bodies:[bossBody,closest],N,count:s.cells.length};
}
/** Real camera projection including the entire genuine threat-cell footprint. */
export function assessThreatOrbit({state,base,subjects,width,height,fov},camera){
 const risk=originalRisk(state,subjects),aspect=width/height,look=base?.look;
 if(!risk||!finite(aspect)||aspect<.35||aspect>=.86||
  ![look?.x,look?.z,camera?.x,camera?.y,camera?.z,fov].every(finite)||
  camera.y<2||camera.y>28||fov<28||fov>84)return {valid:false};
 const ly=finite(look.y)?look.y:1.2;
 const fx=look.x-camera.x,fy=ly-camera.y,fz=look.z-camera.z;
 const length=Math.hypot(fx,fy,fz),flat=Math.hypot(fx,fz);
 if(length<1||flat<.05)return {valid:false};
 const forward=[fx/length,fy/length,fz/length],right=[-fz/flat,0,fx/flat];
 const up=[-right[2]*forward[1],right[2]*forward[0]-right[0]*forward[2],right[0]*forward[1]];
 let tanNeeded=0,minDepth=Infinity;
 const project=p=>{
  const dx=p.x-camera.x,dy=p.y-camera.y,dz=p.z-camera.z;
  const depth=dx*forward[0]+dy*forward[1]+dz*forward[2];
  if(depth<.40||depth>60)return null;
  const x=(dx*right[0]+dz*right[2])/depth,y=(dx*up[0]+dy*up[1]+dz*up[2])/depth;
  minDepth=Math.min(minDepth,depth);
  tanNeeded=Math.max(tanNeeded,Math.abs(x)/(aspect*.91),Math.abs(y)/.90);
  return {x,y,depth};
 };
 for(const p of risk.corners)if(!project(p))return {valid:false};
 const heights=[];
 for(const body of risk.bodies){
  const sample=body.bodyPoints.map(project);
  if(sample.some(v=>!v))return {valid:false};
  heights.push(sample);
 }
 const fitFov=2*Math.atan(tanNeeded)/rad,actualFov=fov;
 const halfH=height/(2*Math.tan(actualFov*rad/2)),visibleHeights=heights.map(samples=>{
  const px=samples.map(p=>p.y*halfH);
  return Math.max(0,Math.max(...px)-Math.min(...px));
 });
 // These are the two ACTUAL imported skinned source-body projections, not
 // invented sprite extents. Prevent a tighter warning shot from hiding the
 // attacker behind the defender even when both bodies technically fit.
 const xSpans=heights.map(samples=>{
  const xs=samples.map(p=>p.x*halfH);
  return [Math.min(...xs),Math.max(...xs)];
 });
 const bodyGap=xSpans.length===2?
  Math.max(xSpans[0][0]-xSpans[1][1],xSpans[1][0]-xSpans[0][1]):0;
 return Object.freeze({valid:true,bodyGapPx:Number(bodyGap.toFixed(2)),
  fitFov:Number(fitFov.toFixed(3)),
  minHeroPixels:Number(Math.min(...visibleHeights).toFixed(2)),
  threatCells:risk.count,criticalActors:risk.bodies.length,minDepth:Number(minDepth.toFixed(3))});
}
export function planWardenThreatOrbit(input){
 const empty=Object.freeze({status:'UNAVAILABLE'});
 if(input?.reducedMotion===true||!input?.state||!input?.base||
  !Array.isArray(input.subjects)||!finite(input.width)||!finite(input.height)||
  !finite(input.fov)||!finite(input.base.position?.x)||
  !finite(input.base.position?.y)||!finite(input.base.position?.z))return empty;
 const baseline=assessThreatOrbit(input,input.base.position);
 if(!baseline.valid||baseline.minHeroPixels<5)return empty;
 const N=input.state.map.length;
 // If the original portrait view crops a genuine hazard, restore ALL the
 // imminent danger first, provided the native actor silhouette does not
 // materially shrink. Only an already-safe baseline can demand a >=8% and
 // >=3px body-size improvement. Authority safety outranks decoration.
 const dangerRescue=baseline.fitFov>input.fov-.5;
 // Bounded genuine optical approaches, rather than an abstract FOV gain:
 // each candidate projects all dangerous tile corners and original bone
 // silhouettes at the ACTUAL existing 390px lens.
 const approaches=[{reach:1,lift:0},{reach:.92,lift:.35},{reach:.84,lift:.70}];
 let best=null;
 for(const approach of approaches)for(const angle of ANGLES){
  if(angle===0&&approach.reach===1)continue;
  const position=orbitThreatCamera(input.base,angle,N,approach),v=assessThreatOrbit(input,position);
  if(!v.valid||v.fitFov>Math.min(82,input.fov-.5))continue;
  const gainPx=v.minHeroPixels-baseline.minHeroPixels;
  if(dangerRescue){
   // This is not a character-size win: keep >=90% of the original true
   // body pixel height while un-cropping every genuine attack cell.
   if(v.minHeroPixels<baseline.minHeroPixels*.90)continue;
  }else if(gainPx<Math.max(3,baseline.minHeroPixels*.08))continue;
  const value=(dangerRescue?(baseline.fitFov-v.fitFov)*12+gainPx:gainPx)
   -.8*Math.abs(angle)-1.2*(1-approach.reach)-.2*approach.lift;
  if(!best||value>best.value)best={angle,reach:approach.reach,lift:approach.lift,
    position,framing:v,value};
 }
 if(!best)return {status:'UNCHANGED',baseline,threatCells:baseline.threatCells,
  criticalActors:baseline.criticalActors};
 return Object.freeze({status:'IMPROVED',dangerRescue,angle:best.angle,reach:best.reach,
  lift:best.lift,position:best.position,framing:best.framing,baseline,
  threatCells:baseline.threatCells,criticalActors:baseline.criticalActors,
  gainPixels:Number((best.framing.minHeroPixels-baseline.minHeroPixels).toFixed(2)),
  gainDeg:Number((baseline.fitFov-best.framing.fitFov).toFixed(3))});
}

/**
 * Single-scene, true-geometry portrait composition for a live Warden warning.
 * The earlier orbit changed only azimuth and at most 16% radial distance
 * around an often off-centre cinematic aim. Genuine 23-cell floor warnings
 * then forced miniature 20-40px actors against a huge empty vault.
 *
 * Search one physically coherent camera *and* optical aim using the actual
 * authoritative hazard-cell footprint, nearest live source-rig bodies, the
 * immutable game map bounds and the existing real lens. This does not
 * enlarge or move any entity, manufacture a warning, add a render pass,
 * change the spectator's manual control or touch deterministic combat.
 * The physical-camera director separately rejects opaque stone obstruction.
 */
export function planWardenThreatComposition(input){
 const empty=Object.freeze({status:'UNAVAILABLE'});
 if(!input||input.reducedMotion===true||!input.base||
  !Number.isFinite(input.width)||!Number.isFinite(input.height)||
  !(input.width/input.height>=.35&&input.width/input.height<.86)||
  !Number.isFinite(input.fov)||input.fov<28||input.fov>84||
  ![input.base.look?.x,input.base.look?.z,
    input.base.position?.x,input.base.position?.y,input.base.position?.z].every(finite))
  return empty;
 const risk=originalRisk(input.state,input.subjects),
  baseline=assessThreatOrbit(input,input.base.position);
 if(!risk||!baseline.valid||baseline.minHeroPixels<5)return empty;
 const N=risk.N,limit=(N-1)/2-.65;
 const weightedMean=items=>({x:items.reduce((n,p)=>n+p.x,0)/items.length,
  z:items.reduce((n,p)=>n+p.z,0)/items.length});
 const hazardCenter=weightedMean(risk.corners),
  bodyCenter=weightedMean(risk.bodies);
 const firstLook=input.base.look,
  centers=[
   {x:firstLook.x,z:firstLook.z},
   {x:(firstLook.x+hazardCenter.x)*.5,z:(firstLook.z+hazardCenter.z)*.5},
   {x:(hazardCenter.x+bodyCenter.x)*.5,z:(hazardCenter.z+bodyCenter.z)*.5}
  ];
 const dangerRescue=baseline.fitFov>input.fov-.5;
 // Deliberately sample a shallower, physical 3D sightline for the original
 // skinned cast. Never choose it just for pitch: fit every real warning tile,
 // improve native projected body pixels and survive independent wall/prop rays.
 // At most 180 CPU-only proposals ONCE per new authority warning, no new draw.
 const angles=[0,-.44,.44,-.78,.78],reaches=[.68,.79,.91],
  lifts=[-2.2,-1.1,0,.48];
 let best=null,checked=0,fitCandidates=0;
 for(const desired of centers){
  // A new aim can be moved only toward REAL warning and source-body anchors;
  // limit translation, including when edge-clamped in a small legal map.
  let deltaX=desired.x-firstLook.x,deltaZ=desired.z-firstLook.z;
  const mag=Math.hypot(deltaX,deltaZ),radius=Math.min(2.25,mag);
  if(mag>1e-6){deltaX*=radius/mag;deltaZ*=radius/mag;}
  const look=Object.freeze({x:clamp(firstLook.x+deltaX,-limit,limit),
   y:finite(firstLook.y)?firstLook.y:1.2,
   z:clamp(firstLook.z+deltaZ,-limit,limit)});
  const shiftX=look.x-firstLook.x,shiftZ=look.z-firstLook.z;
  const shiftedBase={look,position:{
   x:input.base.position.x+shiftX,y:input.base.position.y,
   z:input.base.position.z+shiftZ}};
  const request={...input,base:shiftedBase};
  for(const reach of reaches)for(const lift of lifts)for(const angle of angles){
   checked++;
   const position=orbitThreatCamera(shiftedBase,angle,N,{reach,lift});
   const measure=assessThreatOrbit(request,position);
   if(!measure.valid||measure.fitFov>Math.min(82,input.fov-.5))continue;
   fitCandidates++;
   const gain=measure.minHeroPixels-baseline.minHeroPixels,
    separationGain=measure.bodyGapPx-baseline.bodyGapPx;
   // Both true source rigs remain legible: never replace overlap with deeper
   // overlap, even when a raw pixel-height statistic becomes attractive.
   if(separationGain< -4.0)continue;
   if(dangerRescue){
    if(measure.minHeroPixels<baseline.minHeroPixels*.90)continue;
   }else if(gain<Math.max(6,baseline.minHeroPixels*.16))continue;
   // Do not choose a high building/empty-sky shot merely to improve one
   // statistic. The genuine warning fit is always a hard safety constraint.
   const value=(dangerRescue?(baseline.fitFov-measure.fitFov)*4.5:0)+
    gain*1.9+Math.min(24,separationGain)*.20-
    Math.hypot(shiftX,shiftZ)*.85-
    Math.abs(angle)*.70-
    (1-reach)*.65-lift*.25;
   if(!best||value>best.value+1e-8)
    best={value,position,look,angle,reach,lift,framing:measure,
     shiftMeters:Math.hypot(shiftX,shiftZ)};
  }
 }
 if(!best)return Object.freeze({status:'UNCHANGED',baseline,threatCells:risk.count,
  criticalActors:risk.bodies.length,checked,fitCandidates});
 return Object.freeze({status:'IMPROVED',mode:'live-warning-centroid-and-native-bodies',
  dangerRescue,position:best.position,look:best.look,angle:best.angle,
  reach:best.reach,lift:best.lift,framing:best.framing,baseline,
  lookShiftMeters:Number(best.shiftMeters.toFixed(3)),
  threatCells:risk.count,criticalActors:risk.bodies.length,
  gainPixels:Number((best.framing.minHeroPixels-baseline.minHeroPixels).toFixed(2)),
  separationGainPx:Number((best.framing.bodyGapPx-baseline.bodyGapPx).toFixed(2)),
  gainDeg:Number((baseline.fitFov-best.framing.fitFov).toFixed(3)),
  checked,fitCandidates});
}
