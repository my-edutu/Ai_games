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
 assert.equal(accepted,null,
  '83.4ms permits 250.2mrad, NOT the historical 360mrad original foot correction');
 assert.ok(Math.abs(raw.footRad)>3*source.frameInterval);

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


// Native source-rig regression from exact HEAD 05d57b5f, Actions
// #44317893239, 390px original GLB Walking_A tick6, 166.7ms / 66.019mm
// real root displacement. The current selector retains +.18rad foot
// despite the weighted heel rising 1.338mm MORE than the toe. The same
// four native source-skin probes observed a +.24rad foot trial whose toe
// rose 19.582mm and heel 17.787mm: 1.794mm real counterpitch instead.
// Y coordinates and XZ SHIFT MAGNITUDES originate in the GLB diagnostic;
// the alternative XZ VECTOR DIRECTIONS below are explicitly reconstructed,
// not represented as raw source XZ endpoints. This is a selection/ownership
// regression, NOT a certified foot plant, 24fps footage or independent A/B.
test('RED: real sparse mobile Walking_A chooses counterpitch, not heel-dominant toe-only clearance',async()=>{
 const {chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const start={
  left:{heelY:-.0305167624482367,toeY:-.028575180047730596,
   heelXZ:[-3.7293078722809687,-6.965906830021458],
   toeXZ:[-3.9993025281789563,-6.938438547212616]},
  right:{heelY:.20021949960968285,toeY:-.10067496599241343,
   heelXZ:[-3.678570801527236,-7.11843267275472],
   toeXZ:[-3.730606178229726,-7.144371095459603]}
 };
 const heelDominant={
  upperRad:-.11,lowerRad:.14,footRad:.18,
  after:{left:{...start.left},
   right:{heelY:.2223033556447336,toeY:-.07992956693770206,
    heelXZ:[-3.689599797198224,-7.113557773638578],
    toeXZ:[-3.712559615112503,-7.161684550764056]}}
 };
 const betterPitch={
  upperRad:-.11,lowerRad:.14,footRad:.24,
  after:{left:{...start.left},
   right:{
    heelY:start.right.heelY+.017787495642723694,
    toeY:start.right.toeY+.019581958084194828,
    // Authentic shift LENGTHS 10.912mm heel / 24.370mm toe;
    // synthetic directions to complete the pure selector fixture.
    heelXZ:[start.right.heelXZ[0]+.010912401852480177,start.right.heelXZ[1]],
    toeXZ:[start.right.toeXZ[0]+.02436987434701877,start.right.toeXZ[1]]
   }}
 };
 const source={
  mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,sourceChainVerified:true,
  sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
  sourceFootTrackVerified:true,sourceBindVerified:true,
  sourceAnatomicalFootAxisVerified:true,ownerLocomotion:true,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,rootTravel:.06601862321323837,
  frameAge:0,frameInterval:.16669999999999874,
  floorTopY:-.02,side:'right',before:start,
  starter:{source:'actual-original-source-three-joint-swing-opportunity',
   sign:-1,expectedSourceSkinnedTrials:2,contactLocked:false,
   excessHeelRiseMeters:.005308016844984817},
  trials:[heelDominant,betterPitch]
 };
 const chosen=choose(source);
 assert.equal(chosen?.footRad,.24,
  'real four-source-probe selection must not prefer a heel-dominant correction');
 assert.ok(chosen.toeLiftMeters>=.0195&&chosen.toeLiftMeters<=.0197);
 assert.ok(chosen.toeLiftMeters-chosen.sourceHeelRiseMeters>=.0015,
  'true airborne sole pitch must improve, not make vertical shoe steeper');
 assert.equal(chosen.oppositeShoePreserved,true);
 assert.equal(chosen.contactLocked,false);
 for(const invalid of [{sourceInstanceSame:false},{sourceBindVerified:false},
  {sourceWeight:.7},{rootTravel:0},{teleport:true},{reducedMotion:true},
  {interrupted:true},{mode:'hurt'}])
  assert.equal(choose({...source,...invalid}),null,
   'unlicensed, unowned or nonmoving rig cannot receive physical source pose');
});


// Session 03: genuine original source-rig, 390px, Actions #44330216576,
// source artifact #14442906106, Vanguard Walking_A at mobile tick 4.
// Measured skinned swing toe -97.922634mm, heel +189.892794mm vs stone
// top -20mm, shoe span 300.994263mm/projected 88.089872mm.
// Original -120/+90mrad hip/knee trial lifted toe 19.397416mm but its
// already-airborne heel 32.551439mm: 13.154mm WORSE sole pitch.
// Existing linked -110/+140/+180 and +240mrad trial readbacks remained
// heel-dominant. The same two slots should now *measure*, NOT promise,
// stronger connected licensed foot angles. XZ vectors and 40mm root travel
// below are explicitly SYNTHETIC owner fixtures, not original readbacks.
// Real source Y/shape/interval and starter Y deltas remain source-derived.
test('RED: 183ms heel-dominant licensed swing spends same two physical foot trials on deeper counterpitch',async()=>{
 const {planOriginalSourceCoupledFootStarter:start,
  planOriginalSourceCoupledKneeFootFollowups:follow}=await load();
 const swing={heelY:.18989279396921924,toeY:-.09792263441787451,
  heelXZ:[0,0],toeXZ:[.08808987195484298,0]};
 const support={heelY:-.03439058381135052,
  toeY:-.006971902352616778,heelXZ:[0,.35],toeXZ:[.27,.35]};
 const before={left:swing,right:support};
 const baseline={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,ownerLocomotion:true,alive:true,visible:true,
  reducedMotion:false,teleport:false,interrupted:false,
  previousLinkedCertified:false,rootTravel:.04,frameAge:0,
  frameInterval:.18329999999999913,floorTopY:-.02,side:'left',before};
 const probes=[
  {upperRad:.12,lowerRad:-.09,after:{left:{...swing,
   heelY:swing.heelY-.035544294170716084,
   toeY:swing.toeY-.00971582565850733},right:support}},
  {upperRad:-.12,lowerRad:.09,after:{left:{...swing,
   heelY:swing.heelY+.03255143909805855,
   toeY:swing.toeY+.019397415926140443},right:support}}
 ];
 const starter=start({...baseline,starterTrials:probes});
 assert.equal(starter?.source,'actual-original-source-three-joint-swing-opportunity');
 assert.ok(starter.excessHeelRiseMeters>.013&&starter.excessHeelRiseMeters<.014);
 const owner={...baseline,starter,starterTrials:probes,
  sourceInstanceId:'original-same-GLB-41-joint-mobile',
  sourceChainVerified:true,sourceUpperTrackVerified:true,
  sourceLowerTrackVerified:true,sourceFootTrackVerified:true,
  sourceBindVerified:true,sourceAnatomicalFootAxisVerified:true};
 assert.deepEqual(follow(owner),[
  {upperRad:-.11,lowerRad:.14,footRad:.30},
  {upperRad:-.11,lowerRad:.14,footRad:.36}
 ],'two existing native source skin reads, no extra per-frame probes');
 for(const changed of [
  {sourceClipName:'Idle'}, {sourceWeight:.4},
  {sourceBindVerified:false},{sourceFootTrackVerified:false},
  {sourceInstanceId:'',starter:{...starter,source:'unverified'}},
  {frameInterval:.25},{reducedMotion:true},{teleport:true},
  {interrupted:true},{rootTravel:0},{alive:false},
  {starter:{...starter,contactLocked:true}}
 ])assert.equal(follow({...owner,...changed}),null,
   'fail closed on invalid licensed source, ownership, movement or joint contract');
 // Nearby but distinct faster source windows preserve their existing
 // lower joint angles rather than automatically receiving deep counterpitch.
 const faster={...baseline,frameInterval:.145};
 const fasterStarter=start({...faster,starterTrials:probes});
 assert.deepEqual(follow({...owner,...faster,starter:fasterStarter}),[
  {upperRad:-.11,lowerRad:.11,footRad:.18},
  {upperRad:-.11,lowerRad:.11,footRad:.24}
 ]);
});


// PROSPECTIVE response only: the real source measured .18/.24 ankle trials
// were heel-dominant. The +.36 trial below has NEVER been skinned/filmed;
// its Y/XZ values are a *hypothesis* to assert a fail-closed selection
// contract should a future exact original GLB trial actually find this pose.
// This is not a claim that the GLB can achieve the estimated improvement.
test('RED: 183ms source probe may retain independently measured safe deeper counterpitch, never heel-dominant deformation',async()=>{
 const {chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const left={heelY:.18989279396921924,toeY:-.09792263441787451,
  heelXZ:[0,0],toeXZ:[.08808987195484298,0]};
 const right={heelY:-.03439058381135052,
  toeY:-.006971902352616778,heelXZ:[0,.35],toeXZ:[.27,.35]};
 const before={left,right};
 const starter={source:'actual-original-source-three-joint-swing-opportunity',
  sign:-1,expectedSourceSkinnedTrials:2,contactLocked:false,
  excessHeelRiseMeters:.013154023171918106};
 const good={upperRad:-.11,lowerRad:.14,footRad:.36,
  after:{left:{heelY:left.heelY+.008,toeY:left.toeY+.018,
   heelXZ:[.005,0],toeXZ:[.105,0]},right}};
 const bad={upperRad:-.11,lowerRad:.14,footRad:.30,
  after:{left:{heelY:left.heelY+.018,toeY:left.toeY+.020,
   heelXZ:[.005,0],toeXZ:[.101,0]},right}};
 const input={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,sourceChainVerified:true,
  sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
  sourceFootTrackVerified:true,sourceBindVerified:true,
  sourceAnatomicalFootAxisVerified:true,ownerLocomotion:true,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,rootTravel:.04,frameAge:0,
  frameInterval:.18329999999999913,floorTopY:-.02,side:'left',
  before,starter,trials:[bad,good]};
 const result=choose(input);
 assert.equal(result?.footRad,.36);
 assert.equal(result?.contactLocked,false);
 assert.equal(result?.oppositeShoePreserved,true);
 assert.ok(result.toeLiftMeters>=.018-1e-8);
 assert.ok(result.toeLiftMeters-result.sourceHeelRiseMeters>=.009);
 for(const damaged of [
  {sourceInstanceSame:false},{sourceBindVerified:false},
  {sourceWeight:.5},{sourceClipName:'Idle'},{mode:'hurt'},
  {frameInterval:.35},{teleport:true},{interrupted:true},
  {reducedMotion:true},{rootTravel:0},
  {trials:[{...good,after:{...good.after,
   right:{...right,toeY:right.toeY+.009}}}]},
  {trials:[{...good,after:{...good.after,
   left:{...good.after.left,heelY:left.heelY+.018}}}]},
  {trials:[{...good,after:{...good.after,
   left:{...good.after.left,toeXZ:[.20,0]}}}]}
 ])assert.equal(choose({...input,...damaged}),null,
   'no untrusted source, worse loaded shoe, excessive deformation or heel-dominant acceptance');
});


test('original 150ms licensed three-joint pitch can be recognised without weakening the generic 20mm shoe gate',()=>{
 // Exact independently witnessed original 390px source skin from failing
 // WebGL at f26a04b6 / Actions 44529028565; source right-shoe readback.
 // The toe is STILL buried: this proves neither contact nor visual quality.
 const {certifyOriginalSource150msThreeJointPitch}=require(
  '../browser/dungeon-session03-coupled-pitch-proof.cjs');
 const proof={
  sourceInstanceId:'original-same-clone',sourceClip:'Walking_A',
  sourceWeight:1,witnessedSourceWeight:1,
  witnessedFrameIntervalSeconds:.14999999999999858,
  witnessedRootTravelMeters:.07515023427613743,
  witnessedRootTravelAgeSeconds:0,sourceProbeCount:4,
  oppositeShoePreserved:true,finalIndependentSourceSkin:true,
  originalWorldSolePitchAxisVerified:true,contactLocked:false
 };
 const coupled={
  source:'measured-original-skinned-coupled-knee-foot',
  sourceClip:'Walking_A',sourceJointCount:3,
  upperRad:-.11,lowerRad:.11,footRad:.24,toeRad:0,
  oppositeShoePreserved:true,contactLocked:false,
  finalIndependentSourceSkin:true
 };
 const before={toeY:-.0971185077954275,heelY:.2030813074415244};
 const after={toeY:-.08095895075468096,heelY:.21615966579343246};
 const actual=certifyOriginalSource150msThreeJointPitch({proof,coupled,before,after});
 assert.ok(actual,'genuine 150ms source pitch with 16.159mm lift should be classified, not falsely rejected as a generic pose');
 assert.equal(actual.contactLocked,false);
 assert.equal(actual.plantCertified,false);
 assert.ok(actual.toeLiftMeters>=.016&&actual.toeLiftMeters<.02);
 assert.ok(actual.relativePitchGainMeters>=.0025);
 const rejected=[
  {proof:{...proof,witnessedFrameIntervalSeconds:.09}},
  {proof:{...proof,witnessedSourceWeight:.8}},
  {proof:{...proof,finalIndependentSourceSkin:false}},
  {proof:{...proof,witnessedRootTravelMeters:0}},
  {proof:{...proof,oppositeShoePreserved:false}},
  {proof:{...proof,sourceInstanceId:''}},
  {coupled:{...coupled,sourceJointCount:4}},
  {coupled:{...coupled,footRad:.36}},
  {coupled:{...coupled,oppositeShoePreserved:false}},
  {before:{...before,toeY:-.11}},
  {after:{...after,toeY:-.094}},
  {after:{...after,heelY:.225}},
 ];
 for(const invalid of rejected)
  assert.equal(certifyOriginalSource150msThreeJointPitch({
   proof,coupled,before,after,...invalid
  }),null,'only independently source-qualified 150ms licensed pitch can use the narrow exception');
});
