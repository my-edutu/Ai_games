import * as THREE from '/dungeon/vendor/three.module.js';
import {mergeGeometries} from '/dungeon/vendor/addons/utils/BufferGeometryUtils.js';
import {GLTFLoader} from '/dungeon/vendor/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from '/dungeon/vendor/addons/utils/SkeletonUtils.js';
import {planAuthoredMotion} from '/dungeon/character-motion-plan.js';
import {planWardenRegalia} from '/dungeon/warden-regalia-plan.js';
import {planRoleSilhouette} from '/dungeon/role-silhouette-plan.js';
import {planAnatomicalKit,planAnatomicalDrawGroups} from '/dungeon/anatomical-kit-plan.js';
import {createForgedArmorForms,planForgedArmor,planForgedFinishes} from '/dungeon/forged-armor.js';
import {planDrapePanels,planDrapeSwing,planDrapeVertexBend,drapePoseKey,DRAPE_ROWS,DRAPE_COLUMNS} from '/dungeon/fabric-drape-plan.js';
import {rigWeaponParts,selectHandBone,rigGripAnchor,boundedGripOffset,selectUpperArmBone,planRigArmGesture,selectForearmBone,planRigForearmGesture,selectLegBone,advanceRigGait,planRigLegGesture,planRigContactBrace,selectCranialBone,planCranialRatio,restoreCranialProportion,stageCranialProportion,selectCombatTorsoBone,planRigMeleeFollowThrough} from '/dungeon/rig-attachment-plan.js';

// Optional locally vendored CC0 characters. Offline / missing-asset fallback is the
// fully autonomous procedural 3D rig, not a blank screen. No third-party runtime calls.
const cache=new Map(),failures=new Set(),incompleteAssets=new Set();
const textureReadiness=new WeakMap();
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
 hurt:[/hit/i,/hurt/i,/damage/i,/impact/i],
 guard:[/block/i,/shield/i,/defend/i,/idle/i]
};
const assetUrl=path=>'/dungeon/assets/'+path;
function inspectTextures(gltf){
 const materials=new Set(),textures=new Set();let missing=0;
 gltf.scene.traverse(obj=>{
  if(!obj.isMesh)return;
  for(const material of Array.isArray(obj.material)?obj.material:[obj.material]){
   if(!material||materials.has(material))continue;
   materials.add(material);
   const index=gltf.parser?.associations?.get(material)?.materials;
   const definition=gltf.parser?.json?.materials?.[index];
   if(definition?.pbrMetallicRoughness?.baseColorTexture&&!material.map){missing++;continue}
   if(!material.map)continue;
   const image=material.map.source?.data||material.map.image;
   if(image?.width>0&&image?.height>0)textures.add(material.map);else missing++;
  }
 });
 return {materials:materials.size,decodedColorMaps:textures.size,missingColorMaps:missing};
}
function load(path){
 if(!cache.has(path)){
  // GLTFLoader may resolve after an embedded image failed. A mesh alone is not
  // a ready asset: keep the coloured procedural rig rather than show white art.
  const manager=new THREE.LoadingManager();let resourceFailed=false;
  manager.onError=()=>{resourceFailed=true};
  const loader=new GLTFLoader(manager);
  cache.set(path,loader.loadAsync(assetUrl(path)).then(gltf=>{
   const readiness=inspectTextures(gltf);
   if(resourceFailed||readiness.missingColorMaps){
    failures.add(path);incompleteAssets.add(path);
    console.warn('[DUNGEON] incomplete textures; keeping procedural fallback:',path);
    return null;
   }
   textureReadiness.set(gltf,readiness);return gltf;
  }).catch(error=>{
   failures.add(path);console.warn('[DUNGEON] asset unavailable; keeping procedural fallback:',path,String(error));return null;
  }));
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
// Original scene-only regalia distinguishes the true textured boss from its
// shared enemy swordsman GLB. No collision, navigation or combat properties.
function addWardenRegalia(actor){
 const plan=planWardenRegalia(actor.u.kind);
 if(!plan.length||!actor.visualPivot)return;
 const group=new THREE.Group();group.name='Original Warden regalia';
 const finishes={
  iron:new THREE.MeshStandardMaterial({color:'#39454f',metalness:.81,roughness:.46}),
  brass:new THREE.MeshStandardMaterial({color:'#b99257',metalness:.77,roughness:.33}),
  bone:new THREE.MeshStandardMaterial({color:'#b6ae9b',metalness:.18,roughness:.63}),
  ember:new THREE.MeshStandardMaterial({color:'#c0683f',emissive:'#a73b1d',emissiveIntensity:.62,metalness:.28,roughness:.39})
 };
 const base={
  plate:new THREE.SphereGeometry(.5,12,8),
  spike:new THREE.ConeGeometry(.5,1,9),
  gem:new THREE.OctahedronGeometry(.5,0),
  lamella:new THREE.BoxGeometry(1,1,1)
 };
 const ownedGeometries=Object.values(base);
 for(const item of plan){
  let geometry=base[item.shape];
  if(item.shape==='horn'){
   const points=item.points.map(p=>new THREE.Vector3(...p));
   geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),14,.047,7,false);
   ownedGeometries.push(geometry);
  }
  const mesh=new THREE.Mesh(geometry,finishes[item.finish]);
  mesh.name=item.id;mesh.castShadow=true;mesh.receiveShadow=true;
  if(item.shape!=='horn'){
   mesh.position.set(item.x,item.y,item.z);
   mesh.scale.set(item.sx,item.sy,item.sz);
   mesh.rotation.z=item.rz;
  }
  group.add(mesh);
 }
 actor.visualPivot.add(group);
 actor.regaliaParts=plan.length;
 actor.assetMaterials.push(...Object.values(finishes));
 actor.assetGeometries.push(...ownedGeometries);
}

// Class-identifying original accessories for all ordinary textured GLB rigs.
// They share the presentation pivot, never the imported skeleton or authority.
// Mesh/material allocations occur only on attach, with disposal on actor removal.
function addRoleSilhouette(actor){
 const plan=planRoleSilhouette(actor.u.kind);
 if(!plan.length||!actor.visualPivot)return;
 const group=new THREE.Group();group.name='Original '+actor.u.kind+' class details';
 const finishes={
  iron:new THREE.MeshStandardMaterial({color:'#586772',metalness:.72,roughness:.48}),
  antique:new THREE.MeshStandardMaterial({color:'#a7875b',metalness:.59,roughness:.46}),
  leather:new THREE.MeshStandardMaterial({color:'#44383e',metalness:.04,roughness:.89}),
  arcane:new THREE.MeshStandardMaterial({color:'#72a4a9',emissive:'#285d65',emissiveIntensity:.30,metalness:.21,roughness:.42})
 };
 const forms={
  plate:new THREE.SphereGeometry(.5,10,7),
  lamella:new THREE.BoxGeometry(1,1,1),
  spike:new THREE.ConeGeometry(.5,1,8),
  gem:new THREE.OctahedronGeometry(.5,0),
  rod:new THREE.CylinderGeometry(.5,.5,1,8)
 };
 const geometries=Object.values(forms);
 for(const part of plan){
  let geometry=forms[part.shape];
  if(part.shape==='arc'){
   const curve=new THREE.CatmullRomCurve3(part.points.map(p=>new THREE.Vector3(...p)));
   geometry=new THREE.TubeGeometry(curve,12,.027,6,false);
   geometries.push(geometry);
  }
  const mesh=new THREE.Mesh(geometry,finishes[part.finish]);
  mesh.name=part.id;mesh.castShadow=true;mesh.receiveShadow=true;
  if(part.shape!=='arc'){
   mesh.position.set(part.x,part.y,part.z);
   mesh.scale.set(part.sx,part.sy,part.sz);
   mesh.rotation.z=part.rz;
  }
  group.add(mesh);
 }
 actor.visualPivot.add(group);
 actor.roleSilhouetteParts=plan.length;
 actor.assetMaterials.push(...Object.values(finishes));
 actor.assetGeometries.push(...geometries);
}


/**
 * Original anatomically layered armor, masks and cloth mounted to the genuine
 * SkeletonUtils-cloned skinned model. Bracers/greaves follow real limb bones;
 * no changes to authoritative combat, navigation, hitboxes or tick timing.
 */
function addAnatomicalKit(actor){
 const plan=planAnatomicalKit(actor.u.kind);
 if(!plan.length||!actor.visualPivot)return;
 const group=new THREE.Group();group.name='Original '+actor.u.kind+' anatomical armour';
 const materials=planForgedFinishes(actor.u.kind);
 if(!materials)return;
 const finishes=Object.fromEntries(Object.entries(materials).map(([name,settings])=>
  [name,new THREE.MeshStandardMaterial({...settings,...(name==='textile'?{side:THREE.DoubleSide}:{})})]));
 const forms=createForgedArmorForms(THREE,actor.u.kind);
 if(!forms)return;
 actor.sculptedArmorProfile=planForgedArmor(actor.u.kind)?.name??null;
 actor.sculptedArmorVertices=Object.values(forms).reduce((sum,geometry)=>sum+(geometry.getAttribute('position')?.count||0),0);
 const joints={
  leftForearm:actor.rigForearms?.find(item=>item.side==='left')?.bone,
  rightForearm:actor.rigForearms?.find(item=>item.side==='right')?.bone,
  leftLowerLeg:actor.rigGaitBones?.find(item=>item.side==='left'&&item.part==='lower')?.bone,
  rightLowerLeg:actor.rigGaitBones?.find(item=>item.side==='right'&&item.part==='lower')?.bone
 };
 actor.visualPivot.add(group);
 actor.visualPivot.updateWorldMatrix(true,true);
 actor.assetRoot.updateWorldMatrix(true,true);
 let attached=0,renderMeshes=0,mergedParts=0;
 const {staticGroups,jointPieces}=planAnatomicalDrawGroups(actor.u.kind);
 // Equivalent static T*R*S transforms and face normals; only cosmetics change.
 for(const {finish,parts} of staticGroups){
  const fragments=[];
  for(const piece of parts){
   const fragment=forms[piece.shape].clone();
   const transform=new THREE.Matrix4().compose(
    new THREE.Vector3(piece.x,piece.y,piece.z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,piece.rz)),
    new THREE.Vector3(piece.sx,piece.sy,piece.sz));
   fragment.applyMatrix4(transform);fragments.push(fragment);
  }
  const merged=mergeGeometries(fragments,false);
  for(const fragment of fragments)fragment.dispose();
  if(!merged){
   // Geometry format changes cannot erase armor from the live game.
   console.warn('[DUNGEON] static anatomical merge unavailable:',actor.u.kind,finish);
   for(const piece of parts){
    const mesh=new THREE.Mesh(forms[piece.shape],finishes[finish]);
    mesh.name=piece.id;mesh.position.set(piece.x,piece.y,piece.z);
    mesh.scale.set(piece.sx,piece.sy,piece.sz);mesh.rotation.z=piece.rz;
    mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
    renderMeshes++;
   }
   continue;
  }
  const mesh=new THREE.Mesh(merged,finishes[finish]);
  mesh.name=actor.u.kind+'-'+finish+'-merged-torso';
  mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  actor.assetGeometries.push(merged);
  mergedParts+=parts.length;renderMeshes++;
 }
 // Genuine arm/shin fittings stay separate and follow cloned skeletal joints.
 for(const piece of jointPieces){
  const mesh=new THREE.Mesh(forms[piece.shape],finishes[piece.finish]);
  mesh.name=piece.id;mesh.position.set(piece.x,piece.y,piece.z);
  mesh.scale.set(piece.sx,piece.sy,piece.sz);mesh.rotation.z=piece.rz;
  mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  const joint=joints[piece.mount];
  if(joint){group.updateWorldMatrix(true,true);joint.attach(mesh);attached++;}
  renderMeshes++;
 }
 actor.anatomicalParts=plan.length;actor.anatomicalJointParts=attached;
 actor.anatomicalDetailMeshes=renderMeshes;
 actor.anatomicalStaticMergedParts=mergedParts;
 actor.assetMaterials.push(...Object.values(finishes));
 actor.assetGeometries.push(...Object.values(forms));
}

// Shoulder-pivoted original sculpted textile panels. Polygon folds are built
// once per loaded rig. No procedural asset requests or authoritative state.
function addFabricDrape(actor){
 const recipe=planDrapePanels(actor.u.kind);
 if(!recipe.length||!actor.visualPivot)return;
 const material=new THREE.MeshStandardMaterial({
  color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,
  roughness:.94,metalness:.025
 });
 actor.assetMaterials.push(material);
 const panels=[];
 for(const part of recipe){
  const positions=[],colors=[],indices=[],pigment=new THREE.Color(part.color);
  for(let row=0;row<=DRAPE_ROWS;row++)for(let col=0;col<=DRAPE_COLUMNS;col++){
   const t=row/DRAPE_ROWS,u=col/DRAPE_COLUMNS;
   // Curved hanging hem, irregular split mantle, and ridged weave normals.
   const x=part.side*.235+(u-.5)*part.width*(1+part.flare*t)+part.side*.035*t+.016*Math.sin(u*Math.PI*3)*t;
   const y=-part.length*t-.029*Math.abs(Math.sin(u*2*Math.PI))*t;
   const z=.025+.17*t*t+.022*Math.cos(u*4*Math.PI)*(.15+.85*t);
   positions.push(x,y,z);
   const shade=.91+.085*Math.cos(u*4*Math.PI)-.055*(t>.90?1:0);
   colors.push(pigment.r*shade,pigment.g*shade,pigment.b*shade);
  }
  for(let row=0;row<DRAPE_ROWS;row++)for(let col=0;col<DRAPE_COLUMNS;col++){
   const a=row*(DRAPE_COLUMNS+1)+col,b=a+1,c=a+DRAPE_COLUMNS+1,d=c+1;
   indices.push(a,c,b,b,c,d);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=part.id;mesh.position.set(0,part.shoulderY,.30);
  mesh.castShadow=false;mesh.receiveShadow=true;
  actor.visualPivot.add(mesh);
  actor.assetGeometries.push(geometry);
  panels.push({mesh,side:part.side,restPositions:new Float32Array(geometry.getAttribute('position').array)});
 }
 actor.draperyPanels=panels;
 actor.draperyTriangles=panels.length*DRAPE_ROWS*DRAPE_COLUMNS*2;
}

// Move only original visible weapon fittings onto a genuine CLONED GLB
// hand bone. Object3D.attach preserves their world pose while authored
// skeletal animation subsequently moves the accessory with the limb.
// Models without named hand joints retain their safe static fitting.
function bindRigWeaponAccessories(actor){
 const names=rigWeaponParts(actor.u.kind);
 if(!names.length||!actor.assetRoot||!actor.visualPivot)return;
 const rigBones=[];
 actor.assetRoot.traverse(obj=>{
  if(!obj.isSkinnedMesh||!obj.skeleton)return;
  for(const bone of obj.skeleton.bones){
   if(bone?.isBone&&!rigBones.includes(bone))rigBones.push(bone);
  }
 });
 const handBone=selectHandBone(rigBones,'right');
 if(!handBone)return;
 actor.rigHandBone=handBone;
 const costume=actor.visualPivot.children.find(child=>child.name==='Original '+actor.u.kind+' class details');
 if(!costume)return;
 const parts=names.map(name=>costume.getObjectByName(name));
 // Never split a bow or staff between rigid and animated parents.
 if(parts.some(part=>!part?.isMesh))return;
 actor.visualPivot.updateWorldMatrix(true,true);
 actor.assetRoot.updateWorldMatrix(true,true);
 const anchor=rigGripAnchor(actor.u.kind);
 const gripPosition=anchor&&actor.visualPivot.localToWorld(new THREE.Vector3(anchor.x,anchor.y,anchor.z));
 const handPosition=handBone.getWorldPosition(new THREE.Vector3());
 const delta=gripPosition&&handPosition.sub(gripPosition);
 const shift=delta&&boundedGripOffset(delta.x,delta.y,delta.z);
 actor.rigGripCandidateMeters=delta&&Number.isFinite(delta.length())?Number(Math.min(99,delta.length()).toFixed(3)):null;
 if(shift!==null&&shift!==undefined){
  // Preserve the full original bow/staff assembly around its known contact
  // point. Reparent it as ONE object: no splitting curved limbs/string/gems.
  // The hand bone becomes the grip origin, while the captured rest-pose
  // orientation is retained relative to that bone's authored animation.
  const mount=new THREE.Group();mount.name='Original '+actor.u.kind+' hand grip';
  mount.position.set(anchor.x,anchor.y,anchor.z);
  costume.add(mount);
  costume.updateWorldMatrix(true,true);
  for(const mesh of parts)mount.attach(mesh);
  handBone.attach(mount);
  mount.position.set(0,0,0);
  actor.rigGripAligned=true;
  actor.rigGripShiftMeters=Number(shift.toFixed(4));
 }else{
  // Unrecognised or distant hand joints retain R27's safe animated binding.
  for(const mesh of parts)handBone.attach(mesh);
 }
 actor.rigBoundAccessoryParts=parts.length;
 actor.rigHandBoneName=handBone.name;
}


// The imported Mixer remains authoritative for animated CLONED GLB skeletons.
// Layer only a small reversible shoulder offset on named upper-arm bones. No
// new skeleton, animation clip, asset or gameplay state is created.
function bindRigArmGestures(actor){
 if(!actor.assetRoot)return;
 const bones=[];
 actor.assetRoot.traverse(obj=>{
  if(!obj.isSkinnedMesh||!obj.skeleton)return;
  for(const bone of obj.skeleton.bones)
   if(bone?.isBone&&!bones.includes(bone))bones.push(bone);
 });
 actor.rigUpperArms=[];
 for(const side of ['left','right']){
  const bone=selectUpperArmBone(bones,side);
  if(bone)actor.rigUpperArms.push({
   side,bone,last:new THREE.Quaternion(),inverse:new THREE.Quaternion(),
   next:new THREE.Quaternion(),euler:new THREE.Euler()
  });
 }
 actor.rigGesturePeak=0;
 // True elbow joints complement shoulder swing; new motion remains entirely
 // inside original SkeletonUtils-cloned rig and is restored before each mixer.
 actor.rigForearms=[];
 for(const side of ['left','right']){
  const bone=selectForearmBone(bones,side);
  if(bone)actor.rigForearms.push({
   side,bone,last:new THREE.Quaternion(),inverse:new THREE.Quaternion(),
   next:new THREE.Quaternion(),euler:new THREE.Euler()
  });
 }
 actor.rigForearmPeak=0;
 // Bind only genuine cloned thigh, calf and ankle joints. Missing joints
 // are a graceful no-op; there are no new animation assets or skeletons.
 actor.rigGaitBones=[];
 for(const side of ['left','right'])for(const part of ['upper','lower','foot']){
  const bone=selectLegBone(bones,side,part);
  if(bone)actor.rigGaitBones.push({
   side,part,bone,last:new THREE.Quaternion(),inverse:new THREE.Quaternion(),
   next:new THREE.Quaternion(),euler:new THREE.Euler()
  });
 }
 // Only the real original chest and right weapon hand can contribute
 // extra follow-through; never create fake bones or shift the actor collider.
 actor.rigMeleeBones=[];
 if(['vanguard','revenant','warden'].includes(actor.u.kind)){
  const chest=selectCombatTorsoBone(bones),weaponHand=selectHandBone(bones,'right');
  for(const [part,bone] of [['spine',chest],['wrist',weaponHand]]){
   if(bone)actor.rigMeleeBones.push({
    part,bone,last:new THREE.Quaternion(),inverse:new THREE.Quaternion(),
    next:new THREE.Quaternion(),euler:new THREE.Euler()
   });
  }
 }
 actor.rigMeleeCurrentPeak=0;actor.rigMeleePeak=0;actor.rigMeleeActive=false;
 // Authentic KayKit head skin joints are animated (including scale) in the
 // imported GLB clips. Apply our original adult-proportion adjustment only
 // AFTER the mixer, reversing it before the next mixer update. Missing bones
 // remain unchanged and never create or reposition a gameplay entity.
 const cranialBone=selectCranialBone(bones);
 actor.rigCranial=cranialBone?{
  bone:cranialBone,ratio:planCranialRatio(actor.u.kind),applied:false
 }:null;
 actor.rigGaitPosition=actor.root?.position?.clone?.()??null;
 actor.rigGaitPhase=0;actor.rigGaitWeight=0;actor.rigGaitPeak=0;actor.rigContactBracePeak=0;
}
function restoreRigCranialBeforeMixer(actor){
 restoreCranialProportion(actor.rigCranial);
}
function stageRigCranialAfterMixer(actor){
 stageCranialProportion(actor.rigCranial);
}
function restoreRigArmsBeforeMixer(actor){
 for(const mount of actor.rigUpperArms||[]){
  // Undo our own previous pose BEFORE AnimationMixer writes this frame.
  // Essential for idle/attack GLBs whose clips omit an arm joint: otherwise
  // additive quaternion edits accumulate into permanent limb distortion.
  mount.bone.quaternion.multiply(mount.inverse.copy(mount.last).invert());
  mount.last.identity();
 }
}
function restoreRigForearmsBeforeMixer(actor){
 for(const mount of actor.rigForearms||[]){
  mount.bone.quaternion.multiply(mount.inverse.copy(mount.last).invert());
  mount.last.identity();
 }
}
function restoreRigLegsBeforeMixer(actor){
 for(const mount of actor.rigGaitBones||[]){
  mount.bone.quaternion.multiply(mount.inverse.copy(mount.last).invert());
  mount.last.identity();
 }
}
function restoreRigMeleeBeforeMixer(actor){
 for(const mount of actor.rigMeleeBones||[]){
  // Undo only our own quaternion delta: imported keyframes remain untouched.
  mount.bone.quaternion.multiply(mount.inverse.copy(mount.last).invert());
  mount.last.identity();
 }
}
function stageRigMeleeAfterMixer(actor,since,reducedMotion){
 actor.rigMeleeCurrentPeak=0;actor.rigMeleeActive=false;
 if(!actor.rigMeleeBones?.length)return;
 const pose=planRigMeleeFollowThrough(actor.u.kind,actor.u.action||'idle',since,
  actor.combatFacing?.distance,actor.combatFacing?.targetId,reducedMotion||actor.u.hp<=0);
 for(const mount of actor.rigMeleeBones){
  const joint=pose[mount.part];
  mount.next.setFromEuler(mount.euler.set(joint.pitch,joint.yaw,joint.roll,'YXZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.copy(mount.next);
  actor.rigMeleeCurrentPeak=Math.max(actor.rigMeleeCurrentPeak,
   Math.abs(joint.pitch),Math.abs(joint.yaw),Math.abs(joint.roll));
 }
 actor.rigMeleePeak=Math.max(actor.rigMeleePeak||0,actor.rigMeleeCurrentPeak);
 actor.rigMeleeActive=actor.rigMeleeCurrentPeak>.08;
}
function stageRigArmsAfterMixer(actor,since,reducedMotion){
 // Keep legacy/no-bone rigs lightweight and compatible with offline fallback.
 if(!actor.rigUpperArms?.length)return;
 const pose=planRigArmGesture(actor.u.kind,actor.u.action||'idle',since,reducedMotion);
 for(const mount of actor.rigUpperArms||[]){
  const joint=pose[mount.side];
  mount.next.setFromEuler(mount.euler.set(joint.pitch,0,joint.roll,'XYZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.copy(mount.next);
  actor.rigGesturePeak=Math.max(actor.rigGesturePeak||0,Math.abs(joint.pitch),Math.abs(joint.roll));
 }
}

function stageRigForearmsAfterMixer(actor,since,reducedMotion){
 if(!actor.rigForearms?.length)return;
 const pose=planRigForearmGesture(actor.u.kind,actor.u.action||'idle',since,
  reducedMotion||actor.u.hp<=0);
 for(const mount of actor.rigForearms){
  const angle=pose[mount.side];
  mount.next.setFromEuler(mount.euler.set(angle,0,0,'XYZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.copy(mount.next);
  actor.rigForearmPeak=Math.max(actor.rigForearmPeak||0,Math.abs(angle));
 }
}

// Distance-paced cosmetic stride: idle actors settle; teleports reset.
function stageRigLegsAfterMixer(actor,since,reducedMotion){
 if(!actor.rigGaitBones?.length)return;
 const current=actor.root?.position,previous=actor.rigGaitPosition;
 const travel=current&&previous?Math.hypot(current.x-previous.x,current.z-previous.z):0;
 if(current&&previous)previous.copy(current);
 const gait=advanceRigGait(actor.rigGaitPhase,actor.rigGaitWeight,travel,
  reducedMotion||actor.u.hp<=0);
 actor.rigGaitPhase=gait.phase;actor.rigGaitWeight=gait.weight;
 const pose=planRigLegGesture(gait.phase,gait.weight,reducedMotion||actor.u.hp<=0);
 // Never invent a melee target: the app supplies only a grid-validated,
 // unobstructed public facing, and we require exactly one-cell contact.
 const brace=planRigContactBrace(actor.u.kind,actor.u.action||'idle',since,
  actor.combatFacing?.distance,reducedMotion||actor.u.hp<=0);
 for(const mount of actor.rigGaitBones){
  const contact=brace[mount.side][mount.part];
  const angle=Math.max(-.30,Math.min(.30,pose[mount.side][mount.part]+contact));
  actor.rigContactBracePeak=Math.max(actor.rigContactBracePeak||0,Math.abs(contact));
  mount.next.setFromEuler(mount.euler.set(angle,0,0,'XYZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.copy(mount.next);
  actor.rigGaitPeak=Math.max(actor.rigGaitPeak||0,Math.abs(angle));
 }
}

function attachCharacter(actor){
 const asset=selection[actor.u.kind];if(!asset)return Promise.resolve(false);
 const id=actor.u.id;
 const request=load(asset).then(gltf=>{
  if(!gltf||actor.detached||actor.u.id!==id)return false;
  const instance=cloneSkeleton(gltf.scene),owned=[],isBoss=actor.u.kind==='warden';
  configure(instance,isBoss,owned);
  // Fit artist source units to dungeon scale and centre the feet on the floor.
  instance.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(instance),size=new THREE.Vector3(),center=new THREE.Vector3();
  bounds.getSize(size);bounds.getCenter(center);
  if(Number.isFinite(size.y)&&size.y>.05&&size.y<1000){
   const targetHeight=isBoss?2.05:1.82;
   const sourceScale=Math.max(.08,Math.min(12,targetHeight/size.y));
   instance.scale.setScalar(sourceScale);
   instance.position.set(-center.x*sourceScale,-bounds.min.y*sourceScale,-center.z*sourceScale);
  }
  const pivot=new THREE.Group();(actor.impactPivot||actor.root).add(pivot);pivot.add(instance);
  actor.visualPivot=pivot;actor.motionPeak=0;actor.assetRoot=instance;actor.assetMaterials=owned;actor.assetGeometries=[];actor.regaliaParts=0;actor.roleSilhouetteParts=0;actor.anatomicalParts=0;actor.anatomicalJointParts=0;actor.anatomicalDetailMeshes=0;actor.anatomicalStaticMergedParts=0;actor.sculptedArmorProfile=null;actor.sculptedArmorVertices=0;actor.rigBoundAccessoryParts=0;actor.rigHandBoneName=null;actor.rigHandBone=null;actor.rigGripAligned=false;actor.rigGripShiftMeters=0;actor.rigGripCandidateMeters=null;actor.rigCranial=null;actor.rigUpperArms=[];actor.rigGesturePeak=0;actor.rigForearms=[];actor.rigForearmPeak=0;actor.rigGaitBones=[];actor.rigGaitPosition=null;actor.rigGaitPhase=0;actor.rigGaitWeight=0;actor.rigGaitPeak=0;actor.rigContactBracePeak=0;actor.rigMeleeBones=[];actor.rigMeleePeak=0;actor.rigMeleeCurrentPeak=0;actor.rigMeleeActive=false;actor.draperyPanels=[];actor.draperyTriangles=0;actor.draperyPeakDeformationMeters=0;actor.draperyPoseKey=null;actor.draperyFramesSkipped=0;actor.draperyNormalRebuilds=0;actor.draperyVertexUploads=0;
  actor.body.visible=false;actor.authored=true;actor.detail?.setAuthored?.(true);actor.mixer=new THREE.AnimationMixer(instance);
  actor.availableClips=gltf.animations||[];actor.currentAction='';actor.currentActionTick=null;
  actor.textureReadiness=textureReadiness.get(gltf);
  addWardenRegalia(actor);
  addRoleSilhouette(actor);
  bindRigWeaponAccessories(actor);
  bindRigArmGestures(actor);
  addAnatomicalKit(actor);
  addFabricDrape(actor);
  changeAction(actor,actor.u.action||'idle');
  return true;
 }).catch(e=>{failures.add(asset);return false});
 return request;
}
function changeAction(actor,action){
 const oneShot=['attack','cast','hurt'].includes(action);
 const tick=actor.u.actionTick??null;
 const newEvent=oneShot&&actor.currentActionTick!==tick;
 if(actor.currentAction!==action||newEvent)actor.motionPeak=0;
 if(!actor.mixer||(actor.currentAction===action&&!newEvent))return;
 const clip=chooseClip(actor.availableClips,action);
 if(!clip)return;
 const next=actor.mixer.clipAction(clip),previous=actor.activeClip;
 // Consecutive attacks and different actions may use the same AnimationAction.
 // Restart on a new authoritative action, never on every presentation frame.
 if(next!==previous||newEvent||actor.currentAction!==action){
  next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
  next.enabled=true;
  next.setLoop(oneShot?THREE.LoopOnce:THREE.LoopRepeat,oneShot?1:Infinity);
  next.clampWhenFinished=oneShot;
  next.play();
  if(previous&&previous!==next)next.crossFadeFrom(previous,oneShot?.12:.23,true);
  actor.activeClip=next;
 }
 actor.currentAction=action;actor.currentActionTick=tick;
}
function updateActor(actor,dt,since=0,reducedMotion=false){
 if(!actor.authored||!actor.mixer)return;
 changeAction(actor,actor.u.action||'idle');
 restoreRigArmsBeforeMixer(actor);
 restoreRigForearmsBeforeMixer(actor);
 restoreRigLegsBeforeMixer(actor);
 restoreRigMeleeBeforeMixer(actor);
 restoreRigCranialBeforeMixer(actor);
 actor.mixer.update(Math.min(.05,Math.max(0,dt)));
 stageRigCranialAfterMixer(actor);
 stageRigArmsAfterMixer(actor,since,reducedMotion);
 stageRigForearmsAfterMixer(actor,since,reducedMotion);
 stageRigLegsAfterMixer(actor,since,reducedMotion);
 stageRigMeleeAfterMixer(actor,since,reducedMotion);
 if(actor.visualPivot){
  const pose=planAuthoredMotion(actor.u.kind,actor.u.action||'idle',since,reducedMotion);
  actor.visualPivot.position.set(pose.x,pose.y,pose.z);
  actor.visualPivot.rotation.set(pose.pitch,0,pose.roll);
  actor.motionPeak=Math.max(actor.motionPeak||0,Math.abs(pose.x),Math.abs(pose.y),Math.abs(pose.z));
 }
 if(actor.draperyPanels?.length){
  const poseKey=drapePoseKey(actor.u.action||'idle',since,reducedMotion);
  if(poseKey!==actor.draperyPoseKey){
   actor.draperyPoseKey=poseKey;
   const sway=planDrapeSwing(actor.u.action||'idle',since,reducedMotion);
   actor.draperyPeakDeformationMeters=0;
   for(const p of actor.draperyPanels){
    p.mesh.rotation.x=sway.pitch;p.mesh.rotation.z=sway.roll*p.side;
    // Only a genuinely new sampled cloth pose needs CPU vertex and normal
    // recomputation or a GPU buffer upload. Every still/reduced-motion frame
    // reuses the existing exact geometry; no simulation clock is touched.
    const position=p.mesh.geometry.getAttribute('position');
    for(let row=0;row<=DRAPE_ROWS;row++)for(let col=0;col<=DRAPE_COLUMNS;col++){
     const index=row*(DRAPE_COLUMNS+1)+col,offset=index*3;
     const bend=planDrapeVertexBend(row/DRAPE_ROWS,col/DRAPE_COLUMNS,actor.u.action||'idle',since,reducedMotion);
     position.setXYZ(index,p.restPositions[offset]+bend.x*p.side,
      p.restPositions[offset+1]+bend.y,p.restPositions[offset+2]+bend.z);
     actor.draperyPeakDeformationMeters=Math.max(actor.draperyPeakDeformationMeters,
      Math.hypot(bend.x,bend.y,bend.z));
    }
    position.needsUpdate=true;
    p.mesh.geometry.computeVertexNormals();
    actor.draperyVertexUploads=Math.min(1000000,actor.draperyVertexUploads+1);
    actor.draperyNormalRebuilds=Math.min(1000000,actor.draperyNormalRebuilds+1);
   }
  }else{
   actor.draperyFramesSkipped=Math.min(1000000,actor.draperyFramesSkipped+1);
  }
 }
}
function disposeActorAsset(actor){
 actor.detached=true;
 // If the authored rig is retired, keep the complete coloured procedural
 // character visible as an offline/missing-asset fallback.
 actor.detail?.setAuthored?.(false);actor.body.visible=true;
 if(actor.mixer){actor.mixer.stopAllAction();if(actor.assetRoot)actor.mixer.uncacheRoot(actor.assetRoot)}
 if(actor.visualPivot){actor.visualPivot.removeFromParent();actor.visualPivot.clear()}
 else if(actor.assetRoot){actor.root.remove(actor.assetRoot)}
 for(const m of actor.assetMaterials||[])m.dispose();
 for(const g of actor.assetGeometries||[])g.dispose();
 actor.mixer=null;actor.assetRoot=null;actor.visualPivot=null;actor.motionPeak=0;actor.assetMaterials=[];actor.assetGeometries=[];actor.regaliaParts=0;actor.roleSilhouetteParts=0;actor.anatomicalParts=0;actor.anatomicalJointParts=0;actor.anatomicalDetailMeshes=0;actor.anatomicalStaticMergedParts=0;actor.sculptedArmorProfile=null;actor.sculptedArmorVertices=0;actor.rigBoundAccessoryParts=0;actor.rigHandBoneName=null;actor.rigHandBone=null;actor.rigGripAligned=false;actor.rigGripShiftMeters=0;actor.rigGripCandidateMeters=null;actor.rigCranial=null;actor.rigUpperArms=[];actor.rigGesturePeak=0;actor.rigForearms=[];actor.rigForearmPeak=0;actor.rigGaitBones=[];actor.rigGaitPosition=null;actor.rigGaitPhase=0;actor.rigGaitWeight=0;actor.rigGaitPeak=0;actor.rigContactBracePeak=0;actor.rigMeleeBones=[];actor.rigMeleePeak=0;actor.rigMeleeCurrentPeak=0;actor.rigMeleeActive=false;actor.draperyPanels=[];actor.draperyTriangles=0;actor.draperyPeakDeformationMeters=0;actor.draperyPoseKey=null;actor.draperyFramesSkipped=0;actor.draperyNormalRebuilds=0;actor.draperyVertexUploads=0;actor.authored=false;actor.textureReadiness=null;
}
function putEnvironment(world,sceneKey,map){
 // Authored GLB masonry and prop dressing complements the instanced procedural
 // layout; collision remains fully controlled by the deterministic grid simulation.
 const placements=[],N=map.length,O=(N-1)/2,wall=(x,z)=>map[z]?.[x]==='#';
 architecture:for(let z=2;z<N-2;z++)for(let x=2;x<N-2;x++){
  if(!wall(x,z)||!(map[z-1][x]==='.'||map[z+1][x]==='.'||map[z][x-1]==='.'||map[z][x+1]==='.'))continue;
  const n=(x*71+z*31+N*17)&255;
  if(n%32===0)placements.push({x:x-O,z:z-O,asset:placements.length%3===0?'environment/dungeon_pillar.glb':'environment/dungeon_wall.glb',size:1.1,kind:'architecture'});
  if(placements.length>=5)break architecture;
 }
 // A limited number of genuine wooden 3D crates perch beside walls, offset
 // away from tile centres so they don't visually collide with exploring heroes.
 props:for(let z=2;z<N-2;z++)for(let x=2;x<N-2;x++){
  if(map[z][x]!=='.'||(Math.abs(x-1)+Math.abs(z-1)<4)||((x*97+z*17+N*11)&63)!==7)continue;
  const directions=[[0,-1],[1,0],[0,1],[-1,0]],dir=directions.find(([dx,dz])=>wall(x+dx,z+dz));
  if(!dir)continue;
  placements.push({x:x-O+dir[0]*.29,z:z-O+dir[1]*.29,asset:'environment/dungeon_crate.glb',size:.53,kind:'prop'});
  if(placements.length>=13)break props;
 }
 const group=new THREE.Group();world.add(group);
 for(const p of placements){load(p.asset).then(gltf=>{
  if(!gltf||world.userData.sceneKey!==sceneKey)return;
  const source=gltf.scene.clone(true);source.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.userData.sharedAssetGeometry=true}});
  const bounds=new THREE.Box3().setFromObject(source),extent=new THREE.Vector3();
  bounds.getSize(extent);
  const largest=Math.max(extent.x,extent.y/2.2,extent.z,.01);
  const fit=Math.min(3,Math.max(.08,p.size/largest));
  source.scale.setScalar(fit);
  source.position.set(p.x,-.03-bounds.min.y*fit,p.z);
  group.add(source);
 })}
 return{group,count:placements.length};
}
function stats(actors){
 const all=[...actors.values()],authored=all.filter(a=>a.authored);
 return{authoredBosses:authored.filter(a=>a.u.kind==='warden').length,bossRegaliaParts:all.reduce((n,a)=>n+(a.regaliaParts||0),0),roleSilhouetteActors:authored.filter(a=>(a.roleSilhouetteParts||0)>0).length,roleSilhouetteParts:all.reduce((n,a)=>n+(a.roleSilhouetteParts||0),0),anatomicalDetailActors:authored.filter(a=>(a.anatomicalParts||0)>0).length,sculptedArmorActors:authored.filter(a=>a.sculptedArmorProfile).length,sculptedArmorVertices:authored.reduce((sum,a)=>sum+(a.sculptedArmorVertices||0),0),sculptedArmorProfiles:[...new Set(authored.map(a=>a.sculptedArmorProfile).filter(Boolean))].sort(),anatomicalDetailParts:all.reduce((n,a)=>n+(a.anatomicalParts||0),0),anatomicalJointFittings:all.reduce((n,a)=>n+(a.anatomicalJointParts||0),0),anatomicalDetailMeshes:all.reduce((n,a)=>n+(a.anatomicalDetailMeshes||0),0),anatomicalStaticMergedParts:all.reduce((n,a)=>n+(a.anatomicalStaticMergedParts||0),0),draperyActors:authored.filter(a=>(a.draperyPanels?.length||0)>0).length,draperyPanels:all.reduce((n,a)=>n+(a.draperyPanels?.length||0),0),draperyTriangles:all.reduce((n,a)=>n+(a.draperyTriangles||0),0),draperyFramesSkipped:all.reduce((n,a)=>n+(a.draperyFramesSkipped||0),0),draperyNormalRebuilds:all.reduce((n,a)=>n+(a.draperyNormalRebuilds||0),0),draperyVertexUploads:all.reduce((n,a)=>n+(a.draperyVertexUploads||0),0),draperyPeakDeformationMeters:Math.max(0,...all.map(a=>a.draperyPeakDeformationMeters||0)),rigCranialActors:authored.filter(a=>a.rigCranial?.applied).length,rigCranialRatios:authored.filter(a=>a.rigCranial?.applied).map(a=>({kind:a.u.kind,ratio:a.rigCranial.ratio})).slice(0,18),rigGestureBones:authored.reduce((n,a)=>n+(a.rigUpperArms?.length||0),0),rigGesturePeakRad:Math.max(0,...authored.map(a=>a.rigGesturePeak||0)),rigForearmBones:authored.reduce((n,a)=>n+(a.rigForearms?.length||0),0),rigForearmPeakRad:Math.max(0,...authored.map(a=>a.rigForearmPeak||0)),rigGaitBones:authored.reduce((n,a)=>n+(a.rigGaitBones?.length||0),0),rigGaitPeakRad:Math.max(0,...authored.map(a=>a.rigGaitPeak||0)),rigContactBraceActors:authored.filter(a=>(a.rigContactBracePeak||0)>.09).length,rigContactBracePeakRad:Math.max(0,...authored.map(a=>a.rigContactBracePeak||0)),rigMeleeBones:authored.reduce((n,a)=>n+(a.rigMeleeBones?.length||0),0),rigMeleePeakRad:Math.max(0,...authored.map(a=>a.rigMeleePeak||0)),rigMeleeCurrentPeakRad:Math.max(0,...authored.map(a=>a.rigMeleeCurrentPeak||0)),rigMeleeActiveActors:authored.filter(a=>a.rigMeleeActive).length,rigMeleeBoneNames:authored.flatMap(a=>(a.rigMeleeBones||[]).map(m=>m.part+':'+m.bone.name)).slice(0,12),rigBoundAccessoryActors:authored.filter(a=>(a.rigBoundAccessoryParts||0)>0).length,rigBoundAccessoryParts:all.reduce((n,a)=>n+(a.rigBoundAccessoryParts||0),0),
 hiddenFallbackOrnamentActors:authored.filter(a=>(a.detail?.hiddenProceduralOrnamentCount||0)>0).length,
 hiddenFallbackOrnamentMeshes:authored.reduce((n,a)=>n+(a.detail?.hiddenProceduralOrnamentCount||0),0),rigGripAlignedActors:authored.filter(a=>a.rigGripAligned).length,rigGripMaxShiftMeters:Math.max(0,...authored.map(a=>a.rigGripShiftMeters||0)),rigGripCandidates:authored.filter(a=>a.rigGripCandidateMeters!==null).map(a=>({kind:a.u.kind,meters:a.rigGripCandidateMeters})).slice(0,3),rigHandBoneNames:authored.filter(a=>a.rigHandBoneName).map(a=>a.rigHandBoneName).slice(0,8),authoredCharacters:authored.length,proceduralFallbacks:all.length-authored.length,uniqueAssets:cache.size,missingAssets:failures.size,incompleteAssets:incompleteAssets.size,texturedCharacters:authored.filter(a=>a.textureReadiness?.decodedColorMaps>0).length,decodedColorMaps:authored.reduce((n,a)=>n+(a.textureReadiness?.decodedColorMaps||0),0)};
}
export {attachCharacter,updateActor,disposeActorAsset,putEnvironment,stats};
