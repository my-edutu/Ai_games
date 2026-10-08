import * as THREE from '/dungeon/vendor/three.module.js';
import {enrichEnvironment} from '/dungeon/environment.js';
import {enrichCharacter} from '/dungeon/characters.js';
import {createBiomeAtmosphere} from '/dungeon/biome-atmosphere.js';
import {createCombatOverlay} from '/dungeon/combat-overlay.js';
import {createCombatDirector} from '/dungeon/combat-director.js';
import {addContactProjection} from '/dungeon/contact-projection.js';
import {attachCharacter,updateActor,disposeActorAsset,putEnvironment,stats as assetStats} from '/dungeon/model-assets.js';
const $=id=>document.getElementById(id),canvas=$('world'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let focusedHeroId='vanguard',autoDirector=true,lastAutoSwitch=0;
function directCamera(s){
 const alive=s.units.filter(u=>u.faction==='party'&&u.hp>0);
 if(!alive.length)return;
 const current=alive.find(u=>u.id===focusedHeroId);
 if(!autoDirector&&current)return;
 const now=performance.now();
 if(current&&now-lastAutoSwitch<4800)return;
 const foes=s.units.filter(u=>u.faction==='enemy'&&u.hp>0);
 const priority=alive.map(u=>{
  const minDist=foes.length?Math.min(...foes.map(f=>Math.abs(f.x-u.x)+Math.abs(f.z-u.z))):100;
  return {u,score:(u.action==='attack'?8:u.action==='cast'?9:u.action==='hurt'?6:0)+(minDist<=3?3:0)-(u.hp/u.maxHp<.25?2:0)}
 }).sort((a,b)=>b.score-a.score||a.u.id.localeCompare(b.u.id));
 const select=priority[0]?.u;
 if(!select||select.id===focusedHeroId)return;
 focusedHeroId=select.id;lastAutoSwitch=now;
 $('focus-label').textContent='DIRECTOR FOLLOW · '+(classMeta[select.kind]?.name||select.kind).toUpperCase();
}
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.info.autoReset=false;renderer.shadowMap.enabled=!reduced;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new THREE.Scene();scene.background=new THREE.Color('#070d18');scene.fog=new THREE.FogExp2('#090f1a',.024);
const camera=new THREE.PerspectiveCamera(50,1,.1,110);
// Deferred, optional 3D post-processing: selective emissive bloom adds light without
// sacrificing the whole scene to fog/black overlays. Direct WebGL remains fallback.
let composer=null,bloomPass=null,postFXEnabled=!reduced,postFXStatus='loading';
const fxButton=$('fx-toggle');
fxButton.setAttribute('aria-pressed',String(postFXEnabled));
fxButton.addEventListener('click',()=>{
 postFXEnabled=!postFXEnabled;
 fxButton.setAttribute('aria-pressed',String(postFXEnabled));
 fxButton.querySelector('span').textContent=postFXEnabled?'MAGIC GLOW ON':'MAGIC GLOW OFF';
});
async function initializePostFX(){
 try{
  const [c,r,b,o]=await Promise.all([
   import('/dungeon/vendor/addons/postprocessing/EffectComposer.js'),
   import('/dungeon/vendor/addons/postprocessing/RenderPass.js'),
   import('/dungeon/vendor/addons/postprocessing/UnrealBloomPass.js'),
   import('/dungeon/vendor/addons/postprocessing/OutputPass.js')
  ]);
  const pipeline=new c.EffectComposer(renderer);
  pipeline.setPixelRatio(renderer.getPixelRatio());
  pipeline.addPass(new r.RenderPass(scene,camera));
  bloomPass=new b.UnrealBloomPass(new THREE.Vector2(Math.max(1,canvas.clientWidth),Math.max(1,canvas.clientHeight)),.29,.36,.9);
  pipeline.addPass(bloomPass);pipeline.addPass(new o.OutputPass());
  pipeline.setSize(Math.max(1,canvas.clientWidth),Math.max(1,canvas.clientHeight));
  composer=pipeline;postFXStatus='ready';
 }catch(error){composer=null;postFXStatus='unavailable';postFXEnabled=false;fxButton.title='Post effects unavailable: using direct 3D rendering';fxButton.setAttribute('aria-pressed','false');fxButton.querySelector('span').textContent='DIRECT 3D';console.warn('[DUNGEON] optional bloom unavailable:',String(error))}
}
initializePostFX();
const ambient=new THREE.HemisphereLight('#9da8c8','#533b35',1.85);scene.add(ambient);
const wardenSpot=new THREE.PointLight('#ffbd76',0,9.5,2);scene.add(wardenSpot);
const moon=new THREE.DirectionalLight('#ffe0b2',1.65);moon.position.set(-7,17,5);moon.castShadow=!reduced;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-17;moon.shadow.camera.right=17;moon.shadow.camera.top=17;moon.shadow.camera.bottom=-17;scene.add(moon);
const partyGlow=new THREE.PointLight('#50e9ff',1.65,7.7,2);partyGlow.position.set(0,2,0);scene.add(partyGlow);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:'#080e17',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.17;scene.add(ground);
const actors=new Map(),world=new THREE.Group();scene.add(world);
const combatOverlay=createCombatOverlay($('battle-overlay'));
const combatDirector=createCombatDirector(scene,{reducedMotion:reduced});
const floorThemes=[
 {sky:'#0b2032',fog:'#143047',torch:'#ffb45c',accent:'#5cf1d2',fill:'#75adcf'},
 {sky:'#291324',fog:'#341b2e',torch:'#ffaf55',accent:'#fe806f',fill:'#a66d9a'},
 {sky:'#101b3b',fog:'#1a2452',torch:'#82f7ef',accent:'#72bbff',fill:'#648ed5'},
 {sky:'#251343',fog:'#2f1b4d',torch:'#d39bff',accent:'#fc91c8',fill:'#aa8ae2'}
];let lastCutawayKey='';
const cachedVec=new THREE.Vector3(),cachedQuat=new THREE.Quaternion(),cachedScale=new THREE.Vector3(),cachedMatrix=new THREE.Matrix4();
function cutawayWalls(target){
 const dx=camera.position.x-target.x,dz=camera.position.z-target.z,length=Math.max(.001,Math.hypot(dx,dz));
 const dirX=dx/length,dirZ=dz/length;
 const key=[Math.round(target.x),Math.round(target.z),Math.round(camera.position.x),Math.round(camera.position.z)].join(':');
 if(key===lastCutawayKey)return;lastCutawayKey=key;
 const mesh=world.userData.walls,positions=world.userData.wallPositions;if(!mesh||!positions)return;
 let cut=0;
 for(let i=0;i<positions.length;i++){
  const p=positions[i],x=p[0]-target.x,z=p[1]-target.z;
  const forward=x*dirX+z*dirZ,lateral=Math.abs(x*dirZ-z*dirX);
  // Any foreground masonry intersecting the isometric eye-to-hero corridor
  // collapses into a low foundation course; distant walls stay full height.
  const occluding=forward>-.35&&forward<length+1.1&&lateral<2.55+forward*.18;
  const height=occluding?.18:2.6;if(occluding)cut++;
  cachedVec.set(p[0],height/2-.03,p[1]);cachedScale.set(1.015,height,1.015);
  cachedMatrix.compose(cachedVec,cachedQuat,cachedScale);mesh.setMatrixAt(i,cachedMatrix);
 }
 world.userData.cutawayWalls=cut;
 let removed=0;
 for(const group of world.userData.foregroundProps||[]){
  const x=group.position.x-target.x,z=group.position.z-target.z;
  const distance=x*dirX+z*dirZ,lateral=Math.abs(x*dirZ-z*dirX);
  const blocked=distance>0&&distance<length+1&&lateral<2+distance*.17;
  group.visible=!blocked;if(blocked)removed++;
 }
 world.userData.hiddenForegroundProps=removed;
 mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
}
const particles=[],MAX_PARTICLES=72;const seenEventIds=new Set();
const effects=[],MAX_EFFECTS=12,ringGeometry=new THREE.RingGeometry(.92,1,56),shockGeometry=new THREE.RingGeometry(2.5,2.7,64);
let shakeStrength=0;
function pulseFX(event,s){
 if(reduced)return;
 let origin,theme='#51fff0',big=false;
 if(event.kind==='phase'||event.kind==='telegraph'||(event.kind==='danger'&&event.text.includes('Warden'))){
  origin=s.units.find(u=>u.kind==='warden');theme=event.kind==='phase'?'#e19aff':event.kind==='danger'?'#ff4d86':'#ffba70';big=true;shakeStrength=event.kind==='danger'?.11:shakeStrength;
 }else if(event.kind==='healing'||event.kind==='loot'){origin=s.units.find(u=>u.id==='mystic')||s.units[0];theme='#5fffe4'}
 else if(event.kind==='kill'){origin=s.units.find(u=>u.faction==='enemy'&&u.hp<=0);theme='#ffd27d'}
 if(!origin)return;
 if(effects.length>=MAX_EFFECTS){const oldest=effects.shift();scene.remove(oldest.mesh);oldest.mesh.material.dispose()}
 const material=new THREE.MeshBasicMaterial({color:theme,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
 const mesh=new THREE.Mesh(big?shockGeometry:ringGeometry,material);
 mesh.rotation.x=-Math.PI/2;mesh.position.set(origin.x-9,.08,origin.z-9);mesh.scale.setScalar(big?.2:.14);
 scene.add(mesh);effects.push({mesh,life:0,duration:big?.8:.55,large:big});
}
const particleGeo=new THREE.OctahedronGeometry(.07,0);
function disposeParticle(p){scene.remove(p.mesh);p.mesh.material.dispose()}
function cue(event,s){
 if(reduced)return;
 pulseFX(event,s);
 const colors={kill:'#ffe3a0',combat:'#e99159',danger:'#ef5864',phase:'#efb7ff',guard:'#72ffdf',evade:'#88b9ff',block:'#92eaff',trap:'#ff646c',disarm:'#74f8be',telegraph:'#ffb77b',healing:'#58ebba',loot:'#66d7e5',floor:'#d7bbff'};
 const color=colors[event.kind];if(!color)return;
 const target=event.kind==='danger'?s.units.find(u=>u.faction==='party'&&u.hp>0):event.kind==='kill'?s.units.find(u=>u.kind==='warden'&&u.hp>0):s.units.find(u=>u.id==='mystic')||s.units[0];
 const x=(target?.x??s.exit.x)-9,z=(target?.z??s.exit.z)-9;
 const count=event.kind==='floor'?15:8;
 for(let i=0;i<count;i++){if(particles.length>=MAX_PARTICLES)disposeParticle(particles.shift());
  const angle=i*2.399963+event.tick*.25,velocity=.4+(i%4)*.15;
  const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false});
  const mesh=new THREE.Mesh(particleGeo,material);mesh.position.set(x,1.2+(i%3)*.09,z);mesh.scale.setScalar(.55+(i%3)*.27);scene.add(mesh);
  particles.push({mesh,life:0,duration:.45+(i%3)*.18,vx:Math.cos(angle)*velocity,vy:.5+(i%5)*.16,vz:Math.sin(angle)*velocity});
 }
}
let state=null,worldFloor='',received=false,lastTick=-1,errorAt=0;
const palette={vanguard:['#4a87a8','#bed8df','#eab967'],ranger:['#527c58','#bdd19f','#d2b178'],mystic:['#65508f','#c2abf0','#76d8e0'],revenant:['#54656e','#b3c4bd','#dfb76f'],cultist:['#743e4c','#b18a89','#f0636b'],warden:['#483552','#c79a62','#ec7f42']};
const mat=(color,metalness=.1,roughness=.75)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const stone=mat('#26303d',.1,.95),stoneEdge=mat('#404957',.15,.88),floorMat=mat('#28313b',.05,.95),gold=mat('#c9a366',.7,.33),black=mat('#111724',.2,.8);
const tealGlow=new THREE.MeshStandardMaterial({color:'#53aebc',emissive:'#228a98',emissiveIntensity:2.2,roughness:.2});
const dangerGlow=new THREE.MeshStandardMaterial({color:'#e67f50',emissive:'#bd4f18',emissiveIntensity:2.3});
const geo={cube:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(1,12,8),cylinder:new THREE.CylinderGeometry(1,1,1,10),cone:new THREE.ConeGeometry(1,1,10)};
const make=(geometry,material,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=!reduced;o.receiveShadow=true;parent.add(o);return o};
function column(parent,x,z){
 const group=new THREE.Group();group.position.set(x,0,z);
 make(geo.cylinder,stoneEdge,group,0,.95,0,.26,1.95,.26);
 make(geo.cylinder,gold,group,0,1.93,0,.4,.12,.4);
 make(geo.cylinder,stoneEdge,group,0,.12,0,.37,.24,.37);
 parent.add(group);parent.userData.foregroundProps?.push(group);return group;
}
function disposeActor(a){
 a.ground?.dispose();disposeActorAsset(a);a.detail?.dispose();
 const protectedMaterials=new Set([stone,stoneEdge,floorMat,gold,black,tealGlow,dangerGlow]),seenMat=new Set(),seenGeo=new Set();
 a.root.traverse(o=>{
  if(o.geometry&&!o.userData.sharedAssetGeometry&&!Object.values(geo).includes(o.geometry)&&!seenGeo.has(o.geometry)){seenGeo.add(o.geometry);o.geometry.dispose()}
  const list=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
  for(const m of list)if(!seenMat.has(m)&&!protectedMaterials.has(m)){seenMat.add(m);m.dispose()}
 });
 scene.remove(a.root);
}
function clearWorld(){combatDirector.reset();world.userData.atmosphere?.dispose();world.userData.atmosphere=null;world.userData.dressing?.dispose();world.userData.dressing=null;while(world.children.length){const obj=world.children[0];world.remove(obj);obj.traverse(o=>{if(o.geometry&&!o.userData.sharedAssetGeometry&&!Object.values(geo).includes(o.geometry))o.geometry.dispose();if(o.material&&!o.userData.sharedAssetGeometry&&!Object.values({stone,stoneEdge,floorMat,gold,black,tealGlow,dangerGlow}).includes(o.material)){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)m.dispose()}})}for(const a of actors.values())disposeActor(a);actors.clear()}
function buildWorld(s){clearWorld();worldFloor=s.run+'-'+s.floor;world.userData.sceneKey=worldFloor;world.userData.foregroundProps=[];lastCutawayKey='';
 const theme=floorThemes[(s.floor-1)%floorThemes.length];scene.background=new THREE.Color(theme.sky);scene.fog.color.set(theme.fog);moon.color.set(theme.fill);ambient.intensity=1.7;
 const floors=[],walls=[],trim=[];const size=s.map.length,offset=Math.floor(size/2);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const px=x-offset,pz=z-offset;
  if(s.map[z][x]==='.'){floors.push([px,-.10,pz]);if((x*13+z*7)%11===0)trim.push([px,-.028,pz])}
  else walls.push([px,1.27,pz]);
 }
 const instance=(geometry,material,data,scale)=>{const mesh=new THREE.InstancedMesh(geometry,material,data.length);const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scaling=new THREE.Vector3(...scale);for(let i=0;i<data.length;i++){position.set(...data[i]);matrix.compose(position,quaternion,scaling);mesh.setMatrixAt(i,matrix)}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=!reduced;mesh.receiveShadow=true;world.add(mesh)};
 instance(geo.cube,floorMat,floors,[.99,.16,.99]);
 instance(geo.cube,stone,walls,[1.015,2.6,1.015]);world.userData.walls=world.children[world.children.length-1];world.userData.wallPositions=walls.map(([x,,z])=>[x,z]);
 instance(geo.cube,stoneEdge,trim,[.86,.02,.86]);
 // Multiple architecturally distinct layers: foundation courses, arches, broken stone tiles and inlaid runes.
 const topBricks=[],footBricks=[],runes=[],stonePavers=[],shards=[],caps=[];
 const fracture=(x,z)=>((x*73+z*139+s.floor*41+4096)&1023);
 for(let z=1;z<size-1;z++)for(let x=1;x<size-1;x++){
  const wx=x-offset,wz=z-offset,f=fracture(x,z);
  if(s.map[z][x]==='#'){
   if(f%3===0)topBricks.push([wx,2.53,wz]);
   if(f%4===0)footBricks.push([wx,.1,wz]);
   if(s.map[z-1][x]==='.'&&f%7===0)caps.push([wx,2.6,wz-.34]);
  }else{
   if(f%4===0)stonePavers.push([wx,-.005,wz]);
   if(f%17===0)runes.push([wx,.008,wz]);
   if(f%11===0)shards.push([wx+.26,.10,wz-.22]);
  }
 }
 const ornament=mat(theme.accent,.5,.5),blackStone=mat('#171c29',.15,.98),runeMat=new THREE.MeshStandardMaterial({color:theme.torch,emissive:theme.torch,emissiveIntensity:1.6,roughness:.35});
 const garnish=(material,data,scale)=>{if(!data.length)return;const mesh=new THREE.InstancedMesh(geo.cube,material,data.length);const m=new THREE.Matrix4(),p=new THREE.Vector3(),sc=new THREE.Vector3(...scale),rot=new THREE.Quaternion();
  for(let i=0;i<data.length;i++){p.set(...data[i]);m.compose(p,rot,sc);mesh.setMatrixAt(i,m)}mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;world.add(mesh)};
 garnish(stoneEdge,topBricks,[1.04,.12,1.04]);garnish(blackStone,footBricks,[1.035,.21,1.035]);
 garnish(stoneEdge,stonePavers,[.86,.025,.86]);garnish(runeMat,runes,[.52,.009,.10]);
 garnish(ornament,caps,[.30,.23,.35]);garnish(blackStone,shards,[.16,.17,.20]);
 // Decorated arches are constructed only at certain long corridors; avoid hiding characters.
 for(let z=2;z<size-2;z++)for(let x=2;x<size-2;x++){
   if(s.map[z][x]!==' .'&&s.map[z][x]!=='.')continue;
   if(fracture(x,z)%19!==0)continue;
   const horizontal=s.map[z][x-1]==='.'&&s.map[z][x+1]==='.';
   const vertical=s.map[z-1][x]==='.'&&s.map[z+1][x]==='.';
   if(!horizontal&&!vertical)continue;
   const ax=x-offset,az=z-offset,arch=new THREE.Group();arch.position.set(ax,0,az);
   if(horizontal)arch.rotation.y=Math.PI/2;
   make(geo.cube,stoneEdge,arch,-.43,.95,0,.16,1.9,.18);
   make(geo.cube,stoneEdge,arch,.43,.95,0,.16,1.9,.18);
   make(geo.cube,ornament,arch,0,1.88,0,.98,.22,.20);
   make(geo.cube,gold,arch,0,2.02,0,.22,.06,.23);
   world.add(arch);world.userData.foregroundProps.push(arch);
 }

 // Lit path markers, carved stone columns and modest dynamic lighting budget.
 const corners=[[1,1],[17,1],[1,17],[17,17],[s.exit.x,s.exit.z]];
 corners.forEach(([x,z],i)=>{const px=x-offset,pz=z-offset;column(world,px+.43,pz+.43);const lantern=make(geo.sphere,i===4?tealGlow:dangerGlow,world,px+.43,2.15,pz+.43,.11,.19,.11);lantern.castShadow=false;if(i<3){const light=new THREE.PointLight(i===4?'#4af6e2':theme.torch,i===4?5:3,9,2);light.position.copy(lantern.position);world.add(light)}});
 // Ruined altars and relic vaults are used sparingly to preserve navigational readability.
 const openCells=floors.filter(([x,,z])=>(Math.abs(x)+Math.abs(z))>3&&Math.abs(x)+Math.abs(z)<22);
 let placed=0;
 for(const [px,,pz] of openCells){if(placed>=10)break;const k=fracture(px+offset,pz+offset);
  if(k%47!==0)continue;placed++;
  const shrine=new THREE.Group();shrine.position.set(px,.02,pz);
  make(geo.cylinder,stoneEdge,shrine,0,.13,0,.24,.24,.24);
  make(geo.cylinder,gold,shrine,0,.27,0,.20,.045,.20);
  const gem=make(geo.cone,k%2?tealGlow:dangerGlow,shrine,0,.49,0,.12,.37,.12);gem.rotation.z=.1;world.add(shrine);world.userData.foregroundProps.push(shrine);
 }

 const pos=new THREE.Vector3(s.exit.x-offset,.05,s.exit.z-offset);
 const dais=make(geo.cylinder,stoneEdge,world,pos.x,.02,pos.z,.64,.15,.64);dais.castShadow=false;
 const portal=new THREE.Group();portal.position.set(pos.x,.28,pos.z);const ring=new THREE.Mesh(new THREE.TorusGeometry(.47,.075,9,40),tealGlow);ring.rotation.x=Math.PI/2;portal.add(ring);
 const inner=new THREE.Mesh(new THREE.CircleGeometry(.43,32),new THREE.MeshBasicMaterial({color:'#27f0cc',transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));inner.rotation.x=-Math.PI/2;portal.add(inner);world.add(portal);world.userData.portal=portal;
 s.relics.forEach((r,i)=>{const gem=make(new THREE.OctahedronGeometry(.19,0),tealGlow,world,r.x-offset,.4,r.z-offset,.8,1.2,.8);gem.userData.relic=i});
 // Procedural decorative vaulted gate framing the final encounter.
 const gx=pos.x+.9,gz=pos.z;column(world,gx,gz-.8);column(world,gx,gz+.8);
 make(geo.cube,gold,world,gx,2.2,gz,.32,.22,1.9);
 // Warden court: layered ceremonial dais, spatially legible runes and shield ring.
 const court=new THREE.Group();court.position.set(pos.x,.03,pos.z);
 const courtGlow=new THREE.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide});
 const outer=new THREE.Mesh(new THREE.TorusGeometry(1.35,.033,6,72),courtGlow);outer.rotation.x=-Math.PI/2;court.add(outer);
 const middle=new THREE.Mesh(new THREE.TorusGeometry(1.05,.045,8,68),courtGlow);middle.rotation.x=-Math.PI/2;court.add(middle);
 const ink=new THREE.MeshStandardMaterial({color:'#1b2850',metalness:.8,roughness:.26});
 for(let i=0;i<12;i++){const a=i*Math.PI/6,marker=make(geo.cube,i%3===0?gold:tealGlow,court,Math.cos(a)*1.21,.03,Math.sin(a)*1.21,.18,.04,.05);marker.rotation.y=-a}
 for(let i=0;i<4;i++){const a=i*Math.PI/2+.4,x=Math.cos(a)*1.66,z=Math.sin(a)*1.66;
  if(x+pos.x>8.6||z+pos.z>8.6||x+pos.x< -8.6||z+pos.z< -8.6)continue;
  const spire=make(geo.cone,ink,court,x,.44,z,.19,.88,.19);spire.rotation.z=Math.sin(a)*.10;
  make(geo.sphere,i%2?dangerGlow:tealGlow,court,x,.90,z,.14,.14,.14);
 }
 const shield=new THREE.Mesh(new THREE.TorusGeometry(1.32,.04,8,72),new THREE.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide}));shield.rotation.x=-Math.PI/2;shield.position.y=.12;court.add(shield);
 world.add(court);world.userData.court=court;world.userData.courtShield=shield;
 // Interactive hazard meshes directly reflect authoritative trap state.
 const hazardMeshes=new Map();
 for(const t of s.traps||[]){
  const hazard=new THREE.Group();hazard.position.set(t.x-offset,.018,t.z-offset);
  const fire=t.kind==='ember',base=new THREE.Mesh(new THREE.CylinderGeometry(.44,.47,.08,12),stoneEdge);base.position.y=.02;hazard.add(base);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.048,8,32),fire?dangerGlow:tealGlow);ring.rotation.x=-Math.PI/2;ring.position.y=.077;hazard.add(ring);
  for(let k=0;k<6;k++){const angle=k*Math.PI/3,r=.30;
   const mark=make(geo.cube,k%2?gold:fire?dangerGlow:tealGlow,hazard,Math.cos(angle)*r,.10,Math.sin(angle)*r,.09,.028,.055);mark.rotation.y=angle}
  const charge=make(geo.cone,fire?dangerGlow:tealGlow,hazard,0,.23,0,.11,.25,.11);
  hazard.userData={charge,ring,active:t.active};world.add(hazard);hazardMeshes.set(t.id,hazard);
 }
 world.userData.hazardMeshes=hazardMeshes;
 world.userData.dressing=enrichEnvironment(world,s.map,s.floor);
 world.userData.atmosphere=createBiomeAtmosphere(world,s.map,s.floor,s.exit);
 world.userData.authoredProps=putEnvironment(world,worldFloor,s.map);
}
function rig(u){const colors=palette[u.kind],main=mat(colors[0],.5,.4),light=mat(colors[1],.45,.4),accent=mat(colors[2],.55,.3),enemy=u.faction==='enemy',boss=u.kind==='warden';
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);const scale=boss?1.55:enemy?1.04:1;root.scale.setScalar(scale);
 const torso=make(geo.cylinder,main,body,0,1.03,0,.29,.60,.22);torso.rotation.z=enemy ? .08 : 0;
 make(geo.cube,light,body,0,1.20,-.14,.47,.21,.38);
 // Individually recognisable silhouettes: armoured knight, leather ranger, robed spellcaster, and towering boss.
 for(const side of [-1,1]){
   const shoulder=make(geo.sphere,light,body,side*.37,1.33,0,.24,.16,.23);shoulder.rotation.z=side*.26;
   const shoulderRim=make(geo.cube,accent,body,side*.37,1.31,-.19,.26,.09,.08);shoulderRim.rotation.z=side*.22;
   make(geo.cylinder,main,body,side*.16,.86,0,.14,.13,.14);
 }
 const belt=make(geo.cube,gold,body,0,.84,-.16,.50,.085,.31);belt.castShadow=false;
 if(u.kind==='mystic'||u.kind==='cultist'){
   const mantle=make(geo.cone,main,body,0,.62,0,.39,.91,.32);
   mantle.rotation.z=.02;make(geo.sphere,accent,body,0,1.21,-.28,.11,.12,.06);
 }
 if(u.kind==='vanguard'||boss){make(geo.cube,accent,body,0,1.35,-.272,.22,.22,.035);}
 if(u.kind==='ranger'){const hood=make(geo.cone,main,body,0,1.81,.055,.30,.37,.32);hood.rotation.x=.18;}

 const head=make(geo.sphere,light,body,0,1.58,0,.23,.25,.22);
 const helm=make(geo.cylinder,main,body,0,1.77,0,.25,.16,.25);helm.rotation.z=.06;
 const crown=make(geo.cone,accent,body,0,1.97,.01,boss?.23:.09,boss?.46:.27,boss?.23:.09);
 if(boss){for(const side of [-1,1]){const blade=make(geo.cone,accent,body,side*.24,1.95,0,.10,.52,.10);blade.rotation.z=-side*.26}
  const shoulderSpikes=make(geo.cone,accent,body,-.40,1.64,0,.14,.39,.14);shoulderSpikes.rotation.z=.35;
 }

 const face=make(geo.cube,enemy?dangerGlow:tealGlow,body,0,1.59,-.212,.25,.055,.065);face.castShadow=false;
 const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.15,.73,0);rightLeg.position.set(.15,.73,0);body.add(leftLeg,rightLeg);
 make(geo.cylinder,main,leftLeg,0,-.3,0,.105,.59,.12);make(geo.cylinder,main,rightLeg,0,-.3,0,.105,.59,.12);
 const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(-.35,1.27,0);rightArm.position.set(.35,1.27,0);body.add(leftArm,rightArm);
 make(geo.cylinder,light,leftArm,0,-.25,0,.12,.51,.12);make(geo.cylinder,light,rightArm,0,-.25,0,.12,.51,.12);
 if(enemy){const horn=mat(colors[2],.25,.75);for(const side of [-1,1]){const h=make(geo.cone,horn,body,side*.18,1.99,0,.10,.34,.10);h.rotation.z=-side*.27}}
 if(u.kind==='vanguard'||u.kind==='warden'){const blade=make(geo.cube,accent,rightArm,.10,-.55,-.08,.07,.73,.14);blade.rotation.z=-.28;make(geo.cube,gold,rightArm,.10,-.33,-.08,.31,.055,.16);make(geo.cube,main,leftArm,-.1,-.48,-.25,.35,.4,.10)}
 if(u.kind==='mystic'||u.kind==='cultist'){make(geo.cylinder,gold,rightArm,.06,-.57,-.2,.035,.99,.035);const staff=make(geo.sphere,tealGlow,rightArm,.06,-1.05,-.2,.14,.19,.14);staff.castShadow=false}
 if(u.kind==='ranger'){const bow=new THREE.Mesh(new THREE.TorusGeometry(.41,.038,6,18,Math.PI),gold);bow.rotation.y=Math.PI/2;bow.rotation.z=.3;bow.position.set(.12,-.5,-.15);rightArm.add(bow)}
 // A sculpted cloth panel gives each character a readable silhouette from the stream camera.
 const cloak=make(geo.cube,main,body,0,.82,.18,.55,.96,.1);cloak.rotation.x=-.11;
 const base=new THREE.Mesh(new THREE.CircleGeometry(.38,20),new THREE.MeshBasicMaterial({color:enemy?'#c04a53':'#43b3a7',transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));base.rotation.x=-Math.PI/2;base.position.y=.018;root.add(base);
 let telegraph=null;
 if(boss){telegraph=new THREE.Mesh(new THREE.RingGeometry(1.85,2.03,56),new THREE.MeshBasicMaterial({color:'#ff7049',transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));telegraph.rotation.x=-Math.PI/2;telegraph.position.y=.025;telegraph.visible=false;root.add(telegraph);}
 const detail=enrichCharacter(u,{root,body,leftLeg,rightLeg,leftArm,rightArm});
 scene.add(root);return {root,body,leftLeg,rightLeg,leftArm,rightArm,detail,telegraph,u,at:new THREE.Vector3(u.x-9,0,u.z-9)};
}
const timeNow=()=>performance.now()/1000;
// Broadcast command centre: projections never mutate simulation state.
const minimap=$('minimap'),mini=minimap.getContext('2d',{alpha:false}),mapPalette={wall:'#273653',floor:'#15233e',traced:'#477091',hero:'#5bf9e2',enemy:'#ff6f9c',exit:'#65baff',loot:'#ffd277'};
let previousEventKey='',alertTimer=null,ambience=null,splashTimer=null,lastBiome='';
const classMeta={vanguard:{name:'ASHEN VANGUARD',title:'FRONT-LINE KNIGHT',icon:'⚔'},ranger:{name:'WILDSHADOW',title:'PHANTOM ARCHER',icon:'➶'},mystic:{name:'STARWEAVER',title:'ARCANE HEALER',icon:'✧'}};
function drawMinimap(s){
 const N=s.map.length,W=minimap.width,H=minimap.height,cell=W/N,margin=0;
 mini.fillStyle='#0d1529';mini.fillRect(0,0,W,H);
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){
  const solid=s.map[z][x]!=='#',px=Math.floor(x*cell),pz=Math.floor(z*cell);
  mini.fillStyle=solid?((x+z)%3===0?'#223952':mapPalette.floor):mapPalette.wall;
  mini.fillRect(px,pz,Math.ceil(cell),Math.ceil(cell));
  if(solid){mini.strokeStyle='#476d9050';mini.lineWidth=.35;mini.strokeRect(px+.3,pz+.3,cell-.6,cell-.6)}
 }
 const cx=x=>x*cell+cell/2,cz=z=>z*cell+cell/2;
 mini.fillStyle='#45ffe2';mini.shadowBlur=13;mini.shadowColor='#45ffe2';
 mini.beginPath();mini.arc(cx(s.exit.x),cz(s.exit.z),cell*.36,0,Math.PI*2);mini.fill();mini.shadowBlur=0;
 mini.fillStyle=mapPalette.loot;for(const r of s.relics){mini.fillRect(cx(r.x)-2,cz(r.z)-2,4,4)}
 for(const trap of s.traps||[]){if(trap.disarmed)continue;mini.fillStyle=trap.active?'#ff9a73':'#b48270';const x=cx(trap.x),z=cz(trap.z);mini.fillRect(x-2.5,z-2.5,5,5);mini.fillStyle='#2b1a36';mini.fillRect(x-1,z-1,2,2)}
 for(const u of s.units){if(u.hp<=0)continue;mini.beginPath();mini.fillStyle=u.faction==='party'?mapPalette.hero:mapPalette.enemy;mini.strokeStyle=u.faction==='party'?'#d9fffd':'#ffd2d9';mini.lineWidth=1.2;mini.arc(cx(u.x)+(u.id==='ranger'?2:u.id==='mystic'?-2:0),cz(u.z),u.kind==='warden'?cell*.46:cell*.29,0,Math.PI*2);mini.fill();mini.stroke()}
 mini.strokeStyle='#72d5e860';mini.lineWidth=1;mini.strokeRect(.5,.5,W-1,H-1);
}
function notifyDungeon(event){
 if(!['telegraph','floor','kill','defeat','loot','trap','disarm','phase','guard','evade','block'].includes(event.kind))return;
 if(event.kind==='floor'){const splash=$('floor-splash');clearTimeout(splashTimer);splash.hidden=false;const match=event.text.match(/^FLOOR (\d+) · (.+)$/);$('splash-floor').textContent=match?match[1].padStart(2,'0'):String(state?.floor??'02').padStart(2,'0');$('splash-name').textContent=match?match[2]:state?.theme??'THE NEXT CHAPTER';splashTimer=setTimeout(()=>{splash.hidden=true},reduced?800:2400)}
 const banner=$('alert-flash');clearTimeout(alertTimer);banner.hidden=false;
 banner.textContent=event.kind==='telegraph'?'⚠  '+event.text.toUpperCase():event.kind==='floor'?'✦  '+event.text.toUpperCase():event.kind==='defeat'?'☠  '+event.text.toUpperCase():event.text.toUpperCase();
 banner.dataset.kind=event.kind;
 alertTimer=setTimeout(()=>{banner.hidden=true},event.kind==='telegraph'?1400:1900);
}
function playEffect(kind){
 if(!ambience)return;const ctx=ambience;if(ctx.state!=='running')return;
 const hz={floor:524,loot:880,kill:340,healing:660,telegraph:195,danger:142,guard:470,evade:730,block:590,trap:120,disarm:920}[kind];if(!hz)return;
 const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type=kind==='danger'?'sawtooth':'sine';o.frequency.setValueAtTime(hz,now);o.frequency.exponentialRampToValueAtTime(hz*.7,now+.19);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.052,now+.015);g.gain.exponentialRampToValueAtTime(.0001,now+.23);o.connect(g).connect(ctx.destination);o.start(now);o.stop(now+.25);
}
// Browsers without an active audio device must never freeze the video UI.
const settleAudio=(promise,timeout=1400)=>new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>reject(new Error('audio device did not respond')),timeout);
 Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)});
});
$('audio-toggle').addEventListener('click',async()=>{
 const button=$('audio-toggle'),label=button.querySelector('span');
 const setEnabled=enabled=>{button.setAttribute('aria-pressed',String(enabled));label.textContent=enabled?'AUDIO ON':'AUDIO OFF'};
 if(!ambience){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio){setEnabled(false);button.title='Audio unavailable in this browser';return}
  try{ambience=new Audio()}catch(error){setEnabled(false);button.title='Audio output device unavailable';return}
 }
 if(ambience.state==='running'){
  setEnabled(false);
  try{await settleAudio(ambience.suspend())}catch(error){button.title='Audio device could not be suspended'}
  return;
 }
 try{
  await settleAudio(ambience.resume());
  if(ambience.state!=='running')throw Error('Audio output remains suspended');
  setEnabled(true);button.removeAttribute('title');playEffect('floor');
 }catch(error){
  setEnabled(false);button.title='Audio blocked or unavailable in this browser';
  Promise.resolve(ambience.suspend()).catch(()=>{});
 }
});
function renderDashboard(s){
 const biome=['sunken','ember','obsidian','hollow'][(s.floor-1)%4];if(biome!==lastBiome){document.body.dataset.biome=biome;lastBiome=biome;}
 const heroes=s.units.filter(u=>u.faction==='party'),alive=heroes.filter(u=>u.hp>0).length,foes=s.units.filter(u=>u.faction==='enemy'&&u.hp>0);
 const boss=s.units.find(u=>u.kind==='warden'),nearBoss=boss&&boss.hp>0&&heroes.some(h=>h.hp>0&&Math.abs(h.x-boss.x)+Math.abs(h.z-boss.z)<6);
 $('floor').textContent=String(s.floor).padStart(2,'0');$('chapter').textContent=String(s.floor).padStart(2,'0');
 $('theme').textContent=s.theme;$('run').textContent=String(s.run).padStart(3,'0');$('tick').textContent='TICK '+String(s.tick).padStart(5,'0');
 $('kills').textContent=s.kills.toLocaleString();$('gold').textContent=s.gold.toLocaleString();$('level').textContent=s.level;
 $('intent').textContent=s.intent;$('reasoning').textContent=s.intent;
 $('party-count').textContent=alive+' / '+heroes.length;$('party-condition').textContent=alive===heroes.length?'READY':alive?'COMPROMISED':'FALLEN';
 $('status').textContent=s.phase==='intermission'?'THE NEXT EXPEDITION IS FORMING':'AI HEROES EXPLORING THE UNKNOWN';
 $('floor-status').textContent=s.phase==='intermission'?'REASSEMBLING':nearBoss?'GUARDIAN BATTLE':foes.length?'CLEARING THE CRYPT':'PORTAL UNLOCKED';
 const remaining=s.units.filter(u=>u.faction==='enemy'&&u.hp>0).length;
 $('depth-fill').style.width=Math.max(8,Math.min(100,100-(remaining/(s.units.filter(u=>u.faction==='enemy').length||1)*92)))+'%';
 const bossStrip=$('boss-strip');bossStrip.hidden=!nearBoss;
 if(boss){const percent=Math.max(0,Math.round(boss.hp/boss.maxHp*100));$('boss-hp').textContent=percent+'%';$('boss-bar').style.width=percent+'%';
  const phase=s.bossPhase||'SENTINEL';$('boss-phase').textContent=phase;bossStrip.dataset.phase=phase;
  const attackInterval=phase==='ECLIPSE'?4:6;
  bossStrip.dataset.warning=String(s.tick%attackInterval>=attackInterval-2);
 }
 $('scene-weather').textContent=s.theme.includes('EMBER')?'FIRELIT // ASH':s.theme.includes('OBSIDIAN')?'ARCANE // MIST':s.theme.includes('HOLLOW')?'ETHEREAL // VOID':'MOONLIT // CRYPT';
 const party=$('party');party.replaceChildren(...heroes.map(u=>{
  const meta=classMeta[u.kind],card=document.createElement('article');card.className='hero-card'+(u.hp===0?' down':'');card.dataset.class=u.kind;
  card.dataset.heroId=u.id;card.dataset.focused=String(u.id===focusedHeroId);card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','Follow '+meta.name+' in the cinematic camera');card.setAttribute('aria-pressed',String(u.id===focusedHeroId));
  const icon=document.createElement('div');icon.className='hero-icon';icon.setAttribute('aria-hidden','true');icon.textContent=meta.icon;
  const info=document.createElement('div');info.className='hero-info';const head=document.createElement('div');head.className='hero-heading';
  const name=document.createElement('b');name.textContent=meta.name;const hp=document.createElement('small');hp.textContent=u.hp+'/'+u.maxHp+' HP';
  head.append(name,hp);const sub=document.createElement('div');sub.className='hero-sub';const job=document.createElement('span');job.textContent=meta.title;const action=document.createElement('b');action.textContent=(u.action||'idle').toUpperCase();sub.append(job,action);
  const bar=document.createElement('div');bar.className='life';const fill=document.createElement('i');fill.style.width=(u.hp/u.maxHp*100)+'%';bar.append(fill);info.append(head,sub,bar);card.append(icon,info);return card;
 }));
 const entries=$('events');entries.replaceChildren(...[...s.events].reverse().slice(0,3).map(e=>{
  const li=document.createElement('li');li.style.setProperty('--event-color',({danger:'#ff7f9e',telegraph:'#ffc178',kill:'#ffe28f',healing:'#77ffc6',floor:'#b9a4ff',loot:'#78deff'}[e.kind]||'#8bbfff'));
  const time=document.createElement('small');time.textContent='T+'+String(e.tick).padStart(5,'0')+' · '+e.kind.toUpperCase();li.append(time,document.createTextNode(e.text));return li
 }));
 $('map-cells').textContent=s.map.reduce((n,row)=>n+[...row].filter(ch=>ch==='.').length,0)+' TILES';
 $('hazard-count').textContent=(s.traps||[]).filter(t=>!t.disarmed).length+' ACTIVE';
 const models=assetStats(actors);$('visual-fidelity').textContent=models.authoredCharacters>0?'RIGGED 3D ART: '+models.authoredCharacters:'PROCEDURAL MODEL FALLBACK';
 drawMinimap(s);
}

function update(s){combatOverlay.record(s,timeNow());state=s;received=true;errorAt=0;$('recovery').hidden=true;
 for(const e of s.events){const id=s.run+':'+e.tick+':'+e.kind+':'+e.text;if(!seenEventIds.has(id)){seenEventIds.add(id);if(seenEventIds.size>150)seenEventIds.delete(seenEventIds.values().next().value);cue(e,s);notifyDungeon(e);playEffect(e.kind)}}
 if(worldFloor!==s.run+'-'+s.floor)buildWorld(s);
 const seen=new Set(s.units.map(u=>u.id));
 for(const [id,a] of actors)if(!seen.has(id)){disposeActor(a);actors.delete(id)}
 for(const u of s.units){let a=actors.get(u.id);if(!a){a=rig(u);a.ground=addContactProjection(a);actors.set(u.id,a);a.root.position.set(u.x-9,0,u.z-9);attachCharacter(a)}
  if(a.u.actionTick!==u.actionTick||a.u.action!==u.action){a.actionStarted=timeNow();}a.u=u;a.at.set(u.x-9,0,u.z-9);a.root.visible=u.hp>0;if(a.telegraph)a.telegraph.visible=u.hp>0&&[4,5].includes(s.tick%6);}
 combatDirector.accept(s);
 if(world.userData.courtShield){
  world.userData.courtShield.visible=s.bossPhase==='SENTINEL';
  world.userData.courtShield.material.color.set('#69eaff');
 }
 const warden=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 if(warden){wardenSpot.position.set(warden.x-9,2.2,warden.z-9);
  wardenSpot.color.set(s.bossPhase==='ECLIPSE'?'#ba72ff':s.bossPhase==='RUPTURE'?'#ff7b68':'#ffcc84');
  wardenSpot.intensity=s.bossPhase==='ECLIPSE'?3.2:s.bossPhase==='RUPTURE'?2.9:2.1;
 }else wardenSpot.intensity=0;
 for(const trap of s.traps||[]){const marker=world.userData.hazardMeshes?.get(trap.id);if(marker){marker.userData.active=trap.active;marker.userData.charge.visible=trap.active;marker.userData.ring.visible=!trap.disarmed;marker.scale.setScalar(trap.disarmed?.67:1)}}
 directCamera(s);
 renderDashboard(s);
 window.__DUNGEON_PUBLIC_STATE__=s;
}
let lastFrameTime=0;
// Actual 3D subject framing metrics, independent from overlay/card brightness.
const compositionHead=new THREE.Vector3(),compositionFoot=new THREE.Vector3();
const raycaster=new THREE.Raycaster(),rayStart=new THREE.Vector3(),rayEnd=new THREE.Vector3(),rayDirection=new THREE.Vector3();
let lastRayAuditAt=-Infinity,rayAudit={testedHeroes:0,unoccludedHeroes:0,occludedHeroes:0,samples:0};
function actualHeroVisibility(s,at){
 if(at-lastRayAuditAt<1.25)return rayAudit;
 lastRayAuditAt=at;
 const obstacles=[
   world.userData.walls,
   ...(world.userData.foregroundProps||[]),
   ...(world.userData.dressing?.occluders||[]),
   ...(world.userData.authoredProps?.group?.children||[])
 ].filter(o=>o?.visible!==false);
 let tested=0,clear=0,blocked=0,samples=0;
 camera.getWorldPosition(rayStart);
 for(const hero of s.units.filter(u=>u.hp>0&&u.faction==='party')){
  const actor=actors.get(hero.id);if(!actor||actor.root.visible===false)continue;
  tested++;
  // Two ray tests let one partially visible shoulder/upper body count as visible.
  let good=false;
  for(const y of [1.85,1.05]){
   actor.root.getWorldPosition(rayEnd);rayEnd.y+=y*(actor.root.scale.y||1);
   rayDirection.subVectors(rayEnd,rayStart);const distance=rayDirection.length();
   if(distance<.25){good=true;break}
   raycaster.set(rayStart,rayDirection.multiplyScalar(1/distance));raycaster.near=.1;raycaster.far=Math.max(.2,distance-.33);
   samples++;
   const hits=raycaster.intersectObjects(obstacles,true);
   if(!hits.length){good=true;break}
  }
  if(good)clear++;else blocked++;
 }
 rayAudit={testedHeroes:tested,unoccludedHeroes:clear,occludedHeroes:blocked,samples};
 return rayAudit;
}

function inspectComposition(s){
 if(!s)return {visibleHeroes:0,minHeroPixels:0,activeEnemies:0,subjectOnscreen:false};
 camera.updateMatrixWorld();
 const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
 let visibleHeroes=0,minHeroPixels=1e9,activeEnemies=0,subjectOnscreen=false;
 for(const u of s.units){
  if(u.hp<=0)continue;
  const a=actors.get(u.id);if(!a||!a.root.visible)continue;
  compositionFoot.set(a.root.position.x,0,a.root.position.z).project(camera);
  compositionHead.set(a.root.position.x,1.85*a.root.scale.y,a.root.position.z).project(camera);
  const within=compositionHead.z>-1&&compositionHead.z<1&&Math.abs(compositionHead.x)<.94&&Math.abs(compositionHead.y)<.90;
  if(u.faction==='party'&&within){
   visibleHeroes++;
   minHeroPixels=Math.min(minHeroPixels,Math.abs(compositionFoot.y-compositionHead.y)*h/2);
   if(u.id===focusedHeroId)subjectOnscreen=true;
  }
  if(u.faction==='enemy'&&within)activeEnemies++;
 }
 return {visibleHeroes,minHeroPixels:minHeroPixels===1e9?0:Math.round(minHeroPixels),activeEnemies,subjectOnscreen,viewport:{width:w,height:h}};
}
function animate(t){requestAnimationFrame(animate);const time=t/1000,dt=Math.min(.05,Math.max(0,time-lastFrameTime));lastFrameTime=time;
 combatDirector.animate(dt);
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life+=dt;
  if(e.life>=e.duration){scene.remove(e.mesh);e.mesh.material.dispose();effects.splice(i,1);continue}
  const progression=e.life/e.duration;e.mesh.scale.setScalar((e.large?.2:.13)+progression*(e.large?1.1:.80));e.mesh.material.opacity=.60*(1-progression);
 }
 shakeStrength=Math.max(0,shakeStrength-dt*.25);
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life+=dt;if(p.life>=p.duration){disposeParticle(p);particles.splice(i,1);continue}
  p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.mesh.material.opacity=.75*(1-p.life/p.duration);p.mesh.scale.multiplyScalar(1-.35*dt)}

 const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h&&(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))){renderer.setSize(w,h,false);composer?.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
 const leader=(actors.get(focusedHeroId)?.u.hp>0?actors.get(focusedHeroId):null)||[...actors.values()].find(a=>a.u.faction==='party'&&a.u.hp>0),target=leader?.at??new THREE.Vector3(0,0,0);
 for(const a of actors.values()){const moving=a.root.position.distanceTo(a.at)>.07;a.root.position.lerp(a.at,reduced?1:.17);const bounce=reduced?0:Math.sin(time*5+a.at.x)*.028;a.body.position.y=bounce;a.leftLeg.rotation.x=moving?Math.sin(time*10)*.35:0;a.rightLeg.rotation.x=-a.leftLeg.rotation.x;a.leftArm.rotation.x=moving?Math.sin(time*10)*.22:0;a.rightArm.rotation.x=-a.leftArm.rotation.x;
  const since=time-(a.actionStarted??time),phase=Math.max(0,Math.min(1,since/.32));
  if(a.u.action==='attack'&&since<.32){a.rightArm.rotation.x=-1.5*Math.sin(phase*Math.PI);a.body.rotation.z=.16*Math.sin(phase*Math.PI)}
  else if(a.u.action==='cast'&&since<.45){a.rightArm.rotation.x=-1.55*Math.sin(Math.min(1,since/.45)*Math.PI);a.leftArm.rotation.x=-.85;a.body.rotation.z=0}
  else if(a.u.action==='guard'&&since<.42){a.rightArm.rotation.x=-.85;a.leftArm.rotation.x=-1.1;a.body.rotation.x=-.16;}
  else if(a.u.action==='hurt'&&since<.30){a.body.rotation.z=.16*Math.sin(phase*Math.PI*2);a.body.position.y+=.10*Math.sin(phase*Math.PI)}
  else {a.body.rotation.z*=.65;a.body.rotation.x*=.70;}
  if(a.telegraph)a.telegraph.material.opacity=.42+.2*Math.sin(time*9);
  if(!a.authored)a.detail?.update(time,a.u.action||'idle');a.ground?.update(time,a.u.action||'idle',a.u.hp>0);updateActor(a,dt);
  if(moving){const delta=a.at.clone().sub(a.root.position);a.root.rotation.y=Math.atan2(-delta.x,-delta.z)}}
 if(world.userData.portal&&!reduced)world.userData.portal.rotation.y=time*.26;
 if(world.userData.court&&!reduced)world.userData.court.rotation.y=Math.sin(time*.3)*.035;
 if(!reduced&&wardenSpot.intensity>0)wardenSpot.intensity*=.998+.002*Math.sin(time*3.1);
 if(!reduced&&world.userData.hazardMeshes)for(const trap of world.userData.hazardMeshes.values()){
  if(trap.userData.active){trap.userData.ring.rotation.z=time*.4;trap.userData.charge.scale.y=.9+Math.sin(time*3+trap.position.x)*.14}
 }
 if(world.userData.dressing&&!reduced)world.userData.dressing.animate(time);
 if(world.userData.atmosphere&&!reduced)world.userData.atmosphere.update(time);
 const cameraType=cameraModes[cameraIndex]||'cinematic',offsets=cameraType==='tactical'?[3.5,23.5,4.5]:cameraType==='chase'?[6.1,12.0,7.2]:[9.5,17.2,11.3];
 const boss=state?.units.find(u=>u.kind==='warden'&&u.hp>0),bossDistance=boss&&state?.units.some(u=>u.faction==='party'&&u.hp>0&&Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=5);
 const look=new THREE.Vector3(target.x,0,target.z);
 if(boss&&bossDistance&&cameraType==='cinematic')look.lerp(new THREE.Vector3(boss.x-9,0,boss.z-9),.28);
 const cam=new THREE.Vector3(look.x+offsets[0],offsets[1],look.z+offsets[2]);
 camera.position.lerp(cam,reduced?1:.065);camera.lookAt(look.x,0,look.z);
 // The camera must settle before the cutaway is measured. Previous frames culled
 // props using stale view angles during cinematic shot switches.
 cutawayWalls(target);world.userData.dressing?.cutaway(target,camera.position);
 if(world.userData.authoredProps?.group){
  const dx=camera.position.x-target.x,dz=camera.position.z-target.z,len=Math.max(.01,Math.hypot(dx,dz)),dirX=dx/len,dirZ=dz/len;
  for(const prop of world.userData.authoredProps.group.children){
   const x=prop.position.x-target.x,z=prop.position.z-target.z,f=x*dirX+z*dirZ,l=Math.abs(x*dirZ-z*dirX);
   prop.visible=!(f>0&&f<len+.8&&l<2.8+f*.16);
  }
 }

 if(shakeStrength>.008&&!reduced){camera.position.x+=Math.sin(time*57)*shakeStrength;camera.position.y+=Math.cos(time*43)*shakeStrength*.5;}
 partyGlow.position.set(target.x,2,target.z);
 renderer.info.reset();
 try{if(composer&&postFXEnabled){bloomPass.strength=innerWidth<680?.16:.30;composer.render()}else renderer.render(scene,camera)}
 catch(error){console.warn('[DUNGEON] post effect fault, restoring WebGL:',String(error));composer=null;postFXStatus='fallback';renderer.info.reset();renderer.render(scene,camera)}
 combatOverlay.render(state,actors,camera,time);if(state)window.__DUNGEON_RENDER_DIAGNOSTICS__={composition:inspectComposition(state),visibility:actualHeroVisibility(state,time),frame:renderer.info.render.frame,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:cameraModes[cameraIndex],focusedHeroId,autoDirector,cutawayWalls:world.userData.cutawayWalls??0,hiddenForegroundProps:world.userData.hiddenForegroundProps??0,postFX:composer&&postFXEnabled?'bloom':'direct',postFXStatus,bossFramed:Boolean(bossDistance),activeUnits:[...actors.values()].filter(x=>x.root.visible).length,characterDetails:[...actors.values()].reduce((sum,x)=>sum+(x.detail?.parts||0),0),webgl:true,theme:state.theme,dressing:world.userData.dressing?.metrics??null,atmosphere:world.userData.atmosphere?.metrics??null,overlay:combatOverlay.metrics(),combatStage:combatDirector.stats(),groundedActors:[...actors.values()].filter(x=>Boolean(x.ground)).length,authored3D:assetStats(actors)};
}
async function poll(){try{const r=await fetch('/dungeon/state',{cache:'no-store'});if(!r.ok)throw Error('State '+r.status);const data=await r.json();if(data.tick!==lastTick||data.run!==state?.run){lastTick=data.tick;update(data)}}catch(e){errorAt++;if(errorAt>=3){$('recovery').hidden=false;$('status').textContent='VIEW DEGRADED — RETRYING';console.warn('Dungeon view recovery',String(e))}}finally{setTimeout(poll,190)}}
$('party').addEventListener('click',e=>{
 const node=e.target.closest('[data-hero-id]');if(!node)return;
 const unit=state?.units.find(u=>u.id===node.dataset.heroId&&u.faction==='party'&&u.hp>0);
 if(!unit)return;
 focusedHeroId=unit.id;autoDirector=false;$('director-toggle').setAttribute('aria-pressed','false');$('director-toggle').querySelector('span').textContent='DIRECTOR PAUSED';$('focus-label').textContent='FOLLOWING '+(classMeta[unit.kind]?.name||unit.kind).toUpperCase();
 for(const el of document.querySelectorAll('.hero-card')){el.dataset.focused=String(el.dataset.heroId===focusedHeroId);el.setAttribute('aria-pressed',String(el.dataset.heroId===focusedHeroId))}
});
$('party').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const card=e.target.closest('[data-hero-id]');if(card){e.preventDefault();card.click()}}});
$('director-toggle').addEventListener('click',()=>{
 autoDirector=!autoDirector;
 $('director-toggle').setAttribute('aria-pressed',String(autoDirector));
 $('director-toggle').querySelector('span').textContent=autoDirector?'AUTO DIRECTOR':'DIRECTOR PAUSED';
 lastAutoSwitch=0;
});
const cameraModes=['cinematic','tactical','chase'];let cameraIndex=0;const viewButton=$('view-toggle');
viewButton.addEventListener('click',()=>{cameraIndex=(cameraIndex+1)%cameraModes.length;viewButton.querySelector('span').textContent=cameraModes[cameraIndex].toUpperCase();viewButton.setAttribute('aria-label','Camera: '+cameraModes[cameraIndex]+'; change view');});
document.body.dataset.reducedMotion=String(reduced);requestAnimationFrame(animate);poll();
