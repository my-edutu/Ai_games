import * as THREE from '/dungeon/vendor/three.module.js';
// Read-only original Warden ritual art. All beams, rings and shatter effects
// derive exclusively from the real public boss/defender/simulation state.
const UP=new THREE.Vector3(0,1,0),LIMIT=3,MAX_RANGE=7,SHATTER_TIME=1.05;
export function createWardenRitual(world,exit,{reducedMotion=false}={}){
 const group=new THREE.Group();group.name='Living Warden ritual court';
 group.position.set(exit.x-9,0,exit.z-9);world.add(group);
 const stone=new THREE.MeshStandardMaterial({color:'#43404a',roughness:.86,metalness:.12});
 const metal=new THREE.MeshStandardMaterial({color:'#aa895b',roughness:.40,metalness:.66});
 const glyph=new THREE.MeshBasicMaterial({color:'#8cbede',transparent:true,opacity:.70,depthWrite:false});
 const conduit=new THREE.MeshBasicMaterial({color:'#a0d3ed',transparent:true,opacity:.56,depthWrite:false});
 const fragmentMat=new THREE.MeshStandardMaterial({color:'#afb5d2',emissive:'#647da5',emissiveIntensity:.6,roughness:.44,metalness:.42,transparent:true,opacity:0});
 const put=(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
  mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);return mesh;
 };
 // A restrained sculpted court gives the sealed boss a unique stage, not a
 // giant translucent effect that can hide real combat or block navigation.
 const plinth=new THREE.CylinderGeometry(.23,.30,.24,8),column=new THREE.CylinderGeometry(.085,.19,.82,7);
 const crest=new THREE.ConeGeometry(.20,.37,7),emblem=new THREE.TorusGeometry(.15,.019,5,24);
 for(let i=0;i<6;i++){
  const angle=i*Math.PI/3+.18,pylon=new THREE.Group();
  pylon.name='Ritual plinth '+i;pylon.position.set(Math.cos(angle)*1.68,0,Math.sin(angle)*1.68);pylon.rotation.y=-angle;
  put(pylon,plinth,stone,0,.12,0);put(pylon,column,metal,0,.61,0);
  put(pylon,crest,stone,0,1.13,0).rotation.z=i%2?-.06:.06;
  put(pylon,emblem,glyph,0,.73,-.128,.7,.7,.7).rotation.y=Math.PI/2;group.add(pylon);
 }
 const rings=[];
 for(const [r,y] of [[1.04,.27],[.86,.85],[.67,1.41]]){
  const mesh=put(group,new THREE.TorusGeometry(r,.017,6,56),glyph,0,y,0);
  mesh.rotation.x=Math.PI/2;rings.push(mesh);
 }
 const tetherGeometry=new THREE.CylinderGeometry(.023,.038,1,7),links=[];
 for(let i=0;i<LIMIT;i++){
  const link=put(group,tetherGeometry,conduit,0,1,0);
  link.name='Authority-backed living ward link '+i;link.visible=false;links.push(link);
 }
 const shards=[],shardGeo=new THREE.TetrahedronGeometry(.12,0);
 for(let i=0;i<12;i++){
  const angle=i*Math.PI/6;
  const shard=put(group,shardGeo,fragmentMat,Math.cos(angle)*.78,1.1+(i%3)*.13,Math.sin(angle)*.78);
  shard.userData.angle=angle;shard.userData.height=shard.position.y;shard.visible=false;shards.push(shard);
 }
 let ward=false,previousWard=null,tick=-1,breakAge=SHATTER_TIME;
 let visible=false,defenders=0,linkCount=0,phase='SENTINEL';
 const from=new THREE.Vector3(),to=new THREE.Vector3(),delta=new THREE.Vector3();
 function accept(s){
  if(!Array.isArray(s?.units))return;
  const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  visible=Boolean(boss);group.visible=visible;
  if(!boss){ward=false;defenders=linkCount=0;for(const link of links)link.visible=false;return;}
  const half=(Array.isArray(s.map)?s.map.length-1:18)/2;
  group.position.set(boss.x-half,0,boss.z-half);
  const minions=s.units.filter(u=>u.faction==='enemy'&&u.kind!=='warden'&&u.hp>0);
  minions.sort((a,b)=>Math.abs(a.x-boss.x)+Math.abs(a.z-boss.z)-Math.abs(b.x-boss.x)-Math.abs(b.z-boss.z)||a.id.localeCompare(b.id));
  defenders=minions.length;ward=Boolean(s.guardianWard);phase=s.bossPhase||'SENTINEL';
  if(previousWard===true&&!ward&&Number.isInteger(s.tick)&&s.tick>tick)breakAge=0;
  previousWard=ward;tick=Number.isInteger(s.tick)?s.tick:tick;
  for(const ring of rings)ring.visible=ward;
  const nearby=ward?minions.filter(u=>Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=MAX_RANGE).slice(0,LIMIT):[];
  for(let i=0;i<LIMIT;i++){
   const link=links[i],unit=nearby[i];link.visible=Boolean(unit);if(!unit)continue;
   from.set(0,1.33,0);to.set(unit.x-boss.x,.83,unit.z-boss.z);
   delta.subVectors(to,from);link.position.copy(from).addScaledVector(delta,.5);
   link.quaternion.setFromUnitVectors(UP,delta.clone().normalize());link.scale.y=delta.length();
  }
  linkCount=nearby.length;
 }
 function animate(time,dt=0){
  if(!visible)return;
  glyph.opacity=ward&&!reducedMotion?.63+.10*Math.sin(time*2):.70;
  rings.forEach((ring,i)=>{ring.rotation.z=ward&&!reducedMotion?Math.sin(time*.45+i)*.07:0;});
  if(breakAge<SHATTER_TIME){
   breakAge=Math.min(SHATTER_TIME,breakAge+Math.max(0,Math.min(.05,dt)));
   const t=breakAge/SHATTER_TIME;
   fragmentMat.opacity=(1-t)*.83;
   for(const shard of shards){
    const angle=shard.userData.angle;
    shard.visible=t<1;
    shard.position.set(Math.cos(angle)*(.78+(reducedMotion?.14:t*.9)),shard.userData.height+(reducedMotion?0:.65*t*t),Math.sin(angle)*(.78+(reducedMotion?.14:t*.9)));
    shard.rotation.set(reducedMotion?0:t*2.6,reducedMotion?0:t*1.8,0);
   }
  }else for(const shard of shards)shard.visible=false;
 }
 return {accept,animate,metrics:()=>({visible,shieldActive:ward,phase,activeDefenders:defenders,activeTethers:linkCount,shattering:breakAge<SHATTER_TIME,maxTethers:LIMIT})};
}
