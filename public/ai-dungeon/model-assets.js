import * as THREE from '/dungeon/vendor/three.module.js';
import {mergeGeometries} from '/dungeon/vendor/addons/utils/BufferGeometryUtils.js';
import {createSoftwareSourceRigMaterial} from '/dungeon/postfx-budget.js';
import {GLTFLoader} from '/dungeon/vendor/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from '/dungeon/vendor/addons/utils/SkeletonUtils.js';
import {planAuthoredMotion,planContactBodyLanguage} from '/dungeon/character-motion-plan.js';
import {planRangedBodyPose} from '/dungeon/ranged-encounter-plan.js';
import {planSkinnedDefeatPose,planSkinnedHitResponse,resolveImpactSide} from '/dungeon/impact-choreography-plan.js';
import {planEvasionPerformance} from '/dungeon/evasion-performance-plan.js';
import {planCombatPerformanceBeat} from '/dungeon/combat-performance-plan.js';
import {planNativeDuelPose,planNativeOneShotSpeed} from '/dungeon/native-duel-performance.js';
import {planNativeDuelContinuity} from '/dungeon/native-duel-continuity.js';
import {planWardenRegalia,planWardenRegaliaBone} from '/dungeon/warden-regalia-plan.js';
import {planWardenRegaliaDrawGroups} from '/dungeon/warden-regalia-plan.js';
import {WARDEN_STAGE_PROFILE} from '/dungeon/warden-regalia-plan.js';
import {planWardenRegaliaMotion} from '/dungeon/warden-chapter-plan.js';
import {planRoleSilhouette} from '/dungeon/role-silhouette-plan.js';
import {planFittedRoleDetail} from '/dungeon/role-silhouette-plan.js';
import {planAnatomicalKit,planAnatomicalDrawGroups} from '/dungeon/anatomical-kit-plan.js';
import {createForgedArmorForms,planForgedArmor,planForgedFinishes,planAuthoredBodyShape} from '/dungeon/forged-armor.js';
import {planNativeFigureSculpt,sculptNativeFigureGeometry} from '/dungeon/native-figure-sculpt.js';
import {planDrapePanels,planDrapeSwing,planDrapeVertexBend,drapePoseKey,DRAPE_ROWS,DRAPE_COLUMNS} from '/dungeon/fabric-drape-plan.js';
import {rigWeaponParts,selectHandBone,rigGripAnchor,boundedGripOffset,selectUpperArmBone,planRigArmGesture,selectForearmBone,planRigForearmGesture,selectLegBone,advanceRigGait,planRigLegGesture,planRigFullBodyStride,planRigContactBrace,selectCranialBone,planCranialRatio,restoreCranialProportion,stageCranialProportion,selectCombatTorsoBone,planRigMeleeFollowThrough,selectPelvisBone,planRigBearing} from '/dungeon/rig-attachment-plan.js';

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
function nativeSurfaceTier(source,softwareWebGL){
 const output=createSoftwareSourceRigMaterial(THREE,source,{software:softwareWebGL});
 if(output!==source)source.dispose();
 return output;
}
function configure(mesh,kind,owned,softwareWebGL=false){
 // A unified desaturated PBR source layer stops glowing KayKit base colours
 // from fighting the role-specific forged cuirass and animated leather.
 // Clone every shared GLB material, never tint the cached master or another
 // character's map. Embedded, already-vetted textures remain attached.
 const role=planForgedFinishes(kind);
 const textile=new THREE.Color(role?.textile?.color||'#68717a');
 const boss=kind==='warden';
 mesh.traverse(obj=>{
  if(!obj.isMesh)return;
  obj.castShadow=true;obj.receiveShadow=true;obj.userData.sharedAssetGeometry=true;
  const source=Array.isArray(obj.material)?obj.material:[obj.material];
  const fitted=source.map(mat=>{
   if(!mat)return mat;
   const copy=mat.clone();
   if(copy.color){
    // Material.color multiplies the original texture: do not replace maps.
    copy.color.lerp(textile,boss?.13:.09);
    if(boss)copy.color.lerp(new THREE.Color('#e4b18b'),.15);
   }
   if('roughness' in copy)copy.roughness=Math.min(1,Math.max(.58,copy.roughness??.8));
   if('metalness' in copy)copy.metalness=Math.min(.47,Math.max(0,copy.metalness??0));
   if(boss&&copy.emissive){
    copy.emissive.lerp(new THREE.Color('#a74d2e'),.14);
    copy.emissiveIntensity=Math.min(.28,Math.max(copy.emissiveIntensity||0,.10));
   }
   const surface=nativeSurfaceTier(copy,softwareWebGL);
   owned.push(surface);
   return surface;
  });
  obj.material=Array.isArray(obj.material)?fitted:fitted[0];
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
 // The source-rig isolated deformation assay extracts this original Warden
 // function alone. Only the actual attached software renderer owns its tier;
 // the isolated Three.js rig proof keeps untouched original PBR materials.
 if(actor.nativeSoftwareSurfaceTier&&typeof nativeSurfaceTier==='function')
  for(const key of Object.keys(finishes))finishes[key]=nativeSurfaceTier(finishes[key],true);
 // Original forged shapes and finishes are identical to the separately drawn
 // art. Only retained GPU submission ownership changes, not the silhouette.
 const plaqueOutline=new THREE.Shape();
 plaqueOutline.moveTo(-.44,-.50);
 plaqueOutline.lineTo(.44,-.50);
 plaqueOutline.lineTo(.50,-.37);
 plaqueOutline.lineTo(.50,.37);
 plaqueOutline.lineTo(.35,.50);
 plaqueOutline.lineTo(-.35,.50);
 plaqueOutline.lineTo(-.50,.37);
 plaqueOutline.lineTo(-.50,-.37);
 plaqueOutline.closePath();
 const plaque=new THREE.ExtrudeGeometry(plaqueOutline,{
  depth:.76,steps:1,bevelEnabled:true,bevelThickness:.045,
  bevelSize:.038,bevelSegments:2,curveSegments:3
 });
 plaque.center();
 const forms={
  plate:new THREE.SphereGeometry(.5,20,13),
  spike:new THREE.ConeGeometry(.5,1,11),
  gem:new THREE.OctahedronGeometry(.5,1),
  lamella:plaque
 };
 const ownedGeometries=Object.values(forms),animatedRegalia=[];
 // The unique hand-curved horns keep their own meshes and real head-bone
 // mounting. All other originals use the same actual forms and materials in
 // a retained instance batch, with independent native bone matrices.
 for(const item of plan.filter(p=>p.shape==='horn')){
  const points=item.points.map(p=>new THREE.Vector3(...p));
  const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),14,.047,7,false);
  ownedGeometries.push(geometry);
  const mesh=new THREE.Mesh(geometry,finishes[item.finish]);
  mesh.name=item.id;mesh.castShadow=true;mesh.receiveShadow=true;
  group.add(mesh);
 }
 actor.visualPivot.add(group);
 actor.visualPivot.updateWorldMatrix(true,true);
 actor.assetRoot?.updateWorldMatrix(true,true);
 const targets={
  head:actor.rigCranial?.bone,
  chest:actor.rigMeleeBones?.find(m=>m.part==='spine')?.bone,
  pelvis:actor.rigPelvisBone,
  leftUpperArm:actor.rigUpperArms?.find(m=>m.side==='left')?.bone,
  rightUpperArm:actor.rigUpperArms?.find(m=>m.side==='right')?.bone
 };
 const mounts=[],bindGroupWorld=group.matrixWorld.clone();
 let riggedPieces=0;
 for(const [jointName,bone] of Object.entries(targets)){
  if(!bone?.isBone)continue;
  bone.updateWorldMatrix(true,false);
  if(!bone.matrixWorld.elements.every(Number.isFinite))continue;
  const assigned=plan.filter(p=>p.shape==='horn'&&planWardenRegaliaBone(p.id)===jointName);
  if(!assigned.length)continue;
  const stage=new THREE.Group();stage.name='Native Warden '+jointName+' horn';
  stage.matrixAutoUpdate=false;group.add(stage);
  for(const part of assigned){
   const mesh=group.getObjectByName(part.id);
   if(mesh?.isMesh){stage.add(mesh);riggedPieces++;}
  }
  mounts.push({bone,stage,bindBoneInverse:bone.matrixWorld.clone().invert(),
   bindGroupWorld:bindGroupWorld.clone(),targetWorld:new THREE.Matrix4()});
 }
 const instances=[];
 for(const batch of planWardenRegaliaDrawGroups(actor.u.kind)){
  const mesh=new THREE.InstancedMesh(forms[batch.shape],finishes[batch.finish],batch.parts.length);
  mesh.name='Original Warden '+batch.shape+' '+batch.finish;
  mesh.castShadow=true;mesh.receiveShadow=true;
  // Bone-pose matrices change while the authoritative battle continues.
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled=false; // Mixed bone targets must not be culled by rest-pose bounds.
  group.add(mesh);
  const parts=[];
  for(const [index,item] of batch.parts.entries()){
   const pose=new THREE.Object3D();
   pose.position.set(item.x,item.y,item.z);
   pose.rotation.z=item.rz;
   pose.scale.set(item.sx,item.sy,item.sz);
   pose.updateMatrix();
   const bone=targets[planWardenRegaliaBone(item.id)];
   if(bone?.isBone){bone.updateWorldMatrix(true,false);riggedPieces++;}
   const part={index,id:item.id,pose,bone:bone?.isBone?bone:null,
    bindBoneInverse:bone?.isBone?bone.matrixWorld.clone().invert():null,
    restGroupWorld:bindGroupWorld};
   parts.push(part);
   mesh.setMatrixAt(part.index,pose.matrix);
   animatedRegalia.push({id:item.id,mesh:pose,x:item.x,y:item.y,
    rz:item.rz,sx:item.sx,sy:item.sy,sz:item.sz});
  }
  mesh.instanceMatrix.needsUpdate=true;
  instances.push({mesh,parts});
 }
 actor.wardenRegaliaRoot=group;
 actor.wardenRegaliaMounts=mounts;
 actor.wardenRegaliaInstances=instances;
 actor.wardenRegaliaInverse=new THREE.Matrix4();
 actor.wardenRegaliaInstanceDelta=new THREE.Matrix4();
 actor.wardenRegaliaInstanceLocal=new THREE.Matrix4();
 actor.wardenRegaliaRiggedParts=riggedPieces;
 actor.wardenRegaliaArt=animatedRegalia;
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
  // Angular hammered pauldrons and open, light fittings rather than
   // duplicated large spherical costume masses over a skinned character.
   plate:new THREE.IcosahedronGeometry(.5,0),
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
  const outfit=planFittedRoleDetail(actor.u.kind,part);
  mesh.userData.wardrobeMount=outfit.mount;
  if(part.shape!=='arc'){
   mesh.position.set(part.x,part.y,part.z);
   mesh.scale.set(part.sx*outfit.scale,part.sy*outfit.scale,part.sz*outfit.scale);
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

// This atlas is created once, shared across all original character armor and
// never rebuilt per tick/floor. Five original 96px embossed textures; no
// external assets, new geometry or extra draw calls.
const forgedMicrotextureCache=new Map();
function originalForgedMicrotexture(finish){
 if(!['steel','bronze','leather','bone','textile'].includes(finish))return null;
 if(forgedMicrotextureCache.has(finish))return forgedMicrotextureCache.get(finish);
 const size=96,pixels=new Uint8Array(size*size*4),salt={steel:1,bronze:2,leather:3,bone:4,textile:5}[finish];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let h=Math.imul(x+salt*31,374761393)^Math.imul(y+salt*17,668265263);
  h=Math.imul(h^(h>>>13),1274126177);
  const n=((h^(h>>>16))>>>0)/4294967295;
  const grain=finish==='steel'||finish==='bronze'
   ?.50+.20*Math.sin(x*1.14)*Math.cos(y*1.26)+.13*Math.sin((x+y*.3)*.55)+.12*(n-.5):
   finish==='leather'?.46+.22*Math.sin(x*1.92)*Math.sin(y*1.73)+.28*(n-.5):
   finish==='bone'?.53+.17*Math.sin(y*.93+Math.sin(x*.14)*2)+.15*(n-.5):
   .51+.15*Math.cos(x*1.38)-.16*Math.cos(y*1.34)+.10*(n-.5);
  const value=Math.round(Math.max(.13,Math.min(.87,grain))*255),i=(y*size+x)*4;
  pixels[i]=pixels[i+1]=pixels[i+2]=value;pixels[i+3]=255;
 }
 const texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);
 texture.name='Original forged '+finish+' relief';
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);
 texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
 texture.generateMipmaps=true;texture.anisotropy=2;texture.needsUpdate=true;
 forgedMicrotextureCache.set(finish,texture);return texture;
}

function addAnatomicalKit(actor){
 // The live 1.82m GLB retains its continuous skinned face, fabric and
 // original weapons. Six sculpted class-specific forged plates reinforce
 // anatomy without the previously rejected opaque costume replacement.
 const selected=new Set(['forged-cuirass','left-bracer','right-bracer',
  'left-shin','right-shin','hip-mail'].map(part=>actor.u.kind+'-'+part));
 const plan=planAnatomicalKit(actor.u.kind).filter(p=>selected.has(p.id));
 if(!plan.length||!actor.visualPivot)return;
 const group=new THREE.Group();group.name='Original '+actor.u.kind+' anatomical armour';
 const materials=planForgedFinishes(actor.u.kind);
 if(!materials)return;
 const finishes=Object.fromEntries(Object.entries(materials).map(([name,settings])=>{
  const micro=originalForgedMicrotexture(name);
  return [name,new THREE.MeshStandardMaterial({...settings,
   ...(name==='textile'?{side:THREE.DoubleSide}:{}),
   ...(micro?{bumpMap:micro,roughnessMap:micro,bumpScale:name==='textile'?.022:name==='bone'?.027:.041}:{})
  })];
 }));
 if(actor.nativeSoftwareSurfaceTier)for(const key of Object.keys(finishes))
  finishes[key]=nativeSurfaceTier(finishes[key],true);
 const forms=createForgedArmorForms(THREE,actor.u.kind);
 if(!forms)return;
 actor.sculptedArmorProfile=planForgedArmor(actor.u.kind)?.name??null;
 actor.sculptedArmorVertices=Object.values(forms).reduce((sum,geometry)=>sum+(geometry.getAttribute('position')?.count||0),0);
 const joints={
  head:actor.rigCranial?.bone,
  leftForearm:actor.rigForearms?.find(item=>item.side==='left')?.bone,
  rightForearm:actor.rigForearms?.find(item=>item.side==='right')?.bone,
  leftLowerLeg:actor.rigGaitBones?.find(item=>item.side==='left'&&item.part==='lower')?.bone,
  rightLowerLeg:actor.rigGaitBones?.find(item=>item.side==='right'&&item.part==='lower')?.bone,
  leftUpperLeg:actor.rigGaitBones?.find(item=>item.side==='left'&&item.part==='upper')?.bone,
  rightUpperLeg:actor.rigGaitBones?.find(item=>item.side==='right'&&item.part==='upper')?.bone,
  hips:actor.rigPelvisBone
 };
 actor.visualPivot.add(group);
 actor.visualPivot.updateWorldMatrix(true,true);
 actor.assetRoot.updateWorldMatrix(true,true);
 let attached=0,renderMeshes=0,mergedParts=0;
 const mounts=[];
 const chest=actor.rigMeleeBones?.find(m=>m.part==='spine')?.bone;
 const {staticGroups,jointPieces}=planAnatomicalDrawGroups(actor.u.kind);
 // Equivalent static T*R*S transforms and face normals; only cosmetics change.
 for(const {finish,parts:sourceParts} of staticGroups){
  const parts=sourceParts.filter(p=>selected.has(p.id));
  if(!parts.length)continue;
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
    if(chest?.isBone)mounts.push({mesh,bone:chest});
   }
   continue;
  }
  const mesh=new THREE.Mesh(merged,finishes[finish]);
  mesh.name=actor.u.kind+'-'+finish+'-merged-torso';
  mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  actor.assetGeometries.push(merged);
  mergedParts+=parts.length;renderMeshes++;
  if(chest?.isBone)mounts.push({mesh,bone:chest});
 }
 // Genuine arm/shin fittings stay separate and follow cloned skeletal joints.
 for(const piece of jointPieces){
  if(!selected.has(piece.id))continue;
  const mesh=new THREE.Mesh(forms[piece.shape],finishes[piece.finish]);
  mesh.name=piece.id;mesh.position.set(piece.x,piece.y,piece.z);
  mesh.scale.set(piece.sx,piece.sy,piece.sz);mesh.rotation.z=piece.rz;
  mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  const joint=joints[piece.mount];
  if(joint?.isBone){mounts.push({mesh,bone:joint});attached++;}
  renderMeshes++;
 }
 // Nonuniform source GLB fitting makes Object3D.attach() shear rigid plate
 // meshes. Pre-bind native joint matrices and animate cosmetic world deltas.
 group.updateWorldMatrix(true,true);actor.assetRoot.updateWorldMatrix(true,true);
 const groupBind=group.matrixWorld.clone(),stages=[];
 for(const {mesh,bone} of mounts){
  bone.updateWorldMatrix(true,false);
  if(!bone.matrixWorld.elements.every(Number.isFinite))continue;
  const stage=new THREE.Group();stage.matrixAutoUpdate=false;
  stage.name='Original native forged armour '+mesh.name;
  group.add(stage);stage.add(mesh);
  stages.push({bone,stage,bindBoneInverse:bone.matrixWorld.clone().invert(),
   groupBind:groupBind.clone(),targetWorld:new THREE.Matrix4()});
 }
 actor.nativeArmourRoot=group;actor.nativeArmourMounts=stages;
 actor.nativeArmourInverse=new THREE.Matrix4();
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
   const wardrobe=actor.cinematicFigure?.sourceMeshesHidden?.77:1;
   const x=part.side*.235+(u-.5)*part.width*wardrobe*(1+part.flare*t)+part.side*.035*t+.016*Math.sin(u*Math.PI*3)*t;
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
 // Every original character now articulates a real chest for casts and
 // nonfatal recoil. Genuine hand-driven follow-through remains melee-only.
 actor.rigMeleeBones=[];
 const chest=selectCombatTorsoBone(bones);
 const hand=['vanguard','revenant','warden'].includes(actor.u.kind)?selectHandBone(bones,'right'):null;
 for(const [part,bone] of [['spine',chest],['wrist',hand]]){
  if(bone)actor.rigMeleeBones.push({
   part,bone,last:new THREE.Quaternion(),inverse:new THREE.Quaternion(),
   next:new THREE.Quaternion(),euler:new THREE.Euler()
  });
 }
 actor.rigMeleeCurrentPeak=0;actor.rigMeleePeak=0;actor.rigMeleeActive=false;
 actor.rigPelvisBone=selectPelvisBone(bones);
 actor.rigPelvisBearing=actor.rigPelvisBone?{bone:actor.rigPelvisBone,last:new THREE.Quaternion(),inverse:new THREE.Quaternion(),next:new THREE.Quaternion(),euler:new THREE.Euler()}:null;
 // Authentic KayKit head skin joints are animated (including scale) in the
 // imported GLB clips. Apply our original adult-proportion adjustment only
 // AFTER the mixer, reversing it before the next mixer update. Missing bones
 // remain unchanged and never create or reposition a gameplay entity.
 const cranialBone=selectCranialBone(bones);
 actor.rigCranial=cranialBone?{
  bone:cranialBone,ratio:planCranialRatio(actor.u.kind),applied:false,bearingLast:new THREE.Quaternion(),bearingInverse:new THREE.Quaternion(),bearingNext:new THREE.Quaternion(),bearingEuler:new THREE.Euler()
 }:null;
 actor.rigGaitPosition=actor.root?.position?.clone?.()??null;
 actor.rigGaitPhase=0;actor.rigGaitWeight=0;actor.rigGaitPeak=0;actor.rigContactBracePeak=0;
}
function restoreRigCranialBeforeMixer(actor){
 const m=actor.rigCranial;
 if(m?.bearingLast){m.bone.quaternion.multiply(m.bearingInverse.copy(m.bearingLast).invert());m.bearingLast.identity();}
 restoreCranialProportion(m);
}
function stageRigCranialAfterMixer(actor){
 const m=actor.rigCranial;stageCranialProportion(m);if(!m)return;
 const p=actor.rigBearing?.head||RIG_ZERO,duel=actor.nativeDuel?.head||RIG_ZERO;
 m.bearingNext.setFromEuler(m.bearingEuler.set(
  Math.max(-.26,Math.min(.30,p.pitch+duel.pitch)),
  Math.max(-.24,Math.min(.24,p.yaw+duel.yaw)),
  Math.max(-.20,Math.min(.20,p.roll+duel.roll)),'YXZ'));
 m.bone.quaternion.multiply(m.bearingNext);m.bearingLast.copy(m.bearingNext);
}
function restoreRigPelvisBeforeMixer(actor){
 const m=actor.rigPelvisBearing;if(!m)return;
 m.bone.quaternion.multiply(m.inverse.copy(m.last).invert());m.last.identity();
}
function stageRigPelvisAfterMixer(actor){
 const m=actor.rigPelvisBearing;if(!m)return;const p=actor.rigBearing?.hips||RIG_ZERO;
 const g=actor.groundedPerformance,stride=actor.rigFullBodyStride?.hips||RIG_ZERO,duel=actor.nativeDuel?.hips||RIG_ZERO;
 m.next.setFromEuler(m.euler.set(
  Math.max(-.2,Math.min(.2,p.pitch+(g?.bodyPitch??0)*.32+stride.pitch+duel.pitch)),
  Math.max(-.15,Math.min(.15,p.yaw+stride.yaw+duel.yaw)),
  Math.max(-.16,Math.min(.16,p.roll+(g?.bodyRoll??0)*.65+stride.roll+duel.roll)),'YXZ'));
 m.bone.quaternion.multiply(m.next);m.last.copy(m.next);
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
const RIG_ZERO=Object.freeze({pitch:0,yaw:0,roll:0});
const NATIVE_MELEE_NO_BRACE=Object.freeze({
 left:Object.freeze({upper:0,lower:0,foot:0}),
 right:Object.freeze({upper:0,lower:0,foot:0})
});
const NATIVE_MELEE_NO_ROOT=Object.freeze({x:0,y:0,z:0,pitch:0,roll:0,yaw:0});
function stageRigMeleeAfterMixer(actor,since,reducedMotion){
 actor.rigMeleeCurrentPeak=0;actor.rigMeleeActive=false;
 if(!actor.rigMeleeBones?.length)return;
 const pose=planRigMeleeFollowThrough(actor.u.kind,actor.u.action||'idle',since,
  actor.combatFacing?.distance,actor.combatFacing?.targetId,reducedMotion||actor.u.hp<=0);
 for(const mount of actor.rigMeleeBones){
  // One genuine imported bone receives ONE original melee performance,
  // not legacy follow-through + secondary beat + native duel stacked.
  const nativeMelee=actor.nativeDuel?.mode&&actor.nativeDuel.mode!=='rest';
  const joint=nativeMelee?RIG_ZERO:pose[mount.part],
   extra=nativeMelee?RIG_ZERO:(actor.performanceBeat?.[mount.part]||RIG_ZERO);
  const native=actor.nativeDuel?.[mount.part]||RIG_ZERO;
  const dodge=mount.part==='spine'?(actor.evasionFrame?.spine||RIG_ZERO):RIG_ZERO;
  const bearing=mount.part==='spine'?(actor.rigBearing?.chest||RIG_ZERO):RIG_ZERO;
  const stride=mount.part==='spine'?(actor.rigFullBodyStride?.chest||RIG_ZERO):RIG_ZERO;
  const threat=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion&&mount.part==='spine'?
   actor.wardenCharge?.threatPerformance:null;
  const strike=mount.part==='spine'&&!reducedMotion?actor.wardenStrikePose?.spine:null;
  mount.next.setFromEuler(mount.euler.set(
   Math.max(-.55,Math.min(.55,joint.pitch+extra.pitch+native.pitch+dodge.pitch+bearing.pitch+stride.pitch+(strike?.pitch??0))),
   Math.max(-.48,Math.min(.48,joint.yaw+extra.yaw+native.yaw+dodge.yaw+bearing.yaw+stride.yaw+(threat?.torsoYaw??0)+(strike?.yaw??0))),
   Math.max(-.46,Math.min(.46,joint.roll+extra.roll+native.roll+dodge.roll+bearing.roll+stride.roll+(threat?.torsoRoll??0)+(strike?.roll??0))),'YXZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.copy(mount.next);
  actor.rigMeleeCurrentPeak=Math.max(actor.rigMeleeCurrentPeak,
   Math.abs(joint.pitch+extra.pitch+native.pitch),
   Math.abs(joint.yaw+extra.yaw+native.yaw),
   Math.abs(joint.roll+extra.roll+native.roll));
 }
 actor.rigMeleePeak=Math.max(actor.rigMeleePeak||0,actor.rigMeleeCurrentPeak);
 actor.rigMeleeActive=actor.rigMeleeCurrentPeak>.08;
}
// Genuine ranged release follows the actual imported chest/shoulder/elbow
// joints and composes into the existing reversible mount quaternion.
function stageRigRangedAfterMixer(actor,since,reducedMotion){
 const p=planRangedBodyPose(actor.u.kind,actor.u.action||'idle',since,
  actor.combatFacing?.distance,actor.combatFacing?.targetId,reducedMotion||actor.u.hp<=0);
 actor.rigRangedActive=p.weight>.1;
 actor.rigRangedPeak=Math.max(actor.rigRangedPeak||0,p.weight);
 if(!actor.rigRangedActive)return;
 const apply=(mount,pitch,yaw=0,roll=0)=>{
  mount.next.setFromEuler(mount.euler.set(pitch,yaw,roll,'YXZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.multiply(mount.next);
 };
 for(const mount of actor.rigUpperArms||[])
  apply(mount,p.shoulders[mount.side].pitch,0,p.shoulders[mount.side].roll);
 for(const mount of actor.rigForearms||[])apply(mount,p.elbows[mount.side]);
 for(const mount of actor.rigMeleeBones||[])if(mount.part==='spine')
  apply(mount,p.spine.pitch,p.spine.yaw,p.spine.roll);
}
function stageRigArmsAfterMixer(actor,since,reducedMotion){
 // Keep legacy/no-bone rigs lightweight and compatible with offline fallback.
 if(!actor.rigUpperArms?.length)return;
 const pose=planRigArmGesture(actor.u.kind,actor.u.action||'idle',since,reducedMotion);
 // Real Warden warnings articulate the original imported shoulders in three
 // distinct attack silhouettes. All deltas are reversed before the next mixer frame.
 const warningLift=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion&&
  Number.isFinite(actor.wardenCharge?.armRaise)?
  Math.max(-.64,Math.min(0,actor.wardenCharge.armRaise)):0;
 const exposure=actor.u.kind==='warden'&&actor.u.hp>0?actor.wardenExposure:null;
 const stagger=exposure?.shoulderPitch??0;
 const threat=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion?
  actor.wardenCharge?.threatPerformance:null;
 actor.wardenChargeShoulderPeak=Math.max(actor.wardenChargeShoulderPeak||0,
  Math.abs(threat?.shoulders?.left?.pitch??warningLift),
  Math.abs(threat?.shoulders?.right?.pitch??warningLift));
 for(const mount of actor.rigUpperArms||[]){
  const nativeMelee=actor.nativeDuel?.mode&&actor.nativeDuel.mode!=='rest';
  const joint=nativeMelee?RIG_ZERO:pose[mount.side],
   extra=nativeMelee?RIG_ZERO:(actor.performanceBeat?.arms?.[mount.side]||RIG_ZERO);
  const native=actor.nativeDuel?.arms?.[mount.side]||RIG_ZERO;
  const stride=actor.rigFullBodyStride?.arms?.[mount.side];
  const physicalTell=threat?.shoulders?.[mount.side];
  const strike=actor.wardenStrikePose?.shoulders?.[mount.side];
  mount.next.setFromEuler(mount.euler.set(
   Math.max(-.62,Math.min(.62,joint.pitch+(physicalTell?.pitch??warningLift)+(strike?.pitch??0)+stagger+extra.pitch+native.pitch+(stride?.pitch??0)+(actor.evasionFrame?.arms?.[mount.side]?.pitch??0))),0,
   Math.max(-.38,Math.min(.38,joint.roll+(physicalTell?.roll??0)+(strike?.roll??0)+extra.roll+native.roll+(stride?.roll??0)+(mount.side==='left'?-1:1)*(exposure?.shoulderRoll??0)+(actor.evasionFrame?.arms?.[mount.side]?.roll??0))),'XYZ'));
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
  // One anatomical elbow has a single mechanical envelope. Two truthful
  // visual cues (authored clip and contact beat) must not accidentally stack
  // into a rubber-jointed arm or fool the browser diagnostic with a raw sum.
  const threat=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion?
   (actor.wardenCharge?.threatPerformance?.forearms?.[mount.side]??0):0;
  const nativeMelee=actor.nativeDuel?.mode&&actor.nativeDuel.mode!=='rest';
  const angle=Math.max(-.445,Math.min(.445,
   (nativeMelee?0:pose[mount.side])+threat+(actor.wardenStrikePose?.forearms?.[mount.side]??0)+
   (nativeMelee?0:(actor.performanceBeat?.elbows?.[mount.side]||0))+
   (actor.nativeDuel?.forearms?.[mount.side]??0)+(actor.evasionFrame?.elbows?.[mount.side]??0)));
  mount.next.setFromEuler(mount.euler.set(angle,0,0,'XYZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.copy(mount.next);
  actor.rigForearmPeak=Math.max(actor.rigForearmPeak||0,Math.abs(angle));
 }
}

// One actual rendered displacement sample feeds every native skeletal layer
// before posing, avoiding one-frame-late hips and invented footfalls.
function stageRigGroundedStride(actor,reducedMotion){
 // Real skinned gait requires real imported leg bones. Unauthored or partial
 // GLB rigs cannot acquire imagined feet or run a presentation-only clock.
 // This retains the original no-rig fallback during studio/VM playback too.
 if(!actor.rigGaitBones?.length){actor.rigLegStride=null;actor.rigFullBodyStride=null;return;}
 const current=actor.root?.position,previous=actor.rigGaitPosition;
 const travel=current&&previous?Math.hypot(current.x-previous.x,current.z-previous.z):0;
 if(current&&previous)previous.copy(current);
 const combat=['attack','cast','hurt','guard'].includes(actor.groundedPerformance?.clipAction);
 const stopped=reducedMotion||actor.u.hp<=0||combat;
 const gait=advanceRigGait(actor.rigGaitPhase,actor.rigGaitWeight,
  actor.locomotionTeleport?Infinity:stopped?0:Math.min(travel,.30),stopped);
 actor.rigGaitPhase=gait.phase;actor.rigGaitWeight=gait.weight;
 actor.rigLegStride=planRigLegGesture(gait.phase,gait.weight,stopped);
 actor.rigFullBodyStride=planRigFullBodyStride(actor.u.kind,gait.phase,gait.weight,stopped);
 actor.rigFullBodyStridePeak=Math.max(actor.rigFullBodyStridePeak||0,
  Math.abs(actor.rigFullBodyStride.hips.yaw),Math.abs(actor.rigFullBodyStride.chest.yaw));
}
function stageRigLegsAfterMixer(actor,since,reducedMotion){
 if(!actor.rigGaitBones?.length)return;
 const pose=actor.rigLegStride||planRigLegGesture(0,0,true);
 // Never invent a melee target: the app supplies only a grid-validated,
 // unobstructed public facing, and we require exactly one-cell contact.
 const nativeMelee=actor.nativeDuel?.mode&&actor.nativeDuel.mode!=='rest';
 // The source-rig attack's own real planted footwork supersedes the old
 // independent knee/ankle contact brace instead of rubber-stacking it.
 const brace=nativeMelee?NATIVE_MELEE_NO_BRACE:planRigContactBrace(actor.u.kind,actor.u.action||'idle',since,
  actor.combatFacing?.distance,reducedMotion||actor.u.hp<=0);
 // The actual 3-beat public NOVA plants genuine imported leg bones, without
 // additional grid steps or persistent changes to the animation mixer.
 const warningBrace=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion?
  Math.max(0,Math.min(.24,actor.wardenCharge?.brace??0)):0;
 for(const mount of actor.rigGaitBones){
  const contact=brace[mount.side][mount.part];
  const releaseBrace=actor.u.kind==='warden'&&!reducedMotion?(actor.wardenStrikePose?.brace??0):0;
  const plant=(warningBrace+releaseBrace)*(mount.part==='upper'?(mount.side==='left'?.72:1):
   mount.part==='lower'?-1.05:.28);
  const nativeContact=actor.nativeDuel?.legs?.[mount.side]?.[mount.part]??0;
  const angle=Math.max(-.30,Math.min(.30,pose[mount.side][mount.part]+contact+plant+nativeContact+(actor.evasionFrame?.legs?.[mount.side]?.[mount.part]??0)));
  // The previous real Chromium native-brace diagnostic reported 0 because
  // it measured only the intentionally suppressed LEGACY contact brace.
  // Measure the actual imported source-rig plant as well, without stacking
  // another strike or fabricating authoritative damage.
  actor.rigContactBracePeak=Math.max(actor.rigContactBracePeak||0,Math.abs(contact+nativeContact));
  mount.next.setFromEuler(mount.euler.set(angle,0,0,'XYZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.copy(mount.next);
  actor.rigGaitPeak=Math.max(actor.rigGaitPeak||0,Math.abs(angle));
 }
}

/**
 * Make the actual animated torso, head and upper arms carry their original
 * costume. A static world-space overlay otherwise hovers through every sword
 * swing, dodge, boss recoil and death. Capture the current world transform
 * once with Object3D.attach: no per-frame mesh allocation or fake game step.
 * Hand grips remain the independent original rig-validated assembly.
 * Missing source joints retain their safe original presentation pivot.
 */
function bindRigWardrobe(actor){
 if(!actor.visualPivot||!actor.assetRoot)return;
 const spine=actor.rigMeleeBones?.find(m=>m.part==='spine')?.bone;
 const head=actor.rigCranial?.bone;
 const leftArm=actor.rigUpperArms?.find(m=>m.side==='left')?.bone;
 const rightArm=actor.rigUpperArms?.find(m=>m.side==='right')?.bone;
 const mount={chest:spine,head,leftArm,rightArm};
 const costume=actor.visualPivot.getObjectByName('Original '+actor.u.kind+' class details');
 const armor=actor.visualPivot.getObjectByName('Original '+actor.u.kind+' anatomical armour');
 actor.visualPivot.updateWorldMatrix(true,true);
 actor.assetRoot.updateWorldMatrix(true,true);
 let fittings=0,torsoBatches=0;
 if(costume)for(const part of [...costume.children]){
  const bone=mount[part.userData.wardrobeMount];
  if(bone&&part.isMesh){bone.attach(part);fittings++;}
 }
 // All shared torso batches have one stable rest transform. Parent them to
 // the genuine chest, so damage/attack/cast/defeat rotations articulate the
 // sculpted cuirass rather than passing through it. Limb mounts already track
 // the cloned skeleton individually and are never reparented here.
 if(spine&&armor)for(const part of [...armor.children]){
  if(!part.isMesh||!part.name.endsWith('-merged-torso'))continue;
  spine.attach(part);torsoBatches++;
 }
 actor.rigWardrobeParts=fittings;
 actor.anatomicalStaticMountedCount=torsoBatches;
}
/**
 * Remeasure five ORIGINAL skinned GLB body segments once, on actor-owned
 * clones. Each native source remains weight-painted, textured and fully
 * animated. No detached silhouette, draw calls or gameplay-state changes.
 */
function fitOriginalNativeFigure(actor){
 const report={segments:0,headSegments:0,changedVertices:0,maxShiftRaw:0};
 actor.assetRoot?.traverse(obj=>{
  if(!obj.isSkinnedMesh||!obj.geometry?.isBufferGeometry)return;
  const shared=obj.geometry;
  if(!shared.boundingBox)shared.computeBoundingBox();
  const plan=planNativeFigureSculpt(actor.u.kind,obj.name,shared.boundingBox);
  if(!plan)return;
  const privateGeometry=shared.clone();
  const receipt=sculptNativeFigureGeometry(privateGeometry,plan);
  if(!receipt.applied){privateGeometry.dispose();return;}
  privateGeometry.name='Original '+actor.u.kind+' '+plan.part+' sculpt';
  obj.geometry=privateGeometry;
  obj.userData.sharedAssetGeometry=false;
  actor.assetGeometries.push(privateGeometry);
  report.segments++;
  if(plan.part==='head')report.headSegments++;
  report.changedVertices+=receipt.changed;
  report.maxShiftRaw=Math.max(report.maxShiftRaw,receipt.maxShiftRaw);
 });
 return report;
}
function attachCharacter(actor,{softwareWebGL=false}={}){
 const asset=selection[actor.u.kind];if(!asset)return Promise.resolve(false);
 const id=actor.u.id;
 const request=load(asset).then(gltf=>{
  if(!gltf||actor.detached||actor.u.id!==id)return false;
  const instance=cloneSkeleton(gltf.scene),owned=[],isBoss=actor.u.kind==='warden';
  configure(instance,actor.u.kind,owned,softwareWebGL);
  // Fit artist source units to dungeon scale and centre the feet on the floor.
  instance.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(instance),size=new THREE.Vector3(),center=new THREE.Vector3();
  bounds.getSize(size);bounds.getCenter(center);
  if(Number.isFinite(size.y)&&size.y>.05&&size.y<1000){
   const targetHeight=isBoss?WARDEN_STAGE_PROFILE.sourceHeight:1.82;
   const sourceScale=Math.max(.08,Math.min(12,targetHeight/size.y));
   const body=planAuthoredBodyShape(actor.u.kind);
   const fitX=sourceScale*(body?.width??1),fitZ=sourceScale*(body?.depth??1);
   // Keep the real artist feet on the ground; do not scale authoritative grid.
   instance.scale.set(fitX,sourceScale,fitZ);
   instance.position.set(-center.x*fitX,-bounds.min.y*sourceScale,-center.z*fitZ);
  }
  const pivot=new THREE.Group();(actor.impactPivot||actor.root).add(pivot);pivot.add(instance);
  actor.visualPivot=pivot;actor.nativeDuel=null;actor.nativeDuelMemory=null;actor.nativeDuelRecoveryFrames=0;actor.nativeDuelPeak=0;actor.nativeDuelContactFrames=0;actor.motionPeak=0;actor.evasionFrame=null;actor.evasionPosePeak=0;actor.assetRoot=instance;actor.assetMaterials=owned;actor.assetGeometries=[];actor.regaliaParts=0;actor.roleSilhouetteParts=0;actor.anatomicalParts=0;actor.anatomicalJointParts=0;actor.anatomicalDetailMeshes=0;actor.anatomicalStaticMergedParts=0;actor.sculptedArmorProfile=null;actor.sculptedArmorVertices=0;actor.rigBoundAccessoryParts=0;actor.cinematicFigure=null;actor.rigWardrobeParts=0;actor.anatomicalStaticMountedCount=0;actor.nativeArmourRoot=null;actor.nativeArmourMounts=[];actor.nativeArmourInverse=null;actor.rigHandBoneName=null;actor.rigHandBone=null;actor.rigGripAligned=false;actor.rigGripShiftMeters=0;actor.rigGripCandidateMeters=null;actor.rigCranial=null;actor.rigPelvisBone=null;actor.rigPelvisBearing=null;actor.rigBearing=null;actor.rigUpperArms=[];actor.rigGesturePeak=0;actor.wardenChargeShoulderPeak=0;actor.wardenCharge=null;actor.rigForearms=[];actor.rigForearmPeak=0;actor.rigGaitBones=[];actor.rigGaitPosition=null;actor.rigGaitPhase=0;actor.rigGaitWeight=0;actor.rigGaitPeak=0;actor.rigContactBracePeak=0;actor.rigMeleeBones=[];actor.rigMeleePeak=0;actor.rigMeleeCurrentPeak=0;actor.rigMeleeActive=false;actor.rigRangedActive=false;actor.rigRangedPeak=0;actor.skinnedHitWeight=0;actor.skinnedHitPeak=0;actor.draperyPanels=[];actor.draperyTriangles=0;actor.draperyPeakDeformationMeters=0;actor.draperyPoseKey=null;actor.draperyFramesSkipped=0;actor.draperyNormalRebuilds=0;actor.draperyVertexUploads=0;
  actor.nativeFigureSculpt=fitOriginalNativeFigure(actor);
  actor.body.visible=false;actor.authored=true;actor.detail?.setAuthored?.(true);actor.mixer=new THREE.AnimationMixer(instance);
  actor.availableClips=gltf.animations||[];actor.currentAction='';actor.currentActionTick=null;
  actor.textureReadiness=textureReadiness.get(gltf);
  bindRigArmGestures(actor);
  // Original adult-scale skinned figures replace the visible low-poly source
  // only when every critical native joint and physical weapon can be mounted.
  // The Warden retains the animated stage, ritual regalia and phase machinery.
  const joints={
   chest:actor.rigMeleeBones?.find(m=>m.part==='spine')?.bone,
   pelvis:actor.rigPelvisBone,head:actor.rigCranial?.bone,
   leftUpperArm:actor.rigUpperArms?.find(m=>m.side==='left')?.bone,
   rightUpperArm:actor.rigUpperArms?.find(m=>m.side==='right')?.bone,
   leftForearm:actor.rigForearms?.find(m=>m.side==='left')?.bone,
   rightForearm:actor.rigForearms?.find(m=>m.side==='right')?.bone,
   leftUpperLeg:actor.rigGaitBones?.find(m=>m.side==='left'&&m.part==='upper')?.bone,
   rightUpperLeg:actor.rigGaitBones?.find(m=>m.side==='right'&&m.part==='upper')?.bone,
   leftLowerLeg:actor.rigGaitBones?.find(m=>m.side==='left'&&m.part==='lower')?.bone,
   rightLowerLeg:actor.rigGaitBones?.find(m=>m.side==='right'&&m.part==='lower')?.bone,
   rightHand:(()=>{const found=[];actor.assetRoot.traverse(o=>{if(o.isSkinnedMesh)for(const b of o.skeleton?.bones||[])if(b?.isBone&&!found.includes(b))found.push(b);});return selectHandBone(found,'right');})()
  };
  // M1 visual rescue: genuine browser A/B showed the overlaid faceted skull,
  // disconnected plates and procedural garment bridges DEGRADE the running
  // game against its own untouched source rig (baseline 281735d). Retire that
  // complete duplicate silhouette from the live rendering path. Preserve all
  // original licensed GLB body, clothing, head, hands and weapon meshes, with
  // their continuous weight-painted skeleton and real source animations.
  // This is deliberately not an opaque procedural substitute or hidden draw.
  let visibleSourceMeshes=0,visibleSourceSkinMeshes=0,visibleSourceMaterials=0;
  actor.assetRoot.traverse(obj=>{
   if(!obj.isMesh)return;
   obj.visible=true;
   visibleSourceMeshes++;
   if(obj.isSkinnedMesh)visibleSourceSkinMeshes++;
   if((Array.isArray(obj.material)?obj.material:[obj.material]).some(m=>m?.map))visibleSourceMaterials++;
  });
  actor.nativePresentation={mode:'original-continuous-rig',sourceMeshes:visibleSourceMeshes,
   skinnedMeshes:visibleSourceSkinMeshes,texturedMeshes:visibleSourceMaterials,
   complete:visibleSourceSkinMeshes>=5&&visibleSourceMaterials>=1};
  actor.rigHandBone=joints.rightHand??null;
  actor.rigHandBoneName=joints.rightHand?.name??null;
  actor.wardenRegaliaRoot=null;actor.wardenRegaliaMounts=[];actor.wardenRegaliaInstances=[];actor.wardenRegaliaInstanceDelta=null;actor.wardenRegaliaInstanceLocal=null;
  actor.wardenRegaliaInverse=null;actor.wardenRegaliaRiggedParts=0;
  // Original Warden ritual identity sits on the same genuine skinned rig;
  // its authored warning/phase cues and genuine combat choreography survive.
  actor.nativeSoftwareSurfaceTier=Boolean(softwareWebGL&&visibleSourceSkinMeshes>0);
  if(isBoss)addWardenRegalia(actor);
  else if(actor.nativePresentation.complete)addAnatomicalKit(actor);
  changeAction(actor,actor.u.action||'idle');
  // Source GLB decoding is asynchronous. Apply the genuine head-bone adult
  // proportion before the actor can be painted on its first loaded frame.
  // Otherwise slow software WebGL can display the unscaled toy head until
  // the next RAF (and the first browser capture reports zero staged heads).
  // The regular updateActor path reverses this overlay before Mixer updates.
  stageRigCranialAfterMixer(actor);
  return true;
 }).catch(e=>{failures.add(asset);return false});
 return request;
}
function changeAction(actor,action){
 const oneShot=['attack','cast','hurt'].includes(action);
 let clipSpeed=action==='move'?(actor.groundedPerformance?.clipSpeed??1):1;
 const tick=actor.u.actionTick??null;
 const newEvent=oneShot&&actor.currentActionTick!==tick;
 if(actor.currentAction!==action||newEvent)actor.motionPeak=0;
 if(!actor.mixer)return;
 if(actor.currentAction===action&&!newEvent){
  if(action==='move'&&actor.activeClip)actor.activeClip.setEffectiveTimeScale(clipSpeed);
  return;
 }
 const clip=chooseClip(actor.availableClips,action);
 if(!clip)return;
 // Retiming the genuine imported one-shot matches the original sword/audio
 // contact envelope instead of each asset independently completing its clip.
 if(oneShot)clipSpeed=planNativeOneShotSpeed(action,clip.duration);
 const next=actor.mixer.clipAction(clip),previous=actor.activeClip;
 // Consecutive attacks and different actions may use the same AnimationAction.
 // Restart on a new authoritative action, never on every presentation frame.
 if(next!==previous||newEvent||actor.currentAction!==action){
  next.reset().setEffectiveTimeScale(clipSpeed).setEffectiveWeight(1);
  next.enabled=true;
  next.setLoop(oneShot?THREE.LoopOnce:THREE.LoopRepeat,oneShot?1:Infinity);
  next.clampWhenFinished=oneShot;
  next.play();
  if(previous&&previous!==next)next.crossFadeFrom(previous,oneShot?.12:.23,true);
  actor.activeClip=next;
 }
 actor.currentAction=action;actor.currentActionTick=tick;
}
// Called after real GLB mixer and hit/contact/root poses; only adjusts
// presentation matrices. Cached temporary matrices avoid per-frame GC.
// Each inherited GLB bone drives its original body plating without changing
// hitboxes, stamina, action timing, AI, seeded replay or private data.
function syncNativeArmour(actor){
 const group=actor.nativeArmourRoot,mounts=actor.nativeArmourMounts;
 if(!group||!mounts?.length||!actor.nativeArmourInverse)return;
 group.updateWorldMatrix(true,false);
 const inverse=actor.nativeArmourInverse.copy(group.matrixWorld).invert();
 for(const mount of mounts){
  mount.bone.updateWorldMatrix(true,false);
  mount.targetWorld.multiplyMatrices(mount.bone.matrixWorld,mount.bindBoneInverse)
   .multiply(mount.groupBind);
  mount.stage.matrix.multiplyMatrices(inverse,mount.targetWorld);
  mount.stage.matrixWorldNeedsUpdate=true;
 }
}
function syncWardenNativeRegalia(actor){
 const group=actor.wardenRegaliaRoot,mounts=actor.wardenRegaliaMounts;
 if(!group||!actor.wardenRegaliaInverse)return;
 group.updateWorldMatrix(true,false);
 const inverse=actor.wardenRegaliaInverse.copy(group.matrixWorld).invert();
 // Curved horns retain their exact original head-bone delta contract.
 for(const mount of mounts||[]){
  mount.bone.updateWorldMatrix(true,false);
  mount.targetWorld.multiplyMatrices(mount.bone.matrixWorld,mount.bindBoneInverse)
   .multiply(mount.bindGroupWorld);
  mount.stage.matrix.multiplyMatrices(inverse,mount.targetWorld);
  mount.stage.matrixWorldNeedsUpdate=true;
 }
 // One original shape/finish GPU draw now contains parts on multiple actual
 // animated bones. Keep individual bind-world transforms and source poses.
 // Matrices are retained: no allocations in the per-frame Warden hot path.
 const delta=actor.wardenRegaliaInstanceDelta,local=actor.wardenRegaliaInstanceLocal;
 for(const batch of actor.wardenRegaliaInstances||[]){
  for(const part of batch.parts){
   part.pose.updateMatrix();
   if(part.bone?.isBone){
    part.bone.updateWorldMatrix(true,false);
    delta.multiplyMatrices(part.bone.matrixWorld,part.bindBoneInverse)
     .multiply(part.restGroupWorld);
    local.multiplyMatrices(inverse,delta).multiply(part.pose.matrix);
   }else local.copy(part.pose.matrix);
   batch.mesh.setMatrixAt(part.index,local);
  }
  batch.mesh.instanceMatrix.needsUpdate=true;
 }
}
function stageWardenChapterRegalia(actor,reducedMotion){
 if(!actor.wardenRegaliaArt)return;
 for(const p of actor.wardenRegaliaArt){
  const morph=planWardenRegaliaMotion(p.id,actor.wardenPhase,actor.wardenCharge?.charge,reducedMotion,actor.wardenExposure?.weight??0);
  p.mesh.position.x=p.x+morph.x;p.mesh.position.y=p.y+morph.y;
  p.mesh.rotation.z=p.rz+morph.roll;
  p.mesh.scale.set(p.sx*morph.scale,p.sy*morph.scale,p.sz*morph.scale);
 }
}
/**
 * True positive-HP-loss recoil travels through the live imported skinned
 * shoulders, elbows, chest, thighs and calves. Each overlay is appended to
 * the mount.last quaternion which is reversed before the next mixer frame.
 * No fake hit, gameplay movement, physics or new rendering allocation.
 */
function stageSkinnedHitAfterMixer(actor,reducedMotion){
 actor.skinnedHitWeight=0;
 if(!actor.authored||!actor.root||actor.root.visible===false)return;
 const beat=actor.damageBeat;
 const pose=planSkinnedHitResponse(actor.u.kind,beat?.damage,beat?.maxHp,
  beat?.age,Boolean(beat?.fatal)||actor.u.hp<=0,reducedMotion,
  resolveImpactSide(beat?.incoming,actor.root.rotation.y));
 if(pose.weight<=0)return;
 actor.skinnedHitWeight=pose.weight;
 actor.skinnedHitPeak=Math.max(actor.skinnedHitPeak||0,pose.weight);
 const add=(mount,pitch,roll=0)=>{
  mount.next.setFromEuler(mount.euler.set(pitch,0,roll,'XYZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.multiply(mount.next);
 };
 for(const mount of actor.rigUpperArms||[])add(mount,pose.shoulders[mount.side]);
 for(const mount of actor.rigForearms||[])add(mount,pose.elbows[mount.side]);
 for(const mount of actor.rigGaitBones||[])add(mount,pose.legs[mount.side][mount.part]);
 for(const mount of actor.rigMeleeBones||[])if(mount.part==='spine')
  add(mount,pose.spine.pitch,pose.spine.roll);
}

/**
 * Keep the genuine GLB animator and all existing living attack/gait layers.
 * A true HP-zero body alone gains shoulder, elbow, knee and torso collapse.
 * The per-bone overlay is multiplied into the existing reversible 'last'
 * quaternion; restoreRigArms/Legs/Melee undo it before the next mixer frame.
 */
function stageSkinnedDefeatAfterMixer(actor,reducedMotion){
 actor.skinnedDefeatWeight=0;
 if(!actor.authored||!actor.root||actor.root.visible===false)return;
 const pose=planSkinnedDefeatPose(actor.u.kind,actor.u.hp,actor.damageBeat?.age??null,
  Boolean(actor.damageBeat?.fatal),reducedMotion,Boolean(actor.defeatIntermission));
 if(pose.weight<=0)return;
 actor.skinnedDefeatWeight=pose.weight;
 const apply=(mount,pitch,roll=0)=>{
  mount.next.setFromEuler(mount.euler.set(pitch,0,roll,'XYZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.multiply(mount.next);
 };
 for(const mount of actor.rigUpperArms||[])
  apply(mount,pose.shoulders[mount.side],mount.side==='left'?-pose.weight*.24:pose.weight*.19);
 for(const mount of actor.rigForearms||[])apply(mount,pose.elbows[mount.side]);
 for(const mount of actor.rigGaitBones||[])apply(mount,pose.legs[mount.side][mount.part]);
 for(const mount of actor.rigMeleeBones||[])if(mount.part==='spine')
  apply(mount,pose.spine.pitch,pose.spine.roll);
}

function updateActor(actor,dt,since=0,reducedMotion=false){
 if(!actor.authored||!actor.mixer)return;
 // Do not loop walk clips when the authoritative move has already settled.
 changeAction(actor,actor.groundedPerformance?.clipAction??actor.u.action??'idle');
 restoreRigArmsBeforeMixer(actor);
 restoreRigForearmsBeforeMixer(actor);
 restoreRigLegsBeforeMixer(actor);
 restoreRigMeleeBeforeMixer(actor);
 restoreRigCranialBeforeMixer(actor);
 restoreRigPelvisBeforeMixer(actor);
 actor.mixer.update(Math.min(.35,Math.max(0,dt)));
 // A witnessed local sword action now carries an original, single coherent
 // pose across the genuine skinned head, hips, torso, arms, wrist and feet.
 const continuation=planNativeDuelContinuity(actor.nativeDuelMemory,actor.u,since,dt,{
  targetId:actor.combatFacing?.targetId,distance:actor.combatFacing?.distance,
  reducedMotion,teleport:Boolean(actor.locomotionTeleport),
  attached:actor.root?.visible!==false&&!actor.detached
 });
 actor.nativeDuelMemory=continuation.memory;
 actor.nativeDuel=planNativeDuelPose(actor.u.kind,continuation.mode==='rest'?'idle':'attack',
  continuation.age,{
   targetId:continuation.targetId,distance:continuation.distance,
   alive:actor.u.hp>0,reducedMotion
  });
 // An authentic attack is permitted a source-skinned NON-CONTACT finish only.
 // The imported torso/wrist/boots settle; no damage VFX, HP or audio callback
 // can be triggered by this remembered visual posture.
 if(continuation.mode==='recovery'){
  actor.nativeDuel={...actor.nativeDuel,contactWeight:0,phase:'recovery'};
  actor.nativeDuelRecoveryFrames=Math.min(1000000,(actor.nativeDuelRecoveryFrames||0)+1);
 }
 actor.nativeDuelPeak=Math.max(actor.nativeDuelPeak||0,actor.nativeDuel.strength);
 if(actor.nativeDuel.contactWeight>.65)actor.nativeDuelContactFrames=Math.min(1000000,(actor.nativeDuelContactFrames||0)+1);
 actor.performanceBeat=planCombatPerformanceBeat(actor.u.kind,actor.u.action||'idle',since,{
  targetId:actor.combatFacing?.targetId,distance:actor.combatFacing?.distance,
  alive:actor.u.hp>0,reducedMotion
 });
 actor.evasionFrame=planEvasionPerformance(actor.u.kind,actor.evasionBeat?.age,actor.evasionBeat,
  {reducedMotion:reducedMotion||actor.u.hp<=0,yaw:actor.root?.rotation?.y??0});
 actor.evasionPosePeak=Math.max(actor.evasionPosePeak||0,actor.evasionFrame.strength);
 actor.rigBearing=planRigBearing(actor.u.kind,actor.u.hp,actor.u.maxHp,actor.u.action||'idle',since,actor.combatFacing?.distance,reducedMotion||actor.u.hp<=0);
 stageRigGroundedStride(actor,reducedMotion);
 stageRigCranialAfterMixer(actor);
 stageRigPelvisAfterMixer(actor);
 stageRigArmsAfterMixer(actor,since,reducedMotion);
 stageRigForearmsAfterMixer(actor,since,reducedMotion);
 stageRigLegsAfterMixer(actor,since,reducedMotion);
 stageRigMeleeAfterMixer(actor,since,reducedMotion);
 stageRigRangedAfterMixer(actor,since,reducedMotion);
 stageSkinnedHitAfterMixer(actor,reducedMotion);
 stageSkinnedDefeatAfterMixer(actor,reducedMotion);
 stageWardenChapterRegalia(actor,reducedMotion);
 if(actor.visualPivot){
  // A single unified physical sword phrase owns root translation when live.
  // Legacy pivot lunge + contact recoil + secondary lunge must NOT accumulate
  // over the genuine bone-planted stance (which already owns this weight shift).
  const nativeMelee=actor.nativeDuel?.mode&&actor.nativeDuel.mode!=='rest';
  const pose=nativeMelee?NATIVE_MELEE_NO_ROOT:
   planAuthoredMotion(actor.u.kind,actor.u.action||'idle',since,reducedMotion);
  const contact=nativeMelee?NATIVE_MELEE_NO_ROOT:
   planContactBodyLanguage(actor.u.kind,actor.u.action||'idle',since,{
    targetId:actor.combatFacing?.targetId,distance:actor.combatFacing?.distance,
    reducedMotion:reducedMotion||actor.u.hp<=0
   });
  const beat=nativeMelee?NATIVE_MELEE_NO_ROOT:actor.performanceBeat.root,
   dodge=actor.evasionFrame.root,native=actor.nativeDuel?.root;
  const ground=actor.groundedPerformance;
  actor.visualPivot.position.set(pose.x+contact.x+beat.x+dodge.x+(native?.x??0),
   pose.y+contact.y+beat.y+dodge.y+(native?.y??0)+(ground?.bodyLift??0),pose.z+contact.z+beat.z+dodge.z+(native?.z??0));
  // Real visible travel adds a restrained forward weight shift atop the
  // imported animation, without moving attack hitboxes or the authority grid.
  actor.visualPivot.rotation.set(pose.pitch+contact.pitch+beat.pitch+dodge.pitch+
   (actor.locomotionTilt||0)+(ground?.bodyPitch??0),contact.yaw,
   pose.roll+contact.roll+beat.roll+dodge.roll+(ground?.bodyRoll??0));
  actor.contactBodyPeakMeters=Math.max(actor.contactBodyPeakMeters||0,Math.hypot(contact.x+beat.x,contact.y+beat.y,contact.z+beat.z));
  actor.performanceBeatPeak=Math.max(actor.performanceBeatPeak||0,actor.performanceBeat.strength);
  actor.motionPeak=Math.max(actor.motionPeak||0,Math.abs(pose.x+contact.x),
   Math.abs(pose.y+contact.y),Math.abs(pose.z+contact.z));
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
 actor.cinematicFigure?.sync?.();
 syncNativeArmour(actor);
 syncWardenNativeRegalia(actor);
}
function disposeActorAsset(actor){
 actor.detached=true;
 actor.cinematicFigure?.dispose?.();
 actor.wardenRegaliaRoot=null;actor.wardenRegaliaMounts=[];actor.wardenRegaliaInstances=[];actor.wardenRegaliaInstanceDelta=null;actor.wardenRegaliaInstanceLocal=null;
 actor.wardenRegaliaInverse=null;actor.wardenRegaliaRiggedParts=0;
 // If the authored rig is retired, keep the complete coloured procedural
 // character visible as an offline/missing-asset fallback.
 actor.detail?.setAuthored?.(false);actor.body.visible=true;
 if(actor.mixer){actor.mixer.stopAllAction();if(actor.assetRoot)actor.mixer.uncacheRoot(actor.assetRoot)}
 if(actor.visualPivot){actor.visualPivot.removeFromParent();actor.visualPivot.clear()}
 else if(actor.assetRoot){actor.root.remove(actor.assetRoot)}
 for(const m of actor.assetMaterials||[])m.dispose();
 for(const g of actor.assetGeometries||[])g.dispose();
 actor.mixer=null;actor.assetRoot=null;actor.visualPivot=null;actor.nativeDuelMemory=null;actor.nativeDuelRecoveryFrames=0;actor.motionPeak=0;actor.evasionFrame=null;actor.evasionPosePeak=0;actor.assetMaterials=[];actor.assetGeometries=[];actor.regaliaParts=0;actor.roleSilhouetteParts=0;actor.anatomicalParts=0;actor.anatomicalJointParts=0;actor.anatomicalDetailMeshes=0;actor.anatomicalStaticMergedParts=0;actor.sculptedArmorProfile=null;actor.sculptedArmorVertices=0;actor.rigBoundAccessoryParts=0;actor.cinematicFigure=null;actor.rigWardrobeParts=0;actor.anatomicalStaticMountedCount=0;actor.nativeArmourRoot=null;actor.nativeArmourMounts=[];actor.nativeArmourInverse=null;actor.rigHandBoneName=null;actor.rigHandBone=null;actor.rigGripAligned=false;actor.rigGripShiftMeters=0;actor.rigGripCandidateMeters=null;actor.rigCranial=null;actor.rigUpperArms=[];actor.rigGesturePeak=0;actor.wardenChargeShoulderPeak=0;actor.wardenCharge=null;actor.rigForearms=[];actor.rigForearmPeak=0;actor.rigGaitBones=[];actor.rigGaitPosition=null;actor.rigGaitPhase=0;actor.rigGaitWeight=0;actor.rigGaitPeak=0;actor.rigContactBracePeak=0;actor.rigMeleeBones=[];actor.rigMeleePeak=0;actor.rigMeleeCurrentPeak=0;actor.rigMeleeActive=false;actor.rigRangedActive=false;actor.rigRangedPeak=0;actor.skinnedHitWeight=0;actor.skinnedHitPeak=0;actor.draperyPanels=[];actor.draperyTriangles=0;actor.draperyPeakDeformationMeters=0;actor.draperyPoseKey=null;actor.draperyFramesSkipped=0;actor.draperyNormalRebuilds=0;actor.draperyVertexUploads=0;actor.nativeFigureSculpt=null;actor.nativeSoftwareSurfaceTier=false;actor.authored=false;actor.textureReadiness=null;
}
function putEnvironment(world,sceneKey,map,onAssetReady=null){
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
  // Actual Gothic GLB geometry becomes visible after the first floor build.
  // Publish a physical sightline refresh only when this asset is parented.
  // The owning scene bounds the callback; no per-frame scans or authority work.
  if(typeof onAssetReady==='function')onAssetReady();
 })}
 return{group,count:placements.length};
}
function stats(actors){
 const all=[...actors.values()],authored=all.filter(a=>a.authored);
 return{nativeContinuousActors:authored.filter(a=>a.nativePresentation?.complete).length,
  nativeSoftwareSurfaceActors:authored.filter(a=>a.nativeSoftwareSurfaceTier).length,
  nativeDuelActiveActors:authored.filter(a=>a.nativeDuel&&a.nativeDuel.mode!=='rest').length,
  nativeDuelPeak:Math.max(0,...authored.map(a=>a.nativeDuelPeak||0)),
  nativeDuelContactFrames:authored.reduce((n,a)=>n+(a.nativeDuelContactFrames||0),0),
   nativeDuelRecoveryFrames:authored.reduce((n,a)=>n+(a.nativeDuelRecoveryFrames||0),0),
  nativeVisibleSourceMeshes:authored.reduce((n,a)=>n+(a.nativePresentation?.sourceMeshes||0),0),
  nativeVisibleSkinnedMeshes:authored.reduce((n,a)=>n+(a.nativePresentation?.skinnedMeshes||0),0),
  nativeTexturedSourceMeshes:authored.reduce((n,a)=>n+(a.nativePresentation?.texturedMeshes||0),0),
  nativeSculptActors:authored.filter(a=>(a.nativeFigureSculpt?.segments||0)>0).length,
   nativeSculptHeadSegments:authored.reduce((n,a)=>n+(a.nativeFigureSculpt?.headSegments||0),0),
  nativeSculptMeshes:authored.reduce((n,a)=>n+(a.nativeFigureSculpt?.segments||0),0),
  nativeSculptVertices:authored.reduce((n,a)=>n+(a.nativeFigureSculpt?.changedVertices||0),0),
  nativeSculptMaxShiftRaw:Math.max(0,...authored.map(a=>a.nativeFigureSculpt?.maxShiftRaw||0)),
  nativePresentationModes:[...new Set(authored.map(a=>a.nativePresentation?.mode).filter(Boolean))],
  cinematicFigures:authored.filter(a=>a.cinematicFigure).length,
  cinematicBosses:authored.filter(a=>a.u.kind==='warden'&&a.cinematicFigure).length,cinematicMeshes:authored.reduce((n,a)=>n+(a.cinematicFigure?.meshes||0),0),
  cinematicRenderedParts:authored.reduce((n,a)=>n+(a.cinematicFigure?.renderedParts||0),0),
  cinematicPairedBatches:authored.reduce((n,a)=>n+(a.cinematicFigure?.pairedBatches||0),0),
   cinematicIntegratedHeads:authored.reduce((n,a)=>n+(a.cinematicFigure?.integratedHeadDraws||0),0),
   cinematicIntegratedHeadParts:authored.reduce((n,a)=>n+(a.cinematicFigure?.integratedHeadPartCount||0),0),
   cinematicNativeMountAdjustments:authored.reduce((n,a)=>n+(a.cinematicFigure?.nativeMountAdjusted||0),0),
   cinematicNativeMountMaxShiftMeters:Math.max(0,...authored.map(a=>a.cinematicFigure?.nativeMountLargestShift||0)),
  cinematicIdentityPieces:authored.reduce((n,a)=>n+(a.cinematicFigure?.identityEquipmentPieces||0),0),
  cinematicIdentityActors:authored.filter(a=>(a.cinematicFigure?.identityEquipmentPieces||0)>=2).length,
  cinematicAnatomyBridges:authored.reduce((n,a)=>n+(a.cinematicFigure?.anatomyBridges||0),0),
  cinematicActiveAnatomyBridges:authored.reduce((n,a)=>n+(a.cinematicFigure?.activeAnatomyBridges?.()||0),0),
  cinematicSuppressedLongAnatomyBridges:authored.reduce((n,a)=>n+(a.cinematicFigure?.suppressedLongAnatomyBridges?.()||0),0),
  cinematicVertices:authored.reduce((n,a)=>n+(a.cinematicFigure?.vertices||0),0),
  cinematicMaterialsMapped:authored.reduce((n,a)=>n+(a.cinematicFigure?.mappedMaterials||0),0),
  cinematicBoneMounts:authored.reduce((n,a)=>n+(a.cinematicFigure?.joints||0),0),
  cinematicMaxHandOffsetMeters:Math.max(0,...authored.map(a=>a.cinematicFigure?.handGripOffsetMeters||0)),
  cinematicSourceHidden:authored.filter(a=>a.cinematicFigure?.sourceMeshesHidden).length,cinematicNativeBodyUnderlays:authored.reduce((n,a)=>n+(a.cinematicFigure?.nativeBodyUnderlays||0),0),cinematicNativeBodyActors:authored.filter(a=>(a.cinematicFigure?.nativeBodyUnderlays||0)>=5).length,cinematicProfiles:[...new Set(authored.map(a=>a.cinematicFigure?.kind).filter(Boolean))].sort(),groundedTravelActors:authored.filter(a=>a.groundedPerformance?.moving).length,
 groundedClipSpeeds:authored.filter(a=>a.groundedPerformance?.moving).map(a=>Number(a.groundedPerformance.clipSpeed.toFixed(3))).slice(0,12),
 groundedStationaryActors:authored.filter(a=>!a.groundedPerformance?.moving).length,
 evasionPosePeak:Math.max(0,...authored.map(a=>a.evasionPosePeak||0)),evasionPoseActors:authored.filter(a=>(a.evasionPosePeak||0)>.03).length,contactBodyPeakMeters:Math.max(0,...authored.map(a=>a.contactBodyPeakMeters||0)),authoredBosses:authored.filter(a=>a.u.kind==='warden').length,bossNativeRiggedParts:all.reduce((n,a)=>n+(a.wardenRegaliaRiggedParts||0),0),bossNativeRigMounts:all.reduce((n,a)=>n+(a.wardenRegaliaMounts?.length||0),0),bossRegaliaParts:all.reduce((n,a)=>n+(a.regaliaParts||0),0),bossRegaliaBatches:all.reduce((n,a)=>n+(a.wardenRegaliaInstances?.length||0),0),roleSilhouetteActors:authored.filter(a=>(a.roleSilhouetteParts||0)>0).length,roleSilhouetteParts:all.reduce((n,a)=>n+(a.roleSilhouetteParts||0),0),anatomicalDetailActors:authored.filter(a=>(a.anatomicalParts||0)>0).length,sculptedArmorActors:authored.filter(a=>a.sculptedArmorProfile).length,sculptedArmorVertices:authored.reduce((sum,a)=>sum+(a.sculptedArmorVertices||0),0),sculptedArmorProfiles:[...new Set(authored.map(a=>a.sculptedArmorProfile).filter(Boolean))].sort(),anatomicalDetailParts:all.reduce((n,a)=>n+(a.anatomicalParts||0),0),anatomicalJointFittings:all.reduce((n,a)=>n+(a.anatomicalJointParts||0),0),anatomicalDetailMeshes:all.reduce((n,a)=>n+(a.anatomicalDetailMeshes||0),0),anatomicalStaticMergedParts:all.reduce((n,a)=>n+(a.anatomicalStaticMergedParts||0),0),draperyActors:authored.filter(a=>(a.draperyPanels?.length||0)>0).length,draperyPanels:all.reduce((n,a)=>n+(a.draperyPanels?.length||0),0),draperyTriangles:all.reduce((n,a)=>n+(a.draperyTriangles||0),0),draperyFramesSkipped:all.reduce((n,a)=>n+(a.draperyFramesSkipped||0),0),draperyNormalRebuilds:all.reduce((n,a)=>n+(a.draperyNormalRebuilds||0),0),draperyVertexUploads:all.reduce((n,a)=>n+(a.draperyVertexUploads||0),0),draperyPeakDeformationMeters:Math.max(0,...all.map(a=>a.draperyPeakDeformationMeters||0)),rigCranialActors:authored.filter(a=>a.rigCranial?.applied).length,rigCranialRatios:authored.filter(a=>a.rigCranial?.applied).map(a=>({kind:a.u.kind,ratio:a.rigCranial.ratio})).slice(0,18),rigGestureBones:authored.reduce((n,a)=>n+(a.rigUpperArms?.length||0),0),rigGesturePeakRad:Math.max(0,...authored.map(a=>a.rigGesturePeak||0)),wardenChargeShoulderPeakRad:Math.max(0,...authored.filter(a=>a.u.kind==='warden').map(a=>a.wardenChargeShoulderPeak||0)),rigForearmBones:authored.reduce((n,a)=>n+(a.rigForearms?.length||0),0),rigForearmPeakRad:Math.max(0,...authored.map(a=>a.rigForearmPeak||0)),rigGaitBones:authored.reduce((n,a)=>n+(a.rigGaitBones?.length||0),0),rigGaitPeakRad:Math.max(0,...authored.map(a=>a.rigGaitPeak||0)),rigFullBodyStridePeakRad:Math.max(0,...authored.map(a=>a.rigFullBodyStridePeak||0)),rigContactBraceActors:authored.filter(a=>(a.rigContactBracePeak||0)>.09).length,rigContactBracePeakRad:Math.max(0,...authored.map(a=>a.rigContactBracePeak||0)),rigMeleeBones:authored.reduce((n,a)=>n+(a.rigMeleeBones?.length||0),0),rigMeleePeakRad:Math.max(0,...authored.map(a=>a.rigMeleePeak||0)),rigMeleeCurrentPeakRad:Math.max(0,...authored.map(a=>a.rigMeleeCurrentPeak||0)),rigMeleeActiveActors:authored.filter(a=>a.rigMeleeActive).length,rigRangedActiveActors:authored.filter(a=>a.rigRangedActive).length,rigRangedPeak:Math.max(0,...authored.map(a=>a.rigRangedPeak||0)),rigMeleeBoneNames:authored.flatMap(a=>(a.rigMeleeBones||[]).map(m=>m.part+':'+m.bone.name)).slice(0,12),rigBoundAccessoryActors:authored.filter(a=>(a.rigBoundAccessoryParts||0)>0).length,rigBoundAccessoryParts:all.reduce((n,a)=>n+(a.rigBoundAccessoryParts||0),0),rigWardrobeActors:authored.filter(a=>(a.rigWardrobeParts||0)>0).length,rigWardrobeParts:all.reduce((n,a)=>n+(a.rigWardrobeParts||0),0),anatomicalStaticMountedBatches:all.reduce((n,a)=>n+(a.anatomicalStaticMountedCount||0),0),
 hiddenFallbackOrnamentActors:authored.filter(a=>(a.detail?.hiddenProceduralOrnamentCount||0)>0).length,
 hiddenFallbackOrnamentMeshes:authored.reduce((n,a)=>n+(a.detail?.hiddenProceduralOrnamentCount||0),0),rigGripAlignedActors:authored.filter(a=>a.rigGripAligned).length,rigGripMaxShiftMeters:Math.max(0,...authored.map(a=>a.rigGripShiftMeters||0)),rigGripCandidates:authored.filter(a=>a.rigGripCandidateMeters!==null).map(a=>({kind:a.u.kind,meters:a.rigGripCandidateMeters})).slice(0,3),rigHandBoneNames:authored.filter(a=>a.rigHandBoneName).map(a=>a.rigHandBoneName).slice(0,8),skinnedHitActors:authored.filter(a=>(a.skinnedHitWeight||0)>.02).length,skinnedHitPeak:Math.max(0,...authored.map(a=>a.skinnedHitPeak||0)),skinnedDefeatActors:authored.filter(a=>a.skinnedDefeatWeight>.02).length,forgedMicrotextures:forgedMicrotextureCache.size,authoredCharacters:authored.length,proceduralFallbacks:all.length-authored.length,uniqueAssets:cache.size,missingAssets:failures.size,incompleteAssets:incompleteAssets.size,texturedCharacters:authored.filter(a=>a.textureReadiness?.decodedColorMaps>0).length,decodedColorMaps:authored.reduce((n,a)=>n+(a.textureReadiness?.decodedColorMaps||0),0)};
}
export {attachCharacter,updateActor,disposeActorAsset,putEnvironment,stats};
