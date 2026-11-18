'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const controller=path.resolve(__dirname,'../../public/ai-dungeon/full-body-animation-controller.js');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(controller,'utf8')).toString('base64'));

// Original pinned CC0 player_swordsman.glb, Actions #44298973748,
// artifact #14426878152, actual 18 November 2026 desktop WebGL RAF
// tick4 frame55->56, original 41-joint Walking_A, full clip weight,
// 83.4ms interval and 42.634mm lawful authority-root travel.
// These BEFORE toe/heel world coordinates are untouched original source
// skinned vertices; true floor top is -20mm. Test trial Y deltas and
// horizontal shift LENGTHS are genuine source GLB skin measurements.
// Because the diagnostic stores shifts but not the trial XZ direction,
// the AFTER XZ vectors use explicitly synthetic direction-preserving
// anchors of the real measured lengths. This test is a gate regression,
// NOT proof that the candidate was applied, planted or visually accepted.
const before=Object.freeze({
 left:{
  heelY:.18344113319578817,toeY:-.11483959789414283,
  heelXZ:[-5.687591401105577,-6.942463124018058],
  toeXZ:[-5.750448789129268,-6.933360578623058]
 },
 right:{
  heelY:-.029179208236492827,toeY:-.018334432214227172,
  heelXZ:[-5.779618141188462,-7.107237173225983],
  toeXZ:[-6.049499528094806,-7.132068671591226]
 }
});
const source={
 mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
 sourceInstanceSame:true,sourceChainVerified:true,
 sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
 sourceFootTrackVerified:true,sourceBindVerified:true,
 sourceAnatomicalFootAxisVerified:true,ownerLocomotion:true,
 alive:true,visible:true,teleport:false,reducedMotion:false,
 interrupted:false,rootTravel:.04263423466919125,
 frameAge:.03,frameInterval:.08340000000000103,
 floorTopY:-.02,side:'left',before,
 starter:{source:'actual-original-source-three-joint-swing-opportunity',
  sign:-1,expectedSourceSkinnedTrials:2,contactLocked:false,
  excessHeelRiseMeters:.008},
};
function originalSkinCandidate(toeLift=.01685684185870845,
 heelRise=.0064285850822996815){
 return {
  upperRad:-.11,lowerRad:.11,footRad:.36,
  after:{
   left:{
    heelY:before.left.heelY+heelRise,
    toeY:before.left.toeY+toeLift,
    // SOURCE diagnostic horizontal shift magnitudes: 2.341/29.573mm
    heelXZ:[before.left.heelXZ[0]+.002341178659808431,before.left.heelXZ[1]],
    toeXZ:[before.left.toeXZ[0]+.029572888231310695,before.left.toeXZ[1]]
   },
   right:{...before.right}
  }
 };
}
test('RED: source-weighted 83ms 41-joint counterpitch earns >=10mm relative outsole improvement',async()=>{
 const {chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const raw=originalSkinCandidate();
 const lift=raw.after.left.toeY-before.left.toeY;
 const heel=raw.after.left.heelY-before.left.heelY;
 const residual=-.02-raw.after.left.toeY;
 assert.ok(lift>.0168&&lift<.0170);
 assert.ok(lift-heel>.010&&lift-heel<.011);
 assert.ok(residual>.077&&residual<.079,
  'still DEEPLY BURIED: no foot plant, IK or visual acceptance');
 const accepted=choose({...source,trials:[raw]});
 assert.equal(accepted?.source,'measured-original-skinned-coupled-knee-foot',
  'the sourced connected hip-calf-foot candidate must not be discarded by an arbitrary 20mm toe-only threshold');
 assert.equal(accepted?.contactLocked,false);
 assert.equal(accepted?.oppositeShoePreserved,true);
 assert.ok(accepted.toeLiftMeters>.0168);
});
test('strict GLB ownership, real loaded shoe, heel pitch and source joint controls remain fail closed',async()=>{
 const {chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const good=originalSkinCandidate();
 const corrupt=[
  {...source,sourceInstanceSame:false},
  {...source,sourceBindVerified:false},
  {...source,sourceFootTrackVerified:false},
  {...source,sourceWeight:.8},
  {...source,teleport:true},
  {...source,interrupted:true},
  {...source,reducedMotion:true},
  {...source,mode:'hurt'},
  {...source,rootTravel:0},
  {...source,trials:[{...good,footRad:.5}]},
  {...source,trials:[originalSkinCandidate(.01685684185870845,.012)]},
  {...source,trials:[{...good,after:{...good.after,right:{
   ...before.right,toeY:before.right.toeY+.009}}}]},
  {...source,trials:[{...good,after:{...good.after,left:{
   ...good.after.left,toeXZ:[before.left.toeXZ[0]+.10,before.left.toeXZ[1]]}}}]}
 ];
 for(const c of corrupt)
  assert.equal(choose({trials:[good],...c}),null,
   'source-skin candidate must not survive unsupported joint ownership, worsened heel or a moved supporting shoe');
});
