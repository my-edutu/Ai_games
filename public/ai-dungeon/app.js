import * as THREE from '/dungeon/vendor/three.module.js';
import {makeWallMasonryPixels} from '/dungeon/wall-masonry-plan.js';
import {planFracturedWallStone,planWallStoneVariation} from '/dungeon/fractured-wall-plan.js';
import {planCutawayWallTransform,planCutawayFoundationTransform,planCutawayParapetTransform} from '/dungeon/cutaway-floor-plan.js';
import {encounterTarget,isSceneAlert,installSpectatorUI} from '/dungeon/spectator-ui.js';
import {enrichEnvironment} from '/dungeon/environment.js';
import {planDungeonWallProfiles} from '/dungeon/wall-profile-plan.js';
import {createFloorRuins} from '/dungeon/floor-ruins.js';
import {planEncounterSightlines} from '/dungeon/encounter-sightlines.js';
import {planEncounterFrame} from '/dungeon/encounter-frame-plan.js';
import {planCinematicShot,planReadableExpeditionLens,planCriticalSubjectFit,planWardenCharge} from '/dungeon/cinematic-chapter-plan.js';
import {planPartyWallReveal,createCutawayBandCache,shouldUploadCutawayBand} from '/dungeon/party-visibility-plan.js';
import {planBoundaryCamera} from '/dungeon/camera-boundary-plan.js';
import {advancePresentationActionAge} from '/dungeon/character-motion-plan.js';
import {planAuthorityDamageBeats,planDamageReaction,planImpactCameraHold,DAMAGE_BEAT_DURATION,DEATH_BEAT_DURATION} from '/dungeon/impact-choreography-plan.js';
import {planPostFXBudget,adaptPostFXPixelCap,postFXStallAction,isSoftwareWebGLRenderer,createFrameIntervalProbe,planDirectRenderBudget,adaptDirectRenderPixelCap} from '/dungeon/postfx-budget.js';
import {planCombatFacing,planMovementFacing,approachCharacterYaw,shortestYawDelta} from '/dungeon/facing-plan.js';
import {enrichCharacter} from '/dungeon/characters.js';
import {createBiomeAtmosphere} from '/dungeon/biome-atmosphere.js';
import {createCombatOverlay} from '/dungeon/combat-overlay.js';
import {createCombatDirector} from '/dungeon/combat-director.js';
import {planCombatStage,stagePoint,MAX_STAGE_OFFSET} from '/dungeon/combat-staging-plan.js';
import {createDungeonSoundstage} from '/dungeon/soundstage.js';
import {createWardenRitual} from '/dungeon/warden-ritual.js';
import {addContactProjection} from '/dungeon/contact-projection.js';
import {createLivingWorld} from '/dungeon/living-world.js';
import {attachCharacter,updateActor,disposeActorAsset,putEnvironment,stats as assetStats} from '/dungeon/model-assets.js';
const $=id=>document.getElementById(id),canvas=$('world'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const spectatorUI=installSpectatorUI();
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
renderer.info.autoReset=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
// Use the actual renderer identity, not a browser/OS guess. CPU SwiftShader
// cannot afford eager multi-pass bloom before its first spectator frame.
const webglRendererName=(()=>{
 try{
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
  return String(gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL??gl.RENDERER)||'');
 }catch{return ''}
})();
const softwareWebGL=isSoftwareWebGLRenderer(webglRendererName);
// Software WebGL can take seconds per full-resolution, shadowed frame.
// Preserve the CSS stage and live game truth while limiting CPU raster work.
const directRequestedDpr=Math.min(devicePixelRatio||1,1.6);
let directRenderPixelCap=650000,directRenderMs=0,directDownshifts=0,directSlowStreak=0;
let directBudget=planDirectRenderBudget(Math.max(1,canvas.clientWidth),Math.max(1,canvas.clientHeight),directRequestedDpr,softwareWebGL,directRenderPixelCap);
directBudget.shadows=directBudget.shadows&&!reduced;
renderer.setPixelRatio(directBudget.pixelRatio);
renderer.shadowMap.enabled=directBudget.shadows;
const scene=new THREE.Scene();scene.background=new THREE.Color('#070d18');scene.fog=new THREE.FogExp2('#090f1a',.024);
const camera=new THREE.PerspectiveCamera(50,1,.1,110);
const cameraAim=new THREE.Vector3();
// Deferred, optional 3D post-processing: selective emissive bloom adds light without
// sacrificing the whole scene to fog/black overlays. Direct WebGL remains fallback.
let composer=null,bloomPass=null,postFXEnabled=!reduced&&!softwareWebGL,postFXStatus=softwareWebGL?'software-fallback':reduced?'disabled':'loading',postFXBudget=null,postFXLoading=false;
let bloomPixelCap=850000,bloomRenderMs=0,bloomDownshifts=0,bloomSlowStreak=0,bloomAutoDisabled=false;
const fxButton=$('fx-toggle');
fxButton.setAttribute('aria-pressed',String(postFXEnabled));
if(softwareWebGL){
 fxButton.title='CPU-rendered WebGL: using direct 3D for smooth playback; click to try optional glow';
 fxButton.querySelector('span').textContent='DIRECT 3D';
}
fxButton.addEventListener('click',()=>{
 postFXEnabled=!postFXEnabled;
 if(postFXEnabled){bloomSlowStreak=0;bloomAutoDisabled=false;postFXStatus=composer?'ready':'loading';fxButton.removeAttribute('title');if(!composer)initializePostFX()}
 fxButton.setAttribute('aria-pressed',String(postFXEnabled));
 fxButton.querySelector('span').textContent=postFXEnabled?'Glow on':'Glow off';
});
async function initializePostFX(){
 if(composer||postFXLoading)return;
 postFXLoading=true;
 try{
  const [c,r,b,o]=await Promise.all([
   import('/dungeon/vendor/addons/postprocessing/EffectComposer.js'),
   import('/dungeon/vendor/addons/postprocessing/RenderPass.js'),
   import('/dungeon/vendor/addons/postprocessing/UnrealBloomPass.js'),
   import('/dungeon/vendor/addons/postprocessing/OutputPass.js')
  ]);
  const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
  const budget=planPostFXBudget(width,height,renderer.getPixelRatio(),bloomPixelCap);
  const pipeline=new c.EffectComposer(renderer);
  pipeline.setPixelRatio(budget.pixelRatio);
  pipeline.addPass(new r.RenderPass(scene,camera));
  bloomPass=new b.UnrealBloomPass(new THREE.Vector2(Math.max(1,canvas.clientWidth),Math.max(1,canvas.clientHeight)),.29,.36,.9);
  pipeline.addPass(bloomPass);pipeline.addPass(new o.OutputPass());
  pipeline.setSize(width,height);
  postFXBudget=budget;composer=pipeline;postFXStatus='ready';
  if(postFXEnabled)fxButton.querySelector('span').textContent='Glow on';
 }catch(error){composer=null;postFXStatus='unavailable';postFXEnabled=false;fxButton.title='Post effects unavailable: using direct 3D rendering';fxButton.setAttribute('aria-pressed','false');fxButton.querySelector('span').textContent='DIRECT 3D';console.warn('[DUNGEON] optional bloom unavailable:',String(error))}
 finally{postFXLoading=false}
}
if(postFXEnabled)initializePostFX();
const ambient=new THREE.HemisphereLight('#9da8c8','#533b35',1.85);scene.add(ambient);
const wardenSpot=new THREE.PointLight('#ffbd76',0,9.5,2);scene.add(wardenSpot);
const moon=new THREE.DirectionalLight('#ffe0b2',1.65);moon.position.set(-7,17,5);moon.castShadow=directBudget.shadows;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-17;moon.shadow.camera.right=17;moon.shadow.camera.top=17;moon.shadow.camera.bottom=-17;scene.add(moon);
const partyGlow=new THREE.PointLight('#50e9ff',1.65,7.7,2);partyGlow.position.set(0,2,0);scene.add(partyGlow);
// A warm photographic key light follows the real viewed character, preserving
// the character silhouette inside the dark vault without increasing global bloom.
const heroKey=new THREE.PointLight('#ffdfbc',2.65,6.8,2);heroKey.position.set(1,2.6,2);heroKey.castShadow=false;scene.add(heroKey);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:'#080e17',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.17;scene.add(ground);
const actors=new Map(),world=new THREE.Group();scene.add(world);
let crowdedStageActors=0;
const combatOverlay=createCombatOverlay($('battle-overlay'));
const combatDirector=createCombatDirector(scene,{reducedMotion:reduced,actorById:id=>actors.get(id)});
const floorThemes=[
 // Lighting and core PBR tint follow each real floor. The crypt is warm
 // weathered limestone, leaving deliberately cold blues for the obsidian vault.
 // No extra draw calls, shadow casters, network assets or gameplay decisions.
 {sky:'#292922',fog:'#292c26',torch:'#ffb874',accent:'#86c8af',fill:'#cfbda5',
  wallTint:'#f3e0c7',floorTint:'#50463c',trimTint:'#7c6d5b',partyFill:'#9bd8ba',partyIntensity:1.05,biome:'SUNKEN CRYPT'},
 {sky:'#311c2d',fog:'#341b2e',torch:'#ffaf55',accent:'#fe806f',fill:'#a66d9a',
  wallTint:'#e4e9eb',floorTint:'#40353d',trimTint:'#65545b',partyFill:'#ffb88c',partyIntensity:1.20,biome:'EMBER CATHEDRAL'},
 {sky:'#1a2543',fog:'#1a2452',torch:'#82f7ef',accent:'#72bbff',fill:'#648ed5',
  wallTint:'#e4e9eb',floorTint:'#28313b',trimTint:'#404957',partyFill:'#50e9ff',partyIntensity:1.65,biome:'OBSIDIAN VAULT'},
 {sky:'#321e50',fog:'#2f1b4d',torch:'#d39bff',accent:'#fc91c8',fill:'#aa8ae2',
  wallTint:'#e4e9eb',floorTint:'#34303d',trimTint:'#56506a',partyFill:'#c59fef',partyIntensity:1.30,biome:'HOLLOW SANCTUM'}
];let lastCutawayKey='';
const cachedVec=new THREE.Vector3(),cachedQuat=new THREE.Quaternion(),cachedScale=new THREE.Vector3(),cachedMatrix=new THREE.Matrix4();
// The camera follows one hero, but every living party member needs a clear view.
// Read only public snapshots; this presentation pass never alters authority.
function sightlineClearance(x,z,subjects,cameraPosition,pad=2.1){
 return planPartyWallReveal(x,z,subjects,cameraPosition,pad)!=='none';
}
function cutawayWalls(target,subjects){
 const positions=world.userData.wallPositions,mesh=world.userData.walls;
 if(!mesh||!positions)return;
 // Every frame is intentional: a rounded key previously skipped critical
 // updates while the camera and party moved within a tile.
 let cut=0,nearbyCut=0,wallMatrixWrites=0;
 const wallBands=world.userData.wallCutawayBands;
 for(let i=0;i<positions.length;i++){
  const point=positions[i];
  const reveal=planPartyWallReveal(point[0],point[1],subjects,camera.position,2.1);
  const cutaway=planCutawayWallTransform(reveal,world.userData.wallHeights?.[i]??2.6);
  if(reveal!=='none')cut++;
  if(reveal==='nearby')nearbyCut++;
  if(!shouldUploadCutawayBand(wallBands,i,reveal==='sightline'?2:reveal==='nearby'?1:0))continue;
  wallMatrixWrites++;
  cachedVec.set(point[0],cutaway.height/2-.03,point[1]);cachedScale.set(cutaway.footprint,cutaway.height,cutaway.footprint);
  const weather=planWallStoneVariation(point[0],point[1],state?.floor??1);
  cachedQuat.setFromAxisAngle(wallVertical,weather.yaw);
  cachedMatrix.compose(cachedVec,cachedQuat,cachedScale);mesh.setMatrixAt(i,cachedMatrix);
 }
 cachedQuat.identity();
 world.userData.cutawayWalls=cut;world.userData.cutawayNearbyWalls=nearbyCut;
 world.userData.wallMatrixWrites=wallMatrixWrites;
 // Foundation courses use the same cached parent wall bands to avoid drawing
 // enormous black 1x1 tiles over the textured under-wall floor when the
 // spectator camera clears opaque walls. All changes are render-only.
 const foundationMesh=world.userData.foundationMesh;
 const foundationBrickWallIndices=world.userData.foundationBrickWallIndices;
 const foundationPositions=world.userData.foundationBrickPositions;
 const foundationBands=world.userData.foundationCutawayBands;
 let clearedFoundationBricks=0,foundationMatrixWrites=0;
 if(foundationMesh&&foundationPositions&&foundationBrickWallIndices){
  for(let i=0;i<foundationPositions.length;i++){
   const footWallIndex=foundationBrickWallIndices[i];
   const band=footWallIndex>=0&&footWallIndex<wallBands.length?wallBands[footWallIndex]:0;
   const reveal=band===2?'sightline':band===1?'nearby':'none';
   if(reveal!=='none')clearedFoundationBricks++;
   if(!shouldUploadCutawayBand(foundationBands,i,reveal==='sightline'?2:reveal==='nearby'?1:0))continue;
   const foundation=planCutawayFoundationTransform(reveal);
   if(!foundation)continue;
   const [fx,,fz]=foundationPositions[i];
   cachedVec.set(fx,foundation.y,fz);
   cachedScale.set(foundation.footprint,foundation.height,foundation.footprint);
   cachedMatrix.compose(cachedVec,cachedQuat,cachedScale);
   foundationMesh.setMatrixAt(i,cachedMatrix);foundationMatrixWrites++;
  }
  if(foundationMatrixWrites)foundationMesh.instanceMatrix.needsUpdate=true;
 }
 world.userData.clearedFoundationBricks=clearedFoundationBricks;
 world.userData.foundationMatrixWrites=foundationMatrixWrites;
 // Decorative wall crowns must obey the same true-world sightline clearance
 // as the main masonry. Otherwise an invisible wall can still hide the model
 // behind an unrelated 2.5m-high square parapet.
 const parapets=world.userData.parapets,parapetPositions=world.userData.parapetPositions;
 let clearedParapets=0,parapetMatrixWrites=0;
 const parapetBands=world.userData.parapetCutawayBands;
 if(parapets&&parapetPositions){
  for(let i=0;i<parapetPositions.length;i++){
   const [px,pz]=parapetPositions[i],hidden=sightlineClearance(px,pz,subjects,camera.position,2.15);
   if(hidden)clearedParapets++;
   if(!shouldUploadCutawayBand(parapetBands,i,hidden?1:0))continue;
   const parapet=planCutawayParapetTransform(hidden,world.userData.parapetHeights?.[i]??2.53);
   if(!parapet)continue;
   parapetMatrixWrites++;
   cachedVec.set(px,parapet.y,pz);
   cachedScale.set(parapet.footprint,parapet.height,parapet.footprint);
   cachedMatrix.compose(cachedVec,cachedQuat,cachedScale);
   parapets.setMatrixAt(i,cachedMatrix);
  }
  if(parapetMatrixWrites)parapets.instanceMatrix.needsUpdate=true;
 }
 world.userData.cutawayParapets=clearedParapets;
 world.userData.parapetMatrixWrites=parapetMatrixWrites;
 let removed=0;
 for(const group of world.userData.foregroundProps||[]){
  const hidden=sightlineClearance(group.position.x,group.position.z,subjects,camera.position,2.1);
  group.visible=!hidden;if(hidden)removed++;
 }
 world.userData.hiddenForegroundProps=removed;
 if(wallMatrixWrites)mesh.instanceMatrix.needsUpdate=true;
}

const particles=[],MAX_PARTICLES=72;const seenEventIds=new Set();
const effects=[],MAX_EFFECTS=12,ringGeometry=new THREE.RingGeometry(.92,1,56),shockGeometry=new THREE.RingGeometry(2.5,2.7,64);
let shakeStrength=0;
function pulseFX(event,s){
 if(reduced)return;
 let origin,theme='#51fff0',big=false;
 if(event.kind==='phase'||event.kind==='unseal'||event.kind==='telegraph'||(event.kind==='danger'&&event.text.includes('Warden'))){
  origin=s.units.find(u=>u.kind==='warden');theme=event.kind==='unseal'?'#ffe7a1':event.kind==='phase'?'#e19aff':event.kind==='danger'?'#ff4d86':'#ffba70';big=true;shakeStrength=event.kind==='danger'?.11:shakeStrength;
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
 const colors={unseal:'#ffe7a1',kill:'#ffe3a0',combat:'#e99159',danger:'#ef5864',phase:'#efb7ff',guard:'#72ffdf',evade:'#88b9ff',block:'#92eaff',trap:'#ff646c',disarm:'#74f8be',telegraph:'#ffb77b',healing:'#58ebba',loot:'#66d7e5',floor:'#d7bbff'};
 const color=colors[event.kind];if(!color)return;
 const target=event.kind==='unseal'?s.units.find(u=>u.kind==='warden'):event.kind==='danger'?s.units.find(u=>u.faction==='party'&&u.hp>0):event.kind==='kill'?s.units.find(u=>u.kind==='warden'&&u.hp>0):s.units.find(u=>u.id==='mystic')||s.units[0];
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
let impactCameraHold=null,observedDamageBeats=0,observedFatalBeats=0;
const palette={vanguard:['#4a87a8','#bed8df','#eab967'],ranger:['#527c58','#bdd19f','#d2b178'],mystic:['#65508f','#c2abf0','#76d8e0'],revenant:['#54656e','#b3c4bd','#dfb76f'],cultist:['#743e4c','#b18a89','#f0636b'],warden:['#483552','#c79a62','#ec7f42']};
const mat=(color,metalness=.1,roughness=.75)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const stone=mat('#26303d',.1,.95),stoneEdge=mat('#404957',.15,.88),floorMat=mat('#28313b',.05,.95),gold=mat('#c9a366',.7,.33),black=mat('#111724',.2,.8);
let wallMasonryTexture=null;
const tealGlow=new THREE.MeshStandardMaterial({color:'#53aebc',emissive:'#228a98',emissiveIntensity:2.2,roughness:.2});
const dangerGlow=new THREE.MeshStandardMaterial({color:'#e67f50',emissive:'#bd4f18',emissiveIntensity:2.3});
const wallVertical=new THREE.Vector3(0,1,0);
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
function clearWorld(){combatDirector.reset();world.userData.floorRuins?.dispose();world.userData.floorRuins=null;world.userData.livingWorld?.dispose();world.userData.livingWorld=null;world.userData.atmosphere?.dispose();world.userData.atmosphere=null;world.userData.dressing?.dispose();world.userData.dressing=null;while(world.children.length){const obj=world.children[0];world.remove(obj);obj.traverse(o=>{if(o.geometry&&!o.userData.sharedAssetGeometry&&!Object.values(geo).includes(o.geometry))o.geometry.dispose();if(o.material&&!o.userData.sharedAssetGeometry&&!Object.values({stone,stoneEdge,floorMat,gold,black,tealGlow,dangerGlow}).includes(o.material)){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)m.dispose()}})}for(const a of actors.values())disposeActor(a);actors.clear()}
function buildWorld(s){clearWorld();worldFloor=s.run+'-'+s.floor;world.userData.sceneKey=worldFloor;world.userData.foregroundProps=[];lastCutawayKey='';
 // The main InstancedMesh wall blocks previously had a near-black flat surface
 // even while the exposed masonry facades were textured. One shared original
 // 128px PBR albedo gives every overhead-visible top/side real stone courses.
 // Floor changes dispose the previous GPU texture; failure retains safe stone.
 try{
  const pixels=makeWallMasonryPixels(s.floor,128);
  if(pixels.length===128*128*4){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
   const ctx=canvas.getContext('2d');
   if(ctx){
    const image=ctx.createImageData(128,128);image.data.set(pixels);ctx.putImageData(image,0,0);
    const next=new THREE.CanvasTexture(canvas);
    next.colorSpace=THREE.SRGBColorSpace;next.wrapS=next.wrapT=THREE.RepeatWrapping;next.anisotropy=4;
    wallMasonryTexture?.dispose();wallMasonryTexture=next;
    stone.map=wallMasonryTexture;stone.bumpMap=wallMasonryTexture;stone.bumpScale=.04;
    stone.color.set('#e4e9eb');stone.needsUpdate=true;
   }
  }
 }catch(error){console.warn('[DUNGEON] original masonry texture unavailable, retaining simple wall material:',String(error))}

 const theme=floorThemes[(s.floor-1)%floorThemes.length];scene.background=new THREE.Color(theme.sky);scene.fog.color.set(theme.fog);moon.color.set(theme.fill);ambient.intensity=1.95;
 // Re-grade the actual existing instanced surfaces and key/fill lights on floor change only.
 stone.color.set(theme.wallTint);floorMat.color.set(theme.floorTint);stoneEdge.color.set(theme.trimTint);
 partyGlow.color.set(theme.partyFill);partyGlow.intensity=theme.partyIntensity;
 const floors=[],walls=[],trim=[];const size=s.map.length,offset=Math.floor(size/2);
 const wallIndexByTile=new Int32Array(size*size).fill(-1);
 const sculpture=planFracturedWallStone(s.floor);
 const fracturedWall=new THREE.BufferGeometry();
 fracturedWall.setAttribute('position',new THREE.Float32BufferAttribute(sculpture.vertices,3));
 fracturedWall.setAttribute('uv',new THREE.Float32BufferAttribute(sculpture.uvs,2));
 fracturedWall.setIndex(sculpture.indices);fracturedWall.computeVertexNormals();
  const wallProfiles=planDungeonWallProfiles(s.map,s.floor),wallHeights=wallProfiles.map(p=>p.height);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const px=x-offset,pz=z-offset;
  if(s.map[z][x]==='.'){floors.push([px,-.10,pz]);if((x*13+z*7)%11===0)trim.push([px,-.028,pz])}
  else {wallIndexByTile[z*size+x]=walls.length;walls.push([px,1.27,pz]);}
 }
 const instance=(geometry,material,data,scale,heights=null)=>{const mesh=new THREE.InstancedMesh(geometry,material,data.length);const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scaling=new THREE.Vector3(...scale);for(let i=0;i<data.length;i++){position.set(...data[i]);if(heights){position.y=heights[i]/2-.03;scaling.y=heights[i];const weather=planWallStoneVariation(data[i][0],data[i][2],s.floor);quaternion.setFromAxisAngle(wallVertical,weather.yaw);mesh.setColorAt(i,new THREE.Color().setRGB(weather.shade,weather.shade,weather.shade));}matrix.compose(position,quaternion,scaling);mesh.setMatrixAt(i,matrix)}mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.castShadow=!reduced;mesh.receiveShadow=true;world.add(mesh)};
 instance(geo.cube,floorMat,floors,[.99,.16,.99]);
 world.userData.floorRuins=createFloorRuins(world,s.map,s.floor,s.exit);
 instance(fracturedWall,stone,walls,[1.015,2.6,1.015],wallHeights);
 world.userData.wallSculpture={sculpted:true,variants:4,wallCount:walls.length,stoneTriangles:sculpture.indices.length/3};world.userData.walls=world.children[world.children.length-1];world.userData.wallPositions=walls.map(([x,,z])=>[x,z]);world.userData.wallHeights=wallHeights;world.userData.wallCutawayBands=createCutawayBandCache(walls.length);
  const exposedProfiles=wallProfiles.filter(profile=>profile.exposedFaces>0);
  world.userData.wallProfileMetrics={totalWalls:wallProfiles.length,exposedWalls:exposedProfiles.length,distinctHeights:new Set(exposedProfiles.map(profile=>profile.height)).size,minHeight:exposedProfiles.length?Math.min(...exposedProfiles.map(profile=>profile.height)):0,maxHeight:exposedProfiles.length?Math.max(...exposedProfiles.map(profile=>profile.height)):0};
 instance(geo.cube,stoneEdge,trim,[.86,.02,.86]);
 // Multiple architecturally distinct layers: foundation courses, arches, broken stone tiles and inlaid runes.
 const topBricks=[],footBricks=[],foundationBrickWallIndices=[],runes=[],stonePavers=[],shards=[],caps=[];
 const fracture=(x,z)=>((x*73+z*139+s.floor*41+4096)&1023);
  const wallHeightAt=new Map(wallProfiles.map(profile=>[profile.z*size+profile.x,profile.height]));
 for(let z=1;z<size-1;z++)for(let x=1;x<size-1;x++){
  const wx=x-offset,wz=z-offset,f=fracture(x,z);
  if(s.map[z][x]==='#'){
   if(f%3===0)topBricks.push([wx,(wallHeightAt.get(z*size+x)??2.6)-.07,wz]);
   if(f%4===0){footBricks.push([wx,.1,wz]);foundationBrickWallIndices.push(wallIndexByTile[z*size+x]);}
   if(s.map[z-1][x]==='.'&&f%7===0)caps.push([wx,(wallHeightAt.get(z*size+x)??2.6)+.03,wz-.34]);
  }else{
   if(f%4===0)stonePavers.push([wx,-.005,wz]);
   if(f%17===0)runes.push([wx,.008,wz]);
   if(f%11===0)shards.push([wx+.26,.10,wz-.22]);
  }
 }
 const ornament=mat(theme.accent,.5,.5),blackStone=mat('#171c29',.15,.98),runeMat=new THREE.MeshStandardMaterial({color:theme.torch,emissive:theme.torch,emissiveIntensity:1.6,roughness:.35});
 const garnish=(material,data,scale)=>{if(!data.length)return null;const mesh=new THREE.InstancedMesh(geo.cube,material,data.length);const m=new THREE.Matrix4(),p=new THREE.Vector3(),sc=new THREE.Vector3(...scale),rot=new THREE.Quaternion();
  for(let i=0;i<data.length;i++){p.set(...data[i]);m.compose(p,rot,sc);mesh.setMatrixAt(i,m)}mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;world.add(mesh);return mesh};
 world.userData.parapets=garnish(stoneEdge,topBricks,[1.04,.12,1.04]);world.userData.parapetPositions=topBricks.map(([x,,z])=>[x,z]);world.userData.parapetHeights=topBricks.map(([,y])=>y);world.userData.parapetCutawayBands=new Uint8Array(topBricks.length);
 world.userData.foundationMesh=garnish(blackStone,footBricks,[1.035,.21,1.035]);
 world.userData.foundationBrickPositions=footBricks;
 world.userData.foundationBrickWallIndices=foundationBrickWallIndices;
 // The instanced GPU transforms start intact; only actual changed bands upload.
 world.userData.foundationCutawayBands=new Uint8Array(footBricks.length);
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
 world.userData.wardenRitual=createWardenRitual(world,s.exit,{reducedMotion:reduced,map:s.map});
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
 world.userData.livingWorld=createLivingWorld(world,s.map,s.floor);
 world.userData.authoredProps=putEnvironment(world,worldFloor,s.map);
}
function rig(u){const colors=palette[u.kind],main=mat(colors[0],.5,.4),light=mat(colors[1],.45,.4),accent=mat(colors[2],.55,.3),enemy=u.faction==='enemy',boss=u.kind==='warden';
 const root=new THREE.Group(),impactPivot=new THREE.Group(),body=new THREE.Group();root.add(impactPivot);impactPivot.add(body);const scale=boss?1.55:enemy?1.04:1;root.scale.setScalar(scale);
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
 scene.add(root);return {root,impactPivot,body,leftLeg,rightLeg,leftArm,rightArm,detail,telegraph,u,at:new THREE.Vector3(u.x-9,0,u.z-9)};
}
const timeNow=()=>performance.now()/1000;
// Read-only spectator projections never mutate simulation state.
const minimap=$('minimap'),mini=minimap.getContext('2d',{alpha:false}),mapPalette={wall:'#273653',floor:'#15233e',traced:'#477091',hero:'#5bf9e2',enemy:'#ff6f9c',exit:'#65baff',loot:'#ffd277'};
let previousEventKey='',alertTimer=null,ambience=null,soundstage=null,splashTimer=null,lastBiome='';
// Test/review recording exposes only the spectator's already opt-in audio bus.
// No simulated soundtrack, private game state, or recording network endpoint.
window.__DUNGEON_CAPTURE_SOUND__=()=>soundstage?.captureStream()??null;
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
 if(event.kind!=='floor'&&!isSceneAlert(event))return;
 if(event.kind==='floor'){const splash=$('floor-splash');clearTimeout(splashTimer);splash.hidden=false;const match=event.text.match(/^FLOOR (\d+) · (.+)$/);$('splash-floor').textContent=match?match[1].padStart(2,'0'):String(state?.floor??'02').padStart(2,'0');$('splash-name').textContent=match?match[2]:state?.theme??'THE NEXT CHAPTER';splashTimer=setTimeout(()=>{splash.hidden=true},reduced?800:2400)}
 const banner=$('alert-flash');clearTimeout(alertTimer);banner.hidden=false;
 banner.textContent=event.kind==='telegraph'?'⚠  '+event.text.toUpperCase():event.kind==='floor'?'✦  '+event.text.toUpperCase():event.kind==='defeat'?'☠  '+event.text.toUpperCase():event.text.toUpperCase();
 banner.dataset.kind=event.kind;
 alertTimer=setTimeout(()=>{banner.hidden=true},event.kind==='telegraph'?1400:1900);
}
// Browsers without an active audio device must never freeze the video UI.
const settleAudio=(promise,timeout=1400)=>new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>reject(new Error('audio device did not respond')),timeout);
 Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)});
});
$('audio-toggle').addEventListener('click',async()=>{
 const button=$('audio-toggle'),label=button.querySelector('span');
 const setEnabled=enabled=>{button.setAttribute('aria-pressed',String(enabled));label.textContent=enabled?'Sound on':'Sound off'};
 if(!ambience){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio){setEnabled(false);button.title='Audio unavailable in this browser';return}
  try{ambience=new Audio()}catch(error){setEnabled(false);button.title='Audio output device unavailable';return}
 }
 if(button.getAttribute('aria-pressed')==='true'){
  setEnabled(false);soundstage?.disable();
  try{await settleAudio(ambience.suspend());button.removeAttribute('title')}
  catch(error){button.title='Audio device could not be suspended'}
  return;
 }
 // An AudioContext may already be running before the first click; only
 // explicit user intent can toggle this opt-in spectator audio control.
 try{
  await settleAudio(ambience.resume());
  if(ambience.state!=='running')throw Error('Audio output remains suspended');
  if(!soundstage)soundstage=createDungeonSoundstage(ambience);
  if(!soundstage?.enable())throw Error('Original soundstage failed to initialize');
  if(state)soundstage.acceptSnapshot(state);
  setEnabled(true);button.removeAttribute('title');soundstage.cueWelcome();
 }catch(error){
  soundstage?.disable();setEnabled(false);button.title='Audio blocked or unavailable in this browser';
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
 $('floor-status').textContent=s.phase==='intermission'?'REASSEMBLING':s.guardianWard?'BINDING GUARDS · '+s.defendersRemaining:nearBoss?'WARDEN EXPOSED':foes.length?'CLEARING THE CRYPT':'PORTAL UNLOCKED';
 const remaining=s.units.filter(u=>u.faction==='enemy'&&u.hp>0).length;
 $('depth-fill').style.width=Math.max(8,Math.min(100,100-(remaining/(s.units.filter(u=>u.faction==='enemy').length||1)*92)))+'%';
 const bossStrip=$('boss-strip');bossStrip.hidden=!nearBoss;
 if(boss){const percent=Math.max(0,Math.round(boss.hp/boss.maxHp*100));$('boss-hp').textContent=percent+'%';$('boss-bar').style.width=percent+'%';
  const phase=s.bossPhase||'SENTINEL';$('boss-phase').textContent=s.bossWarning?'DODGE '+s.bossWarning.shape.replaceAll('_',' ')+' · '+(s.bossWarning.attackTick-s.tick):s.guardianWard?'SEALED · '+phase:phase;bossStrip.dataset.phase=phase;bossStrip.dataset.warded=String(Boolean(s.guardianWard));
  const attackInterval=phase==='ECLIPSE'?4:6;
  bossStrip.dataset.warning=String(Boolean(s.bossWarning));
 }
 $('scene-weather').textContent=s.theme.includes('EMBER')?'FIRELIT // ASH':s.theme.includes('OBSIDIAN')?'ARCANE // MIST':s.theme.includes('HOLLOW')?'ETHEREAL // VOID':'MOONLIT // CRYPT';
 const party=$('party');
 // Stable keyed DOM cards: never detach spectator controls on every state tick.
 const activeIds=new Set(heroes.map(u=>u.id));
 for(const old of [...party.children])if(!activeIds.has(old.dataset.heroId))old.remove();
 heroes.forEach((u,i)=>{
  const meta=classMeta[u.kind];let card=[...party.children].find(el=>el.dataset.heroId===u.id);
  if(!card){
   card=document.createElement('article');card.className='hero-card';card.dataset.heroId=u.id;
   card.tabIndex=0;card.setAttribute('role','button');
   const icon=document.createElement('div');icon.className='hero-icon';icon.setAttribute('aria-hidden','true');
   const info=document.createElement('div');info.className='hero-info';
   const head=document.createElement('div');head.className='hero-heading';head.append(document.createElement('b'),document.createElement('small'));
   const sub=document.createElement('div');sub.className='hero-sub';sub.append(document.createElement('span'),document.createElement('b'));
   const bar=document.createElement('div');bar.className='life';bar.append(document.createElement('i'));
   info.append(head,sub,bar);card.append(icon,info);
  }
  card.classList.toggle('down',u.hp<=0);card.setAttribute('aria-disabled',String(u.hp<=0));
  card.dataset.class=u.kind;card.dataset.action=u.action||'idle';card.dataset.focused=String(u.hp>0&&u.id===focusedHeroId);
  card.setAttribute('aria-label','Follow '+meta.name+' in the cinematic camera');
  card.setAttribute('aria-pressed',String(u.hp>0&&u.id===focusedHeroId));
  card.querySelector('.hero-icon').textContent=meta.icon;
  card.querySelector('.hero-heading b').textContent=meta.name;
  card.querySelector('.hero-heading small').textContent=u.hp+'/'+u.maxHp+' HP';
  card.querySelector('.hero-sub span').textContent=meta.title;
  card.querySelector('.hero-sub b').textContent=u.hp<=0?'FALLEN':(u.action||'idle').toUpperCase();
  card.querySelector('.life i').style.width=(u.hp/u.maxHp*100)+'%';
  if(party.children[i]!==card)party.insertBefore(card,party.children[i]||null);
 });
 const entries=$('events');entries.replaceChildren(...[...s.events].reverse().slice(0,3).map(e=>{
  const li=document.createElement('li');li.style.setProperty('--event-color',({danger:'#ff7f9e',telegraph:'#ffc178',kill:'#ffe28f',healing:'#77ffc6',floor:'#b9a4ff',loot:'#78deff'}[e.kind]||'#8bbfff'));
  const time=document.createElement('small');time.textContent='T+'+String(e.tick).padStart(5,'0')+' · '+e.kind.toUpperCase();li.append(time,document.createTextNode(e.text));return li
 }));
 $('map-cells').textContent=s.map.reduce((n,row)=>n+[...row].filter(ch=>ch==='.').length,0)+' TILES';
 $('hazard-count').textContent=(s.traps||[]).filter(t=>!t.disarmed).length+' ACTIVE';
 const models=assetStats(actors);$('visual-fidelity').textContent=models.authoredCharacters>0?'RIGGED 3D ART: '+models.authoredCharacters:'PROCEDURAL MODEL FALLBACK';
 drawMinimap(s);
}

function update(s){const previousState=state,damageBeats=planAuthorityDamageBeats(previousState,s),firstSnapshot=!received,sceneChanged=worldFloor!==s.run+'-'+s.floor;combatOverlay.record(s,timeNow());state=s;received=true;errorAt=0;
 // Authority polling is independent of the browser's WebGL lifecycle. Never
 // hide a graphics failure merely because the autonomous game keeps ticking.
 if(!['context-lost','recovering','stalled','failed'].includes(document.body.dataset.rendererStatus))$('recovery').hidden=true;
 const selected=s.units.find(u=>u.id===focusedHeroId&&u.hp>0);
 if(!selected){const survivor=s.units.find(u=>u.faction==='party'&&u.hp>0);if(survivor)focusedHeroId=survivor.id;}
 spectatorUI.render(s);
 for(const e of s.events){const id=s.run+':'+e.tick+':'+e.kind+':'+e.text;if(!seenEventIds.has(id)){seenEventIds.add(id);if(seenEventIds.size>150)seenEventIds.delete(seenEventIds.values().next().value);if(!firstSnapshot){cue(e,s);notifyDungeon(e)}}}
 if(sceneChanged){impactCameraHold=null;buildWorld(s);camera.userData.dungeonInitialized=false;camera.userData.aimInitialized=false;lastRayAuditAt=-Infinity;}
 const damageById=new Map(damageBeats.map(beat=>[beat.id,beat]));
 if(damageBeats.length){
  observedDamageBeats=Math.min(1000000,observedDamageBeats+damageBeats.length);
  observedFatalBeats=Math.min(1000000,observedFatalBeats+damageBeats.filter(beat=>beat.fatal).length);
  const focus=planImpactCameraHold(s,damageBeats);
  if(focus)impactCameraHold={encounter:focus,age:0};
 }
 const stagePositions=planCombatStage(s);
 crowdedStageActors=Object.values(stagePositions).filter(position=>position.crowded).length;
 const seen=new Set(s.units.map(u=>u.id));
 for(const [id,a] of actors)if(!seen.has(id)){disposeActor(a);actors.delete(id)}
 for(const u of s.units){let a=actors.get(u.id);if(!a){a=rig(u);a.ground=addContactProjection(a,{reducedMotion:reduced});actors.set(u.id,a);a.root.position.set(u.x-9,0,u.z-9);attachCharacter(a)}
  const damage=damageById.get(u.id);
  if(damage)a.damageBeat={...damage,age:0};
  else if(u.hp>0&&a.damageBeat?.fatal)a.damageBeat=null;
  if(a.u.actionTick!==u.actionTick||a.u.action!==u.action){a.actionStarted=timeNow();a.visualActionAge=0;}a.u=u;a.combatFacing=planCombatFacing(u,s.units,s.map);const staged=stagePoint(stagePositions,u);a.at.set(staged.x-9,0,staged.z-9);if(sceneChanged)a.root.position.copy(a.at);a.root.visible=u.hp>0||Boolean(a.damageBeat?.fatal&&a.damageBeat.age<DEATH_BEAT_DURATION);if(a.telegraph){
   const interval=s.bossPhase==='ECLIPSE'?4:6;
   a.telegraph.visible=u.hp>0&&Boolean(s.bossWarning);
   a.telegraph.material.color.set(s.bossPhase==='ECLIPSE'?'#c97aff':s.bossPhase==='RUPTURE'?'#ff9f62':'#ff7049');
  }}
 combatDirector.accept(s);
 combatDirector.recordDamage(damageBeats);
 world.userData.wardenRitual?.accept(s);
 soundstage?.acceptSnapshot(s);
 if(world.userData.courtShield){
  world.userData.courtShield.visible=Boolean(s.guardianWard);
  world.userData.courtShield.material.color.set('#9aaeff');
 }
 const warden=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 if(warden){wardenSpot.position.set(warden.x-9,2.2,warden.z-9);
  wardenSpot.color.set(s.guardianWard?'#89b9ff':s.bossPhase==='ECLIPSE'?'#ba72ff':s.bossPhase==='RUPTURE'?'#ff7b68':'#ffcc84');
  wardenSpot.intensity=s.bossPhase==='ECLIPSE'?3.2:s.bossPhase==='RUPTURE'?2.9:2.1;
 }else wardenSpot.intensity=0;
 for(const trap of s.traps||[]){const marker=world.userData.hazardMeshes?.get(trap.id);if(marker){marker.userData.active=trap.active;marker.userData.charge.visible=trap.active;marker.userData.ring.visible=!trap.disarmed;marker.scale.setScalar(trap.disarmed?.67:1)}}
 directCamera(s);
 renderDashboard(s);
 window.__DUNGEON_PUBLIC_STATE__=s;
}
let lastFrameTime=0;
const frameDeliveryProbe=createFrameIntervalProbe(180);
let frameDeliveryReport=null,lastFrameDeliveryReportAt=0;
// Hidden-tab throttling is not a foreground renderer performance measurement.
document.addEventListener('visibilitychange',()=>frameDeliveryProbe.resetClock());
// Actual 3D subject framing metrics, independent from overlay/card brightness.
const compositionHead=new THREE.Vector3(),compositionFoot=new THREE.Vector3();
const raycaster=new THREE.Raycaster(),rayStart=new THREE.Vector3(),rayEnd=new THREE.Vector3(),rayDirection=new THREE.Vector3();
let lastRayAuditAt=-Infinity,rayAudit={testedHeroes:0,unoccludedHeroes:0,occludedHeroes:0,testedBosses:0,unoccludedBosses:0,occludedBosses:0,samples:0};
function actualHeroVisibility(s,at){
 if(at-lastRayAuditAt<1.25)return rayAudit;
 lastRayAuditAt=at;
 const obstacles=[
   world.userData.walls,
   ...(world.userData.foregroundProps||[]),
   ...(world.userData.dressing?.occluders||[]),
   ...(world.userData.authoredProps?.group?.children||[])
 ].filter(o=>o?.visible!==false);
 let tested=0,clear=0,blocked=0,bosses=0,clearBosses=0,blockedBosses=0,samples=0;
 camera.getWorldPosition(rayStart);
 for(const hero of s.units.filter(u=>u.hp>0&&(u.faction==='party'||u.kind==='warden'))){
  const actor=actors.get(hero.id);if(!actor||actor.root.visible===false)continue;
  if(hero.kind==='warden')bosses++;else tested++;
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
  if(hero.kind==='warden'){if(good)clearBosses++;else blockedBosses++;}
  else if(good)clear++;else blocked++;
 }
 rayAudit={testedHeroes:tested,unoccludedHeroes:clear,occludedHeroes:blocked,testedBosses:bosses,unoccludedBosses:clearBosses,occludedBosses:blockedBosses,samples};
 return rayAudit;
}

function inspectComposition(s){
 if(!s)return {visibleHeroes:0,minHeroPixels:0,activeEnemies:0,subjectOnscreen:false,bossOnscreen:false};
 camera.updateMatrixWorld();
 const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
 let visibleHeroes=0,minHeroPixels=1e9,activeEnemies=0,subjectOnscreen=false,bossOnscreen=false;
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
  if(u.kind==='warden'&&within)bossOnscreen=true;
 }
 return {visibleHeroes,minHeroPixels:minHeroPixels===1e9?0:Math.round(minHeroPixels),activeEnemies,subjectOnscreen,bossOnscreen,viewport:{width:w,height:h}};
}
function animate(t){
 if(!document.hidden){
  frameDeliveryProbe.observe(t);
  // Sorting only 180 fixed-size samples once per second is outside the hot path.
  if(t-lastFrameDeliveryReportAt>=1000){frameDeliveryReport=frameDeliveryProbe.summary();lastFrameDeliveryReportAt=t;}
 }else frameDeliveryProbe.resetClock();
 requestAnimationFrame(animate);const time=t/1000,frameInterval=Math.max(0,time-lastFrameTime),dt=Math.min(.05,frameInterval);lastFrameTime=time;
 // Real software WebGL may render only once every few seconds. Preserve
 // frame-bound action animation, but let cinematic framing catch up with
 // the actual current boss and heroes in one bounded camera update.
 const cameraDt=Math.min(.24,frameInterval);
 if(impactCameraHold)impactCameraHold.age=advancePresentationActionAge(impactCameraHold.age,dt);
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life+=dt;
  if(e.life>=e.duration){scene.remove(e.mesh);e.mesh.material.dispose();effects.splice(i,1);continue}
  const progression=e.life/e.duration;e.mesh.scale.setScalar((e.large?.2:.13)+progression*(e.large?1.1:.80));e.mesh.material.opacity=.60*(1-progression);
 }
 shakeStrength=Math.max(0,shakeStrength-dt*.25);
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life+=dt;if(p.life>=p.duration){disposeParticle(p);particles.splice(i,1);continue}
  p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.mesh.material.opacity=.75*(1-p.life/p.duration);p.mesh.scale.multiplyScalar(1-.35*dt)}

 const w=canvas.clientWidth,h=canvas.clientHeight;
 if(w&&h){
  const nextDirectBudget=planDirectRenderBudget(w,h,directRequestedDpr,softwareWebGL,directRenderPixelCap);
  nextDirectBudget.shadows=nextDirectBudget.shadows&&!reduced;
  if(nextDirectBudget.pixelRatio!==directBudget.pixelRatio)renderer.setPixelRatio(nextDirectBudget.pixelRatio);
  directBudget=nextDirectBudget;
 }
 if(w&&h&&(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))){renderer.setSize(w,h,false);if(composer){const budget=planPostFXBudget(w,h,renderer.getPixelRatio(),bloomPixelCap);if(budget.pixelRatio!==postFXBudget?.pixelRatio)composer.setPixelRatio(budget.pixelRatio);composer.setSize(w,h);postFXBudget=budget;}camera.aspect=w/h;camera.updateProjectionMatrix()}
 const leader=(actors.get(focusedHeroId)?.u.hp>0?actors.get(focusedHeroId):null)||[...actors.values()].find(a=>a.u.faction==='party'&&a.u.hp>0);
 const encounterFrame=autoDirector&&cameraModes[cameraIndex]==='cinematic'?planEncounterFrame(state):null;
 const heldImpact=impactCameraHold?.age<(impactCameraHold?.encounter.mode==='final-blow'?.72:.43)&&!state?.bossWarning?impactCameraHold.encounter:null;
 const cinematicShot=autoDirector&&cameraModes[cameraIndex]==='cinematic'?planCinematicShot(state,heldImpact||encounterFrame,{width:w,height:h,focusedHeroId}):null;
 const target=cinematicShot?new THREE.Vector3(cinematicShot.x-9,0,cinematicShot.z-9):encounterFrame?new THREE.Vector3(encounterFrame.x-9,0,encounterFrame.z-9):(leader?.at??new THREE.Vector3(0,0,0));
 for(const a of actors.values()){const moving=a.root.position.distanceTo(a.at)>.07;a.root.position.lerp(a.at,reduced?1:.17);const bounce=reduced?0:Math.sin(time*5+a.at.x)*.028;a.body.position.y=bounce;a.leftLeg.rotation.x=moving?Math.sin(time*10)*.35:0;a.rightLeg.rotation.x=-a.leftLeg.rotation.x;a.leftArm.rotation.x=moving?Math.sin(time*10)*.22:0;a.rightArm.rotation.x=-a.leftArm.rotation.x;
  // One-shots age by actual rendered frames; a stalled software WebGL frame must
  // not skip the attack, spell or impact before the spectator sees its first pose.
  const oneShot=['attack','cast','hurt'].includes(a.u.action);
  const since=oneShot?(a.visualActionAge??0):time-(a.actionStarted??time);
  if(oneShot)a.visualActionAge=advancePresentationActionAge(since,dt);
  const phase=Math.max(0,Math.min(1,since/.32));
  if(a.u.action==='attack'&&since<.32){a.rightArm.rotation.x=-1.5*Math.sin(phase*Math.PI);a.body.rotation.z=.16*Math.sin(phase*Math.PI)}
  else if(a.u.action==='cast'&&since<.45){a.rightArm.rotation.x=-1.55*Math.sin(Math.min(1,since/.45)*Math.PI);a.leftArm.rotation.x=-.85;a.body.rotation.z=0}
  else if(a.u.action==='guard'&&since<.42){a.rightArm.rotation.x=-.85;a.leftArm.rotation.x=-1.1;a.body.rotation.x=-.16;}
  else if(a.u.action==='hurt'&&since<.30){a.body.rotation.z=.16*Math.sin(phase*Math.PI*2);a.body.position.y+=.10*Math.sin(phase*Math.PI)}
  else {a.body.rotation.z*=.65;a.body.rotation.x*=.70;}
  if(a.telegraph)a.telegraph.material.opacity=.42+.2*Math.sin(time*9);
  if(!a.authored)a.detail?.update(time,a.u.action||'idle');a.ground?.update(time,a.u.action||'idle',a.u.hp>0);updateActor(a,dt,since,reduced);
  // One shared read-only pivot brings the complete skinned rig, armour,
  // accessories and the procedural fallback through the SAME real hit beat.
  if(a.damageBeat){
   a.damageBeat.age=advancePresentationActionAge(a.damageBeat.age,dt);
   const recoil=planDamageReaction(a.u.kind,a.damageBeat.damage,a.damageBeat.maxHp,a.damageBeat.age,a.damageBeat.fatal,reduced);
   a.impactPivot.position.set(recoil.x,recoil.y,recoil.z);
   a.impactPivot.rotation.set(recoil.pitch,0,recoil.roll);
   if(a.damageBeat.fatal&&a.damageBeat.age>=DEATH_BEAT_DURATION)a.root.visible=false;
  }else{a.impactPivot.position.set(0,0,0);a.impactPivot.rotation.set(0,0,0);}
  // The actual public Warden warning, and only that warning, brings his
  // arms and torso into an escalating pre-strike silhouette. Imported skeleton
  // animations stay intact and take precedence when the real attack lands.
  if(a.u.kind==='warden'&&a.u.hp>0){
   const anticipation=planWardenCharge(state?.bossWarning,state?.tick,reduced);
   if(a.authored&&a.visualPivot){a.visualPivot.position.y+=anticipation.lift;a.visualPivot.rotation.x+=anticipation.pitch;}
   else {a.body.rotation.x+=anticipation.pitch;a.leftArm.rotation.x+=anticipation.armRaise;a.rightArm.rotation.x+=anticipation.armRaise;}
  }
  const visualYaw=a.combatFacing?.yaw??(moving?planMovementFacing(a.root.position.x,a.root.position.z,a.at.x,a.at.z):null);
  if(visualYaw!==null)a.root.rotation.y=approachCharacterYaw(a.root.rotation.y,visualYaw,dt,reduced);
 }
 // Pose every live rig before sampling its skinned weapon hand for effects.
 combatDirector.animate(dt);
 if(world.userData.portal&&!reduced)world.userData.portal.rotation.y=time*.26;
 if(world.userData.court&&!reduced)world.userData.court.rotation.y=Math.sin(time*.3)*.035;
 world.userData.wardenRitual?.animate(time,dt);
 if(!reduced&&wardenSpot.intensity>0)wardenSpot.intensity*=.998+.002*Math.sin(time*3.1);
 if(!reduced&&world.userData.hazardMeshes)for(const trap of world.userData.hazardMeshes.values()){
  if(trap.userData.active){trap.userData.ring.rotation.z=time*.4;trap.userData.charge.scale.y=.9+Math.sin(time*3+trap.position.x)*.14}
 }
 if(world.userData.dressing&&!reduced)world.userData.dressing.animate(time);
 if(world.userData.atmosphere&&!reduced)world.userData.atmosphere.update(time);
 if(world.userData.livingWorld&&!reduced)world.userData.livingWorld.update(time);
 // Camera composition must favour real readable characters over empty skyline.
 // Focus stays locked on the chosen AI protagonist and widens only if party
 // members truly diverge. These are 3D metre offsets, not CSS zoom tricks.
 const cameraType=cameraModes[cameraIndex]||'cinematic';
 const cinematicLens=cameraType==='cinematic'&&cinematicShot?planReadableExpeditionLens(cinematicShot,{width:w,height:h,reducedMotion:reduced}):null;
 const spread=state?.units.filter(u=>u.faction==='party'&&u.hp>0)
  .reduce((highest,u)=>Math.max(highest,Math.hypot((u.x-9)-target.x,(u.z-9)-target.z)),0)??0;
 const mobileShot=canvas.clientWidth<590;
 const margin=Math.min(2.8,Math.max(0,spread-1.7)*.28)+(mobileShot?1.4:0);
 const offsets=cameraType==='tactical'?[3.5,23.5,4.5]:
  cameraType==='chase'?[4.15+margin*.45,7.8+margin,5.1+margin*.55]:
  // This shot is authored around the actual combatants; never DOUBLE-zoom
  // for a wandering companion after the director has chosen its subjects.
  cinematicLens?cinematicLens.offsets:
  encounterFrame?[4.75+margin*.5,7.65+margin*.85,5.25+margin*.58]:
  [5.45+margin*.57,9.05+margin,6.2+margin*.68];
 const boss=state?.units.find(u=>u.kind==='warden'&&u.hp>0),bossDistance=boss&&state?.units.some(u=>u.faction==='party'&&u.hp>0&&Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=5);
 const shot=encounterTarget(target,boss,state?.map.length??19,Boolean(bossDistance&&cameraType==='cinematic'));
 const look=new THREE.Vector3(shot.x,0,shot.z);
 // Frame the actual encounter midpoint, not a fabricated nine-tile offset that pushes the boss and heroes offscreen.
 // encounterTarget already converted the boss grid coordinates to world space.
 const plannedCamera=planBoundaryCamera(look,state?.map?.length??19,offsets);
 // One lens update, no extra GPU passes. Measured actor scale takes priority
 // over distant party coverage; imminent real hazards trigger a wide overview.
 const wantedFov=cinematicLens?.fov??50;
 const nextFov=reduced?wantedFov:camera.fov+(wantedFov-camera.fov)*Math.min(1,cameraDt*5.2);
 if(Math.abs(camera.fov-nextFov)>.015){camera.fov=nextFov;camera.updateProjectionMatrix()}
 const cam=new THREE.Vector3(plannedCamera.position.x,plannedCamera.position.y,plannedCamera.position.z);
 // Avoid flying through walls on first frame before the cinematic camera settles.
 if(!camera.userData.dungeonInitialized){camera.position.copy(cam);camera.userData.dungeonInitialized=true;}
 else camera.position.lerp(cam,reduced?1:Math.min(1,cameraDt*(cinematicLens?.following??4.6)));
 // Body-height aiming makes armor and weapon contact legible, with eased
 // transitions across real scene states instead of neck-snapping camera cuts.
 const desiredAim=new THREE.Vector3(look.x,cinematicLens?.lookY??cinematicShot?.lookY??0,look.z);
 if(!camera.userData.aimInitialized){cameraAim.copy(desiredAim);camera.userData.aimInitialized=true;}
 else cameraAim.lerp(desiredAim,reduced?1:Math.min(1,cameraDt*5.5));
 camera.lookAt(cameraAim);
 // The genuine visible Warden, nearest frontline hero and real danger cells
 // outrank a cinematic close-up that CROPS the encounter. Fit their current
 // Three.js skeletal/body coordinates AFTER the physical boundary orbit.
 // No simulated boss action, duplicated model or extra draw pass is involved.
 let criticalCameraFit=null;
 if(cameraType==='cinematic'&&cinematicShot?.mode?.startsWith('warden-')){
  camera.updateMatrixWorld(true);
  const subjects=[];
  for(const id of cinematicShot.subjects.slice(0,3)){
   const actor=actors.get(id);
   if(!actor||actor.u.hp<=0||!actor.root.visible)continue;
   for(const y of [.08,actor.u.kind==='warden'?2.38:1.96]){
    const point=camera.worldToLocal(actor.root.localToWorld(new THREE.Vector3(0,y,0)));
    subjects.push({x:point.x,y:point.y,z:point.z});
   }
  }
  if(state?.bossWarning&&Array.isArray(state.bossWarning.cells)){
   const half=(state.map.length-1)/2;
   for(const cell of state.bossWarning.cells.slice(0,32)){
    if(!Number.isInteger(cell.x)||!Number.isInteger(cell.z))continue;
    const point=camera.worldToLocal(new THREE.Vector3(cell.x-half,.08,cell.z-half));
    subjects.push({x:point.x,y:point.y,z:point.z});
   }
  }
  criticalCameraFit=planCriticalSubjectFit(subjects,camera.aspect,wantedFov);
  if(criticalCameraFit.fov>camera.fov+.02){
   // A live critical threat must enter frame immediately; the authored lens
   // relaxes gradually after the attack, rather than wobbling per render.
   camera.fov=criticalCameraFit.fov;camera.updateProjectionMatrix();
  }
 }
 // The camera must settle before the cutaway is measured. Previous frames culled
 // props using stale view angles during cinematic shot switches.
 const partySightlines=planEncounterSightlines(state,target,Boolean(bossDistance));
 // Clear the real Warden-to-camera corridor during actual boss combat;
 // ordinary traversal retains the narrower party-only sightlines.
 const origin=state?.map?.length?(state.map.length-1)/2:9;
 world.userData.cutawaySubjectCount=partySightlines.length;
 world.userData.bossCutawayActive=Boolean(bossDistance&&boss&&partySightlines.some(({x,z})=>x===boss.x-origin&&z===boss.z-origin));
 cutawayWalls(target,partySightlines);world.userData.dressing?.cutaway(partySightlines,camera.position);
  world.userData.wardenRitual?.setSightlines(partySightlines,camera.position);
 if(world.userData.authoredProps?.group){
  for(const prop of world.userData.authoredProps.group.children){
   prop.visible=!sightlineClearance(prop.position.x,prop.position.z,partySightlines,camera.position,2.4);
  }
 }

 if(shakeStrength>.008&&!reduced){camera.position.x+=Math.sin(time*57)*shakeStrength;camera.position.y+=Math.cos(time*43)*shakeStrength*.5;}
 partyGlow.position.set(target.x,2,target.z);
 heroKey.position.set((leader?.root.position.x??target.x)+1.35,2.9,(leader?.root.position.z??target.z)+2.05);
 heroKey.intensity=(leader?.u.action==='cast'?3.6:leader?.u.action==='attack'?3.1:2.65)*(cinematicLens?.keyScale??1);
 renderer.info.reset();
 try{if(composer&&postFXEnabled){
  bloomPass.strength=innerWidth<680?.16:.30;
  const postFXFrameStart=performance.now();
  composer.render();
  bloomRenderMs=performance.now()-postFXFrameStart;
  // Trace-verified slow software WebGL can starve toggles for 10+ seconds.
  // Never mislabel direct rendering as bloom: actually reduce optional GPU work
  // after a measured heavy compositor frame, retaining native direct-render DPR.
  const stall=postFXStallAction(bloomRenderMs,bloomSlowStreak);
  bloomSlowStreak=stall.slowStreak;
  if(stall.disable){
   // A compositor that blocks the host browser for seconds is less useful
   // than an unadorned moving dungeon. Preserve scene and spectator truth.
   postFXEnabled=false;bloomAutoDisabled=true;postFXStatus='performance-fallback';
   fxButton.setAttribute('aria-pressed','false');
   fxButton.querySelector('span').textContent='DIRECT 3D';
   fxButton.title='Glow paused after measured slow WebGL rendering; direct 3D remains active';
  }
  const nextCap=adaptPostFXPixelCap(bloomPixelCap,performance.now()-postFXFrameStart);
  if(!stall.disable&&nextCap<bloomPixelCap){
   bloomPixelCap=nextCap;
   const budget=planPostFXBudget(w,h,renderer.getPixelRatio(),bloomPixelCap);
   composer.setPixelRatio(budget.pixelRatio);composer.setSize(w,h);postFXBudget=budget;bloomDownshifts++;
  }
 }else{
  const directFrameStart=performance.now();
  renderer.render(scene,camera);
  if(softwareWebGL){
   directRenderMs=performance.now()-directFrameStart;
   const adjustment=adaptDirectRenderPixelCap(directRenderPixelCap,directRenderMs,directSlowStreak);
   directSlowStreak=adjustment.slowStreak;
   if(adjustment.downshift){directRenderPixelCap=adjustment.maxPixels;directDownshifts++}
  }
 }}
 catch(error){console.warn('[DUNGEON] post effect fault, restoring WebGL:',String(error));try{composer?.dispose()}catch{}composer=null;bloomPass=null;postFXStatus='fallback';postFXEnabled=false;fxButton.title='Glow unavailable: direct rendering remains active';fxButton.setAttribute('aria-pressed','false');fxButton.querySelector('span').textContent='DIRECT 3D';renderer.info.reset();renderer.render(scene,camera)}
 combatOverlay.render(state,actors,camera,time);if(state)window.__DUNGEON_RENDER_DIAGNOSTICS__={composition:inspectComposition(state),visibility:actualHeroVisibility(state,time),frame:renderer.info.render.frame,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:cameraModes[cameraIndex],cameraSpread:spread,cameraMargin:margin,encounterFrame:encounterFrame??null,cinematicShot:cinematicShot??null,cinematicLens:cinematicLens??null,criticalCameraFit,cameraFrameDt:cameraDt,cinematicAim:{x:cameraAim.x,y:cameraAim.y,z:cameraAim.z},cameraRig:{mode:cameraType,desiredPosition:plannedCamera.position,actualPosition:{x:camera.position.x,y:camera.position.y,z:camera.position.z},turn:plannedCamera.turn,boundaryLimit:plannedCamera.boundaryLimit},focusedHeroId,autoDirector,cutawayWalls:world.userData.cutawayWalls??0,wallMatrixWrites:world.userData.wallMatrixWrites??0,parapetMatrixWrites:world.userData.parapetMatrixWrites??0,cutawayNearbyWalls:world.userData.cutawayNearbyWalls??0,cutawaySubjects:world.userData.cutawaySubjectCount??0,bossCutawayActive:world.userData.bossCutawayActive??false,cutawayParapets:world.userData.cutawayParapets??0,foundationBricks:world.userData.foundationBrickPositions?.length??0,clearedFoundationBricks:world.userData.clearedFoundationBricks??0,foundationMatrixWrites:world.userData.foundationMatrixWrites??0,wallProfiles:world.userData.wallProfileMetrics??null,wallSculpture:world.userData.wallSculpture??null ,stoneGrade:{biome:floorThemes[(state.floor-1)%floorThemes.length].biome,wallTint:stone.color.getHexString(),floorTint:floorMat.color.getHexString(),trimTint:stoneEdge.color.getHexString(),keyFill:moon.color.getHexString(),partyFill:partyGlow.color.getHexString(),partyIntensity:partyGlow.intensity,wallTextureMapped:Boolean(wallMasonryTexture&&stone.map===wallMasonryTexture)},wallMasonry:{size:wallMasonryTexture?.image?.width??0,mapped:Boolean(wallMasonryTexture&&stone.map===wallMasonryTexture),bump:Boolean(wallMasonryTexture&&stone.bumpMap===wallMasonryTexture),bumpScale:stone.bumpScale},floorRuins:world.userData.floorRuins?.metrics??null,hiddenForegroundProps:world.userData.hiddenForegroundProps??0,postFX:composer&&postFXEnabled?'bloom':'direct',postFXStatus,postFXBudget,bloomRenderMs,bloomDownshifts,postFXAutoDisabled:bloomAutoDisabled,frameDelivery:frameDeliveryReport,softwareWebGL,directRenderBudget:directBudget,directRenderMs,directDownshifts,heroKeyIntensity:heroKey.intensity,guardianWard:Boolean(state.guardianWard),bossWarning:state.bossWarning?{shape:state.bossWarning.shape,axis:state.bossWarning.axis,attackTick:state.bossWarning.attackTick,cells:state.bossWarning.cells.length}:null,wardenRitual:world.userData.wardenRitual?.metrics()??null,wardBarrierVisible:Boolean(world.userData.courtShield?.visible),defendersRemaining:state.defendersRemaining??0,bossFramed:Boolean(bossDistance),cameraLook:{x:look.x,z:look.z},activeUnits:[...actors.values()].filter(x=>x.root.visible).length,characterDetails:[...actors.values()].reduce((sum,x)=>sum+(x.detail?.parts||0),0),combatFacingActors:[...actors.values()].filter(x=>x.combatFacing&&x.root.visible).length,alignedCombatActors:[...actors.values()].filter(x=>x.combatFacing&&x.root.visible&&Math.abs(shortestYawDelta(x.root.rotation.y,x.combatFacing.yaw))<.18).length,webgl:true,theme:state.theme,dressing:world.userData.dressing?.metrics??null,atmosphere:world.userData.atmosphere?.metrics??null,livingWorld:world.userData.livingWorld?.metrics??null,overlay:combatOverlay.metrics(),soundstage:soundstage?.stats()??null,combatStage:combatDirector.stats(),damageChoreography:{observedDamageBeats,observedFatalBeats,activeReactions:[...actors.values()].filter(a=>a.root.visible&&a.damageBeat&&!a.damageBeat.fatal&&a.damageBeat.age<DAMAGE_BEAT_DURATION).length,visibleFallen:[...actors.values()].filter(a=>a.root.visible&&a.damageBeat?.fatal&&a.damageBeat.age<DEATH_BEAT_DURATION).length,maxFallenPitch:Math.max(0,...[...actors.values()].filter(a=>a.root.visible&&a.damageBeat?.fatal).map(a=>Math.abs(a.impactPivot.rotation.x))),impactCameraHold:heldImpact?.mode??null},combatStaging:{separatedActors:crowdedStageActors,maxOffsetMeters:MAX_STAGE_OFFSET},groundedActors:[...actors.values()].filter(x=>Boolean(x.ground)).length,groundSignals:(()=>{const states=[...actors.values()].map(x=>x.ground?.getState?.()).filter(Boolean);return{subjects:states.length,shadows:states.filter(x=>x.shadowVisible).length,ritualSigils:states.filter(x=>x.sigilVisible).length,coronas:states.filter(x=>x.coronaVisible).length}})(),authoredMotionPivots:[...actors.values()].filter(x=>x.authored&&x.visualPivot).length,authoredCombatPoseActors:[...actors.values()].filter(x=>x.authored&&['attack','cast','hurt'].includes(x.u.action)).length,authoredMotionMaxOffset:[...actors.values()].reduce((m,x)=>Math.max(m,x.visualPivot?.position.length()||0),0),authoredMotionPeak:[...actors.values()].reduce((m,x)=>Math.max(m,x.motionPeak||0),0),authored3D:assetStats(actors)};
}
async function poll(){try{const r=await fetch('/dungeon/state',{cache:'no-store'});if(!r.ok)throw Error('State '+r.status);const data=await r.json();if(data.tick!==lastTick||data.run!==state?.run){lastTick=data.tick;update(data)}}catch(e){errorAt++;if(errorAt>=3){$('recovery').hidden=false;$('status').textContent='VIEW DEGRADED — RETRYING';console.warn('Dungeon view recovery',String(e))}}finally{setTimeout(poll,190)}}
$('party').addEventListener('click',e=>{
 const node=e.target.closest('[data-hero-id]');if(!node)return;
 const unit=state?.units.find(u=>u.id===node.dataset.heroId&&u.faction==='party'&&u.hp>0);
 if(!unit)return;
 focusedHeroId=unit.id;autoDirector=false;$('director-toggle').setAttribute('aria-pressed','false');$('director-toggle').querySelector('span').textContent='Manual follow';$('focus-label').textContent='FOLLOWING '+(classMeta[unit.kind]?.name||unit.kind).toUpperCase();
 for(const el of document.querySelectorAll('.hero-card')){el.dataset.focused=String(el.dataset.heroId===focusedHeroId);el.setAttribute('aria-pressed',String(el.dataset.heroId===focusedHeroId))}
});
$('party').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const card=e.target.closest('[data-hero-id]');if(card){e.preventDefault();card.click()}}});
$('director-toggle').addEventListener('click',()=>{
 autoDirector=!autoDirector;
 $('director-toggle').setAttribute('aria-pressed',String(autoDirector));
 $('director-toggle').querySelector('span').textContent=autoDirector?'Director':'Manual follow';
 lastAutoSwitch=0;
});
const cameraModes=['cinematic','tactical','chase'];let cameraIndex=0;const viewButton=$('view-toggle');
viewButton.addEventListener('click',()=>{cameraIndex=(cameraIndex+1)%cameraModes.length;viewButton.querySelector('span').textContent=cameraModes[cameraIndex].toUpperCase();viewButton.setAttribute('aria-label','Camera: '+cameraModes[cameraIndex]+'; change view');});
document.body.dataset.reducedMotion=String(reduced);requestAnimationFrame(animate);poll();