/**
 * Physical camera framing for genuinely imminent Warden ground attacks.
 *
 * The old real-WebGL film-stage fitted only the first 32 *centres* of danger
 * tiles. An extreme live tile beyond that prefix, or even an edge of a tile,
 * could be cropped in a narrow portrait viewport while the test said clear.
 * This planner measures the exact occupied cell-footprint EXTENTS, plus the
 * real living boss and nearest real defender. Every submitted world point is
 * camera projection only: no new hit zone, actor, telegraph or map tile.
 *
 * At most 43 candidate shot projections over ten bounded camera-space
 * landmarks, computed only on authoritative warning frames. No GPU pass,
 * new mesh, mutable global cache, randomness, timer or gameplay change.
 * Impossible wide warnings return capped/unframeable truth rather than hiding
 * inconvenient cells or claiming a synthetic ray pass is visual acceptance.
 */
const finite=Number.isFinite;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const rad=Math.PI/180,deg=180/Math.PI;
const SHAPES=new Set(['NOVA','RIFT_CROSS','ECLIPSE_SWEEP']);
const WIDTH_MARGIN=.81,HEIGHT_MARGIN=.83;
const CAMERA_SHOTS=Object.freeze([
 [0,1,0],[0,1.2,0],[0,1.4,0],[0,1,1.8],[0,1.2,1.8],[0,1.35,3.5],
 [-.26,1.2,0],[.26,1.2,0],[-.5,1.3,1.6],[.5,1.3,1.6],
 [-.76,1.4,3],[.76,1.4,3],[-.26,1.5,3.5],[.26,1.5,3.5]
]);
const round=v=>Number(v.toFixed(3));
const good3=v=>v&&[v.x,v.y,v.z].every(finite);
const goodBase=b=>good3(b?.position)&&b?.look&&finite(b.look.x)&&finite(b.look.z);
function collect(state){
 const n=Array.isArray(state?.map)?state.map.length:0;
 const w=state?.bossWarning,units=state?.units;
 if(n<7||n>41||n%2!==1||!state.map.every(row=>typeof row==='string'&&row.length===n)||
  !Array.isArray(units)||units.length>80||!Number.isSafeInteger(state.tick)||
  !w||!SHAPES.has(w.shape)||!Number.isSafeInteger(w.attackTick)||
  w.attackTick<=state.tick||w.attackTick>state.tick+3||
  !Array.isArray(w.cells)||w.cells.length<1||w.cells.length>n*n)return null;
 const boss=units.find(u=>u?.kind==='warden'&&u.faction==='enemy'&&finite(u.hp)&&u.hp>0&&
  Number.isSafeInteger(u.x)&&Number.isSafeInteger(u.z)&&u.x>=0&&u.z>=0&&u.x<n&&u.z<n);
 const heroes=units.filter(u=>u?.faction==='party'&&finite(u.hp)&&u.hp>0&&
  Number.isSafeInteger(u.x)&&Number.isSafeInteger(u.z)&&u.x>=0&&u.z>=0&&u.x<n&&u.z<n);
 if(!boss||!heroes.length)return null;
 const defender=heroes.sort((a,b)=>(Math.abs(a.x-boss.x)+Math.abs(a.z-boss.z))-
  (Math.abs(b.x-boss.x)+Math.abs(b.z-boss.z))||String(a.id).localeCompare(String(b.id)))[0];
 let minX=n,maxX=0,minZ=n,maxZ=0;
 for(const cell of w.cells){
  if(!Number.isSafeInteger(cell?.x)||!Number.isSafeInteger(cell?.z)||
   cell.x<0||cell.x>=n||cell.z<0||cell.z>=n)return null;
  minX=Math.min(minX,cell.x);maxX=Math.max(maxX,cell.x);
  minZ=Math.min(minZ,cell.z);maxZ=Math.max(maxZ,cell.z);
 }
 const half=(n-1)/2;
 // Corners of the inclusive full tile bounds, never just a truncated prefix.
 // Any observed danger cell is inside this rectangle, even when diagonal.
 const ext={left:minX-half-.48,right:maxX-half+.48,
  near:minZ-half-.48,far:maxZ-half+.48};
 const points=[];
 for(const x of [ext.left,ext.right])for(const z of [ext.near,ext.far])
  points.push({x,y:.075,z});
 const body=(u,y,side=0)=>({x:u.x-half+side,y,z:u.z-half});
 points.push(body(boss,.1),body(boss,2.50),body(defender,.1),body(defender,2.05),
  body(defender,1.15,-.34),body(defender,1.15,.34));
 return {points:Object.freeze(points),cells:w.cells.length,size:n,
  danger:{x:(ext.left+ext.right)/2,z:(ext.near+ext.far)/2},
  bossId:boss.id,defenderId:defender.id};
}
function viewport(options){
 const {width,height,fov,lookY}=options||{};
 if(![width,height,fov].every(finite)||width<300||height<220||
  fov<30||fov>82||width/height<.35||width/height>3.2)return null;
 const aspect=width/height,maximum=aspect<.88?82:76;
 return {aspect,maximum,baseFov:fov,lookY:finite(lookY)?clamp(lookY,-1,3):.55};
}
function measure(points,camera,look,policy){
 const fy=look.y-camera.y,fx=look.x-camera.x,fz=look.z-camera.z;
 const length=Math.hypot(fx,fy,fz),flat=Math.hypot(fx,fz);
 if(length<.2||flat<.1)return {requiredFov:180,behind:points.length};
 const fX=fx/length,fY=fy/length,fZ=fz/length;
 const rX=-fz/flat,rZ=fx/flat;
 const uX=-rZ*fY,uY=rZ*fX-rX*fZ,uZ=rX*fY;
 let maximum=policy.baseFov,behind=0;
 for(const p of points){
  const x=p.x-camera.x,y=p.y-camera.y,z=p.z-camera.z;
  const depth=x*fX+y*fY+z*fZ;
  if(depth<=.18){behind++;maximum=180;continue;}
  const horizontal=(x*rX+z*rZ)/(policy.aspect*WIDTH_MARGIN),
   vertical=(x*uX+y*uY+z*uZ)/HEIGHT_MARGIN;
  const angle=2*deg*Math.atan2(Math.max(Math.abs(horizontal),Math.abs(vertical)),depth);
  maximum=Math.max(maximum,angle);
 }
 return {requiredFov:maximum,behind};
}
function quality(data,base,policy){
 const look={x:base.look.x,y:policy.lookY,z:base.look.z};
 const check=measure(data.points,base.position,look,policy);
 return {cells:data.cells,points:data.points.length,
  requiredFov:round(check.requiredFov),maxFov:policy.maximum,
  behind:check.behind,capped:check.requiredFov>policy.maximum+.001,
  covered:check.behind===0&&check.requiredFov<=policy.maximum+.001};
}
/** Exact full danger-footprint check at a supplied physical camera, no mutations. */
export function inspectThreatCoverage(state,base,options={}){
 const data=collect(state),policy=viewport(options);
 if(!data||!policy||!goodBase(base))return null;
 return Object.freeze(quality(data,base,policy));
}
/**
 * Choose a small, real bounded view correction only if it is a meaningful
 * improvement over the already-authored physical Warden warning shot.
 * Clamping the physical viewpoint to the actual dungeon is not navigation;
 * the final camera remains subject to the existing real-body ray/cutaway.
 */
export function planAuthoritativeThreatFrame(state,base,options={}){
 const data=collect(state),policy=viewport(options);
 if(!data||!policy||!goodBase(base))return null;
 const original=quality(data,base,policy),limit=(data.size-1)/2-.65;
 let best={camera:base,coverage:original,score:0,variant:'original'};
 const score=(check,position,look)=>{
  const overflow=Math.max(0,check.requiredFov-policy.maximum);
  const actualFov=Math.min(check.requiredFov,policy.maximum);
  const move=Math.hypot(position.x-base.position.x,position.y-base.position.y,
   position.z-base.position.z);
  const aim=Math.hypot(look.x-base.look.x,look.z-base.look.z);
  return overflow*9+actualFov*.65+move*.55+aim*.35+check.behind*200;
 };
 best.score=score(original,base.position,base.look);
 const delta={x:base.position.x-base.look.x,z:base.position.z-base.look.z};
 const radius=Math.hypot(delta.x,delta.z);
 // A warning is still a bodily fight. Do not rise to a satellite view just
 // because distant full-floor warning cells cannot fit a mobile close-up.
 const heightMax=clamp(base.position.y+4.2,8,18);
 const center={x:clamp(data.danger.x,-limit,limit),z:clamp(data.danger.z,-limit,limit)};
 const shifts=[0,.48,.84];
 let count=1;
 for(const shift of shifts){
  const look={x:clamp(base.look.x+(center.x-base.look.x)*shift,-limit,limit),
   y:policy.lookY,z:clamp(base.look.z+(center.z-base.look.z)*shift,-limit,limit)};
  for(const [angle,mult,lift] of CAMERA_SHOTS){
   const cos=Math.cos(angle),sin=Math.sin(angle),position={
    x:clamp(look.x+(delta.x*cos-delta.z*sin)*mult,-limit,limit),
    y:clamp(base.position.y+lift,3,heightMax),
    z:clamp(look.z+(delta.x*sin+delta.z*cos)*mult,-limit,limit)
   };
   if(Math.hypot(position.x-look.x,position.z-look.z)<1.5)continue;
   const check=measure(data.points,position,look,policy);count++;
   const coverage={cells:data.cells,points:data.points.length,
    requiredFov:round(check.requiredFov),maxFov:policy.maximum,
    behind:check.behind,capped:check.requiredFov>policy.maximum+.001,
    covered:check.behind===0&&check.requiredFov<=policy.maximum+.001};
   const value=score(coverage,position,look);
   if(value<best.score-.3){
    best={camera:{...base,position,look:{x:look.x,z:look.z}},
     coverage,score:value,variant:shift===0?'orbit':'recenter'};
   }
  }
 }
 const changed=best.variant!=='original';
 const camera=changed?best.camera:base;
 const coverage=best.coverage;
 return Object.freeze({camera,fov:round(clamp(Math.max(policy.baseFov,coverage.requiredFov+.35),
  policy.baseFov,policy.maximum)),coverage:Object.freeze(coverage),
  before:Object.freeze(original),subjectIds:Object.freeze([data.bossId,data.defenderId]),
  shotsMeasured:count,changed,reason:coverage.capped?'footprint-exceeds-visible-lens':
  changed?'physical-danger-coverage':'original-warning-framed',
  authorityChanged:false});
}

/**
 * Only an imminent true attack may request a faster camera entry. Existing
 * angular ease is retained whenever the real danger footprint is already
 * visible. Otherwise inspect bounded partial physical transitions and pick
 * the earliest one that actually reveals all available warning cells within
 * the existing mobile/desktop FOV cap. No teleports or synthetic danger.
 */
export function refineAuthoritativeWarningTransition(state,actual,proposed,desired,options={}){
 const data=collect(state),policy=viewport(options);
 if(!data||!policy||!good3(actual?.position)||!good3(actual?.aim)||
  !good3(proposed?.position)||!good3(proposed?.aim)||
  !good3(desired?.position)||!good3(desired?.aim)||
  ![actual.fov,proposed.fov,desired.fov].every(finite))return null;
 const view=pose=>{
  const check=measure(data.points,pose.position,pose.aim,{
   ...policy,baseFov:pose.fov});
  return {requiredFov:round(check.requiredFov),behind:check.behind,
   covered:check.behind===0&&check.requiredFov<=pose.fov+.05};
 };
 const baseline=view(proposed);
 if(baseline.covered||proposed===desired)
  return Object.freeze({pose:proposed,changed:false,fraction:0,
   reason:baseline.covered?'already-visible':'exact-candidate',coverage:Object.freeze(baseline)});
 const fractions=[.55,.70,.82,.94];
 let best={pose:proposed,fraction:0,coverage:baseline};
 const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
  y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
 for(const f of fractions){
  const candidate={position:lerp(actual.position,desired.position,f),
   aim:lerp(actual.aim,desired.aim,f),
   fov:Math.min(policy.maximum,Math.max(proposed.fov,desired.fov))};
  // A partially completed physical move may need a slightly wider lens
  // than the settled target. Only genuine current-tick danger can request
  // this limited temporary width; never exceed the viewport's safety cap.
  const initial=view(candidate);
  candidate.fov=clamp(Math.max(candidate.fov,initial.requiredFov+.35),
   candidate.fov,policy.maximum);
  const coverage=view(candidate);
  if(coverage.covered){best={pose:candidate,fraction:f,coverage};break;}
  // A partial correction must still buy a meaningful actual field-of-view
  // improvement over the existing ease. Do not chase a totally unframeable
  // ground pattern with a near-instant gratuitous shot change.
  if(coverage.requiredFov<best.coverage.requiredFov-4.5&&
     coverage.behind<=best.coverage.behind)
   best={pose:candidate,fraction:f,coverage};
 }
 const changed=best.fraction>0;
 return Object.freeze({pose:Object.freeze(best.pose),changed,fraction:best.fraction,
  reason:best.coverage.covered?'urgent-danger-visible':
   changed?'partial-danger-coverage':'no-beneficial-urgent-transition',
  coverage:Object.freeze(best.coverage),authorityChanged:false});
}
