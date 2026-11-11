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
