import * as THREE from '/dungeon/vendor/three.module.js';
import {planWardenCourt} from '/dungeon/warden-court-plan.js';
import {planPartyWallReveal,createCutawayBandCache,shouldUploadCutawayBand} from '/dungeon/party-visibility-plan.js';

/**
 * Original physical court: embossed walkable procession, sculpted wall
 * relics and genuine boss-following iron seal with one bounded practical.
 * This owns no AI, collision, health, attack, floor or RNG authority.
 */
export function createWardenCourt(world,map,exit,floor){
 const plan=planWardenCourt(map,exit,floor),root=new THREE.Group();
 root.name='Original living Warden chapter';world.add(root);
 const geometry=[],materials=[],textures=[];
 const ownGeo=g=>(geometry.push(g),g),ownMat=m=>(materials.push(m),m);
 const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),
  matrix=new THREE.Matrix4(),up=new THREE.Vector3(0,1,0);
 function batch(geo,mat,items,place,name){
  const mesh=new THREE.InstancedMesh(geo,mat,items.length);mesh.name=name;mesh.frustumCulled=false;
  items.forEach((item,i)=>place(mesh,i,item,false));mesh.instanceMatrix.needsUpdate=true;
  root.add(mesh);return mesh;
 }
 const shield=new THREE.Shape();
 shield.moveTo(0,-.29);shield.bezierCurveTo(-.14,-.16,-.27,-.06,-.23,.19);
 shield.lineTo(-.14,.30);shield.lineTo(0,.40);shield.lineTo(.14,.30);
 shield.lineTo(.23,.19);shield.bezierCurveTo(.27,-.06,.14,-.16,0,-.29);
 const reliefGeo=ownGeo(new THREE.ExtrudeGeometry(shield,{depth:.065,steps:1,
  bevelEnabled:true,bevelThickness:.024,bevelSize:.023,bevelSegments:2,curveSegments:5}));
 const crestGeo=ownGeo(new THREE.TorusGeometry(.175,.018,7,24,Math.PI).rotateZ(Math.PI));
 const reliefMat=ownMat(new THREE.MeshStandardMaterial({color:'#4e5057',roughness:.87,metalness:.18}));
 const brassMat=ownMat(new THREE.MeshStandardMaterial({color:'#c1a17c',roughness:.37,metalness:.72}));
 function reliefPose(mesh,i,item,hidden=false,arc=false){
  position.set(item.x,arc?1.21:.98,item.z);
  rotation.setFromAxisAngle(up,item.yaw);
  scale.setScalar(hidden ? .0001 : 1);matrix.compose(position,rotation,scale);
  mesh.setMatrixAt(i,matrix);
 }
 const relief=batch(reliefGeo,reliefMat,plan.facades,(m,i,v,h)=>reliefPose(m,i,v,h),'Ward-court carved shield reliefs');
 const crest=batch(crestGeo,brassMat,plan.facades,(m,i,v,h)=>reliefPose(m,i,v,h,true),'Ward-court forged iron crests');
 // Original linework is recorded in a tiny alpha atlas. The physics floor
 // stays empty: these are low, depth-tested inscriptions, not hazards.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,128,128);
 ctx.strokeStyle='#e2cda7aa';ctx.lineWidth=2.1;
 for(const radius of [31,43]){ctx.beginPath();ctx.arc(64,64,radius,0,Math.PI*2);ctx.stroke();}
 ctx.beginPath();ctx.moveTo(64,12);ctx.lineTo(83,64);ctx.lineTo(64,116);
 ctx.lineTo(45,64);ctx.closePath();ctx.stroke();
 for(let i=0;i<8;i++){const t=i*Math.PI/4;ctx.beginPath();
  ctx.moveTo(64+Math.cos(t)*36,64+Math.sin(t)*36);
  ctx.lineTo(64+Math.cos(t)*43,64+Math.sin(t)*43);ctx.stroke();}
 const atlas=new THREE.CanvasTexture(canvas);atlas.colorSpace=THREE.SRGBColorSpace;textures.push(atlas);
 const sealMat=ownMat(new THREE.MeshStandardMaterial({map:atlas,color:['#c4ba9e','#e5ab7a','#9cbcd9','#c0a1ca'][(floor-1)%4],
  transparent:true,opacity:.54,metalness:.36,roughness:.62,depthWrite:false,side:THREE.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-1}));
 const tileGeo=ownGeo(new THREE.PlaneGeometry(.85,.85).rotateX(-Math.PI/2));
 const procession=batch(tileGeo,sealMat,plan.tiles,(mesh,i,tile)=>{
  position.set(tile.x,.054,tile.z);rotation.setFromAxisAngle(up,tile.yaw);scale.set(1,1,1);
  matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);
 },'Etched processional tiles');
 const bindingMat=ownMat(new THREE.MeshStandardMaterial({color:'#b89f74',emissive:'#ab8558',
  emissiveIntensity:.23,transparent:true,opacity:.67,depthWrite:false,
  metalness:.51,roughness:.43,side:THREE.DoubleSide}));
 const binding=new THREE.Mesh(ownGeo(new THREE.RingGeometry(.64,.74,56)),bindingMat);
 binding.name='Actual living boss binding seal';binding.rotation.x=-Math.PI/2;
 binding.visible=false;root.add(binding);
 const bossKey=new THREE.PointLight('#f2b67d',0,4.7,2);bossKey.castShadow=false;root.add(bossKey);
 const bands=createCutawayBandCache(plan.facades.length);
 const metrics={reliefs:plan.facades.length,processionTiles:plan.tiles.length,
  dynamicLights:1,originalAssets:true,activeBoss:false,bossWarning:false,phase:'NONE',
  cutawayReliefs:0,matrixWrites:0,collisionChanged:false};
 let active=false,warn=false,recover=false,phase='NONE';
 const intensity=()=>!active?0:warn?1.75:recover?1.45:1.05;
 function accept(s){
  const boss=s?.units?.find(u=>u.kind==='warden'&&u.faction==='enemy'&&u.hp>0);
  active=Boolean(boss&&Number.isInteger(boss.x)&&Number.isInteger(boss.z));
  warn=active&&Array.isArray(s.bossWarning?.cells)&&s.bossWarning.cells.length>0;
  recover=active&&Number.isInteger(s.bossRecovery?.remaining)&&s.bossRecovery.remaining>0;
  phase=active?String(s.bossPhase||'SENTINEL'):'NONE';
  binding.visible=active;bossKey.intensity=intensity();
  if(active){
   binding.position.set(boss.x-plan.origin,.071,boss.z-plan.origin);
   bossKey.position.set(boss.x-plan.origin+.18,1.8,boss.z-plan.origin+.18);
  }
  const hue=phase==='ECLIPSE'?'#c39ad6':phase==='RUPTURE'?'#e1a475':'#bba783';
  bindingMat.color.set(hue);bindingMat.emissive.set(hue);
  bindingMat.emissiveIntensity=warn?.82:recover?.44:.23;
  bindingMat.opacity=warn?.85:.64;
  sealMat.opacity=active?.68:.54;
  Object.assign(metrics,{activeBoss:active,bossWarning:warn,phase});
 }
 function animate(time){
  if(active){bossKey.intensity=intensity()*(1+.022*Math.sin(time*1.4));
   binding.rotation.z=Math.sin(time*.72)*.027;}
 }
 function cutaway(eyes,camera,pad){
  let hidden=0,writes=0;
  for(let i=0;i<plan.facades.length;i++){
   const v=plan.facades[i],reveal=planPartyWallReveal(v.x,v.z,eyes,camera,pad);
   const band=reveal==='sightline'?2:reveal==='nearby'?1:0;
   if(band)hidden++;
   if(!shouldUploadCutawayBand(bands,i,band))continue;
   reliefPose(relief,i,v,Boolean(band));reliefPose(crest,i,v,Boolean(band),true);writes++;
  }
  if(writes){relief.instanceMatrix.needsUpdate=true;crest.instanceMatrix.needsUpdate=true;}
  metrics.cutawayReliefs=hidden;metrics.matrixWrites=writes;
 }
 return {accept,animate,cutaway,metrics,dispose(){
  root.removeFromParent();for(const g of geometry)g.dispose();
  for(const m of materials)m.dispose();for(const t of textures)t.dispose();
 }};
}
