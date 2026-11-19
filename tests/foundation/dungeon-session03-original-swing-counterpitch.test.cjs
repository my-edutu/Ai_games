'use strict';
// Original CC0 Walking_A measurements below come from independently decoded
// pinned source GLB binary skin/clip/inverse-bind at t=.150/.625, NOT WebGL
// after-footage or a claimed gameplay plant. The authored stone is Y=-.020m.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const url='data:text/javascript;base64,'+Buffer.from(
 fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/full-body-animation-controller.js'),'utf8')
).toString('base64');
const load=()=>import(url);
const shoe=(heelY,toeY,heelXZ=[0,0],toeXZ=[0,.30])=>({
 heelY,toeY,heelXZ,toeXZ
});
const rightSource={
 right:shoe(.271,-.056,[.05,-.11],[.05,.06]),
 left:shoe(.022,.004,[-.05,-.10],[-.05,.14])
};
const rightAfter={
 right:shoe(.200,.012,[.05,-.11],[.05,.06]),
 left:{...rightSource.left}
};
const leftSource={
 left:shoe(.251,-.065,[-.04,-.13],[-.04,.07]),
 right:shoe(.012,.037,[.05,-.12],[.05,.14])
};
const leftAfter={
 left:shoe(.179,.023,[-.04,-.13],[-.04,.07]),
 right:{...leftSource.right}
};
const valid=(side='right')=>({
 source:'verified-licensed-source-native-counterpitch',
 sourceRole:'vanguard',mode:'move',sourceClipName:'Walking_A',
 sourceClipDurationSeconds:1.0416666,
 sourceClipTimeSeconds:side==='right'?.150:.625,
 sourceWeight:1,sourceInstanceSame:true,
 sourceOriginalUpperTrackVerified:true,sourceOriginalLowerTrackVerified:true,
 sourceOriginalFootTrackVerified:true,sourceOriginalBindVerified:true,
 sourceBoneChainVerified:true,sourceFootLocalXAxisVerified:true,
 ownerLocomotion:true,alive:true,visible:true,interrupted:false,
 teleport:false,reducedMotion:false,frameInterval:.2167,
 rootTravel:.038,frameAge:.04,side,floorTopY:-.02,
 before:side==='right'?rightSource:leftSource,
 previousFootRad:0,previousSameSourceFrame:false
});
test('real original licensed right swing proposes a linked and bounded phase-supported counterpitch',async()=>{
 const {planLicensedSourceSwingCounterpitch,certifyLicensedSourceSwingCounterpitch}=await load();
 const p=planLicensedSourceSwingCounterpitch(valid());
 assert.ok(p,'real Walking_A original sole pitch should propose a trial');
 assert.equal(p.source,'verified-licensed-source-native-counterpitch');
 assert.equal(p.side,'right');
 assert.ok(p.footRad<=-.7&&p.footRad>=-.850001);
 assert.ok(Math.abs(p.upperRad)<=.09&&Math.abs(p.lowerRad)<=.09);
 assert.equal(Math.sign(p.upperRad),-Math.sign(p.lowerRad));
 assert.equal(p.contactLocked,false);
 const actual=certifyLicensedSourceSwingCounterpitch({
  plan:p,before:rightSource,after:rightAfter,sourceInstanceSame:true,
  sourceClipName:'Walking_A',side:'right',floorTopY:-.02
 });
 assert.ok(actual,'real original skeleton skinning shows substantial relief');
 assert.ok(actual.toeLiftMeters>.06);
 assert.ok(actual.pitchImprovementMeters>.11);
 assert.equal(actual.originalOppositeShoeVerified,true);
 assert.equal(actual.contactLocked,false);
 assert.equal(actual.plantCertified,false);
});
test('original left swing is corrected using its own phase, not a universal pelvis boost',async()=>{
 const {planLicensedSourceSwingCounterpitch,certifyLicensedSourceSwingCounterpitch}=await load();
 const p=planLicensedSourceSwingCounterpitch(valid('left'));
 assert.ok(p);
 assert.equal(p.side,'left');
 const actual=certifyLicensedSourceSwingCounterpitch({
  plan:p,before:leftSource,after:leftAfter,sourceInstanceSame:true,
  sourceClipName:'Walking_A',side:'left',floorTopY:-.02
 });
 assert.ok(actual);
 assert.ok(actual.toeLiftMeters>.08);
 assert.ok(actual.pitchImprovementMeters>.15);
});
test('short frame ramps original ankle instead of snapping 49 degrees into one 16ms image',async()=>{
 const {planLicensedSourceSwingCounterpitch}=await load();
 const p=planLicensedSourceSwingCounterpitch({...valid(),frameInterval:.0167});
 assert.ok(p&&p.footRad<0);
 assert.ok(Math.abs(p.footRad)<.19);
 const continuous=planLicensedSourceSwingCounterpitch({
  ...valid(),frameInterval:.0167,previousFootRad:-.30,
  previousSameSourceFrame:true
 });
 assert.ok(continuous&&Math.abs(continuous.footRad)<.48);
 assert.ok(continuous.footRad<-.30);
});
test('stale source, foreign clip, wrong leg chain, missing legal travel, death and reduced-motion fail closed',async()=>{
 const {planLicensedSourceSwingCounterpitch}=await load();
 const q=valid();
 const broken=[
  {source:'synthetic'},
  {mode:'attack'}, {sourceClipName:'Idle'}, {sourceRole:'unknown'},
  {sourceInstanceSame:false}, {sourceOriginalFootTrackVerified:false},
  {sourceOriginalUpperTrackVerified:false}, {sourceOriginalLowerTrackVerified:false},
  {sourceOriginalBindVerified:false},{sourceFootLocalXAxisVerified:false},
  {sourceBoneChainVerified:false},{sourceWeight:.8},{ownerLocomotion:false},
  {alive:false},{visible:false},{interrupted:true},{teleport:true},
  {reducedMotion:true},{rootTravel:0},{frameAge:.5},
  {frameInterval:0},{frameInterval:.8},
  {sourceClipTimeSeconds:.45},{floorTopY:0},
  {before:{...rightSource,left:shoe(.2,-.2)}},
  {before:{...rightSource,right:shoe(.025,-.03)}}
 ];
 for(const b of broken)assert.equal(planLicensedSourceSwingCounterpitch({...q,...b}),null,
  'unsafe original source contract: '+JSON.stringify(b));
});
test('cannot certify a toe lift by raising an airborne heel or moving the supporting shoe',async()=>{
 const {planLicensedSourceSwingCounterpitch,certifyLicensedSourceSwingCounterpitch}=await load();
 const p=planLicensedSourceSwingCounterpitch(valid());
 assert.ok(p);
 const owner={plan:p,before:rightSource,after:rightAfter,
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  side:'right',floorTopY:-.02};
 for(const after of [
  {...rightAfter,right:shoe(.310,.014)},
  {...rightAfter,right:shoe(.270,-.054)},
  {...rightAfter,left:shoe(.045,.004)},
  {...rightAfter,left:shoe(.022,.004,[.02,.1],[.1,.5])},
  {...rightAfter,right:shoe(.200,.120)}
 ])assert.equal(certifyLicensedSourceSwingCounterpitch({...owner,after}),null);
 for(const change of [{sourceInstanceSame:false},{sourceClipName:'Attack'},
  {floorTopY:0},{side:'left'}])
  assert.equal(certifyLicensedSourceSwingCounterpitch({...owner,...change}),null);
});
