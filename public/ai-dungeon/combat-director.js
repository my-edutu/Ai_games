import * as THREE from '/dungeon/vendor/three.module.js';
import {combatCueDelay,MAX_PENDING_COMBAT_CUES} from '/dungeon/combat-cue-plan.js';
import {canStageMeleeArc,planMeleeArcFrame,MELEE_ARC_DURATION} from '/dungeon/melee-arc-plan.js';
import {isHealingCast,isDisarmCast} from '/dungeon/combat-intent-plan.js';
import {planVisualContact} from '/dungeon/facing-plan.js';
import {planCombatStage,stagePoint} from '/dungeon/combat-staging-plan.js';
import {advancePresentationActionAge} from '/dungeon/character-motion-plan.js';
import {createBladeRibbonGeometry,createImpactSpallGeometry,planTrueDamageCue} from '/dungeon/contact-performance.js';

/**
 * Visual-only combat choreographer: never modifies the deterministic RPG.
 * Triggered by authoritative action/actionTick transitions, not fabricated combat.
 */
const TINT={vanguard:'#62cbff',ranger:'#a5ff95',mystic:'#be8aff',revenant:'#ff9659',cultist:'#ff70b3',warden:'#ffbd57'};
const PROJECTILE_LIMIT=26,IMPACT_LIMIT=24;
const V3=(x,y,z)=>new THREE.Vector3(x-9,y,z-9);
const shared={orb:new THREE.IcosahedronGeometry(.13,1),slash:createBladeRibbonGeometry(THREE),spall:createImpactSpallGeometry(THREE),ring:new THREE.RingGeometry(.6,.69,45),spark:new THREE.OctahedronGeometry(.07,0)};
const color=(kind)=>TINT[kind]||'#83fff0';
const handPosition=new THREE.Vector3();
function stagedArcFrame(source,target,from,to,life,reducedMotion,actorById=null){
 const pose=planMeleeArcFrame(source,target,life,reducedMotion);
 if(!pose)return null;
 // Preserve the real adjacent-cell attack as the only legal source of an arc.
 // Small within-cell actor offsets move the *rendered* blade contact into the
 // visible body instead of leaving a ghost strike at an empty tile centre.
 const dx=target.x-source.x,dz=target.z-source.z;
 const travel=Math.max(0,Math.min(1,(pose.x-source.x)*dx+(pose.z-source.z)*dz));
 pose.x+=(from.x-source.x)*(1-travel)+(to.x-target.x)*travel;
 pose.z+=(from.z-source.z)*(1-travel)+(to.z-target.z)*travel;
 // When a genuine skinned hand is close to the authorised cell, the first
 // half of the forged sweep travels with that wrist instead of hovering.
 const actor=typeof actorById==='function'&&source.id?actorById(source.id):null;
 const hand=actor?.rigHandBone;
 if(hand&&actor?.authored&&actor?.root?.visible){
  hand.updateWorldMatrix(true,false);hand.getWorldPosition(handPosition);
  if(Number.isFinite(handPosition.y)&&Math.hypot(handPosition.x-(from.x-9),handPosition.z-(from.z-9))<.9){
   const mix=Math.max(0,1-life/MELEE_ARC_DURATION)*.48;
   pose.x+=(handPosition.x+9-pose.x)*mix;
   pose.z+=(handPosition.z+9-pose.z)*mix;
   pose.y+=Math.max(-.45,Math.min(.45,handPosition.y-pose.y))*mix;
  }
 }
 return pose;
}
function material(hex,opacity=.95){
 return new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
}
export function createCombatDirector(scene,{reducedMotion=false,actorById=null}={}){
 const projectiles=[],impacts=[],pendingCues=[],previous=new Map();let floorKey='',shots=0,bursts=0,releasedCues=0,droppedCues=0,healingCues=0,disarmCues=0,contactLockedCues=0,suppressedUnmatchedCues=0,meleeArcs=0;
 let stagePositions=Object.create(null),trueDamageCues=0,suppressedDamageCues=0;
 const cleanup=e=>{scene.remove(e.mesh);e.mesh.material.dispose()};
 function ensureBound(){
  while(projectiles.length>PROJECTILE_LIMIT)cleanup(projectiles.shift());
  while(impacts.length>IMPACT_LIMIT)cleanup(impacts.shift());
 }
 function projectile(source,target,kind,action,from=stagePoint(stagePositions,source),to=stagePoint(stagePositions,target)){
  const src=V3(from.x,kind==='mystic'?1.37:1.21,from.z),dst=V3(to.x,1.18,to.z);
  // Physical blades sweep through the actual adjacent grid lane, from source
  // toward opponent. An adjacent ranger still fires a real arrow, not a sword.
  // Casts, diagonal guesses and unmatched actions never create melee arcs.
  if(canStageMeleeArc(kind,action,source,target)){
   const frame=stagedArcFrame(source,target,from,to,0,reducedMotion,actorById);
   const mesh=new THREE.Mesh(shared.slash,new THREE.MeshStandardMaterial({color:color(kind),metalness:.55,roughness:.32,emissive:color(kind),emissiveIntensity:.18,transparent:true,opacity:frame.opacity,depthWrite:false,side:THREE.DoubleSide}));
   mesh.position.copy(V3(frame.x,frame.y,frame.z));
   mesh.rotation.set(0,frame.yaw,frame.roll);
   mesh.scale.setScalar(frame.scale*(kind==='warden'?1.2:1));
   scene.add(mesh);
   impacts.push({mesh,life:0,duration:MELEE_ARC_DURATION,mode:'slash',
    source:{x:source.x,z:source.z},target:{x:target.x,z:target.z},from:{x:from.x,z:from.z},to:{x:to.x,z:to.z},kind});
   meleeArcs=Math.min(1000000,meleeArcs+1);bursts++;ensureBound();return;
  }
  const mesh=new THREE.Mesh(shared.orb,material(color(kind),.95));mesh.position.copy(src);mesh.scale.setScalar(kind==='warden'?1.8:kind==='mystic'?1.35:1);
  scene.add(mesh);projectiles.push({mesh,src,dst,target:{x:to.x,z:to.z},t:0,duration:.18+Math.min(.38,src.distanceTo(dst)*.045),kind});shots++;ensureBound();
 }
 // Body-height impact flares replace routine bright floor circles. The actual
 // boss warning/telegraph remains controlled by authoritative app.js state.
 function flashAt(unit,hex,large=false){
  const mesh=new THREE.Mesh(shared.spark,material(hex,large?.82:.74));
  mesh.position.copy(V3(unit.x,large?1.34:.94,unit.z));
  const startScale=large?4.2:2.7;mesh.scale.setScalar(startScale);
  scene.add(mesh);impacts.push({mesh,life:0,duration:large?.32:.23,mode:'spark',startScale});
  bursts++;ensureBound();
 }
 function burstAt(unit,hex,large=false){
  const pos=V3(unit.x,.13,unit.z);
  const mesh=new THREE.Mesh(shared.ring,material(hex,.7));mesh.rotation.x=-Math.PI/2;mesh.position.copy(pos);
  scene.add(mesh);impacts.push({mesh,life:0,duration:large?.69:.40,mode:'ring',large});bursts++;ensureBound();
 }
 // A cue retains ONLY the real action/target snapshot. No simulation or
 // real-time timer is permitted to invent contact, reposition actors or damage.
 function releaseCue(cue){
  if(cue.source.kind==='warden'&&cue.source.action==='cast')
   flashAt(cue.source,'#ff653f',true);
  else if(cue.target)projectile(cue.source,cue.target,cue.source.kind,cue.source.action,cue.from,cue.to);
  releasedCues++;
 }
 function signalAction(u,s){
  switch(u.action){
   case 'attack':case 'cast':{
    // A real mystic heal is a friendly cast, not damage. The public same-tick
    // semantic healing event is the only authority; no guess from HP, text or RNG.
    // Never fire a hostile bolt because an enemy happens to be nearby.
    if(isHealingCast(u,s)){
     flashAt(u,'#8fe6ad');
     healingCues=Math.min(1000000,healingCues+1);
     return;
    }
    // Trap utility spells produce no hostile bolt, even with nearby enemies.
    if(isDisarmCast(u,s)){
     flashAt(u,'#9fe6b1');
     disarmCues=Math.min(1000000,disarmCues+1);
     return;
    }
    const aim=planVisualContact(u,s);
    const target=aim?s.units.find(v=>v.id===aim.targetId):null;
    // The Warden's authority-backed nova is radial, never a guessed arrow
    // to the closest living hero. Other hostile cues require a real grid lane.
    if(!target&&!(u.kind==='warden'&&u.action==='cast')){
     suppressedUnmatchedCues=Math.min(1000000,suppressedUnmatchedCues+1);
     return;
    }
    if(target)contactLockedCues=Math.min(1000000,contactLockedCues+1);
    const cue={source:{x:u.x,z:u.z,id:u.id,kind:u.kind,action:u.action},target:target?{x:target.x,z:target.z,id:target.id}:null,from:stagePoint(stagePositions,u),to:target?stagePoint(stagePositions,target):null,age:0,
     delay:combatCueDelay(u.kind,u.action,reducedMotion)};
    if(cue.delay===0){releaseCue(cue);return;}
    if(pendingCues.length>=MAX_PENDING_COMBAT_CUES){pendingCues.shift();droppedCues++;}
    pendingCues.push(cue);
    break;
   }
   case 'guard':burstAt(u,'#79ffe6');break;
   case 'hurt':break; // Actual HP delta, not a pose, now authorises injury VFX.
  }
 }
 function accept(s){
  const key=s.run+':'+s.floor;
  if(key!==floorKey){reset();floorKey=key;}
  stagePositions=planCombatStage(s);
  const current=new Set();
  for(const u of s.units){
   const id=u.id;current.add(id);
   const previousTick=previous.get(id);
   if(u.hp>0&&previousTick!==undefined&&previousTick!==u.actionTick&&u.action!=='idle'&&u.action!=='move')signalAction(u,s);
   previous.set(id,u.actionTick);
  }
  for(const id of [...previous.keys()])if(!current.has(id))previous.delete(id);
 }
 // Damage-only proof from consecutive genuine authority frames.
 function recordDamage(beats){
  if(!Array.isArray(beats))return;
  for(const beat of beats.slice(0,18)){
   const hit=planTrueDamageCue(beat,stagePoint(stagePositions,beat));
   if(!hit){suppressedDamageCues++;continue;}
   const mesh=new THREE.Mesh(shared.spall,material(hit.color,.88));
   mesh.position.copy(V3(hit.x,hit.y,hit.z));mesh.scale.setScalar(hit.scale);
   scene.add(mesh);impacts.push({mesh,life:0,duration:hit.duration,mode:'true-hit',startScale:hit.scale});
   trueDamageCues=Math.min(1000000,trueDamageCues+1);ensureBound();
  }
 }
 function animate(dt){
  dt=Number.isFinite(dt)?Math.min(.05,Math.max(0,dt)):0;
  // Follow the same bounded rendered-frame clock used by authored weapon
  // wind-up; this still works with slow software WebGL without changing ticks.
  for(let i=0;i<pendingCues.length;){
   const cue=pendingCues[i];
   cue.age=advancePresentationActionAge(cue.age,dt);
   if(cue.age>=cue.delay){pendingCues.splice(i,1);releaseCue(cue);}
   else i++;
  }
  for(let i=projectiles.length-1;i>=0;i--){
   const p=projectiles[i];p.t+=dt;
   const progress=Math.min(1,p.t/p.duration),smooth=progress*progress*(3-2*progress);
   p.mesh.position.lerpVectors(p.src,p.dst,smooth);
   if(!reducedMotion)p.mesh.position.y+=Math.sin(progress*Math.PI)*.045;
   p.mesh.material.opacity=.9*(1-progress*.45);
   if(progress>=1){
    // One close-range body flare marks the true target; no extra giant
    // floor circle obscures combat contact or duplicates boss telegraphs.
    // A shot can be dodged/blocked. No unverified hit flare at arrival.
    cleanup(p);projectiles.splice(i,1);
   }
  }
  for(let i=impacts.length-1;i>=0;i--){
   const effect=impacts[i];effect.life+=dt;
   if(effect.life>=effect.duration){cleanup(effect);impacts.splice(i,1);continue;}
   const t=effect.life/effect.duration;
   if(effect.mode==='spark'){
    effect.mesh.material.opacity=.78*(1-t);
    effect.mesh.scale.setScalar(effect.startScale*(.82+.62*t));
   }else if(effect.mode==='true-hit'){
    effect.mesh.material.opacity=.88*(1-t);
    effect.mesh.scale.setScalar(effect.startScale*(.83+.36*t));
   }else if(effect.mode==='slash'){
    const frame=stagedArcFrame(effect.source,effect.target,effect.from,effect.to,effect.life,reducedMotion,actorById);
    if(frame){
     effect.mesh.position.copy(V3(frame.x,frame.y,frame.z));
     effect.mesh.rotation.set(0,frame.yaw,frame.roll);
     effect.mesh.scale.setScalar(frame.scale*(effect.kind==='warden'?1.2:1));
     effect.mesh.material.opacity=frame.opacity;
    }
   }else{
    effect.mesh.material.opacity=.55*(1-t);
    // Guard circles are tactical and restrained; the authoritative boss
    // warning ring lives on the actor and never gets suppressed here.
    effect.mesh.scale.setScalar(.18+t*.58);
   }
  }
  ensureBound();
 }
 function reset(){
  for(const p of projectiles)cleanup(p);for(const p of impacts)cleanup(p);
  projectiles.length=impacts.length=pendingCues.length=0;previous.clear();stagePositions=Object.create(null);
 }
 return{accept,recordDamage,animate,reset,stats:()=>({trueDamageCues,suppressedDamageCues,activeProjectiles:projectiles.length,activeImpacts:impacts.length,pendingCues:pendingCues.length,healingCues:healingCues,disarmCues:disarmCues,contactLockedCues:contactLockedCues,suppressedUnmatchedCues:suppressedUnmatchedCues,releasedCues:releasedCues,droppedCues:droppedCues,activeGroundRings:impacts.filter(e=>e.mode==='ring').length,activeHitFlashes:impacts.filter(e=>e.mode==='spark').length,activeMeleeArcs:impacts.filter(e=>e.mode==='slash').length,totalMeleeArcs:meleeArcs,totalShots:shots,totalBursts:bursts}),dispose(){reset();for(const geometry of Object.values(shared))geometry.dispose()}};
}
