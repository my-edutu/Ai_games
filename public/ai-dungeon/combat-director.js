import * as THREE from '/dungeon/vendor/three.module.js';
import {combatCueDelay,MAX_PENDING_COMBAT_CUES} from '/dungeon/combat-cue-plan.js';
import {advancePresentationActionAge} from '/dungeon/character-motion-plan.js';

/**
 * Visual-only combat choreographer: never modifies the deterministic RPG.
 * Triggered by authoritative action/actionTick transitions, not fabricated combat.
 */
const TINT={vanguard:'#62cbff',ranger:'#a5ff95',mystic:'#be8aff',revenant:'#ff9659',cultist:'#ff70b3',warden:'#ffbd57'};
const PROJECTILE_LIMIT=26,IMPACT_LIMIT=24;
const V3=(x,y,z)=>new THREE.Vector3(x-9,y,z-9);
const shared={orb:new THREE.IcosahedronGeometry(.13,1),slash:new THREE.TorusGeometry(.45,.057,5,28,Math.PI*1.35),ring:new THREE.RingGeometry(.6,.69,45),spark:new THREE.OctahedronGeometry(.07,0)};
const color=(kind)=>TINT[kind]||'#83fff0';
function material(hex,opacity=.95){
 return new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
}
function closest(units,subject,faction){
 return units.filter(u=>u.faction===faction&&u.hp>0)
 .sort((a,b)=>(Math.abs(a.x-subject.x)+Math.abs(a.z-subject.z))-(Math.abs(b.x-subject.x)+Math.abs(b.z-subject.z))||a.id.localeCompare(b.id))[0]||null;
}
export function createCombatDirector(scene,{reducedMotion=false}={}){
 const projectiles=[],impacts=[],pendingCues=[],previous=new Map();let floorKey='',shots=0,bursts=0,releasedCues=0,droppedCues=0;
 const cleanup=e=>{scene.remove(e.mesh);e.mesh.material.dispose()};
 function ensureBound(){
  while(projectiles.length>PROJECTILE_LIMIT)cleanup(projectiles.shift());
  while(impacts.length>IMPACT_LIMIT)cleanup(impacts.shift());
 }
 function projectile(source,target,kind){
  const src=V3(source.x,kind==='mystic'?1.37:1.21,source.z),dst=V3(target.x,1.18,target.z);
  // Melee strikes need a crescent rather than an arrow teleporting through armour.
  if(src.distanceTo(dst)<1.8&&kind!=='mystic'&&kind!=='cultist'){
   const mesh=new THREE.Mesh(shared.slash,material(color(kind)));mesh.position.copy(src.clone().lerp(dst,.65));
   mesh.rotation.x=Math.PI/2;mesh.rotation.y=Math.atan2(dst.x-src.x,dst.z-src.z);
   mesh.scale.setScalar(kind==='warden'?1.65:.85);scene.add(mesh);
   impacts.push({mesh,life:0,duration:.35,mode:'slash'});bursts++;ensureBound();return;
  }
  const mesh=new THREE.Mesh(shared.orb,material(color(kind),.95));mesh.position.copy(src);mesh.scale.setScalar(kind==='warden'?1.8:kind==='mystic'?1.35:1);
  scene.add(mesh);projectiles.push({mesh,src,dst,target:{x:target.x,z:target.z},t:0,duration:.18+Math.min(.38,src.distanceTo(dst)*.045),kind});shots++;ensureBound();
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
  else if(cue.target)projectile(cue.source,cue.target,cue.source.kind);
  releasedCues++;
 }
 function signalAction(u,s){
  switch(u.action){
   case 'attack':case 'cast':{
    const target=closest(s.units,u,u.faction==='party'?'enemy':'party');
    if(!target&&!(u.kind==='warden'&&u.action==='cast'))return;
    const source={x:u.x,z:u.z,kind:u.kind,action:u.action};
    const cue={source,target:target?{x:target.x,z:target.z}:null,age:0,
     delay:combatCueDelay(u.kind,u.action,reducedMotion)};
    if(cue.delay===0){releaseCue(cue);return;}
    if(pendingCues.length>=MAX_PENDING_COMBAT_CUES){pendingCues.shift();droppedCues++;}
    pendingCues.push(cue);
    break;
   }
   case 'guard':burstAt(u,'#79ffe6');break;
   case 'hurt':flashAt(u,u.faction==='party'?'#ffdf96':'#ff8e85');break;
  }
 }
 function accept(s){
  const key=s.run+':'+s.floor;
  if(key!==floorKey){reset();floorKey=key;}
  const current=new Set();
  for(const u of s.units){
   const id=u.id;current.add(id);
   const previousTick=previous.get(id);
   if(u.hp>0&&previousTick!==undefined&&previousTick!==u.actionTick&&u.action!=='idle'&&u.action!=='move')signalAction(u,s);
   previous.set(id,u.actionTick);
  }
  for(const id of [...previous.keys()])if(!current.has(id))previous.delete(id);
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
    flashAt(p.target,color(p.kind));
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
   }else{
    effect.mesh.material.opacity=(effect.mode==='slash'?.95:.55)*(1-t);
    // Guard circles are tactical and restrained; the authoritative boss
    // warning ring lives on the actor and never gets suppressed here.
    effect.mesh.scale.setScalar((effect.mode==='slash'?.6:.18)+t*(effect.mode==='slash'?1.05:.58));
    if(effect.mode==='slash')effect.mesh.rotation.z+=dt*6;
   }
  }
  ensureBound();
 }
 function reset(){
  for(const p of projectiles)cleanup(p);for(const p of impacts)cleanup(p);
  projectiles.length=impacts.length=pendingCues.length=0;previous.clear();
 }
 return{accept,animate,reset,stats:()=>({activeProjectiles:projectiles.length,activeImpacts:impacts.length,pendingCues:pendingCues.length,releasedCues,droppedCues,activeGroundRings:impacts.filter(e=>e.mode==='ring').length,activeHitFlashes:impacts.filter(e=>e.mode==='spark').length,totalShots:shots,totalBursts:bursts}),dispose(){reset();for(const geometry of Object.values(shared))geometry.dispose()}};
}
