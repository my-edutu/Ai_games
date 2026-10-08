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
  const pos=new Float32Array(n*3),norm=new Float32Array(n*3),rgb=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const src=i*9,dst=i*3;
    pos[dst]=vertices[src];pos[dst+1]=vertices[src+1];pos[dst+2]=vertices[src+2];
    norm[dst]=vertices[src+3];norm[dst+1]=vertices[src+4];norm[dst+2]=vertices[src+5];
    rgb[dst]=vertices[src+6];rgb[dst+1]=vertices[src+7];rgb[dst+2]=vertices[src+8];
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('normal',new THREE.BufferAttribute(norm,3));
  geo.setAttribute('color',new THREE.BufferAttribute(rgb,3));
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
    const name=(node.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    // Asset retains Quaternius CC0 65-bone hierarchy; these are
    // cosmetic locomotion targets, never collider or combat logic.
    const side=/left|_l|\.l$|^l(upper|lower|arm|leg)/.test(name)?'left':
      /right|_r|\.r$|^r(upper|lower|arm|leg)/.test(name)?'right':null;
    const leg=/thigh|upperleg/.test(name)?'leg':
      /calf|lowerleg|shin/.test(name)?'shin':
      /upperarm|shoulder/.test(name)?'arm':
      /forearm|lowerarm/.test(name)?'forearm':
      /spine|chest/.test(name)?'torso':null;
    if(leg)joints.push({bone:node,name,side,leg,rest:node.rotation.clone()});
  });
  return joints;
}
function ensureActor(f){
  let item=models.get(f.id);
  if(item)return item;
  const clone=cloneSkin(template);
  const holder=new THREE.Group();
  clone.scale.setScalar(unitScale);
  clone.position.y=modelYOffset;
  holder.add(clone);
  const visual=numberSeed(f.id)%4;
  if(visual===0){
    const accent=new THREE.Mesh(new THREE.BoxGeometry(.09,.20,.10),
      new THREE.MeshStandardMaterial({color:colors[f.archetype]||0xffffff,
        emissive:colors[f.archetype]||0xffffff,emissiveIntensity:.18}));
    accent.position.set(.26,1.51,-.02);holder.add(accent);
  }else if(visual===1){
    const pack=new THREE.Mesh(new THREE.BoxGeometry(.37,.46,.18),
      new THREE.MeshStandardMaterial({color:0x1b2c39,roughness:.70}));
    pack.position.set(0,1.07,-.22);pack.castShadow=true;holder.add(pack);
  }else if(visual===2){
    const plate=new THREE.Mesh(new THREE.BoxGeometry(.24,.12,.07),
      new THREE.MeshStandardMaterial({color:0x58dbea,emissive:0x247ba0,
        emissiveIntensity:.26}));
    plate.position.set(0,1.54,.14);holder.add(plate);
  }
  assignModelMaterial(clone,f);
  scene.add(holder);
  item={holder,bones:getSkeletonBones(clone),actor:f,moved:false,prevCell:f.cell};
  models.set(f.id,item);
  return item;
}
function animateSkeleton(model,f,time){
  const running=model.moved&&(/pursuing|seeking|fallback/.test(f.intent||''));
  const moving=model.moved;
  const fighting=f.intent==='attacking',healing=f.intent==='healing';
  const phase=time*(running?10:7)+numberSeed(f.id)%15;
  const swing=moving?Math.sin(phase)*(running?.44:.23):0;
  for(const joint of model.bones){
    const {bone,side,leg,rest}=joint;
    const flip=side==='left'?1:-1;
    let x=rest.x,y=rest.y,z=rest.z;
    if(leg==='leg')x+=flip*swing*(healing?.25:1);
    if(leg==='shin')x+=Math.max(0,-flip*swing)*.32;
    if(leg==='arm')x+=fighting?-.62:healing?-.38:-flip*swing*.64;
    if(leg==='forearm')x+=fighting?-.39:healing?-.26:Math.max(0,flip*swing)*.16;
    if(leg==='torso')z+=Math.sin(phase*.46)*.012;
    bone.rotation.set(x,y,z);
  }
  model.holder.position.y=moving?Math.abs(Math.sin(phase))*.03:0;
}
function placeActor(model,f,frame,now){
  const w=frame.snapshot.arena.width,p=positionOf(f,w);
  model.moved=model.prevCell!==f.cell;
  model.prevCell=f.cell;model.actor=f;
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
  tracked.lerp(target,state.frames?.24:1);
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
  const w=renderer.domElement.width,h=renderer.domElement.height;
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
