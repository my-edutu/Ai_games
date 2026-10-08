import * as THREE from '/dungeon/vendor/three.module.js';

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
 const projectiles=[],impacts=[],previous=new Map();let floorKey='',shots=0,bursts=0;
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
  scene.add(mesh);projectiles.push({mesh,src,dst,t:0,duration:.18+Math.min(.38,src.distanceTo(dst)*.045),trail:[],kind});shots++;ensureBound();
 }
 function burstAt(unit,hex,large=false){
  const pos=V3(unit.x,.13,unit.z);
  const mesh=new THREE.Mesh(shared.ring,material(hex,.7));mesh.rotation.x=-Math.PI/2;mesh.position.copy(pos);
  scene.add(mesh);impacts.push({mesh,life:0,duration:large?.69:.40,mode:'ring',large});bursts++;ensureBound();
 }
 function signalAction(u,s){
  switch(u.action){
   case 'attack':case 'cast':{
    const target=closest(s.units,u,u.faction==='party'?'enemy':'party');
    if(u.kind==='warden'&&u.action==='cast'){burstAt(u,'#ff653f',true);return;}
    if(target)projectile(u,target,u.kind);break;
   }
   case 'guard':burstAt(u,'#79ffe6');break;
   case 'hurt':burstAt(u,u.faction==='party'?'#ffdf96':'#ff8e85');break;
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
  dt=Math.min(.05,Math.max(0,dt));
  for(let i=projectiles.length-1;i>=0;i--){
   const p=projectiles[i];p.t+=dt;
   const progress=Math.min(1,p.t/p.duration),smooth=progress*progress*(3-2*progress);
   p.mesh.position.lerpVectors(p.src,p.dst,smooth);
   if(!reducedMotion)p.mesh.position.y+=Math.sin(progress*Math.PI)*.045;
   p.mesh.material.opacity=.9*(1-progress*.45);
   if(progress>=1){
    const target=p.dst;
    // Impact rings visually represent completed projectile travel only.
    const m=new THREE.Mesh(shared.ring,material(color(p.kind),.75));
    m.rotation.x=-Math.PI/2;m.position.copy(target);m.position.y=.08;m.scale.setScalar(.22);
    scene.add(m);impacts.push({mesh:m,life:0,duration:.28,mode:'ring'});bursts++;
    cleanup(p);projectiles.splice(i,1);
   }
  }
  for(let i=impacts.length-1;i>=0;i--){
   const effect=impacts[i];effect.life+=dt;
   if(effect.life>=effect.duration){cleanup(effect);impacts.splice(i,1);continue;}
   const t=effect.life/effect.duration;
   effect.mesh.material.opacity=(effect.mode==='slash'?.95:.65)*(1-t);
   effect.mesh.scale.setScalar((effect.mode==='slash'?.6:.22)+t*(effect.large?4:effect.mode==='slash'?1.05:1.15));
   if(effect.mode==='slash')effect.mesh.rotation.z+=dt*6;
  }
  ensureBound();
 }
 function reset(){
  for(const p of projectiles)cleanup(p);for(const p of impacts)cleanup(p);
  projectiles.length=impacts.length=0;previous.clear();
 }
 return{accept,animate,reset,stats:()=>({activeProjectiles:projectiles.length,activeImpacts:impacts.length,totalShots:shots,totalBursts:bursts}),dispose(){reset();for(const geometry of Object.values(shared))geometry.dispose()}};
}
