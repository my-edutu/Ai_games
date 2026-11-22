'use strict';
/**
 * Session 03 RED-first contracts for a genuine SAME-TICK native rAF shoe pair.
 * All numbers below are synthetic contract fixtures, not after-change GLB
 * measurements, a floor plant, a hit, or a corrected animation.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditOriginalSourceRafSolePair:pair}=require(
 '../browser/dungeon-session03-original-skin-pair.cjs');
const shoe=(x,z,yHeel,yToe)=>({
 heel:[x,yHeel,z],toe:[x,yToe,z+.15]
});
const sample=(over={})=>({
 actorId:'vanguard',sourceInstanceId:'licensed-original-GLB-clone',
 sourceClip:'Walking_A',sourceClipTime:.31,sourceClipDuration:1.04,
 sourceWeight:1,authorityTick:8,checksum:'a-real-public-checksum',
 frame:101,visible:true,timeMs:1000,rootWorld:[0,0,0],
 sourceWeaponGrip:{socketName:'handslotr',attachedToGripSocket:true},
 sourceSolePatchWorld:{
  left:shoe(-.16,-.2,-.022,-.022),
  right:shoe(.16,-.2,.19,-.09)
 },
 ...over
});
const next=()=>sample({
 frame:102,timeMs:1050,sourceClipTime:.36,rootWorld:[.003,0,0],
 sourceSolePatchWorld:{
  left:shoe(-.157,-.2,-.022,-.022),
  right:shoe(.158,-.2,.188,-.078)
 }
});
test('RED-first: original clone, next native frame, unchanged public tick and real four weighted shoes yield only diagnostic data',()=>{
 const r=pair({before:sample(),after:next(),floorTopY:-.02});
 assert.equal(r?.eligible,true);
 assert.equal(r.frameDelta,1);
 assert.ok(Math.abs(r.elapsedSeconds-.05)<1e-9);
 assert.ok(Math.abs(r.rootTravelMeters-.003)<1e-9);
 assert.ok(Math.abs(r.shoes.right.afterToeBurialMeters-.058)<1e-9);
 assert.ok(Math.abs(r.shoes.right.swingToeLiftMeters-.012)<1e-9);
 assert.ok(Math.abs(r.shoes.left.heelSlideRelativeToRootMeters)<1e-10);
 assert.equal(r.contactLocked,false);
 assert.equal(r.plantCertified,false,'two skinned samples alone cannot prove a legal foot plant');
});
test('RED-first: no pair across different source clones, public ticks, checksum, clips, weapon grips or unordered renderer frames',()=>{
 const invalid=[
  [{sourceInstanceId:'replaced-rig'},'different-source-instance'],
  [{authorityTick:9},'different-authority-tick'],
  [{checksum:'another-tick'},'different-authority-checksum'],
  [{sourceClip:'Idle'},'not-original-walking-source'],
  [{sourceWeight:.7},'unowned-source-walk'],
  [{frame:101},'not-consecutive-render-frame'],
  [{frame:108},'not-consecutive-render-frame'],
  [{sourceWeaponGrip:{attachedToGripSocket:false,socketName:'handslotr'}},'source-hand-grip-not-attached'],
  [{visible:false},'not-visible'],
  [{timeMs:1900},'invalid-render-interval'],
  [{sourceSolePatchWorld:{left:shoe(0,0,0,0),right:{toe:[0,0,0]}}},'invalid-original-skinned-shoes'],
  [{rootWorld:[NaN,0,0]},'invalid-source-root'],
  [{actorId:'another-actor'},'different-source-actor']
 ];
 for(const [change,reason] of invalid){
  const r=pair({before:sample(),after:{...next(),...change},floorTopY:-.02});
  assert.equal(r?.eligible,false,JSON.stringify(change));
  assert.equal(r?.reason,reason,JSON.stringify(change));
 }
});
test('RED-first: stationary, teleport-sized and reversed source-time samples cannot fabricate ground motion',()=>{
 const invalid=[
  [{rootWorld:[0,0,0]},'no-witnessed-root-travel'],
  [{rootWorld:[.7,0,0]},'discontinuous-source-root'],
  [{sourceClipTime:-.1},'invalid-source-clip-time']
 ];
 for(const [change,reason] of invalid){
  const r=pair({before:sample(),after:{...next(),...change},floorTopY:-.02});
  assert.equal(r?.eligible,false);
  assert.equal(r?.reason,reason);
 }
 assert.equal(pair({before:null,after:next(),floorTopY:-.02}).eligible,false);
 assert.equal(pair({before:sample(),after:null,floorTopY:-.02}).eligible,false);
});

test('RED: pose-only source-rig motion can be witnessed without inventing root travel or a planted foot',()=>{
 const {auditOriginalSourcePoseOnlyPair:poseOnly}=require(
  '../browser/dungeon-session03-original-skin-pair.cjs');
 assert.equal(typeof poseOnly,'function','requires a separate original source-pose evidence contract');
 const a=sample();
 const b={...next(),rootWorld:[0,0,0]};
 // Same ORIGINAL weighted source clip advances the toes within a native
 // renderer frame while the authoritative root remains stationary.
 // These are synthetic contract points, NOT genuine after-change WebGL.
 assert.equal(pair({before:a,after:b,floorTopY:-.02}).reason,
  'no-witnessed-root-travel','moving-root contract must stay strict');
 const r=poseOnly({before:a,after:b,floorTopY:-.02});
 assert.equal(r?.poseEligible,true);
 assert.equal(r.eligible,false,'source-only motion must never be a locomotion receipt');
 assert.equal(r.poseOnly,true);
 assert.equal(r.contactLocked,false);
 assert.equal(r.plantCertified,false);
 assert.equal(r.rootTravelMeters,0);
 assert.equal(r.source,'two-live-original-pose-only-rAF-soles');
 assert.ok(r.sourceClipPhaseDeltaSeconds>.04);
 assert.ok(r.shoes.right.swingToeLiftMeters>.01);
 for(const altered of [
  {sourceInstanceId:'another-original-clone'},
  {checksum:'unrelated-authority-tick'},
  {authorityTick:11},{sourceClip:'Idle'},
  {sourceWeight:.3},{sourceClipTime:a.sourceClipTime},
  {sourceWeaponGrip:{socketName:'handslotr',attachedToGripSocket:false}}
 ]){
  const invalid=poseOnly({before:a,after:{...b,...altered},floorTopY:-.02});
  assert.equal(Boolean(invalid?.poseEligible),false,
   'no stale GLB, clip or event may qualify a source-only motion: '+JSON.stringify(altered));
 }
});

test('source-native same-clone next rAF leg-quaternion and original handslot socket audit (never a planted contact)',()=>{
 const {auditOriginalSourceJointFramePair:jointPair}=require(
  '../browser/dungeon-session03-original-skin-pair.cjs');
 const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 const pose=t=>Object.fromEntries(['left','right'].map(side=>[
  side,Object.fromEntries(['upper','lower','foot','toes'].map((part,i)=>{
   const prefix={upper:'upperleg',lower:'lowerleg',foot:'foot',toes:'toes'};
   const name=prefix[part]+(side==='left'?'.l':'.r');
   const angle=t*(i+1);
   const q=[Math.sin(angle/2),0,0,Math.cos(angle/2)];
   return [part,{name,localQuaternion:q,worldQuaternion:q,
    worldPosition:[i*.1,.4-i*.1,side==='left'?-.1:.1]}];
  }))]));
 const socket={socketName:'handslotr',attachedToGripSocket:true,
  socketRelativeMatrix:identity};
 const before=sample({sourceLegBonePose:pose(0),sourceWeaponGrip:socket});
 const after={...next(),sourceLegBonePose:pose(.02),sourceWeaponGrip:socket};
 const result=jointPair({before,after,floorTopY:-.02});
 assert.equal(result.jointPoseEligible,true);
 assert.equal(result.originalWeaponSocketRigid,true);
 assert.equal(result.sourceLegs.right.foot.boneName,'foot.r');
 assert.ok(Math.abs(result.sourceLegs.right.foot.localAngularChangeRad-.06)<1e-7);
 // The REAL original 41-joint GLB uses dotted names; GLTFLoader sanitizes
 // them in live WebGL. Both identify the SAME source bone and skin weights.
 const sanitized={...after,sourceLegBonePose:Object.fromEntries(
  Object.entries(after.sourceLegBonePose).map(([side,joints])=>[
   side,Object.fromEntries(Object.entries(joints).map(([part,joint])=>[
    part,{...joint,name:joint.name.replaceAll('.','')}]))]))};
 const sanitizedBefore={...before,sourceLegBonePose:Object.fromEntries(
  Object.entries(before.sourceLegBonePose).map(([side,joints])=>[
   side,Object.fromEntries(Object.entries(joints).map(([part,joint])=>[
    part,{...joint,name:joint.name.replaceAll('.','')}]))]))};
 const runtime=jointPair({before:sanitizedBefore,after:sanitized,floorTopY:-.02});
 assert.equal(runtime.jointPoseEligible,true);
 assert.equal(runtime.sourceLegs.right.foot.boneName,'footr');
 assert.ok(result.sourceLegs.left.toes.localAngularRateRadPerSecond>0);
 assert.equal(result.contactLocked,false);
 assert.equal(result.plantCertified,false);
 const renamed={...after,sourceLegBonePose:{...after.sourceLegBonePose,
  right:{...after.sourceLegBonePose.right,
   foot:{...after.sourceLegBonePose.right.foot,name:'replacement-foot'}}}};
 assert.equal(jointPair({before,after:renamed,floorTopY:-.02}).jointReason,
  'missing-or-replaced-original-source-bone');
 const noSocket={...after,sourceWeaponGrip:{
  socketName:'handslotr',attachedToGripSocket:true}};
 assert.equal(jointPair({before,after:noSocket,floorTopY:-.02}).jointReason,
  'missing-original-weapon-socket-matrix');
 assert.equal(jointPair({before,after:{...after,sourceInstanceId:'other-glb'},floorTopY:-.02}).jointPoseEligible,false);
});

test('RED: genuine 390px original GLB joint matrix 0.978129 quaternion scale remains inspectable without concealing distortion',()=>{
 const {auditOriginalSourceJointFramePair:jointPair}=require(
  '../browser/dungeon-session03-original-skin-pair.cjs');
 // #44757675602, original mobile WebGL frame 24: source lowerlegl
 // world quaternion modulus 0.9781286541031362. Unlike a clean
 // unit quaternion, this GLTFLoader-decomposed matrix has a 2.187%
 // norm deficit. Report it, DO NOT mutate a pose or certify deformation.
 const pose=(norm=1)=>Object.fromEntries(['left','right'].map(side=>[
  side,Object.fromEntries(['upper','lower','foot','toes'].map(part=>{
   const name={upper:'upperleg',lower:'lowerleg',foot:'foot',toes:'toes'}[part]+
    (side==='left'?'l':'r');
   const measured=side==='left'&&part==='lower'?
    [0.9781286541031362,0,0,0]:[1,0,0,0];
   return [part,{name,localQuaternion:[1,0,0,0],
    worldQuaternion:norm===1?measured:measured.map(v=>v*norm),
    worldPosition:[.1,.2,.3]}];
  }))]));
 const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 const grip={socketName:'handslotr',attachedToGripSocket:true,
  socketRelativeMatrix:identity};
 const a=sample({sourceLegBonePose:pose(),sourceWeaponGrip:grip});
 const b={...next(),sourceLegBonePose:pose(),sourceWeaponGrip:grip};
 const result=jointPair({before:a,after:b,floorTopY:-.02});
 assert.equal(result.jointPoseEligible,true,
  'the genuine 2.187% decomposed matrix must not erase all eight bone witnesses');
 assert.equal(result.originalWeaponSocketRigid,true);
 assert.equal(result.contactLocked,false);
 assert.equal(result.plantCertified,false);
 assert.ok(result.maxWorldQuaternionNormError>.021&&
  result.maxWorldQuaternionNormError<.023);
 assert.equal(result.deformationReviewRequired,true,
  'world matrix normalization is a warning, never source skin integrity approval');
 const invalid={...b,sourceLegBonePose:{...b.sourceLegBonePose,
  left:{...b.sourceLegBonePose.left,
   lower:{...b.sourceLegBonePose.left.lower,
    worldQuaternion:[.94,0,0,0]}}}};
 assert.equal(jointPair({before:a,after:invalid,floorTopY:-.02}).jointReason,
  'invalid-original-source-joint-quaternion',
  'larger rig/matrix distortion must remain rejected');
});


/**
 * Session 03 original 41-joint walking/shoe bridge: this is a REAL Three.js
 * SkinnedMesh transform reproduction, NOT an original GLB video certificate.
 * The source fallback and linked thigh/calf/ankle acceptance read the same
 * weighted world heel/toe. A stale attached bind inverse can double the
 * apparent root translation or produce false pitch after a body lean.
 *
 * Ref: genuine mobile 22 Nov native run #45014048699 saw a 7.544mm supported
 * lean but still 57.51mm toe penetration. Canonical source readback is a
 * prerequisite to correcting that visual burial without invented plants.
 */
test('RED: every connected original-rig source-sole world witness uses the freshly skinned canonical XYZ reader',()=>{
 const THREE=require('three');
 const fs=require('node:fs');
 const path=require('node:path');
 const source=fs.readFileSync(path.resolve(__dirname,
  '../../public/ai-dungeon/model-assets.js'),'utf8');
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([.14,-.051,.08],3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute([0,0,0,0],4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute([1,0,0,0],4));
 const material=new THREE.MeshBasicMaterial();
 const pivot=new THREE.Group(),mesh=new THREE.SkinnedMesh(geometry,material);
 const foot=new THREE.Bone();foot.name='original-source-foot';
 mesh.add(foot);pivot.add(mesh);pivot.updateMatrixWorld(true);
 mesh.bind(new THREE.Skeleton([foot]));mesh.updateMatrixWorld(true);
 const sampled=refresh=>{
  if(refresh)mesh.updateMatrixWorld(true);
  const p=new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'),0);
  return mesh.applyBoneTransform(0,p).applyMatrix4(mesh.matrixWorld);
 };
 const before=sampled(true);
 pivot.position.y=.006;pivot.rotation.z=.04233;
 pivot.updateWorldMatrix(true,true);
 const expected=before.clone().applyAxisAngle(new THREE.Vector3(0,0,1),.04233);
 expected.y+=.006;
 assert.ok(sampled(false).distanceTo(expected)>.001,
  'unrefreshed attached original skin inverse produces a wrong source world sole');
 assert.ok(sampled(true).distanceTo(expected)<1e-6,
  'true original weighted sole must follow world body motion one-for-one');
 pivot.position.y=0;pivot.rotation.z=0;pivot.updateWorldMatrix(true,true);
 assert.ok(sampled(true).distanceTo(before)<1e-6,
  'on rejection restore exact original sole without stale attached bind inverse');
 geometry.dispose();material.dispose();
 const begin=source.indexOf('function sourceSkinnedSoleWorld(candidate){');
 const end=source.indexOf('function sourceWeaponHandGrip(',begin);
 assert.ok(begin>0&&end>begin);
 const live=source.slice(begin,end);
 assert.match(live,/readOriginalSwingSoleSample\(candidate\)/,
  'every source thigh/calf/ankle, gait, and final shoe witness must use canonical refreshed weighted original XYZ sampler');
 assert.doesNotMatch(live,/mesh\.updateWorldMatrix\(true,false\)/,
  'legacy parent-only update bypasses Three.js attached SkinnedMesh bind inverse');
 assert.ok((source.match(/sourceSkinnedSoleWorld\(/g)||[]).length>=10,
  'the correction must reach the existing connected source-rig locomotion and final-sole evidence sites');
});
