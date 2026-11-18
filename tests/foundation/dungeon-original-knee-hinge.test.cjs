'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const controllerPath=path.join(root,'public/ai-dungeon/full-body-animation-controller.js');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(controllerPath,'utf8')).toString('base64'));
function rotation(angle,axis=[0,0,1]){
 const s=Math.sin(angle/2),c=Math.cos(angle/2);
 return [axis[0]*s,axis[1]*s,axis[2]*s,c];
}
function clip(angles=[0,.16,.31,.55,.37,.12],axis=[0,0,1]){
 return {name:'Walking_A',duration:1.0416666,tracks:[
  {name:'Armature|lowerlegl.quaternion',times:angles.map((_,i)=>i*.19),
   values:angles.flatMap(a=>rotation(a,axis))},
  {name:'Armature|footl.quaternion',times:[0,1],
   values:[...rotation(0),...rotation(.12)]}
 ]};
}
test('original licensed Walking_A knee hinge follows source quaternion tracks, not guessed local-X bending',async()=>{
 const {inferImportedSourceKneeBendAxis:infer}=await load();
 assert.equal(typeof infer,'function');
 const receipt=infer(clip(),'lowerlegl');
 assert.equal(receipt?.source,'verified-original-Walking_A-knee-quaternion-axis');
 assert.ok(receipt?.axis&&receipt.axis.length===3);
 assert.ok(Math.abs(receipt.axis[2])>.98&&Math.abs(receipt.axis[0])<.15,
  'source-evidenced Z hinge must not be silently applied as local-X');
 assert.equal(receipt.trackName,'Armature|lowerlegl.quaternion');
 assert.ok(receipt.sampleCount>=3);
 const x=infer(clip(undefined,[1,0,0]),'lowerlegl');
 assert.ok(x&&Math.abs(x.axis[0])>.98,'other licensed original hinge orientations remain available');
});
test('original-source knee axis fails closed for fake clip, unstable joint rotation, or unrelated skeleton',async()=>{
 const {inferImportedSourceKneeBendAxis:infer}=await load();
 const clean=clip();
 const mixed=clip();
 mixed.tracks[0].values=[
  ...rotation(0,[1,0,0]),...rotation(.24,[1,0,0]),
  ...rotation(.36,[0,1,0]),...rotation(.31,[0,0,1]),
  ...rotation(.2,[0,1,0]),...rotation(.05,[0,0,1])
 ];
 for(const [candidate,bone] of [
  [null,'lowerlegl'],[{},'lowerlegl'],[{...clean,name:'Idle'},'lowerlegl'],
  [clean,'lowerlegr'],[clean,''],[mixed,'lowerlegl'],
  [clip([0,.001,.002,.001,0]),'lowerlegl'],
  [{...clean,tracks:[...clean.tracks,clean.tracks[0]]},'lowerlegl'],
  [{...clean,tracks:[{...clean.tracks[0],values:[NaN,...clean.tracks[0].values.slice(1)]}]},'lowerlegl'],
  [{...clean,tracks:[{...clean.tracks[0],values:[1,2]}]},'lowerlegl']
 ]) assert.equal(infer(candidate,bone),null,
  'unsupported or ambiguous source knee tracks must never authorize calf rotation');
});
test('real calf trials must use the documented original clip hinge and retain final measured sole proof',async()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/inferImportedSourceKneeBendAxis\(/,
  'renderer must audit the exact imported lower-leg clip, not improvise knee axis');
 assert.match(renderer,/trial\.setFromAxisAngle\(sourceKneeAxis,/,
  'actual skinned-shoe signed calf trials must run on source-derived hinge');
 assert.match(renderer,/sourceKneeAxisAudit/,
  'safety receipts must expose missing or accepted original track evidence');
 assert.match(renderer,/planOriginalSourceSwingCalfAssist\(/,
  'existing real-owner/heel/ankle safety planner must remain');
 assert.match(renderer,/sourceSwingCalfAssistProof/,
  'real skinned-toe post-application acceptance remains mandatory');
});


test('real source knee acceptance reports measured joint-length rejection separately from a verified hinge plane',async()=>{
 const {assessImportedSourceKneeGeometry:assess}=await load();
 assert.equal(typeof assess,'function');
 const good=assess({upperLength:.31,lowerLength:.27,bendSine:.93,hingeAlignment:.998});
 assert.equal(good.accepted,true);
 assert.equal(good.reason,'verified-source-knee-plane');
 const short=assess({upperLength:.09,lowerLength:.27,bendSine:.933,hingeAlignment:.9985});
 assert.equal(short.accepted,false);
 assert.equal(short.reason,'source-leg-segment-length-out-of-bounds',
  'a real verified hinge must not be incorrectly reported as a twist-axis failure');
 assert.equal(assess({upperLength:.31,lowerLength:.27,bendSine:.02,hingeAlignment:.998}).reason,
  'degenerate-source-knee-bend-plane');
 assert.equal(assess({upperLength:.31,lowerLength:.27,bendSine:.93,hingeAlignment:.31}).reason,
  'source-hinge-not-in-actual-leg-bend-plane');
 for(const bad of [
  {upperLength:NaN,lowerLength:.3,bendSine:.9,hingeAlignment:.99},
  {upperLength:.3,lowerLength:Infinity,bendSine:.9,hingeAlignment:.99}
 ])assert.equal(assess(bad).accepted,false,'nonfinite original joints fail closed');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/assessImportedSourceKneeGeometry\(/,
  'live original-source calf trial must use the same testable geometric safety gate');
 assert.match(renderer,/upperLength,lowerLength/,
  'native evidence must expose real segment lengths and stop conflating short joints with twisting');
});


test('pinned CC0 swordsman lowerleg to foot source bind disproves universal 120mm limb minimum',async()=>{
 const {assessImportedSourceKneeGeometry:assess}=await load();
 // Actual pinned player_swordsman.glb bind translations in glTF skin:
 // upperleg.l -> lowerleg.l 0.1706700623; lowerleg.l -> foot.l 0.1123160496.
 // These are original GLB source units, NOT invented or rescaled game movement.
 const original={upperLength:.1706700623,lowerLength:.1123160496,
  sourceBindUpperLength:.1706700623,sourceBindLowerLength:.1123160496,
  bendSine:.93312,hingeAlignment:.99858};
 assert.deepEqual(assess(original),{
  accepted:true,reason:'verified-source-knee-plane-from-inverse-bind'},
  'an original 112mm lower leg with matching licensed inverse bind may not be discarded as an impossible limb');
 assert.equal(assess({...original,lowerLength:.085}).accepted,false,
  'a distorted lower leg must still fail against its own licensed source bind');
 assert.equal(assess({...original,sourceBindLowerLength:NaN}).accepted,false,
  'a forged or absent inverse bind cannot authorize an undersized world leg');
 assert.equal(assess({upperLength:.09,lowerLength:.27,bendSine:.933,
  hingeAlignment:.998,sourceBindUpperLength:.1706700623,
  sourceBindLowerLength:.1123160496}).accepted,false,
  'previously rejected disproportionate anatomy must remain rejected');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/boneInverses/);
 assert.match(renderer,/sourceBindUpperLength,sourceBindLowerLength/,
  'live source must compute true inverse-bind evidence before using new ratio-aware gate');
});


test('source-space knee lengths survive anisotropic original GLB fitting; bind comparison never uses distorted world lengths',async()=>{
 const {measureImportedKneeSegmentsInAssetCoordinates:measure,
  assessImportedSourceKneeGeometry:assess}=await load();
 assert.equal(typeof measure,'function');
 // Pinned original thigh and shin distances, rendered under a deliberately
 // anisotropic but invertible figure fit: avatar source anatomy is unchanged.
 const shin=.1123160496,thigh=.1706700623;
 const originalUpper=[0,0,0],originalKnee=[0,-thigh,0];
 const originalFoot=[.08,-thigh-Math.sqrt(shin*shin-.08*.08),0];
 const scale=[1.24,.82,1.11],offset=[.25,.9,-.75];
 const world=p=>p.map((v,i)=>v*scale[i]+offset[i]);
 const inverse=[1/scale[0],0,0,0,0,1/scale[1],0,0,
  0,0,1/scale[2],0,
  -offset[0]/scale[0],-offset[1]/scale[1],-offset[2]/scale[2],1];
 const args={upperWorld:world(originalUpper),kneeWorld:world(originalKnee),
  footWorld:world(originalFoot),inverseAssetWorld:inverse};
 const measured=measure(args);
 assert.ok(measured,'a genuine invertible source fit can be unscaled');
 assert.ok(Math.abs(measured.upperLength-thigh)<1e-9);
 assert.ok(Math.abs(measured.lowerLength-shin)<1e-9);
 const bound={sourceBindUpperLength:thigh,sourceBindLowerLength:shin,
  bendSine:.93,hingeAlignment:.998};
 assert.equal(assess({...bound,...measured}).accepted,true,
  'verified source lengths match licensed inverse binds');
 const worldUpper=Math.hypot(...args.upperWorld.map((v,i)=>v-args.kneeWorld[i]));
 const worldLower=Math.hypot(...args.kneeWorld.map((v,i)=>v-args.footWorld[i]));
 assert.equal(assess({...bound,upperLength:worldUpper,lowerLength:worldLower}).accepted,false,
  'comparing anisotropic rendered metres against original bind-space metres is a real false rejection');
 for(const bad of [
  {...args,inverseAssetWorld:null},
  {...args,inverseAssetWorld:[...inverse.slice(0,6),NaN,...inverse.slice(7)]},
  {...args,footWorld:[NaN,0,0]},
  {...args,inverseAssetWorld:[...inverse.slice(0,3),.1,...inverse.slice(4)]},
  {...args,inverseAssetWorld:[...inverse.slice(0,15),0]}
 ]) assert.equal(measure(bad),null,'invalid/nonaffine source space fails closed');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/measureImportedKneeSegmentsInAssetCoordinates\(/,
  'the LIVE rig must measure connected bones in the GLB reference frame');
 assert.match(renderer,/assetRoot\.matrixWorld/,
  'the source-space conversion must actually invert the source root transform');
 assert.match(renderer,/sourceUpperLength,sourceLowerLength/,
  'the live heel-safe gate must expose actual comparable source lengths');
});


test('licensed left-knee 1.05-radian source-key interval is not mistaken for invalid knee twist',async()=>{
 const {inferImportedSourceKneeBendAxis:infer}=await load();
 // Verified from pinned CC0 player_swordsman.glb Git blob
 // 24492f0e0609708495284bdb8759b98f2bd66f49, Walking_A 26-key
 // lowerleg.l rotation track. X/W are rounded 7-decimal source FLOAT32;
 // source Y/Z are ~1e-7, immaterial to the actual source hinge direction.
 // The legitimate frame 11 -> 12 rapid knee bend is ~1.0504 radians.
 const sourceXW=[
  [.3766118,.9263712],[.4760455,.8794207],[.5894082,.8078354],
  [.632012,.7749587],[.5896971,.8076246],[.4633231,.8861895],
  [.3257498,.945456],[.2148799,.9766405],[.0019684,.9999981],
  [.0019798,.999998],[.0019858,.999998],[.0019712,.9999981],
  [.5030899,.8642341],[.7277589,.685833],[.8412695,.5406159],
  [.8969137,.4422056],[.9199988,.3919213],[.9352044,.3541085],
  [.9376636,.3475442],[.9104039,.4137207],[.8649767,.501812],
  [.8305001,.5570185],[.8332656,.5528729],[.8296178,.5583317],
  [.7070389,.7071747],[.4756045,.8796592]
 ];
 const sourced={name:'Walking_A',duration:1.0416666269302368,tracks:[{
  name:'lowerlegl.quaternion',
  times:sourceXW.map((_,i)=>i/24),
  values:sourceXW.flatMap(([x,w])=>[x,0,0,w])
 }]};
 const receipt=infer(sourced,'lowerlegl');
 assert.equal(receipt?.source,'verified-original-Walking_A-knee-quaternion-axis',
  'genuine licensed left-calf must not falsely fail at its rapid authored key interval');
 assert.ok(receipt.peakStepRadians>1.04&&receipt.peakStepRadians<1.07,
  'the 1.05-rad interval must come from real keyed source motion');
 assert.ok(Math.abs(receipt.axis[0])>.999&&receipt.dominance>.99);
 assert.ok(receipt.sampleCount>=3);
 // A larger, physically unverified discontinuity still has to fail closed.
 const malformed={...sourced,tracks:[{...sourced.tracks[0],
  values:sourceXW.map(([x,w],i)=>i===12?
   rotation(2.7,[0,1,0]):[x,0,0,w]).flat()}]};
 assert.equal(infer(malformed,'lowerlegl'),null,
  'large axis-breaking discontinuity cannot become an original-rig correction');
});

test('source calf preserves a same-foot slew only across consecutive genuinely measured mixer frames',async()=>{
 const {retireOriginalSourceCalfMemory:retire,
  selectOriginalSourceSwingCalfTrial:select}=await load();
 assert.equal(typeof retire,'function');
 assert.equal(retire(-.177114442880969,'left',1),-.177114442880969,
  'a real left-foot accepted frame keeps the lawful 0.18rad accumulated support');
 assert.equal(retire(.13,'right',2),.13);
 assert.equal(retire(-.12,'left',2),0,
  'one missed left-foot frame must retire its stale sign even when right foot was corrected');
 assert.equal(retire(.13,'right',1),0);
 assert.equal(retire(-.12,'left',0),0,'a missed same-foot frame retires the prior correction');
 assert.equal(retire(.19,'left',1),0,'excessive knee memory never survives');
 assert.equal(retire(NaN,'left',1),0);
 assert.equal(retire(.10,'unknown',1),0);
 assert.equal(retire(.10,'left',4),0);
 const trial={afterAnkleToeY:-.065,afterAnkleHeelY:.13,floorTopY:-.02,
  trials:[{signed:.2,toe:-.045,heel:.11}]};
 assert.equal(select({...trial,previousAssistRad:-.12}),null,
  'an uninterrupted opposite-signed knee must still be rejected');
 assert.equal(select({...trial,previousAssistRad:retire(-.12,'left',0)})?.signed,.2,
  'after a genuinely uncorrected frame, a new safe positive source hinge is eligible');
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(code,/actor\.sourceSwingCalfCurrentFrameMask=0;/);
 assert.match(code,/actor\.sourceSwingCalfCurrentFrameMask\s*\|=/);
 assert.match(code,/mount\.swingCalfAssistRad=retireOriginalSourceCalfMemory\(/);
 assert.match(code,/sourceSwingCalfCurrentFrameMask:actor\.sourceSwingCalfCurrentFrameMask/,
  'demand-only source-rig witness must not report historical calf proof as current');
});


// Exact source WebGL desktop #43683237062, true licensed Walking_A tick 6:
// an 0.22rad original ankle physically lifted a right swinging source toe
// from -95.111mm to -74.698mm; stone is -20mm. It STILL buries the toe
// 54.698mm. A merely positive original ankle receipt must not suppress a
// separately measured, safer, CONNECTED source hip+knee relief attempt.
// The proposed linked leg response below is HYPOTHETICAL, never film proof.
test('RED: deeply buried original ankle may escalate to linked hip-knee only on same skinned GLB and preserve atomic final proof',async()=>{
 const {qualifyOriginalSourceAnkleLinkedEscalation:qualify,
  reconcileOriginalSourceAnkleLinkedEscalation:reconcile}=await load();
 assert.equal(typeof qualify,'function');
 assert.equal(typeof reconcile,'function');
 const ankle={source:'same-original-GLB-foot-skinned-vertices',
  side:'right',sourceInstanceId:'live-licensed-clone',
  sourceClip:'Walking_A',sourceWeight:1,
  beforeToeY:-.09511107791602491,afterToeY:-.07469846565903035,
  beforeHeelY:.15629142911152571,afterHeelY:.13846525108081137,
  floorTopY:-.02,liftMeters:.02041261225699456,
  penetrationBeforeMeters:.07511107791602491,
  penetrationAfterMeters:.054698465659030346,
  originalOppositeShoeVerified:true,contactLocked:false,
  appliedAngleRad:-.22,sourceAnkleStepRad:.01838,
  sourceAnkleFrameLimitRad:.08139,frameAwareSwingUsed:false,
  earlySourceToeRescue:false};
 const owner={ankleProof:ankle,side:'right',sourceInstanceId:'live-licensed-clone',
  sourceClipName:'Walking_A',sourceWeight:1,
  actualToeY:-.07469846565903035,floorTopY:-.02,
  ownerLocomotion:true,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false};
 assert.equal(qualify(owner),true,
  'the measured 54.7mm remaining toe burial deserves a connected native-leg trial, not another isolated ankle');
 const support={heelY:-.028,toeY:-.016,heelXZ:[0,0],toeXZ:[.2,0]};
 const swing={heelY:ankle.afterHeelY,toeY:ankle.afterToeY,
  heelXZ:[.4,0],toeXZ:[.6,0]};
 const after={left:support,right:{...swing,heelY:swing.heelY+.008,
  toeY:swing.toeY+.016,heelXZ:[.404,0],toeXZ:[.61,0]}};
 const linked={source:'measured-original-skinned-linked-leg',side:'right',
  sourceClip:'Walking_A',sourceInstanceId:owner.sourceInstanceId,
  before:{left:support,right:swing},after,contactLocked:false,
  oppositeShoePreserved:true,upperRad:-.09,lowerRad:.075,
  liftMeters:.016,fractionCleared:.016/.054698465659030346};
 const combined=reconcile({...owner,linkedProof:linked});
 assert.ok(combined,'same-original-shoe final source pose must reconcile both linked hip/knee and ankle');
 assert.equal(combined.afterToeY,after.right.toeY);
 assert.equal(combined.afterHeelY,after.right.heelY);
 assert.ok(combined.liftMeters>.035);
 assert.equal(combined.originalAnkleLiftMeters,ankle.liftMeters);
 assert.equal(combined.linkedLegAddedLiftMeters,linked.liftMeters);
 assert.equal(combined.originalOppositeShoeVerified,true);
 assert.equal(combined.linkedOriginalSourceJointProof,true);
 assert.equal(combined.contactLocked,false);
 for(const change of [
  {side:'left'},{sourceInstanceId:'other-clone'},
  {sourceClipName:'Idle'},{sourceWeight:.7},
  {actualToeY:ankle.afterToeY-.004},
  {floorTopY:0},{ownerLocomotion:false},
  {alive:false},{visible:false},{teleport:true},
  {reducedMotion:true},{interrupted:true},
  {ankleProof:{...ankle,penetrationAfterMeters:.009,afterToeY:-.029}},
  {ankleProof:{...ankle,originalOppositeShoeVerified:false}},
  {ankleProof:{...ankle,contactLocked:true}}
 ])assert.equal(qualify({...owner,...change}),false,
  'never escalate a stale, unowned, clear, unsafe or contact-inventing source frame');
 for(const changed of [
  {sourceInstanceId:'other-clone'},
  {linkedProof:{...linked,sourceInstanceId:'other-clone'}},
  {linkedProof:{...linked,before:{...linked.before,right:{...swing,toeY:swing.toeY-.006}}}},
  {linkedProof:{...linked,after:{...after,right:{...after.right,toeY:swing.toeY+.003}}}},
  {linkedProof:{...linked,after:{...after,left:{...support,toeY:support.toeY+.005}}}}
 ])assert.equal(reconcile({...owner,linkedProof:linked,...changed}),null,
   'final original-source ankle+hip/knee proof must reject wrong clone or corrupted two-shoe skin');
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(source,/qualifyOriginalSourceAnkleLinkedEscalation\(/);
 assert.match(source,/reconcileOriginalSourceAnkleLinkedEscalation\(/);
 assert.match(source,/actor\.sourceSwingToeCurrentFrameProofs\[side\]=reconciled/);
 assert.match(source,/actor\.sourceSwingLinkedCurrentFrameProofs\[side\]=\{/);
});


test('RED: genuine 390px original swinging-calf 200mrad trial may recover buried toe within 1.5mm pitch-noise budget',async()=>{
 const {selectOriginalSourceSwingCalfTrial:select,
  confirmOriginalSourceSwingCalfNetClearance:confirm}=await load();
 // Actual source-skinned player_swordsman.glb, mobile nine-tick receipt
 // at 08ba1ffa / Actions #44210502484, tick 8, floor top -20mm.
 // The right lowerlegr X-axis is authenticated by Walking_A (6 keys,
 // 0.7647668rad peak), 0.170670m upper and 0.112316m lower inverse binds.
 // These four toe/heel endpoints were measured on the SAME source frame;
 // they are not the hypothetical final 180mrad applied-joint sample.
 const source={floorTopY:-.02,
  afterAnkleToeY:-.06204499368480179,
  afterAnkleHeelY:.2427077612842324,
  previousAssistRad:0,
  trials:[
   {signed:-.1,toe:-.07301364467472421,heel:.2267409528934365},
   {signed:.1,toe:-.04944993513436013,heel:.2572638745874555},
   {signed:-.2,toe:-.08224629296919025,heel:.20952298448658355},
   {signed:.2,toe:-.03535431468506266,heel:.2702638529305913}
  ]};
 const positive=select(source);
 assert.equal(positive?.signed,.2,
  'the real 26.69mm toe gain should not be discarded for 0.87mm of heel-dominant pitch difference');
 assert.ok(positive.toe-source.afterAnkleToeY>.026);
 assert.ok(positive.heel-source.afterAnkleHeelY-(positive.toe-source.afterAnkleToeY)<.0015);
 // Separate synthetic final outcomes, NOT observed GLB at 180mrad. The
 // renderer must STILL re-skin at the actual applied angle and veto unsafe
 // two-shoe, XZ, deformation, owner or weapon continuity before acceptance.
 const restricted={floorTopY:-.02,
  beforeToeY:source.afterAnkleToeY,beforeHeelY:source.afterAnkleHeelY,
  afterToeY:-.0380,afterHeelY:.2673,appliedAngleRad:.18};
 assert.equal(confirm(restricted),true,
  'same-GLB final probe with 24mm toe relief and sub-mm shoe-pitch drift may be retained');
 for(const altered of [
  {afterHeelY:.2697},
  {afterToeY:-.056,afterHeelY:.2492},
  {afterToeY:-.093},
  {afterHeelY:.45},
  {appliedAngleRad:.21},
  {floorTopY:.1}
 ])assert.equal(confirm({...restricted,...altered}),false,
  'unverified steepening, tiny lift, deeper toe, invalid knee or stone must remain fail closed');
 assert.equal(select({...source,trials:source.trials.map(t=>t.signed===.2?
  {...t,heel:t.heel+.003}:t)}),null,
  'a 3.87mm shoe-pitch regression is NOT source-corrected walking');
});
