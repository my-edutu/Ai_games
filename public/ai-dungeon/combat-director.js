import * as THREE from '/dungeon/vendor/three.module.js';
import {combatCueDelay,MAX_PENDING_COMBAT_CUES} from '/dungeon/combat-cue-plan.js';
import {canStageMeleeArc,planMeleeArcFrame,planBodyTrackedArcFrame,MELEE_ARC_DURATION} from '/dungeon/melee-arc-plan.js';
import {isHealingCast,isDisarmCast} from '/dungeon/combat-intent-plan.js';
import {planVisualContact} from '/dungeon/facing-plan.js';
import {planCombatStage,stagePoint} from '/dungeon/combat-staging-plan.js';
import {advancePresentationActionAge} from '/dungeon/character-motion-plan.js';
import {createBladeRibbonGeometry,createImpactSpallGeometry,planTrueDamageCue,planContactShardFan} from '/dungeon/contact-performance.js';
import {planVerifiedMeleeImpactDelay,planVisibleMeleeContactStep} from '/dungeon/impact-choreography-plan.js';
import {createRangedProjectileGeometry,rangedProjectileProfile} from '/dungeon/ranged-encounter-plan.js';

/**
 * Visual-only combat choreographer: never modifies the deterministic RPG.
 * Triggered by authoritative action/actionTick transitions, not fabricated combat.
 */
const TINT={vanguard:'#62cbff',ranger:'#a5ff95',mystic:'#be8aff',revenant:'#ff9659',cultist:'#ff70b3',warden:'#ffbd57'};
const PROJECTILE_LIMIT=26,IMPACT_LIMIT=24;
const V3=(x,y,z)=>new THREE.Vector3(x-9,y,z-9);
const shared={orb:new THREE.IcosahedronGeometry(.13,1),slash:createBladeRibbonGeometry(THREE),spall:createImpactSpallGeometry(THREE),chip:new THREE.TetrahedronGeometry(.073,0),dust:new THREE.SphereGeometry(.5,8,5),ring:new THREE.RingGeometry(.6,.69,45),spark:new THREE.OctahedronGeometry(.07,0),arrow:createRangedProjectileGeometry(THREE,'arrow'),glyph:createRangedProjectileGeometry(THREE,'glyph')};
const color=(kind)=>TINT[kind]||'#83fff0';
const handPosition=new THREE.Vector3(),chestPosition=new THREE.Vector3();
const shardPose=new THREE.Object3D();
/**
 * Trust actual visible 3D actor positions only inside their authoritative
 * cell. Camera lerp after a missed poll, restore or floor swap must never
 * cause a false melee reach or a detached travelling hit.
 */
function liveActorCellPoint(unit,staged,actorById){
 const fallback=staged??unit;
 const actor=typeof actorById==='function'?actorById(unit?.id):null;
 if(!actor||actor.u?.id!==unit?.id||!actor.root?.visible)return fallback;
 const x=actor.root.position.x+9,z=actor.root.position.z+9;
 return Number.isFinite(x)&&Number.isFinite(z)&&
  Math.hypot(x-unit.x,z-unit.z)<=.58?{x,z}:fallback;
}
/**
 * True HP-loss spalls follow the actual skinned chest or grounded visual
 * body, not an unoccupied public cell centre. Bone sampling is cosmetic and
 * clipped to the same real damaged actor; ambiguous/missing rigs fall back.
 */
function liveInjuryAnchor(beat,hit,actorById){
 const actor=typeof actorById==='function'?actorById(beat?.id):null;
 if(!actor||actor.u?.id!==beat?.id||!actor.root?.visible)
  return {x:hit.x,y:hit.y,z:hit.z,skinned:false};
 const x=actor.root.position.x+9,z=actor.root.position.z+9;
 if(!Number.isFinite(x)||!Number.isFinite(z)||
   Math.hypot(x-beat.x,z-beat.z)>.58)
  return {x:hit.x,y:hit.y,z:hit.z,skinned:false};
 let y=actor.u.kind==='warden'?1.54:1.10,skinned=false;
 const bone=actor.authored&&actor.rigMeleeBones?.find(b=>b.part==='spine')?.bone;
 if(bone){
  bone.updateWorldMatrix(true,false);bone.getWorldPosition(chestPosition);
  if(Number.isFinite(chestPosition.y)&&chestPosition.y>=.38&&chestPosition.y<=3.1&&
     Math.hypot(chestPosition.x-actor.root.position.x,chestPosition.z-actor.root.position.z)<.72){
    y=chestPosition.y;skinned=true;
  }
 }
 return {x,y,z,skinned};
}
// A real skinned hand is an eligible launch point only inside the attacker's
// unchanged authoritative cell. Never make a remote/stale character cast.
function liveRangedOrigin(source,from,actorById){
 const origin=V3(from.x,source.kind==='ranger'?1.24:1.33,from.z);
 const actor=typeof actorById==='function'?actorById(source?.id):null;
 const bone=actor?.rigHandBone;
 if(!bone||!actor.authored||actor.u?.id!==source?.id||!actor.root?.visible)return origin;
 bone.updateWorldMatrix(true,false);bone.getWorldPosition(handPosition);
 if([handPosition.x,handPosition.y,handPosition.z].every(Number.isFinite)&&
  handPosition.y>.33&&handPosition.y<2.5&&
  Math.hypot(handPosition.x-(source.x-9),handPosition.z-(source.z-9))<.75)
  origin.copy(handPosition);
 return origin;
}
function stagedArcFrame(source,target,from,to,life,reducedMotion,actorById=null){
 const pose=planMeleeArcFrame(source,target,life,reducedMotion);
 if(!pose)return null;
 const liveFrom=liveActorCellPoint(source,from,actorById);
 const liveTo=liveActorCellPoint(target,to,actorById);
 const attacker=typeof actorById==='function'?actorById(source.id):null;
 const defender=typeof actorById==='function'?actorById(target.id):null;
 let hand=null,chest=null;
 // Local skinned samples are allowed only if the real GLB has remained in
 // its unchanged authoritative source/target cell. Never connect a stale
 // attacker to another floor, a restored ghost, or a distant victim.
 if(attacker?.authored&&attacker.u?.id===source.id&&attacker.u.hp>0&&
    attacker.root?.visible&&attacker.rigHandBone){
  const bone=attacker.rigHandBone;
  bone.updateWorldMatrix(true,false);bone.getWorldPosition(handPosition);
  if(Number.isFinite(handPosition.y)&&handPosition.y>=.34&&handPosition.y<=2.8&&
     Math.hypot(handPosition.x-(source.x-9),handPosition.z-(source.z-9))<=.84)
   hand={x:handPosition.x+9,y:handPosition.y,z:handPosition.z+9};
 }
 const spine=defender?.rigMeleeBones?.find(b=>b.part==='spine')?.bone;
 if(defender?.authored&&defender.u?.id===target.id&&defender.u.hp>0&&
    defender.root?.visible&&spine){
  spine.updateWorldMatrix(true,false);spine.getWorldPosition(chestPosition);
  if(Number.isFinite(chestPosition.y)&&chestPosition.y>=.34&&chestPosition.y<=3.1&&
     Math.hypot(chestPosition.x-(target.x-9),chestPosition.z-(target.z-9))<=.72)
   chest={x:chestPosition.x+9,y:chestPosition.y,z:chestPosition.z+9};
 }
 return planBodyTrackedArcFrame(source,target,life,reducedMotion,{
  from:liveFrom,to:liveTo,hand,chest
 })??pose;
}
function material(hex,opacity=.95){
 return new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
}

// Animate a single original 3D, one-draw-call material fracture at a true
// injury. The start position is sampled from the skinned chest exactly once:
// fragments then move through the world, rather than sticking to a victim.
// Reduced-motion never builds the fracture and keeps the primary injury
// cue/accessible HP change intact.
function poseDamageShards(effect){
 const t=Math.min(1,effect.life/effect.duration),age=effect.life;
 for(let i=0;i<effect.shards.length;i++){
  const v=effect.shards[i];
  shardPose.position.set(v.vx*age,v.vy*age-1.35*age*age,v.vz*age);
  shardPose.rotation.set(v.spin*age,v.spin*age*.64,-v.spin*age*.38);
  shardPose.scale.setScalar(Math.max(.0001,v.size*(1-t)*(.95+.1*Math.sin(t*Math.PI))));
  shardPose.updateMatrix();
  effect.mesh.setMatrixAt(i,shardPose.matrix);
 }
 effect.mesh.instanceMatrix.needsUpdate=true;
 effect.mesh.material.opacity=.82*Math.min(1,(1-t)*4);
}

export function createCombatDirector(scene,{reducedMotion=false,actorById=null}={}){
 const projectiles=[],impacts=[],pendingCues=[],previous=new Map();let floorKey='',shots=0,bursts=0,releasedCues=0,droppedCues=0,healingCues=0,disarmCues=0,contactLockedCues=0,suppressedUnmatchedCues=0,meleeArcs=0;
 let stagePositions=Object.create(null),trueDamageCues=0,suppressedDamageCues=0,trueEvadeCues=0;
 let skinnedArcFrames=0,skinnedChestArcFrames=0,skinnedHitAnchors=0;
 const cleanup=e=>{scene.remove(e.mesh);e.mesh.material.dispose()};
 function ensureBound(){
  while(projectiles.length>PROJECTILE_LIMIT)cleanup(projectiles.shift());
  while(impacts.length>IMPACT_LIMIT)cleanup(impacts.shift());
 }
 function projectile(source,target,kind,action,from=stagePoint(stagePositions,source),to=stagePoint(stagePositions,target)){
  const profile=rangedProjectileProfile(kind,action);
  const src=profile?liveRangedOrigin(source,from,actorById):V3(from.x,kind==='mystic'?1.37:1.21,from.z),dst=V3(to.x,1.18,to.z);
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
    source:{id:source.id,x:source.x,z:source.z},target:{id:target.id,x:target.x,z:target.z},from:{x:from.x,z:from.z},to:{x:to.x,z:to.z},kind});
   meleeArcs=Math.min(1000000,meleeArcs+1);bursts++;ensureBound();return;
  }
  const shape=profile?.shape??'orb';
  const mesh=shape==='arrow'?new THREE.Mesh(shared.arrow,new THREE.MeshStandardMaterial({
   color:'#b2a48a',metalness:.67,roughness:.40,emissive:'#354a45',emissiveIntensity:.16})):
   new THREE.Mesh(shape==='glyph'?shared.glyph:shared.orb,material(color(kind),.95));
  mesh.position.copy(src);
  if(shape==='arrow'){
   const direction=new THREE.Vector3().subVectors(dst,src);
   if(direction.lengthSq()>.0001)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  }else mesh.scale.setScalar(kind==='warden'?1.8:kind==='mystic'?1.35:1);
  scene.add(mesh);projectiles.push({mesh,src,dst,target:{x:to.x,z:to.z},t:0,
   duration:.18+Math.min(.38,src.distanceTo(dst)*.045),kind,shape,profile});
  shots++;ensureBound();
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
 function accept(s,viewPosition=null){
  const key=s.run+':'+s.floor;
  if(key!==floorKey){reset();floorKey=key;}
  stagePositions=planCombatStage(s,viewPosition);
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
 function recordDamage(beats,snapshot=null){
  if(!Array.isArray(beats))return;
  for(const beat of beats.slice(0,18)){
   const hit=planTrueDamageCue(beat,stagePoint(stagePositions,beat));
   if(!hit){suppressedDamageCues++;continue;}
   // Rendered-frames contact sync is only for validated REAL sword strikes.
   // Health, combat authority, and accessible HUD never wait for this cue.
   const delay=planVerifiedMeleeImpactDelay(beat,snapshot,{reducedMotion});
   const mesh=new THREE.Mesh(shared.spall,material(hit.color,.88));
   mesh.visible=delay===0;
   const anchor=liveInjuryAnchor(beat,hit,actorById);
   mesh.position.copy(V3(anchor.x,anchor.y,anchor.z));mesh.scale.setScalar(hit.scale);
   scene.add(mesh);impacts.push({mesh,life:-delay,contactAge:0,duration:hit.duration,mode:'true-hit',
    startScale:hit.scale,beat:{id:beat.id,x:beat.x,z:beat.z},hit:{x:hit.x,y:hit.y,z:hit.z}});
   if(anchor.skinned)skinnedHitAnchors=Math.min(1000000,skinnedHitAnchors+1);
   // An actual HP decrease owns this entire 3D contact fan. Single instanced
   // draw, six chips ordinarily or ten for a fatal blow, with a .62s cap.
   // All visual offsets are cosmetic and the hit coordinates stay authoritative.
   const shards=planContactShardFan(beat,reducedMotion);
   if(shards.length){
    const fracture=new THREE.InstancedMesh(shared.chip,new THREE.MeshStandardMaterial({
     color:beat.faction==='party'?'#d4b6a1':'#e9c18a',metalness:.4,roughness:.53,
     emissive:hit.color,emissiveIntensity:.11,transparent:true,opacity:.82,
     depthWrite:false,side:THREE.DoubleSide
    }),shards.length);
    fracture.position.copy(V3(anchor.x,anchor.y,anchor.z));
    fracture.frustumCulled=false;
    fracture.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const fractureEffect={mesh:fracture,life:-delay,contactAge:0,duration:beat.fatal?.68:.52,mode:'true-shards',shards};
    fracture.visible=delay===0;
    if(!delay)poseDamageShards(fractureEffect);
    scene.add(fracture);impacts.push(fractureEffect);
   }
   trueDamageCues=Math.min(1000000,trueDamageCues+1);ensureBound();
  }
 }
 // Physical touchdown grit belongs only to a witnessed one-cell escape.
 function recordEvasions(beats){
  if(!Array.isArray(beats))return;
  for(const beat of beats.slice(0,3)){
   if(!Number.isInteger(beat?.from?.x)||!Number.isInteger(beat?.from?.z)||
    !Number.isInteger(beat.dx)||!Number.isInteger(beat.dz)||Math.abs(beat.dx)+Math.abs(beat.dz)!==1)continue;
   const mesh=new THREE.Mesh(shared.dust,new THREE.MeshStandardMaterial({color:'#81796e',
    roughness:1,metalness:0,transparent:true,opacity:.28,depthWrite:false}));
   mesh.position.copy(V3(beat.from.x,.09,beat.from.z));mesh.scale.set(.31,.09,.22);
   scene.add(mesh);impacts.push({mesh,life:0,duration:.42,mode:'evade-dust',dx:beat.dx,dz:beat.dz});
   trueEvadeCues=Math.min(1000000,trueEvadeCues+1);
  }
  ensureBound();
 }
 function animate(frameSeconds){
  const dt=Number.isFinite(frameSeconds)?Math.min(.05,Math.max(0,frameSeconds)):0;
  // Follow the same bounded rendered-frame clock used by authored weapon
  // wind-up; this still works with slow software WebGL without changing ticks.
  for(let i=0;i<pendingCues.length;){
   const cue=pendingCues[i];
   cue.age=cue.source.action==='attack'&&
    ['vanguard','revenant','warden'].includes(cue.source.kind)?
    Math.min(5,cue.age+planVisibleMeleeContactStep(frameSeconds,cue.age)):
    advancePresentationActionAge(cue.age,dt);
   if(cue.age>=cue.delay){pendingCues.splice(i,1);releaseCue(cue);}
   else i++;
  }
  for(let i=projectiles.length-1;i>=0;i--){
   const p=projectiles[i];p.t+=dt;
   const progress=Math.min(1,p.t/p.duration),smooth=progress*progress*(3-2*progress);
   p.mesh.position.lerpVectors(p.src,p.dst,smooth);
   if(!reducedMotion)p.mesh.position.y+=Math.sin(progress*Math.PI)*(p.profile?.arc??.045);
   if(p.shape==='glyph'&&!reducedMotion){
    p.mesh.rotation.y+=dt*(p.profile?.spin??5);
    p.mesh.rotation.x+=dt*2.6;
   }
   p.mesh.material.opacity=.9*(1-progress*.45);
   if(progress>=1){
    // One close-range body flare marks the true target; no extra giant
    // floor circle obscures combat contact or duplicates boss telegraphs.
    // A shot can be dodged/blocked. No unverified hit flare at arrival.
    cleanup(p);projectiles.splice(i,1);
   }
  }
  for(let i=impacts.length-1;i>=0;i--){
   const effect=impacts[i];
   if(effect.life<0){
    const delta=planVisibleMeleeContactStep(frameSeconds,effect.contactAge??0);
    effect.contactAge=(effect.contactAge??0)+delta;effect.life+=delta;
   }else effect.life+=dt;
   if(effect.life<0)continue; // Never show a pre-contact injury on a validated melee stroke.
   effect.mesh.visible=true;
   if(effect.life>=effect.duration){cleanup(effect);impacts.splice(i,1);continue;}
   const t=effect.life/effect.duration;
   if(effect.mode==='true-shards'){
    poseDamageShards(effect);
   }else if(effect.mode==='evade-dust'){
    effect.mesh.material.opacity=.28*(1-t)*(1-t);
    effect.mesh.position.x+=effect.dx*.18*dt/effect.duration;
    effect.mesh.position.z+=effect.dz*.18*dt/effect.duration;
    effect.mesh.scale.set(.31+t*.28,.09+t*.04,.22+t*.19);
   }else if(effect.mode==='spark'){
    effect.mesh.material.opacity=.78*(1-t);
    effect.mesh.scale.setScalar(effect.startScale*(.82+.62*t));
   }else if(effect.mode==='true-hit'){
    const anchor=liveInjuryAnchor(effect.beat,effect.hit,actorById);
    effect.mesh.position.copy(V3(anchor.x,anchor.y,anchor.z));
    effect.mesh.material.opacity=.88*(1-t);
    effect.mesh.scale.setScalar(effect.startScale*(.83+.36*t));
   }else if(effect.mode==='slash'){
    const frame=stagedArcFrame(effect.source,effect.target,effect.from,effect.to,effect.life,reducedMotion,actorById);
    if(frame){
     if(frame.skinnedHand)skinnedArcFrames=Math.min(1000000,skinnedArcFrames+1);
      if(frame.skinnedChest)skinnedChestArcFrames=Math.min(1000000,skinnedChestArcFrames+1);
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
 return{accept,recordDamage,recordEvasions,animate,reset,stats:()=>({trueEvadeCues,activeEvadeDust:impacts.filter(e=>e.mode==='evade-dust').length,trueDamageCues,suppressedDamageCues,activeProjectiles:projectiles.length,activeImpacts:impacts.length,pendingCues:pendingCues.length,healingCues:healingCues,disarmCues:disarmCues,contactLockedCues:contactLockedCues,suppressedUnmatchedCues:suppressedUnmatchedCues,releasedCues:releasedCues,droppedCues:droppedCues,activeGroundRings:impacts.filter(e=>e.mode==='ring').length,activeHitFlashes:impacts.filter(e=>e.mode==='spark').length,activePhysicalDamageFans:impacts.filter(e=>e.mode==='true-shards').length,activePhysicalDamageChips:impacts.filter(e=>e.mode==='true-shards').reduce((n,e)=>n+e.shards.length,0),activeMeleeArcs:impacts.filter(e=>e.mode==='slash').length,totalMeleeArcs:meleeArcs,skinnedArcFrames,skinnedChestArcFrames,skinnedHitAnchors,totalShots:shots,totalBursts:bursts}),dispose(){reset();for(const geometry of Object.values(shared))geometry.dispose()}};
}
