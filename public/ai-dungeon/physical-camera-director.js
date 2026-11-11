/**
 * Read-only, body-scale occlusion-aware cinematography for the ACTUAL dungeon.
 *
 * A camera angle is worth changing only when more of the living actors' real
 * head / torso / boots can be seen through the same physical Gothic masonry
 * that the renderer draws. Candidate shots are scored against the SAME stone
 * cutaway policy as the running scene; a testing metric or a named hero cannot
 * conjure a transparent wall, new position, fight or damage event.
 *
 * No WebGL allocations, extra render passes, timers, authoritative RNG or
 * movement occur here. Decision changes are latched per real run / floor and
 * limited to the existing director's cinematic shot (manual views untouched).
 */
import {planForegroundPointRisk,planDrawableForegroundVolumes} from '/dungeon/foreground-sightline-plan.js';
import {planProjectedBodyAperture,planPortraitStageClearance} from '/dungeon/party-visibility-plan.js';
import {planWardenThreatOrbit,planWardenThreatComposition,assessThreatOrbit,orbitThreatCamera} from '/dungeon/warden-threat-orbit.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const ANGLES=Object.freeze([0,-.40,.40,-.76,.76]);
// Escalating, bounded high-oblique rescues keep the real fighter in frame
// while retaining the restored rear vault. Use the same physical wall and
// anatomical ray score; never introduce an extra WebGL render pass.
const RESCUE_SHOTS=Object.freeze([
 {angle:0,lift:1.15,reach:1},
 {angle:-.48,lift:2.0,reach:1.06},
 {angle:.48,lift:2.0,reach:1.06},
 {angle:0,lift:2.65,reach:1.1}
]);
const MAX_CANDIDATES=ANGLES.length+RESCUE_SHOTS.length;
// Body width matters: a visible helmet does not prove visible weapon arms.
const BODY_SAMPLES=Object.freeze([{y:1.63,weight:2.7,side:0},
 {y:1.17,weight:1.35,side:-.26},{y:1.17,weight:1.35,side:.26},
 {y:1.02,weight:2.3,side:0},{y:.26,weight:1.65,side:0}]);
const FOV=Math.PI/180;

function boundedWalls(positions,heights,size){
 const grid=new Float32Array(size*size);grid.fill(0);
 if(!Array.isArray(positions)||positions.length>size*size||!Array.isArray(heights)||heights.length!==positions.length)return grid;
 const origin=(size-1)/2;
 for(let i=0;i<positions.length;i++){
  const p=positions[i];if(!Array.isArray(p)||!finite(p[0])||!finite(p[1]))continue;
  const x=Math.round(p[0]+origin),z=Math.round(p[1]+origin);
  if(x>=0&&z>=0&&x<size&&z<size)
   grid[z*size+x]=clamp(finite(heights[i])?heights[i]:2.6,.3,5);
 }
 return grid;
}

function projected(cam,look,point,aspect,fov){
 const aimY=finite(look.y)?look.y:1.05;
 const fx=look.x-cam.x,fy=aimY-cam.y,fz=look.z-cam.z;
 const fl=Math.hypot(fx,fy,fz);if(fl<.1)return false;
 const forward=[fx/fl,fy/fl,fz/fl];
 const rightLen=Math.hypot(forward[0],forward[2]);if(rightLen<.01)return false;
 const right=[-forward[2]/rightLen,0,forward[0]/rightLen];
 const up=[-right[2]*forward[1],right[2]*forward[0]-right[0]*forward[2],right[0]*forward[1]];
 const dx=point.x-cam.x,dy=point.y-cam.y,dz=point.z-cam.z;
 const depth=dx*forward[0]+dy*forward[1]+dz*forward[2];
 if(depth<=.15)return false;
 const halfY=depth*Math.tan(fov*FOV/2);
 if(halfY<=.01)return false;
 const sx=(dx*right[0]+dz*right[2])/(halfY*aspect);
 const sy=(dx*up[0]+dy*up[1]+dz*up[2])/halfY;
 return Math.abs(sx)<.92&&Math.abs(sy)<.91;
}


/**
 * Project only ACTUALLY DRAWN tall foreground architecture onto the portrait
 * acting lane. Real WebGL captures showed a massive opaque pillar on the
 * right of a 390px frame while skull/chest/boot rays still said "clear".
 * This does not hide any geometry or alter collision, AI, hit, camera input,
 * simulation, replay, audio or accessibility mode; it grades eligible shots.
 */
function projectScreen(cam,look,point,aspect,fov){
 const aimY=finite(look.y)?look.y:1.05;
 const fx=look.x-cam.x,fy=aimY-cam.y,fz=look.z-cam.z;
 const fl=Math.hypot(fx,fy,fz);if(fl<.1)return null;
 const rightLen=Math.hypot(fx,fz);if(rightLen<.01)return null;
 const dx=point.x-cam.x,dy=point.y-cam.y,dz=point.z-cam.z;
 const forward=[fx/fl,fy/fl,fz/fl],right=[-fz/rightLen,0,fx/rightLen];
 const up=[-right[2]*forward[1],right[2]*forward[0]-right[0]*forward[2],right[0]*forward[1]];
 const depth=dx*forward[0]+dy*forward[1]+dz*forward[2];
 if(depth<=.15)return null;
 const h=depth*Math.tan(fov*FOV/2);
 if(h<=.01)return null;
 return {x:(dx*right[0]+dz*right[2])/(h*aspect),
  y:(dx*up[0]+dy*up[1]+dz*up[2])/h,depth};
}
export function planPortraitShotClutter(cam,look,subjects,boxes,viewport){
 const aspect=viewport?.width/viewport?.height;
 if(!finite(aspect)||aspect<.35||aspect>=.86||
    !Array.isArray(subjects)||subjects.length>5||!Array.isArray(boxes)||boxes.length>160||
    ![cam?.x,cam?.y,cam?.z,look?.x,look?.z,viewport?.fov].every(finite))
  return {penalty:0,props:0};
 let penalty=0,props=0;
 for(const box of boxes){
  if(!Array.isArray(box)||box.length!==6||!box.every(finite)||
     box[3]-box[0]<.12||box[4]-box[1]<1.2||box[5]-box[2]<.12||
     box[3]-box[0]>8||box[4]-box[1]>8||box[5]-box[2]>8)continue;
  const cx=(box[0]+box[3])*.5,cz=(box[2]+box[5])*.5;
  for(const actor of subjects){
   if(actor?.visibleActor!==true||![actor?.x,actor?.z].every(finite)||
      Math.hypot(cx-actor.x,cz-actor.z)>5.5)continue;
   const dx=actor.x-cam.x,dz=actor.z-cam.z,dist=Math.hypot(dx,dz);
   if(dist<.8||dist>30||(cx-actor.x)*dx+(cz-actor.z)*dz>.20*dist)continue;
   const focus=projectScreen(cam,look,{x:actor.x,y:actor.kind==='warden'?1.5:1.05,z:actor.z},aspect,viewport.fov);
   if(!focus||Math.abs(focus.x)>1.06||Math.abs(focus.y)>1.06)continue;
   let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,near=Infinity;
   for(const x of [box[0],box[3]])for(const y of [box[1],box[4]])for(const z of [box[2],box[5]]){
    const p=projectScreen(cam,look,{x,y,z},aspect,viewport.fov);
    if(!p)continue;
    minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);
    minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);near=Math.min(near,p.depth);
   }
   if(!finite(minX)||near>=focus.depth-.12)continue;
   const fullWidth=Math.min(1,maxX)-Math.max(-1,minX);
   const fullHeight=Math.min(1,maxY)-Math.max(-1,minY);
   const overlapX=Math.min(maxX,focus.x+.62)-Math.max(minX,focus.x-.62);
   const overlapY=Math.min(maxY,focus.y+.78)-Math.max(minY,focus.y-.70);
   if(fullWidth<.16||fullHeight<.24||overlapX<.12||overlapY<.22)continue;
   // At most two significant physically frontmost props contribute. A
   // contained camera orbit is better than clearing a whole Gothic chamber.
   penalty+=Math.min(5.5,1.8+Math.min(.9,overlapX)*2.1+Math.min(1.4,overlapY)*.8);
   props++;break;
  }
  if(props>=2)break;
 }
 return {penalty:Number(penalty.toFixed(3)),props};
}

function blockedByStone(cam,subject,y,grid,size,eyes,reveal,pad){
 // Sample the actual camera-to-body ray through solid, grid-aligned wall
 // columns. A tall distant wall obscures faces; a low ruined parapet can
 // still obscure a planted boot. Decorative stone uses the same reveal bands.
 const dx=subject.x-cam.x,dz=subject.z-cam.z;
 const steps=Math.ceil(Math.hypot(dx,dz)*4.8);
 if(steps<2)return false;
 const origin=(size-1)/2;
 let last=-1;
 for(let i=1;i<steps;i++){
  const t=i/steps,x=cam.x+dx*t,z=cam.z+dz*t;
  const col=Math.round(x+origin),row=Math.round(z+origin);
  if(col<0||row<0||col>=size||row>=size)continue;
  const key=row*size+col;if(key===last)continue;last=key;
  const stone=grid[key];if(stone<=0)continue;
  const wx=col-origin,wz=row-origin;
  const band=reveal(wx,wz,eyes,cam,pad,stone);
  const height=band==='sightline'?.13:band==='nearby'?.43:stone;
  const lineY=cam.y+(y-cam.y)*t;
  // Lower the false-positive rate near a cell corner; the actual stone is
  // 0.84-1.02 m wide, not an infinitely large 1 m square.
  if(Math.abs(x-wx)>.48||Math.abs(z-wz)>.48)continue;
  if(lineY<height+.025)return true;
 }
 return false;
}

/**
 * Check the exact *rendered* facade blocks, not just the underlying tile grid.
 * A whole-body camera ray can miss a thin ornamented stone slab while its
 * actual pixels still hide a sword, thigh or boot. The renderer's same
 * three-band cutaway is applied before testing the physical slab intersection.
 * Zero extra WebGL passes or gameplay state. Bounded by actor proximity and
 * a finite per-floor facade budget.
 */
function rayIntersectsBox(cam,point,x0,y0,z0,x1,y1,z1){
 let lo=.014,hi=.987;
 const dx=point.x-cam.x,dy=point.y-cam.y,dz=point.z-cam.z;
 if(Math.abs(dx)<1e-8){if(cam.x<x0||cam.x>x1)return false;}
 else{const a=(x0-cam.x)/dx,b=(x1-cam.x)/dx;
  lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return false;}
 if(Math.abs(dy)<1e-8){if(cam.y<y0||cam.y>y1)return false;}
 else{const a=(y0-cam.y)/dy,b=(y1-cam.y)/dy;
  lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return false;}
 if(Math.abs(dz)<1e-8){if(cam.z<z0||cam.z>z1)return false;}
 else{const a=(z0-cam.z)/dz,b=(z1-cam.z)/dz;
  lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}
 return lo<=hi;
}
export function planFacadeBodyOcclusion(cam,point,facades,eyes,reveal,pad=2.1,facadeReveal=null){
 if(![cam?.x,cam?.y,cam?.z,point?.x,point?.y,point?.z].every(finite)||
    !Array.isArray(facades)||facades.length>2048||typeof reveal!=='function')return false;
 for(const f of facades){
  if(!Array.isArray(f)||f.length<6||![f[0],f[1],f[2],f[3],f[4],f[5]].every(finite)||
     f[3]<=0||f[4]<=0||f[5]<=0||f[3]>4||f[4]>6||f[5]>4)continue;
  if(Math.abs(f[0]-point.x)>5.8||Math.abs(f[2]-point.z)>5.8)continue;
  // Reject slabs outside the real ray *before* costly five-actor cutaway.
  // A selected facade cannot block if its original complete stone did not.
  if(!rayIntersectsBox(cam,point,f[0]-f[3]/2,f[1]-f[4]/2,f[2]-f[5]/2,
                       f[0]+f[3]/2,f[1]+f[4]/2,f[2]+f[5]/2))continue;
  // These are precisely the facadeMesh.setMatrixAt dimensions in environment.js.
  const band=typeof facadeReveal==='function'?facadeReveal(f,eyes,cam,pad):
   reveal(f[0],f[2],eyes,cam,pad,f[4]);
  const h=band==='sightline'?.13:band==='nearby'?.43:f[4];
  const cy=band==='sightline'?.115:band==='nearby'?.23:f[1];
  if(rayIntersectsBox(cam,point,f[0]-f[3]/2,cy-h/2,f[2]-f[5]/2,
                      f[0]+f[3]/2,cy+h/2,f[2]+f[5]/2))return true;
 }
 return false;
}

function orbit(base,index,size){
 const center=base.look,cam=base.position,dx=cam.x-center.x,dz=cam.z-center.z;
 const limit=(size-1)/2-.65;
 const rescue=RESCUE_SHOTS[index-ANGLES.length];
 const angle=rescue?.angle??ANGLES[index]??0,cos=Math.cos(angle),sin=Math.sin(angle);
 const reach=rescue?.reach??1;
 return {x:clamp(center.x+(dx*cos-dz*sin)*reach,-limit,limit),
  y:rescue?clamp(cam.y+rescue.lift,3,28):cam.y,
  z:clamp(center.z+(dx*sin+dz*cos)*reach,-limit,limit)};
}

function grade(cam,look,eyes,grid,size,viewport,reveal,pad,facades,facadeReveal,propVolumes){
 // Each proposed shot is graded against the scene it would REALLY display:
 // foreground models culled by a genuine skinned actor are not still opaque
 // to this camera. Keep the original bounded point-ray test for the rest.
 // Judge the physically DRAWN set after the real actor/body projection
 // cutaways, particularly the mobile sword/evasion corridor. The renderer
 // uses these exact policies; this CPU-only plan never changes the dungeon.
 const view={look,aspect:viewport.width/viewport.height,fov:viewport.fov};
 propVolumes=planDrawableForegroundVolumes(propVolumes,eyes,cam).filter(box=>
  !planProjectedBodyAperture(box,eyes,cam,view)&&
  !planPortraitStageClearance(box,eyes,cam,view));
 const aspect=viewport.width/viewport.height;
 const fov=clamp(viewport.fov,32,66);
 // grade() already excludes props hidden by the renderer's real live-body
 // clearance policies. Never penalize a stone object the game did not draw.
 const foreground=planPortraitShotClutter(cam,look,eyes,propVolumes,viewport);
 let score=-foreground.penalty,blocked=0,cropped=0,fullyVisible=0;
 for(const p of eyes){
  let bodyVisible=0;
  const length=Math.max(.1,Math.hypot(p.x-cam.x,p.z-cam.z));
  const rightX=-(p.z-cam.z)/length,rightZ=(p.x-cam.x)/length;
  const native=Array.isArray(p.bodyPoints)&&p.bodyPoints.length>=3&&p.bodyPoints.length<=8?
   p.bodyPoints.filter(q=>finite(q?.x)&&finite(q?.y)&&finite(q?.z)):null;
  const samples=native?.length>=3?native.map((q,i)=>({...q,weight:i===0?2.7:i===1?2.3:1.35})):
   BODY_SAMPLES.map(sample=>({x:p.x+rightX*sample.side,
    y:p.kind==='warden'?sample.y*1.32:sample.y,z:p.z+rightZ*sample.side,weight:sample.weight}));
  for(const sample of samples){
   const point=sample;
   if(!projected(cam,look,point,aspect,fov)){
    score-=sample.weight*1.8;cropped++;continue;
   }
   if(blockedByStone(cam,point,point.y,grid,size,eyes,reveal,pad)||
      planFacadeBodyOcclusion(cam,point,facades,eyes,reveal,pad,facadeReveal)||
       planForegroundPointRisk(propVolumes,cam,point,p)){
    score-=sample.weight*1.45;blocked++;continue;
   }
   score+=sample.weight;bodyVisible++;
  }
  if(bodyVisible===samples.length){fullyVisible++;score+=.75;}
 }
 const origin=(size-1)/2,cx=Math.round(cam.x+origin),cz=Math.round(cam.z+origin);
 if(cx>=0&&cz>=0&&cx<size&&cz<size&&grid[cz*size+cx]>0)score-=2.5;
 return {score,blocked,cropped,fullyVisible,foregroundProps:foreground.props,foregroundPenalty:foreground.penalty};
}

/**
 * A real Warden warning legitimately needs a wide view of *every* attack tile.
 * After the authoritative strike, those marked cells have resolved. The old
 * three-tick hold kept the actual source-skinned sword and earned counter tiny
 * although the game's own authored encounter director had a closer, safe shot.
 *
 * Release that hold only when BOTH original rigged combatants become
 * materially bigger without losing their genuine helmet/boot/weapon lanes to
 * physical stone, facades, opaque props or the viewport. No fabricated actor,
 * extra camera pass, altered danger map or modified authority can earn focus.
 * Camera movement itself remains handled by the existing app-level lerp.
 */
export function planEarnedWardenCounterFocus(state,heldCamera,heldLook,baseCamera,baseLook,
 subjects,{width=390,height=844,fov=53,gradeShot=null}={}){
 const unavailable=Object.freeze({accept:false,reason:'no-safe-native-counter'});
 if(!Number.isSafeInteger(state?.tick)||!Array.isArray(state.units)||
  state.bossWarning||!(state?.bossRecovery?.remaining>0)||
  ![width,height,fov].every(finite)||width<300||height<220||
  ![heldCamera?.x,heldCamera?.y,heldCamera?.z,
   baseCamera?.x,baseCamera?.y,baseCamera?.z,
   heldLook?.x,heldLook?.z,baseLook?.x,baseLook?.z].every(finite)||
  typeof gradeShot!=='function'||!Array.isArray(subjects))return unavailable;
 const boss=state.units.find(u=>u.kind==='warden'&&u.hp>0);
 if(!boss)return unavailable;
 const idMap=new Map(subjects.filter(p=>typeof p?.unitId==='string'&&
  Array.isArray(p.bodyPoints)&&p.bodyPoints.length>=3&&p.bodyPoints.length<=8&&
  p.bodyPoints.every(q=>[q?.x,q?.y,q?.z].every(finite)))
  .map(p=>[p.unitId,p]));
 const bossBody=idMap.get(boss.id);
 if(!bossBody)return unavailable;
 const party=state.units.filter(u=>u.faction==='party'&&u.hp>0&&idMap.has(u.id));
 if(!party.length)return unavailable;
 party.sort((a,b)=>Math.abs(a.x-boss.x)+Math.abs(a.z-boss.z)-
  Math.abs(b.x-boss.x)-Math.abs(b.z-boss.z)||a.id.localeCompare(b.id));
 const combatants=[bossBody,idMap.get(party[0].id)];
 const pixels=(cam,look)=>{
  const aspect=width/height,heights=[];
  for(const actor of combatants){
   const y=[];
   for(const p of actor.bodyPoints){
    const projection=projectScreen(cam,look,p,aspect,fov);
    if(!projection||Math.abs(projection.x)>.93||Math.abs(projection.y)>.91)return 0;
    y.push(projection.y);
   }
   heights.push((Math.max(...y)-Math.min(...y))*height*.5);
  }
  return Math.min(...heights);
 };
 const before=pixels(heldCamera,heldLook),after=pixels(baseCamera,baseLook);
 if(before<8||after<before*1.26||after-before<7)return unavailable;
 const safety=gradeShot(baseCamera,baseLook,combatants);
 if(safety.blocked>0||safety.cropped>0||safety.fullyVisible<2||
    safety.foregroundPenalty>0.45)return unavailable;
 return Object.freeze({accept:true,reason:'source-earned-counter-native-close',
  criticalSourceCombatants:combatants.map(p=>p.unitId),
  minimumNativePixelsBefore:Number(before.toFixed(2)),
  minimumNativePixelsAfter:Number(after.toFixed(2)),
  genuineWarningCellsRemaining:0,blockedAfter:0,croppedAfter:0});
}

export function createPhysicalCameraDirector(){
 let scene=null,choice=0,switches=0,checks=0,improvements=0,last=null,grid=null,wallsRef=null,heightsRef=null,lastTick=null;
 let threatKey=null,threatReleaseTick=null,threatAngle=0,threatReach=1,threatLift=0,threatLookX=0,threatLookZ=0;
 // Cache the ACTUAL adopted world pose; the cinematic base shot changes as
 // warning becomes release/recovery and must not drag the supposedly held view.
 let threatHeldCamera=null,threatHeldLook=null;
 function reset(){scene=null;choice=0;last=null;grid=null;wallsRef=null;heightsRef=null;lastTick=null;threatKey=null;threatReleaseTick=null;threatAngle=0;threatReach=1;threatLift=0;threatLookX=0;threatLookZ=0;threatHeldCamera=null;threatHeldLook=null;}
 function resolve(state,base,{subjects=[],wallPositions=[],wallHeights=[],facades=[],facadeReveal=null,propVolumes=[],reveal=null,wallPad=2.1,
    width=1440,height=832,fov=48,lookY=1.05,reducedMotion=false}={}){
  if(reducedMotion||state?.phase==='intermission'||typeof reveal!=='function'||
   !Number.isSafeInteger(state?.run)||!Number.isSafeInteger(state?.floor)||
   !Array.isArray(state?.map)||state.map.length<7||state.map.length>41||
   !state.map.every(row=>typeof row==='string'&&row.length===state.map.length)||
   !finite(width)||!finite(height)||width<300||height<220||
   !base?.position||!finite(base.position.x)||!finite(base.position.y)||!finite(base.position.z)||
   !base?.look||!finite(base.look.x)||!finite(base.look.z))return null;
  const key=state.run+':'+state.floor,size=state.map.length;
  if(key!==scene){reset();scene=key;}
  if(wallPositions!==wallsRef||wallHeights!==heightsRef){grid=boundedWalls(wallPositions,wallHeights,size);wallsRef=wallPositions;heightsRef=wallHeights;lastTick=null;}
  const eyes=(Array.isArray(subjects)?subjects:[]).filter(p=>finite(p?.x)&&finite(p?.z)).slice(0,5);
  if(!eyes.length||!grid)return null;
  const center=base.look,look={x:center.x,y:lookY,z:center.z};
  // Earlier Warden warning hard stop made combatants tiny. Move only if every
  // actual danger-cell corner and both native physical bodies fit the SAME
  // lens, and if the real masonry/foreground assessment finds no regression.

  if(state?.bossWarning){
   const sourceKey=key+':'+state.bossWarning.attackTick;
   const viewport={width,height,fov};
   const from=grade(base.position,look,eyes,grid,size,viewport,reveal,wallPad,
    facades,facadeReveal,propVolumes);
   // Store the actual selected physical camera, not only its angle/reach.
   // The authored encounter camera may move when action and focus switch;
   // reapplying the old orbit to a new base silently jumped the supposedly
   // held Warden warning/strike camera in the running game.
   if(threatKey===sourceKey){
    if(!threatHeldCamera||!threatHeldLook)return null;
    const held=threatHeldCamera,shiftedLook=threatHeldLook;
    const current=assessThreatOrbit({state,base:{...base,look:shiftedLook},
      subjects:eyes,width,height,fov},held);
    if(!current.valid||current.fitFov>fov-.5)return null;
    const after=grade(held,shiftedLook,eyes,grid,size,viewport,reveal,wallPad,
      facades,facadeReveal,propVolumes);
    return after.blocked<=from.blocked&&after.cropped<=from.cropped&&
     after.fullyVisible>=from.fullyVisible&&
     after.foregroundPenalty<=from.foregroundPenalty+.4?
     {...base,look:shiftedLook,position:held,occlusion:last}:null;
   }
   threatKey=sourceKey;threatReleaseTick=null;threatAngle=0;threatReach=1;threatLift=0;
   threatLookX=0;threatLookZ=0;threatHeldCamera=null;threatHeldLook=null;
   // The original orbit is a conservative fallback. The integrated warning
   // composition also considers a new optical aim from TRUE danger geometry,
   // but no candidate is selected until the same rendered masonry test passes.
   const request={state,base:{...base,look},subjects:eyes,
    width,height,fov,reducedMotion};
   const eligible=[planWardenThreatOrbit(request),
    planWardenThreatComposition(request)].filter(c=>c.status==='IMPROVED');
   checks++;
   let chosen=null,blockedCount=0;
   for(const candidate of eligible){
    const candidateLook=candidate.look??look;
    const after=grade(candidate.position,candidateLook,eyes,grid,size,
      viewport,reveal,wallPad,facades,facadeReveal,propVolumes);
    if(after.blocked>from.blocked||after.cropped>from.cropped||
       after.fullyVisible<from.fullyVisible||
       after.foregroundPenalty>from.foregroundPenalty+.4){
     blockedCount++;continue;
    }
    // Safety-first: when the original crop hides an imminent hazard, prefer
    // how much authentic footprint has been rescued. Otherwise demand an
    // actually larger true source rig and distinctly separated silhouettes.
    const rank=(candidate.dangerRescue?
       Math.max(0,candidate.gainDeg)*6:0)+
      candidate.gainPixels*1.8+
      Math.min(12,candidate.separationGainPx??0)*.2-
      Math.hypot(candidateLook.x-look.x,candidateLook.z-look.z)*.6;
    if(!chosen||rank>chosen.rank+1e-7)
     chosen={candidate,after,rank};
   }
   if(!chosen){
    last={selected:0,reason:blockedCount?'threat-physical-occlusion-reject':
     'threat-no-safe-portrait-gain',
     actualThreatCells:state.bossWarning.cells?.length??0};
    return null;
   }
   const candidate=chosen.candidate,after=chosen.after;
   threatAngle=candidate.angle;threatReach=candidate.reach;
   threatLift=candidate.lift;threatReleaseTick=state.bossWarning.attackTick;
   threatLookX=(candidate.look?.x??look.x)-look.x;
   threatLookZ=(candidate.look?.z??look.z)-look.z;
   threatHeldCamera=Object.freeze({...candidate.position});
   threatHeldLook=Object.freeze({...(candidate.look??look)});
   switches++;improvements++;
   last={selected:'warden-risk-safe',reason:'threat-safe-optical-framing',
    mode:candidate.mode??'original-native-orbit',
    actualThreatCells:candidate.threatCells,
    criticalNativeBodies:candidate.criticalActors,
    minimumCriticalPixelsBefore:candidate.baseline.minHeroPixels,
    minimumCriticalPixelsAfter:candidate.framing.minHeroPixels,
    bodySeparationBefore:candidate.baseline.bodyGapPx,
    bodySeparationAfter:candidate.framing.bodyGapPx,
    requiredFovBefore:candidate.baseline.fitFov,
    requiredFovAfter:candidate.framing.fitFov,
    actualLensFov:fov,reach:threatReach,lift:threatLift,
    lookShiftMeters:Math.hypot(threatLookX,threatLookZ),
    gainActualPixels:candidate.gainPixels,
    blockedBefore:from.blocked,blockedAfter:after.blocked,
    croppedBefore:from.cropped,croppedAfter:after.cropped};
   return {...base,look:candidate.look??base.look,
    position:candidate.position,occlusion:last};
  }
  // The source-skeleton warning shot must survive its ACTUAL strike and
  // earned recovery. Previously we dropped the physical camera immediately
  // when the warning flag cleared, cutting away at the very instant that the
  // hit/recoil and counter window should be watched. This holds only a real
  // preceding, source-fitted shot for at most three authority ticks, then
  // releases it. The safety grade uses CURRENT living bodies/opaque stone:
  // never keep a shot that crops or hides them. No gameplay or audio mutation.
  const recoveryTicks=Number.isSafeInteger(state?.bossRecovery?.remaining)?
   state.bossRecovery.remaining:0;
  const bossAlive=Array.isArray(state?.units)&&state.units.some(u=>
   u?.kind==='warden'&&u.hp>0);
  const trueRelease=Number.isSafeInteger(threatReleaseTick)&&
   Number.isSafeInteger(state.tick)&&state.tick>=threatReleaseTick&&
   state.tick<=threatReleaseTick+3&&
   (state.tick===threatReleaseTick||recoveryTicks>0);
  if(threatKey?.startsWith(key+':')&&trueRelease&&bossAlive&&
     (threatAngle!==0||threatReach!==1||threatLift!==0||
      threatLookX!==0||threatLookZ!==0)){
   // Reuse EXACT stored camera/aim from the true warning even if the
   // native release/counter cinematic planner changed its base composition.
   // A genuine changed body position still goes through a fresh visibility
   // and foreground grade before the held camera can be shown.
   const shiftedLook=threatHeldLook,held=threatHeldCamera;
   if(!held||!shiftedLook)return null;
   const viewport={width,height,fov};
   const before=grade(base.position,look,eyes,grid,size,viewport,
    reveal,wallPad,facades,facadeReveal,propVolumes);
   const after=grade(held,shiftedLook,eyes,grid,size,viewport,
    reveal,wallPad,facades,facadeReveal,propVolumes);
   // During the earned, HP-authoritative counter window ONLY, the 23-cell
   // warning has already resolved. Let the actual encounter planner's own
   // closer camera show the source-skinned actors, but only after a fresh
   // two-body projective/stone/foreground safety proof. Never cut during the
   // warned attack release or borrow a shot without its true prior warning.
   if(recoveryTicks>0&&state.tick>threatReleaseTick){
    const nativeFocus=planEarnedWardenCounterFocus(state,held,shiftedLook,
     base.position,look,eyes,{width,height,fov,
      gradeShot:(camera,aim,duo)=>grade(camera,aim,duo,grid,size,viewport,
       reveal,wallPad,facades,facadeReveal,propVolumes)});
    if(nativeFocus.accept){
     last={...last,...nativeFocus,selected:'warden-earned-native-counter-close'};
     return null;
    }
   }
   if(after.blocked<=before.blocked&&after.cropped<=before.cropped&&
      after.fullyVisible>=before.fullyVisible&&
      after.foregroundPenalty<=before.foregroundPenalty+.4){
    last={...last,selected:'warden-true-hit-continuity',
     reason:'source-warning-to-strike-recovery',
     phase:recoveryTicks>0?'EARNED_RECOVERY':'TRUE_RELEASE',
     authorityReleaseTick:threatReleaseTick,
     remainingRecoveryTicks:recoveryTicks,
     blockedAfter:after.blocked,croppedAfter:after.cropped};
    return {...base,look:shiftedLook,position:held,occlusion:last};
   }
  }
  threatKey=null;threatReleaseTick=null;threatAngle=0;threatReach=1;threatLift=0;
  threatLookX=0;threatLookZ=0;threatHeldCamera=null;threatHeldLook=null;
  if(Number.isSafeInteger(state.tick)&&state.tick===lastTick&&last){
   return choice===0?null:{...base,position:orbit(base,choice,size),occlusion:last};
  }
  lastTick=Number.isSafeInteger(state.tick)?state.tick:null;
  const viewport={width,height,fov};
  const candidates=[];
  // Preserve original composer distance and lens. Only bounded real orbit
  // choices compete, and one raised shot is available for a dense foreground.
  for(let i=0;i<MAX_CANDIDATES;i++){
   const rescue=RESCUE_SHOTS[i-ANGLES.length];
   const angle=rescue?.angle??ANGLES[i]??0,camera=orbit(base,i,size);
   const result=grade(camera,look,eyes,grid,size,viewport,reveal,wallPad,facades,facadeReveal,propVolumes);
   // An elevated shot pays a real compositional cost: use it only when
   // more of the actual skinned bodies become visible without new cropping.
   const penalty=rescue?.lift!==undefined?
    .70+Math.abs(angle)*.75+(rescue.lift-1.15)*.30:Math.abs(angle)*1.15;
   candidates.push({index:i,camera,...result,value:result.score-penalty});
  }
  checks++;
  const baseline=candidates[0];
  if(baseline.blocked+baseline.cropped===0&&baseline.foregroundProps===0){choice=0;last={selected:0,reason:'clear',blocked:0,cropped:0,candidates:candidates.length};return null;}
  // No orbit just for variety or a material colour change. Reject an orbit
  // that turns one visible member into an off-screen invisible one.
  let best=candidates[0];
  for(const candidate of candidates.slice(1))if(candidate.value>best.value+.001&&
   candidate.fullyVisible>=baseline.fullyVisible&&candidate.cropped<=baseline.cropped)best=candidate;
  const held=candidates[choice];
  if(choice!==0&&held&&held.value>=best.value-.85&&held.cropped<=baseline.cropped)best=held;
  const meaningful=best.index!==0&&best.value-baseline.value>2.3&&
   (best.blocked<baseline.blocked||best.cropped<baseline.cropped||
    best.foregroundPenalty<baseline.foregroundPenalty-2.2);
  if(!meaningful){choice=0;last={selected:0,reason:'insufficient-visibility-gain',baseline:baseline.score,after:best.score,blocked:baseline.blocked,cropped:baseline.cropped,candidates:candidates.length};return null;}
  if(choice!==best.index){switches++;choice=best.index;}
  improvements++;
  last={selected:choice,reason:'real-body-visibility',baseline:Number(baseline.score.toFixed(3)),
   after:Number(best.score.toFixed(3)),blockedBefore:baseline.blocked,blockedAfter:best.blocked,
   croppedBefore:baseline.cropped,croppedAfter:best.cropped,fullyVisibleBefore:baseline.fullyVisible,
   fullyVisibleAfter:best.fullyVisible,foregroundPropsBefore:baseline.foregroundProps,
   foregroundPropsAfter:best.foregroundProps,foregroundPenaltyBefore:baseline.foregroundPenalty,
   foregroundPenaltyAfter:best.foregroundPenalty,candidates:candidates.length};
  return {...base,position:best.camera,occlusion:last};
 }
 return Object.freeze({resolve,reset,metrics:()=>Object.freeze({...last,checks,switches,improvements})});
}
