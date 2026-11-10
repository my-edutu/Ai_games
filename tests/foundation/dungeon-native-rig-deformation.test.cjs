'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/native-rig-deformation-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const bones=()=>[{name:'Hips',quaternion:[0,0,0,1],matrix:identity()},
 {name:'RightArm',quaternion:[0,.087,0,.996208],matrix:identity()}];
const sample=()=>({skinnedMeshes:7,bones:bones(),segments:[
 {name:'left-arm',from:[0,1.52,0],to:[.22,1.24,0],connected:true},
 {name:'left-forearm',from:[.22,1.24,0],to:[.39,1.03,0],connected:true},
 {name:'right-arm',from:[0,1.52,0],to:[-.22,1.24,0],connected:true},
 {name:'right-forearm',from:[-.22,1.24,0],to:[-.39,1.03,0],connected:true},
 {name:'left-thigh',from:[.14,.9,0],to:[.14,.52,.08],connected:true},
 {name:'left-calf',from:[.14,.52,.08],to:[.14,.10,.05],connected:true},
 {name:'right-thigh',from:[-.14,.9,0],to:[-.14,.52,.08],connected:true},
 {name:'right-calf',from:[-.14,.52,.08],to:[-.14,.10,.05],connected:true}
]});

test('genuine skinned-chain measurements remain finite with 8 original arm/leg joints',async()=>{
 const {measureSourceRigDeformation:measure}=await load();
 const src=sample(),first=measure(src);
 assert.equal(first.segments.length,8);
 assert.equal(first.validSegments,8);
 assert.equal(first.disconnectedSegments,0);
 assert.equal(first.invalidSegments,0);
 assert.equal(first.invalidMatrixCount,0);
 assert.equal(first.invalidQuaternionCount,0);
 assert.ok(first.maxQuaternionError<.001);
 assert.equal(first.maxStretchFraction,0);
 assert.equal(first.skinnedMeshes,7);
 assert.deepEqual(measure(src,first).segments,first.segments);
 assert.equal(src.segments.length,8,'the audit must not mutate source samples');
});

test('leg length does not change under legal root translation or whole actor yaw',async()=>{
 const {measureSourceRigDeformation:measure}=await load();
 const src=sample(),baseline=measure(src);
 const moved=sample();
 for(const s of moved.segments)for(const key of ['from','to']){
  const [x,y,z]=s[key];
  s[key]=[3+z,y,-2-x]; // rigid 90-degree turn + real world travel
 }
 const turn=measure(moved,baseline);
 assert.equal(turn.maxStretchFraction,0,'world travel and yaw cannot stretch source limb chains');
 assert.equal(turn.disconnectedSegments,0);
});

test('true broken joint hierarchy and physical limb stretch are independently flagged',async()=>{
 const {measureSourceRigDeformation:measure}=await load();
 const baseline=measure(sample()),bad=sample();
 bad.segments[0].connected=false;
 bad.segments[2].to=[-.65,1.15,0];
 const report=measure(bad,baseline);
 assert.equal(report.disconnectedSegments,1);
 assert.ok(report.maxStretchFraction>.4);
 assert.equal(report.validSegments,7);
});

test('nonfinite bones, bad matrices, malformed segments and huge values cannot masquerade as valid source skeleton',async()=>{
 const {measureSourceRigDeformation:measure}=await load();
 const bad=sample();
 bad.bones[0].quaternion=[NaN,0,0,1];
 bad.bones[1].matrix[7]=Infinity;
 bad.segments[0].from=[NaN,0,0];
 bad.segments[1].to=[Infinity,1,1];
 bad.segments[2].to=[100,0,0];
 const report=measure(bad);
 assert.equal(report.invalidQuaternionCount,1);
 assert.equal(report.invalidMatrixCount,1);
 assert.equal(report.invalidSegments,3);
 assert.ok(report.sampledBones<=128);
 assert.equal(measure(null).validSegments,0);
 assert.equal(measure({segments:[],bones:[]}).validSegments,0);
 const code=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(code,/DungeonRuntime|Math\.random|fetch\(|performance\.now|Date\.now|requestAnimationFrame/);
});

test('real GLB deformation audit is explicitly sampled, bounded, and joined to actual browser evidence',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-full-body-animation.spec.cjs'),'utf8');
 assert.match(model,/function inspectSourceRigDeformation\(actors\)/);
 assert.match(model,/const sourceRigDeformationBaselines=new WeakMap\(\)/);
 assert.match(model,/sourceRigDeformationBaselines\.set\(actor\.assetRoot,baseline\)/);
 assert.match(model,/export \{attachCharacter,updateActor,disposeActorAsset,putEnvironment,stats,inspectSourceRigDeformation\}/);
 assert.match(app,/window\.__DUNGEON_SOURCE_RIG_DEFORMATION__=\(\)=>inspectSourceRigDeformation\(actors\)/);
 assert.match(server,/\/dungeon\/native-rig-deformation-plan\.js/);
 assert.match(browser,/__DUNGEON_SOURCE_RIG_DEFORMATION__/);
 assert.doesNotMatch(model,/requestAnimationFrame\([\s\S]*?inspectSourceRigDeformation\(/,
  'the expensive segment scan must be demand driven only');
});


test('live deformation reference comes from original inverse-bind matrices, never first moving pose',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/o\.skeleton\.boneInverses/);
 assert.match(model,/inverse\.clone\(\)\.invert\(\)/);
 assert.match(model,/baseline=measureSourceRigDeformation\(\{segments:bindSegments/);
 assert.doesNotMatch(model,/baseline=measureSourceRigDeformation\(sample\)/);
 assert.match(model,/bindReferenceComplete:actorsOut\.length>0&&actorsOut\.every/);
 assert.match(model,/sourceRigDeformationBaselines\.set\(actor\.assetRoot,baseline\)/);
});

test('source GLB joint-world trajectory distinguishes ankle displacement from whole-actor travel',async()=>{
 const {measureSourceJointTravel:measure}=await load();
 const p={id:'v',kind:'vanguard',sourceInstanceId:'original-1',rootWorld:[0,0,0],
  groundedFootPhase:.25,footJointWorld:{left:[-.1,.09,0],right:[.1,.08,0]}};
 const q={...p,rootWorld:[.2,0,0],groundedFootPhase:.28,
  footJointWorld:{left:[-.09,.09,0],right:[.3,.08,0]}};
 const result=measure(p,q);
 assert.equal(result.comparable,true);assert.equal(result.rootTravelMeters,.2);
 assert.deepEqual(result.footWorldDeltaMeters,{left:.01,right:.2});
 assert.deepEqual(result.footRelativeToRootDeltaMeters,{left:.19,right:0});
 assert.equal(result.source,'original-world-ankle-joints-not-sole-contact');
 assert.deepEqual(p.rootWorld,[0,0,0]);
});

test('missing ankle, nonfinite matrices and re-created source clones fail closed',async()=>{
 const {measureSourceJointTravel:measure}=await load();
 const p={id:'v',kind:'ranger',sourceInstanceId:'source-one',
  rootWorld:[0,0,0],footJointWorld:{left:[-.1,0,0],right:[.1,0,0]}};
 assert.equal(measure(p,{...p,sourceInstanceId:'recreated'}).reason,'different-source-actor');
 assert.equal(measure(p,{...p,rootWorld:[NaN,0,0]}).reason,'missing-world-root');
 assert.equal(measure(p,{...p,footJointWorld:{left:null,right:[.1,0,0]}}).reason,'missing-original-foot-joint');
 assert.equal(measure(p,{...p,footJointWorld:{left:[Infinity,0,0],right:[.1,0,0]}}).comparable,false);
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-full-body-animation.spec.cjs'),'utf8');
 assert.match(model,/footJointWorld=\{left:worldJoint\(feet\.left\),right:worldJoint\(feet\.right\)\}/);
 assert.match(model,/sourceInstanceId:actor\.assetRoot\.uuid,rootWorld,footJointWorld/);
 assert.match(browser,/measureSourceJointTravel\(beforeActor,walkingActor\)/);
});


test('source GLB sole vertex and hand-attached weapon remain comparable only on the same real clone',async()=>{
 const {measureSourceSoleGripContinuity:measure}=await load();
 const grip=[1,0,0,0, 0,1,0,0, 0,0,1,0, .02,.03,-.12,1];
 const before={id:'hero',kind:'vanguard',sourceInstanceId:'source-1',
  rootWorld:[0,0,0],soleVertexWorld:{left:[-.12,.008,.11],right:[.12,.045,-.10]},
  sourceWeaponGrip:{name:'1H_Sword',handName:'hand.r',attachedToHand:true,handRelativeMatrix:grip}};
 const after={...before,rootWorld:[.20,0,0],
  soleVertexWorld:{left:[-.11,.008,.11],right:[.31,.064,-.18]},
  sourceWeaponGrip:{...before.sourceWeaponGrip,handRelativeMatrix:grip.slice()}};
 const result=measure(before,after);
 assert.equal(result.comparable,true);
 assert.equal(result.source,'original-skinned-sole-vertex-and-rigid-source-hand-weapon');
 assert.equal(result.rootTravelMeters,.2);
 assert.deepEqual(result.soleWorldDeltaMeters,{left:.01,right:.2062});
 assert.deepEqual(result.soleVerticalDeltaMeters,{left:0,right:.019});
 assert.equal(result.rigidGripComparable,true);
 assert.equal(result.weaponHandDriftMeters,0);
 assert.equal(result.weaponLocalMatrixMaxDelta,0);
 const drift=measure(before,{...after,sourceWeaponGrip:{...after.sourceWeaponGrip,
  handRelativeMatrix:grip.map((v,i)=>i===12?v+.13:v)}});
 assert.ok(drift.weaponHandDriftMeters>.12,'real hand/weapon separation cannot be mistaken for stable grip');
 assert.equal(measure(before,{...after,sourceInstanceId:'other'}).reason,'different-source-actor');
 assert.equal(measure(before,{...after,soleVertexWorld:{left:null,right:[.31,.06,-.18]}}).reason,'missing-skinned-sole');
 assert.equal(measure(before,{...after,soleVertexWorld:{left:[Infinity,0,0],right:[.31,.06,-.18]}}).comparable,false);
 assert.equal(measure(before,{...after,sourceWeaponGrip:{...after.sourceWeaponGrip,attachedToHand:false}}).rigidGripComparable,false);
 assert.deepEqual(before.rootWorld,[0,0,0],'pure evidence contract must not pose or mutate the actual actor');
});

test('original GLB sole evidence samples skinned foot-weighted vertices and rigid grip only on demand',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-full-body-animation.spec.cjs'),'utf8');
 assert.match(model,/function inspectSourceRigDeformation\(actors\)/);
 assert.match(model,/applyBoneTransform\(/,'a real skinned source vertex, not a guessed toe node, must be sampled');
 assert.match(model,/sourceSoleVertexCache=new WeakMap\(\)/,'source vertex selection must be cached, not rescanned every frame');
 assert.match(model,/soleVertexWorld:/);
 assert.match(model,/sourceWeaponGrip:/);
 assert.match(browser,/measureSourceSoleGripContinuity/);
 assert.match(browser,/source-GLB-sole-and-hand-evidence/);
 assert.doesNotMatch(model,/requestAnimationFrame\([\s\S]*?applyBoneTransform\(/,
  'expensive source skinned vertex samples must be explicitly on demand only');
});


test('GLTFLoader-sanitized foot bone names identify real original weighted sole candidates',async()=>{
 const {isSourceSoleBoneName}=await load();
 assert.equal(typeof isSourceSoleBoneName,'function',
  'the on-demand source skin witness must handle GLTFLoader stripping the dot from foot.l/toes.l');
 for(const [name,side] of [['footl','left'],['toesl','left'],['footr','right'],['toesr','right'],
  ['foot.l','left'],['toes.l','left'],['foot.r','right'],['toes.r','right']])
  assert.equal(isSourceSoleBoneName(name,side),true,name+':'+side);
 for(const name of ['control-foot-roll.l','IK-footl','IK-toel','handr','calfl','foot','footx',null]){
  assert.equal(isSourceSoleBoneName(name,'left'),false,String(name));
  assert.equal(isSourceSoleBoneName(name,'right'),false,String(name));
 }
 assert.equal(isSourceSoleBoneName('footl','right'),false);
 assert.equal(isSourceSoleBoneName('footr','left'),false);
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/isSourceSoleBoneName\(bone\?\.name,'left'\)/,
  'the actual cloned SkeletonUtils skin audit must use the source-name normalization');
 assert.match(renderer,/isSourceSoleBoneName\(bone\?\.name,'right'\)/);
});


test('licensed 1H_Sword remains fixed in animated handslot.r, not artificially fixed in the hand bone',async()=>{
 const {measureSourceSoleGripContinuity:measure}=await load();
 const baseMatrix=[1,0,0,0,0,1,0,0,0,0,1,0,.0619,.2323,-.1573,1];
 const sourceSocket=[1,0,0,0,0,1,0,0,0,0,1,0,.16,-.0619,-.1141,1];
 const sample={id:'vanguard',kind:'vanguard',sourceInstanceId:'licensed-source-clone',
  rootWorld:[0,0,0],soleVertexWorld:{left:[-.1,.15,.1],right:[.1,.15,.1]},
  sourceWeaponGrip:{name:'1H_Sword',handName:'handr',attachedToHand:true,
   socketName:'handslotr',attachedToGripSocket:true,socketRelativeMatrix:sourceSocket,
   handRelativeMatrix:baseMatrix}};
 // Exact original CC0 clip hierarchy: hand.r > handslot.r > 1H_Sword;
 // 1H_Melee_Attack_Slice_Horizontal keys the handslot.r rotation while the
 // sword's grip remains rigid relative to that slot. The current filmed trace
 // measures 0.0369-0.0513m hand-relative translation on a LEGAL source strike.
 const attackMatrix=[...baseMatrix];
 attackMatrix[12]=.1064;attackMatrix[13]=.2069;
 const attack={...sample,sourceWeaponGrip:{...sample.sourceWeaponGrip,
  handRelativeMatrix:attackMatrix,socketRelativeMatrix:sourceSocket.slice()}};
 const valid=measure(sample,attack);
 assert.equal(valid.comparable,true);
 assert.equal(valid.rigidGripComparable,true);
 assert.equal(valid.sourceGripSocketName,'handslotr');
 assert.ok(valid.weaponHandDriftMeters>.05,
  'preserve diagnostic proof of independently keyed ORIGINAL socket articulation');
 assert.equal(valid.weaponSocketDriftMeters,0,
  'a legitimate original handslot rotation cannot masquerade as a dropped sword');
 assert.equal(valid.weaponSocketMatrixMaxDelta,0);
 const displaced=[...sourceSocket];displaced[12]+=.08;
 const slipping=measure(sample,{...attack,sourceWeaponGrip:{...attack.sourceWeaponGrip,
  socketRelativeMatrix:displaced}});
 assert.ok(slipping.weaponSocketDriftMeters>.079,
  'a real weapon slipped 8cm from its authored source socket MUST be rejected');
 assert.equal(measure(sample,{...attack,sourceWeaponGrip:{...attack.sourceWeaponGrip,
  attachedToGripSocket:false}}).rigidGripComparable,false);
 assert.equal(measure(sample,{...attack,sourceWeaponGrip:{...attack.sourceWeaponGrip,
  socketName:'handslotl'}}).rigidGripComparable,false);
});
