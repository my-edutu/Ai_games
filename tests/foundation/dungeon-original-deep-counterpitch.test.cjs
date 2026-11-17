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

// 17 November genuine #44006184216, exact original desktop skinned
// Walking_A frame 16.7ms, toe -89.443mm, heel +211.815mm against
// -20mm stone. The second REAL native hip/knee probe raised the toe
// 17.865mm but the airborne heel 22.355mm (+4.490mm heel-dominant).
// Real Y and sample deltas below are from that very same frame.
// The XZ values, rig ID and 19.29mm root travel are contract fixtures
// inherited above, NOT recorded for this frame and NOT visual evidence.
test('RED-first: original 16.7ms buried source foot receives two bounded faster counterpitch opportunities',async()=>{
 const {planOriginalSourceCoupledFootStarter:starterFn,
  planOriginalSourceCoupledKneeFootFollowups:followup,
  chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const rapidLeft={...left,toeY:-.08944286220909287,
  heelY:.21181497803018653};
 const rapidRight={...right,toeY:-.03736678529634406,
  heelY:-.023498471365476066};
 const afterRapid=(toeLift,heelLift)=>({
  left:{...rapidLeft,toeY:rapidLeft.toeY+toeLift,
   heelY:rapidLeft.heelY+heelLift},
  right:{...rapidRight}
 });
 const fast={...owner,frameInterval:.01670000000000016,
  frameAge:.0167,before:{left:rapidLeft,right:rapidRight},
  starterTrials:[
   {upperRad:.09,lowerRad:-.075,
    after:afterRapid(-.01216026406441749,-.024841835681171376)},
   {upperRad:-.09,lowerRad:.075,
    after:afterRapid(.01786519306023121,.022355418772534164)}
  ]
 };
 const starter=starterFn(fast);
 assert.equal(starter?.sign,-1,
  'genuine heel-dominated connected leg opportunity');
 assert.ok(Math.abs(starter.excessHeelRiseMeters-.004490225712302954)<1e-9);
 assert.deepEqual(followup({...fast,starter}),[
  {upperRad:-.11,lowerRad:.11,footRad:.28},
  {upperRad:-.11,lowerRad:.11,footRad:.34}
 ],'reserve precisely the existing two weighed source shoe probes');
 // Synthetic after-skin candidate merely verifies the final pure gate:
 // actual source feet MUST independently pass the exact same check in WebGL.
 const synthetic=choose({...fast,starter,trials:[
  {upperRad:-.11,lowerRad:.11,footRad:.34,
   after:afterRapid(.027,.004)}
 ]});
 assert.equal(synthetic?.source,'measured-original-skinned-coupled-knee-foot');
 assert.equal(synthetic?.contactLocked,false);
 assert.ok(synthetic.afterToeY<fast.floorTopY,
  'candidate lift must never be mislabelled as planted');
 for(const unsafe of [{frameInterval:.08},{rootTravel:0},
  {sourceFootTrackVerified:false},{sourceBindVerified:false},
  {sourceWeight:.82},{reducedMotion:true},{interrupted:true},
  {teleport:true},{alive:false},{sourceClipName:'Idle'}]){
  assert.equal(followup({...fast,starter,...unsafe}),null);
  assert.equal(choose({...fast,starter,...unsafe,trials:[
   {upperRad:-.11,lowerRad:.11,footRad:.34,
    after:afterRapid(.027,.004)}
  ]}),null);
 }
 assert.equal(choose({...fast,starter,trials:[
  {upperRad:-.11,lowerRad:.11,footRad:.34,
   after:afterRapid(.012,.031)}
 ]}),null,'unsafe actual heel increase must be rejected');
 assert.equal(choose({...fast,starter,trials:[
  {upperRad:-.11,lowerRad:.11,footRad:.46,
   after:afterRapid(.027,.004)}
 ]}),null,'33ms deep phase source counterpitch cannot leak into rapid frame');
});


// EXACT completed 17 Nov source WebGL #44013123534 / 390px artifact
// #14299526737, native Walking_A tick 6 (33.3ms): original shoe toe
// -107.028mm, heel +194.868mm, actual source starter delta +17.925mm
// toe and +23.285mm heel. This is +5.359mm excess airborne heel.
// Fixture XZ below is borrowed from another source moment and is NOT
// evidence of a same-frame world-space sole, candidate or foot plant.
test('RED-first: native 390px deeply buried 33ms, mildly heel-dominant source foot reserves two licensed connected counterpitch reads',async()=>{
 const {planOriginalSourceCoupledFootStarter:starterFn,
  planOriginalSourceCoupledKneeFootFollowups:followup}=await load();
 const mobileRight={heelY:.19486790388392836,toeY:-.10702810946958062,
  heelXZ:[-3.6886531080650844,-7.131151300520951],
  toeXZ:[-3.7385027234365555,-7.1422241004059766]};
 const mobileLeft={heelY:-.025123405203951656,toeY:-.026881819122444257,
  heelXZ:[-3.7536611860420876,-6.967522346055006],
  toeXZ:[-4.023606838881545,-6.939721802349725]};
 const afterMobile=(toeLift,heelLift)=>({
  right:{...mobileRight,toeY:mobileRight.toeY+toeLift,
   heelY:mobileRight.heelY+heelLift},
  left:{...mobileLeft}
 });
 const mobile={...owner,side:'right',frameInterval:.03330000000000055,
  frameAge:.0333,rootTravel:.009831086296817122,
  before:{right:mobileRight,left:mobileLeft},starterTrials:[
   {upperRad:.09,lowerRad:-.075,
    after:afterMobile(-.01213654939339838,-.025663033435648325)},
   {upperRad:-.09,lowerRad:.075,
    after:afterMobile(.01792513341812961,.02328459246952927)}
  ]
 };
 const starter=starterFn(mobile);
 assert.equal(starter?.sign,-1);
 assert.ok(Math.abs(starter.excessHeelRiseMeters-.00535945905139966)<1e-9);
 assert.deepEqual(followup({...mobile,starter}),[
  {upperRad:-.11,lowerRad:.11,footRad:.30},
  {upperRad:-.11,lowerRad:.11,footRad:.36}
 ],'exact remaining two reversible original GLB shoe samples, no synthetic contact');
 for(const unsafe of [{sourceWeight:.8},{interrupted:true},
  {sourceFootTrackVerified:false},{sourceBindVerified:false},
  {sourceInstanceSame:false},{rootTravel:0},{reducedMotion:true},
  {frameInterval:.25}])
  assert.equal(followup({...mobile,starter,...unsafe}),null,
   'real animation, source clip/skin, ownership and movement gates remain strict');
 const notDeepEnough={...mobile,before:{...mobile.before,
  right:{...mobileRight,toeY:-.05}},starterTrials:mobile.starterTrials};
 assert.equal(starterFn(notDeepEnough),null,
  'actual source starter readback must match the exact source shoe, never a stale correction');
});


// The exact original 390px WebGL source-rig evidence #44068192870
// has a 16.8ms Walking_A frame with a 95.066mm buried swinging toe,
// 186.086mm raised heel, and measured starter toe/heel lifts of
// +11.8598mm / +27.1983mm. Source outsole XZ span was 104.285mm.
// Coordinates below use a LOCAL test origin, not a recorded world XZ point.
// Hypothetical followup results are fixtures, NOT genuine WebGL output.
test('RED: rapid genuine 95mm source burial schedules two safer connected outsole trials',async()=>{
 const {planOriginalSourceCoupledFootStarter:starterFn,
  planOriginalSourceCoupledKneeFootFollowups:followups,
  chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const right={heelY:.16608585877369186,toeY:-.1150664451108418,
  heelXZ:[0,0],toeXZ:[.10428536966300812,0]};
 const left={heelY:-.03992912154381906,toeY:-.005724964955428763,
  heelXZ:[1,0],toeXZ:[1.27,0]};
 const after=(lift,rise)=>({
  right:{...right,toeY:right.toeY+lift,heelY:right.heelY+rise},
  left:{...left}});
 const realStarter=[
  {upperRad:.09,lowerRad:-.075,
   after:after(-.006017757600225368,-.028955580006220394)},
  {upperRad:-.09,lowerRad:.075,
   after:after(.011859776143756079,.027198325120458278)}
 ];
 const frame={...owner,side:'right',frameInterval:.016800000000001702,
  frameAge:.0168,rootTravel:.019291663189028085,
  before:{right,left},sourceInstanceId:'source-vanguard-clone',
  starterTrials:realStarter};
 const starter=starterFn(frame);
 assert.equal(starter?.sign,-1);
 assert.ok(Math.abs(starter.excessHeelRiseMeters-.015338548976702199)<1e-10);
 const expected=[{upperRad:-.11,lowerRad:.11,footRad:.30},
  {upperRad:-.11,lowerRad:.11,footRad:.36}];
 assert.deepEqual(followups({...frame,starter}),expected,
  'reserve the same two existing native skin reads for a bounded three-joint correction');
 const fixture=choose({...frame,starter,trials:[
  {...expected[1],after:after(.025,.008)}
 ]});
 assert.equal(fixture?.source,'measured-original-skinned-coupled-knee-foot');
 assert.equal(fixture.contactLocked,false);
 assert.ok(fixture.afterToeY<frame.floorTopY-.06,
  'a still-buried synthetic toe must never be described as planted');
 for(const bad of [
  {sourceFootTrackVerified:false},{sourceBindVerified:false},
  {sourceAnatomicalFootAxisVerified:false},{sourceInstanceSame:false},
  {interrupted:true},{teleport:true},{reducedMotion:true},
  {sourceClipName:'Idle'},{sourceWeight:.8},{rootTravel:0},
  {frameInterval:.2501},{frameAge:.25}
 ]){
  assert.equal(followups({...frame,starter,...bad}),null);
  assert.equal(choose({...frame,starter,...bad,
   trials:[{...expected[1],after:after(.025,.008)}]}),null);
 }
 assert.equal(choose({...frame,starter,trials:[
  {...expected[1],after:after(.025,.035)}
 ]}),null,'excess original airborne heel rise remains unacceptable');
});
