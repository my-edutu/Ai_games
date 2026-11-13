import * as THREE from '/dungeon/vendor/three.module.js';
import {mergeGeometries} from '/dungeon/vendor/addons/utils/BufferGeometryUtils.js';
import {GLTFLoader} from '/dungeon/vendor/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from '/dungeon/vendor/addons/utils/SkeletonUtils.js';
import {planAuthoredMotion,planContactBodyLanguage} from '/dungeon/character-motion-plan.js';
import {planNativeWalkStartFromTravel,planNativeSourceIdleGaitFrame,planOriginalSourceSoleGrounding,composeOriginalSourceGroundedPivotY,selectOriginalOutsolePatchVertices,planOriginalSourceToeBindAxis,planOriginalSourceSwingToeClearance,auditOriginalSourceSwingAnkleSlew,selectOriginalSourceSwingAnkleTrial,confirmOriginalSourceSwingToeLift,confirmOriginalSourceSwingToeContinuation,planOriginalSourceSwingCalfAssist,selectOriginalSourceSwingCalfTrial,retireOriginalSourceCalfMemory,planOriginalSourceStanceAnkleRelief,chooseOriginalSourceStanceAppliedWitness,chooseOriginalSourceLoadedKneeWitness,chooseOriginalSourceSwingThighSupport,planOriginalSourceSwingThighHold,planOriginalSourceSwingThighEaseOut,verifyOriginalSourceOppositeStanceForSwingThigh,reconcileOriginalSourceSwingToeProofWithThigh,planOriginalSourceLoadedPelvisSupport,planOriginalSourceStanceSlideRelief,planOriginalSourceWalkingTorsoCounterturn,planOriginalSourceStanceSampleHandoff,planOriginalSourceStanceSlowFramePrime,planOriginalSourceStanceReliefCarry,verifyOriginalSourceLoadedPelvisFootWitness,verifyRestoredRootOriginalSourceSoleSafety,inferImportedSourceKneeBendAxis,assessImportedSourceKneeGeometry,measureImportedKneeSegmentsInAssetCoordinates,advanceOriginalSourceSwingTravelWitness,hasOriginalSourceSwingTravelWitness,advanceFullBodyController,auditImportedAnimationClips,planConstrainedFootSupport,planImportedOneShotPhase,planImportedOneShotEntry,planImportedDeathSourceStep,planImportedLivingSourceStep,planImportedWalkingMixerFrameDelta,planImportedWalkingBlendRate,planImportedWitnessedHurtMixerFrame,planImportedWalkingEntryPhase,planImportedWalkingContinuity,planImportedWalkArrivalFreeze,shouldFreezeDeferredImportedWalk,planImportedCombatWalkStop,shouldFreezeDeferredImportedCombatWalk,planImportedWalkExitBrake,planSourceRigLandingRelease,planNativeLandingVisibleDelta,planSourceRigLandingPelvisSupport,planSourceRigWalkReentryRelease,planNativeWalkToGuardGait,planNativeImportedLegOwnership,shouldRestartImportedOneShot,shouldRetainImportedSharedIdleClock,chooseImportedSourceClip} from '/dungeon/full-body-animation-controller.js';
import {measureSourceRigDeformation,isSourceSoleBoneName} from '/dungeon/native-rig-deformation-plan.js';
import {planRangedBodyPose,ownsImportedRangedUpperBody} from '/dungeon/ranged-encounter-plan.js';
import {planSkinnedDefeatPose,planSkinnedHitResponse,resolveImpactSide} from '/dungeon/impact-choreography-plan.js';
import {planEvasionPerformance} from '/dungeon/evasion-performance-plan.js';
import {planCombatPerformanceBeat} from '/dungeon/combat-performance-plan.js';
import {planNativeDuelPose,planNativeOneShotSpeed} from '/dungeon/native-duel-performance.js';
import {planWardenRegalia,planWardenRegaliaBone} from '/dungeon/warden-regalia-plan.js';
import {WARDEN_STAGE_PROFILE} from '/dungeon/warden-regalia-plan.js';
import {planWardenRegaliaMotion} from '/dungeon/warden-chapter-plan.js';
import {planRoleSilhouette} from '/dungeon/role-silhouette-plan.js';
import {planFittedRoleDetail} from '/dungeon/role-silhouette-plan.js';
import {planAnatomicalKit,planAnatomicalDrawGroups} from '/dungeon/anatomical-kit-plan.js';
import {createForgedArmorForms,planForgedArmor,planForgedFinishes,planAuthoredBodyShape} from '/dungeon/forged-armor.js';
import {planNativeFigureSculpt,sculptNativeFigureGeometry} from '/dungeon/native-figure-sculpt.js';
import {planDrapePanels,planDrapeSwing,planDrapeVertexBend,drapePoseKey,DRAPE_ROWS,DRAPE_COLUMNS} from '/dungeon/fabric-drape-plan.js';
import {rigWeaponParts,selectHandBone,rigGripAnchor,boundedGripOffset,selectUpperArmBone,planRigArmGesture,selectForearmBone,planRigForearmGesture,selectLegBone,advanceRigGait,alignRigFootfallPhase,planRigLegGesture,planRigFullBodyStride,planSourceOwnedFullBodyStride,planRigContactBrace,selectCranialBone,planCranialRatio,restoreCranialProportion,stageCranialProportion,selectCombatTorsoBone,planRigMeleeFollowThrough,selectPelvisBone,planRigBearing,planNativeGuardPose,restoreOriginalSourceLegsAfterRejectedPelvis,prepareOriginalSourceLegsForPelvisRetry} from '/dungeon/rig-attachment-plan.js';

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
function configure(mesh,kind,owned){
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
   owned.push(copy);
   return copy;
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
 // Chamfered forged plaques remove the toy-like box silhouette without
 // adding draws or textures. All forms are shared, disposable and remain
 // strictly cosmetic attachments to the real animated boss skeleton.
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
 const base={
  plate:new THREE.SphereGeometry(.5,20,13),
  spike:new THREE.ConeGeometry(.5,1,11),
  gem:new THREE.OctahedronGeometry(.5,1),
  lamella:plaque
 };
 const ownedGeometries=Object.values(base),animatedRegalia=[];
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
  if(item.shape!=='horn')animatedRegalia.push({id:item.id,mesh,x:mesh.position.x,y:mesh.position.y,
   rz:mesh.rotation.z,sx:mesh.scale.x,sy:mesh.scale.y,sz:mesh.scale.z});
 }
 actor.visualPivot.add(group);
 // Keep every original boss sculpture in its EXACT bind-pose coordinates.
 // Four real animated body areas now drive the crown, pauldron, chest and
 // tassets. Matrix bone deltas avoid Object3D.attach's non-uniform-scale
 // limitation on the fitted CC0 skinned GLB. Zero extra mesh draw calls.
 actor.visualPivot.updateWorldMatrix(true,true);
 actor.assetRoot?.updateWorldMatrix(true,true);
 const targets={
  head:actor.rigCranial?.bone,
  chest:actor.rigMeleeBones?.find(m=>m.part==='spine')?.bone,
  pelvis:actor.rigPelvisBone,
  leftUpperArm:actor.rigUpperArms?.find(m=>m.side==='left')?.bone,
  rightUpperArm:actor.rigUpperArms?.find(m=>m.side==='right')?.bone
 };
 const mounts=[];
 const bindGroupWorld=group.matrixWorld.clone();
 let riggedPieces=0;
 for(const [jointName,bone] of Object.entries(targets)){
  if(!bone?.isBone)continue; // Incomplete rigs retain original visible art.
  bone.updateWorldMatrix(true,false);
  if(!bone.matrixWorld.elements.every(Number.isFinite))continue;
  const assigned=plan.filter(p=>planWardenRegaliaBone(p.id)===jointName);
  if(!assigned.length)continue;
  const stage=new THREE.Group();stage.name='Native Warden '+jointName+' regalia';
  stage.matrixAutoUpdate=false;
  group.add(stage);
  for(const part of assigned){
   const mesh=group.getObjectByName(part.id);
   if(mesh?.isMesh){stage.add(mesh);riggedPieces++;}
  }
  mounts.push({bone,stage,bindBoneInverse:bone.matrixWorld.clone().invert(),
   bindGroupWorld:bindGroupWorld.clone(),targetWorld:new THREE.Matrix4()});
 }
 actor.wardenRegaliaRoot=group;
 actor.wardenRegaliaMounts=mounts;
 actor.wardenRegaliaInverse=new THREE.Matrix4();
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
 actor.walkLandingPose=null;actor.walkLandingCaptureNeeded=false;actor.walkLandingFrames=0;
 actor.rigGaitPhase=0;actor.rigGaitWeight=0;actor.rigGaitSettling=false;actor.rigNativeLegOverlayScale=1;actor.nativeWalkEntryPoseHeld=false;actor.rigGaitPeak=0;actor.rigContactBracePeak=0;
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
  Math.max(-.26,Math.min(.30,p.pitch+duel.pitch+(actor.rigGuardPose?.head?.pitch??0))),
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
 const releaseSupport=actor.rigRangedPose;
 m.next.setFromEuler(m.euler.set(
  Math.max(-.2,Math.min(.2,p.pitch+(g?.bodyPitch??0)*.32+stride.pitch+duel.pitch+(releaseSupport?.hips?.pitch??0)+(actor.rigGuardPose?.hips?.pitch??0))),
  Math.max(-.15,Math.min(.15,p.yaw+stride.yaw+duel.yaw+(releaseSupport?.hips?.yaw??0))),
  Math.max(-.16,Math.min(.16,p.roll+(g?.bodyRoll??0)*.65+stride.roll+duel.roll+(releaseSupport?.hips?.roll??0))),'YXZ'));
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
function stageRigMeleeAfterMixer(actor,since,reducedMotion,sourceFrameInterval=.016,sourceFrameVisible=true){
 actor.rigMeleeCurrentPeak=0;actor.rigMeleeActive=false;
 if(!actor.rigMeleeBones?.length)return;
 const pose=planRigMeleeFollowThrough(actor.u.kind,actor.fullBody?.owner.duel?'attack':'idle',since,
  actor.animationFacing?.distance,actor.animationFacing?.targetId,reducedMotion||actor.u.hp<=0);
 // Imported spine counterturn is intentionally NOT staged here: the public
 // root-facing yaw is finalized later in this same displayed animation frame.
 actor.walkingTorsoCounterturn=null;
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
  const threat=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion&&actor.fullBody?.owner.warning&&mount.part==='spine'?
   actor.wardenCharge?.threatPerformance:null;
  const strike=mount.part==='spine'&&!reducedMotion&&actor.fullBody?.owner.warning?actor.wardenStrikePose?.spine:null;
  mount.next.setFromEuler(mount.euler.set(
   Math.max(-.55,Math.min(.55,joint.pitch+extra.pitch+native.pitch+dodge.pitch+bearing.pitch+(actor.rigGuardPose?.chest?.pitch??0)+stride.pitch+(strike?.pitch??0))),
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
 if(actor.rigMeleeActive)actor.rigMeleeObservedActiveFrames=Math.min(1000000,
  (actor.rigMeleeObservedActiveFrames||0)+1);
}
// The public renderer interpolates and assigns the genuine root facing AFTER
// updateActor has evaluated the original AnimationMixer skeleton. Finish the
// imported spine -> shoulder -> original hand/weapon counterturn only AFTER
// that real visible yaw has been assigned. Otherwise the native skeleton
// compares the old yaw to itself, misses an observed ~0.637rad turn and pops.
// This is bounded post-mixer pose ownership, never steering/authority/IK.
function stageRigWalkingFacingAfterRootYaw(actor,reducedMotion,sourceFrameInterval=.016,sourceFrameVisible=true){
 if(!actor?.authored||!actor.mixer)return;
 const mount=actor.rigMeleeBones?.find(m=>m.part==='spine');
 if(!mount?.bone)return;
 // The true original Walking_A root can turn ~0.637rad in one mobile
 // displayed frame. Oppose only a bounded fraction in the real imported
 // chest during actual source-owned travel; original legs, actor root,
 // hand/weapon socket and source AnimationMixer are left untouched.
 const sourceId=actor.assetRoot?.uuid??null;
 const walkOwner=actor.fullBody?.mode==='move'&&
  actor.fullBody?.owner?.locomotion===true&&
  actor.activeImportedClipName==='Walking_A'&&
  actor.u.hp>0&&actor.root?.visible===true&&sourceFrameVisible===true&&
  !reducedMotion&&!actor.locomotionTeleport&&!actor.fullBody?.interrupted;
 // The first original Walking_A frame can already turn the REAL root
 // ~0.637rad while fading in from Idle (measured source weight ~0.7826).
 // Remember the previous visible original Idle yaw for this SAME cloned GLB
 // without posing idle, treating attack/guard as an anchor, or changing
 // the authoritative root. Once walking begins, use fresh walking frames.
 const safeIdleAnchor=actor.fullBody?.mode==='idle'&&
  actor.activeImportedClipName==='Idle'&&
  (actor.activeClip?.getEffectiveWeight?.()??0)>=.85&&
  actor.u.hp>0&&actor.root?.visible===true&&sourceFrameVisible===true&&
  !reducedMotion&&!actor.locomotionTeleport&&!actor.fullBody?.interrupted;
 const priorMode=actor.rigWalkingTurnPreviousMode;
 const priorSame=Boolean(walkOwner&&sourceId&&
  actor.rigWalkingTurnSourceId===sourceId&&
  (priorMode==='move'||priorMode==='idle')&&
  Number.isFinite(actor.rigWalkingTurnSourceYaw));
 // Save the real original-Walking_A yaw/interval proof, not inferred turns.
 // These read-only scalar receipts are exposed only through the existing
 // on-demand rig inspector and do not scan skins, allocate geometry or steer.
 actor.rigWalkingTurnObservedFrameInterval=sourceFrameInterval;
 actor.rigWalkingTurnObservedRootTravel=actor.rigLastGroundedTravel;
 actor.rigWalkingTurnObservedSourceSame=priorSame;
 actor.rigWalkingTurnObservedYawStepRad=priorSame?
  Math.atan2(Math.sin(actor.root.rotation.y-actor.rigWalkingTurnSourceYaw),
   Math.cos(actor.root.rotation.y-actor.rigWalkingTurnSourceYaw)):null;
 const walkingTorsoCounterturn=priorSame?
  planOriginalSourceWalkingTorsoCounterturn({
   mode:actor.fullBody.mode,previousMode:priorMode,
   sourceClipName:actor.activeImportedClipName,
   sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
   sourceInstanceSame:true,ownerLocomotion:true,
   alive:true,visible:true,teleport:false,reducedMotion:false,
   interrupted:false,rootTravel:actor.rigLastGroundedTravel,
   frameInterval:sourceFrameInterval,
   previousRootYaw:actor.rigWalkingTurnSourceYaw,
   currentRootYaw:actor.root.rotation.y,
   previousOffsetRad:actor.rigWalkingTurnOffsetRad??0
  }):null;
 actor.walkingTorsoCounterturn=walkingTorsoCounterturn;
 actor.rigWalkingTurnOffsetRad=walkingTorsoCounterturn?.offsetRad??0;
 if(walkOwner||safeIdleAnchor){
  actor.rigWalkingTurnSourceId=sourceId;
  actor.rigWalkingTurnSourceYaw=actor.root.rotation.y;
  actor.rigWalkingTurnPreviousMode=walkOwner?'move':'idle';
 }else{
  // An attack, guard, hit, teleport or hidden source may never lend a
  // stale yaw anchor to a later turn, even if the GLB clone is unchanged.
  actor.rigWalkingTurnSourceId=null;
  actor.rigWalkingTurnSourceYaw=null;
  actor.rigWalkingTurnPreviousMode=null;
 }
 if(walkingTorsoCounterturn){
  if(priorMode==='idle')
   actor.rigWalkingTurnFirstWalkFrames=Math.min(1000000,
    (actor.rigWalkingTurnFirstWalkFrames||0)+1);
  actor.rigWalkingTurnFrames=Math.min(1000000,(actor.rigWalkingTurnFrames||0)+1);
  actor.rigWalkingTurnPeakRad=Math.max(actor.rigWalkingTurnPeakRad||0,
   Math.abs(walkingTorsoCounterturn.offsetRad));
 }

 if(walkingTorsoCounterturn){
  // Keep the exact applied post-mixer quaternion reversible with the other
  // original source-bone overlays on the next real AnimationMixer frame.
  mount.next.setFromEuler(mount.euler.set(0,walkingTorsoCounterturn.offsetRad,0,'YXZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.multiply(mount.next);
 }
}

// Genuine ranged release follows the actual imported chest/shoulder/elbow
// joints and composes into the existing reversible mount quaternion.
function stageRigRangedAfterMixer(actor,since,reducedMotion){
 // Source-owning Ranger/Mystic/Cultist uses ONE cached original-clock pose.
 // A diagnostic >.1 threshold must NEVER gate actual ankle/hip/arm posing:
 // that produced a visible source-fade discontinuity at the threshold.
 const p=actor.rigRangedPose;
 actor.rigRangedActive=Boolean(actor.nativeReleaseOwnsUpperBody&&p?.weight>.1);
 if(!actor.nativeReleaseOwnsUpperBody||!p||p.weight<=0)return;
 actor.rigRangedPeak=Math.max(actor.rigRangedPeak||0,p.weight);
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
 const pose=planRigArmGesture(actor.u.kind,actor.nativeReleaseOwnsUpperBody?'idle':
  ['hurt','defeat','evade','guard'].includes(actor.fullBody?.mode)?'idle':actor.fullBody?.mode||actor.u.action||'idle',since,reducedMotion);
 // Real Warden warnings articulate the original imported shoulders in three
 // distinct attack silhouettes. All deltas are reversed before the next mixer frame.
 const warningLift=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion&&actor.fullBody?.owner.warning&&
  Number.isFinite(actor.wardenCharge?.armRaise)?
  Math.max(-.64,Math.min(0,actor.wardenCharge.armRaise)):0;
 const exposure=actor.u.kind==='warden'&&actor.u.hp>0&&actor.fullBody?.owner.warning?actor.wardenExposure:null;
 const stagger=exposure?.shoulderPitch??0;
 const threat=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion&&actor.fullBody?.owner.warning?
  actor.wardenCharge?.threatPerformance:null;
 actor.wardenChargeShoulderPeak=Math.max(actor.wardenChargeShoulderPeak||0,
  Math.abs(threat?.shoulders?.left?.pitch??warningLift),
  Math.abs(threat?.shoulders?.right?.pitch??warningLift));
 for(const mount of actor.rigUpperArms||[]){
  const nativeMelee=actor.nativeDuel?.mode&&actor.nativeDuel.mode!=='rest';
  const joint=nativeMelee?RIG_ZERO:pose[mount.side],
   guardPose=actor.rigGuardPose,
   extra=nativeMelee?RIG_ZERO:(actor.performanceBeat?.arms?.[mount.side]||RIG_ZERO);
  const native=actor.nativeDuel?.arms?.[mount.side]||RIG_ZERO;
  const stride=actor.rigFullBodyStride?.arms?.[mount.side];
  const physicalTell=threat?.shoulders?.[mount.side];
  const strike=actor.fullBody?.owner.warning?actor.wardenStrikePose?.shoulders?.[mount.side]:null;
  mount.next.setFromEuler(mount.euler.set(
   Math.max(-.62,Math.min(.62,joint.pitch+(guardPose?.shoulders?.[mount.side]?.pitch??0)+(physicalTell?.pitch??warningLift)+(strike?.pitch??0)+stagger+extra.pitch+native.pitch+(stride?.pitch??0)+(actor.evasionFrame?.arms?.[mount.side]?.pitch??0))),0,
   Math.max(-.38,Math.min(.38,joint.roll+(guardPose?.shoulders?.[mount.side]?.roll??0)+(physicalTell?.roll??0)+(strike?.roll??0)+extra.roll+native.roll+(stride?.roll??0)+(mount.side==='left'?-1:1)*(exposure?.shoulderRoll??0)+(actor.evasionFrame?.arms?.[mount.side]?.roll??0))),'XYZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.copy(mount.next);
  actor.rigGesturePeak=Math.max(actor.rigGesturePeak||0,Math.abs(joint.pitch),Math.abs(joint.roll));
 }
}

function stageRigForearmsAfterMixer(actor,since,reducedMotion){
 if(!actor.rigForearms?.length)return;
 const pose=planRigForearmGesture(actor.u.kind,actor.nativeReleaseOwnsUpperBody?'idle':
  ['hurt','defeat','evade','guard'].includes(actor.fullBody?.mode)?'idle':actor.fullBody?.mode||actor.u.action||'idle',since,
  reducedMotion||actor.u.hp<=0);
 for(const mount of actor.rigForearms){
  // One anatomical elbow has a single mechanical envelope. Two truthful
  // visual cues (authored clip and contact beat) must not accidentally stack
  // into a rubber-jointed arm or fool the browser diagnostic with a raw sum.
  const threat=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion&&actor.fullBody?.owner.warning?
   (actor.wardenCharge?.threatPerformance?.forearms?.[mount.side]??0):0;
  const nativeMelee=actor.nativeDuel?.mode&&actor.nativeDuel.mode!=='rest';
  const angle=Math.max(-.445,Math.min(.445,
   (nativeMelee?0:pose[mount.side])+(actor.rigGuardPose?.elbows?.[mount.side]??0)+threat+(actor.fullBody?.owner.warning?(actor.wardenStrikePose?.forearms?.[mount.side]??0):0)+
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
function stageRigGroundedStride(actor,reducedMotion,dt,sourceFrameInterval=dt,sourceFrameVisible=true){
 // Every footstep stamp, cloth bob and real skinned leg now shares the single
 // distance-derived cadence reported by groundedPerformance. A legal move
 // settling to idle fades the last planted stance rather than snapping it off.
 // Interrupted, dead, teleported and reduced-motion actors clear immediately.
 if(!actor.rigGaitBones?.length){actor.rigLegStride=null;actor.rigFullBodyStride=null;actor.rigGaitSettling=false;actor.rigNativeLegOverlayScale=1;return;}
 const current=actor.root?.position,previous=actor.rigGaitPosition;
 const travel=current&&previous?Math.hypot(current.x-previous.x,current.z-previous.z):0;
 actor.rigLastGroundedTravel=travel;
 const recentSwingTravel=advanceOriginalSourceSwingTravelWitness({
  previousTravel:actor.rigRecentGroundedTravel??0,
  previousAge:actor.rigRecentGroundedAge??0,
  travel,frameInterval:sourceFrameInterval,
  mode:actor.fullBody?.mode,
  walkingClip:/^walking[_\s-]*a$/i.test(actor.activeImportedClipName||''),
  alive:actor.u.hp>0,visible:actor.root?.visible===true,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody?.interrupted)
 });
 actor.rigRecentGroundedTravel=recentSwingTravel.travel;
 actor.rigRecentGroundedAge=recentSwingTravel.age;
 if(current&&previous)previous.copy(current);
 const mode=actor.fullBody?.mode||'idle';
 const walking=actor.fullBody?.owner.locomotion===true;
 // The licensed walk source has already stopped stepping at the original
 // guarded arrival. Its corresponding additive thigh/ankle pose must settle
 // across the same transition; otherwise the source foot holds position but
 // the overlay jumps immediately to zero as guardBlend is still entering.
 const plantedGuard=planNativeWalkToGuardGait({
  mode,sourceWalkFrozen:Boolean(actor.rigGuardPlantHandoff),
  groundedMoving:Boolean(actor.groundedPerformance?.moving),
  groundedTravel:travel,frameInterval:sourceFrameInterval,
  gaitWeight:actor.rigGaitWeight,
  guardBlend:actor.fullBody?.guardBlend,alive:actor.u.hp>0,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion
 });
 // The genuine original Idle stayed on a micro-travel walking entry, but
 // the independent gait previously acquired .58 weight on just a 5mm step.
 // Keep the entire native hip/leg/chest sine quiet until Walking_A truly
 // takes the source owner. Retire residual original-Idle gait over real
 // bounded visible time during a lawful stopped/guarded arrival.
 const sourceIdleHandoff=planNativeSourceIdleGaitFrame({
  mode,sourceAction:actor.currentAction,
  sourceClipName:actor.activeImportedClipName??'',
  pendingMeters:actor.nativeWalkEntryPendingMeters??0,
  groundedMoving:Boolean(actor.groundedPerformance?.moving),
  alive:actor.u.hp>0,visible:sourceFrameVisible,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody?.interrupted),
  frameDelta:dt,frameInterval:sourceFrameInterval
 });
 actor.nativeWalkEntryPoseHeld=sourceIdleHandoff.suppress;
 const hardStop=reducedMotion||actor.u.hp<=0||actor.locomotionTeleport||
  ['attack','cast','hurt','evade','defeat'].includes(mode)||
  (mode==='guard'&&!plantedGuard)||!sourceFrameVisible||sourceIdleHandoff.suppress;
 const gait=advanceRigGait(actor.rigGaitPhase,actor.rigGaitWeight,
  walking&&!hardStop?Math.min(travel,.30):0,hardStop,sourceIdleHandoff.releaseDelta);
 const phase=alignRigFootfallPhase(gait.phase,actor.groundedPerformance?.footPhase,walking,Boolean(hardStop));
 actor.rigGaitPhase=phase;actor.rigGaitWeight=gait.weight;
 actor.rigGaitSettling=!walking&&!hardStop&&gait.weight>.001;
 // Original source 41-joint Walking_A already animates both stance and swing
 // feet. Relinquish duplicated sine-driven thigh/calf/ankle motion over its
 // genuine crossfade and preserve share during idle/guard settling.
 actor.rigNativeLegOverlayScale=planNativeImportedLegOwnership({
  previous:actor.rigNativeLegOverlayScale??1,mode,
  sourceClipName:actor.activeImportedClipName??'',
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
  groundedMoving:Boolean(walking&&actor.groundedPerformance?.moving),
  settling:Boolean(actor.rigGaitSettling),
  // Original 180ms mixer ownership must release in the REAL visible frame
  // interval on a throttled WebGL desktop/mobile, not a 50ms simulation cap.
  // The effective source clip weight remains the independent truth gate.
  frameDelta:Number.isFinite(sourceFrameInterval)&&sourceFrameInterval>0?
   Math.min(.35,sourceFrameInterval):dt,
  alive:actor.u.hp>0,teleport:Boolean(actor.locomotionTeleport),reducedMotion
 });
 actor.rigLegStride=planRigLegGesture(phase,gait.weight,hardStop);
 actor.rigFullBodyStride=planSourceOwnedFullBodyStride(actor.u.kind,phase,gait.weight,
  actor.rigNativeLegOverlayScale,hardStop);
 actor.rigFullBodyStridePeak=Math.max(actor.rigFullBodyStridePeak||0,
  Math.abs(actor.rigFullBodyStride.hips.yaw),Math.abs(actor.rigFullBodyStride.chest.yaw));
}
// Original source 41-joint swing clearance is sampled on bona fide authored
// skinned foot vertices, not a guessed ground raycast or inverse-knee target.
// Scratch objects are held per module or per native mount; no geometry/meshes.
const originalSwingToePoint=new THREE.Vector3();
const originalSwingPitchAxis=new THREE.Vector3(1,0,0);
function readOriginalSwingSoleY(candidate){
 const mesh=candidate?.mesh,index=candidate?.index;
 const position=mesh?.geometry?.getAttribute?.('position');
 if(!mesh?.isSkinnedMesh||typeof mesh.applyBoneTransform!=='function'||!position||
  !Number.isSafeInteger(index)||index<0||index>=position.count)return NaN;
 originalSwingToePoint.fromBufferAttribute(position,index);
 mesh.applyBoneTransform(index,originalSwingToePoint);
 originalSwingToePoint.applyMatrix4(mesh.matrixWorld);
 return originalSwingToePoint.y;
}


/**
 * Original weighted Walking_A skinned shoe load, not a new foot-lock or IK.
 * Run after this frame's visual body/root composition and before original
 * ankle/calf safety probes. The source mixer remains the exclusive base-pose
 * owner. Recheck after all six original leg mounts have been drawn.
 */
function stageSourceLoadedPelvisBeforeLegs(actor,reducedMotion){
 actor.sourceLoadedPelvisFrameProof=null;
 actor.sourceLoadedPelvisRollbackFootProof=null;
 actor.sourceLoadedPelvisCandidate=null;
 // Physically reversible root/leg trials demand the complete unmodified
 // source SkeletonUtils two-sided thigh/calf/ankle chain. Missing Session 02
 // joints fail closed BEFORE any apparent floor lift is staged.
 const bones=actor.rigGaitBones;
 const fullSourceLegs=Array.isArray(bones)&&bones.length===6&&
  ['left','right'].every(side=>['upper','lower','foot'].every(part=>
   bones.some(m=>m.side===side&&m.part===part&&m.bone?.isBone)));
 const previous=actor.sourceLoadedPelvisLiftMeters||0;
 actor.sourceLoadedPelvisLiftMeters=0;
 if(!fullSourceLegs||actor.fullBody?.mode!=='move'||actor.activeImportedClipName!=='Walking_A'||
  actor.fullBody?.owner?.locomotion!==true||
  actor.u.hp<=0||actor.root?.visible!==true||reducedMotion||
  actor.locomotionTeleport||actor.fullBody?.interrupted||
  !(actor.rigRecentGroundedTravel>.003&&actor.rigRecentGroundedAge<=.18))
  return;
 const patches=sourceSolePatchVertexCandidates(actor);
 if(!patches?.left?.anatomicalHeelToeVerified||
  !patches?.right?.anatomicalHeelToeVerified||
  !patches.left.sourceToeAxis?.selectedAnatomicalPatch||
  !patches.right.sourceToeAxis?.selectedAnatomicalPatch)return;
 const read=side=>({
  heelY:readOriginalSwingSoleY(patches[side].heel),
  toeY:readOriginalSwingSoleY(patches[side].toe)
 });
 const left=read('left'),right=read('right');
 const candidate=planOriginalSourceLoadedPelvisSupport({
  mode:actor.fullBody.mode,sourceClipName:actor.activeImportedClipName,
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
  ownerLocomotion:actor.fullBody.owner.locomotion===true,
  rootTravel:actor.rigRecentGroundedTravel,
  frameAge:actor.rigRecentGroundedAge,
  alive:actor.u.hp>0,visible:actor.root.visible,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody.interrupted),
  floorTopY:-.02,floorEvidence:'authored-cube-floor-top',
  left,right,previousLiftMeters:previous
 });
 if(!candidate||!actor.visualPivot)return;
 const baseY=actor.visualPivot.position.y;
 actor.visualPivot.position.y=baseY+candidate.liftMeters;
 actor.visualPivot.updateWorldMatrix(true,true);
 const lifted=read(candidate.side),before=candidate.side==='left'?left:right;
 const otherSide=candidate.side==='left'?'right':'left';
 const otherBefore=otherSide==='left'?left:right,otherAfter=read(otherSide);
 // Validate BOTH actual original skinned shoe endpoints after the visual
 // pivot moves; reducing maximum error cannot conceal a newly buried heel.
 const physical=verifyOriginalSourceLoadedPelvisFootWitness({
  before,after:lifted,otherBefore,otherAfter,floorTopY:-.02
 });
 if(!physical){
  actor.visualPivot.position.y=baseY;
  actor.visualPivot.updateWorldMatrix(true,true);
  return;
 }
 actor.sourceLoadedPelvisLiftMeters=candidate.liftMeters;
 actor.sourceLoadedPelvisCandidate={
  ...candidate,baseY,foot:patches[candidate.side],other:patches[otherSide],
  before,otherBefore,beforeWorstMeters:physical.beforeWorstMeters,
  sourceCountsBeforeLegs:{
   toe:actor.sourceSwingToeCorrectionFrames||0,
   calf:actor.sourceSwingCalfAssistFrames||0,
   stance:actor.sourceStanceReliefFrames||0,
   knee:actor.sourceStanceKneeSupportFrames||0
  }
 };
}
function auditSourceLoadedPelvisAfterLegs(actor,since,reducedMotion){
 const candidate=actor.sourceLoadedPelvisCandidate;
 actor.sourceLoadedPelvisCandidate=null;
 if(!candidate)return;
 const finalHeelY=readOriginalSwingSoleY(candidate.foot.heel);
 const finalToeY=readOriginalSwingSoleY(candidate.foot.toe);
 const otherFinalHeelY=readOriginalSwingSoleY(candidate.other.heel);
 const otherFinalToeY=readOriginalSwingSoleY(candidate.other.toe);
 // Source ankle and knee overlays may change heel/toe independently after
 // the initial pelvis trial. Never let a newly deeper heel be hidden by
 // a better toe measurement when accepting the final rendered source pose.
 const finalPhysical=verifyOriginalSourceLoadedPelvisFootWitness({
  before:candidate.before,after:{heelY:finalHeelY,toeY:finalToeY},
  otherBefore:candidate.otherBefore,
  otherAfter:{heelY:otherFinalHeelY,toeY:otherFinalToeY},
  floorTopY:-.02
 });
 const accepted=Boolean(finalPhysical);
 if(!accepted){
  // A late source joint correction can invalidate the initial shoe lift.
  // Restore the exact prior visual body pose, and invalidate old world-space
  // receipts rather than report a final skin measurement that was never seen.
  actor.visualPivot.position.y=candidate.baseY;
  actor.visualPivot.updateWorldMatrix(true,true);
  const originalLegsRestored=restoreOriginalSourceLegsAfterRejectedPelvis(actor.rigGaitBones);
  actor.assetRoot?.updateMatrixWorld(true);
  actor.sourceLoadedPelvisRollbackFrames=Math.min(1000000,
   (actor.sourceLoadedPelvisRollbackFrames||0)+1);
  actor.sourceLoadedPelvisRollbackFootProof={
   source:'same-original-GLB-post-leg-pelvis-rollback',
   sourceInstanceId:actor.assetRoot?.uuid??null,
   sourceClip:actor.activeImportedClipName,side:candidate.side,
   rejectedHeelY:finalHeelY,rejectedToeY:finalToeY,
   restoredHeelY:readOriginalSwingSoleY(candidate.foot.heel),
   restoredToeY:readOriginalSwingSoleY(candidate.foot.toe),
   originalLegsRestored
  };
  if(originalLegsRestored){
   actor.sourceSwingToeCorrectionFrames=candidate.sourceCountsBeforeLegs.toe;
   actor.sourceSwingCalfAssistFrames=candidate.sourceCountsBeforeLegs.calf;
   actor.sourceStanceReliefFrames=candidate.sourceCountsBeforeLegs.stance;
   actor.sourceStanceKneeSupportFrames=candidate.sourceCountsBeforeLegs.knee;
  }
  actor.sourceLoadedPelvisLiftMeters=0;
  actor.sourceSwingToeCorrectionsThisFrame=0;
  actor.sourceSwingCalfCurrentFrameMask=0;
  actor.sourceSwingToeLiftProof=null;
  actor.sourceSwingCalfAssistProof=null;
  if(actor.sourceSwingCalfTrialOutcome?.accepted)
   actor.sourceSwingCalfTrialOutcome={...actor.sourceSwingCalfTrialOutcome,
    accepted:false,reason:'source-pelvis-rejected-post-leg-rollback'};
  actor.sourceSwingToeCurrentFrameProofs={left:null,right:null};
   actor.sourceSwingThighCurrentFrameProofs={left:null,right:null};
  actor.sourceStanceSoleCurrentFrameProofs={left:null,right:null};
   actor.sourceStanceKneeCurrentFrameProofs={left:null,right:null};
   for(const probe of Object.values(actor.sourceStanceKneeProbeOutcomes??{}))
    if(probe?.accepted)probe.accepted=false;
  // Mark any original ankle proof undone by the rejected visual pivot.
  for(const probe of Object.values(actor.sourceStanceProbeOutcomes??{}))
   if(probe?.status==='accepted')probe.status='rolled-back-with-pelvis';
  // A rejected elevated pelvis must not discard an otherwise legal and
  // physically witnessed original ankle adjustment. After the atomic six-joint
  // rollback, the imported source Mixer joints can be safely restaged ONCE at
  // the original, final visual root. No fabricated foot lock or extra step.
  const retryEligible=originalLegsRestored&&!reducedMotion&&
   actor.fullBody?.mode==='move'&&actor.fullBody?.owner?.locomotion===true&&
   !actor.fullBody?.interrupted&&!actor.locomotionTeleport&&
   actor.activeImportedClipName==='Walking_A'&&actor.u.hp>0&&
   actor.root?.visible===true&&Number.isFinite(since)&&since>=0;
  const retryPrepared=retryEligible&&
   prepareOriginalSourceLegsForPelvisRetry(actor.rigGaitBones);
  if(retryPrepared){
   // The pelvis candidate was consumed. The restored original Mixer-root
   // shoes must be sampled BEFORE the single source-joint retry. Include
   // the OPPOSITE source-skinned heel/toe, not only the candidate shoe.
   actor.assetRoot?.updateMatrixWorld(true);
   const retryPatches=sourceSolePatchVertexCandidates(actor);
   const readRetrySoles=()=>Object.fromEntries(['left','right'].map(side=>[
    side,{heelY:readOriginalSwingSoleY(retryPatches?.[side]?.heel),
     toeY:readOriginalSwingSoleY(retryPatches?.[side]?.toe)}
   ]));
   const retryBeforeSoles=readRetrySoles();
   stageRigLegsAfterMixer(actor,since,reducedMotion);
   actor.assetRoot?.updateMatrixWorld(true);
   const retryAfterSoles=readRetrySoles();
   const retryWholeSoleProof=verifyRestoredRootOriginalSourceSoleSafety({
    source:'same-original-GLB-restored-root',floorTopY:-.02,
    before:retryBeforeSoles,after:retryAfterSoles
   });
   const stanceProofs=Object.values(actor.sourceStanceSoleCurrentFrameProofs??{})
    .filter(Boolean);
   let sourceSolesSafe=Boolean(retryWholeSoleProof);
   for(const proof of stanceProofs){
    const foot=sourceSolePatchVertexCandidates(actor)?.[proof.side];
    const finalHeel=readOriginalSwingSoleY(foot?.heel);
    const finalToe=readOriginalSwingSoleY(foot?.toe);
    // The actual final restored-root skin must match its claimed original
    // GLB heel/toe. Discard a receipt changed by later connected bones.
    if(proof.sourceInstanceId!==actor.assetRoot?.uuid||
     !Number.isFinite(finalHeel)||!Number.isFinite(finalToe)||
     Math.abs(finalHeel-proof.afterHeelY)>.003||
     Math.abs(finalToe-proof.afterToeY)>.003||
     finalHeel<proof.beforeHeelY-.004||
     finalToe<proof.beforeToeY-.004){
     sourceSolesSafe=false;break;
    }
   }
   const retryFinalHeelY=readOriginalSwingSoleY(candidate.foot.heel);
   const retryFinalToeY=readOriginalSwingSoleY(candidate.foot.toe);
   if(!Number.isFinite(retryFinalHeelY)||!Number.isFinite(retryFinalToeY))
    sourceSolesSafe=false;
   if(!sourceSolesSafe){
    // If even this second measured pose is invalid, preserve the ORIGINAL
    // Mixer plus action-owned base; remove speculative retry proofs as well.
    restoreOriginalSourceLegsAfterRejectedPelvis(actor.rigGaitBones);
    actor.sourceSwingToeCorrectionFrames=candidate.sourceCountsBeforeLegs.toe;
    actor.sourceSwingCalfAssistFrames=candidate.sourceCountsBeforeLegs.calf;
    actor.sourceStanceReliefFrames=candidate.sourceCountsBeforeLegs.stance;
   actor.sourceStanceKneeSupportFrames=candidate.sourceCountsBeforeLegs.knee;
    actor.sourceSwingToeCorrectionsThisFrame=0;
    actor.sourceSwingCalfCurrentFrameMask=0;
    actor.sourceSwingToeLiftProof=null;
    actor.sourceSwingCalfAssistProof=null;
    if(actor.sourceSwingCalfTrialOutcome?.accepted)
     actor.sourceSwingCalfTrialOutcome={...actor.sourceSwingCalfTrialOutcome,
      accepted:false,reason:'restored-root-final-source-skin-rejected'};
    actor.sourceSwingToeCurrentFrameProofs={left:null,right:null};
   actor.sourceSwingThighCurrentFrameProofs={left:null,right:null};
    actor.sourceStanceSoleCurrentFrameProofs={left:null,right:null};
   actor.sourceStanceKneeCurrentFrameProofs={left:null,right:null};
   for(const probe of Object.values(actor.sourceStanceKneeProbeOutcomes??{}))
    if(probe?.accepted)probe.accepted=false;
    for(const probe of Object.values(actor.sourceStanceProbeOutcomes??{}))
     if(probe?.status==='accepted')probe.status='retry-final-skin-rejected';
   }
   actor.sourceLoadedPelvisRollbackFootProof.retryAttempted=true;
   actor.sourceLoadedPelvisRollbackFootProof.retryWholeSoleSafety={
    source:'same-original-GLB-restored-root',
    verified:Boolean(retryWholeSoleProof),contactLocked:false,
    before:retryBeforeSoles,after:retryAfterSoles
   };
   actor.sourceLoadedPelvisRollbackFootProof.retrySourceSolesSafe=sourceSolesSafe;
   actor.sourceLoadedPelvisRollbackFootProof.retryVerifiedStanceFeet=
    sourceSolesSafe?stanceProofs.length:0;
   actor.sourceLoadedPelvisRollbackFootProof.retryFinalHeelY=
    readOriginalSwingSoleY(candidate.foot.heel);
   actor.sourceLoadedPelvisRollbackFootProof.retryFinalToeY=
    readOriginalSwingSoleY(candidate.foot.toe);
  }else{
   actor.sourceLoadedPelvisRollbackFootProof.retryAttempted=false;
   actor.sourceLoadedPelvisRollbackFootProof.retryVerifiedStanceFeet=0;
  }
  return;
 }
 actor.sourceLoadedPelvisFrameProof={
  source:'original-weighted-heel-toe-and-rendered-pelvis',
  sourceInstanceId:actor.assetRoot?.uuid??null,
  sourceClip:actor.activeImportedClipName,side:candidate.side,
  floorTopY:-.02,appliedLiftMeters:candidate.liftMeters,
  beforeHeelY:candidate.before.heelY,
  beforeToeY:candidate.before.toeY,
  finalHeelY,finalToeY,
  beforeWorstMeters:candidate.beforeWorstMeters,
  afterWorstMeters:finalPhysical.afterWorstMeters,
  originalSourceContactLocked:false
 };
 actor.sourceLoadedPelvisAcceptedFrames=Math.min(1000000,
  (actor.sourceLoadedPelvisAcceptedFrames||0)+1);
}

/** Read the real SkeletonUtils-cloned source GLB rest segments ONCE.
 * Same-skin inverse-bind matrices, no new rig, pose or authority edit. */
function readOriginalSourceKneeBindLengths(actor,upperBone,lowerBone,footBone){
 let result=null;
 actor.assetRoot?.traverse(mesh=>{
  if(result||!mesh.isSkinnedMesh||!mesh.skeleton)return;
  const skeleton=mesh.skeleton,bones=skeleton.bones,inverses=skeleton.boneInverses;
  const indices=[upperBone,lowerBone,footBone].map(b=>bones.indexOf(b));
  if(indices.some(i=>i<0)||!Array.isArray(inverses))return;
  const points=[];
  for(const i of indices){
   const inverse=inverses[i];
   if(!inverse?.isMatrix4||!inverse.elements.every(Number.isFinite)||
    Math.abs(inverse.determinant())<1e-10)return;
   const point=new THREE.Vector3().setFromMatrixPosition(inverse.clone().invert());
   if(![point.x,point.y,point.z].every(Number.isFinite))return;
   points.push(point);
  }
  result={upperLength:points[0].distanceTo(points[1]),
   lowerLength:points[1].distanceTo(points[2]),
   sourceMesh:mesh.name||'original-skinned-mesh'};
 });
 return result;
}

/** Original direct thigh->calf->foot assistance is allowed ONLY after the
 * original ankle's same-skinned-toe lift; each test pose is restored. */
function planOriginalSourceSwingCalfForMountedFoot(actor,mount,originalFoot,
 finalFootAngle,ankleToeY,ankleHeelY,ankleLift,patch){
 const lower=actor.rigGaitBones?.find(m=>m.side===mount.side&&m.part==='lower');
 const upper=actor.rigGaitBones?.find(m=>m.side===mount.side&&m.part==='upper');
 // A lawful same-skin ankle lift is a narrow opportunity to inspect the
 // SOURCE leg chain; a failed chain may not silently masquerade as a calf
 // correction. This bounded receipt is for independent original-rig review.
 const directChain=Boolean(lower?.bone?.isBone&&upper?.bone?.isBone&&
  lower.bone.parent===upper.bone&&mount.bone.parent===lower.bone);
 actor.sourceSwingCalfTrialOutcome={
  source:'genuine-original-source-calf-heel-safe-probe',
  side:mount.side,upperBone:upper?.bone?.name??null,
  lowerBone:lower?.bone?.name??null,footBone:mount.bone?.name??null,
  lowerParent:lower?.bone?.parent?.name??null,
  footParent:mount.bone?.parent?.name??null,
  directChain,attempted:false,accepted:false,
  reason:directChain?'no-validated-original-sole-patch':'non-direct-original-leg-chain'
 };
 if(!directChain||!lower.last?.isQuaternion||
  !patch?.anatomicalHeelToeVerified)return null;
 // One-time per native clone: the current original Walking_A clip itself
 // defines which knee hinge orientation is permissible. An absent/unstable
 // licensed quaternion track must leave source joints untouched.
 if(!Object.hasOwn(lower,'sourceKneeAxisAudit')){
  const sourceWalk=actor.availableClips?.find(clip=>clip?.name==='Walking_A');
  lower.sourceKneeAxisAudit=inferImportedSourceKneeBendAxis(
   sourceWalk,lower.bone.name);
 }
 const audit=lower.sourceKneeAxisAudit;
 actor.sourceSwingCalfTrialOutcome={
  ...actor.sourceSwingCalfTrialOutcome,
  sourceKneeAxisAudit:audit??null,
  reason:audit?'source-knee-axis-awaiting-leg-plane':'no-original-knee-hinge-track'
 };
 if(!audit)return null;
 // A real source hinge must agree with the CURRENT original three-joint leg
 // bend plane; a straight/degenerate chain or twist-axis mismatch rejects.
 const sourceKneeAxis=lower.sourceKneeAxis??(
  lower.sourceKneeAxis=new THREE.Vector3(...audit.axis));
 const upperPoint=upper.sourceKneeWorldPoint??(
  upper.sourceKneeWorldPoint=new THREE.Vector3());
 const kneePoint=lower.sourceKneeWorldPoint??(
  lower.sourceKneeWorldPoint=new THREE.Vector3());
 const footPoint=mount.sourceKneeWorldPoint??(
  mount.sourceKneeWorldPoint=new THREE.Vector3());
 const thigh=lower.sourceThighDirection??(
  lower.sourceThighDirection=new THREE.Vector3());
 const calf=lower.sourceCalfDirection??(
  lower.sourceCalfDirection=new THREE.Vector3());
 const plane=lower.sourceKneePlane??(
  lower.sourceKneePlane=new THREE.Vector3());
 const worldAxis=lower.sourceKneeWorldAxis??(
  lower.sourceKneeWorldAxis=new THREE.Vector3());
 const worldQuat=lower.sourceKneeWorldQuat??(
  lower.sourceKneeWorldQuat=new THREE.Quaternion());
 upper.bone.getWorldPosition(upperPoint);
 lower.bone.getWorldPosition(kneePoint);
 mount.bone.getWorldPosition(footPoint);
 thigh.subVectors(kneePoint,upperPoint);
 calf.subVectors(footPoint,kneePoint);
 const upperLength=thigh.length(),lowerLength=calf.length();
 plane.crossVectors(thigh,calf);
 const bendSine=plane.length()/Math.max(.000001,upperLength*lowerLength);
 lower.bone.getWorldQuaternion(worldQuat);
 worldAxis.copy(sourceKneeAxis).applyQuaternion(worldQuat).normalize();
 // A near-right-angle ORIGINAL knee has the clearest plane normal; the
 // old <.99 gate invented zero hinge alignment on a valid source pose.
 const hingeAlignment=bendSine>.085&&bendSine<=1.000001?
  Math.abs(plane.normalize().dot(worldAxis)):0;
 // Original lowerleg-to-foot is only ~112mm in pinned source GLB.
 // Require same cloned skin's inverse binds and the actual joint world ratio.
 if(!Object.hasOwn(lower,'sourceKneeBindAudit'))
  lower.sourceKneeBindAudit=readOriginalSourceKneeBindLengths(
   actor,upper.bone,lower.bone,mount.bone);
 const sourceBind=lower.sourceKneeBindAudit;
 const sourceBindUpperLength=sourceBind?.upperLength??null;
 const sourceBindLowerLength=sourceBind?.lowerLength??null;
 // World joint-centre lengths change under the original asset's separate
 // width/depth/height fit even when the original skin remains anatomically
 // intact. Undo ONLY that fitted source root before comparing with GLB
 // inverse binds. Keep the real world knee plane and source hinge alignment.
 let sourceLengths=null;
 const assetWorld=actor.assetRoot?.matrixWorld;
 if(assetWorld?.isMatrix4&&assetWorld.elements.every(Number.isFinite)&&
  Math.abs(assetWorld.determinant())>1e-10){
  const inverse=lower.sourceKneeInverseAssetWorld??(
   lower.sourceKneeInverseAssetWorld=new THREE.Matrix4());
  inverse.copy(assetWorld).invert();
  const upperTriplet=lower.sourceKneeUpperTriplet??(
   lower.sourceKneeUpperTriplet=[0,0,0]);
  const kneeTriplet=lower.sourceKneeKneeTriplet??(
   lower.sourceKneeKneeTriplet=[0,0,0]);
  const footTriplet=lower.sourceKneeFootTriplet??(
   lower.sourceKneeFootTriplet=[0,0,0]);
  sourceLengths=measureImportedKneeSegmentsInAssetCoordinates({
   upperWorld:upperPoint.toArray(upperTriplet),
   kneeWorld:kneePoint.toArray(kneeTriplet),
   footWorld:footPoint.toArray(footTriplet),
   inverseAssetWorld:inverse.elements
  });
 }
 const sourceUpperLength=sourceLengths?.upperLength??null;
 const sourceLowerLength=sourceLengths?.lowerLength??null;
 const sourceKneeGeometry=sourceBind&&sourceLengths?
  assessImportedSourceKneeGeometry({
   upperLength:sourceUpperLength,lowerLength:sourceLowerLength,
   bendSine,hingeAlignment,sourceBindUpperLength,sourceBindLowerLength
  }):{accepted:false,reason:sourceBind?
   'invalid-original-asset-reference-space':'missing-original-skin-inverse-bind'};
 actor.sourceSwingCalfTrialOutcome={
  ...actor.sourceSwingCalfTrialOutcome,
  upperLength,lowerLength,sourceUpperLength,sourceLowerLength,
  bendSine,hingeAlignment,
  sourceBindUpperLength,sourceBindLowerLength,
  sourceBindMesh:sourceBind?.sourceMesh??null,
  reason:sourceKneeGeometry.reason
 };
 if(!sourceKneeGeometry.accepted)return null;
 const prior=lower.swingCalfAssistRad||0;
 lower.swingCalfAssistRad=0;
 const orig=lower.probeOriginal??(lower.probeOriginal=new THREE.Quaternion());
 const trial=lower.probeDelta??(lower.probeDelta=new THREE.Quaternion());
 const foot=mount.probeFinalFoot??(mount.probeFinalFoot=new THREE.Quaternion());
 orig.copy(lower.bone.quaternion);
 foot.copy(originalFoot).multiply(
  mount.next.setFromEuler(mount.euler.set(finalFootAngle,0,0,'XYZ')));
 const trials=[];
 try{
  mount.bone.quaternion.copy(foot);
  // Four ORIGINAL lowerleg source-joint samples, not synthetic target IK.
  // The subsequent planner keeps the 0.06rad/frame slew and a single
  // 0.18rad ceiling; the final pose must re-certify real skinned toe + heel.
  for(const signed of [-.1,.1,-.2,.2]){
   lower.bone.quaternion.copy(orig).multiply(
    trial.setFromAxisAngle(sourceKneeAxis,signed));
   lower.bone.updateWorldMatrix(true,true);
   const toe=readOriginalSwingSoleY(patch.toe);
   const heel=readOriginalSwingSoleY(patch.heel);
   if(Number.isFinite(toe)&&Number.isFinite(heel))
    trials.push({signed,toe,heel});
  }
 }finally{
  lower.bone.quaternion.copy(orig);
  mount.bone.quaternion.copy(originalFoot);
  lower.bone.updateWorldMatrix(true,true);
 }
 // A maximum toe lift is NOT a safe knee candidate if its original heel
 // collapses into stone. Filter both signed original-bone trials BEFORE
 // choosing a direction rather than rejecting the whole pair afterward.
 const best=selectOriginalSourceSwingCalfTrial({
  afterAnkleToeY:ankleToeY,afterAnkleHeelY:ankleHeelY,
  floorTopY:-.02,trials,previousAssistRad:prior
 });
 actor.sourceSwingCalfTrialOutcome={
  ...actor.sourceSwingCalfTrialOutcome,attempted:true,accepted:Boolean(best),
  reason:best?'heel-safe-original-source-trial':'no-heel-safe-positive-trial',
  afterAnkleToeY:ankleToeY,afterAnkleHeelY:ankleHeelY,
  trials,selectedSignedRad:best?.signed??null
 };
 if(!best)return null;
 const delta=planOriginalSourceSwingCalfAssist({
  mode:actor.fullBody?.mode,sourceClipName:actor.activeImportedClipName,
  sourceAnatomyVerified:true,sourceLegChainVerified:true,
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
  ownerLocomotion:actor.fullBody?.owner?.locomotion===true,
  alive:actor.u.hp>0,visible:actor.root?.visible===true,
  teleport:Boolean(actor.locomotionTeleport),
  reducedMotion:Boolean(actor.fullBody?.reducedMotion),
  interrupted:Boolean(actor.fullBody?.interrupted),
  rootTravel:actor.rigRecentGroundedTravel,
  frameAge:actor.rigRecentGroundedAge,floorTopY:-.02,
  afterAnkleToeY:ankleToeY,afterAnkleHeelY:ankleHeelY,
  ankleLiftMeters:ankleLift,trialCalfToeY:best.toe,
  trialCalfHeelY:best.heel,trialAngleRad:best.signed,
  previousAssistRad:prior
 });
 if(Math.abs(delta)<.0001){
  actor.sourceSwingCalfTrialOutcome={
   ...actor.sourceSwingCalfTrialOutcome,accepted:false,
   reason:'calf-owner-or-small-blended-delta'
  };
  return null;
 }
 let toe=NaN,heel=NaN;
 try{
  mount.bone.quaternion.copy(foot);
  lower.bone.quaternion.copy(orig).multiply(
   trial.setFromAxisAngle(sourceKneeAxis,delta));
  lower.bone.updateWorldMatrix(true,true);
  toe=readOriginalSwingSoleY(patch.toe);
  heel=readOriginalSwingSoleY(patch.heel);
 }finally{
  lower.bone.quaternion.copy(orig);
  mount.bone.quaternion.copy(originalFoot);
  lower.bone.updateWorldMatrix(true,true);
 }
 // The original mobile 0.2rad source trial supplies only 5.696mm. At the
 // licensed .06rad/frame calf limit, a genuine smaller (~1mm) same-skin
 // upward step can be physically valid: require its REAL measured outcome,
 // not an 8mm full-probe response. No blind joint motion is accepted.
 if(!Number.isFinite(toe)||!Number.isFinite(heel)||
  toe-ankleToeY<.001||toe-ankleToeY>.075||
  heel<-.02+.055||heel>-.02+.36||
  Math.abs(heel-ankleHeelY)>.06){
  actor.sourceSwingCalfTrialOutcome={
   ...actor.sourceSwingCalfTrialOutcome,accepted:false,
   reason:'final-weighted-calflift-rejected'
  };
  return null;
 }
 // Apply only to the actual original imported joint, reversible next frame.
 lower.bone.quaternion.multiply(trial.setFromAxisAngle(sourceKneeAxis,delta));
 lower.last.multiply(trial);
 lower.swingCalfAssistRad=delta;
 actor.sourceSwingCalfCurrentFrameMask|=mount.side==='left'?1:2;
 actor.sourceSwingCalfTrialOutcome={
  ...actor.sourceSwingCalfTrialOutcome,accepted:true,
  reason:'final-source-skin-lift-confirmed',
  finalToeY:toe,finalHeelY:heel,finalAngleRad:delta
 };
 actor.sourceSwingCalfAssistFrames=Math.min(1000000,
  (actor.sourceSwingCalfAssistFrames||0)+1);
 actor.sourceSwingCalfAssistProof={
  source:'same-original-connected-GLB-calf-and-skinned-toe',
  sourceInstanceId:actor.assetRoot?.uuid??null,
  side:mount.side,sourceClip:actor.activeImportedClipName,
  beforeToeY:ankleToeY,afterToeY:toe,
  beforeHeelY:ankleHeelY,afterHeelY:heel,
  liftMeters:toe-ankleToeY,appliedAngleRad:delta
 };
 return {afterToeY:toe,afterHeelY:heel,
  liftMeters:toe-ankleToeY,appliedAngleRad:delta};
}

function planOriginalSourceSwingToeForMountedAnkle(actor,mount,angle,reducedMotion){
 const previous=mount.soleClearanceRad||0;
 mount.soleClearanceRad=0;
 // Original Walking_A may still deform the imported feet within the SAME
 // authoritative tick after the ground-stamp observer goes quiet. Only the
 // bounded, real, same-owner root-travel receipt may keep the swing probe
 // alive; a change of action, clip, ownership or accessibility clears it.
 const witnessed=mount.part==='foot'&&hasOriginalSourceSwingTravelWitness({
  mode:actor.fullBody?.mode,sourceClipName:actor.activeImportedClipName,
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
  ownerLocomotion:actor.fullBody?.owner?.locomotion===true,
  travel:actor.rigRecentGroundedTravel??0,
  age:actor.rigRecentGroundedAge??0,
  alive:actor.u.hp>0,visible:actor.root?.visible===true,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody?.interrupted)
 });
 if(!witnessed)return 0;
 actor.sourceSwingToeWitnessFrames=Math.min(1000000,
  (actor.sourceSwingToeWitnessFrames||0)+1);
 const patch=sourceSolePatchVertexCandidates(actor)?.[mount.side];
 if(!patch?.anatomicalHeelToeVerified||
  patch.sourceToeAxis?.selectedAnatomicalPatch!==true||
  patch.heel?.mesh!==patch.toe?.mesh||
  !/foot[._-]?[lr]$/i.test(mount.bone?.name||''))return 0;
 // Original mixer and existing same-owner additive leg pose, BEFORE the
 // proposed clearance delta. We always restore this exact source quaternion.
 const original=mount.probeOriginal??(mount.probeOriginal=new THREE.Quaternion());
 const staged=mount.probeStaged??(mount.probeStaged=new THREE.Quaternion());
 const probe=mount.probeDelta??(mount.probeDelta=new THREE.Quaternion());
 original.copy(mount.bone.quaternion);
 staged.copy(original).multiply(mount.next.setFromEuler(mount.euler.set(angle,0,0,'XYZ')));
 let heelY=NaN,toeY=NaN,probeToeY=NaN,probeHeelY=NaN,probeAngle=0;
 const ankleTrials=[];
 try{
  mount.bone.quaternion.copy(staged);
  actor.assetRoot.updateMatrixWorld(true);
  patch.heel.mesh.updateWorldMatrix(true,false);
  heelY=readOriginalSwingSoleY(patch.heel);
  toeY=readOriginalSwingSoleY(patch.toe);
  // A genuine airborne toe can begin measured swing rescue at 10mm
  // intrusion, before licensed ankle/calf slew caps run out of walking
  // frames. Never mistake an original loaded heel for a swing opportunity.
  if(Number.isFinite(heelY)&&Number.isFinite(toeY)&&
   heelY>-.02+.075&&heelY<-.02+.28&&toeY<-.02-.01&&toeY>-.02-.16){
   actor.sourceSwingToeDragOpportunityFrames=Math.min(1000000,
    (actor.sourceSwingToeDragOpportunityFrames||0)+1);
   for(const signed of [-.1,.1,-.2,.2]){
    mount.bone.quaternion.copy(staged).multiply(
     probe.setFromAxisAngle(originalSwingPitchAxis,signed));
    mount.bone.updateWorldMatrix(true,true);
    ankleTrials.push({signed,toe:readOriginalSwingSoleY(patch.toe),
     heel:readOriginalSwingSoleY(patch.heel)});
   }
   const chosen=selectOriginalSourceSwingAnkleTrial({
    toeWorldY:toeY,heelWorldY:heelY,floorTopY:-.02,trials:ankleTrials,
    previousCorrectionRad:previous
   });
   if(chosen){probeToeY=chosen.toe;probeHeelY=chosen.heel;probeAngle=chosen.signed;}
  }
 }finally{
  mount.bone.quaternion.copy(original);
  mount.bone.updateWorldMatrix(true,true);
 }
 const delta=planOriginalSourceSwingToeClearance({
  mode:actor.fullBody.mode,sourceClipName:actor.activeImportedClipName,
  sourceAnatomyVerified:true,sourceWeight:actor.activeClip.getEffectiveWeight(),
  alive:actor.u.hp>0,visible:actor.root.visible,
  groundedMoving:witnessed,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody.interrupted),
  rootTravel:actor.rigRecentGroundedTravel,
  frameInterval:actor.rigSourceSwingFrameInterval??.016,floorTopY:-.02,
  heelWorldY:heelY,toeWorldY:toeY,trialToeWorldY:probeToeY,
  trialAngleRad:probeAngle,previousCorrectionRad:previous
 });
 // An optimistic .1rad trial is not proof that the final clipped angle
 // raises the shoe. Measure actual SAME-FRAME weighted toe/heel geometry
 // under the exact applied original foot joint, then restore the source pose.
 if(Math.abs(delta)<=.0001){
  // A measured previous Walking_A toe lift may remain physically valid at
  // the next source keyframe even if a broad ±.1/.2rad fresh probe has failed.
  // Retest its exact prior fine angle against the same ORIGINAL skinned toe,
  // heel AND opposite shoe before retaining any one-frame cosmetic pose.
  // This avoids an unproven instant ankle reset without ever locking contact.
  if(Math.abs(previous)<.0001||Math.abs(previous)>.221)return 0;
  const opposite=sourceSolePatchVertexCandidates(actor)?.[
   mount.side==='left'?'right':'left'];
  if(!opposite?.anatomicalHeelToeVerified||
   opposite.sourceToeAxis?.selectedAnatomicalPatch!==true||
   opposite.heel?.mesh!==opposite.toe?.mesh)return 0;
  const heldAngle=Math.max(-.30,Math.min(.30,angle+previous));
  if(Math.abs(heldAngle-angle-previous)>.00001)return 0;
  let afterToe=NaN,afterHeel=NaN;
  let otherBeforeHeel=NaN,otherBeforeToe=NaN;
  let otherAfterHeel=NaN,otherAfterToe=NaN;
  try{
   mount.bone.quaternion.copy(staged);
   mount.bone.updateWorldMatrix(true,true);
   otherBeforeHeel=readOriginalSwingSoleY(opposite.heel);
   otherBeforeToe=readOriginalSwingSoleY(opposite.toe);
   mount.bone.quaternion.copy(original).multiply(
    mount.next.setFromEuler(mount.euler.set(heldAngle,0,0,'XYZ')));
   mount.bone.updateWorldMatrix(true,true);
   afterToe=readOriginalSwingSoleY(patch.toe);
   afterHeel=readOriginalSwingSoleY(patch.heel);
   otherAfterHeel=readOriginalSwingSoleY(opposite.heel);
   otherAfterToe=readOriginalSwingSoleY(opposite.toe);
  }finally{
   mount.bone.quaternion.copy(original);
   mount.bone.updateWorldMatrix(true,true);
  }
  const held=confirmOriginalSourceSwingToeContinuation({
   mode:actor.fullBody?.mode,sourceClipName:actor.activeImportedClipName,
   sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
   ownerLocomotion:actor.fullBody?.owner?.locomotion===true,
   sourceInstanceSame:Boolean(actor.assetRoot?.uuid),
   sourceAnatomyVerified:true,alive:actor.u.hp>0,
   visible:actor.root?.visible===true,
   teleport:Boolean(actor.locomotionTeleport),reducedMotion,
   interrupted:Boolean(actor.fullBody?.interrupted),
   rootTravel:actor.rigRecentGroundedTravel,
   frameAge:actor.rigRecentGroundedAge,floorTopY:-.02,
   previousCorrectionRad:previous,beforeToeY:toeY,beforeHeelY:heelY,
   afterToeY:afterToe,afterHeelY:afterHeel,
   otherBeforeHeelY:otherBeforeHeel,otherBeforeToeY:otherBeforeToe,
   otherAfterHeelY:otherAfterHeel,otherAfterToeY:otherAfterToe
  });
  if(!held)return 0;
  actor.sourceSwingToeLiftProof={
   source:'same-original-GLB-foot-skinned-vertices',
   continuitySource:held.source,sourceInstanceId:actor.assetRoot.uuid,
   side:mount.side,sourceClip:actor.activeImportedClipName,
   sourceWeight:actor.activeClip.getEffectiveWeight(),
   beforeToeY:toeY,afterToeY:afterToe,
   beforeHeelY:heelY,afterHeelY:afterHeel,
   floorTopY:-.02,liftMeters:held.measuredToeLiftMeters,
   penetrationBeforeMeters:Math.max(0,-.02-toeY),
   penetrationAfterMeters:Math.max(0,-.02-afterToe),
   // A verified held ankle has the same genuine source-depth classification
   // as a freshly corrected ankle; omitting this boolean breaks mobile
   // original-GLB proof even when both real skinned shoes were rechecked.
   earlySourceToeRescue:toeY>-.045&&toeY<-.03,
   appliedAngleRad:previous,continuityHold:true,contactLocked:false,
   originalOppositeShoeVerified:true
  };
  actor.sourceSwingToeCurrentFrameProofs??={left:null,right:null};
  actor.sourceSwingToeCurrentFrameProofs[mount.side]=actor.sourceSwingToeLiftProof;
  actor.sourceSwingToeCorrectionsThisFrame=Math.min(2,
   (actor.sourceSwingToeCorrectionsThisFrame||0)+1);
  actor.sourceSwingToeContinuityFrames=Math.min(1000000,
   (actor.sourceSwingToeContinuityFrames||0)+1);
  mount.soleClearanceRad=previous;
  return previous;
 }
 // The latest real mobile source-rig film included a 0.187rad TOTAL
 // ankle overlay on a 16.8ms frame. Only the difference from the
 // immediately prior verified ankle correction may be judged as a frame
 // slew. Reject an unproven joint snap *before* mutating the GLB; the
 // source mixer, weapon grip and authoritative movement remain untouched.
 const angularReceipt=auditOriginalSourceSwingAnkleSlew({
  mode:actor.fullBody.mode,sourceClipName:actor.activeImportedClipName,
  sourceWeight:actor.activeClip.getEffectiveWeight(),
  sourceInstanceSame:Boolean(actor.assetRoot?.uuid),
  alive:actor.u.hp>0,visible:actor.root.visible,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody.interrupted),
  frameInterval:actor.rigSourceSwingFrameInterval??NaN,floorTopY:-.02,
  heelWorldY:heelY,toeWorldY:toeY,
  previousAngleRad:previous,nextAngleRad:delta
 });
 if(!angularReceipt)return 0;
 const finalAngle=Math.max(-.30,Math.min(.30,angle+delta));
 let afterToeY=NaN,afterHeelY=NaN;
 try{
  mount.bone.quaternion.copy(original).multiply(
   mount.next.setFromEuler(mount.euler.set(finalAngle,0,0,'XYZ')));
  mount.bone.updateWorldMatrix(true,true);
  afterToeY=readOriginalSwingSoleY(patch.toe);
  afterHeelY=readOriginalSwingSoleY(patch.heel);
 }finally{
  mount.bone.quaternion.copy(original);
  mount.bone.updateWorldMatrix(true,true);
 }
 const lift=confirmOriginalSourceSwingToeLift({
  beforeToeY:toeY,afterToeY,beforeHeelY:heelY,afterHeelY,
  floorTopY:-.02,appliedAngleRad:finalAngle-angle
 });
 if(lift===null)return 0;
 const calf=planOriginalSourceSwingCalfForMountedFoot(actor,mount,original,
  finalAngle,afterToeY,afterHeelY,lift,patch);
 // Only real accepted events allocate this one bounded observation.
 actor.sourceSwingToeLiftProof={
  source:'same-original-GLB-foot-skinned-vertices',
  side:mount.side,sourceClip:actor.activeImportedClipName,
  sourceWeight:actor.activeClip.getEffectiveWeight(),
  sourceInstanceId:actor.assetRoot?.uuid??null,
  beforeToeY:toeY,afterToeY:calf?.afterToeY??afterToeY,
  beforeHeelY:heelY,afterHeelY:calf?.afterHeelY??afterHeelY,
  floorTopY:-.02,liftMeters:lift+(calf?.liftMeters??0),
  // Provenance only; a longer interval or a positive number does NOT
  // certify stance contact, planted feet or physically complete clearance.
  visibleFrameIntervalSeconds:actor.rigSourceSwingFrameInterval??null,
  frameAwareSwingUsed:angularReceipt.sparseFrameAllowanceUsed,
  sourceAnkleStepRad:angularReceipt.stepRad,
  sourceAnkleFrameLimitRad:angularReceipt.limitRad,
  penetrationBeforeMeters:Math.max(0,-.02-toeY),
  penetrationAfterMeters:Math.max(0,-.02-(calf?.afterToeY??afterToeY)),
  earlySourceToeRescue:toeY>-.045&&toeY<-.03,
  ankleLiftMeters:lift,calfAssistMeters:calf?.liftMeters??0,
  appliedAngleRad:finalAngle-angle,calfAssistAngleRad:calf?.appliedAngleRad??0,
  candidateAngleRad:probeAngle,candidateToeY:probeToeY,candidateHeelY:probeHeelY
 };
 actor.sourceSwingToeCurrentFrameProofs??={left:null,right:null};
 actor.sourceSwingToeCurrentFrameProofs[mount.side]=actor.sourceSwingToeLiftProof;
 actor.sourceSwingToeCorrectionsThisFrame=Math.min(2,
  (actor.sourceSwingToeCorrectionsThisFrame||0)+1);
 mount.soleClearanceRad=delta;
 actor.sourceSwingToeCorrectionFrames=Math.min(1000000,
  (actor.sourceSwingToeCorrectionFrames||0)+1);
 actor.sourceSwingToeCorrectionPeakRad=Math.max(
  actor.sourceSwingToeCorrectionPeakRad||0,Math.abs(delta));
 return delta;
}

/**
 * Near-ground stance correction uses the ACTUAL CC0 weighted outsole
 * endpoints in world coordinates, never an inferred flat sole or invented
 * foot lock. The two original foot-joint probes are fully reversible.
 * A proposed delta must pass an independent FINAL skinned-vertex check.
 */
function planOriginalSourceStanceForMountedAnkle(actor,mount,angle,reducedMotion){
 const previous=mount.stanceReliefRad||0;
 mount.stanceReliefRad=0;
 if(mount.part!=='foot'||!hasOriginalSourceSwingTravelWitness({
  mode:actor.fullBody?.mode,sourceClipName:actor.activeImportedClipName,
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
  ownerLocomotion:actor.fullBody?.owner?.locomotion===true,
  travel:actor.rigRecentGroundedTravel??0,age:actor.rigRecentGroundedAge??0,
  alive:actor.u.hp>0,visible:actor.root?.visible===true,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody?.interrupted)
 }))return 0;
 const patch=sourceSolePatchVertexCandidates(actor)?.[mount.side];
 if(!patch?.anatomicalHeelToeVerified||
  patch.sourceToeAxis?.selectedAnatomicalPatch!==true||
  patch.heel?.mesh!==patch.toe?.mesh||
  !/foot[._-]?[lr]$/i.test(mount.bone?.name||''))return 0;
 const original=mount.probeOriginal??(mount.probeOriginal=new THREE.Quaternion());
 const staged=mount.probeStaged??(mount.probeStaged=new THREE.Quaternion());
 const probe=mount.probeDelta??(mount.probeDelta=new THREE.Quaternion());
 original.copy(mount.bone.quaternion);
 staged.copy(original).multiply(mount.next.setFromEuler(
  mount.euler.set(angle,0,0,'XYZ')));
 let heelY=NaN,toeY=NaN,beforeHeelXZ=null,beforeToeXZ=null;
 const trials=[];
 try{
  mount.bone.quaternion.copy(staged);
  actor.assetRoot.updateMatrixWorld(true);
  patch.heel.mesh.updateWorldMatrix(true,false);
  // One original weighted-vertex skin readback owns BOTH measured height
  // and lateral footprint. Do not skin identical heels/toes twice.
  const originalHeel=sourceSkinnedSoleWorld(patch.heel);
  const originalToe=sourceSkinnedSoleWorld(patch.toe);
  heelY=originalHeel?.[1]??NaN;
  toeY=originalToe?.[1]??NaN;
  if(originalHeel&&originalToe){
   beforeHeelXZ=[originalHeel[0],originalHeel[2]];
   beforeToeXZ=[originalToe[0],originalToe[2]];
  }
  // Only a genuinely loaded original shoe gets two physical trials.
  // This is separate from the established airborne-swing rescue.
  if(Number.isFinite(heelY)&&Number.isFinite(toeY)&&
   heelY>-.065&&heelY<.015&&toeY>-.065&&toeY<.015&&
   Math.min(heelY,toeY)<-.028){
   // The 120mrad source trial sometimes buries the opposite outsole
    // even when a genuine 45mrad per-frame source joint trial is safe.
    // Sample both original skinned heel/toe endpoints at two scales.
    // Final applied correction STILL requires independent physical
    // readback, same-source owner, and the original slew/heel budget.
    // At most four probes, only on a verified loaded Walking_A foot.
    for(const signed of [-.12,-.045,.045,.12]){
    mount.bone.quaternion.copy(staged).multiply(
     probe.setFromAxisAngle(originalSwingPitchAxis,signed));
    mount.bone.updateWorldMatrix(true,true);
    trials.push({signed,heel:readOriginalSwingSoleY(patch.heel),
     toe:readOriginalSwingSoleY(patch.toe)});
   }
  }
 }finally{
  mount.bone.quaternion.copy(original);
  mount.bone.updateWorldMatrix(true,true);
 }
 // Bounded on-demand receipt for original-source-only physical trials.
 // Real weighted heel/toe are remeasured again after the applied angle.
 actor.sourceStanceProbeOutcomes??={left:null,right:null};
 const probeOutcome={
  source:'same-original-GLB-multiscale-ankle-probe',
  sourceInstanceId:actor.assetRoot?.uuid??null,
  side:mount.side,sourceClip:actor.activeImportedClipName,
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??null,
  beforeHeelY:heelY,beforeToeY:toeY,
  beforeWorstMeters:Math.max(Math.abs(heelY+.02),Math.abs(toeY+.02)),
  trials,status:'no-safe-two-point-trial'
 };
 actor.sourceStanceProbeOutcomes[mount.side]=probeOutcome;
 const selected=planOriginalSourceStanceAnkleRelief({
  mode:actor.fullBody?.mode,sourceClipName:actor.activeImportedClipName,
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
  ownerLocomotion:actor.fullBody?.owner?.locomotion===true,
  rootTravel:actor.rigRecentGroundedTravel,
  frameAge:actor.rigRecentGroundedAge,
  alive:actor.u.hp>0,visible:actor.root?.visible===true,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody?.interrupted),floorTopY:-.02,
  heelY,toeY,trials,previousCorrectionRad:previous
 });
 if(!selected)return 0;
 const beforeWorst=Math.max(Math.abs(heelY+.02),Math.abs(toeY+.02));
 // Compare at most TWO completely reversible, already source-approved
 // original ankle candidates against REAL world-space weighted heel/toe.
 // A first positive correction can still leave a source shoe buried:
 // the actual -45mrad mobile trial is demonstrably nearer the stone.
 // The source mixer and existing 45mrad/joint limits remain authoritative.
 probeOutcome.status='final-skinned-measurement-rejected';
 const candidates=[selected.delta];
 if(Number.isFinite(selected.fineFallbackDelta))
  candidates.push(selected.fineFallbackDelta);
 const measuredCandidates=[];
 for(const delta of candidates){
  const finalAngle=Math.max(-.30,Math.min(.30,angle+delta));
  if(Math.abs(finalAngle-angle-delta)>.0001)continue;
  let afterHeel=NaN,afterToe=NaN,afterHeelXZ=null,afterToeXZ=null;
  try{
   mount.bone.quaternion.copy(original).multiply(
    mount.next.setFromEuler(mount.euler.set(finalAngle,0,0,'XYZ')));
   mount.bone.updateWorldMatrix(true,true);
   // The same skinned vertex supplies XZ and Y for this exact trial pose.
   const witnessHeel=sourceSkinnedSoleWorld(patch.heel);
   const witnessToe=sourceSkinnedSoleWorld(patch.toe);
   afterHeel=witnessHeel?.[1]??NaN;
   afterToe=witnessToe?.[1]??NaN;
   if(witnessHeel&&witnessToe){
    afterHeelXZ=[witnessHeel[0],witnessHeel[2]];
    afterToeXZ=[witnessToe[0],witnessToe[2]];
   }
  }finally{
   mount.bone.quaternion.copy(original);
   mount.bone.updateWorldMatrix(true,true);
  }
  measuredCandidates.push({delta,heelY:afterHeel,toeY:afterToe,
   heelXZ:afterHeelXZ,toeXZ:afterToeXZ});
 }
 probeOutcome.appliedCandidates=measuredCandidates;
 const accepted=chooseOriginalSourceStanceAppliedWitness({
  floorTopY:-.02,beforeHeelY:heelY,beforeToeY:toeY,
  previousCorrectionRad:previous,candidates:measuredCandidates,
  spatialWitnessRequired:true,beforeHeelXZ,beforeToeXZ
 });
 if(!accepted)return 0;
 const fineFallbackUsed=accepted.delta!==selected.delta;
 probeOutcome.status='accepted';
 probeOutcome.finalWorstMeters=accepted.afterWorst;
 probeOutcome.finalAngleRad=accepted.delta;
 probeOutcome.fineFallbackUsed=fineFallbackUsed;
 probeOutcome.selectedMeasuredIndex=accepted.candidateIndex;
 mount.stanceReliefRad=accepted.delta;
 actor.sourceStanceSoleCurrentFrameProofs??={left:null,right:null};
 actor.sourceStanceSoleCurrentFrameProofs[mount.side]={
  source:'same-original-GLB-two-point-stanced-shoe',
  sourceInstanceId:actor.assetRoot?.uuid??null,
  side:mount.side,sourceClip:actor.activeImportedClipName,
  beforeHeelY:heelY,beforeToeY:toeY,
  afterHeelY:accepted.afterHeel,afterToeY:accepted.afterToe,
  beforeWorstMeters:beforeWorst,afterWorstMeters:accepted.afterWorst,
  // Same-frame original weighted skinned-sole XZ, measured before/after
  // the candidate's reversible original joint, not a fabricated foot plant.
  heelShiftXZMeters:accepted.heelShiftXZMeters,
  toeShiftXZMeters:accepted.toeShiftXZMeters,
  floorTopY:-.02,appliedAngleRad:accepted.delta,
  previousCorrectionRad:previous,fineFallbackUsed
 };
 actor.sourceStanceReliefFrames=Math.min(1000000,
  (actor.sourceStanceReliefFrames||0)+1);
 return accepted.delta;
}

/**
 * Native-source loaded-sole correction after ONE fully owned Mixer frame.
 * The original Walking_A lowerleg hinge (not a synthetic X IK axis) may
 * rotate only after its exact track, bind lengths, world bend plane, source
 * mesh and BOTH real skinned shoes are verified.
 *
 * At most two ±45mrad trials, one final source-skin readback, no extra Mixer
 * tick/draw call, and no edits to source GLB, grid, HP or hit outcomes.
 * A valid candidate is still NOT a moving planted-foot certificate.
 */
function stageOriginalSourceLoadedKneeForMountedFoot(actor,footMount,reducedMotion){
 const side=footMount?.side;
 const upper=actor.rigGaitBones?.find(m=>m.side===side&&m.part==='upper');
 const lower=actor.rigGaitBones?.find(m=>m.side===side&&m.part==='lower');
 if(!lower)return;
 const previous=lower.stanceKneeReliefRad||0;
 lower.stanceKneeReliefRad=0;
 if(!upper?.bone?.isBone||!lower.bone?.isBone||
  !footMount?.bone?.isBone||lower.bone.parent!==upper.bone||
  footMount.bone.parent!==lower.bone||!lower.last?.isQuaternion||
  actor.fullBody?.mode!=='move'||actor.fullBody?.owner?.locomotion!==true||
  actor.activeImportedClipName!=='Walking_A'||actor.u.hp<=0||
  actor.root?.visible!==true||actor.locomotionTeleport||reducedMotion||
  actor.fullBody?.interrupted||!(actor.rigRecentGroundedTravel>=.008&&
   actor.rigRecentGroundedTravel<=.24&&
   actor.rigRecentGroundedAge>=0&&actor.rigRecentGroundedAge<=.18)||
  (actor.activeClip?.getEffectiveWeight?.()??0)<.65||
  actor.sourceSwingToeCurrentFrameProofs?.[side]||
  actor.sourceStanceSoleCurrentFrameProofs?.[side]||
  (actor.sourceSwingCalfCurrentFrameMask&(side==='left'?1:2)))return;
 const patches=sourceSolePatchVertexCandidates(actor);
 if(!['left','right'].every(s=>
  patches?.[s]?.anatomicalHeelToeVerified&&
  patches[s].sourceToeAxis?.selectedAnatomicalPatch===true&&
  patches[s].heel?.mesh===patches[s].toe?.mesh))return;
 const read=()=>Object.fromEntries(['left','right'].map(s=>[s,{
  heelY:readOriginalSwingSoleY(patches[s].heel),
  toeY:readOriginalSwingSoleY(patches[s].toe)
 }]));
 actor.assetRoot.updateMatrixWorld(true);
 const before=read(),first=before?.[side];
 if(!first||![first.heelY,first.toeY].every(Number.isFinite)||
  first.heelY<-.065||first.heelY>.015||
  first.toeY<-.065||first.toeY>.015||
  Math.min(first.heelY,first.toeY)>-.028)return;
 // A source knee axis only exists when the actual licensed quaternion clip
 // keys this lowerleg. Cached independently for each SkeletonUtils clone.
 if(!Object.hasOwn(lower,'sourceKneeAxisAudit')){
  const walk=actor.availableClips?.find(clip=>clip?.name==='Walking_A');
  lower.sourceKneeAxisAudit=inferImportedSourceKneeBendAxis(walk,lower.bone.name);
 }
 const audit=lower.sourceKneeAxisAudit;
 if(!audit)return;
 const axis=lower.sourceKneeAxis??(
  lower.sourceKneeAxis=new THREE.Vector3(...audit.axis));
 const hip=lower.sourceKneeUpperWorld??(
  lower.sourceKneeUpperWorld=new THREE.Vector3());
 const knee=lower.sourceKneeKneeWorld??(
  lower.sourceKneeKneeWorld=new THREE.Vector3());
 const ankle=lower.sourceKneeAnkleWorld??(
  lower.sourceKneeAnkleWorld=new THREE.Vector3());
 const thigh=lower.sourceKneeThighVector??(
  lower.sourceKneeThighVector=new THREE.Vector3());
 const calf=lower.sourceKneeCalfVector??(
  lower.sourceKneeCalfVector=new THREE.Vector3());
 const plane=lower.sourceKneeBendPlane??(
  lower.sourceKneeBendPlane=new THREE.Vector3());
 const worldAxis=lower.sourceKneeHingeWorldAxis??(
  lower.sourceKneeHingeWorldAxis=new THREE.Vector3());
 const worldQuat=lower.sourceKneeHingeWorldQuat??(
  lower.sourceKneeHingeWorldQuat=new THREE.Quaternion());
 upper.bone.getWorldPosition(hip);
 lower.bone.getWorldPosition(knee);
 footMount.bone.getWorldPosition(ankle);
 thigh.subVectors(knee,hip);calf.subVectors(ankle,knee);
 const denom=thigh.length()*calf.length();
 if(!Number.isFinite(denom)||denom<.000001)return;
 const bendSine=plane.crossVectors(thigh,calf).length()/denom;
 lower.bone.getWorldQuaternion(worldQuat);
 worldAxis.copy(axis).applyQuaternion(worldQuat).normalize();
 const hingeAlignment=bendSine>.085&&bendSine<=1.000001?
  Math.abs(plane.normalize().dot(worldAxis)):0;
 if(!Object.hasOwn(lower,'sourceKneeBindAudit'))
  lower.sourceKneeBindAudit=readOriginalSourceKneeBindLengths(
   actor,upper.bone,lower.bone,footMount.bone);
 const bind=lower.sourceKneeBindAudit,assetWorld=actor.assetRoot?.matrixWorld;
 if(!bind||!assetWorld?.isMatrix4||
  !assetWorld.elements.every(Number.isFinite)||
  Math.abs(assetWorld.determinant())<1e-10)return;
 const inverse=lower.sourceKneeInverseAssetWorld??(
  lower.sourceKneeInverseAssetWorld=new THREE.Matrix4());
 inverse.copy(assetWorld).invert();
 const upperTriple=lower.sourceKneeUpperTriplet??(lower.sourceKneeUpperTriplet=[0,0,0]);
 const kneeTriple=lower.sourceKneeKneeTriplet??(lower.sourceKneeKneeTriplet=[0,0,0]);
 const footTriple=lower.sourceKneeFootTriplet??(lower.sourceKneeFootTriplet=[0,0,0]);
 const lengths=measureImportedKneeSegmentsInAssetCoordinates({
  upperWorld:hip.toArray(upperTriple),kneeWorld:knee.toArray(kneeTriple),
  footWorld:ankle.toArray(footTriple),inverseAssetWorld:inverse.elements
 });
 const geometry=lengths?assessImportedSourceKneeGeometry({
  upperLength:lengths.upperLength,lowerLength:lengths.lowerLength,
  bendSine,hingeAlignment,
  sourceBindUpperLength:bind.upperLength,sourceBindLowerLength:bind.lowerLength
 }):null;
 if(!geometry?.accepted)return;
 const original=lower.loadedKneeOriginal??(lower.loadedKneeOriginal=new THREE.Quaternion());
 const rotation=lower.loadedKneeDelta??(lower.loadedKneeDelta=new THREE.Quaternion());
 original.copy(lower.bone.quaternion);
 const trials=[];
 try{
  for(const signed of [-.045,.045]){
   lower.bone.quaternion.copy(original).multiply(
    rotation.setFromAxisAngle(axis,signed));
   lower.bone.updateWorldMatrix(true,true);
   trials.push({signed,after:read()});
  }
 }finally{
  lower.bone.quaternion.copy(original);
  lower.bone.updateWorldMatrix(true,true);
 }
 const options={
  mode:actor.fullBody.mode,sourceClipName:actor.activeImportedClipName,
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
  ownerLocomotion:true,sourceHingeVerified:true,sourceInstanceSame:!!actor.assetRoot?.uuid,
  alive:actor.u.hp>0,visible:actor.root.visible,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody.interrupted),
  rootTravel:actor.rigRecentGroundedTravel,frameAge:actor.rigRecentGroundedAge,
  floorTopY:-.02,side,previousCorrectionRad:previous,before
 };
 const chosen=chooseOriginalSourceLoadedKneeWitness({...options,trials});
 actor.sourceStanceKneeProbeOutcomes??={left:null,right:null};
 actor.sourceStanceKneeProbeOutcomes[side]={
  source:'licensed-Walking_A-lowerleg-two-shoe-trials',
  sourceInstanceId:actor.assetRoot.uuid,side,
  sourceKneeBone:lower.bone.name,sourceClip:actor.activeImportedClipName,
  sourceKneeAxisAudit:audit,bindLengths:bind,
  bendSine,hingeAlignment,before,trials,
  accepted:Boolean(chosen),contactLocked:false
 };
 if(!chosen)return;
 // Re-measure the final actual post-overlay source GLB shoe; do not promote
 // a speculative trial object into a production physical pose.
 lower.bone.quaternion.copy(original).multiply(
  rotation.setFromAxisAngle(axis,chosen.delta));
 lower.bone.updateWorldMatrix(true,true);
 const final=read();
 const verified=chooseOriginalSourceLoadedKneeWitness({...options,
  trials:[{signed:chosen.delta,after:final}]});
 if(!verified){
  lower.bone.quaternion.copy(original);
  lower.bone.updateWorldMatrix(true,true);
  actor.sourceStanceKneeProbeOutcomes[side].accepted=false;
  return;
 }
 lower.last.multiply(rotation);
 lower.stanceKneeReliefRad=verified.delta;
 actor.sourceStanceKneeCurrentFrameProofs??={left:null,right:null};
 actor.sourceStanceKneeCurrentFrameProofs[side]={
  ...verified,source:'same-original-GLB-loaded-knee-two-shoe',
  sourceInstanceId:actor.assetRoot.uuid,
  sourceClip:actor.activeImportedClipName,sourceKneeBone:lower.bone.name,
  sourceKneeAxis:audit.axis,previousCorrectionRad:previous
 };
 actor.sourceStanceKneeSupportFrames=Math.min(1000000,
  (actor.sourceStanceKneeSupportFrames||0)+1);
}


/**
 * One imported upperleg swing correction, not world-space IK or a synthetic step.
 * Only a source Walking_A quaternion track and actual weighted skinned shoes
 * authorize the reversible trial; the loaded opposite shoe remains unchanged.
 */
function stageOriginalSourceSwingThighAfterMixer(actor,side,reducedMotion){
 const upper=actor.rigGaitBones?.find(m=>m.side===side&&m.part==='upper');
 const lower=actor.rigGaitBones?.find(m=>m.side===side&&m.part==='lower');
 const foot=actor.rigGaitBones?.find(m=>m.side===side&&m.part==='foot');
 const opposite=side==='left'?'right':'left';
 // Old direction cannot constrain a future source gait after a frame without
 // authentic loaded-vs-airborne evidence; only successful trials retain it.
 const previous=upper?.swingThighAssistRad||0;
 const priorProof=Boolean(upper?.swingThighAssistSourceInstanceId&&
  upper.swingThighAssistSourceInstanceId===actor.assetRoot?.uuid&&
  upper.swingThighAssistSourceClip==='Walking_A');
 if(upper){
  upper.swingThighAssistRad=0;
  upper.swingThighAssistSourceInstanceId=null;
  upper.swingThighAssistSourceClip=null;
 }
 if(!upper?.bone?.isBone||!lower?.bone?.isBone||!foot?.bone?.isBone||
  !upper.last?.isQuaternion||lower.bone.parent!==upper.bone||
  foot.bone.parent!==lower.bone||actor.sourceLoadedPelvisCandidate||
  actor.sourceStanceSoleCurrentFrameProofs?.[side]||
  actor.sourceStanceKneeCurrentFrameProofs?.[side]||
  actor.sourceStanceKneeCurrentFrameProofs?.[opposite]||
  actor.fullBody?.mode!=='move'||actor.fullBody?.owner?.locomotion!==true||
  actor.activeImportedClipName!=='Walking_A'||actor.u.hp<=0||
  actor.root?.visible!==true||actor.locomotionTeleport||reducedMotion||
  actor.fullBody?.interrupted)return;
 const sourceWeight=actor.activeClip?.getEffectiveWeight?.()??NaN;
 const rootTravel=actor.rigRecentGroundedTravel;
 const frameAge=actor.rigRecentGroundedAge;
 // Do not perform four real skinned-vertex reads and up to two source-joint
 // transforms when the physical source motion is already not eligible.
 if(!Number.isFinite(sourceWeight)||sourceWeight<.65||sourceWeight>1.001||
  !Number.isFinite(rootTravel)||rootTravel<.008||rootTravel>.24||
  !Number.isFinite(frameAge)||frameAge<0||frameAge>.18)return;
 const patches=sourceSolePatchVertexCandidates(actor);
 if(!['left','right'].every(s=>patches?.[s]?.anatomicalHeelToeVerified&&
  patches[s].sourceToeAxis?.selectedAnatomicalPatch===true&&
  patches[s].heel?.mesh===patches[s].toe?.mesh))return;
 if(!Object.hasOwn(upper,'sourceSwingThighAxisAudit')){
  const walk=actor.availableClips?.find(c=>c?.name==='Walking_A');
  upper.sourceSwingThighAxisAudit=inferImportedSourceKneeBendAxis(walk,upper.bone.name);
 }
 const axisAudit=upper.sourceSwingThighAxisAudit;
 if(!axisAudit)return;
 if(!Object.hasOwn(upper,'sourceSwingThighBindAudit'))
  upper.sourceSwingThighBindAudit=readOriginalSourceKneeBindLengths(
   actor,upper.bone,lower.bone,foot.bone);
 const bind=upper.sourceSwingThighBindAudit;
 if(!bind||![bind.upperLength,bind.lowerLength].every(n=>
  Number.isFinite(n)&&n>.025&&n<1.5))return;
 const sourceAxis=upper.sourceSwingThighAxis??(
  upper.sourceSwingThighAxis=new THREE.Vector3(...axisAudit.axis));
 if(!sourceAxis.isVector3||sourceAxis.lengthSq()<.99||
  sourceAxis.lengthSq()>1.01)return;
 const original=upper.sourceSwingThighOriginal??(
  upper.sourceSwingThighOriginal=new THREE.Quaternion());
 const trialQuat=upper.sourceSwingThighDelta??(
  upper.sourceSwingThighDelta=new THREE.Quaternion());
 const read=()=>Object.fromEntries(['left','right'].map(s=>{
  const heel=sourceSkinnedSoleWorld(patches[s].heel);
  const toe=sourceSkinnedSoleWorld(patches[s].toe);
  return [s,heel&&toe?{heelY:heel[1],toeY:toe[1],
   heelXZ:[heel[0],heel[2]],toeXZ:[toe[0],toe[2]]}:null];
 }));
 actor.assetRoot.updateMatrixWorld(true);
 const before=read();
 const swing=before?.[side],loaded=before?.[opposite];
 // Before any costly live thigh trials prove the same exact pair of original
 // vertices really represents an airborne heel + stone-level opposite shoe.
 if(!swing||!loaded||![swing.heelY,swing.toeY,loaded.heelY,loaded.toeY]
  .every(Number.isFinite)||swing.heelY<.055||swing.heelY>.34||
  (swing.toeY>=-.028&&(!priorProof||swing.toeY>.015))||swing.toeY<-.18||
  swing.heelY-swing.toeY<.08||
  ![loaded.heelY,loaded.toeY].every(y=>y>=-.075&&y<=.015))return;
 // A previously proven native upperleg can RETURN to source rest after
 // its original swing toe clears stone. That is a verified quiet release,
 // not a new clearance rescue. Still reject any unproven near-floor foot,
 // and cap this only to existing source instance/clip correction memory.
 // The loaded shoe may already have an independently VERIFIED original
 // stance-ankle correction in this displayed Mixer frame. Re-read its
 // authentic skinned sole now, and insist that current clone, clip, heel
 // AND toe match that exact proof before testing the other leg's upperleg.
 // The subsequent dual-shoe selector still rejects any loaded shoe drag.
 const oppositeStanceProof=actor.sourceStanceSoleCurrentFrameProofs?.[opposite]??null;
 if(oppositeStanceProof&&!verifyOriginalSourceOppositeStanceForSwingThigh({
  proof:oppositeStanceProof,measured:loaded,oppositeSide:opposite,
  sourceInstanceId:actor.assetRoot?.uuid,sourceClipName:actor.activeImportedClipName,
  floorTopY:-.02
 }))return;
 const owner={
  mode:actor.fullBody.mode,sourceClipName:actor.activeImportedClipName,
  sourceWeight,
  ownerLocomotion:true,sourceThighAxisVerified:true,
  sourceChainVerified:true,sourceInstanceSame:!!actor.assetRoot?.uuid,
  priorSourceProofVerified:priorProof,
  frameInterval:actor.rigSourceSwingFrameInterval??NaN,
  alive:actor.u.hp>0,visible:actor.root.visible,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody.interrupted),
  rootTravel,frameAge,
  side,floorTopY:-.02,previousCorrectionRad:previous,before
 };
 original.copy(upper.bone.quaternion);
 // Severe original-source buried toes need a second, still bounded, true
 // skinned upperleg trial. Restrict the additional +/-90 mrad candidates
 // to an actual >25mm below-stone original weighted toe; never speculate
 // from a rig label, camera frame, target or synthetic gait phase.
 // All four candidates are restored after measurement, and the final pose
 // must independently pass BOTH source shoes' XZ/heel/toe safety checks.
 const severeBurial=swing.toeY<-.045;
 const trials=[];
 // At most FIVE original weighted two-shoe readbacks; never guess an IK foot.
 // A 135mrad follow-up usually needs a previously verified 90mrad thigh.
 // Exception: the actual 33.3ms original-GLB mobile swing may try
 // 45→135mrad only after a SAME-source previous accepted 45mrad pose.
 // Even this candidate changes NOTHING unless live weighted heels/toes
 // of BOTH shoes pass the unchanged post-rotation rollback gates.
 const angles=[-.045,.045];
 if(severeBurial&&Number.isFinite(previous)&&
  Math.abs(previous)>=.044999&&Math.abs(previous)<=.13500001)
  angles.push(Math.sign(previous)*.09);
 const cadenceThighCandidate=severeBurial&&priorProof&&sourceWeight>=.9&&
  Number.isFinite(actor.rigSourceSwingFrameInterval)&&
  actor.rigSourceSwingFrameInterval>=.032&&
  actor.rigSourceSwingFrameInterval<=.05&&
  Math.abs(Math.abs(previous)-.045)<.00001;
 if(severeBurial&&Number.isFinite(previous)&&
  (Math.abs(previous)>=.089&&Math.abs(previous)<=.13500001||
   cadenceThighCandidate))
  angles.push(Math.sign(previous)*.135);
 // At most one extra physical source-foot probe for a genuinely
 // witnessed 45mrad return, including 135→90 without severe burial.
 if(priorProof&&Math.abs(previous)>=.0449){
  const next=Math.sign(previous)*
   Math.max(0,Math.round(Math.abs(previous)*1000)/1000-.045);
  if(!angles.some(n=>Math.abs(n-next)<.0001))angles.push(next);
 }
 try{
  for(const delta of angles){
   upper.bone.quaternion.copy(original).multiply(
    trialQuat.setFromAxisAngle(sourceAxis,delta));
   upper.bone.updateWorldMatrix(true,true);
   trials.push({delta,after:read()});
  }
 }finally{
  upper.bone.quaternion.copy(original);
  upper.bone.updateWorldMatrix(true,true);
 }
 const earlierToeProof=actor.sourceSwingToeCurrentFrameProofs?.[side]??null;
 let selected=chooseOriginalSourceSwingThighSupport({...owner,trials});
 // Never overwrite a valid same-frame ankle/calf receipt with a
 // non-rescue continuity trial. The imported source mixer wins.
 // A source-foot contact phase may temporarily fall below the NEW-rescue
 // 4mm threshold. Preserve an independently measured preceding source joint
 // before attempting a 45mrad release; never retain unmeasured old quats.
 let continuity='rescue';
 // A physically proven previous upperleg may coexist with a new licensed
 // ankle/calf rescue in THIS mixer frame. The hold is accepted only
 // after the actual original GLB heels/toes and the earlier proof are
 // reconciled to final source skin. No fabricated gait or foot lock.
 if(!selected&&priorProof){
  selected=planOriginalSourceSwingThighHold({
   ...owner,priorSourceProofVerified:true,trials
  });
  if(selected)continuity='hold';
  else{
   // The same-frame licensed ankle/calf receipt can coexist with a
   // measured <=45mrad upperleg return only after FINAL original skinned
   // heel/toe reconciliation. Never reset a verified hip by default.
   selected=planOriginalSourceSwingThighEaseOut({
    ...owner,priorSourceProofVerified:true,trials
   });
   if(selected)continuity='release';
  }
 }
 if(!selected)return;
 upper.bone.quaternion.copy(original).multiply(
  trialQuat.setFromAxisAngle(sourceAxis,selected.angleRad));
 upper.bone.updateWorldMatrix(true,true);
 const final=read();
 const verified=continuity==='hold'?
  planOriginalSourceSwingThighHold({...owner,priorSourceProofVerified:true,
   trials:[{delta:selected.angleRad,after:final}]}):
  continuity==='release'?
   planOriginalSourceSwingThighEaseOut({...owner,priorSourceProofVerified:true,
    trials:[{delta:selected.angleRad,after:final}]}):
   chooseOriginalSourceSwingThighSupport({...owner,
    trials:[{delta:selected.angleRad,after:final}]});
 const reconciled=earlierToeProof&&(continuity==='rescue'||continuity==='hold'||continuity==='release')?reconcileOriginalSourceSwingToeProofWithThigh({
  proof:earlierToeProof,side,sourceInstanceId:actor.assetRoot.uuid,
  sourceClipName:actor.activeImportedClipName,floorTopY:-.02,
  before:swing,after:final?.[side],
  thighImprovementMeters:continuity==='release'?
   (final?.[side]?.toeY??NaN)-swing.toeY:
   (verified?.improvementMeters??NaN),
  continuityKind:continuity
 }):null;
 if(!verified||(earlierToeProof&&!reconciled)){
  upper.bone.quaternion.copy(original);
  upper.bone.updateWorldMatrix(true,true);
  return;
 }
 upper.last.multiply(trialQuat);
 upper.swingThighAssistRad=verified.angleRad;
 upper.swingThighAssistSourceInstanceId=actor.assetRoot.uuid;
 upper.swingThighAssistSourceClip=actor.activeImportedClipName;
 if(continuity==='release')actor.sourceSwingThighEaseOutFrames=Math.min(1000000,
  (actor.sourceSwingThighEaseOutFrames||0)+1);
 if(continuity==='hold')actor.sourceSwingThighHoldFrames=Math.min(1000000,
  (actor.sourceSwingThighHoldFrames||0)+1);
 if(reconciled){
  // Same source clone, clip and displayed frame: never invent another toe
  // rescue, just replace the original final-foot receipt with the actual
  // connected ankle/calf+thigh measurement. This is NOT planted-foot IK.
  actor.sourceSwingToeCurrentFrameProofs[side]=reconciled;
  actor.sourceSwingToeLiftProof=reconciled;
 }
 actor.sourceSwingThighCurrentFrameProofs[side]={
  ...verified,priorSupportedAngleRad:previous,
  source:'licensed-Walking_A-original-upperleg-dual-shoe',
  sourceInstanceId:actor.assetRoot.uuid,clipName:actor.activeImportedClipName,
  sourceUpperlegName:upper.bone.name,sourceTrack:axisAudit.trackName,
  sourceAxis:axisAudit.axis,bindLengths:bind,
  before,after:final,originalSourceContactLocked:false
 };
 actor.sourceSwingThighAcceptedFrames=Math.min(1000000,
  (actor.sourceSwingThighAcceptedFrames||0)+1);
}

function stageRigLegsAfterMixer(actor,since,reducedMotion){
 actor.sourceSwingThighCurrentFrameProofs={left:null,right:null};
 actor.sourceStanceKneeCurrentFrameProofs={left:null,right:null};
 actor.sourceStanceKneeProbeOutcomes={left:null,right:null};
 // Source-original weighted ankle trial receipts belong to this frame only.
 if(actor.sourceStanceProbeOutcomes){
  actor.sourceStanceProbeOutcomes.left=null;
  actor.sourceStanceProbeOutcomes.right=null;
 }
 // Original-skin heel/toe receipts are owned by THIS mixer frame, not
 // the accumulated accepted-correction history.
 actor.sourceSwingToeCorrectionsThisFrame=0;
 actor.sourceSwingCalfCurrentFrameMask=0;
 if(actor.sourceStanceSoleCurrentFrameProofs){
  actor.sourceStanceSoleCurrentFrameProofs.left=null;
  actor.sourceStanceSoleCurrentFrameProofs.right=null;
 }
 if(actor.sourceSwingToeCurrentFrameProofs){
  actor.sourceSwingToeCurrentFrameProofs.left=null;
  actor.sourceSwingToeCurrentFrameProofs.right=null;
 }
 if(!actor.rigGaitBones?.length)return;
 const pose=actor.rigLegStride||planRigLegGesture(0,0,true);
 const releaseSupport=actor.rigRangedPose;
 const guardPose=actor.rigGuardPose;
  const nativeLegShare=actor.rigNativeLegOverlayScale??1;
  const footSupport=planConstrainedFootSupport(actor.rigGaitPhase,actor.rigGaitWeight,{
   moving:Boolean(actor.fullBody?.owner.locomotion||actor.rigGaitSettling),teleport:Boolean(actor.locomotionTeleport),
   reducedMotion:reducedMotion||actor.u.hp<=0
  });
 // Never invent a melee target: the app supplies only a grid-validated,
 // unobstructed public facing, and we require exactly one-cell contact.
 const nativeMelee=actor.nativeDuel?.mode&&actor.nativeDuel.mode!=='rest';
 // The source-rig attack's own real planted footwork supersedes the old
 // independent knee/ankle contact brace instead of rubber-stacking it.
 const brace=nativeMelee?NATIVE_MELEE_NO_BRACE:planRigContactBrace(actor.u.kind,actor.fullBody?.owner.duel?'attack':'idle',since,
  actor.animationFacing?.distance,reducedMotion||actor.u.hp<=0);
 // The actual 3-beat public NOVA plants genuine imported leg bones, without
 // additional grid steps or persistent changes to the animation mixer.
 const warningBrace=actor.u.kind==='warden'&&actor.u.hp>0&&!reducedMotion&&actor.fullBody?.owner.warning?
  Math.max(0,Math.min(.24,actor.wardenCharge?.brace??0)):0;
 for(const mount of actor.rigGaitBones){
  const contact=brace[mount.side][mount.part];
  const releaseBrace=actor.u.kind==='warden'&&!reducedMotion&&actor.fullBody?.owner.warning?(actor.wardenStrikePose?.brace??0):0;
  const plant=(warningBrace+releaseBrace)*(mount.part==='upper'?(mount.side==='left'?.72:1):
   mount.part==='lower'?-1.05:.28);
  const nativeContact=actor.nativeDuel?.legs?.[mount.side]?.[mount.part]??0;
  const sourcedReleasePlant=releaseSupport?.legs?.[mount.side]?.[mount.part]??0;
  const angle=Math.max(-.30,Math.min(.30,(pose[mount.side][mount.part]+footSupport[mount.side][mount.part])*nativeLegShare+contact+plant+nativeContact+sourcedReleasePlant+(guardPose?.legs?.[mount.side]?.[mount.part]??0)+(actor.evasionFrame?.legs?.[mount.side]?.[mount.part]??0)));
  // The previous real Chromium native-brace diagnostic reported 0 because
  // it measured only the intentionally suppressed LEGACY contact brace.
  // Measure the actual imported source-rig plant as well, without stacking
  // another strike or fabricating authoritative damage.
  actor.rigContactBracePeak=Math.max(actor.rigContactBracePeak||0,Math.abs(contact+nativeContact));
  // Capture the legal same-owner original base before any ankle/calf probe:
  // a rejected elevated-pelvis trial must NOT leave those source probes on
  // the original mixer at the later restored visual-root position.
  mount.sourceFrameBaseAngleRad=angle;
  // Only genuine imported swing toes may get a bounded reversible lift.
  // This is not a planted-foot solver, authority contact or additional clip.
  const swingToe=planOriginalSourceSwingToeForMountedAnkle(actor,mount,angle,reducedMotion);
  // A source foot cannot be airborne-swing corrected and loaded stance
  // corrected on the same mixer frame. Both use the same original joint.
  const stanceRelief=mount.part==='foot'&&Math.abs(swingToe)<.0001?
   planOriginalSourceStanceForMountedAnkle(actor,mount,angle,reducedMotion):0;
  if(Math.abs(swingToe)>.0001)mount.stanceReliefRad=0;
  const supportedAngle=Math.max(-.30,Math.min(.30,angle+swingToe+stanceRelief));
  mount.next.setFromEuler(mount.euler.set(supportedAngle,0,0,'XYZ'));
  mount.bone.quaternion.multiply(mount.next);
  mount.last.copy(mount.next);
  actor.rigGaitPeak=Math.max(actor.rigGaitPeak||0,Math.abs(angle));
   actor.footSupportPeak=Math.max(actor.footSupportPeak||0,Math.abs(footSupport[mount.side][mount.part]*nativeLegShare));
 }
 // Once the legitimate imported gait and its original ankle/airborne
 // corrections are fully composed, try a separate physically witnessed
 // licensed lowerleg hinge for a still submerged LOADED shoe.
 for(const mount of actor.rigGaitBones)
  if(mount.part==='foot')stageOriginalSourceLoadedKneeForMountedFoot(actor,mount,reducedMotion);
 for(const side of ['left','right'])
  stageOriginalSourceSwingThighAfterMixer(actor,side,reducedMotion);
 // End-of-frame: original knee history survives only on a SAME-SIDE
 // independently verified skinned-toe/heel correction this frame. A missed
 // foot observation cannot impose a stale sign on the next valid source
 // gait. This affects memory, not the current source bone or grid authority.
 for(const mount of actor.rigGaitBones){
  if(mount.part==='lower')
   mount.swingCalfAssistRad=retireOriginalSourceCalfMemory(
    mount.swingCalfAssistRad??0,mount.side,actor.sourceSwingCalfCurrentFrameMask);
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
 const report={segments:0,changedVertices:0,maxShiftRaw:0};
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
  report.changedVertices+=receipt.changed;
  report.maxShiftRaw=Math.max(report.maxShiftRaw,receipt.maxShiftRaw);
 });
 return report;
}
function attachCharacter(actor){
 const asset=selection[actor.u.kind];if(!asset)return Promise.resolve(false);
 const id=actor.u.id;
 const request=load(asset).then(gltf=>{
  if(!gltf||actor.detached||actor.u.id!==id)return false;
  const instance=cloneSkeleton(gltf.scene),owned=[],isBoss=actor.u.kind==='warden';
  configure(instance,actor.u.kind,owned);
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
  actor.visualPivot=pivot;actor.nativeDuel=null;actor.nativeDuelPeak=0;actor.nativeDuelContactFrames=0;actor.motionPeak=0;actor.evasionFrame=null;actor.evasionPosePeak=0;actor.assetRoot=instance;actor.assetMaterials=owned;actor.assetGeometries=[];actor.regaliaParts=0;actor.roleSilhouetteParts=0;actor.anatomicalParts=0;actor.anatomicalJointParts=0;actor.anatomicalDetailMeshes=0;actor.anatomicalStaticMergedParts=0;actor.sculptedArmorProfile=null;actor.sculptedArmorVertices=0;actor.rigBoundAccessoryParts=0;actor.cinematicFigure=null;actor.rigWardrobeParts=0;actor.anatomicalStaticMountedCount=0;actor.nativeArmourRoot=null;actor.nativeArmourMounts=[];actor.nativeArmourInverse=null;actor.rigHandBoneName=null;actor.rigHandBone=null;actor.rigGripAligned=false;actor.rigGripShiftMeters=0;actor.rigGripCandidateMeters=null;actor.rigCranial=null;actor.rigPelvisBone=null;actor.rigPelvisBearing=null;actor.rigBearing=null;actor.rigUpperArms=[];actor.rigGesturePeak=0;actor.wardenChargeShoulderPeak=0;actor.wardenCharge=null;actor.rigForearms=[];actor.rigForearmPeak=0;actor.rigGaitBones=[];actor.rigGaitPosition=null;actor.sourceLoadedPelvisLiftMeters=0;actor.sourceLoadedPelvisAcceptedFrames=0;actor.sourceLoadedPelvisRollbackFrames=0;actor.sourceLoadedPelvisRollbackFootProof=null;actor.sourceLoadedPelvisFrameProof=null;actor.sourceLoadedPelvisCandidate=null;actor.sourceSwingToeWitnessFrames=0;actor.sourceSwingToeDragOpportunityFrames=0;actor.sourceSwingToeLiftProof=null;actor.sourceSwingToeCorrectionsThisFrame=0;actor.sourceSwingToeCurrentFrameProofs=null;actor.sourceSwingCalfAssistFrames=0;actor.sourceSwingCalfAssistProof=null;actor.sourceSwingCalfTrialOutcome=null;actor.rigGaitPhase=0;actor.rigGaitWeight=0;actor.rigGaitSettling=false;actor.rigNativeLegOverlayScale=1;actor.nativeWalkEntryPoseHeld=false;actor.rigGaitPeak=0;actor.rigContactBracePeak=0;actor.rigMeleeBones=[];actor.rigMeleePeak=0;actor.rigMeleeCurrentPeak=0;actor.rigMeleeActive=false;actor.rigRangedActive=false;actor.rigRangedPeak=0;actor.nativeReleaseOwnsUpperBody=false;actor.skinnedHitWeight=0;actor.skinnedHitPeak=0;actor.draperyPanels=[];actor.draperyTriangles=0;actor.draperyPeakDeformationMeters=0;actor.draperyPoseKey=null;actor.draperyFramesSkipped=0;actor.draperyNormalRebuilds=0;actor.draperyVertexUploads=0;
  actor.nativeFigureSculpt=fitOriginalNativeFigure(actor);
  actor.body.visible=false;actor.authored=true;actor.detail?.setAuthored?.(true);actor.mixer=new THREE.AnimationMixer(instance);
  actor.availableClips=gltf.animations||[];actor.currentAction='';actor.currentActionTick=null;actor.activeImportedClipName=null;
   actor.importedClipAudit=auditImportedAnimationClips(actor.availableClips);
   actor.sourceStanceSlideSample=null;actor.sourceStanceSlideReliefProof=null;actor.sourceStanceSlideReliefFrames=0;actor.sourceStanceSlideWarmupFrames=0;actor.sourceStanceSlideSlowWarmupFrames=0;actor.sourceStanceVisualOffset=null;actor.sourceStanceCarryFrames=0;actor.sourceStanceCarryPeakMeters=0;actor.fullBody=null;actor.animationFacing=null;actor.rigGuardPose=null;actor.nativeGuardPeak=0;actor.fullBodyFrozenFrames=0;actor.fullBodyHeldFrames=0;actor.fullBodyContactRecoveryFrames=0;actor.fullBodyInterruptions=0;actor.fullBodyRestarts=0;actor.footSupportPeak=0;actor.sourceClockCorrectedFrames=0;actor.sourceClockDriftPeakSeconds=0;actor.sourceClockRemainingSeconds=0;actor.sourceClockMode=null;
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
  actor.wardenRegaliaRoot=null;actor.wardenRegaliaMounts=[];
  actor.wardenRegaliaInverse=null;actor.wardenRegaliaRiggedParts=0;
  // Original Warden ritual identity sits on the same genuine skinned rig;
  // its authored warning/phase cues and genuine combat choreography survive.
  if(isBoss)addWardenRegalia(actor);
  else if(actor.nativePresentation.complete)addAnatomicalKit(actor);
  changeAction(actor,actor.u.action||'idle');
  // Imported asset-wide bounds include weapons; they are not sole contact.
  // Read two original skinned shoe vertices once in genuine source Idle.
  // The cosmetic pivot moves as a whole, never the actor's authority root.
  actor.sourceGroundAnchor=null;
  if(['idle','guard'].includes(actor.u.action||'idle')&&actor.activeImportedClipName==='Idle'){
   actor.mixer.update(0); // sample source keyframe zero, without aging the clip
   actor.assetRoot.updateMatrixWorld(true);
   const soleCandidates=sourceSoleVertexCandidates(actor);
   const left=sourceSkinnedSoleWorld(soleCandidates.left);
   const right=sourceSkinnedSoleWorld(soleCandidates.right);
   const anchor=planOriginalSourceSoleGrounding({
    mode:actor.u.action||'idle',sourceClipName:actor.activeImportedClipName,
    floorTopY:-.02,floorEvidence:'authored-cube-floor-top',
    parentWorldScaleY:actor.root?.scale?.y,
    leftSoleWorldY:left?.[1],rightSoleWorldY:right?.[1]
   });
   if(anchor){
    pivot.position.y+=anchor.offsetY;
    pivot.updateMatrixWorld(true);
    actor.sourceGroundAnchor=anchor;
   }
  }
  return true;
 }).catch(e=>{failures.add(asset);return false});
 return request;
}
function changeAction(actor,action,forceRestart=false,frameDelta=.016,sourceFrameInterval=frameDelta,sourceFrameVisible=true){
 // The live original 41-joint Walking_A may crossfade from Idle/Guard
 // while interpolation has moved the actual root only a few millimetres.
 // That can swing the licensed shoe mesh far ahead of physical travel.
 // Defer only the SOURCE clip entry, accumulating genuine root travel; never
 // prevent a public movement step, change actor authority or fabricate gait.
 const priorRoot=actor.rigGaitPosition,nowRoot=actor.root?.position;
 const walkingSource=action==='move'&&['idle','guard'].includes(actor.currentAction)&&actor.mixer?
  chooseImportedSourceClip(actor.availableClips,'move',actor.u.kind):null;
 const nativeWalkEntry=planNativeWalkStartFromTravel({
  mode:action,previousMode:actor.currentAction,
  sourceClipName:walkingSource?.name??'',
  groundedMoving:Boolean(actor.fullBody?.owner?.locomotion&&actor.groundedPerformance?.moving),
  groundedTravel:priorRoot&&nowRoot?
   Math.hypot(nowRoot.x-priorRoot.x,nowRoot.z-priorRoot.z):NaN,
  frameInterval:sourceFrameInterval,pendingMeters:actor.nativeWalkEntryPendingMeters??0,
  alive:actor.u?.hp>0,visible:sourceFrameVisible,
  teleport:Boolean(actor.locomotionTeleport),
  reducedMotion:Boolean(actor.fullBody?.reducedMotion),
  interrupted:Boolean(actor.fullBody?.interrupted)
 });
 actor.nativeWalkEntryPendingMeters=nativeWalkEntry.pendingMeters;
 if(nativeWalkEntry.defer)
  actor.nativeWalkEntryDeferredFrames=Math.min(1000000,(actor.nativeWalkEntryDeferredFrames||0)+1);
 if(nativeWalkEntry.defer)return;
 const oneShot=['attack','cast','hurt','defeat'].includes(action);
 let clipSpeed=action==='move'?(actor.groundedPerformance?.clipSpeed??1):1;
 const tick=actor.fullBody?.actionTick??actor.u.actionTick??null;
 const newEvent=shouldRestartImportedOneShot(action,actor.currentAction,actor.currentActionTick,tick,forceRestart);
 if(actor.currentAction!==action)actor.rigGuardPlantHandoff=false;
 // Pending original Walking_A belongs only to this same lawful arrival.
 if(actor.currentAction!==action||newEvent){
  // A lawful new walk may begin while the last licensed walking-to-idle
  // landing still owns its original pelvis and six thigh/calf/ankle joints.
  // Capture only the ORIGINAL source quaternions shown in the prior rendered
  // frame: subtract our tracked, reversible overlays without mutating them.
  actor.walkLandingReentry=null;
  const mounts=actor.rigGaitBones||[],hip=actor.rigPelvisBearing;
  if(action==='move'&&['idle','guard'].includes(actor.currentAction)&&
   actor.walkLandingPose&&mounts.length===6&&hip?.bone?.isBone&&
   mounts.every(m=>m.bone?.isBone&&m.last?.isQuaternion)&&
   actor.fullBody?.owner?.locomotion===true&&actor.groundedPerformance?.moving===true&&
   actor.u.hp>0&&!actor.locomotionTeleport&&!actor.fullBody?.reducedMotion&&
   !actor.fullBody?.interrupted&&sourceFrameVisible){
   const originalQuat=m=>m.bone.quaternion.clone().multiply(m.last.clone().invert());
   actor.walkLandingReentry={previousMode:actor.currentAction,
    elapsed:0,rootTravelMeters:0,witnessedLanding:true,
    pelvis:{bone:hip.bone,quat:originalQuat(hip),
     position:hip.bone.position.clone(),frame:new THREE.Quaternion(),
     framePosition:new THREE.Vector3()},
    legBones:mounts.map(m=>({bone:m.bone,quat:originalQuat(m),
     frame:new THREE.Quaternion()}))};
  }
  actor.walkArrivalPendingAction=null;
  actor.walkLandingPose=null;
  actor.walkLandingCaptureNeeded=false;
 }
 if(actor.currentAction!==action||newEvent)actor.motionPeak=0;
 if(!actor.mixer)return;
 if(actor.currentAction===action&&!newEvent){
  if(action==='move'&&actor.activeClip)actor.activeClip.setEffectiveTimeScale(clipSpeed);
  return;
 }
 const clip=chooseImportedSourceClip(actor.availableClips,action,actor.u.kind);
 if(!clip)return;
 // Retiming the genuine imported one-shot matches the original sword/audio
 // contact envelope instead of each asset independently completing its clip.
 if(oneShot)clipSpeed=planNativeOneShotSpeed(action,clip.duration);
 const next=actor.mixer.clipAction(clip),previous=actor.activeClip;
 // The source-only Idle/Guard owner switch cannot restart the SAME original
 // 41-joint Idle clip. Only the additive guard/neutral pose should transition.
 // Preserve a currently crossfading Idle source weight and animation time.
 if(shouldRetainImportedSharedIdleClock({
  previousMode:actor.currentAction,nextMode:action,
  previousClipName:previous?.getClip?.()?.name,nextClipName:clip.name,
  sameAction:next===previous,sourceRunning:Boolean(previous?.isRunning?.()),
  newEvent
 })){
  actor.activeImportedClipName=clip.name;
  actor.sharedSourceIdleHandoffs=Math.min(1000000,(actor.sharedSourceIdleHandoffs||0)+1);
  actor.currentAction=action;actor.currentActionTick=tick;
  return;
 }
 // Consecutive attacks and different actions may use the same AnimationAction.
 // Restart on a new authoritative action, never on every presentation frame.
 if(next!==previous||newEvent||actor.currentAction!==action){
  next.reset().setEffectiveTimeScale(clipSpeed).setEffectiveWeight(1);
  next.enabled=true;
  next.setLoop(oneShot?THREE.LoopOnce:THREE.LoopRepeat,oneShot?1:Infinity);
  next.clampWhenFinished=oneShot;
  next.play();
  // Late-observed lawful action starts at its witnessed source keyframe.
  // This covers fresh ticks and true interrupt returns without a fake
  // second windup; no continuous clip or unverified hit is ever sought.
  const sourceEntry=planImportedOneShotEntry({
   mode:action,age:actor.fullBody?.mode===action?actor.fullBody.age:NaN,
   sourceDuration:clip.duration,effectiveSpeed:clipSpeed,
   legalTransition:Boolean(newEvent||actor.currentAction!==action),
   reducedMotion:Boolean(actor.fullBody?.reducedMotion)
  });
  if(sourceEntry!==null)next.time=sourceEntry;
  // Walking_A is re-entered after an actual earlier step, not a new character
  // spawn. Preserve the stamped left/right foot parity across combat/guard.
  // Subtract current-frame travel because mixer.update advances it once more.
  const current=actor.root?.position,prior=actor.rigGaitPosition;
  const walkingEntry=planImportedWalkingEntryPhase({
   mode:action,previousMode:actor.currentAction,sourceDuration:clip.duration,
    effectiveSpeed:clipSpeed,frameDelta,frameInterval:sourceFrameInterval,
    visible:sourceFrameVisible,footPhase:actor.groundedPerformance?.footPhase,
   groundedTravel:current&&prior?Math.hypot(current.x-prior.x,current.z-prior.z):NaN,
   groundedMoving:Boolean(actor.fullBody?.owner.locomotion&&actor.groundedPerformance?.moving),
   walkingClip:/(?:walk|run|move)/i.test(clip.name),
   teleport:Boolean(actor.locomotionTeleport),
   reducedMotion:Boolean(actor.fullBody?.reducedMotion)
  });
  if(walkingEntry!==null)next.time=walkingEntry;
  if(previous&&previous!==next){
   next.crossFadeFrom(previous,actor.fullBody?.interrupted ? .09 : (oneShot ? .12 : .23),false);
   // Three.js fades the previous source clip's WEIGHT over elapsed mixer time.
   // On a genuine stopped-to-idle arrival, freeze only its last planted
   // Walking_A keyframe so the skinned ankles cannot treadmill in place while
   // Idle blends in. Never freeze a root that is still physically moving.
   const priorClipName=previous.getClip?.()?.name??'';
   if(planImportedWalkArrivalFreeze({
    previousMode:actor.currentAction,nextMode:action,
    previousClipName:priorClipName,
    groundedMoving:Boolean(actor.groundedPerformance?.moving),
    groundedTravel:current&&prior?Math.hypot(current.x-prior.x,current.z-prior.z):NaN,
    frameInterval:sourceFrameInterval,teleport:Boolean(actor.locomotionTeleport),
    reducedMotion:Boolean(actor.fullBody?.reducedMotion),
    visible:sourceFrameVisible
   })){
    previous.paused=true;
    actor.walkLandingCaptureNeeded=true;
    actor.rigGuardPlantHandoff=action==='guard';
    actor.walkArrivalFrozenActions=Math.min(1000000,(actor.walkArrivalFrozenActions||0)+1);
   }else if(planImportedCombatWalkStop({
    previousMode:actor.currentAction,nextMode:action,
    sourceClipName:priorClipName,actionTick:tick,
    ownerAuthorized:action==='attack'?actor.fullBody?.owner?.duel===true:
     actor.fullBody?.owner?.cast===true,
    groundedMoving:Boolean(actor.groundedPerformance?.moving),
    groundedTravel:current&&prior?Math.hypot(current.x-prior.x,current.z-prior.z):NaN,
    frameInterval:sourceFrameInterval,alive:actor.u.hp>0,
    visible:sourceFrameVisible,teleport:Boolean(actor.locomotionTeleport),
    reducedMotion:Boolean(actor.fullBody?.reducedMotion)
   })){
    previous.paused=true;
    actor.combatWalkStoppedFrames=Math.min(1000000,
     (actor.combatWalkStoppedFrames||0)+1);
   }else if(actor.currentAction==='move'&&['attack','cast'].includes(action)&&
    priorClipName==='Walking_A'&&Number.isSafeInteger(tick)&&
    (action==='attack'?actor.fullBody?.owner?.duel===true:
     actor.fullBody?.owner?.cast===true)&&
    previous.isRunning?.()&&!previous.paused&&
    actor.u.hp>0&&!actor.locomotionTeleport&&!actor.fullBody?.reducedMotion&&
    sourceFrameVisible){
    // A newly witnessed combat event must not freeze a still-moving root.
    // Keep only the fading ORIGINAL Walking_A until a later actual root
    // halt on this SAME combat action tick, never a fabricated foot plant.
    actor.walkArrivalPendingAction={
     sourceAction:previous,targetMode:action,targetTick:tick,combat:true
    };
   }else if(actor.currentAction==='move'&&['idle','guard'].includes(action)&&
    /^(?:walking[_\s-]*a|walk|run)(?:$|[_\s-])/i.test(priorClipName)&&
    previous.isRunning?.()&&!previous.paused&&
    !actor.locomotionTeleport&&!actor.fullBody?.reducedMotion&&sourceFrameVisible){
    // The first source Idle frame can still travel: retain only the fading
    // original Walking_A action until actual (not asserted) root stop.
    actor.walkArrivalPendingAction={sourceAction:previous,targetMode:action};
   }
  }
  actor.activeClip=next;
  actor.activeImportedClipName=clip.name;
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
 if(!group||!mounts?.length||!actor.wardenRegaliaInverse)return;
 group.updateWorldMatrix(true,false);
 const inverse=actor.wardenRegaliaInverse.copy(group.matrixWorld).invert();
 for(const mount of mounts){
  mount.bone.updateWorldMatrix(true,false);
  mount.targetWorld.multiplyMatrices(mount.bone.matrixWorld,mount.bindBoneInverse)
   .multiply(mount.bindGroupWorld);
  mount.stage.matrix.multiplyMatrices(inverse,mount.targetWorld);
  mount.stage.matrixWorldNeedsUpdate=true;
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
 if(actor.nativeDeathSourceActive&&!reducedMotion){actor.skinnedDefeatWeight=1;return;}
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

function updateActor(actor,dt,since=0,reducedMotion=false,sourceFrameInterval=dt,sourceFrameVisible=true){
 if(!actor.authored||!actor.mixer)return;
 // Source-rig toe relief uses the actual visible-frame interval, not capped
 // mixer dt or fabricated authority movement. This is read-only timing.
 actor.rigSourceSwingFrameInterval=sourceFrameInterval;
 // Do not loop walk clips when the authoritative move has already settled.
 actor.fullBody=advanceFullBodyController(actor.fullBody,{
   unit:actor.u,grounded:actor.groundedPerformance,damageBeat:actor.damageBeat,
   evasionBeat:actor.evasionBeat,combatFacing:actor.combatFacing,
   actionAge:since,frameDelta:dt,frameInterval:sourceFrameInterval,visible:sourceFrameVisible,reducedMotion,
    teleport:Boolean(actor.locomotionTeleport)
  });
  if(actor.fullBody.interrupted)actor.fullBodyInterruptions=Math.min(1000000,(actor.fullBodyInterruptions||0)+1);
  if(actor.fullBody.restarted)actor.fullBodyRestarts=Math.min(1000000,(actor.fullBodyRestarts||0)+1);
  const poseAge=actor.fullBody.age;
  // Ranger keeps only a source-verified pose aim through legitimate idle
  // recovery. Do NOT route it to gameplay targets, combat cues or damage.
  actor.animationFacing=actor.fullBody.confirmedContact??actor.fullBody.witnessedRangedAim??actor.combatFacing;
  if(actor.fullBody.holding){
   actor.fullBodyHeldFrames=Math.min(1000000,(actor.fullBodyHeldFrames||0)+1);
   if(actor.fullBody.confirmedContact)actor.fullBodyContactRecoveryFrames=Math.min(1000000,(actor.fullBodyContactRecoveryFrames||0)+1);
  }
  // Only a true HP-zero pose may select original Death_A, then hold its
  // terminal frame. Never stack two native death/overlay performances.
  // No Death_A or reduced motion retains the previous frozen-source fallback.
  const genuineDeath=actor.fullBody.owner.defeat&&!reducedMotion?
   chooseImportedSourceClip(actor.availableClips,'defeat',actor.u.kind):null;
  const deathFinished=Boolean(genuineDeath&&actor.currentAction==='defeat'&&
   actor.activeClip?.getClip?.()===genuineDeath&&
   (actor.activeClip.paused===true||actor.activeClip.time>=genuineDeath.duration-.002));
  const freezeSource=actor.fullBody.owner.defeat&&(!genuineDeath||deathFinished);
  if(!freezeSource)changeAction(actor,actor.fullBody.clipAction,actor.fullBody.restarted,
    dt,sourceFrameInterval,sourceFrameVisible);
  else actor.fullBodyFrozenFrames=Math.min(1000000,(actor.fullBodyFrozenFrames||0)+1);
  actor.nativeDeathSourceActive=Boolean(genuineDeath&&actor.currentAction==='defeat'&&
   actor.activeClip?.getClip?.()===genuineDeath);
 // A visual root may finish moving AFTER its original Walk -> Idle/Guard
 // crossfade starts. Don't pause the outgoing genuine Walking_A while the
 // character still travels, but stop its skinned ankle cycle immediately
 // when a later visible frame witnesses the actual root stop.
 const arrival=actor.walkArrivalPendingAction;
 if(arrival){
  const outgoing=arrival.sourceAction,now=actor.root?.position,then=actor.rigGaitPosition;
  const remaining=now&&then?Math.hypot(now.x-then.x,now.z-then.z):NaN;
  const sourceStopEvidence={
   targetMode:arrival.targetMode,currentMode:actor.fullBody.mode,
   clipName:outgoing.getClip?.()?.name??'',
   sourceWeight:outgoing.getEffectiveWeight?.()??NaN,
   sourceRunning:Boolean(outgoing.isRunning?.()),sourcePaused:Boolean(outgoing.paused),
   groundedMoving:Boolean(actor.groundedPerformance?.moving),
   groundedTravel:remaining,frameInterval:sourceFrameInterval,
   alive:actor.u.hp>0,visible:sourceFrameVisible,
   teleport:Boolean(actor.locomotionTeleport),reducedMotion
  };
  const confirmedSourceStop=arrival.combat===true?
   shouldFreezeDeferredImportedCombatWalk({
    ...sourceStopEvidence,targetTick:arrival.targetTick,
    currentTick:actor.fullBody?.actionTick,
    ownerAuthorized:arrival.targetMode==='attack'?
     actor.fullBody?.owner?.duel===true:actor.fullBody?.owner?.cast===true
   }):shouldFreezeDeferredImportedWalk(sourceStopEvidence);
  if(confirmedSourceStop){
   outgoing.paused=true;
   // Combat owns its own licensed full-body attack/cast leg poses; do not
   // create the separate idle/guard landing bridge under that source action.
   actor.walkLandingCaptureNeeded=arrival.combat!==true;
   if(arrival.combat===true)actor.combatWalkStoppedFrames=Math.min(1000000,
    (actor.combatWalkStoppedFrames||0)+1);
   actor.rigGuardPlantHandoff=arrival.targetMode==='guard';
   actor.walkArrivalPendingAction=null;
   actor.walkArrivalFrozenActions=Math.min(1000000,(actor.walkArrivalFrozenActions||0)+1);
   actor.walkArrivalDeferredStops=Math.min(1000000,(actor.walkArrivalDeferredStops||0)+1);
  }else if(actor.fullBody.mode!==arrival.targetMode||
   (arrival.combat===true&&actor.fullBody?.actionTick!==arrival.targetTick)||
   actor.u.hp<=0||actor.locomotionTeleport||reducedMotion||!sourceFrameVisible||
   !outgoing.isRunning?.()||outgoing.paused||
   !(outgoing.getEffectiveWeight?.()>0)){
   // Retire stale source references at actual fade completion/interruptions.
   actor.walkArrivalPendingAction=null;
  }
 }
 restoreRigArmsBeforeMixer(actor);
 restoreRigForearmsBeforeMixer(actor);
 restoreRigLegsBeforeMixer(actor);
 restoreRigMeleeBeforeMixer(actor);
 restoreRigCranialBeforeMixer(actor);
 restoreRigPelvisBeforeMixer(actor);
 // Capture the REAL source Walking_A landing pose only after last frame's
 // reversible thigh/calf/ankle overlays have been removed. This is not
 // inferred from a server move label or an invented plant location.
 if(actor.walkLandingCaptureNeeded){
  actor.walkLandingCaptureNeeded=false;
  const mounts=actor.rigGaitBones||[];
  const complete=mounts.length===6&&['left','right'].every(side=>
   ['upper','lower','foot'].every(part=>mounts.some(m=>
    m.side===side&&m.part===part&&m.bone?.isBone)));
  // The original hips are parent to both skinned leg chains: stopping six
  // descendants alone can lift weighted soles when Idle moves their parent.
  const pelvisBone=actor.rigPelvisBone?.isBone?actor.rigPelvisBone:null;
  if(complete&&pelvisBone){
   actor.walkLandingPose={elapsed:0,sourceWalkFrozen:true,
    pelvis:{bone:pelvisBone,quat:pelvisBone.quaternion.clone(),
     position:pelvisBone.position.clone(),idleQuat:new THREE.Quaternion(),
     idlePosition:new THREE.Vector3()},
    legBones:mounts.map(m=>({bone:m.bone,quat:m.bone.quaternion.clone(),
     frame:new THREE.Quaternion()}))};
  }
 }
 // Align source GLB to the same witnessed action-age clock as original
 // skinned hip, torso, shoulder, wrist, ankle and reactive fabric layers.
 const sourceClip=actor.activeClip?.getClip?.();
 const originalStep={
  mode:actor.fullBody.mode,age:poseAge,sourceTime:actor.activeClip?.time??0,
  sourceDuration:sourceClip?.duration??0,
  effectiveSpeed:actor.activeClip?.getEffectiveTimeScale?.()??1,
  frameDelta:dt,frameInterval:sourceFrameInterval,
  reducedMotion,visible:sourceFrameVisible,
  // The same real root displacement is consumed by stageRigGroundedStride.
  groundedTravel:actor.root&&actor.rigGaitPosition?
   Math.hypot(actor.root.position.x-actor.rigGaitPosition.x,
    actor.root.position.z-actor.rigGaitPosition.z):0,
  groundedMoving:Boolean(actor.fullBody?.owner.locomotion&&actor.groundedPerformance?.moving),
  walkingClip:/(?:walk|run|move)/i.test(actor.activeImportedClipName||''),
  teleport:Boolean(actor.locomotionTeleport)
 };
 const sourceStep=freezeSource?0:actor.fullBody.mode==='defeat'?
  planImportedDeathSourceStep(originalStep):planImportedLivingSourceStep(originalStep);
 // On an actual large movement frame the licensed cycle may be capped at
 // 280ms while the genuine grounded footfall advanced a larger distance.
 // Reconcile ONLY a validated shortfall in ongoing walking, once, before
 // the mixer consumes the original source step. No idle treadmill or IK.
 const continuousWalk=planImportedWalkingContinuity({...originalStep,sourceStep,
  continuous:Boolean(!actor.fullBody.changed&&actor.currentAction==='move'),
  footPhase:actor.groundedPerformance?.footPhase});
 if(continuousWalk!==null&&actor.activeClip){
  const former=actor.activeClip.time;
  actor.activeClip.time=continuousWalk;
  actor.walkingPhaseReconciledFrames=Math.min(1000000,(actor.walkingPhaseReconciledFrames||0)+1);
  const clipSeconds=originalStep.sourceDuration||1;
  actor.walkingPhaseReconciledPeakCycles=Math.max(actor.walkingPhaseReconciledPeakCycles||0,
   ((continuousWalk-former)/clipSeconds+1)%1);
 }
 if(actor.fullBody.mode==='move'&&sourceStep>Math.min(.05,dt)+.005)
  actor.walkingSourceCatchupFrames=Math.min(1000000,(actor.walkingSourceCatchupFrames||0)+1);
 const sourceSync=!freezeSource&&sourceClip?planImportedOneShotPhase({
  mode:actor.fullBody.mode,actionTick:actor.fullBody.actionTick,age:poseAge,
  sourceTime:actor.activeClip.time,sourceDuration:sourceClip.duration,
  effectiveSpeed:actor.activeClip.getEffectiveTimeScale(),frameDelta:sourceStep,
  reducedMotion
 }):null;
 if(sourceSync?.valid){
  actor.sourceClockDriftPeakSeconds=Math.max(actor.sourceClockDriftPeakSeconds||0,Math.abs(sourceSync.driftSeconds));
  if(sourceSync.align){
   actor.activeClip.time=sourceSync.startTime;
   actor.sourceClockCorrectedFrames=Math.min(1000000,(actor.sourceClockCorrectedFrames||0)+1);
  }
 }
 // The original source foot-cycle advances by measured root metres; mixer
 // crossfades must independently advance in real bounded visible seconds.
 // Temporarily retime ONLY the active licensed walk action, restoring its
 // normal speed immediately after the single mixer update.
 // Sparse genuine WebGL frame delivery must not stretch the original
 // Idle -> Walking_A owner fade across seconds. The mixer may advance up
 // to 90ms of verified visible fade time, independently of the real
 // root-distance-paced licensed shoe action. Both clocks use one frame.
 const walkMixerDelta=planImportedWalkingMixerFrameDelta({...originalStep,sourceStep});
 const walkingBlendRate=planImportedWalkingBlendRate({...originalStep,sourceStep});
 // Positive HP-loss grants the same exclusive native source-fade treatment:
 // only Hit_A's crossfade weights advance on bounded visible time; original
 // injury bones still obey their independently witnessed action age.
 const injuryFrame=walkingBlendRate===null?planImportedWitnessedHurtMixerFrame({
  ...originalStep,sourceStep,
  sourceClipName:actor.activeImportedClipName,
  verifiedInjury:actor.fullBody?.owner?.injury===true
 }):null;
 // Decelerate the exiting LICENSED Walking_A as genuine root motion ends,
 // without slowing the one Three.js mixer clock or the incoming Idle/Guard.
 const exit=actor.walkArrivalPendingAction;
 const outgoing=exit?.sourceAction;
 const walkExitRate=outgoing?planImportedWalkExitBrake({
  targetMode:exit.targetMode,currentMode:actor.fullBody.mode,
  clipName:outgoing.getClip?.()?.name??'',
  sourceWeight:outgoing.getEffectiveWeight?.()??NaN,
  sourceRunning:Boolean(outgoing.isRunning?.()),sourcePaused:Boolean(outgoing.paused),
  groundedTravel:originalStep.groundedTravel,frameInterval:sourceFrameInterval,
  alive:actor.u.hp>0,visible:sourceFrameVisible,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion
 }):null;
 const priorWalkSpeed=walkExitRate!==null&&
  Number.isFinite(outgoing?.getEffectiveTimeScale?.())&&
  outgoing.getEffectiveTimeScale()>0?outgoing.getEffectiveTimeScale():null;
 actor.walkArrivalExitRate=priorWalkSpeed!==null?walkExitRate:null;
 if(priorWalkSpeed!==null){
  outgoing.setEffectiveTimeScale(priorWalkSpeed*walkExitRate);
  actor.walkArrivalBrakedFrames=Math.min(1000000,(actor.walkArrivalBrakedFrames||0)+1);
 }
 try{
  if(walkingBlendRate===null){
   if(injuryFrame&&actor.activeClip){
    const normalScale=actor.activeClip.getEffectiveTimeScale();
    actor.activeClip.setEffectiveTimeScale(normalScale*injuryFrame.actionScale);
    try{actor.mixer.update(injuryFrame.mixerDelta);}
    finally{actor.activeClip.setEffectiveTimeScale(normalScale);}
   }else{
    actor.mixer.update(sourceStep);
   }
  }else{
   const normalScale=actor.activeClip.getEffectiveTimeScale();
   actor.activeClip.setEffectiveTimeScale(normalScale*walkingBlendRate);
   try{actor.mixer.update(walkMixerDelta);}
   finally{actor.activeClip.setEffectiveTimeScale(normalScale);}
  }
 }finally{
  if(priorWalkSpeed!==null)outgoing.setEffectiveTimeScale(priorWalkSpeed);
 }
 // The original Idle mixer can still rotate a paused Walking_A shoe by
 // blending its skinned thigh, knee and ankle tracks toward Idle. Release
 // those six authentic imported joints from the actually observed source
 // landing pose, bounded to 200ms. Shoulder/hand/weapon clips and the
 // incoming Idle fade remain authored and unmodified.
 const landing=actor.walkLandingPose;
 if(landing){
  const root=actor.root?.position,prior=actor.rigGaitPosition;
  const rootTravel=root&&prior?Math.hypot(root.x-prior.x,root.z-prior.z):NaN;
  const release=planSourceRigLandingRelease({
   mode:actor.fullBody.mode,sourceClipName:actor.activeImportedClipName,
   sourceWalkFrozen:landing.sourceWalkFrozen,rootTravel,
   frameInterval:sourceFrameInterval,elapsed:landing.elapsed,moving:Boolean(actor.groundedPerformance?.moving),
   visible:sourceFrameVisible,alive:actor.u.hp>0,
   teleport:Boolean(actor.locomotionTeleport),reducedMotion,
   interrupted:Boolean(actor.fullBody.interrupted)
  });
  if(release===null){actor.walkLandingPose=null;}
  else{
   const pelvis=landing.pelvis,sourceScale=actor.assetRoot?.scale?.y;
   const pelvisRelease=pelvis?planSourceRigLandingPelvisSupport({
    release,sourcePelvis:pelvis.bone?.isBone===true&&
     Number.isFinite(sourceScale)&&sourceScale>0,
    localTravelMeters:pelvis.bone.position.distanceTo(pelvis.position)*sourceScale,
    angularTravelRadians:pelvis.quat.angleTo(pelvis.bone.quaternion)
   }):null;
   // An invalid parent transform must not strand a separately frozen knee.
   if(pelvisRelease===null){
    actor.walkLandingPose=null;
    actor.walkLandingPelvisRejectedFrames=Math.min(1000000,
     (actor.walkLandingPelvisRejectedFrames||0)+1);
   }else{
    pelvis.idlePosition.copy(pelvis.bone.position);
    pelvis.idleQuat.copy(pelvis.bone.quaternion);
    pelvis.bone.position.copy(pelvis.position).lerp(pelvis.idlePosition,pelvisRelease);
    pelvis.bone.quaternion.copy(pelvis.quat).slerp(pelvis.idleQuat,pelvisRelease);
    for(const item of landing.legBones){
     item.frame.copy(item.bone.quaternion);
     item.bone.quaternion.copy(item.quat).slerp(item.frame,release);
    }
    actor.walkLandingPelvisFrames=Math.min(1000000,
     (actor.walkLandingPelvisFrames||0)+1);
    actor.walkLandingFrames=Math.min(1000000,(actor.walkLandingFrames||0)+1);
    landing.elapsed=Math.min(2,landing.elapsed+planNativeLandingVisibleDelta({
      frameDelta:dt,frameInterval:sourceFrameInterval,visible:sourceFrameVisible,
      reducedMotion,teleport:Boolean(actor.locomotionTeleport)
     }));
    if(release>=1)actor.walkLandingPose=null;
   }
  }
 }
 // A previously witnessed stopped original pose must rejoin the real
 // Walking_A cycle without an abrupt next-frame source shoe snap.
 // Release under 120ms OR 120mm cumulative actual XZ root travel.
 const reentry=actor.walkLandingReentry;
 if(reentry){
  const root=actor.root?.position,prior=actor.rigGaitPosition;
  const travel=root&&prior?Math.hypot(root.x-prior.x,root.z-prior.z):NaN;
  if(Number.isFinite(travel)&&travel>=0)
   reentry.rootTravelMeters=Math.min(.5,reentry.rootTravelMeters+travel);
  const release=planSourceRigWalkReentryRelease({
   mode:actor.fullBody.mode,previousMode:reentry.previousMode,
   sourceClipName:actor.activeImportedClipName||'',
   witnessedLanding:reentry.witnessedLanding,
   elapsed:reentry.elapsed,rootTravelMeters:reentry.rootTravelMeters,
   sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
   moving:Boolean(actor.groundedPerformance?.moving),alive:actor.u.hp>0,
   visible:sourceFrameVisible,teleport:Boolean(actor.locomotionTeleport),
   reducedMotion,interrupted:Boolean(actor.fullBody.interrupted)
  });
  if(release===null||release>=1){
   actor.walkLandingReentry=null;
  }else{
   const hip=reentry.pelvis,scale=actor.assetRoot?.scale?.y;
   const safe=Number.isFinite(scale)&&scale>0&&hip.bone?.isBone&&
    hip.bone.position.distanceTo(hip.position)*scale<=.09&&
    hip.quat.angleTo(hip.bone.quaternion)<=.55&&
    reentry.legBones.length===6&&reentry.legBones.every(item=>
     item.bone?.isBone&&item.quat.angleTo(item.bone.quaternion)<=1.1);
   if(!safe){
    actor.walkLandingReentry=null;
    actor.walkLandingReentryRejectedFrames=Math.min(1000000,
     (actor.walkLandingReentryRejectedFrames||0)+1);
   }else{
    hip.framePosition.copy(hip.bone.position);
    hip.frame.copy(hip.bone.quaternion);
    hip.bone.position.copy(hip.position).lerp(hip.framePosition,release);
    hip.bone.quaternion.copy(hip.quat).slerp(hip.frame,release);
    for(const item of reentry.legBones){
     item.frame.copy(item.bone.quaternion);
     item.bone.quaternion.copy(item.quat).slerp(item.frame,release);
    }
    actor.walkLandingReentryFrames=Math.min(1000000,
     (actor.walkLandingReentryFrames||0)+1);
    reentry.elapsed=Math.min(.5,reentry.elapsed+planNativeLandingVisibleDelta({
      frameDelta:dt,frameInterval:sourceFrameInterval,visible:sourceFrameVisible,
      reducedMotion,teleport:Boolean(actor.locomotionTeleport)
     }));
   }
  }
 }
 // Read real original clip ownership AFTER the one AnimationMixer update.
 const releaseClip=actor.activeClip?.getClip?.();
 actor.nativeReleaseOwnsUpperBody=Boolean(releaseClip&&
  actor.activeImportedClipName===releaseClip.name&&
  actor.currentAction===actor.fullBody.mode&&
  ownsImportedRangedUpperBody(actor.u.kind,actor.fullBody.mode,releaseClip.name,
   actor.activeClip?.getEffectiveWeight?.()??NaN,reducedMotion||actor.u.hp<=0));
 // Pelvis, thighs, calves, ankles, original torso and shoulders share ONE
 // authenticated source clip release clock (and ONE reversible mixer frame).
 // No source owner, verified hurt, evade, death or accessibility transition
 // can continue an obsolete plant or cast a false spell/arrow.
 actor.rigRangedPose=planRangedBodyPose(actor.u.kind,
  actor.nativeReleaseOwnsUpperBody?actor.fullBody.mode:'idle',poseAge,
  actor.animationFacing?.distance,actor.animationFacing?.targetId,
  reducedMotion||actor.u.hp<=0,actor.activeClip?.getEffectiveWeight?.()??NaN);
 actor.rigRangedSupportPeak=Math.max(actor.rigRangedSupportPeak||0,
  Math.abs(actor.rigRangedPose.hips.pitch),
  Math.abs(actor.rigRangedPose.legs.left.upper),
  Math.abs(actor.rigRangedPose.legs.left.lower),
  Math.abs(actor.rigRangedPose.legs.right.upper),
  Math.abs(actor.rigRangedPose.legs.right.lower));
 if(sourceSync?.valid){
  actor.sourceClockRemainingSeconds=Math.abs(sourceSync.remainingSeconds);
  actor.sourceClockMode=actor.fullBody.mode;
 }else{actor.sourceClockRemainingSeconds=0;actor.sourceClockMode=null;}
 // A witnessed local sword action now carries an original, single coherent
 // pose across the genuine skinned head, hips, torso, arms, wrist and feet.
 actor.nativeDuel=planNativeDuelPose(actor.u.kind,actor.fullBody.owner.duel?'attack':'idle',poseAge,{
  targetId:actor.animationFacing?.targetId,distance:actor.animationFacing?.distance,
  alive:actor.u.hp>0,reducedMotion,
  sourceBlend:actor.activeClip?.getEffectiveWeight?.()??NaN
 });
 actor.nativeDuelPeak=Math.max(actor.nativeDuelPeak||0,actor.nativeDuel.strength);
 if(actor.nativeDuel.contactWeight>.65)actor.nativeDuelContactFrames=Math.min(1000000,(actor.nativeDuelContactFrames||0)+1);
 actor.performanceBeat=planCombatPerformanceBeat(actor.u.kind,actor.nativeReleaseOwnsUpperBody?'idle':
  actor.fullBody.owner.duel?'attack':'idle',poseAge,{
  targetId:actor.animationFacing?.targetId,distance:actor.animationFacing?.distance,
  alive:actor.u.hp>0,reducedMotion
 });
 actor.evasionFrame=planEvasionPerformance(actor.u.kind,actor.evasionBeat?.age,actor.fullBody.owner.evasion?actor.evasionBeat:null,
  {reducedMotion:reducedMotion||actor.u.hp<=0,yaw:actor.root?.rotation?.y??0});
 actor.evasionPosePeak=Math.max(actor.evasionPosePeak||0,actor.evasionFrame.strength);
 actor.rigBearing=planRigBearing(actor.u.kind,actor.u.hp,actor.u.maxHp,
   actor.fullBody.mode==='guard'?'idle':actor.fullBody.mode,
   ['idle','move','guard'].includes(actor.fullBody.mode)?since:actor.fullBody.age,
   actor.animationFacing?.distance,reducedMotion||actor.u.hp<=0);
 // One valid owner drives a connected post-mixer source-rig defensive stance
 // through six original legs/feet, original torso/head and both hand chains.
 actor.rigGuardPose=planNativeGuardPose(actor.fullBody?.guardBlend??0,reducedMotion||actor.u.hp<=0);
 actor.nativeGuardPeak=Math.max(actor.nativeGuardPeak||0,
  actor.rigGuardPose.elbows.right,Math.abs(actor.rigGuardPose.legs.left.lower));
 stageRigGroundedStride(actor,reducedMotion,dt,sourceFrameInterval,sourceFrameVisible);
 // Compose this frame's read-only full-body root BEFORE measuring original
 // licensed GLB skinned feet, knee/ankle clearances, stance or swing contacts.
 // Previously the source test used the last frame's pivot while the rendered
 // pose moved later, producing physically stale world-space evidence.
 if(actor.visualPivot){
  // A single unified physical sword phrase owns root translation when live.
  // Legacy pivot lunge + contact recoil + secondary lunge must NOT accumulate
  // over the genuine bone-planted stance (which already owns this weight shift).
  const nativeMelee=actor.nativeDuel?.mode&&actor.nativeDuel.mode!=='rest';
  const blocking=actor.fullBody.owner.injury||actor.fullBody.owner.defeat||actor.fullBody.owner.evasion;
   const pose=nativeMelee||blocking?NATIVE_MELEE_NO_ROOT:
    planAuthoredMotion(actor.u.kind,actor.fullBody.mode,poseAge,reducedMotion);
  const contact=nativeMelee||blocking?NATIVE_MELEE_NO_ROOT:
    planContactBodyLanguage(actor.u.kind,actor.fullBody.mode,poseAge,{
    targetId:actor.animationFacing?.targetId,distance:actor.animationFacing?.distance,
    reducedMotion:reducedMotion||actor.u.hp<=0
   });
  const beat=nativeMelee||blocking?NATIVE_MELEE_NO_ROOT:actor.performanceBeat.root,
   dodge=actor.evasionFrame.root,native=actor.nativeDuel?.root;
  const ground=actor.fullBody.owner.locomotion?actor.groundedPerformance:null;
  // Do not erase the already witnessed loaded-shoe correction when the
  // original visual pivot is freshly composed on the next display frame.
  // Fade only the same licensed clone's Walking_A position over <=150ms.
  const carry=planOriginalSourceStanceReliefCarry({
   previous:actor.sourceStanceVisualOffset,
   sourceInstanceId:actor.assetRoot?.uuid,
   sourceClipName:actor.activeImportedClipName,
   sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
   mode:actor.fullBody.mode,ownerLocomotion:actor.fullBody.owner.locomotion,
   recentRootTravel:actor.rigRecentGroundedTravel,
   recentTravelAge:actor.rigRecentGroundedAge,
   rootYaw:actor.root?.rotation?.y,
   frameInterval:sourceFrameInterval,
   alive:actor.u.hp>0,visible:actor.root?.visible===true&&sourceFrameVisible===true,
   teleport:Boolean(actor.locomotionTeleport),reducedMotion,
   interrupted:Boolean(actor.fullBody?.interrupted)
  });
  actor.sourceStanceVisualOffset=carry;
  if(carry){
   actor.sourceStanceCarryFrames=Math.min(1000000,(actor.sourceStanceCarryFrames||0)+1);
   actor.sourceStanceCarryPeakMeters=Math.max(actor.sourceStanceCarryPeakMeters||0,
    Math.hypot(carry.x,carry.z));
  }
  actor.visualPivot.position.set(pose.x+contact.x+beat.x+dodge.x+(native?.x??0)+(carry?.x??0),
   composeOriginalSourceGroundedPivotY(pose.y+contact.y+beat.y+dodge.y+(native?.y??0)+(ground?.bodyLift??0),actor.sourceGroundAnchor),pose.z+contact.z+beat.z+dodge.z+(native?.z??0)+(carry?.z??0));
  // Real visible travel adds a restrained forward weight shift atop the
  // imported animation, without moving attack hitboxes or the authority grid.
  actor.visualPivot.rotation.set(pose.pitch+contact.pitch+beat.pitch+dodge.pitch+
   (actor.locomotionTilt||0)+(ground?.bodyPitch??0),contact.yaw,
   pose.roll+contact.roll+beat.roll+dodge.roll+(ground?.bodyRoll??0));
  actor.contactBodyPeakMeters=Math.max(actor.contactBodyPeakMeters||0,Math.hypot(contact.x+beat.x,contact.y+beat.y,contact.z+beat.z));
  actor.performanceBeatPeak=Math.max(actor.performanceBeatPeak||0,actor.performanceBeat.strength);
  actor.motionPeak=Math.max(actor.motionPeak||0,Math.abs(pose.x+contact.x),
   Math.abs(pose.y+contact.y),Math.abs(pose.z+contact.z));
  // World-space original heel/toe trials below must sample THIS frame's
  // fully composed physical root, not the previous rAF's world matrix.
  // updateMatrixWorld on a child alone does not refresh dirty ancestors.
  actor.visualPivot.updateWorldMatrix(true,false);
 }

 stageRigCranialAfterMixer(actor);
 stageRigPelvisAfterMixer(actor);
 stageRigArmsAfterMixer(actor,poseAge,reducedMotion);
 stageRigForearmsAfterMixer(actor,poseAge,reducedMotion);
 stageSourceLoadedPelvisBeforeLegs(actor,reducedMotion);
 stageRigLegsAfterMixer(actor,poseAge,reducedMotion);
 auditSourceLoadedPelvisAfterLegs(actor,poseAge,reducedMotion);
 stageRigMeleeAfterMixer(actor,poseAge,reducedMotion,sourceFrameInterval,sourceFrameVisible);
 stageRigRangedAfterMixer(actor,poseAge,reducedMotion);
 stageSkinnedHitAfterMixer(actor,reducedMotion);
 stageSkinnedDefeatAfterMixer(actor,reducedMotion);
 stageWardenChapterRegalia(actor,reducedMotion);
 stageOriginalSourceStanceSlideAfterMixer(actor,reducedMotion,sourceFrameInterval,sourceFrameVisible);
 if(actor.draperyPanels?.length){
  const clothAction=actor.fullBody?.mode??actor.u.action??'idle';
   const clothAge=actor.fullBody?.holding||actor.fullBody?.owner.injury||actor.fullBody?.owner.evasion?poseAge:since;
   const poseKey=drapePoseKey(clothAction,clothAge,reducedMotion);
  if(poseKey!==actor.draperyPoseKey){
   actor.draperyPoseKey=poseKey;
   const sway=planDrapeSwing(clothAction,clothAge,reducedMotion);
   actor.draperyPeakDeformationMeters=0;
   for(const p of actor.draperyPanels){
    p.mesh.rotation.x=sway.pitch;p.mesh.rotation.z=sway.roll*p.side;
    // Only a genuinely new sampled cloth pose needs CPU vertex and normal
    // recomputation or a GPU buffer upload. Every still/reduced-motion frame
    // reuses the existing exact geometry; no simulation clock is touched.
    const position=p.mesh.geometry.getAttribute('position');
    for(let row=0;row<=DRAPE_ROWS;row++)for(let col=0;col<=DRAPE_COLUMNS;col++){
     const index=row*(DRAPE_COLUMNS+1)+col,offset=index*3;
     const bend=planDrapeVertexBend(row/DRAPE_ROWS,col/DRAPE_COLUMNS,clothAction,clothAge,reducedMotion);
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
/**
 * Same-clone, same licensed Walking_A original weighted stance comparison.
 * Unlike foot-lock IK, this can only reduce an OBSERVED displayed-frame skid
 * by <=18mm, and then remeasures the rendered source shoe. The preceding
 * frame is a real previously displayed original source pose, never an
 * inferred future landing target. No root authority or original bone edits.
 */
function stageOriginalSourceStanceSlideAfterMixer(actor,reducedMotion,frameInterval,visible){
 const previous=actor.sourceStanceSlideSample;
 actor.sourceStanceSlideSample=null;
 actor.sourceStanceSlideReliefProof=null;
 const valid=actor.fullBody?.mode==='move'&&actor.fullBody?.owner?.locomotion===true&&
  actor.activeImportedClipName==='Walking_A'&&actor.u.hp>0&&
  actor.root?.visible===true&&visible===true&&!reducedMotion&&
  !actor.locomotionTeleport&&!actor.fullBody?.interrupted&&
  actor.assetRoot&&actor.visualPivot&&
  Number.isFinite(actor.rigLastGroundedTravel)&&
  actor.rigLastGroundedTravel>=0&&actor.rigLastGroundedTravel<=.18;
 if(!valid)return;
 const patches=sourceSolePatchVertexCandidates(actor);
 if(!['left','right'].every(side=>patches?.[side]?.anatomicalHeelToeVerified&&
  patches[side].sourceToeAxis?.selectedAnatomicalPatch===true&&
  patches[side].heel?.mesh===patches[side].toe?.mesh))return;
 const sampleEvidence={
  mode:actor.fullBody.mode,sourceClipName:actor.activeImportedClipName,
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
  ownerLocomotion:actor.fullBody.owner.locomotion,
  rootTravel:actor.rigLastGroundedTravel,frameInterval,
  changed:actor.fullBody.changed,
  alive:actor.u.hp>0,visible:actor.root.visible===true&&visible===true,
  teleport:Boolean(actor.locomotionTeleport),reducedMotion,
  interrupted:Boolean(actor.fullBody.interrupted),
  sourceAnatomyVerified:true
 };
 const handoff=planOriginalSourceStanceSampleHandoff(sampleEvidence)||
  planOriginalSourceStanceSlowFramePrime(sampleEvidence);
 if(!handoff)return;
 const read=()=>Object.fromEntries(['left','right'].map(side=>[
  side,{heel:sourceSkinnedSoleWorld(patches[side].heel),
   toe:sourceSkinnedSoleWorld(patches[side].toe)}
 ]));
 actor.assetRoot.updateWorldMatrix(true,true);
 let current=read();
 const sourceInstanceId=actor.assetRoot.uuid;
 // A new legal tick never compares a pre-transition shoe against a
 // newly owned source pose; it only primes an honest, current-frame sample.
 const ownerValid=handoff.allowRelief&&
  previous?.sourceInstanceId===sourceInstanceId&&
  previous?.clip==='Walking_A';
 const proposal=ownerValid?planOriginalSourceStanceSlideRelief({
  mode:actor.fullBody.mode,sourceClipName:actor.activeImportedClipName,
  sourceWeight:actor.activeClip?.getEffectiveWeight?.()??NaN,
  sourceInstanceSame:true,ownerLocomotion:true,
  rootTravel:actor.rigLastGroundedTravel,
  recentRootTravel:actor.rigRecentGroundedTravel,
  recentTravelAge:actor.rigRecentGroundedAge,frameInterval,
  previousRootYaw:previous.rootYaw,currentRootYaw:actor.root.rotation.y,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,floorTopY:-.02,previous:previous?.feet,current
 }):null;
 if(proposal){
  const pivot=actor.visualPivot,baseX=pivot.position.x,baseZ=pivot.position.z;
  const parent=pivot.parent,rotate=parent?.getWorldQuaternion?.(new THREE.Quaternion());
  if(rotate?.isQuaternion){
   const local=new THREE.Vector3(proposal.worldDeltaX,0,
    proposal.worldDeltaZ).applyQuaternion(rotate.invert());
   // Preserve visual root height and never change physics/root coordinates.
   // The accumulated local presentation offset must never exceed the
   // independently measured original single-frame 18mm relief allowance.
   const priorX=actor.sourceStanceVisualOffset?.x??0;
   const priorZ=actor.sourceStanceVisualOffset?.z??0;
   const desired={x:priorX+local.x,z:priorZ+local.z};
   const total=Math.hypot(desired.x,desired.z);
   const target=total>.018?{x:desired.x*.018/total,
    z:desired.z*.018/total}:desired;
   const deltaX=target.x-priorX,deltaZ=target.z-priorZ;
   if([local.x,local.y,local.z,deltaX,deltaZ].every(Number.isFinite)&&
    Math.hypot(local.x,local.z)<=.025&&
    Math.hypot(deltaX,deltaZ)>=.004&&Math.hypot(deltaX,deltaZ)<=.0180001){
    pivot.position.x=baseX+deltaX;pivot.position.z=baseZ+deltaZ;
    pivot.updateWorldMatrix(true,true);
    const adjusted=read(),side=proposal.side;
    const displacement=(a,b)=>a&&b?Math.hypot(
     a[0]-b[0],a[2]-b[2]):NaN;
    const oldHeel=displacement(current[side]?.heel,previous.feet[side]?.heel);
    const oldToe=displacement(current[side]?.toe,previous.feet[side]?.toe);
    const newHeel=displacement(adjusted[side]?.heel,previous.feet[side]?.heel);
    const newToe=displacement(adjusted[side]?.toe,previous.feet[side]?.toe);
    const shifted=displacement(current[side]?.heel,adjusted[side]?.heel);
    const safe=[oldHeel,oldToe,newHeel,newToe,shifted].every(Number.isFinite)&&
     shifted<=.020&&oldHeel-newHeel>=.004&&oldToe-newToe>=.004&&
     ['left','right'].every(s=>['heel','toe'].every(edge=>
      current[s]?.[edge]&&adjusted[s]?.[edge]&&
      Number.isFinite(adjusted[s][edge][1])&&
      Math.abs(adjusted[s][edge][1]-current[s][edge][1])<=.003));
    if(safe){
     current=adjusted;
     actor.sourceStanceVisualOffset={
      source:'verified-original-weighted-skinned-two-shoe-readback',
      x:target.x,z:target.z,sourceInstanceId,
      clip:'Walking_A',rootYaw:actor.root.rotation.y
     };
     // The already-carried offset can limit this new candidate. Report the
     // actual world XZ movement, not the requested movement that was capped.
     const appliedWorld=new THREE.Vector3(deltaX,0,deltaZ)
      .applyQuaternion(rotate.clone().invert());
     actor.sourceStanceSlideReliefProof={
      ...proposal,sourceInstanceId,sourceClip:'Walking_A',
      worldDeltaX:appliedWorld.x,worldDeltaZ:appliedWorld.z,
      reductionMeters:Math.hypot(appliedWorld.x,appliedWorld.z),
      requestedReliefMeters:proposal.reductionMeters,
      beforeHeelTravelMeters:oldHeel,afterHeelTravelMeters:newHeel,
      beforeToeTravelMeters:oldToe,afterToeTravelMeters:newToe,
      verifiedBy:'final-original-weighted-skinned-two-shoe-readback',
      contactLocked:false
     };
     actor.sourceStanceSlideReliefFrames=Math.min(1000000,
      (actor.sourceStanceSlideReliefFrames||0)+1);
    }else{
     pivot.position.x=baseX;pivot.position.z=baseZ;
     pivot.updateWorldMatrix(true,true);
    }
   }
  }
 }
 // Store ONLY the resulting source bones actually rendered at this
 // displayed-frame XZ root. A later action, teleport or GLB clone resets it.
 if(['left','right'].every(s=>current[s]?.heel?.every(Number.isFinite)&&
  current[s]?.toe?.every(Number.isFinite)))
  actor.sourceStanceSlideSample={sourceInstanceId,clip:'Walking_A',
   rootYaw:actor.root.rotation.y,feet:current};
 if(handoff.recordSample&&!handoff.allowRelief&&actor.sourceStanceSlideSample){
  actor.sourceStanceSlideWarmupFrames=Math.min(1000000,
   (actor.sourceStanceSlideWarmupFrames||0)+1);
  if(frameInterval>.35)
   actor.sourceStanceSlideSlowWarmupFrames=Math.min(1000000,
    (actor.sourceStanceSlideSlowWarmupFrames||0)+1);
 }
}

function disposeActorAsset(actor){
 actor.detached=true;
 actor.cinematicFigure?.dispose?.();
 actor.wardenRegaliaRoot=null;actor.wardenRegaliaMounts=[];
 actor.wardenRegaliaInverse=null;actor.wardenRegaliaRiggedParts=0;
 // If the authored rig is retired, keep the complete coloured procedural
 // character visible as an offline/missing-asset fallback.
 actor.detail?.setAuthored?.(false);actor.body.visible=true;
 if(actor.mixer){actor.mixer.stopAllAction();if(actor.assetRoot)actor.mixer.uncacheRoot(actor.assetRoot)}
 if(actor.visualPivot){actor.visualPivot.removeFromParent();actor.visualPivot.clear()}
 else if(actor.assetRoot){actor.root.remove(actor.assetRoot)}
 for(const m of actor.assetMaterials||[])m.dispose();
 for(const g of actor.assetGeometries||[])g.dispose();
 actor.fullBody=null;actor.animationFacing=null;actor.rigGuardPose=null;actor.nativeGuardPeak=0;actor.importedClipAudit=null;actor.sourceGroundAnchor=null;actor.fullBodyFrozenFrames=0;actor.fullBodyHeldFrames=0;actor.fullBodyContactRecoveryFrames=0;actor.fullBodyInterruptions=0;actor.fullBodyRestarts=0;actor.footSupportPeak=0;actor.sourceClockCorrectedFrames=0;actor.sourceClockDriftPeakSeconds=0;actor.sourceClockRemainingSeconds=0;actor.sourceClockMode=null;actor.mixer=null;actor.assetRoot=null;actor.visualPivot=null;actor.motionPeak=0;actor.evasionFrame=null;actor.evasionPosePeak=0;actor.assetMaterials=[];actor.assetGeometries=[];actor.regaliaParts=0;actor.roleSilhouetteParts=0;actor.anatomicalParts=0;actor.anatomicalJointParts=0;actor.anatomicalDetailMeshes=0;actor.anatomicalStaticMergedParts=0;actor.sculptedArmorProfile=null;actor.sculptedArmorVertices=0;actor.rigBoundAccessoryParts=0;actor.cinematicFigure=null;actor.rigWardrobeParts=0;actor.anatomicalStaticMountedCount=0;actor.nativeArmourRoot=null;actor.nativeArmourMounts=[];actor.nativeArmourInverse=null;actor.rigHandBoneName=null;actor.rigHandBone=null;actor.rigGripAligned=false;actor.rigGripShiftMeters=0;actor.rigGripCandidateMeters=null;actor.rigCranial=null;actor.rigUpperArms=[];actor.rigGesturePeak=0;actor.wardenChargeShoulderPeak=0;actor.wardenCharge=null;actor.rigForearms=[];actor.rigForearmPeak=0;actor.rigGaitBones=[];actor.rigGaitPosition=null;actor.sourceSwingToeWitnessFrames=0;actor.sourceSwingToeDragOpportunityFrames=0;actor.sourceSwingToeLiftProof=null;actor.sourceSwingToeCorrectionsThisFrame=0;actor.sourceSwingToeCurrentFrameProofs=null;actor.sourceSwingCalfAssistFrames=0;actor.sourceSwingCalfAssistProof=null;actor.sourceSwingCalfTrialOutcome=null;actor.rigGaitPhase=0;actor.rigGaitWeight=0;actor.rigGaitSettling=false;actor.rigNativeLegOverlayScale=1;actor.nativeWalkEntryPoseHeld=false;actor.rigGaitPeak=0;actor.rigContactBracePeak=0;actor.rigMeleeBones=[];actor.rigMeleePeak=0;actor.rigMeleeCurrentPeak=0;actor.rigMeleeActive=false;actor.rigRangedActive=false;actor.rigRangedPeak=0;actor.nativeReleaseOwnsUpperBody=false;actor.skinnedHitWeight=0;actor.skinnedHitPeak=0;actor.draperyPanels=[];actor.draperyTriangles=0;actor.draperyPeakDeformationMeters=0;actor.draperyPoseKey=null;actor.draperyFramesSkipped=0;actor.draperyNormalRebuilds=0;actor.draperyVertexUploads=0;actor.nativeFigureSculpt=null;actor.authored=false;actor.textureReadiness=null;
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
/**
 * Explicit, on-demand live deformation probe for the genuine imported GLBs.
 * Called only by the browser test/diagnostic hook: never in the animation
 * frame loop, so there is no added per-frame GPU or pose evaluation cost.
 *
 * Each source SkeletonUtils-cloned assetRoot owns a reference recovered from
 * the ORIGINAL GLB skin inverse-bind matrices, never an already animated frame.
 * This makes limb LENGTH invariant to legitimate actor walking and turning,
 * while detecting broken source hierarchy, NaN quaternions, scaling/skin drift
 * and detached hand chains. Does not inspect or alter collision or combat.
 */
const sourceRigDeformationBaselines=new WeakMap();
// Original CC0 skin-weighted sole evidence is selected only on first explicit
// inspection per original SkeletonUtils clone. No frame-loop scans or IK.
const sourceSoleVertexCache=new WeakMap();
const sourceSolePatchVertexCache=new WeakMap();
function sourceSoleVertexCandidates(actor){
 let found=sourceSoleVertexCache.get(actor.assetRoot);
 if(found)return found;
 found={left:null,right:null};
 actor.assetRoot.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||!mesh.skeleton||!mesh.geometry)return;
  const positions=mesh.geometry.getAttribute('position'),
   indices=mesh.geometry.getAttribute('skinIndex'),
   weights=mesh.geometry.getAttribute('skinWeight');
  if(!positions||!indices||!weights)return;
  const targets={left:new Set(),right:new Set()};
  for(const [index,bone] of mesh.skeleton.bones.entries()){
   if(isSourceSoleBoneName(bone?.name,'left'))targets.left.add(index);
   if(isSourceSoleBoneName(bone?.name,'right'))targets.right.add(index);
  }
  if(!targets.left.size&&!targets.right.size)return;
  // Hard cap per original mesh protects the explicit auditing operation.
  for(let i=0,n=Math.min(positions.count,8192);i<n;i++){
   const joints=[indices.getX(i),indices.getY(i),indices.getZ(i),indices.getW(i)];
   const skin=[weights.getX(i),weights.getY(i),weights.getZ(i),weights.getW(i)];
   const y=positions.getY(i);
   if(!Number.isFinite(y))continue;
   for(const side of ['left','right']){
    let weight=0;
    for(let k=0;k<4;k++)if(targets[side].has(joints[k]))weight+=skin[k];
    if(weight<.55)continue;
    const prior=found[side];
    if(!prior||y<prior.bindY-1e-6||
     (Math.abs(y-prior.bindY)<=1e-6&&weight>prior.weight))
     found[side]={mesh,index:i,bindY:y,weight};
   }
  }
 });
 sourceSoleVertexCache.set(actor.assetRoot,found);
 return found;
}
/**
 * Read-on-demand, original SOURCE skinned shoe patch.
 * Two separated LOW bind-space foot-weighted vertices on the SAME licensed
 * skinned mesh. Insole/upper-boot samples are rejected; the candidate
 * orientation does NOT by itself verify anatomical heel/toe or true plants.
 * No new geometry, rig, IK or per-frame work.
 */
/**
 * Anatomical source-toe heading from immutable ORIGINAL GLB bind matrices,
 * never root yaw, costume extrema, stale action labels or synthetic IK.
 * The skin's footl/footr must be the actual parent of toesl/toesr. Convert
 * both native inverse-bind origins to SAME source skinned mesh geometry space
 * before asking for heel/toe; invalid binding silently retains untrusted
 * original extrema without certifying anatomy.
 * Computed only on explicit inspection, once per original source clone.
 */
function sourceOriginalToeBindAxis(mesh,side){
 const skeleton=mesh?.skeleton;
 if(!skeleton||!['left','right'].includes(side)||!mesh.bindMatrix?.isMatrix4)return null;
 const names=side==='left'?['footl','toesl']:['footr','toesr'];
 const matches=(bone,name)=>bone?.isBone&&
  bone.name.toLowerCase().replace(/[._-]/g,'')===name;
 const footIndex=skeleton.bones.findIndex(b=>matches(b,names[0]));
 const toeIndex=skeleton.bones.findIndex(b=>matches(b,names[1]));
 if(footIndex<0||toeIndex<0||footIndex===toeIndex)return null;
 const foot=skeleton.bones[footIndex],toe=skeleton.bones[toeIndex];
 let attached=false,parent=toe.parent;
 for(let depth=0;parent&&depth<12;depth++,parent=parent.parent){
  if(parent===foot){attached=true;break;}
 }
 if(!attached)return null;
 const inverseMesh=mesh.bindMatrix.clone();
 if(!inverseMesh.elements.every(Number.isFinite)||
  !Number.isFinite(inverseMesh.determinant())||
  Math.abs(inverseMesh.determinant())<1e-10)return null;
 inverseMesh.invert();
 const bindPoint=index=>{
  const inverse=skeleton.boneInverses?.[index];
  if(!inverse?.isMatrix4||!inverse.elements.every(Number.isFinite)||
   !Number.isFinite(inverse.determinant())||
   Math.abs(inverse.determinant())<1e-10)return null;
  const location=new THREE.Vector3().setFromMatrixPosition(inverse.clone().invert())
   .applyMatrix4(inverseMesh);
  return [location.x,location.y,location.z].every(Number.isFinite)?
   location.toArray():null;
 };
 return planOriginalSourceToeBindAxis({
  footBind:bindPoint(footIndex),toesBind:bindPoint(toeIndex),
  originalFootChain:true,source:'original-skeleton-inverse-bind'
 });
}
function sourceSolePatchVertexCandidates(actor){
 let cached=sourceSolePatchVertexCache.get(actor.assetRoot);
 if(cached)return cached;
 cached={left:null,right:null};
 const anchors=sourceSoleVertexCandidates(actor);
 for(const side of ['left','right']){
  const anchor=anchors[side],mesh=anchor?.mesh,geometry=mesh?.geometry;
  const p=geometry?.getAttribute('position'),i=geometry?.getAttribute('skinIndex'),
   w=geometry?.getAttribute('skinWeight');
  if(!p||!i||!w||!mesh?.skeleton)continue;
  const sideBones=new Set();
  mesh.skeleton.bones.forEach((bone,index)=>{
   if(isSourceSoleBoneName(bone?.name,side))sideBones.add(index);
  });
  if(!sideBones.size)continue;
  // Strictly on-demand diagnostic, never frame-loop skinning or visual IK.
  const candidates=[];
  for(let v=0,n=Math.min(p.count,8192);v<n;v++){
   const x=p.getX(v),y=p.getY(v),z=p.getZ(v);
   if(![x,y,z].every(Number.isFinite)||y<anchor.bindY-.001||
    y>anchor.bindY+.032)continue;
   const ids=[i.getX(v),i.getY(v),i.getZ(v),i.getW(v)],
    weights=[w.getX(v),w.getY(v),w.getZ(v),w.getW(v)];
   let score=0;for(let k=0;k<4;k++)if(sideBones.has(ids[k]))score+=weights[k];
   if(score<.55)continue;
   candidates.push({mesh,index:v,bindY:y,weight:score,x,z});
  }
  const sourceAxis=sourceOriginalToeBindAxis(mesh,side);
  const anatomical=sourceAxis?
   selectOriginalOutsolePatchVertices(candidates,anchor.bindY,sourceAxis):null;
  const selected=anatomical||
   selectOriginalOutsolePatchVertices(candidates,anchor.bindY);
  if(selected)cached[side]={
   heel:selected.heel,toe:selected.toe,
   source:selected.source,
   anatomicalHeelToeVerified:Boolean(anatomical),
   sourceToeAxis:sourceAxis?{
    source:sourceAxis.source,
    forward:[sourceAxis.forwardX,sourceAxis.forwardZ],
    footBind:[sourceAxis.footX,sourceAxis.footZ],
    toesBind:[sourceAxis.toeX,sourceAxis.toeZ],
    sourceBoneSeparation:sourceAxis.sourceBoneSeparation,
    selectedAnatomicalPatch:Boolean(anatomical)
   }:null
  };
 }
 sourceSolePatchVertexCache.set(actor.assetRoot,cached);
 return cached;
}
// Reused scratch, not a new Vector3 for every loaded-ankle proof. Each
// caller receives an independent finite [x,y,z] array, never this object.
const originalSkinnedSolePoint=new THREE.Vector3();
function sourceSkinnedSoleWorld(candidate){
 // The prior dedicated Y reader rejected non-indexed or non-skinned source
 // geometry. Preserve the same fail-closed bone/vertex contract now that
 // this ONE XYZ read owns the final height and lateral safety witness.
 if(!candidate?.mesh?.isSkinnedMesh||
  typeof candidate.mesh.applyBoneTransform!=='function'||
  !Number.isSafeInteger(candidate.index)||candidate.index<0)return null;
 const position=candidate.mesh.geometry?.getAttribute?.('position');
 if(!position||candidate.index>=position.count)return null;
 const point=originalSkinnedSolePoint.fromBufferAttribute(position,candidate.index);
 candidate.mesh.updateWorldMatrix(true,false);
 candidate.mesh.applyBoneTransform(candidate.index,point);
 point.applyMatrix4(candidate.mesh.matrixWorld);
 return [point.x,point.y,point.z].every(Number.isFinite)?point.toArray():null;
}
function sourceWeaponHandGrip(actor,rightHand){
 if(!rightHand?.isBone)return null;
 // Audit the ORIGINAL imported grip socket, not a new weapon fitting. The
 // licensed handslot.r is independently keyed beneath hand.r by source clips;
 // a moving sword relative to hand.r is not proof of a detached weapon.
 const names=['1H_Sword','Longbow_1','2H_Staff','DarkStaff_1'];
 const weapon=names.map(n=>actor.assetRoot.getObjectByName(n)).find(Boolean);
 if(!weapon)return null;
 let attached=false,sourceSocket=null;
 for(let parent=weapon.parent,depth=0;parent&&depth<24;parent=parent.parent,depth++){
  if(!sourceSocket&&parent.isBone&&/^handslot[._-]?r$/i.test(parent.name))
   sourceSocket=parent;
  if(parent===rightHand){attached=true;break;}
 }
 const attachedToGripSocket=Boolean(attached&&sourceSocket&&weapon.parent===sourceSocket);
 rightHand.updateWorldMatrix(true,false);
 weapon.updateWorldMatrix(true,false);
 const values=Array.from(new THREE.Matrix4().copy(rightHand.matrixWorld).invert()
  .multiply(weapon.matrixWorld).elements);
 if(!values.every(Number.isFinite))return null;
 // Both matrices describe the SAME original skinned/animated hierarchy,
 // sampled only when the existing on-demand rig inspection is requested.
 const socketValues=attachedToGripSocket?
  Array.from(new THREE.Matrix4().copy(sourceSocket.matrixWorld).invert()
   .multiply(weapon.matrixWorld).elements):null;
 return {name:weapon.name,handName:rightHand.name,attachedToHand:attached,
  handRelativeMatrix:values,
  socketName:sourceSocket?.name??null,attachedToGripSocket,
  socketRelativeMatrix:socketValues?.every(Number.isFinite)?socketValues:null};
}

function inspectSourceRigDeformation(actors){
 const actorsOut=[];
 for(const actor of actors.values()){
  if(!actor.authored||!actor.assetRoot||!actor.u||actor.detached)continue;
  actor.assetRoot.updateWorldMatrix(true,true);
  const bones=[],seen=new Set(),bindPositions=new Map();let skinnedMeshes=0;
  actor.assetRoot.traverse(o=>{
   if(!o.isSkinnedMesh||!o.skeleton)return;
   skinnedMeshes++;
   for(const [index,b] of (o.skeleton.bones||[]).entries()){
    if(!b?.isBone)continue;
    if(!seen.has(b)&&bones.length<128){seen.add(b);bones.push(b)}
    // Original inverse-bind skin contract; never use an already posed frame.
    const inverse=o.skeleton.boneInverses?.[index];
    if(bindPositions.has(b)||!inverse?.isMatrix4||
     !inverse.elements.every(Number.isFinite))continue;
    const determinant=inverse.determinant();
    if(!Number.isFinite(determinant)||Math.abs(determinant)<1e-12)continue;
    const bindWorld=new THREE.Vector3().setFromMatrixPosition(inverse.clone().invert())
     .applyMatrix4(actor.assetRoot.matrixWorld);
    if([bindWorld.x,bindWorld.y,bindWorld.z].every(Number.isFinite))
     bindPositions.set(b,bindWorld);
   }
  });
  const pick=(items,side,part)=>items.find(item=>item?.side===side&&
   (!part||item.part===part))?.bone||null;
  const arms={left:pick(actor.rigUpperArms,'left'),right:pick(actor.rigUpperArms,'right')},
   forearms={left:pick(actor.rigForearms,'left'),right:pick(actor.rigForearms,'right')},
   hands={left:selectHandBone(bones,'left'),right:selectHandBone(bones,'right')},
   thighs={left:pick(actor.rigGaitBones,'left','upper'),right:pick(actor.rigGaitBones,'right','upper')},
   calves={left:pick(actor.rigGaitBones,'left','lower'),right:pick(actor.rigGaitBones,'right','lower')},
   feet={left:pick(actor.rigGaitBones,'left','foot'),right:pick(actor.rigGaitBones,'right','foot')};
  const v1=new THREE.Vector3(),v2=new THREE.Vector3(),segments=[],bindSegments=[];
  const connected=(base,child)=>{
   for(let parent=child?.parent,steps=0;parent&&steps<24;parent=parent.parent,steps++){
    if(parent===base)return true;
   }
   return false;
  };
  const add=(name,base,child)=>{
   if(!base||!child)return;
   base.getWorldPosition(v1);child.getWorldPosition(v2);
   const linked=connected(base,child);
   segments.push({name,from:v1.toArray(),to:v2.toArray(),connected:linked});
   const bindFrom=bindPositions.get(base),bindTo=bindPositions.get(child);
   if(bindFrom&&bindTo)bindSegments.push({name,
    from:bindFrom.toArray(),to:bindTo.toArray(),connected:linked});
  };
  for(const side of ['left','right']){
   add(side+'-arm',arms[side],forearms[side]);
   add(side+'-forearm',forearms[side],hands[side]);
   add(side+'-thigh',thighs[side],calves[side]);
   add(side+'-calf',calves[side],feet[side]);
  }
  const sample={
   skinnedMeshes,segments,
   bones:bones.map(b=>({
    quaternion:b.quaternion.toArray(),
    matrix:Array.from(b.matrixWorld.elements)
   }))
  };
  // Frozen per-clone source bind reference: never learn from animation.
  // Invalid/missing inverse-binds must fail the evidence gate explicitly.
  let baseline=sourceRigDeformationBaselines.get(actor.assetRoot);
  if(!baseline){
   baseline=measureSourceRigDeformation({segments:bindSegments,bones:[],skinnedMeshes});
   sourceRigDeformationBaselines.set(actor.assetRoot,baseline);
  }
  const bindReferenceComplete=segments.length===8&&baseline.validSegments===8&&
   baseline.segments.length===segments.length;
  const result=measureSourceRigDeformation(sample,bindReferenceComplete?baseline:null);
  // Demand-only source-ankle joints; not true toe or sole contact.
  const worldJoint=bone=>{
   if(!bone?.getWorldPosition)return null;
   bone.getWorldPosition(v1);
   return [v1.x,v1.y,v1.z].every(Number.isFinite)?v1.toArray():null;
  };
  const footJointWorld={left:worldJoint(feet.left),right:worldJoint(feet.right)};
  const soleCandidates=sourceSoleVertexCandidates(actor);
  const soleVertexWorld={left:sourceSkinnedSoleWorld(soleCandidates.left),
   right:sourceSkinnedSoleWorld(soleCandidates.right)};
  const patchCandidates=sourceSolePatchVertexCandidates(actor);
  const sourceSolePatchWorld=Object.fromEntries(['left','right'].map(side=>{
   const pair=patchCandidates[side];
   return [side,pair?{heel:sourceSkinnedSoleWorld(pair.heel),
    toe:sourceSkinnedSoleWorld(pair.toe)}:null];
  }));
  const sourceSolePatchAnatomy=Object.fromEntries(['left','right'].map(side=>{
   const pair=patchCandidates[side];
   return [side,pair?{
    source:pair.source,anatomicalHeelToeVerified:pair.anatomicalHeelToeVerified,
    originalToeAxis:pair.sourceToeAxis
   }:null];
  }));
  const sourceWeaponGrip=sourceWeaponHandGrip(actor,hands.right);
  const rootWorld=worldJoint(actor.root);
  actorsOut.push({id:actor.u.id,kind:actor.u.kind,mode:actor.fullBody?.mode||'idle',
   bindReferenceSource:'original-inverse-bind-matrices',
   bindReferenceSegments:baseline.segments.length,bindReferenceComplete,
   sourceMeshCount:actor.nativePresentation?.skinnedMeshes||0,
   sourceHandName:actor.rigHandBoneName||null,
   // On-demand source-joint defensive transition witness (never a per-frame scan).
   guardBlend:Number.isFinite(actor.fullBody?.guardBlend)?actor.fullBody.guardBlend:0,
   guardOwned:Boolean(actor.fullBody?.owner.guard),
   nativeLegOwnership:{
    clipName:actor.activeImportedClipName??null,
    originalSourceWeight:actor.activeClip?.getEffectiveWeight?.()??null,
    overlayScale:actor.rigNativeLegOverlayScale??1,
    bodyStrideWeight:actor.rigFullBodyStride?.weight??0,
    gaitWeight:actor.rigGaitWeight??0,
    sourceStanceSlideReliefFrames:actor.sourceStanceSlideReliefFrames||0,
     originalWalkingTorsoCounterturnRad:actor.walkingTorsoCounterturn?.offsetRad??0,
     originalWalkingTorsoObservedFrameSeconds:Number.isFinite(actor.rigWalkingTurnObservedFrameInterval)?actor.rigWalkingTurnObservedFrameInterval:null,
     originalWalkingTorsoObservedRootTravelMeters:Number.isFinite(actor.rigWalkingTurnObservedRootTravel)?actor.rigWalkingTurnObservedRootTravel:null,
     originalWalkingTorsoObservedYawStepRad:Number.isFinite(actor.rigWalkingTurnObservedYawStepRad)?actor.rigWalkingTurnObservedYawStepRad:null,
     originalWalkingTorsoPriorSourceSame:Boolean(actor.rigWalkingTurnObservedSourceSame),
     originalWalkingTorsoCounterturnFrames:actor.rigWalkingTurnFrames||0,
     originalWalkingTorsoFirstWalkFrames:actor.rigWalkingTurnFirstWalkFrames||0,
     originalWalkingTorsoCounterturnPeakRad:actor.rigWalkingTurnPeakRad||0,
    sourceStanceSlideWarmupFrames:actor.sourceStanceSlideWarmupFrames||0,
    sourceStanceSlideSlowWarmupFrames:actor.sourceStanceSlideSlowWarmupFrames||0,
    sourceStanceSlideReliefProof:actor.sourceStanceSlideReliefProof??null,
    sourceStanceSlideCarryMeters:Math.hypot(actor.sourceStanceVisualOffset?.x??0,
     actor.sourceStanceVisualOffset?.z??0),
    sourceStanceSlideCarryFrames:actor.sourceStanceCarryFrames||0,
    sourceStanceSlideCarryPeakMeters:actor.sourceStanceCarryPeakMeters||0,
    sourceSwingToeCorrectionFrames:actor.sourceSwingToeCorrectionFrames||0,
    // This counter is only a verified original-GLB same-angle continuation;
    // it cannot be interpreted as new contact or a successful foot plant.
    sourceSwingToeContinuityFrames:actor.sourceSwingToeContinuityFrames||0,
    sourceSwingToeCorrectionsThisFrame:actor.sourceSwingToeCorrectionsThisFrame||0,
    sourceSwingToeCurrentFrameProofs:actor.sourceSwingToeCurrentFrameProofs??null,
     sourceSwingThighCurrentFrameProofs:actor.sourceSwingThighCurrentFrameProofs??null,
     sourceSwingThighAcceptedFrames:actor.sourceSwingThighAcceptedFrames||0,
     sourceSwingThighEaseOutFrames:actor.sourceSwingThighEaseOutFrames||0,
     sourceSwingThighHoldFrames:actor.sourceSwingThighHoldFrames||0,
    // Read-only same-frame measurements of the original stance heel + toe.
    // A relief witness is not proof of a world-space foot plant or IK.
    sourceStanceSoleCurrentFrameProofs:actor.sourceStanceSoleCurrentFrameProofs??null,
    sourceStanceKneeCurrentFrameProofs:actor.sourceStanceKneeCurrentFrameProofs??null,
    sourceStanceKneeProbeOutcomes:actor.sourceStanceKneeProbeOutcomes??null,
    sourceStanceKneeSupportFrames:actor.sourceStanceKneeSupportFrames||0,
    sourceStanceProbeOutcomes:actor.sourceStanceProbeOutcomes??null,
    sourceStanceReliefFrames:actor.sourceStanceReliefFrames||0,
    sourceLoadedPelvisLiftMeters:actor.sourceLoadedPelvisLiftMeters||0,
    sourceLoadedPelvisAcceptedFrames:actor.sourceLoadedPelvisAcceptedFrames||0,
     sourceLoadedPelvisRollbackFrames:actor.sourceLoadedPelvisRollbackFrames||0,
     sourceLoadedPelvisRollbackFootProof:actor.sourceLoadedPelvisRollbackFootProof??null,
    sourceLoadedPelvisFrameProof:actor.sourceLoadedPelvisFrameProof??null,
    sourceSwingToeWitnessFrames:actor.sourceSwingToeWitnessFrames||0,
    sourceSwingToeDragOpportunityFrames:actor.sourceSwingToeDragOpportunityFrames||0,
    sourceSwingToeCorrectionPeakRad:actor.sourceSwingToeCorrectionPeakRad||0,
    sourceSwingToeLiftProof:actor.sourceSwingToeLiftProof??null,
    sourceSwingCalfAssistFrames:actor.sourceSwingCalfAssistFrames||0,
    sourceSwingCalfCurrentFrameMask:actor.sourceSwingCalfCurrentFrameMask||0,
    sourceSwingCalfAssistProof:actor.sourceSwingCalfAssistProof??null,
    sourceSwingCalfTrialOutcome:actor.sourceSwingCalfTrialOutcome??null,
    originalSwingTravelWitnessMeters:actor.rigRecentGroundedTravel??0,
    originalSwingTravelWitnessAge:actor.rigRecentGroundedAge??0,
    settling:Boolean(actor.rigGaitSettling),
    sourceIdleHandoffHeld:Boolean(actor.nativeWalkEntryPoseHeld),
    nativeWalkEntryPendingMeters:actor.nativeWalkEntryPendingMeters??0,
    deferredSourceWalkStops:actor.walkArrivalDeferredStops||0,
    deferredSourceWalkPending:Boolean(actor.walkArrivalPendingAction),
    walkExitRate:Number.isFinite(actor.walkArrivalExitRate)?actor.walkArrivalExitRate:null,
    walkExitBrakedFrames:actor.walkArrivalBrakedFrames||0,
    sourceLandingActive:Boolean(actor.walkLandingPose),
    sourceLandingFrames:actor.walkLandingFrames||0,
    sourceLandingPelvisFrames:actor.walkLandingPelvisFrames||0,
    sourceLandingPelvisRejectedFrames:actor.walkLandingPelvisRejectedFrames||0,
    sourceWalkReentryActive:Boolean(actor.walkLandingReentry),
    sourceWalkReentryFrames:actor.walkLandingReentryFrames||0,
    sourceWalkReentryRejectedFrames:actor.walkLandingReentryRejectedFrames||0
   },
   sourceInstanceId:actor.assetRoot.uuid,rootWorld,
   // EXACT root yaw of THIS original source-skin pose, not assumed heading.
   // Demand-only diagnostic, never changes the root, mixer or event authority.
   rootYaw:Number.isFinite(actor.root?.rotation?.y)?actor.root.rotation.y:null,
   footJointWorld,
   sourceGroundAnchor:actor.sourceGroundAnchor??null,
   soleVertexWorld:soleVertexWorld,sourceSolePatchWorld,sourceSolePatchAnatomy,sourceWeaponGrip:sourceWeaponGrip,
   // Real source AnimationAction clock captured only when the explicit
   // original-rig inspector is called. Live rendering never skin-scans.
   // This is required to match imported clips/phase across real sole frames.
   sourceActionSample:actor.activeClip?.getClip?.()?{
    clipName:actor.activeClip.getClip().name||null,
    sourceAction:actor.currentAction||null,
    sourceActionTick:Number.isFinite(actor.currentActionTick)?
     actor.currentActionTick:null,
    time:Number.isFinite(actor.activeClip.time)?actor.activeClip.time:null,
    duration:Number.isFinite(actor.activeClip.getClip().duration)?
     actor.activeClip.getClip().duration:null,
    weight:Number.isFinite(actor.activeClip.getEffectiveWeight?.())?
     actor.activeClip.getEffectiveWeight():null,
    running:Boolean(actor.activeClip.isRunning?.())
   }:null,
   // Explicit ON-DEMAND read of the authentic source action, not a synthetic
   // animation timer. This never scans skin vertices or advances the mixer.
   sourceLoop:actor.activeImportedClipName==='Idle'?{
    mode:actor.currentAction,clipName:actor.activeClip?.getClip?.()?.name||null,
    time:actor.activeClip?.time??null,
    duration:actor.activeClip?.getClip?.()?.duration??null,
    running:Boolean(actor.activeClip?.isRunning?.()),
    weight:actor.activeClip?.getEffectiveWeight?.()??null
   }:null,
   groundedFootPhase:Number.isFinite(actor.groundedPerformance?.footPhase)?actor.groundedPerformance.footPhase:null,
   sourceClock:actor.sourceClockMode?{mode:actor.sourceClockMode,
    age:actor.fullBody?.age??null,
    sourceTime:actor.activeClip?.time??null,
    duration:actor.activeClip?.getClip?.()?.duration??null,
    speed:actor.activeClip?.getEffectiveTimeScale?.()??null,
    remainingSeconds:actor.sourceClockRemainingSeconds||0}:null,
   ...result});
  if(actorsOut.length>=12)break;
 }
 return {
  schemaVersion:1,
  actors:actorsOut,
  summary:{
   sourceActors:actorsOut.length,
   sampledSegments:actorsOut.reduce((n,a)=>n+a.segments.length,0),
   bindReferenceComplete:actorsOut.length>0&&actorsOut.every(a=>a.bindReferenceComplete),
   bindReferenceMissingActors:actorsOut.filter(a=>!a.bindReferenceComplete).length,
   disconnectedSegments:actorsOut.reduce((n,a)=>n+a.disconnectedSegments,0),
   invalidSegments:actorsOut.reduce((n,a)=>n+a.invalidSegments,0),
   invalidQuaternionCount:actorsOut.reduce((n,a)=>n+a.invalidQuaternionCount,0),
   invalidMatrixCount:actorsOut.reduce((n,a)=>n+a.invalidMatrixCount,0),
   maxQuaternionError:Math.max(0,...actorsOut.map(a=>a.maxQuaternionError)),
   maxStretchFraction:Math.max(0,...actorsOut.map(a=>a.maxStretchFraction))
  }
 };
}
function stats(actors){
 const all=[...actors.values()],authored=all.filter(a=>a.authored);
 return{
   fullBodyModes:authored.reduce((m,a)=>{const mode=a.fullBody?.mode||'idle';m[mode]=(m[mode]||0)+1;return m},{}),
   fullBodyHeldRecoveryFrames:authored.reduce((n,a)=>n+(a.fullBodyHeldFrames||0),0),
   fullBodyGroundedSourceCatchupFrames:authored.reduce((n,a)=>n+(a.walkingSourceCatchupFrames||0),0),
   fullBodyNativeWalkEntryDeferredFrames:authored.reduce((n,a)=>n+(a.nativeWalkEntryDeferredFrames||0),0),
   fullBodyFrozenSourceActors:authored.filter(a=>a.fullBody?.owner.defeat).length,
   fullBodyFrozenSourceFrames:authored.reduce((n,a)=>n+(a.fullBodyFrozenFrames||0),0),
    nativeDeathSourceActors:authored.filter(a=>a.nativeDeathSourceActive).length,
   fullBodyVerifiedContactRecoveryFrames:authored.reduce((n,a)=>n+(a.fullBodyContactRecoveryFrames||0),0),
   fullBodyInterruptions:authored.reduce((n,a)=>n+(a.fullBodyInterruptions||0),0),
   fullBodyRestarts:authored.reduce((n,a)=>n+(a.fullBodyRestarts||0),0),
   fullBodySourceClockCorrectedFrames:authored.reduce((n,a)=>n+(a.sourceClockCorrectedFrames||0),0),
   fullBodySourceClockPeakDriftSeconds:Math.max(0,...authored.map(a=>a.sourceClockDriftPeakSeconds||0)),
   fullBodySourceClockMaxRemainingSeconds:Math.max(0,...authored.map(a=>a.sourceClockRemainingSeconds||0)),
   fullBodySourceStanceSlideReliefFrames:authored.reduce((n,a)=>n+(a.sourceStanceSlideReliefFrames||0),0),
   fullBodyFootSupportPeakRad:Math.max(0,...authored.map(a=>a.footSupportPeak||0)),
   fullBodySourceWalkArrivalPlants:authored.reduce((n,a)=>n+(a.walkArrivalFrozenActions||0),0),
   fullBodyNativeGuardActors:authored.filter(a=>(a.fullBody?.guardBlend||0)>.001).length,
   fullBodyNativeGuardPeakRad:Math.max(0,...authored.map(a=>a.nativeGuardPeak||0)),
   fullBodyOriginalIdleClockHandoffs:authored.reduce((n,a)=>n+(a.sharedSourceIdleHandoffs||0),0),
   fullBodyOriginalReleaseSupportPeakRad:Math.max(0,...authored.map(a=>a.rigRangedSupportPeak||0)),
   fullBodySettlingActors:authored.filter(a=>a.rigGaitSettling).length,
   fullBodyFootfallPhaseErrorRad:Math.max(0,...authored.filter(a=>a.fullBody?.owner.locomotion&&a.rigGaitWeight>0)
    .map(a=>Math.abs(Math.atan2(Math.sin(a.rigGaitPhase-2*Math.PI*a.groundedPerformance.footPhase),
      Math.cos(a.rigGaitPhase-2*Math.PI*a.groundedPerformance.footPhase))))),
   sourceClipAudits:authored.slice(0,6).map(a=>({kind:a.u.kind,clips:a.importedClipAudit?.clips||[],rootMotionTracks:a.importedClipAudit?.rootMotionTracks||[]})),
   sourceClipBindings:authored.slice(0,6).map(a=>({id:a.u.id,kind:a.u.kind,action:a.currentAction,clipName:a.activeImportedClipName??null,sourceTick:a.currentActionTick})),
   nativeContinuousActors:authored.filter(a=>a.nativePresentation?.complete).length,
  nativeDuelActiveActors:authored.filter(a=>a.nativeDuel&&a.nativeDuel.mode!=='rest').length,
  nativeDuelPeak:Math.max(0,...authored.map(a=>a.nativeDuelPeak||0)),
  nativeDuelContactFrames:authored.reduce((n,a)=>n+(a.nativeDuelContactFrames||0),0),
  nativeVisibleSourceMeshes:authored.reduce((n,a)=>n+(a.nativePresentation?.sourceMeshes||0),0),
  nativeVisibleSkinnedMeshes:authored.reduce((n,a)=>n+(a.nativePresentation?.skinnedMeshes||0),0),
  nativeTexturedSourceMeshes:authored.reduce((n,a)=>n+(a.nativePresentation?.texturedMeshes||0),0),
  nativeSculptActors:authored.filter(a=>(a.nativeFigureSculpt?.segments||0)>0).length,
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
 evasionPosePeak:Math.max(0,...authored.map(a=>a.evasionPosePeak||0)),evasionPoseActors:authored.filter(a=>(a.evasionPosePeak||0)>.03).length,contactBodyPeakMeters:Math.max(0,...authored.map(a=>a.contactBodyPeakMeters||0)),authoredBosses:authored.filter(a=>a.u.kind==='warden').length,bossNativeRiggedParts:all.reduce((n,a)=>n+(a.wardenRegaliaRiggedParts||0),0),bossNativeRigMounts:all.reduce((n,a)=>n+(a.wardenRegaliaMounts?.length||0),0),bossRegaliaParts:all.reduce((n,a)=>n+(a.regaliaParts||0),0),roleSilhouetteActors:authored.filter(a=>(a.roleSilhouetteParts||0)>0).length,roleSilhouetteParts:all.reduce((n,a)=>n+(a.roleSilhouetteParts||0),0),anatomicalDetailActors:authored.filter(a=>(a.anatomicalParts||0)>0).length,sculptedArmorActors:authored.filter(a=>a.sculptedArmorProfile).length,sculptedArmorVertices:authored.reduce((sum,a)=>sum+(a.sculptedArmorVertices||0),0),sculptedArmorProfiles:[...new Set(authored.map(a=>a.sculptedArmorProfile).filter(Boolean))].sort(),anatomicalDetailParts:all.reduce((n,a)=>n+(a.anatomicalParts||0),0),anatomicalJointFittings:all.reduce((n,a)=>n+(a.anatomicalJointParts||0),0),anatomicalDetailMeshes:all.reduce((n,a)=>n+(a.anatomicalDetailMeshes||0),0),anatomicalStaticMergedParts:all.reduce((n,a)=>n+(a.anatomicalStaticMergedParts||0),0),draperyActors:authored.filter(a=>(a.draperyPanels?.length||0)>0).length,draperyPanels:all.reduce((n,a)=>n+(a.draperyPanels?.length||0),0),draperyTriangles:all.reduce((n,a)=>n+(a.draperyTriangles||0),0),draperyFramesSkipped:all.reduce((n,a)=>n+(a.draperyFramesSkipped||0),0),draperyNormalRebuilds:all.reduce((n,a)=>n+(a.draperyNormalRebuilds||0),0),draperyVertexUploads:all.reduce((n,a)=>n+(a.draperyVertexUploads||0),0),draperyPeakDeformationMeters:Math.max(0,...all.map(a=>a.draperyPeakDeformationMeters||0)),rigCranialActors:authored.filter(a=>a.rigCranial?.applied).length,rigCranialRatios:authored.filter(a=>a.rigCranial?.applied).map(a=>({kind:a.u.kind,ratio:a.rigCranial.ratio})).slice(0,18),rigGestureBones:authored.reduce((n,a)=>n+(a.rigUpperArms?.length||0),0),rigGesturePeakRad:Math.max(0,...authored.map(a=>a.rigGesturePeak||0)),wardenChargeShoulderPeakRad:Math.max(0,...authored.filter(a=>a.u.kind==='warden').map(a=>a.wardenChargeShoulderPeak||0)),rigForearmBones:authored.reduce((n,a)=>n+(a.rigForearms?.length||0),0),rigForearmPeakRad:Math.max(0,...authored.map(a=>a.rigForearmPeak||0)),rigGaitBones:authored.reduce((n,a)=>n+(a.rigGaitBones?.length||0),0),rigGaitPeakRad:Math.max(0,...authored.map(a=>a.rigGaitPeak||0)),rigFullBodyStridePeakRad:Math.max(0,...authored.map(a=>a.rigFullBodyStridePeak||0)),rigContactBraceActors:authored.filter(a=>(a.rigContactBracePeak||0)>.09).length,rigContactBracePeakRad:Math.max(0,...authored.map(a=>a.rigContactBracePeak||0)),rigMeleeBones:authored.reduce((n,a)=>n+(a.rigMeleeBones?.length||0),0),rigMeleePeakRad:Math.max(0,...authored.map(a=>a.rigMeleePeak||0)),rigMeleeCurrentPeakRad:Math.max(0,...authored.map(a=>a.rigMeleeCurrentPeak||0)),rigMeleeActiveActors:authored.filter(a=>a.rigMeleeActive).length,rigMeleeObservedActiveFrames:authored.reduce((n,a)=>n+(a.rigMeleeObservedActiveFrames||0),0),rigRangedActiveActors:authored.filter(a=>a.rigRangedActive).length,rigRangedPeak:Math.max(0,...authored.map(a=>a.rigRangedPeak||0)),rigMeleeBoneNames:authored.flatMap(a=>(a.rigMeleeBones||[]).map(m=>m.part+':'+m.bone.name)).slice(0,12),rigBoundAccessoryActors:authored.filter(a=>(a.rigBoundAccessoryParts||0)>0).length,rigBoundAccessoryParts:all.reduce((n,a)=>n+(a.rigBoundAccessoryParts||0),0),rigWardrobeActors:authored.filter(a=>(a.rigWardrobeParts||0)>0).length,rigWardrobeParts:all.reduce((n,a)=>n+(a.rigWardrobeParts||0),0),anatomicalStaticMountedBatches:all.reduce((n,a)=>n+(a.anatomicalStaticMountedCount||0),0),
 hiddenFallbackOrnamentActors:authored.filter(a=>(a.detail?.hiddenProceduralOrnamentCount||0)>0).length,
 hiddenFallbackOrnamentMeshes:authored.reduce((n,a)=>n+(a.detail?.hiddenProceduralOrnamentCount||0),0),rigGripAlignedActors:authored.filter(a=>a.rigGripAligned).length,rigGripMaxShiftMeters:Math.max(0,...authored.map(a=>a.rigGripShiftMeters||0)),rigGripCandidates:authored.filter(a=>a.rigGripCandidateMeters!==null).map(a=>({kind:a.u.kind,meters:a.rigGripCandidateMeters})).slice(0,3),rigHandBoneNames:authored.filter(a=>a.rigHandBoneName).map(a=>a.rigHandBoneName).slice(0,8),skinnedHitActors:authored.filter(a=>(a.skinnedHitWeight||0)>.02).length,skinnedHitPeak:Math.max(0,...authored.map(a=>a.skinnedHitPeak||0)),skinnedDefeatActors:authored.filter(a=>a.skinnedDefeatWeight>.02).length,forgedMicrotextures:forgedMicrotextureCache.size,authoredCharacters:authored.length,proceduralFallbacks:all.length-authored.length,uniqueAssets:cache.size,missingAssets:failures.size,incompleteAssets:incompleteAssets.size,texturedCharacters:authored.filter(a=>a.textureReadiness?.decodedColorMaps>0).length,decodedColorMaps:authored.reduce((n,a)=>n+(a.textureReadiness?.decodedColorMaps||0),0)};
}
export {attachCharacter,updateActor,stageRigWalkingFacingAfterRootYaw,disposeActorAsset,putEnvironment,stats,inspectSourceRigDeformation};
