'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/full-body-animation-controller.js'),'utf8')).toString('base64'));

// The Y observations and actual four candidate deltas are from EXACT original
// 41-joint source GLB WebGL desktop, run #43998458689, artifact #14292044756,
// dungeon-full-body-original-sole-hand-desktop.json, trace tick 6.
// The XZ positions are a *contract fixture* based on an earlier pinned-shoe
// capture; they are NOT claimed as same-frame, post-change source measurements.
const left={heelY:.18806230703612709,toeY:-.09821537424247749,
 heelXZ:[-2.6857877106507537,-7.109579492226674],
 toeXZ:[-2.73413129625911,-7.137299054770223]};
const right={heelY:-.026346847190419482,toeY:.009419886162419462,
 heelXZ:[-2.7561092271257652,-6.958493498030336],
 toeXZ:[-3.02628765060259,-6.933358943285804]};
const after=(toeLift,heelLift,other=right)=>({
 left:{...left,toeY:left.toeY+toeLift,heelY:left.heelY+heelLift},
 right:{...other}
});
const owner={
 mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
 sourceInstanceSame:true,sourceChainVerified:true,sourceUpperTrackVerified:true,
 sourceLowerTrackVerified:true,sourceFootTrackVerified:true,
 sourceBindVerified:true,sourceAnatomicalFootAxisVerified:true,
 sourceInstanceId:'original-cc0-Vanguard-clone',ownerLocomotion:true,
 alive:true,visible:true,teleport:false,reducedMotion:false,
 interrupted:false,previousLinkedCertified:false,
 rootTravel:.019291663189028085,frameAge:.03,
 frameInterval:.033299999999997,side:'left',floorTopY:-.02,
 before:{left,right},starterTrials:[
  {upperRad:.09,lowerRad:-.075,
   after:after(-.007568685369846562,-.028040320377715366)},
  {upperRad:-.09,lowerRad:.075,
   after:after(.013456106429497947,.026167198087730548)}
 ]
};
test('RED-first: exact native 33ms buried toe schedules only TWO bounded licensed fast counterpitch source probes',async()=>{
 const {planOriginalSourceCoupledFootStarter:starterFn,
  planOriginalSourceCoupledKneeFootFollowups:followup}=await load();
 const starter=starterFn(owner);
 assert.equal(starter?.source,'actual-original-source-three-joint-swing-opportunity');
 assert.equal(starter?.sign,-1);
 assert.ok(Math.abs(starter.excessHeelRiseMeters-.012711091658232601)<1e-10);
 assert.deepEqual(followup({...owner,starter}),[
  {upperRad:-.11,lowerRad:.11,footRad:.38},
  {upperRad:-.11,lowerRad:.11,footRad:.46}
 ],'two bounded hip+knee+foot trials, no new GPU draws or source skinned reads');
 assert.equal(followup({...owner,starter,sourceFootTrackVerified:false}),null);
 assert.equal(followup({...owner,starter,sourceBindVerified:false}),null);
 assert.equal(followup({...owner,starter,sourceInstanceId:''}),null);
 assert.equal(followup({...owner,starter,interrupted:true}),null);
 assert.equal(followup({...owner,starter,reducedMotion:true}),null);
 assert.equal(followup({...owner,starter,teleport:true}),null);
 assert.equal(followup({...owner,starter,rootTravel:0}),null);
 assert.equal(followup({...owner,starter,sourceClipName:'Idle'}),null);
 assert.equal(followup({...owner,starter,sourceWeight:.6}),null);
 assert.equal(followup({...owner,starter,frameInterval:.25}),null);
 assert.equal(followup({...owner,starter,sourceInstanceSame:false}),null);
 assert.ok(left.toeY<owner.floorTopY-.075,'the original source toe is genuinely buried; this fixture is not a sole plant');
});
test('original 18/24rad negative trial is REJECTED and 46rad trial may only be eligible after independently measured both-shoe after evidence',async()=>{
 const {planOriginalSourceCoupledFootStarter:starterFn,
  chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const starter=starterFn(owner);
 const originalMeasured={upperRad:-.11,lowerRad:.11,footRad:.24,
  after:after(.017962265331505925,.017878017286777348)};
 assert.equal(choose({...owner,starter,trials:[originalMeasured]}),null,
  'the previous actually measured +17.962mm toe lift cannot pass 20mm minimum');
 const hypothetical={upperRad:-.11,lowerRad:.11,footRad:.46,
  after:after(.029,.005)};
 const synthetic=choose({...owner,starter,trials:[hypothetical]});
 assert.equal(synthetic?.source,'measured-original-skinned-coupled-knee-foot',
  'SYNTHETIC acceptance test only; does not assert new WebGL outcome');
 assert.equal(synthetic.contactLocked,false);
 assert.ok(synthetic.afterToeY<owner.floorTopY,
  'a still-buried toe with an admissible improvement cannot be called planted');
 for(const trial of [
  {...hypothetical,footRad:.28},
  {...hypothetical,footRad:.47},
  {...hypothetical,after:after(.012,.005)},
  {...hypothetical,after:after(.029,.055)},
  {...hypothetical,after:after(.029,.005,{...right,toeY:right.toeY+.008})},
  {...hypothetical,after:after(.029,.005,{...right,heelXZ:[right.heelXZ[0]+.01,right.heelXZ[1]]})}
 ]) assert.equal(choose({...owner,starter,trials:[trial]}),null,
  'only the two measured, supported, non-deforming source shoe candidates can survive');
 assert.equal(choose({...owner,trials:[hypothetical]}),null,
  'large source ankle rotation requires actual starter receipt, not just Y coordinates');
 assert.equal(choose({...owner,starter:{...starter,excessHeelRiseMeters:.001},trials:[hypothetical]}),null);
 assert.equal(choose({...owner,starter:{...starter,sign:1},trials:[hypothetical]}),null);
 for(const unsafe of [{teleport:true},{reducedMotion:true},{interrupted:true},
  {sourceFootTrackVerified:false},{sourceBindVerified:false},{rootTravel:0},
  {sourceWeight:.8},{frameInterval:.2166},{sourceClipName:'Idle'}])
  assert.equal(choose({...owner,...unsafe,starter,trials:[hypothetical]}),null,
   'larger source joint trial is never authorized without original frame and bone contract');
});
test('actual renderer binds the certified starter into BOTH initial and final 3-joint source-skinned checks',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=renderer.indexOf('if(kneeFootCoupled){\n  const coupledOwner=');
 const end=renderer.indexOf(' // The certified original source heel',start);
 assert.ok(start>0);
 const branch=renderer.slice(start,renderer.indexOf(' const selected=chooseOriginalSourceSwingLinkedLegTrial(',start));
 assert.match(branch,/const option=chooseOriginalSourceCoupledKneeFootSweep\(\{\.\.\.coupledOwner,\s*starter:connectedStarter,/);
 assert.match(branch,/const final=chooseOriginalSourceCoupledKneeFootSweep\(\{\.\.\.coupledOwner,\s*starter:connectedStarter,/);
 assert.match(branch,/final\.oppositeShoePreserved!==true/);
 assert.match(branch,/final\.contactLocked!==false/);
 assert.match(branch,/sourceProbeCount:trials\.length/);
 const ownerStage=renderer.slice(renderer.indexOf('function stageOriginalSourceSwingLinkedLegAfterMixer('),
  renderer.indexOf('function stageRigLegsAfterMixer('));
 assert.match(ownerStage,/planOriginalSourceCoupledKneeFootFollowups\(/);
 assert.match(ownerStage,/for\(const \{upperRad,lowerRad,footRad\} of connectedAngles\)/);
 assert.match(ownerStage,/finally\{\s*upper\.bone\.quaternion\.copy\(upperOriginal\)/,
  'source GLB hips/knees and original foot return to correct source before next animation frame');
});