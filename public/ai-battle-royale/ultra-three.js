'use strict';
/* Gauntlet Ultra — optional real skinned GLB Three.js renderer.
 * Runs only with ?renderer=three, uses only the existing public AI snapshot,
 * consumes the same first-party world geometry, and never updates game rules.
 * Quaternius CC0 model + MIT Three.js are served from this project locally.
 */
import * as THREE from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {clone as cloneSkin} from './vendor/utils/SkeletonUtils.js';

const opts=new URLSearchParams(location.search);
if(opts.get('renderer')!=='three')throw Error('Ultra renderer is opt-in via renderer=three');
const stage=document.querySelector('.arena-shell');
const source=window.BattleArena3D;
if(!stage||!source)throw Error('Battle Ultra needs the live public-state renderer');
const state={mode:'initializing',frames:0,meshes:0,actors:0,worldRebuilds:0,
  lastError:null,source:'Quaternius CC0 humanoid',sourceFile:'/battle/models/quaternius-hero.glb',
  materialAtlas:'fallback',joints:0,
  gpu:'three-r182',animation:'original AI intent driven bone poses'};
window.BattleUltraThree=state;
const colors={vanguard:0xf48154,ranger:0x47cfff,
  scavenger:0xffc355,tactician:0x9ceb7b};
const zones={
  ember:{sky:0xcc916c,fog:0x9b8770,ambient:0xa6c4da,sun:0xffe5af},
  neon:{sky:0x273763,fog:0x455681,ambient:0x94b7f6,sun:0xe5cfff},
  arctic:{sky:0x9bd3e4,fog:0x8cc3d8,ambient:0xb9dcf9,sun:0xffffff}
};
let renderer,scene,camera,wideCamera,sun,hemisphere,terrain,ambientProps;
let template,bounds,unitScale=1,modelYOffset=0,lastExportVersion=0,lastStaticKey='';
let raf=0,ready=false,models=new Map(),bonesByModel=new WeakMap();
let nametagLayer=null,clockTime=0,tracked=new THREE.Vector3(),cameraPosition=new THREE.Vector3();
let atlasLoaded=false,atlasTexture=null,atlasLoading=false,biomeMaterialRow=0;
const texturedMaterials=opts.get('ultraMaterial')!=='off';
const uvScale=1/3.3;
const scratch=new THREE.Vector3();
const currentFighter=(frame)=>{
  const alive=frame.snapshot.combatants.filter(f=>f.alive);
  return alive.find(f=>f.id===frame.cameraTargetId)
    ||alive.find(f=>f.id===frame.snapshot.focus?.id)
    ||alive[0]||null;
};
function positionOf(f,width){
  return {x:f.visual?.x??(f.cell%width+.5),z:f.visual?.z??(Math.floor(f.cell/width)+.5)};
}
function numberSeed(id){
  return [...String(id||'character')].reduce((hash,ch)=>
    (Math.imul(hash,33)+ch.charCodeAt(0))>>>0,0x811c9dc5);
}
function setWorldVertexGeometry(vertices){
  const geo=new THREE.BufferGeometry();
  const n=Math.floor(vertices.length/9);
  const pos=new Float32Array(n*3),norm=new Float32Array(n*3),
    rgb=new Float32Array(n*3),uv=new Float32Array(n*2);
  for(let i=0;i<n;i++){
    const src=i*9,dst=i*3;
    pos[dst]=vertices[src];pos[dst+1]=vertices[src+1];pos[dst+2]=vertices[src+2];
    norm[dst]=vertices[src+3];norm[dst+1]=vertices[src+4];norm[dst+2]=vertices[src+5];
    rgb[dst]=vertices[src+6];rgb[dst+1]=vertices[src+7];rgb[dst+2]=vertices[src+8];
    // Tile only within the authored 2-column/3-row surface atlas cells.
    // This is a real glTF/Three.js texture coordinate attribute, not a
    // procedural lighting tint. Walls use the cladding atlas column.
    const isFloor=Math.abs(norm[dst+1])>.70;
    const column=isFloor?0:1;
    const ux=isFloor?pos[dst]:Math.abs(norm[dst])>Math.abs(norm[dst+2])
      ?pos[dst+2]:pos[dst];
    const vz=isFloor?pos[dst+2]:pos[dst+1];
    let u=((ux*uvScale)%1+1)%1,v=((vz*uvScale)%1+1)%1;
    u=Math.max(.010,Math.min(.990,u));v=Math.max(.010,Math.min(.990,v));
    uv[i*2]=(column+u)/2;
    uv[i*2+1]=(biomeMaterialRow+v)/3;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('normal',new THREE.BufferAttribute(norm,3));
  geo.setAttribute('color',new THREE.BufferAttribute(rgb,3));
  geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  geo.computeBoundingSphere();
  return geo;
}
const groundMaterial=new THREE.MeshStandardMaterial({
  vertexColors:true,roughness:.73,metalness:.16,side:THREE.DoubleSide
});
const effectsMaterial=new THREE.MeshStandardMaterial({
  vertexColors:true,roughness:.42,metalness:.19,
  side:THREE.DoubleSide,emissive:0x0a1224,emissiveIntensity:.22
});
async function loadEnvironmentAtlas(){
  if(!texturedMaterials||atlasLoading)return;
  atlasLoading=true;
  try{
    const texture=await new THREE.TextureLoader().loadAsync('/battle/material-atlas.svg');
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=THREE.ClampToEdgeWrapping;
    texture.wrapT=THREE.ClampToEdgeWrapping;
    texture.magFilter=THREE.LinearFilter;
    texture.minFilter=THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps=true;
    atlasTexture=texture;atlasLoaded=true;
    groundMaterial.map=texture;
    groundMaterial.needsUpdate=true;
    effectsMaterial.map=texture;
    effectsMaterial.needsUpdate=true;
    state.materialAtlas='ready';
  }catch(error){
    atlasLoaded=false;state.materialAtlas='fallback';
  }
}
function assignModelMaterial(root,character){
  const main=new THREE.Color(colors[character.archetype]||0xb7e6ee);
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;obj.receiveShadow=true;obj.frustumCulled=false;
    const base=Array.isArray(obj.material)?obj.material[0]:obj.material;
    const mat=base.clone();
    mat.color.copy(main);
    mat.roughness=.43;mat.metalness=.13;
    mat.emissive=main.clone().multiplyScalar(.075);
    obj.material=mat;
  });
}
function getSkeletonBones(root){
  const joints=[];
  root.traverse(node=>{
    if(!node.isBone)return;
    const raw=(node.name||'').toLowerCase();
    const name=raw.replace(/[^a-z0-9]/g,'');
    // Quaternius rig uses upperarm_l, lowerarm_r, thigh_l, calf_r.
    // Derive side from original names, BEFORE stripping underscores.
    const side=/(?:_l|\.l|left)$/.test(raw)?'left':
      /(?:_r|\.r|right)$/.test(raw)?'right':null;
    const role=/^thigh/.test(name)?'leg':
      /^calf|shin/.test(name)?'shin':
      /^upperarm/.test(name)?'arm':
      /^lowerarm|forearm/.test(name)?'forearm':
      /^spine|pelvis/.test(name)?'torso':
      /^head$|^neck/.test(name)?'head':null;
    if(role)joints.push({bone:node,name,side,role,rest:node.rotation.clone()});
  });
  return joints;
}
function createWeapon(f){
  const specs={
    carbine:{length:.78,barrel:.040,scope:true,stock:.21},
    marksman:{length:1.05,barrel:.031,scope:true,stock:.25},
    scattergun:{length:.71,barrel:.075,scope:false,stock:.27},
    sidearm:{length:.39,barrel:.051,scope:false,stock:.07}
  };
  const spec=specs[f.weapon]||specs.carbine;
  const weapon=new THREE.Group();
  const dark=new THREE.MeshStandardMaterial({color:0x192332,roughness:.35,metalness:.79});
  const iron=new THREE.MeshStandardMaterial({color:0x566779,roughness:.35,metalness:.68});
  const highlight=new THREE.MeshStandardMaterial({
    color:colors[f.archetype]||0xb7e6ee,metalness:.66,roughness:.25,
    emissive:colors[f.archetype]||0xb7e6ee,emissiveIntensity:.10
  });
  function box(w,h,d,x,y,z,material){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    m.position.set(x,y,z);m.castShadow=true;weapon.add(m);return m;
  }
  function cylinder(r,d,x,y,z,material){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,12),material);
    m.rotation.x=Math.PI*.5;m.position.set(x,y,z);m.castShadow=true;
    weapon.add(m);return m;
  }
  // Distinct primary receiver, barrel, buttstock, mag and grip.
  box(.13,.18,spec.length*.59,0,.045,spec.length*.39,dark);
  cylinder(spec.barrel,spec.length*.57,0,.070,spec.length*.76,iron);
  box(.11,.14,spec.stock,0,.018,-spec.stock*.42,dark);
  box(.10,.23,.10,0,-.16,.17,dark);
  box(.12,.21,.11,0,-.17,.32,iron);
  box(.17,.062,spec.length*.43,0,.16,spec.length*.37,iron);
  box(.15,.055,.20,0,.18,spec.length*.28,highlight);
  if(spec.scope){
    cylinder(.047,.25,0,.225,.40,dark);
    cylinder(.057,.045,0,.225,.52,iron);
  }
  if(f.weapon==='scattergun'){
    cylinder(.085,.15,0,.06,spec.length*.96,dark);
    box(.19,.065,.29,0,-.04,.37,iron);
  }
  if(f.weapon==='sidearm')box(.09,.16,.08,0,-.23,.14,dark);
  weapon.position.set(.19,1.18,.24);
  weapon.rotation.x=0;
  const flash=new THREE.Mesh(new THREE.ConeGeometry(.105,.27,8),
    new THREE.MeshBasicMaterial({color:0xffe26b,transparent:true,opacity:.86,depthWrite:false}));
  flash.rotation.x=-Math.PI*.50;
  flash.position.set(0,.06,spec.length+0.23);
  flash.visible=false;weapon.add(flash);
  return{weapon,flash};
}
function createHeroAccessories(f,holder){
  const accent=new THREE.Color(colors[f.archetype]||0xb7e6ee);
  const dark=new THREE.MeshStandardMaterial({color:0x1b2735,metalness:.48,roughness:.58});
  const suit=new THREE.MeshStandardMaterial({color:accent,metalness:.36,roughness:.39});
  const glow=new THREE.MeshStandardMaterial({color:accent,emissive:accent,
    emissiveIntensity:.23,metalness:.42,roughness:.28});
  function component(g,x,y,z,w,h,d,material){
    const mesh=new THREE.Mesh(g||new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
    holder.add(mesh);return mesh;
  }
  // Equipment decals and original upper-body armor variation.
  component(null,0,1.19,-.26,.41,.54,.14,dark);
  component(null,0,1.27,-.345,.24,.28,.044,suit);
  for(const side of [-1,1]){
    component(null,side*.24,1.42,.10,.21,.16,.31,suit);
    component(null,side*.245,.83,.13,.13,.16,.12,dark);
    component(null,side*.245,.86,.20,.11,.055,.057,glow);
    component(null,side*.13,1.44,.205,.055,.36,.09,dark);
  }
  component(null,0,1.30,.235,.28,.11,.065,glow);
  const variant=numberSeed(f.id)%4;
  if(variant===0){
    component(new THREE.CylinderGeometry(.03,.04,.21,7),.15,1.94,-.03,0,0,0,glow);
    component(null,0,1.66,.17,.29,.095,.09,glow);
  }else if(variant===1){
    component(null,-.12,1.05,-.37,.11,.35,.10,dark);
    component(null,.12,1.05,-.37,.11,.35,.10,dark);
    component(null,0,.97,.26,.24,.105,.057,glow);
  }else if(variant===2){
    component(null,.31,1.13,.23,.16,.26,.11,glow);
    component(null,.08,1.78,.18,.19,.07,.075,dark);
  }else{
    component(null,0,1.52,.23,.33,.16,.10,suit);
    component(null,0,1.53,.29,.16,.045,.03,glow);
  }
}
function ensureActor(f){
  let item=models.get(f.id);
  if(item)return item;
  const clone=cloneSkin(template);
  const holder=new THREE.Group();
  clone.scale.setScalar(unitScale);
  clone.position.y=modelYOffset;
  holder.add(clone);
  createHeroAccessories(f,holder);
  const firearm=createWeapon(f);
  holder.add(firearm.weapon);
  assignModelMaterial(clone,f);
  scene.add(holder);
  item={holder,bones:getSkeletonBones(clone),weapon:firearm.weapon,muzzle:firearm.flash,
    actor:f,moved:false,prevCell:f.cell};
  models.set(f.id,item);
  return item;
}
function animateSkeleton(model,f,time){
  const running=model.moved&&(/pursuing|seeking|fallback/.test(f.intent||''));
  const moving=model.moved;
  const fighting=f.intent==='attacking',healing=f.intent==='healing';
  const phase=time*(running?10:7)+(numberSeed(f.id)%15);
  const stride=moving?Math.sin(phase)*(running?.48:.29):0;
  const idle=Math.sin(time*2.4+numberSeed(f.id)%4)*.013;
  for(const joint of model.bones){
    const {bone,side,role,rest}=joint,flip=side==='left'?1:-1;
    let x=rest.x,y=rest.y,z=rest.z;
    if(role==='leg')x+=flip*stride*(healing?.32:1);
    if(role==='shin')x+=Math.max(0,-flip*stride)*.42;
    if(role==='arm')x+=fighting?-.62:healing?-.35:-flip*stride*.66;
    if(role==='forearm')x+=fighting?-.51:healing?-.43:Math.max(0,flip*stride)*.19;
    if(role==='torso'){z+=idle*.45;y+=Math.sin(time*.62)*.013;}
    if(role==='head')y+=Math.sin(time*.71+flip)*.016;
    bone.rotation.set(x,y,z);
  }
  model.holder.position.y=moving?Math.abs(Math.sin(phase))*.038:idle;
  // Mechanical, intentional gun stance rather than a permanently idle prop.
  model.weapon.visible=!healing;
  model.weapon.rotation.x=fighting?-.18:running?.08:0;
  model.weapon.position.y=1.15+(fighting?.12:idle);
  model.weapon.position.z=.24+(fighting?.14:.02);
  // Shoot only if authoritative public events report a legal hit/miss.
  model.muzzle.visible=!healing&&Boolean(model.fireUntil&&time<model.fireUntil);
}
function placeActor(model,f,frame,now){
  const w=frame.snapshot.arena.width,p=positionOf(f,w);
  model.moved=model.prevCell!==f.cell;
  model.prevCell=f.cell;model.actor=f;
  model.fireUntil=frame.snapshot.recentEvents.some(e=>
    (e.type==='hit'||e.type==='miss')&&e.actorId===f.id&&e.tick>=frame.snapshot.tick-1)
    ?now+.12:Math.max(0,model.fireUntil||0);
  model.holder.visible=Boolean(f.alive);
  model.holder.position.x=p.x;model.holder.position.z=p.z;
  if(!f.alive)return;
  const opponent=frame.snapshot.combatants.filter(v=>v.alive&&v.id!==f.id)
    .map(v=>({...positionOf(v,w),id:v.id}))
    .sort((a,b)=>(a.x-p.x)**2+(a.z-p.z)**2-(b.x-p.x)**2-(b.z-p.z)**2)[0];
  if(opponent){
    const targetYaw=Math.atan2(opponent.x-p.x,opponent.z-p.z);
    model.holder.rotation.y=targetYaw;
  }
  animateSkeleton(model,f,now);
}
function updateActors(frame,now){
  const ids=new Set(frame.snapshot.combatants.map(f=>f.id));
  for(const [id,item] of models)if(!ids.has(id)){
    scene.remove(item.holder);models.delete(id);
  }
  for(const f of frame.snapshot.combatants.slice(0,64)){
    const item=ensureActor(f);placeActor(item,f,frame,now);
  }
  state.actors=[...models.values()].filter(i=>i.holder.visible).length;
}
function updateWorld(frame){
  if(!terrain||lastStaticKey!==String(frame.sceneBuilds)){
    if(terrain){scene.remove(terrain);terrain.geometry.dispose();}
    terrain=new THREE.Mesh(setWorldVertexGeometry(frame.staticVertices),groundMaterial);
    terrain.castShadow=true;terrain.receiveShadow=true;
    terrain.frustumCulled=false;scene.add(terrain);
    lastStaticKey=String(frame.sceneBuilds);state.worldRebuilds++;
  }
  if(ambientProps){scene.remove(ambientProps);ambientProps.geometry.dispose();}
  ambientProps=new THREE.Mesh(setWorldVertexGeometry(frame.dynamicVertices),effectsMaterial);
  ambientProps.castShadow=true;ambientProps.receiveShadow=true;
  ambientProps.frustumCulled=false;scene.add(ambientProps);
  state.meshes=2+models.size;
  lastExportVersion=frame.revision;
}
function updateTheme(frame){
  const p=zones[frame.snapshot.arena.theme]||zones.ember;
  const index={ember:0,neon:1,arctic:2}[frame.snapshot.arena.theme]??0;
  if(index!==biomeMaterialRow){
    biomeMaterialRow=index;
    // GPU geometry UVs carry the row: force a cache-consistent rebuild.
    lastStaticKey='';lastExportVersion=-1;
  }
  scene.background=new THREE.Color(p.sky);
  if(!scene.fog)scene.fog=new THREE.FogExp2(p.fog,.015);
  else scene.fog.color.setHex(p.fog);
  sun.color.setHex(p.sun);
  hemisphere.color.setHex(p.ambient);
}
function positionCamera(frame){
  const hero=currentFighter(frame),a=frame.snapshot.arena;
  if(!hero)return;
  const p=positionOf(hero,a.width);
  const yy=1.05;
  const target=new THREE.Vector3(p.x,yy,p.z);
  // Camera positions only depend on sanitized public fighter/map state.
  const occupied=new Set(a.obstacles);
  let best={yaw:.90,score:Infinity};
  const distance=3.65;
  for(let angle=0;angle<12;angle++){
    const yaw=angle*Math.PI/6;let score=0;
    for(let step=1;step<=10;step++){
      const x=Math.floor(p.x+Math.sin(yaw)*distance*step/10);
      const z=Math.floor(p.z+Math.cos(yaw)*distance*step/10);
      score+=x<0||z<0||x>=a.width||z>=a.height?9:
        occupied.has(z*a.width+x)?30:0;
    }
    if(score<best.score)best={yaw,score};
  }
  const eye=new THREE.Vector3(p.x+Math.sin(best.yaw)*distance,
    yy+2.13,p.z+Math.cos(best.yaw)*distance);
  if(!state.frames)camera.position.copy(eye);
  else camera.position.lerp(eye,.17);
  tracked.lerp(target,state.frames ? .24 : 1);
  camera.lookAt(tracked);
  wideCamera.position.set(a.width*.91,Math.max(a.width,a.height)*1.12,a.height*.93);
  wideCamera.lookAt(a.width/2,0,a.height/2);
}
function updateLabels(frame){
  if(!nametagLayer)return;
  const fragments=[];
  const allowed=frame.snapshot.combatants.filter(f=>f.alive).slice(0,6);
  const w=stage.clientWidth,h=stage.clientHeight;
  for(const f of allowed){
    const item=models.get(f.id);
    if(!item)continue;
    scratch.set(item.holder.position.x,2.05,item.holder.position.z);
    scratch.project(camera);
    if(Math.abs(scratch.x)>.89||Math.abs(scratch.y)>.90||scratch.z>1||scratch.z<0)continue;
    const node=document.createElement('span');
    node.className='battle-three-nameplate';
    node.dataset.actorId=f.id;
    node.dataset.focus=String(f.id===frame.cameraTargetId);
    node.textContent=String(f.name).slice(0,20).toUpperCase()+' '+Math.round(f.health)+' HP';
    node.style.left=((scratch.x+1)*w*.50).toFixed(1)+'px';
    node.style.top=((1-scratch.y)*h*.50).toFixed(1)+'px';
    fragments.push(node);
  }
  nametagLayer.replaceChildren(...fragments);
}
function displayInset(){
  const w=stage.clientWidth,h=stage.clientHeight;
  const fw=Math.round(w*.27),fh=Math.round(h*.27),
    fx=Math.round(w*.705),fy=Math.round(h*.65);
  renderer.setScissorTest(true);
  renderer.setScissor(fx,fy,fw,fh);
  renderer.setViewport(fx,fy,fw,fh);
  renderer.render(scene,wideCamera);
  renderer.setScissorTest(false);
  renderer.setViewport(0,0,w,h);
}
function draw(time){
  raf=requestAnimationFrame(draw);
  if(!ready||document.hidden)return;
  if(time-clockTime<28)return;
  clockTime=time;
  const frame=source.exportScene();
  if(!frame||!frame.snapshot)return;
  const rect=stage.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
  if(renderer.getSize(new THREE.Vector2()).x!==w||renderer.getSize(new THREE.Vector2()).y!==h){
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    wideCamera.aspect=.27*w/(.27*h);wideCamera.updateProjectionMatrix();
  }
  if(frame.revision!==lastExportVersion){
    updateWorld(frame);
    updateActors(frame,time*.001);
    updateTheme(frame);
  }else{
    // The original 65-joint GLB skeleton still animates at display refresh
    // rates even though the authoritative AI runs in discrete network ticks.
    for(const fighter of frame.snapshot.combatants){
      const actor=models.get(fighter.id);
      if(actor?.holder.visible)animateSkeleton(actor,fighter,time*.001);
    }
  }
  positionCamera(frame);
  updateLabels(frame);
  renderer.render(scene,camera);
  if(w>=950&&h>=450)displayInset();
  state.frames++;
}
async function start(){
  const model=await new GLTFLoader().loadAsync('/battle/models/quaternius-hero.glb');
  template=model.scene;
  state.joints=getSkeletonBones(template).length;
  if(state.joints<8)throw Error('Rig joints missing: '+state.joints);
  bounds=new THREE.Box3().setFromObject(template);
  const size=new THREE.Vector3();bounds.getSize(size);
  if(!Number.isFinite(size.y)||size.y<.05)throw Error('invalid humanoid bounds');
  unitScale=1.84/size.y;
  modelYOffset=-bounds.min.y*unitScale;
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(1.6,Math.max(1,devicePixelRatio||1)));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.32;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.className='battle-three-canvas';
  renderer.domElement.dataset.testid='battle-three-canvas';
  renderer.domElement.setAttribute('aria-hidden','true');
  stage.appendChild(renderer.domElement);
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(59,16/9,.10,180);
  wideCamera=new THREE.PerspectiveCamera(48,16/9,.3,230);
  hemisphere=new THREE.HemisphereLight(0xe0f1ff,0x27436b,2.10);
  scene.add(hemisphere);
  sun=new THREE.DirectionalLight(0xffefcd,3.4);
  sun.position.set(-9,23,17);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:.5,far:105});
  sun.shadow.bias=-.00016;
  sun.shadow.normalBias=.018;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);
  await loadEnvironmentAtlas();
  nametagLayer=document.createElement('div');
  nametagLayer.className='battle-three-nameplates';
  stage.appendChild(nametagLayer);
  state.mode='three-ultra';state.lastError=null;ready=true;
  document.body.dataset.battleRenderer='three-ultra';
  raf=requestAnimationFrame(draw);
}
start().catch(error=>{
  state.mode='fallback-webgl2';state.lastError=String(error?.message||error).slice(0,190);
  if(renderer)renderer.dispose();
  if(renderer?.domElement?.isConnected)renderer.domElement.remove();
  document.body.dataset.battleRenderer='webgl2';
});
