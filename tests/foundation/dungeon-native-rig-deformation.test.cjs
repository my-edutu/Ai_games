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
 const namedExports=model.match(/^export \{([^}]+)\};?$/m)?.[1]?.split(',').map(name=>name.trim());
 assert.ok(namedExports,'original rig adapter must have an explicit named export contract');
 for(const name of ['attachCharacter','updateActor','stageRigWalkingFacingAfterRootYaw',
  'disposeActorAsset','putEnvironment','stats','inspectSourceRigDeformation']){
  assert.ok(namedExports.includes(name),`missing original-rig public export: ${name}`);
 }
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
 assert.match(model,/sourceInstanceId:actor\.assetRoot\.uuid,rootWorld,[\s\S]{0,360}rootYaw:[\s\S]{0,160}footJointWorld/,
  'original source foot inspector must preserve clone/root/foot association and include actual yaw');
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


test('real-source sole microframe evidence distinguishes potential stance from foot translation without inventing an IK pass',async()=>{
 const {assessSourceSoleFrameWindow:assess}=await load();
 assert.equal(typeof assess,'function','original GLB source-foot evidence requires a same-tick visible-frame classifier');
 const first={id:'vanguard',kind:'vanguard',sourceInstanceId:'source-live-1',mode:'move',
  rootWorld:[0,0,0],soleVertexWorld:{left:[-.20,.21,0],right:[.20,.21,0]}};
 const next={...first,rootWorld:[.12,0,0],soleVertexWorld:{
  left:[-.196,.213,0],right:[.345,.242,0]}};
 const meta={beforeTick:28,afterTick:28,beforeFrame:70,afterFrame:71};
 const supported=assess(first,next,meta);
 assert.equal(supported.comparable,true);
 assert.equal(supported.classification,'potential-plant');
 assert.deepEqual(supported.potentialPlantSides,['left']);
 assert.ok(supported.rootTravelMeters>=.119);
 assert.ok(supported.soleWorldDeltaMeters.left<.01);
 const gliding={...next,soleVertexWorld:{left:[-.079,.21,0],right:[.32,.21,0]}};
 const uncertified=assess(first,gliding,meta);
 assert.equal(uncertified.comparable,true);
 assert.equal(uncertified.classification,'no-observed-plant');
 assert.deepEqual(uncertified.potentialPlantSides,[]);
 assert.equal(uncertified.ikAccepted,false,'a two-frame sample cannot justify a world-space IK claim');
 const still={...first,soleVertexWorld:{left:[-.12,.21,0],right:[.25,.21,0]}};
 assert.equal(assess(first,still,meta).classification,'stationary-source-sole-motion');
 for(const [reason,patch,b,a] of [
  ['same-frame',{afterFrame:70},first,next],
  ['skipped-tick',{afterTick:29},first,next],
  ['reverse-frame',{afterFrame:69},first,next],
  ['no-frame',{afterFrame:NaN},first,next],
  ['teleport',{teleport:true},first,next],
  ['invisible',{visible:false},first,next],
  ['new-source',{},first,{...next,sourceInstanceId:'other'}],
  ['nonfinite-world',{},first,{...next,soleVertexWorld:{left:[NaN,0,0],right:[1,0,0]}}],
  ['not-traversing',{},first,{...next,mode:'attack'}],
  ['skipped-root',{},first,{...next,rootWorld:[1.2,0,0]}]
 ])assert.equal(assess(b,a,{...meta,...patch}).comparable,false,reason+' cannot certify a visible stance');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-full-body-animation.spec.cjs'),'utf8');
 assert.match(browser,/assessSourceSoleFrameWindow\(/,'live Chromium source-rig test must actually consume the classifier');
 assert.match(browser,/same-tick-real-mixer-sole-window/,'browser must attach honest same-tick source-rig frame evidence');
});


test('actual fast native WebGL displacement remains measurable without claiming a planted sole',async()=>{
 const {assessSourceSoleFrameWindow:assess}=await load();
 // 10 November 2026 exact-head original Chromium: the genuine root can
 // advance ~0.44m across two visible frames of one UNCHANGED authority tick.
 // The former .35m evidence gate discarded the very largest observed slip.
 const before={id:'hero-1',kind:'vanguard',sourceInstanceId:'real-GLB-1',mode:'move',
  rootWorld:[-7.46,0,-7],soleVertexWorld:{
   left:[-7.27455,.20159,-6.83351],right:[-7.29462,.17648,-7.25512]}};
 const after={...before,rootWorld:[-7.01924,0,-7],soleVertexWorld:{
   left:[-6.78144,.21709,-6.86607],right:[-6.77470,.21066,-7.25794]}};
 const meta={beforeTick:3,afterTick:3,beforeFrame:24,afterFrame:26,visible:true};
 const evidence=assess(before,after,meta);
 assert.equal(evidence.comparable,true,'genuine >.35m root travel must be reported, not erased');
 assert.equal(evidence.classification,'rapid-root-travel-unresolved');
 assert.deepEqual(evidence.potentialPlantSides,[],
  'no flat-ground or world-space IK evidence at fast native travel');
 assert.equal(evidence.ikAccepted,false);
 assert.ok(evidence.rootTravelMeters>.43);
 assert.ok(evidence.soleWorldDeltaMeters.left>.49);
 assert.ok(evidence.soleWorldDeltaMeters.right>.51);
 assert.equal(assess(before,{...after,rootWorld:[-6.80,0,-7]},meta).comparable,false,
  'larger-than-physical source jumps still fail closed');
 assert.equal(assess(before,after,{...meta,afterTick:4}).comparable,false);
 assert.equal(assess(before,after,{...meta,teleport:true}).comparable,false);
});


test('original GLB heel-to-toe CONTACT PATCH must be witnessed against the actual upper tile surface, not inferred from an ankle',async()=>{
 const {measureSourceSolePatchContinuity:measure}=await load();
 assert.equal(typeof measure,'function');
 const first={id:'vanguard',kind:'vanguard',sourceInstanceId:'real-source-1',mode:'move',
  rootWorld:[0,0,0],solePatchWorld:{
   left:{heel:[-.16,-.018,-.13],toe:[-.16,-.015,.07]},
   right:{heel:[.16,.17,-.12],toe:[.16,.18,.07]}}};
 const next={...first,rootWorld:[.15,0,0],solePatchWorld:{
  left:{heel:[-.157,-.017,-.129],toe:[-.154,-.016,.073]},
  right:{heel:[.30,.20,-.13],toe:[.31,.21,.08]}}};
 const m={beforeTick:24,afterTick:24,beforeFrame:32,afterFrame:33,
  floorTopY:-.02,floorEvidence:'authored-cube-floor-top',visible:true};
 const witness=measure(first,next,m);
 assert.equal(witness.comparable,true);
 assert.deepEqual(witness.potentialContactSides,['left'],
  'both separated skinned shoe points must be near actual floor and stationary during true root travel');
 assert.equal(witness.provenFootPlant,false,'two samples cannot establish full sole lock or gait correctness');
 assert.equal(witness.ikAccepted,false,'do not authorize IK from this evidence');
 assert.ok(witness.patchSpanMeters.left>=.19);
 assert.ok(witness.soleClearanceMeters.right>.08);
 const hover=measure({...first,solePatchWorld:{...first.solePatchWorld,
  left:{heel:[-.16,.21,-.13],toe:[-.16,.22,.07]}}},
  {...next,solePatchWorld:{...next.solePatchWorld,
   left:{heel:[-.157,.21,-.129],toe:[-.154,.22,.073]}}},m);
 assert.equal(hover.potentialContactSides.length,0,'horizontal stationarity alone is not grounded support');
 for(const [why,changes,a,b] of [
  ['missing-floor',{floorTopY:NaN},first,next],
  ['unverified-surface',{floorEvidence:'guess'},first,next],
  ['different-tick',{afterTick:25},first,next],
  ['skipped-frame',{afterFrame:35},first,next],
  ['invisible',{visible:false},first,next],
  ['teleport',{teleport:true},first,next],
  ['source-changed',{},first,{...next,sourceInstanceId:'wrong'}],
  ['invalid-patch',{},first,{...next,solePatchWorld:{...next.solePatchWorld,left:{heel:[NaN,0,0],toe:[0,0,0]}}}],
  ['unmeasurable-root',{},first,{...next,rootWorld:[2,0,0]}]
 ])assert.equal(measure(a,b,{...m,...changes}).comparable,false,why);
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-full-body-animation.spec.cjs'),'utf8');
 assert.match(renderer,/sourceSolePatchWorld/,'actual original skinned heel and toe must be observable');
 assert.match(renderer,/sourceSolePatchVertexCache=new WeakMap\(\)/);
 assert.match(browser,/measureSourceSolePatchContinuity\(/,'the real running WebGL suite must exercise the patch contract');
 assert.match(browser,/source-GLB-floor-contact-patch/,'the unaltered source evidence must be attached');
});


test('runtime original sourceSolePatchWorld diagnostic must yield real two-point contact evidence',async()=>{
 const {measureSourceSolePatchContinuity:measure}=await load();
 // Exact original Chromium rAF probe emits sourceSolePatchWorld. The older
 // synthetic unit fixture used solePatchWorld instead, hiding the mismatch.
 const first={id:'vanguard',kind:'vanguard',sourceInstanceId:'licensed-native-41-joint',
  mode:'move',rootWorld:[-7.46,0,-7],
  sourceSolePatchWorld:{
   left:{heel:[-7.63,-.018,-7.15],toe:[-7.63,-.015,-6.95]},
   right:{heel:[-7.3,.17,-7.13],toe:[-7.3,.18,-6.94]}}};
 const last={...first,rootWorld:[-7.31,0,-7],
  sourceSolePatchWorld:{
   left:{heel:[-7.627,-.017,-7.149],toe:[-7.624,-.016,-6.947]},
   right:{heel:[-7.16,.20,-7.13],toe:[-7.15,.21,-6.93]}}};
 const meta={beforeFrame:45,afterFrame:46,beforeTick:3,afterTick:3,
  visible:true,floorTopY:-.02,floorEvidence:'authored-cube-floor-top'};
 const evidence=measure(first,last,meta);
 assert.equal(evidence.comparable,true,
  'actual renderer diagnostic field must not be rejected as a missing shoe patch');
 assert.equal(evidence.rootTravelMeters,.15);
 assert.deepEqual(evidence.potentialContactSides,['left']);
 assert.equal(evidence.provenFootPlant,false);
 assert.equal(evidence.ikAccepted,false);
 assert.equal(measure(first,{...last,sourceSolePatchWorld:null},meta).comparable,false);
});


test('RED: real 390px single-vertex apparent stance cannot become a source foot plant without BOTH weighted outsole endpoints',async()=>{
 const {reconcileOriginalSourceContactWitness:reconcile}=await load();
 const measuredSingle={
  comparable:true,source:'two-consecutive-original-WebGL-skin-frames',
  beforeFrame:86,afterFrame:87,tick:6,rootTravelMeters:.0489,
  potentialPlantSides:['left'],classification:'potential-plant'};
 // Exact original 390px source footage: a low skinned LEFT vertex barely
 // moved, but its imported heel remained airborne and the RIGHT shoe slid
 // ~70mm while the real root advanced only 48.9mm. The independent same-GLB
 // original two-point heel/toe patch found ZERO actual contact candidates.
 const measuredPatch={
  comparable:true,source:'original-source-skinned-two-point-shoe-patch-and-authored-floor',
  beforeFrame:86,afterFrame:87,tick:6,rootTravelMeters:.0489,
  floorTopY:-.020,potentialContactSides:[],
  heelWorldDeltaMeters:{left:.0144,right:.0692},
  toeWorldDeltaMeters:{left:.0069,right:.0709}};
 const owner={sameOriginalActor:true,sameFramePair:true,sourceClipName:'Walking_A'};
 const rejected=reconcile(measuredSingle,measuredPatch,owner);
 assert.equal(rejected?.classification,'unwitnessed-two-point-contact');
 assert.deepEqual(rejected?.singleVertexOnlySides,['left']);
 assert.deepEqual(rejected?.corroboratedSides,[]);
 assert.equal(rejected?.provenFootPlant,false);
 assert.equal(rejected?.ikAccepted,false);
 const matching={...measuredPatch,potentialContactSides:['left']};
 const eligible=reconcile(measuredSingle,matching,owner);
 assert.equal(eligible?.classification,'two-point-contact-candidate-for-independent-review');
 assert.deepEqual(eligible?.corroboratedSides,['left']);
 assert.deepEqual(eligible?.singleVertexOnlySides,[]);
 assert.equal(eligible?.provenFootPlant,false,
  'even independent source two-point evidence over one frame is NOT a world-space stance certificate');
 assert.equal(eligible?.ikAccepted,false);
 for(const [caseName,patch,single,opts] of [
  ['other-frame',{...matching,afterFrame:88},measuredSingle,owner],
  ['other-tick',{...matching,tick:7},measuredSingle,owner],
  ['untrusted-clip',matching,measuredSingle,{...owner,sourceClipName:'Idle'}],
  ['another-clone',matching,measuredSingle,{...owner,sameOriginalActor:false}],
  ['different-capture',matching,measuredSingle,{...owner,sameFramePair:false}],
  ['no-skin',{...matching,comparable:false},measuredSingle,owner],
  ['no-root',{...matching,rootTravelMeters:.52},measuredSingle,owner],
  ['missing-floor',{...matching,floorTopY:NaN},measuredSingle,owner],
  ['not-source',{...matching,source:'faked-pose'},measuredSingle,owner]
 ])assert.equal(reconcile(single,patch,opts),null,
  caseName+' must not manufacture trusted original source evidence');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-full-body-animation.spec.cjs'),'utf8');
 assert.match(browser,/reconcileOriginalSourceContactWitness\(/,
  'genuine 1440px and 390px same-frame browser videos must correlate both source shoe readers');
 assert.match(browser,/singleVertexOnlySides/,
  'misleading single weighted vertex cannot be silently reported as a planted foot');
});
