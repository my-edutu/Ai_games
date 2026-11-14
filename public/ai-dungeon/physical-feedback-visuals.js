/**
 * D04 physical spectator effects — v2 original, restrained, fully retained art.
 *
 * Source of truth is the cue planner, NEVER collision proximity or an effect's
 * arrival. A sword's air streak follows the existing skinned hand; actual HP
 * loss alone earns a small deterministic fracture. Does not touch animations,
 * camera, lights, damage, authority time, scene geometry, or renderer policies.
 */
import {planMeasuredHandTrail,MEASURED_HAND_TRAIL_MAX_FRAME_SECONDS,selectObservedWeaponHandBone,isCurrentMeasuredHandReceipt} from './measured-weapon-trail.js';
import {selectPhysicalWarningMarkers} from './physical-feedback-plan.js';
import {isStaleWardenWarning,shouldRetireWardenWarning,isLiveWardenWarning} from './warden-warning-lifecycle.js';
import {planUnconfirmedFlight} from './unconfirmed-projectile-flight.js';
import {planMapFlightClearance} from './occluded-projectile-path.js';
export const PHYSICAL_FEEDBACK_POOL_LIMITS=Object.freeze({
 trail:8,hit:48,block:8,dust:12,signal:8,projectile:10,spell:8
});
const TOTAL=Object.values(PHYSICAL_FEEDBACK_POOL_LIMITS).reduce((a,b)=>a+b,0);
const COLORS=Object.freeze({
 trail:0xbab8ac,hit:0xc5b19a,block:0xabb3b2,dust:0x746a5e,
 signal:0xa58b70,projectile:0x9b9588,spell:0x857c98
});
const clamp=(n,lo,hi)=>Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):lo;
const cell=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.z)&&
 p.x>=0&&p.z>=0&&p.x<256&&p.z<256;
const finite3=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
/** A short, crossed, tapered ribbon: genuine hand motion defines its pose.
 * The original single XY face vanishes when seen edge-on from a second camera.
 * Two narrow perpendicular faces share ONE geometry and ONE instanced pool:
 * no new draw calls, new meshes, synthetic arc, contact claim, or bone edits.
 */
export function createOriginalBladeStreakGeometry(THREE){
 const vertices=[],indices=[],uvs=[],segments=16;
 for(let plane=0;plane<2;plane++){
  const offset=vertices.length/3;
  for(let i=0;i<=segments;i++){
   const t=i/segments;
   // Two slimmer faces avoid turning the doubled silhouette into a neon bar.
   const width=.003+.019*Math.pow(Math.sin(Math.PI*t),1.5);
   for(const side of [-1,1]){
    vertices.push(plane===0?side*width:0,t-.5,plane===1?side*width:0);
    uvs.push(t,(side+1)/2);
   }
   if(i<segments){
    const k=offset+i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);
   }
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 g.setIndex(indices);g.computeVertexNormals?.();return g;
}
function hash(input){
 let h=0x811c9dc5;
 for(let i=0;i<input.length;i++)h=Math.imul(h^input.charCodeAt(i),0x01000193)>>>0;
 return h>>>0;
}
function spray(id,index){
 const h=hash(`${id}:${index}`),angle=((h%2048)/2048)*Math.PI*2,
 speed=.25+(((h>>>12)%1024)/1024)*.57;
 return {vx:Math.cos(angle)*speed,vz:Math.sin(angle)*speed,
  vy:.23+(((h>>>22)%256)/256)*.49,
  spin:(((h>>>4)%997)/997-.5)*6};
}
export function createPhysicalFeedbackVisuals(THREE,scene,{
 actorById=()=>null,reducedMotion=false,reducedFlash=false,getFloorMap=null,
 getCurrentSnapshot=null
}={}){
 if(!THREE||!scene||typeof scene.add!=='function')return null;
 const pose=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),dir=new THREE.Vector3(),
  sampled=new THREE.Vector3(),sampledBodyLocal=new THREE.Vector3();
 // One retained read-only quaternion scratch, never a per-frame allocation.
 // Minimal/mock actor rigs without the world-rotation API keep old behavior.
 const sampledWristRotation=typeof THREE.Quaternion==='function'?
  new THREE.Quaternion():null;
 // Bounded, scene-owned chronological evidence outlives a 300ms GPU marker.
 // No per-frame allocations, audio nodes or extra visual pools are introduced.
 const MAX_WARNING_HISTORY_OWNERS=8,warningHistory=new Map();
 const warningOwner=cue=>typeof cue?.sceneKey==='string'&&cue.sceneKey.length>0&&
  typeof cue?.actorId==='string'&&cue.actorId.length>0?
  JSON.stringify([cue.sceneKey,cue.actorId]):null;
 function rememberWardenCue(cue){
  const owner=warningOwner(cue);
  if(!owner||!Number.isSafeInteger(cue.tick)||cue.tick<0)return;
  const previous=warningHistory.get(owner)??{lastWarning:null,lastRelease:null};
  let next=previous;
  if(cue.visual==='warning'&&cue.proof==='authority-warning-window')
   next={...previous,lastWarning:cue};
  else if(cue.kind==='warden-release'&&cue.proof==='authority-action'&&
   (!previous.lastRelease||cue.tick>previous.lastRelease.tick))
   next={...previous,lastRelease:cue};
  if(next===previous)return;
  warningHistory.delete(owner);warningHistory.set(owner,next);
  if(warningHistory.size>MAX_WARNING_HISTORY_OWNERS)
   warningHistory.delete(warningHistory.keys().next().value);
 }
 // Bounded D04-only JS matrix-update pressure, not a GPU timer or proof
 // that the WebGL driver uploaded every dirty reserved instance.
 let advanceFrames=0,idleAdvanceSkips=0,lastAdvanceMatrixWrites=0,lastAdvanceDirtyPools=0,
  lastAdvancePotentialBufferBytes=0;
 const lastAdvanceWritesByPool=Object.fromEntries(
  Object.keys(PHYSICAL_FEEDBACK_POOL_LIMITS).map(name=>[name,0]));
 const pools=new Map();let active=0,peak=0,spawned=0,suppressed=0,
  preempted=0,retiredWarningMarkers=0,staleWarningCues=0,retiredInvalidWarnings=0,unanchoredWardenSignals=0,
  retiredUnanchoredBodySignals=0,confirmedFragments=0,measuredTrailFrames=0,
  bodyLocalTrailFrames=0,yawFallbackTrailFrames=0,
  unmeasuredTrailFrames=0,retiredDeadTrails=0,retiredInterruptedTrails=0,occludedFlights=0,blockedFlights=0,
  retiredStaleFrameInstances=0,disposed=false;
 const world=(p,y)=>({x:p.x-9,y,z:p.z-9});
 function hideMatrix(){
  pose.position.set(0,-500,0);pose.rotation.set(0,0,0);
  pose.quaternion.identity();pose.scale.setScalar(.0001);pose.updateMatrix();return pose.matrix;
 }
 function make(name,geometry,matProps={}){
  const max=PHYSICAL_FEEDBACK_POOL_LIMITS[name];
  const Material=['trail','signal','spell'].includes(name)?THREE.MeshBasicMaterial:THREE.MeshStandardMaterial;
  const mat=new Material({color:COLORS[name],metalness:(name==='hit'||name==='block')?.18:0,
   roughness:name==='hit'?.78:.68,transparent:true,opacity:reducedFlash?.22:.38,
   depthWrite:false,depthTest:true,side:THREE.DoubleSide,...matProps});
  const mesh=new THREE.InstancedMesh(geometry,mat,max);
  mesh.frustumCulled=false;mesh.instanceMatrix?.setUsage?.(THREE.DynamicDrawUsage);
  for(let i=0;i<max;i++)mesh.setMatrixAt(i,hideMatrix());
  mesh.instanceMatrix.needsUpdate=true;mesh.visible=false;scene.add(mesh);
  const pool={name,max,slots:Array.from({length:max},()=>null),mesh,geometry,mat};
  pools.set(name,pool);
 }
 make('trail',createOriginalBladeStreakGeometry(THREE),{metalness:0,roughness:1,opacity:reducedFlash?.15:.29});
 make('hit',new THREE.TetrahedronGeometry(.073,0),{metalness:.22,roughness:.8});
 make('block',new THREE.TorusGeometry(.26,.018,4,16,Math.PI*1.5),{metalness:.32,opacity:reducedFlash?.18:.33});
 make('dust',new THREE.TetrahedronGeometry(.072,0),{metalness:0,roughness:1,opacity:reducedFlash?.16:.29});
 make('signal',new THREE.RingGeometry(.25,.285,28),{metalness:0,opacity:reducedFlash?.14:.22});
 make('projectile',new THREE.CylinderGeometry(.002,.024,.43,5),{metalness:.25,roughness:.73});
 make('spell',new THREE.IcosahedronGeometry(.09,0),{metalness:0,opacity:reducedFlash?.17:.31});
 // Rig sampling is read-only. Stale animated bodies are not used as evidence
 // to attach a weapon to a different map cell or floor.
 function sampleActor(id,at,{hand=false,chest=false,requireBone=false}={}){
  if(typeof id!=='string'||!cell(at)||typeof actorById!=='function')return null;
  let actor=null;
  try{actor=actorById(id)}catch{return null}
  if(!actor||actor.u?.id!==id||!actor.root?.visible||!finite3(actor.root.position))return null;
  const root=actor.root.position;
  if(Math.hypot(root.x-(at.x-9),root.z-(at.z-9))>.58)return null;
  const bone=hand&&actor.authored?selectObservedWeaponHandBone(actor):
   chest&&actor.authored&&actor.assetRoot?
    actor.rigMeleeBones?.find(b=>b?.part==='spine'&&b?.bone?.isBone===true)?.bone:null;
  if(bone){
   try{
    bone.updateWorldMatrix?.(true,false);bone.getWorldPosition(sampled);
    const bound=hand?2.8:3.1;
    if(finite3(sampled)&&sampled.y>=.34&&sampled.y<=bound&&
      Math.hypot(sampled.x-root.x,sampled.z-root.z)<=(hand?.84:.72))
     {
      const point={x:sampled.x,y:sampled.y,z:sampled.z,yaw:actor.root.rotation?.y??0,
       rootX:root.x,rootY:root.y,rootZ:root.z};
      // Transient reference, retained only by this D04 trail slot. No rig edit.
      if(requireBone)point.sourceBone=bone;
      // The genuine GLB can lean/pitch/recoil on ancestor presentation
      // pivots while this local wrist is planted. A WORLD displacement
      // from that body motion must not become a fake sword stroke/whoosh.
      // Read authored local joint position against the existing assetRoot;
      // never add a mesh, invent a socket or mutate animation authority.
      // Keep one retained Vector3 scratch and reference the already-updated
      // Matrix4 elements; no per-frame matrices or geometry are allocated.
      if(hand&&requireBone&&
       typeof actor.assetRoot?.worldToLocal==='function'){
       point.sourceBodyRoot=actor.assetRoot;
       try{
        actor.assetRoot.updateWorldMatrix?.(true,false);
        sampledBodyLocal.set(sampled.x,sampled.y,sampled.z);
        actor.assetRoot.worldToLocal(sampledBodyLocal);
        const m=actor.assetRoot.matrixWorld?.elements;
        let affine=m?.length===16;
        if(affine){
         for(let i=0;i<16;i++)if(!Number.isFinite(m[i])){affine=false;break}
         affine=affine&&Math.abs(m[3])<=1e-6&&
          Math.abs(m[7])<=1e-6&&Math.abs(m[11])<=1e-6&&
          Math.abs(m[15]-1)<=1e-6;
        }
        if(finite3(sampledBodyLocal)&&affine){
         point.localX=sampledBodyLocal.x;
         point.localY=sampledBodyLocal.y;
         point.localZ=sampledBodyLocal.z;
         // Keep the existing immediate-planning matrix reference but
         // snapshot the affine coefficients in the transient pose record.
         // No new Matrix4/Vector3, geometry, audio voice or visual pool.
         point.poseFrameMatrix=m;
         point.bodyM0=m[0];point.bodyM1=m[1];point.bodyM2=m[2];
         point.bodyM4=m[4];point.bodyM5=m[5];point.bodyM6=m[6];
         point.bodyM8=m[8];point.bodyM9=m[9];point.bodyM10=m[10];
         point.bodyM12=m[12];point.bodyM13=m[13];point.bodyM14=m[14];
        }
       }catch{} // Present but unverifiable body transforms fail closed.
      }
      if(hand&&sampledWristRotation&&typeof bone.getWorldQuaternion==='function'){
       try{
        bone.getWorldQuaternion(sampledWristRotation);
        const q=sampledWristRotation;
        if(Number.isFinite(q.x)&&Number.isFinite(q.y)&&
          Number.isFinite(q.z)&&Number.isFinite(q.w)){
         // Fold the witness into the point already allocated for this sample.
         // Never retain a mutable Quaternion or allocate another pose object.
         point.wristQx=q.x;point.wristQy=q.y;
         point.wristQz=q.z;point.wristQw=q.w;
        }
       }catch{} // A missing pose is never invented from the actor's root.
      }
      return point;
     }
   }catch{}
  }
  if(requireBone)return null; // Never counterfeit a moving sword hand from a static root.
  return {x:root.x,y:root.y+(hand?1.20:chest?1.12:1.00),
   z:root.z,yaw:actor.root.rotation?.y??0};
 }
 // A genuine adjacent-tick HP drop may be observed before the visual
 // interpolation finishes moving its already identified victim to the
 // authoritative tile. The usual strict .58m anchor rejects such a body,
 // then refuses a detached cell fallback because the actor exists.
 // Admit a small ROOT-local correction only while the CURRENT public body
 // itself still proves identity, HP, cell, tick and scene. No attacker,
 // contact direction, wound geometry or future state is inferred.
 function sampleInterpolatedHPVictim(cue,at,actor){
  if(typeof getCurrentSnapshot!=='function'||!actor?.root?.visible||
   !finite3(actor.root.position))return null;
  let latest=null;
  try{latest=getCurrentSnapshot()}catch{return null}
  if(!latest||latest.tick!==cue.tick||
   latest.run+':'+latest.floor!==cue.sceneKey||
   !Array.isArray(latest.units))return null;
  let witness=null;
  for(let i=0;i<Math.min(latest.units.length,256);i++){
   const u=latest.units[i];
   if(u?.id!==cue.targetId)continue;
   if(witness)return null; // ambiguous public IDs cannot choose a body
   witness=u;
  }
  const u=actor.u;
  if(!witness||!u||u.id!==cue.targetId||
   u.x!==at.x||u.z!==at.z||witness.x!==at.x||witness.z!==at.z||
   !Number.isInteger(witness.hp)||witness.hp<0||
   u.hp!==witness.hp||u.kind!==witness.kind||
   u.faction!==witness.faction)return null;
  const p=actor.root.position;
  // Less than one tile: an interpolating body, not an actor stranded in
  // another cell or recycled after floor teardown. Keep chips on the drawn
  // root instead of creating an empty-cell contact at the destination.
  if(Math.hypot(p.x-(at.x-9),p.z-(at.z-9))>.96||
   Math.abs(p.y)>0.75)return null;
  return {x:p.x,y:p.y+1.12,z:p.z,yaw:actor.root.rotation?.y??0};
 }
 function anchor(cue,type){
  if(type==='dust')return cell(cue.from)?world(cue.from,.07):null;
  const victim=type==='hit';
  // A genuine counter never discloses the source combatant. It DOES contain
  // an HP-confirmed Warden victim; place the reaction on that body rather
  // than demanding a fictitious actorId or silently losing the visual.
  const earnedCounter=type==='signal'&&cue.kind==='counter'&&
   cue.proof==='authority-counter-and-HP';
  const at=victim||earnedCounter?cue.to:cue.from;
  if(!cell(at))return null;
  const id=victim||earnedCounter?cue.targetId:cue.actorId;
  // An observed wound is still a real wound when the art asset has not loaded;
  // show a neutral body-height shard at the authoritative cell instead.
  let actor=null;
  try{actor=typeof actorById==='function'?actorById(id):null}catch{}
  // Release/recovery are BODY signals, not floor hazards. A missing model,
  // idle pose or another tick's cast cannot be used to localize this beat.
  // Actual danger warnings still use independently witnessed floor cells.
  const wardenBodySignal=type==='signal'&&
   (cue.kind==='warden-release'||cue.kind==='opening');
  if(wardenBodySignal&&(!actor||actor.u?.id!==id||
    actor.u?.kind!=='warden'||actor.u?.action!=='cast'||
    actor.u?.actionTick!==cue.tick||
    Number.isFinite(actor.u?.hp)&&actor.u.hp<=0))return null;
  // Guarding and utility casting are body-local GESTURES, not floor
  // hazards. A previously observed action does not authorize a ring after
  // its actor has disappeared, died, or changed pose/tick. Unlike an HP
  // reaction, these have no independently witnessed contact at an empty cell.
  // Preserve their genuine action sound behind the normal frame gate, but
  // never manufacture a visual emitter on a root-height approximation.
  const actionBoundSignal=type==='signal'&&
   (cue.kind==='guard'||cue.kind==='cast-utility');
  if(actionBoundSignal){
   const u=actor?.u;
   const actionMatches=cue.kind==='guard'?u?.action==='guard':
    (u?.kind==='mystic'||u?.kind==='ranger')&&
    (u?.action==='attack'||u?.action==='cast');
   if(cue.proof!=='authority-action'||u?.id!==id||
    !Number.isFinite(u.hp)||u.hp<=0||u.actionTick!==cue.tick||
    !actionMatches)return null;
  }
  // A delayed arrow or spell release is an observed ACTION, not a target
  // coordinate that grants permission to spawn a missile. On a slow frame the
  // actor may have gone idle, switched actions, died or been unloaded before
  // its 210/290ms visual admission. Require the actual visible release pose
  // at that authority tick; never launch from a remembered empty grid cell.
  // Once admitted, a projectile is independent of later caster animation.
  const kineticRelease=type==='projectile'||type==='spell';
  if(kineticRelease&&typeof getCurrentSnapshot==='function'){
   // A retained actor.u/render rig may lag public authority by a tick.
   // Neither an old firing pose nor a remembered target authorizes a
   // fresh missile or delayed foley. Match the planner's 96-unit bound
   // and demand ONE live source at the original action tick and cell.
   let current=null;
   try{current=getCurrentSnapshot()}catch{return null}
   if(!current||!Number.isSafeInteger(current.tick)||current.tick!==cue.tick||
     !Number.isSafeInteger(current.run)||!Number.isSafeInteger(current.floor)||
     current.run+':'+current.floor!==cue.sceneKey||
     !Array.isArray(current.units))return null;
   let source=null;
   for(let i=0;i<Math.min(current.units.length,96);i++){
    const candidate=current.units[i];
    if(candidate?.id!==id)continue;
    if(source)return null; // Ambiguous identities cannot choose a muzzle.
    source=candidate;
   }
   const drawn=actor?.u;
   const action=type==='projectile'?'attack':'cast';
   if(!source||!drawn||source.id!==id||
     !Number.isInteger(source.hp)||source.hp<=0||
     source.kind!==drawn.kind||source.faction!==drawn.faction||
     source.hp!==drawn.hp||source.x!==at.x||source.z!==at.z||
     drawn.x!==source.x||drawn.z!==source.z||
     source.action!==action||source.actionTick!==cue.tick)return null;
  }
  if(kineticRelease){
   const u=actor?.u;
   const releasePose=type==='projectile'?
    cue.kind==='ranged-release'&&u?.kind==='ranger'&&u?.action==='attack':
    cue.kind==='spell-release'&&
     (u?.kind==='mystic'||u?.kind==='cultist')&&u?.action==='cast';
   if(!releasePose||u?.id!==id||u?.actionTick!==cue.tick||
    (Number.isFinite(u?.hp)&&u.hp<=0))return null;
  }
  // A witnessed recovery is a TIME-BOUNDED vulnerability, not a permanent
  // property of a lingering cast pose. Retire its body ring as soon as the
  // current public authority seals the Warden or ends that recovery window.
  // The getter reads the controller's latest snapshot; no gameplay mutation.
  if(cue.kind==='opening'&&typeof getCurrentSnapshot==='function'){
   let current=null;
   try{current=getCurrentSnapshot()}catch{return null}
   if(!current||!Number.isSafeInteger(current.tick)||
     `${current.run}:${current.floor}`!==cue.sceneKey||
     !Number.isSafeInteger(actor.u.recoveryUntilTick)||
     current.tick>actor.u.recoveryUntilTick||current.guardianWard===true||
     Object.hasOwn(current,'bossRecovery')&&
       (!current.bossRecovery||!Number.isInteger(current.bossRecovery.remaining)||
        current.bossRecovery.remaining<=0))return null;
  }
  // The sword streak must come from the current actually animated right-hand
  // bone on this witnessed swing. An idle or stale reused actor is not a blade.
  // An attack action/tick can survive briefly on an actor whose authoritative
  // health has already reached zero. A dead body's moving wrist is no longer
  // an active sword attempt: never admit a new trail or a delayed whoosh.
  if(type==='trail'&&(!actor?.authored||actor.u?.action!=='attack'||
    actor.u?.actionTick!==cue.tick||
    Number.isFinite(actor.u?.hp)&&actor.u.hp<=0||
    !selectObservedWeaponHandBone(actor)))return null;
  // Authored ranger/caster models supply a genuine skinned hand. An invalid,
  // missing or detached joint must NOT quietly become a static actor-root
  // muzzle. Explicitly procedural fallback bodies keep their existing
  // approximate source pose; neither representation proves a target impact.
  const requireObservedEmitter=kineticRelease&&actor?.authored===true;
  // These are body-local authored Warden signals, not floor warnings.
  // Tie the release ring to the EXISTING animated sword wrist and the
  // recovery ring to the EXISTING spine, never to a fictitious root-height
  // socket. A missing/unloaded/implausible bone suppresses the glyph; the
  // independently witnessed public event remains an action, not contact.
  // Procedural fallback figures retain their earlier approximate anchor.
  const requireWardenBone=wardenBodySignal&&actor?.authored===true;
  const wardenHand=requireWardenBone&&cue.kind==='warden-release';
  const wardenChest=requireWardenBone&&cue.kind==='opening';
  const sampledPoint=sampleActor(id,at,{
   hand:type==='trail'||kineticRelease||wardenHand,
   chest:victim||wardenChest,
   requireBone:type==='trail'||requireObservedEmitter||requireWardenBone});
  if(sampledPoint){
    // Even a perfectly positioned, drawable character can be an OLD rig
    // from a subsequent authority tick, or retain stale actor.u HP while the
    // public victim has changed. The interpolated and unloaded HP paths
    // already revalidate the current unique public victim; the direct
    // skinned-body fast path must not bypass that same causality boundary.
    // This is one bounded read per admitted HP cue, never a per-frame scan.
    if(victim&&typeof getCurrentSnapshot==='function'){
      let latest=null;
      try{latest=getCurrentSnapshot()}catch{return null}
      if(!latest||!Number.isSafeInteger(latest.tick)||latest.tick!==cue.tick||
        !Number.isSafeInteger(latest.run)||!Number.isSafeInteger(latest.floor)||
        latest.run+':'+latest.floor!==cue.sceneKey||
        !Array.isArray(latest.units))return null;
      let witness=null;
      for(let i=0;i<Math.min(latest.units.length,256);i++){
        const u=latest.units[i];
        if(u?.id!==cue.targetId)continue;
        if(witness)return null; // duplicate identities cannot choose a body
        witness=u;
      }
      const u=actor?.u;
      if(!witness||!cell(witness)||witness.x!==at.x||witness.z!==at.z||
        !Number.isInteger(witness.hp)||witness.hp<0||
        u?.id!==cue.targetId||u.x!==witness.x||u.z!==witness.z||
        u.hp!==witness.hp||u.kind!==witness.kind||
        u.faction!==witness.faction)return null;
    }
    return sampledPoint;
  }
  if(victim&&actor){
   const observed=sampleInterpolatedHPVictim(cue,at,actor);
   if(observed)return observed;
  }
  // A stale or invisible body never falls back to a fake floor-height
  // release/recovery ring, even though the authority proved the event.
  if(type==='trail'||wardenBodySignal)return null;
  if(actor)return null; // Stale/wrong-cell actor: suppress disconnected art.
  // A model that has not loaded is not permission to attach HP chips to
  // yesterday's empty tile. The planner observed a real HP drop, but the
  // live spectator must still independently witness this exact victim,
  // run, floor, tick and public cell before placing fallback injury art.
  // The injected no-snapshot preview harness retains its trusted-cue API.
  if(victim){
   if(typeof getCurrentSnapshot==='function'){
    let latest=null;
    try{latest=getCurrentSnapshot()}catch{return null}
    if(!latest||!Number.isSafeInteger(latest.tick)||latest.tick!==cue.tick||
     !Number.isSafeInteger(latest.run)||!Number.isSafeInteger(latest.floor)||
     latest.run+':'+latest.floor!==cue.sceneKey||
     !Array.isArray(latest.units))return null;
    let witness=null;
    for(let i=0;i<Math.min(latest.units.length,256);i++){
     const u=latest.units[i];
     if(u?.id!==cue.targetId)continue;
     if(witness)return null; // An ambiguous public ID has no safe tile.
     witness=u;
    }
    if(!witness||!cell(witness)||witness.x!==at.x||witness.z!==at.z||
     !Number.isInteger(witness.hp)||witness.hp<0)return null;
   }
   return world(at,1.07);
  }
  // Other neutral utility cues may use their known public world cell;
  // Warden release/recovery already returned above without a real body.
  // Unidentified events never get a fabricated world point.
  return typeof id==='string'?world(at,type==='signal'?.08:1.10):null;
 }
 // The effect may outlive an interrupted or completed public tell. A valid
 // submitted frame alone cannot certify that an old floor cell is dangerous.
 // Without a snapshot adapter, retain earlier injected-renderer behavior.
 function warningStillLive(cue){
  if(typeof getCurrentSnapshot!=='function')return true;
  let latest=null;
  try{latest=getCurrentSnapshot()}catch{return false}
  return isLiveWardenWarning(cue,latest);
 }
 // Block and evade art are transient, BODY-LOCAL public observations. A
 // delayed frame cannot revive their 11th-tick motion on a 12th-tick pose.
 // The planner has already proved unique HP-loss guarding / one-cell escape;
 // here we only revalidate that the *same* public actor, cell and action
 // remain drawable at the release tick. No event text or attacker is parsed.
 // Injected test stages without a public snapshot getter preserve the
 // established trusted-cue contract; the live Dungeon always supplies one.
 function transientBodyStillWitnessed(cue,type){
  if(typeof getCurrentSnapshot!=='function')return true;
  let latest=null;
  try{latest=getCurrentSnapshot()}catch{return false}
  if(!latest||!Number.isSafeInteger(latest.tick)||latest.tick!==cue.tick||
    !Number.isSafeInteger(latest.run)||!Number.isSafeInteger(latest.floor)||
    latest.run+':'+latest.floor!==cue.sceneKey||
    !Array.isArray(latest.units))return false;
  let witness=null;
  // Only the 96-unit public ACTION window can authorize these effects.
  // Duplicate IDs cannot justify choosing an arbitrary defending body.
  for(let i=0;i<Math.min(latest.units.length,96);i++){
   const u=latest.units[i];
   if(u?.id!==cue.actorId)continue;
   if(witness)return false;
   witness=u;
  }
  if(!witness||witness.faction!=='party'||!cell(witness)||
    !Number.isInteger(witness.hp)||witness.hp<0)return false;
  if(type==='block')
   return witness.action==='guard'&&witness.actionTick===cue.tick&&
    witness.guardTick===cue.tick&&witness.x===cue.from.x&&
    witness.z===cue.from.z;
  return witness.hp>0&&witness.action==='move'&&
   witness.actionTick===cue.tick&&witness.x===cue.to.x&&
   witness.z===cue.to.z;
 }
 function allocate(pool,priority){
  let index=pool.slots.findIndex(x=>x===null);
  if(index>=0)return index;
  // A Warden floor marker names an authoritative, CURRENT danger cell.
  // Pool priority alone must not let a transient body ring erase one of
  // eight live threatened tiles. The legitimate matching release explicitly
  // closes spent warnings before allocation; stale warnings may be displaced.
  // Check only on saturation (eight fixed signal slots), never every frame.
  let least=-1;
  for(let i=0;i<pool.max;i++){
   const slot=pool.slots[i];
   if(pool.name==='signal'&&slot?.cue?.visual==='warning'&&
    warningStillLive(slot.cue))continue;
   if(least<0||slot.priority<pool.slots[least].priority)least=i;
  }
  if(least<0||pool.slots[least].priority>=priority)return -1;
  preempted++;return least;
 }
 // The lower-priority Warden release must not be hidden by eight older
 // final-warning slots. Retire only authoritative warning art in this scene;
 // preserve other signal cues, their matrices, and the fixed resource budget.
 function retireWarningMarkers(incomingCue){
  const pool=pools.get('signal');let retired=0;
  if(!pool||!incomingCue)return 0;
  for(let i=0;i<pool.max;i++){
   const slot=pool.slots[i];
   if(!shouldRetireWardenWarning(slot?.cue,incomingCue))continue;
   pool.slots[i]=null;pool.mesh.setMatrixAt(i,hideMatrix());active--;retired++;
  }
  if(retired){
   retiredWarningMarkers+=retired;
   pool.mesh.instanceMatrix.needsUpdate=true;
   pool.mesh.visible=pool.slots.some(Boolean);
  }
  return retired;
 }
 function category(cue){
  switch(cue?.visual){
   case 'trail':return 'trail';
   case 'hit':return 'hit';
   case 'block':return 'block';
   case 'evade':return 'dust';
   case 'launch':return 'projectile';
   case 'cast':return 'spell';
   case 'warning':case 'counter':case 'opening':case 'warden':case 'utility':return 'signal';
   default:return null;
  }
 }
 function emit(cue){
  if(disposed||!cue||cue.verified===false)return false;
  const type=category(cue),pool=pools.get(type);
  if(!pool)return false;
  // A nominally verified cue from an adapter is NOT interchangeable with
  // the planner's concrete injury/release contract. In particular, an HP
  // witness cannot manufacture a fresh arrow or spell, and an attempted
  // swing cannot masquerade as a localized victim injury. The ordinary
  // renderer trusts the read-only planner; this second ingress guard
  // prevents mixed/invalid cue families from minting physical art.
  if(type==='hit'&&(
   !['damage','damage-fatal'].includes(cue.kind)||
   cue.proof!=='observed-hp-drop'||
   typeof cue.targetId!=='string'||cue.targetId.length===0||
   !cell(cue.to)))return false;
  if(type==='trail'&&(cue.kind!=='swing'||cue.proof!=='authority-attempt-not-hit'))return false;
  if(cue.kind==='counter'&&cue.proof!=='authority-counter-and-HP')return false;
  // A public block event alone has no known defending body or attacker.
  // Only the planner's unique same-tick guard plus HP-loss witness may
  // draw localized shield contact; actorId is a defender, never a guessed foe.
  if(type==='block'&&(cue.kind!=='block'||
   cue.proof!=='authority-block-unique-guarded-hp'||cue.verified!==true||
   typeof cue.actorId!=='string'||cue.actorId.length===0||
   !cell(cue.from)))return false;
  if(type==='projectile'&&
   (cue.kind!=='ranged-release'||cue.proof!=='authority-action'))return false;
  if(type==='spell'&&
   (cue.kind!=='spell-release'||cue.proof!=='authority-action'))return false;
  if((type==='projectile'||type==='spell')&&
   (typeof cue.targetId!=='string'||cue.targetId.length===0||
    !cell(cue.to)))return false;
  // The public "evade" event can also describe a spell hitting empty stone.
  // Adjacent coordinates are insufficient: grit needs the planner's unique
  // witnessed evader and legal one-cell step, never inferred attacker/contact.
  if(type==='dust'&&(cue.kind!=='evade'||
   cue.proof!=='authority-event-and-observed-step'||cue.verified!==true||
   typeof cue.actorId!=='string'||cue.actorId.length===0||
   !cell(cue.from)||!cell(cue.to)||
   Math.abs(cue.to.x-cue.from.x)+Math.abs(cue.to.z-cue.from.z)!==1))return false;
  // Real moving Dungeon frames may arrive after the guard or sidestep
  // has ended. Never attach yesterday's dust/shield to an unrelated pose.
  if((type==='block'||type==='dust')&&
   !transientBodyStillWitnessed(cue,type))return false;
  if(reducedMotion&&['trail','dust'].includes(type))return false;
  // The boss cell is NOT the strike footprint. Ground markers may only
  // occupy the actual public danger cells, never an inferred radial zone.
  // Reject a missing/forged footprint instead of drawing a false boss ring.
  const warningMarkers=cue.visual==='warning'?
   (cue.proof==='authority-warning-window'?
    selectPhysicalWarningMarkers(cue.detail?.cells):[]):null;
  if(warningMarkers&&warningMarkers.length===0){suppressed++;return false}
  // Delayed visual admission must not resurrect a cancelled warning.
  if(warningMarkers&&!warningStillLive(cue)){suppressed++;return false}
  // An authentic release closes its spent danger window even if a stale
  // actor root cannot anchor the body glyph. Danger-cell chronology is
  // authority evidence, not a consequence of successfully drawing that glyph.
  const witnessedRelease=cue.kind==='warden-release'&&
   cue.proof==='authority-action'&&cue.verified===true&&
   Number.isSafeInteger(cue.tick)&&cue.tick>=0&&
   typeof cue.sceneKey==='string'&&cue.sceneKey.length>0&&
   typeof cue.actorId==='string'&&cue.actorId.length>0&&cell(cue.from);
  if(warningMarkers&&isStaleWardenWarning(cue,pools.get('signal')?.slots,
   warningHistory.get(warningOwner(cue)))){
   suppressed++;staleWarningCues++;return false;
  }
  // Retire only older warnings owned by the attack/scene, preserving new
  // danger and unrelated signals. Even an unanchorable release closes the
  // bounded chronology, so delayed spent tells cannot reappear.
  if(warningMarkers||witnessedRelease)retireWarningMarkers(cue);
  if(witnessedRelease)rememberWardenCue(cue);
  const start=warningMarkers?world(warningMarkers[0],.075):anchor(cue,type);
  if(!start){
   suppressed++;
   if(type==='signal'&&(cue.kind==='warden-release'||cue.kind==='opening'))
    unanchoredWardenSignals++;
   return false;
  }
  // An aimed target is NOT proof the missile connected. Shorten the rendered
  // flight so an unconfirmed projectile never pierces a target body volume.
  const flightDestination=(type==='projectile'||type==='spell')&&cell(cue.to)?
   world(cue.to,type==='spell'?1.23:1.19):null;
  const flightProbe=flightDestination?planUnconfirmedFlight(start,flightDestination,0):null;
  if((type==='projectile'||type==='spell')&&!flightProbe){suppressed++;return false}
  // Preview-only authoritative masonry clip. An actor target proves intent,
  // not a physically unobstructed flight from the ACTUAL animated hand.
  // Resolve this once at emission; never raymarch per animation frame.
  let limitedFlight=flightProbe?{fraction:1,travelMeters:flightProbe.travelMeters,clipped:false}:null;
  if(flightProbe&&typeof getFloorMap==='function'){
   let map=null;
   try{map=getFloorMap()}catch{}
   const terminal=planUnconfirmedFlight(start,flightDestination,1)?.position;
   limitedFlight=terminal?planMapFlightClearance(start,terminal,map,type):null;
   // Invalid map, adjacent wall, and off-floor hand all suppress the
   // rendered projectile; the authentic release remains sound-only.
   if(!limitedFlight){suppressed++;blockedFlights++;return false}
   if(limitedFlight.clipped)occludedFlights++;
  }
  const n=warningMarkers?warningMarkers.length:
    type==='hit'?Math.max(4,Math.min(6,4+Math.floor(clamp(cue.severity,0,1)*2))):
    type==='dust'?2:1;
  const length=clamp(cue.duration,.10,.70),severity=clamp(cue.severity,0,1);
  // Keep the arrow kinetic at short ranges without inventing an impact frame.
  const flightLife=limitedFlight?clamp(limitedFlight.travelMeters/(type==='projectile'?7:6),
   type==='projectile'?.10:.16,type==='projectile'?.30:.31):length;
  let created=0;
  for(let i=0;i<n;i++){
   const index=allocate(pool,clamp(cue.priority,0,10));
   if(index<0){suppressed++;break}
   // A vacant trail slot was already hidden at construction or retirement.
   // An actual wrist passage will set its matrix during advance(). Do not
   // upload a full reserved trail buffer just to re-hide an unmeasured swing.
   // Occupied/preempted slots MUST still be hidden now: the prior ribbon may
   // have been visible when a higher-priority attempt replaced it.
   const displacedOccupied=pool.slots[index]!==null;
   if(!displacedOccupied)active++;
   const speed=type==='hit'||type==='dust'?spray(cue.id,i):null;
   pool.slots[index]={cue,age:0,life:reducedMotion?Math.min(.13,flightLife):flightLife,
    origin:warningMarkers?world(warningMarkers[i],.075):{...start},
    end:flightDestination??(cell(cue.to)?world(cue.to,type==='spell'?1.23:1.19):null),
    priority:cue.priority??1,severity,fragment:speed,index,ordinal:i,
    flightFraction:limitedFlight?.fraction??1,
    lastHand:type==='trail'?{...start}:null,
    measuredPath:null,lastMeasuredAge:-Infinity,lastMeasuredSpeed:0,
    // The emission matrix is already hidden. Do not dirty its GPU pool
    // again until a REAL measured wrist passage needs a visible matrix.
    matrixHidden:type==='trail'};
   // A new visible instance needs a posed GPU matrix before the first actual
   // render. Otherwise the audio receipt might refer to a hidden setup slot.
   // A trail still uses hideMatrix() until genuine new wrist travel is sampled.
   if(type!=='trail'||displacedOccupied){
    pool.mesh.setMatrixAt(index,transform(pool,pool.slots[index]));
    pool.mesh.instanceMatrix.needsUpdate=true;
   }
   // A new trail remains hidden until its OWN skinned wrist passage.
   // When queue priority preempts the only measured ribbon, the previous
   // mesh.visible flag must not survive with all eight new slots hidden.
   // Otherwise WebGL repeatedly submits an empty trail draw until expiration.
   // Recheck only on a displaced trail (8 fixed slots), never every idle frame.
   if(type!=='trail')pool.mesh.visible=true;
   else if(displacedOccupied)
    pool.mesh.visible=pool.slots.some(slot=>slot!==null&&
     slot.age<slot.life&&slot.measuredPath!==null);
   created++;spawned++;
  }
  if(type==='hit')confirmedFragments+=created;
  if(warningMarkers&&created>0)rememberWardenCue(cue);
  peak=Math.max(peak,active);
  return created>0;
 }
 function transform(pool,slot){
  const {cue,origin}=slot,t=clamp(slot.age/slot.life,0,1),fade=1-t;
  pose.position.set(origin.x,origin.y,origin.z);pose.rotation.set(0,0,0);
  pose.quaternion.identity();
  const p=pool.name;
  if(p==='trail'){
   if(!slot.measuredPath)return hideMatrix();
   const measured=slot.measuredPath;
   pose.position.set(measured.center.x,measured.center.y,measured.center.z);
   dir.set(measured.direction.x,measured.direction.y,measured.direction.z);
   pose.quaternion.setFromUnitVectors(up,dir.normalize());
   pose.scale.set(.82*fade+.01,measured.length*(.65*fade+.34),.82);
  }else if(p==='hit'||p==='dust'){
   // Stable ballistic micro-fragments; gravity and tumble stay cosmetic.
   // An unknown source never becomes a flying sword or fake attack direction.
   const f=slot.fragment;
   pose.position.set(origin.x+f.vx*slot.age,
    origin.y+f.vy*slot.age-1.45*slot.age*slot.age,
    origin.z+f.vz*slot.age);
   pose.rotation.set(f.spin*slot.age,f.spin*slot.age*.6,-f.spin*slot.age*.36);
   const initial=p==='dust'?.30:.60+slot.severity*.29;
   pose.scale.setScalar(Math.max(.0001,initial*Math.pow(fade,1.25)));
  }else if(p==='projectile'||p==='spell'){
   const end=slot.end;
   const flight=end?planUnconfirmedFlight(origin,end,t*slot.flightFraction):null;
   if(!flight)return hideMatrix();
   pose.position.set(flight.position.x,flight.position.y,flight.position.z);
   // Cosmetic flight lift never claims a collision or an actor's damage.
   pose.position.y+=(p==='spell'?.11:.035)*Math.sin(Math.PI*t);
   dir.set(flight.direction.x,flight.direction.y,flight.direction.z);
   pose.quaternion.setFromUnitVectors(up,dir);
   // The projectile dissipates in open air before the target clearance shell.
   pose.scale.setScalar((p==='spell'?.78:1.0)*Math.max(.0001,fade*.84));
  }else if(p==='block'){
   pose.rotation.y=origin.yaw??0;
   pose.rotation.z=-.15+t*.35;
   pose.scale.setScalar((.72+.35*t)*fade+.006);
  }else if(p==='signal'){
   if(cue.visual==='warning'){
    // Only confirmed danger cells are horizontal floor markers.
    pose.rotation.x=-Math.PI/2;
    pose.position.y=.075;
    pose.scale.setScalar((.8+.38*t)*fade+.007);
   }else{
    // Released strikes, recovery openings, earned counters and utility
    // signals are actor-local physical beats, not extra floor hazards.
    // The retained RingGeometry lies in a vertical XY plane by default.
    // Preserve the witnessed root/chest height and actor heading instead
    // of throwing those measurements away to draw a false ground ring.
    pose.rotation.y=origin.yaw??0;
    pose.position.y=origin.y;
    const onset=cue.kind==='warden-release'?.90:
     cue.kind==='opening'?1.08:cue.kind==='counter'?.68:.66;
    const growth=cue.kind==='warden-release'?.75:
     cue.kind==='opening'?-.28:cue.kind==='counter'?.80:.24;
    pose.scale.setScalar((onset+growth*t)*fade+.007);
   }
  }
  pose.updateMatrix();return pose.matrix;
 }
 function advance(frameSeconds,actualFrameSeconds=frameSeconds){
  if(disposed)return;
  // Every retained matrix is hidden when its last occupied slot retires.
  // Empty D04 effects are common between fights; avoid scanning all 102
  // reserved instance slots each idle frame without changing any live
  // Warden hazard, measurement, visual lifetime or WebGL submission.
  if(active===0){
   lastAdvanceMatrixWrites=0;lastAdvanceDirtyPools=0;
   lastAdvancePotentialBufferBytes=0;
   for(const name of Object.keys(lastAdvanceWritesByPool))
    lastAdvanceWritesByPool[name]=0;
   advanceFrames=Math.min(Number.MAX_SAFE_INTEGER,advanceFrames+1);
   idleAdvanceSkips=Math.min(Number.MAX_SAFE_INTEGER,idleAdvanceSkips+1);
   return;
  }
  const dt=clamp(frameSeconds,0,.05);
  let frameMatrixWrites=0,dirtyPoolCount=0,potentialBufferBytes=0;
  // Authoritative pose dt is deliberately clamped, but VFX lifetime must
  // follow the ACTUAL browser interval. Otherwise a 720ms blocked WebGL
  // submit leaves ancient arrows/debris drifting through the next scene.
  // Every admitted visual duration is <= .70s; invalid frame evidence expires
  // existing effects instead of certifying uninterrupted motion.
  const observedAge=Number.isFinite(actualFrameSeconds)&&actualFrameSeconds>0?
   Math.max(dt,Math.min(actualFrameSeconds,.70)):.70;
  for(const pool of pools.values()){
   let dirty=false,visibleSlots=0,poolWrites=0;
   let checkedWarningCue=null,checkedWarningLive=false;
   for(let i=0;i<pool.max;i++){
    const slot=pool.slots[i];if(!slot)continue;
    // A Warden's LIVE public danger window is not a 300ms decorative spark.
    // A slow WebGL submission must not silently erase true threatened cells
    // while authority still reports the EXACT attack tick and footprint.
    // Only a fresh authoritative snapshot may extend the visible lifetime:
    // legacy injected adapters retain their old, strictly finite recipe.
    const authoritativeWarning=pool.name==='signal'&&
     slot.cue.visual==='warning'&&typeof getCurrentSnapshot==='function';
    if(authoritativeWarning){
     // Check once per retained cue group (at most 8 signal instances).
     if(slot.cue!==checkedWarningCue){
      checkedWarningCue=slot.cue;
      checkedWarningLive=warningStillLive(slot.cue);
     }
     if(!checkedWarningLive){
      pool.slots[i]=null;pool.mesh.setMatrixAt(i,hideMatrix());frameMatrixWrites++;poolWrites++;
      active--;retiredInvalidWarnings++;dirty=true;continue;
     }
     // Freeze at a restrained, readable mid-beat: resetting to zero each
     // frame would strobe; aging beyond the recipe would hide true danger.
     // This never extends the cue's foley deadline or fabricates an attack.
     const priorWarningAge=slot.age;
     slot.age=Math.min(slot.age+observedAge,slot.life*.35);
     if(slot.age===priorWarningAge){
      // The still-authoritative danger cell has reached its stationary
      // mid-beat. Its origin, scale and rotation are already in the retained
      // instance buffer. Do not rewrite/reupload the same matrix on every
      // live browser frame: visibility and full authority proof are still
      // checked above. A new/revoked warning and all other combat VFX retain
      // their original dirty-update behavior.
      visibleSlots++;
      continue;
     }
    }else slot.age+=observedAge;
    // Most animated pools update every active frame. An unmeasured blade
    // already has a hidden emission matrix; its silence must not consume a
    // GPU buffer update merely because its bounded lifetime advances.
    if(pool.name!=='trail')dirty=true;
    if(slot.age>=slot.life){
     pool.slots[i]=null;pool.mesh.setMatrixAt(i,hideMatrix());frameMatrixWrites++;poolWrites++;active--;dirty=true;continue;
    }
    if(pool.name==='signal'&&
      (slot.cue.kind==='warden-release'||slot.cue.kind==='opening'||
       slot.cue.kind==='guard'||slot.cue.kind==='cast-utility')){
     // Strike, recovery, guard and utility rings must follow their observed
     // living action performer, not freeze at a past body position. An
     // unloaded, dead, moved or stale-pose actor retires the physical glyph
     // before the next WebGL submission. Independently verified floor danger
     // warnings and HP-loss effects retain their existing separate policy.
     const observed=anchor(slot.cue,'signal');
     if(!observed){
      pool.slots[i]=null;pool.mesh.setMatrixAt(i,hideMatrix());frameMatrixWrites++;poolWrites++;
      // Upload the hidden retained matrix before any later WebGL submission.
      // Without a dirty flag, an interrupted glyph keeps an orphaned draw.
      active--;retiredUnanchoredBodySignals++;dirty=true;continue;
     }
     slot.origin=observed;
    }
    if(pool.name==='trail'){
     const hand=anchor(slot.cue,'trail');
     if(!hand){
      // A dying actor may retain its previous attack action while the death
      // pose animates. Retire its sword slot immediately instead of keeping
      // a moving ribbon or consuming its remaining pooled lifetime. A
      // temporarily unavailable/rebound rig is merely hidden, not marked dead.
      let deadAttacker=false;
      try{
       const actor=actorById(slot.cue.actorId);
       deadAttacker=actor?.u?.id===slot.cue.actorId&&
        Number.isFinite(actor.u.hp)&&actor.u.hp<=0;
      }catch{}
      if(deadAttacker){
       pool.slots[i]=null;pool.mesh.setMatrixAt(i,hideMatrix());frameMatrixWrites++;poolWrites++;
       active--;retiredDeadTrails++;dirty=true;continue;
      }
      // A confirmed living replacement action (or newer attack tick)
      // permanently revokes a historical sword attempt. A missing rig,
      // invisible root or unobserved state does NOT certify interruption.
      let interrupted=false;
      try{
       const observed=actorById(slot.cue.actorId),u=observed?.u;
       interrupted=observed?.root?.visible===true&&
        u?.id===slot.cue.actorId&&Number.isFinite(u.hp)&&u.hp>0&&
        (u.action!=='attack'||u.actionTick!==slot.cue.tick);
      }catch{}
      if(interrupted){
       pool.slots[i]=null;pool.mesh.setMatrixAt(i,hideMatrix());frameMatrixWrites++;poolWrites++;
       active--;retiredInterruptedTrails++;dirty=true;continue;
      }
      slot.lastHand=null;slot.measuredPath=null;
     }else{
      // The game's normal one-shot animation dt is capped at 50ms, but its
      // ACTUAL browser frame may have stalled for seconds. Never join two
      // stale wrist samples just because their presentation clocks were capped.
      const freshFrame=Number.isFinite(actualFrameSeconds)&&actualFrameSeconds>0&&
       actualFrameSeconds<=MEASURED_HAND_TRAIL_MAX_FRAME_SECONDS;
      const sameBone=Boolean(slot.lastHand?.sourceBone&&
       slot.lastHand.sourceBone===hand.sourceBone);
      if(!sameBone){
       // Hot-swapped rig: drop the old ribbon immediately, not after its
       // normal 55ms visual grace interval. The new wrist needs two samples.
       slot.measuredPath=null;slot.lastMeasuredAge=-Infinity;slot.lastMeasuredSpeed=0;
      }
      const segment=freshFrame&&sameBone?
       planMeasuredHandTrail(slot.lastHand,hand,actualFrameSeconds):null;
      slot.lastHand={...hand};
      if(!freshFrame){
       // Suppress even the old ribbon after any stalled frame. The next fresh
       // frame starts from this new actual pose, not from before the stall.
       slot.measuredPath=null;slot.lastMeasuredAge=-Infinity;slot.lastMeasuredSpeed=0;
       unmeasuredTrailFrames++;
      }else if(segment){
       slot.measuredPath=segment;slot.lastMeasuredAge=slot.age;
       slot.lastMeasuredSpeed=segment.length/actualFrameSeconds;measuredTrailFrames++;
        if(hand.sourceBodyRoot)bodyLocalTrailFrames++;
        else yawFallbackTrailFrames++;
      }else{
       unmeasuredTrailFrames++;
       if(slot.age-slot.lastMeasuredAge>.055){slot.measuredPath=null;slot.lastMeasuredSpeed=0;}
      }
     }
    }
    // A no-motion hand is not an animated sword arc. Once its retained
    // instance matrix is hidden, no repeated hideMatrix/setMatrixAt/upload
    // is necessary. A newly measured passage still draws immediately; a
    // previous passage is cleared exactly once when its witness expires.
    if(pool.name==='trail'&&!slot.measuredPath&&slot.matrixHidden)continue;
    pool.mesh.setMatrixAt(i,transform(pool,slot));frameMatrixWrites++;poolWrites++;dirty=true;
    if(pool.name==='trail')slot.matrixHidden=!slot.measuredPath;
    if(pool.name!=='trail'||slot.measuredPath)visibleSlots++;
   }
   if(dirty){
    pool.mesh.instanceMatrix.needsUpdate=true;
    dirtyPoolCount++;potentialBufferBytes+=pool.max*64;
   }
   if(dirty)pool.mesh.visible=visibleSlots>0;
   lastAdvanceWritesByPool[pool.name]=poolWrites;
  }
  // One completed JS visual pass. These numbers capture setMatrixAt calls
  // and potential full reserved-buffer upload sizes only; they do NOT assert
  // WebGL bufferSubData, GPU completion, pixels on screen or audio playback.
  lastAdvanceMatrixWrites=frameMatrixWrites;
  lastAdvanceDirtyPools=dirtyPoolCount;
  lastAdvancePotentialBufferBytes=potentialBufferBytes;
  advanceFrames=Math.min(Number.MAX_SAFE_INTEGER,advanceFrames+1);
 }
 // Reduced-motion intentionally removes the animated sword ribbon. A
 // real public attack attempt may still make an accessible, sound-only whoosh,
 // but the same living, visible actor MUST still be performing that attack.
 // Do not demand an authored sword bone: that would silence legitimate
 // procedural fallback bodies, precisely in the accessible mode. This is a
 // read-only body/action witness, NOT a hit, blade-tip or target proof.
 function hasAuthenticatedSwingAction(cue){
  if(disposed||cue?.kind!=='swing'||cue?.visual!=='trail'||
   cue.proof!=='authority-attempt-not-hit'||typeof cue.actorId!=='string')
   return false;
  let actor=null;
  try{actor=actorById(cue.actorId)}catch{return false}
  const u=actor?.u;
  if(u?.id!==cue.actorId||!['vanguard','revenant','warden'].includes(u.kind)||
   u.action!=='attack'||u.actionTick!==cue.tick||
   !Number.isFinite(u.hp)||u.hp<=0)return false;
  return sampleActor(cue.actorId,cue.from)!==null;
 }
 // A delayed launch may be *sound-only* when its retained flight is
 // genuinely blocked by masonry, preempted or unavailable. But a cancelled
 // firing/casting pose is not proof that any physical emitter still existed.
 // Use the SAME live actor, tick and rig-hand rules as visual admission;
 // never infer a projectile hit, fabricate a source or add a mesh/voice.
 // This is queried only on undrawn release cues at their staging boundary.
 // Recheck an already drawable sword at the WebGL receipt boundary.
 // The retained ribbon can still be live from advance() even if the actor
 // changed action, died or lost its actual wrist before render submission.
 // This is only pose provenance, NEVER physical contact or attacker proof.
 function hasAuthenticatedSwingPose(cue){
  if(disposed||cue?.kind!=='swing'||cue?.visual!=='trail'||
   cue?.proof!=='authority-attempt-not-hit')return false;
  const hand=anchor(cue,'trail');
  if(!hand)return false;
  // An old measured ribbon can remain drawable when the actual skinned rig
  // changes between the animation update and the WebGL receipt. A replacement
  // wrist at the same position MUST NOT certify the original swing sound.
  // Nor may the SAME bone authorize an outdated VFX transform after its
  // wrist or root heading changes between advance() and frame submission.
  // Newly measured movement earns a fresh receipt on the next genuine frame.
  for(const slot of pools.get('trail')?.slots??[]){
   if(slot?.cue?.id!==cue.id||!slot.measuredPath)continue;
   // A fading ribbon can survive 55ms after its last genuine wrist motion.
   // It is permissible visual afterglow, NOT a newly submitted air passage:
   // only the current advance()'s fresh measured segment can authorize a
   // whoosh. The controller still applies scene/age/frame/consent gates.
   return slot.lastMeasuredAge===slot.age&&
    isCurrentMeasuredHandReceipt(slot.lastHand,hand);
  }
  // Standalone source query: the independent receipt gate still requires a
  // drawable, measured retained slot. No contact or victim is inferred.
  return true;
 }
 // Read back ONLY a fresh, individually measured sword-hand passage after
 // the same skinned wrist and pose have passed the real submission witness.
 // It is a proxy for AIR movement, never a blade tip, contact, or HP event.
 // Older retained ribbons may still be drawable, but cannot fabricate a new
 // velocity for their deferred sound. No extra GPU/audio resources.
 function measuredSwingSpeed(cue){
  if(disposed||cue?.kind!=='swing'||cue?.visual!=='trail'||
   cue?.proof!=='authority-attempt-not-hit'||!hasAuthenticatedSwingPose(cue))
   return null;
  for(const slot of pools.get('trail')?.slots??[]){
   if(slot?.cue?.id!==cue.id||!slot.measuredPath||
    slot.lastMeasuredAge!==slot.age)continue;
   return Number.isFinite(slot.lastMeasuredSpeed)&&slot.lastMeasuredSpeed>0?
    slot.lastMeasuredSpeed:null;
  }
  return null;
 }
 function hasAuthenticatedReleasePose(cue){
  if(disposed||cue?.proof!=='authority-action')return false;
  const type=cue.kind==='ranged-release'?'projectile':
   cue.kind==='spell-release'?'spell':null;
  return type!==null&&anchor(cue,type)!==null;
 }
 // Some real body-local actions are audio-capable even when the signal
 // pool is saturated or the ring was otherwise not admitted. Such a sound
 // must still have an observed live performer: a prior public action tick
 // does not prove the model/pose remains present at delayed admission.
 // This is a read-only witness; never draws a ring or invents contact.
 function hasAuthenticatedBodyPose(cue){
  if(disposed||cue?.visual!=='warden'&&cue?.visual!=='opening'&&
   cue?.visual!=='utility')return false;
  const expected=cue.kind==='warden-release'||cue.kind==='guard'||
   cue.kind==='cast-utility'?'authority-action':
   cue.kind==='opening'?'authority-opening-recovery-window':null;
  return expected!==null&&cue.proof===expected&&anchor(cue,'signal')!==null;
 }
 // Query retained slots once per pending sound receipt, after actual-frame
 // lifetime aging. A live swing slot does not certify a successful hit.
 function hasLiveCue(cueId){
  if(disposed||typeof cueId!=='string'||!cueId)return false;
  for(const pool of pools.values())
   for(const slot of pool.slots)
    if(slot?.cue?.id===cueId&&slot.age<slot.life)return true;
  return false;
 }
 // A retained, alive trail is hidden until the observed wrist actually moves.
 // Require this individual slot's drawn geometry, not merely pool visibility.
 function hasDrawableCue(cueId){
  if(disposed||typeof cueId!=='string'||!cueId)return false;
  for(const pool of pools.values()){
   if(!pool.mesh.visible)continue;
   for(const slot of pool.slots)
    if(slot?.cue?.id===cueId&&slot.age<slot.life&&
      (pool.name!=='trail'||slot.measuredPath!==null))return true;
  }
  return false;
 }

 /**
  * A timed-out or clock-unverified WebGL submission may have drawn an old transient for the
  * duration of the stall. Remove its retained GPU slots BEFORE any later
  * frame can re-display that ghost. This is a presentation cleanup only:
  * never mutate authority, claim an impact, or revoke a still-authoritative
  * Warden danger-cell warning because its optional sound missed a deadline.
  * No new geometry, draw call, audio node or unbounded history is allocated.
  */
 function retireStaleCue(cueId,reason){
  if(disposed||typeof cueId!=='string'||!cueId||
   !['stale-frame','expired-visual','unverified-frame',
     'revoked-drawn-swing-pose','revoked-drawn-body-pose',
     'visual-submission-unverified',
      'awaiting-frame-cap-rejected','awaiting-frame-cap-preempted'].includes(reason))return 0;
  let retired=0;
  for(const pool of pools.values()){
   let dirty=false;
   for(let i=0;i<pool.max;i++){
    const slot=pool.slots[i];
    if(slot?.cue?.id!==cueId||slot.cue.visual==='warning')continue;
    // A post-submission pose revocation may clear only its own proven gesture.
    // Never use a stale sword/body witness to erase unrelated HP injury,
    // projectiles, or a still-authoritative Warden warning footprint.
    if(reason==='revoked-drawn-swing-pose'&&slot.cue.kind!=='swing')continue;
    if(reason==='revoked-drawn-body-pose'&&
       !['warden-release','opening','guard','cast-utility'].includes(slot.cue.kind))continue;
    pool.slots[i]=null;pool.mesh.setMatrixAt(i,hideMatrix());
    active--;retired++;dirty=true;
   }
   if(dirty){
    pool.mesh.instanceMatrix.needsUpdate=true;
    pool.mesh.visible=pool.slots.some(slot=>slot!==null&&slot.age<slot.life&&
     (pool.name!=='trail'||slot.measuredPath!==null));
   }
  }
  retiredStaleFrameInstances+=retired;
  return retired;
 }
 function reset(){
  if(disposed)return;
  // All retained instances start hidden, and every normal retirement hides
  // its own matrix. Clear only occupied slots on a floor/run transition:
  // rewriting all 102 already-hidden matrices needlessly dirties idle pools.
  // Repeated reset/dispose remains idempotent without missing live effects.
  for(const pool of pools.values()){
   let dirty=false;
   for(let i=0;i<pool.max;i++){
    if(pool.slots[i]===null)continue;
    pool.slots[i]=null;
    pool.mesh.setMatrixAt(i,hideMatrix());
    dirty=true;
   }
   if(dirty)pool.mesh.instanceMatrix.needsUpdate=true;
   pool.mesh.visible=false;
  }
  active=0;warningHistory.clear();
 }
 function dispose(){
  if(disposed)return;
  reset();disposed=true;
  for(const pool of pools.values()){
   scene.remove(pool.mesh);pool.geometry.dispose();pool.mat.dispose();
  }
  pools.clear();
 }
 function stats(){return Object.freeze({
  active,peak,spawned,suppressed,preempted,retiredWarningMarkers,staleWarningCues,retiredInvalidWarnings,
  warningHistoryOwners:warningHistory.size,unanchoredWardenSignals,
   retiredUnanchoredBodySignals,confirmedFragments,
  measuredTrailFrames,bodyLocalTrailFrames,yawFallbackTrailFrames,
   unmeasuredTrailFrames,retiredDeadTrails,retiredInterruptedTrails,occludedFlights,blockedFlights,
   retiredStaleFrameInstances,disposed,
  // CPU submission intent, not a hardware upload or frame-time benchmark.
  advanceFrames,idleAdvanceSkips,lastAdvanceMatrixWrites,lastAdvanceDirtyPools,
  lastAdvancePotentialBufferBytes,
  lastAdvanceWritesByPool:Object.freeze({...lastAdvanceWritesByPool}),
  reservedInstances:TOTAL,drawCalls:pools.size,
  activeDrawCalls:[...pools.values()].filter(p=>p.mesh.visible).length,
  geometryCount:pools.size,materialCount:pools.size,reducedMotion,reducedFlash,
  instancesByPool:Object.fromEntries([...pools].map(([n,p])=>[n,p.slots.filter(Boolean).length]))
 })}
 return Object.freeze({emit,advance,hasAuthenticatedSwingPose,hasAuthenticatedSwingAction,measuredSwingSpeed,hasAuthenticatedReleasePose,hasAuthenticatedBodyPose,hasLiveCue,hasDrawableCue,retireStaleCue,reset,dispose,stats});
}
