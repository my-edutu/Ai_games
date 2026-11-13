'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=path.resolve(__dirname,'../../public/ai-dungeon/full-body-animation-controller.js');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

// Genuine original player_swordsman.glb (CC0, pinned SHA) desktop Chromium
// Actions 43381914826, RAF 61 -> 62 at 1440px. The airborne LEFT shoe
// becomes nearly vertical: its XZ heel/toe projection is only 63.15 -> 77.72
// mm, while its true skinned 3D length remains 306.02 -> 304.30 mm.
// The RIGHT source-loaded shoe drifts ~35-36 mm during 19.64 mm legal root
// travel. This isn't synthetic contact or IK: it is a reversible <=18mm
// presentation-only opportunity that must still pass live readback.
const before={
 left:{heel:[-5.648971662064303,.20708390239746327,-6.960149788500405],
  toe:[-5.7063452296960975,-.09234804904901626,-6.933755263271569]},
 right:{heel:[-5.679683868411334,-.02274134505348726,-7.112227465336585],
  toe:[-5.949723697044612,-.03615459273937912,-7.137275820243999]}
};
const after={
 left:{heel:[-5.633030860093171,.20451058015318663,-6.945252435394299],
  toe:[-5.708598116120008,-.08969519012990541,-6.927100472859871]},
 right:{heel:[-5.644538488695346,-.02265523506443769,-7.103696788132081],
  toe:[-5.914666314148776,-.03261125957440168,-7.129281391308135]}
};
const evidence={
 mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
 sourceInstanceSame:true,ownerLocomotion:true,rootTravel:.019641225088437,
 recentRootTravel:.019641225088437,recentTravelAge:0,
 frameInterval:.1333,previousRootYaw:-Math.PI/2,
 currentRootYaw:-Math.PI/2,alive:true,visible:true,
 teleport:false,reducedMotion:false,interrupted:false,
 floorTopY:-.02,previous:before,current:after
};
test('actual source airborne steep shoe permits conservative loaded-foot skid relief',async()=>{
 const {planOriginalSourceStanceSlideRelief:plan}=await load();
 const result=plan(evidence);
 assert.equal(result?.side,'right',
  'the actual stable loaded source shoe must be eligible despite the other steep original shoe');
 assert.ok(result.reductionMeters>.009&&result.reductionMeters<.012,
  'remain below 18mm, and below 55% of independently witnessed 19.64mm root travel');
 assert.equal(result.contactLocked,false,'this does not assert world-space IK or fixed contact');
 assert.equal(result.oppositeSwing3DLengthVerified,true,
  'the opposite shoe must retain its true skinned 3D length');
});
test('no angular, deformed, interrupted or unwitnessed source is rescued',async()=>{
 const {planOriginalSourceStanceSlideRelief:plan}=await load();
 for(const change of [
  {previousRootYaw:-Math.PI/2,currentRootYaw:-Math.PI/2+.6375},
  {rootTravel:0,recentRootTravel:0},
  {teleport:true},{reducedMotion:true},{sourceWeight:.5},
  {mode:'attack'},{sourceInstanceSame:false},
  {previous:{...before,left:{...before.left,toe:[...before.left.toe.slice(0,1),-.01,before.left.toe[2]]}}},
  {previous:{...before,left:{...before.left,toe:[-5.648971662064303,.20,-6.960149788500405]}}}
 ])assert.equal(plan({...evidence,...change}),null,
   'do not rescue an invalid/rejected original source pose: '+JSON.stringify(change));
});
