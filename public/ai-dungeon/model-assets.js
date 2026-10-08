import * as THREE from '/dungeon/vendor/three.module.js';
import {GLTFLoader} from '/dungeon/vendor/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from '/dungeon/vendor/addons/utils/SkeletonUtils.js';

// Optional locally vendored CC0 characters. Offline / missing-asset fallback is the
// fully autonomous procedural 3D rig, not a blank screen. No third-party runtime calls.
const loader=new GLTFLoader(),cache=new Map(),failures=new Set();
const selection={
 vanguard:'player/player_swordsman.glb',
 ranger:'player/player_archer.glb',
 mystic:'player/player_priest.glb',
 revenant:'enemy/enemy_swordsman.glb',
 cultist:'enemy/enemy_priest.glb',
 warden:'enemy/enemy_swordsman.glb'
};
const clips={
 idle:[/\bidle\b/i,/idle/i,/stand/i],
 move:[/run/i,/walk/i,/move/i],
 attack:[/attack/i,/melee/i,/slash/i,/shoot/i],
 cast:[/cast/i,/spell/i,/magic/i,/attack/i],
 hurt:[/hit/i,/hurt/i,/damage/i,/impact/i]
};
const assetUrl=path=>'/dungeon/assets/'+path;
const loading=new Map();
function load(path){
 if(!cache.has(path)){
  cache.set(path,loader.loadAsync(assetUrl(path)).catch(e=>{failures.add(path);return null}));
 }
 return cache.get(path);
}
function chooseClip(available,action){
 const prefer=clips[action]||clips.idle;
 for(const regex of prefer){const found=available.find(clip=>regex.test(clip.name));if(found)return found}
 return available.find(c=>/idle/i.test(c.name))||available[0]||null;
}
function configure(mesh,warden,owned){
 mesh.traverse(obj=>{
  if(!obj.isMesh)return;
  obj.castShadow=true;obj.receiveShadow=true;obj.userData.sharedAssetGeometry=true;
  if(warden){
   const input=Array.isArray(obj.material)?obj.material:[obj.material];
   const tinted=input.map(mat=>{
    const copy=mat.clone();
    if(copy.color)copy.color.lerp(new THREE.Color('#f3ab70'),.29);
    if('emissive' in copy){copy.emissive.lerp(new THREE.Color('#c63b24'),.18);copy.emissiveIntensity=Math.max(copy.emissiveIntensity||0,.15)}
    owned.push(copy);return copy;
   });
   obj.material=Array.isArray(obj.material)?tinted:tinted[0];
  }
 });
}
function attachCharacter(actor){
 const asset=selection[actor.u.kind];if(!asset)return Promise.resolve(false);
 const id=actor.u.id;
 const request=load(asset).then(gltf=>{
  if(!gltf||actor.detached||actor.u.id!==id)return false;
  const instance=cloneSkeleton(gltf.scene),owned=[],isBoss=actor.u.kind==='warden';
  configure(instance,isBoss,owned);
  // Source models are normalized near 1.85m; match authoritative cell centres.
  instance.rotation.y=0;instance.position.y=0;
  actor.root.add(instance);actor.assetRoot=instance;actor.assetMaterials=owned;
  actor.body.visible=false;actor.authored=true;actor.mixer=new THREE.AnimationMixer(instance);
  actor.availableClips=gltf.animations||[];actor.currentAction='';
  changeAction(actor,actor.u.action||'idle');
  return true;
 }).catch(e=>{failures.add(asset);return false});
 loading.set(id,request);return request;
}
function changeAction(actor,action){
 if(!actor.mixer||actor.currentAction===action)return;
 const clip=chooseClip(actor.availableClips,action);
 if(!clip)return;
 const next=actor.mixer.clipAction(clip);
 if(next!==actor.activeClip){
  next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
  next.enabled=true;next.play();
  if(actor.activeClip){next.crossFadeFrom(actor.activeClip,.2,true)}
  actor.activeClip=next;
 }
 actor.currentAction=action;
}
function updateActor(actor,dt){
 if(!actor.authored)return;
 changeAction(actor,actor.u.action||'idle');
 actor.mixer.update(Math.min(.05,Math.max(0,dt)));
}
function disposeActorAsset(actor){
 actor.detached=true;
 if(actor.mixer){actor.mixer.stopAllAction();if(actor.assetRoot)actor.mixer.uncacheRoot(actor.assetRoot)}
 if(actor.assetRoot){actor.root.remove(actor.assetRoot)}
 for(const m of actor.assetMaterials||[])m.dispose();
 actor.mixer=null;actor.assetRoot=null;actor.assetMaterials=[];
}
function putEnvironment(world,sceneKey,map){
 // Five pre-authored pieces maximum: deliberate landmarks without creating collisions.
 // This is purely cosmetic and discarded on floor transitions.
 const placements=[],N=map.length,O=(N-1)/2;
 for(let z=2;z<N-2;z++)for(let x=2;x<N-2;x++){
  if(map[z][x]!=='#'||!(map[z-1][x]==='.'||map[z+1][x]==='.'||map[z][x-1]==='.'||map[z][x+1]==='.'))continue;
  const n=(x*71+z*31+N*17)&255;
  if(n%32===0)placements.push({x:x-O,z:z-O,asset:placements.length%3===0?'environment/dungeon_pillar.glb':'environment/dungeon_wall.glb'});
  if(placements.length>=5)break;
 }
 const group=new THREE.Group();world.add(group);
 for(const p of placements){load(p.asset).then(gltf=>{
  if(!gltf||world.userData.sceneKey!==sceneKey)return;
  const source=gltf.scene.clone(true);source.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.userData.sharedAssetGeometry=true}});
  source.position.set(p.x,-.03,p.z);source.scale.setScalar(.86);group.add(source);
 })}
 return{group,count:placements.length};
}
function stats(actors){
 return{authoredCharacters:[...actors.values()].filter(a=>a.authored).length,proceduralFallbacks:[...actors.values()].filter(a=>!a.authored).length,uniqueAssets:cache.size,missingAssets:failures.size};
}
export {attachCharacter,updateActor,disposeActorAsset,putEnvironment,stats};
