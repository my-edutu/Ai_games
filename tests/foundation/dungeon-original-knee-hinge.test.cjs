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
