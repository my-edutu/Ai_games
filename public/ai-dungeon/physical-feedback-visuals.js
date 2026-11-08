/**
 * D04 physical spectator effects — v2 original, restrained, fully retained art.
 *
 * Source of truth is the cue planner, NEVER collision proximity or an effect's
 * arrival. A sword's air streak follows the existing skinned hand; actual HP
 * loss alone earns a small deterministic fracture. Does not touch animations,
 * camera, lights, damage, authority time, scene geometry, or renderer policies.
 */
import {planMeasuredHandTrail} from './measured-weapon-trail.js';
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
/** A tiny straight, tapered ribbon: the real moving hand defines its world pose.
 * The old swept crescent was generated even when the actual wrist stayed still.
 * Keeping one shared geometry and one retained instanced pool avoids per-hit meshes.
 */
export function createOriginalBladeStreakGeometry(THREE){
 const vertices=[],indices=[],uvs=[],segments=16;
 for(let i=0;i<=segments;i++){
  const t=i/segments;
  const width=.003+.027*Math.pow(Math.sin(Math.PI*t),1.5);
  for(const side of [-1,1]){
   vertices.push(side*width,t-.5,0);
   uvs.push(t,(side+1)/2);
  }
  if(i<segments){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}
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
 actorById=()=>null,reducedMotion=false,reducedFlash=false
}={}){
 if(!THREE||!scene||typeof scene.add!=='function')return null;
 const pose=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),dir=new THREE.Vector3(),
  sampled=new THREE.Vector3();
 const pools=new Map();let active=0,peak=0,spawned=0,suppressed=0,
  preempted=0,confirmedFragments=0,measuredTrailFrames=0,
  unmeasuredTrailFrames=0,disposed=false;
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
  const bone=hand&&actor.authored?actor.rigHandBone:
   chest&&actor.authored?actor.rigMeleeBones?.find(b=>b.part==='spine')?.bone:null;
  if(bone){
   try{
    bone.updateWorldMatrix?.(true,false);bone.getWorldPosition(sampled);
    const bound=hand?2.8:3.1;
    if(finite3(sampled)&&sampled.y>=.34&&sampled.y<=bound&&
      Math.hypot(sampled.x-root.x,sampled.z-root.z)<=(hand?.84:.72))
     return {x:sampled.x,y:sampled.y,z:sampled.z,yaw:actor.root.rotation?.y??0,
      rootX:root.x,rootY:root.y,rootZ:root.z};
   }catch{}
  }
  if(requireBone)return null; // Never counterfeit a moving sword hand from a static root.
  return {x:root.x,y:root.y+(hand?1.20:chest?1.12:1.00),
   z:root.z,yaw:actor.root.rotation?.y??0};
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
  // The sword streak must come from the current actually animated right-hand
  // bone on this witnessed swing. An idle or stale reused actor is not a blade.
  if(type==='trail'&&(!actor?.authored||actor.u?.action!=='attack'||
    actor.u?.actionTick!==cue.tick||!actor.rigHandBone))return null;
  const sampledPoint=sampleActor(id,at,{hand:type==='trail'||type==='projectile'||type==='spell',
   chest:victim,requireBone:type==='trail'});
  if(sampledPoint)return sampledPoint;
  if(type==='trail')return null;
  if(actor)return null; // Stale/wrong-cell actor: suppress disconnected art.
  if(victim)return world(at,1.07);
  // For warning/release without a loaded actor, the public world cell remains
  // authoritative. Unidentified events never get a fabricated world point.
  return typeof id==='string'?world(at,type==='signal'?.08:1.10):null;
 }
 function allocate(pool,priority){
  let index=pool.slots.findIndex(x=>x===null);
  if(index>=0)return index;
  let least=0;
  for(let i=1;i<pool.max;i++)if(pool.slots[i].priority<pool.slots[least].priority)least=i;
  if(pool.slots[least].priority>=priority)return -1;
  preempted++;return least;
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
  if(type==='hit'&&cue.proof!=='observed-hp-drop')return false;
  if(type==='trail'&&(cue.kind!=='swing'||cue.proof!=='authority-attempt-not-hit'))return false;
  if(cue.kind==='counter'&&cue.proof!=='authority-counter-and-HP')return false;
  if(type==='block'&&cue.proof!=='authority-block-unique-guarded-hp')return false;
  if((type==='projectile'||type==='spell')&&(!cue.targetId||!cell(cue.to)))return false;
  if(type==='dust'&&(!cell(cue.from)||!cell(cue.to)||
   Math.abs(cue.to.x-cue.from.x)+Math.abs(cue.to.z-cue.from.z)!==1))return false;
  if(reducedMotion&&['trail','dust'].includes(type))return false;
  const start=anchor(cue,type);
  if(!start){suppressed++;return false}
  const n=type==='hit'?Math.max(4,Math.min(6,4+Math.floor(clamp(cue.severity,0,1)*2))):
    type==='dust'?2:1;
  const length=clamp(cue.duration,.10,.70),severity=clamp(cue.severity,0,1);
  let created=0;
  for(let i=0;i<n;i++){
   const index=allocate(pool,clamp(cue.priority,0,10));
   if(index<0){suppressed++;break}
   if(!pool.slots[index])active++;
   const speed=type==='hit'||type==='dust'?spray(cue.id,i):null;
   pool.slots[index]={cue,age:0,life:reducedMotion?Math.min(.13,length):length,
    origin:{...start},end:cell(cue.to)?world(cue.to,type==='spell'?1.23:1.19):null,
    priority:cue.priority??1,severity,fragment:speed,index,ordinal:i,
    lastHand:type==='trail'?{...start}:null,
    measuredPath:null,lastMeasuredAge:-Infinity};
   // No fabricated arc is drawn at emission; first sample has no motion.
   if(type!=='trail')pool.mesh.visible=true;
   created++;spawned++;
  }
  if(type==='hit')confirmedFragments+=created;
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
   if(end){
    const speed=t*t*(3-2*t),flight=Math.sin(Math.PI*t);
    pose.position.set(origin.x+(end.x-origin.x)*speed,
     origin.y+(end.y-origin.y)*speed+(p==='spell'?.11:.035)*flight,
     origin.z+(end.z-origin.z)*speed);
    dir.set(end.x-origin.x,end.y-origin.y,end.z-origin.z);
    if(dir.lengthSq()>.0001)pose.quaternion.setFromUnitVectors(up,dir.normalize());
   }
   // A projectile may visibly arrive without ever authorizing a hit effect.
   pose.scale.setScalar((p==='spell'?.78:1.0)*(fade*.47+.43));
  }else if(p==='block'){
   pose.rotation.y=origin.yaw??0;
   pose.rotation.z=-.15+t*.35;
   pose.scale.setScalar((.72+.35*t)*fade+.006);
  }else if(p==='signal'){
   pose.rotation.x=-Math.PI/2;
   pose.position.y=.075;
   pose.scale.setScalar((.8+.38*t)*fade+.007);
  }
  pose.updateMatrix();return pose.matrix;
 }
 function advance(frameSeconds){
  if(disposed)return;
  const dt=clamp(frameSeconds,0,.05);
  for(const pool of pools.values()){
   let dirty=false,visibleSlots=0;
   for(let i=0;i<pool.max;i++){
    const slot=pool.slots[i];if(!slot)continue;
    slot.age+=dt;dirty=true;
    if(slot.age>=slot.life){
     pool.slots[i]=null;pool.mesh.setMatrixAt(i,hideMatrix());active--;continue;
    }
    if(pool.name==='trail'){
     const hand=anchor(slot.cue,'trail');
     if(!hand){slot.lastHand=null;slot.measuredPath=null}
     else{
      const segment=slot.lastHand?planMeasuredHandTrail(slot.lastHand,hand,dt):null;
      slot.lastHand={...hand};
      if(segment){slot.measuredPath=segment;slot.lastMeasuredAge=slot.age;measuredTrailFrames++}
      else{
       unmeasuredTrailFrames++;
       if(slot.age-slot.lastMeasuredAge>.055)slot.measuredPath=null;
      }
     }
    }
    pool.mesh.setMatrixAt(i,transform(pool,slot));
    if(pool.name!=='trail'||slot.measuredPath)visibleSlots++;
   }
   if(dirty)pool.mesh.instanceMatrix.needsUpdate=true;
   if(dirty)pool.mesh.visible=visibleSlots>0;
  }
 }
 function reset(){
  if(disposed)return;
  for(const pool of pools.values()){
   pool.slots.fill(null);
   for(let i=0;i<pool.max;i++)pool.mesh.setMatrixAt(i,hideMatrix());
   pool.mesh.instanceMatrix.needsUpdate=true;pool.mesh.visible=false;
  }
  active=0;
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
  active,peak,spawned,suppressed,preempted,confirmedFragments,
  measuredTrailFrames,unmeasuredTrailFrames,disposed,
  reservedInstances:TOTAL,drawCalls:pools.size,
  activeDrawCalls:[...pools.values()].filter(p=>p.mesh.visible).length,
  geometryCount:pools.size,materialCount:pools.size,reducedMotion,reducedFlash,
  instancesByPool:Object.fromEntries([...pools].map(([n,p])=>[n,p.slots.filter(Boolean).length]))
 })}
 return Object.freeze({emit,advance,reset,dispose,stats});
}
