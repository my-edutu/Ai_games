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
 assert.match(ownerStage,/for\(const \{upperRad,lowerRad,footRad,toeRad=0\} of boundedConnectedAngles\)/);
 assert.match(ownerStage,/const boundedConnectedAngles=sourceToeAngles\?\?connectedAngles/);
 assert.match(ownerStage,/toeBone\.quaternion\.copy\(toeOriginal\)/,
  'original toe hinge is reversibly sampled with the source thigh/calf/foot chain');
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


// Exact 17 November 2026 genuine source GLB WebGL, Actions #44077727181.
// Both native nine-tick films passed, but linked-leg probes stayed ZERO.
// The source clip, legal root travel and original render interval must give
// a precise non-plant rejection receipt rather than fake 24fps acceptance.
test('RED: classify why real original full-body walking shoe trials are not sampled',async()=>{
 const {classifyOriginalSourceSwingSourceWindow:reason}=await load();
 const legal={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,rootTravel:.028223914853704977,
  frameAge:0,frameInterval:.016699999999996606};
 assert.equal(reason(legal),'original-walking-window-measurable-shoes-unchecked');
 assert.equal(reason({...legal,sourceWeight:.6086958646774292}),
  'original-walking-crossfade-underweight');
 assert.equal(reason({...legal,frameInterval:3.2331999999999965}),
  'source-display-gap-exceeds-four-probe-window');
 assert.equal(reason({...legal,frameInterval:1.4331999999999994}),
  'source-display-gap-exceeds-four-probe-window');
 assert.equal(reason({...legal,rootTravel:0}),
  'source-root-travel-unwitnessed');
 assert.equal(reason({...legal,frameAge:.15001}),
  'source-root-travel-stale');
 for(const denied of [{sourceClipName:'Idle'},{mode:'attack'},
  {alive:false},{visible:false},{interrupted:true},
  {teleport:true},{reducedMotion:true},{sourceWeight:NaN},
  {frameInterval:NaN},{rootTravel:NaN},{frameAge:NaN}])
  assert.notEqual(reason({...legal,...denied}),
   'original-walking-window-measurable-shoes-unchecked');
});


// Genuine run #44103458612 original source on desktop: 41-joint Vanguard
// Walking_A 33.3ms, .46rad thigh/knee/foot probe gave ~27.6mm real toe
// relief while retaining ~73.9mm burial. Source inverse-bind audit reports
// the ORIGINAL toes.r joint owns 100% of selected skinned toe vertex.
// The world-space derivative fixture below is synthetic: only ACTUAL native
// four-read source-GLB evidence can authorize a visible correction.
test('RED-first: native weighted toes child shares the original four skinned shoe trials',async()=>{
 const {planOriginalSourceCoupledToeHingeFollowups}=await load();
 const old=[{upperRad:-.11,lowerRad:.11,footRad:.38},
  {upperRad:-.11,lowerRad:.11,footRad:.46}];
 const proof={source:'same-original-GLB-skin-toes-hinge',sourceClipName:'Walking_A',
  sourceWeight:1,frameInterval:.0333,sourceInstanceSame:true,
  sourceFootTrackVerified:true,sourceToeChainVerified:true,
  sourceToeTrackName:'toesr.quaternion',sourceToeBoneName:'toesr',
  sourceToeSkinnedWeight:1,sourceToeVertexWorld:[.1,-.093,0],
  sourceToePivotWorld:[0,-.093,0],sourceToeAxisWorld:[0,0,-1],
  originalFollowups:old,sourceBurialMeters:.0739,
  ownerLocomotion:true,alive:true,visible:true,reducedMotion:false,
  teleport:false,interrupted:false};
 const selected=planOriginalSourceCoupledToeHingeFollowups(proof);
 assert.deepEqual(selected,[
  {...old[1],toeRad:0},
  {...old[1],toeRad:-.14}
 ],'retain the verified .46rad no-toes baseline, then spend only the remaining existing skin read on one original-toes child');
 assert.deepEqual(planOriginalSourceCoupledToeHingeFollowups({
  ...proof,sourceToeAxisWorld:[0,0,1]}),[
  {...old[1],toeRad:0},{...old[1],toeRad:.14}
 ]);
 for(const bad of [
  {sourceToeSkinnedWeight:.49},{sourceToeTrackName:'manufactured.quaternion'},
  {sourceToeBoneName:'toesl'},{sourceWeight:.75},
  {sourceToeChainVerified:false},{sourceInstanceSame:false},
  {reducedMotion:true},{teleport:true},{interrupted:true},
  {sourceBurialMeters:.004},{frameInterval:.65},
  {sourceToeVertexWorld:[0,-.093,0]},
  {sourceToeAxisWorld:[NaN,0,0]},{originalFollowups:[old[1]]}
 ])assert.equal(planOriginalSourceCoupledToeHingeFollowups({...proof,...bad}),null);
 // One signed toe-bone addition may NEVER bypass the existing original
 // both-shoes skin validator or accept a synthetic foot plant.
 const chooser= (await load()).chooseOriginalSourceCoupledKneeFootSweep;
 assert.equal(typeof chooser,'function');
});

test('RED-first: renderer uses genuine skinned toes bone only within two remaining original coupled probes',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const begin=renderer.indexOf('if(connectedAngles){',renderer.indexOf('const sourceCoupledPriority='));
 const end=renderer.indexOf('if(!kneeFootCoupled){',begin);
 assert.ok(begin>0&&end>begin,'found native four-skin-probe original source sweep');
 const scope=renderer.slice(begin,end);
 assert.match(scope,/planOriginalSourceCoupledToeHingeFollowups\(/);
 assert.match(scope,/sourceToeSkinnedWeight/);
 assert.match(scope,/toeBone\.quaternion\.copy\(toeOriginal\)/);
 assert.match(scope,/toeRad/);
 assert.match(renderer,/originalSwingToeJointRestore\.push\(\{bone:toeBone,original:toeOriginal\.clone\(\)\}\)/);
});


// Source-specific regression from ACTUAL original 390px native Chromium
// #44119004252, artifact #14345669607, mobile tick 6 at 33.3ms.
// The licensed Walking_A Vanguard right shoe: toe -107.771mm, heel
// +192.575mm; a REAL two-hip/calf + .30/.36rad foot sample recovered
// at most 17.794mm toe and raised heel 4.434mm, rejected as insufficient.
// That entire fast-band trial previously could NEVER access the licensed
// toesr child because the downstream original-toes planner demanded
// .38/.46rad only. The ToeWorld axis/lever here is an intentionally
// synthetic planning fixture, NOT observed toe-hinge success or a planted
// shoe; the final original WebGL weighted two-shoe skin still owns approval.
test('RED: original 390px fast Walking_A toe-hinge probe retains the measured .30/.36rad coupled source band',async()=>{
 const {planOriginalSourceCoupledToeHingeFollowups:followup,
  chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const measured=[{upperRad:-.11,lowerRad:.11,footRad:.30},
  {upperRad:-.11,lowerRad:.11,footRad:.36}];
 const genuineWindow={source:'same-original-GLB-skin-toes-hinge',
  sourceClipName:'Walking_A',sourceWeight:1,
  frameInterval:.03330000000000055,sourceInstanceSame:true,
  sourceFootTrackVerified:true,sourceToeChainVerified:true,
  sourceToeTrackName:'toesr.quaternion',sourceToeBoneName:'toesr',
  // Pinned original KayKit source vertex has 100% toesr influence.
  sourceToeSkinnedWeight:1,
  sourceToeVertexWorld:[.100,-.10777081432356109,0],
  sourceToePivotWorld:[0,-.10777081432356109,0],
  sourceToeAxisWorld:[0,0,-1],
  sourceBurialMeters:.08777081432356109,originalFollowups:measured,
  ownerLocomotion:true,alive:true,visible:true,reducedMotion:false,
  teleport:false,interrupted:false};
 assert.deepEqual(followup(genuineWindow),[
  {...measured[1],toeRad:0},
  {...measured[1],toeRad:-.14}
 ],'use the original existing FOUR source-skin reads, replacing only the last two with an authenticated true 4-joint comparison');
 assert.equal(choose({
  mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,sourceChainVerified:true,
  sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
  sourceFootTrackVerified:true,sourceBindVerified:true,
  sourceAnatomicalFootAxisVerified:true,sourceToeTrackVerified:true,
  sourceToeChainVerified:true,sourceToeSkinnedWeight:1,
  ownerLocomotion:true,alive:true,visible:true,
  rootTravel:.00824626163660129,frameAge:0,
  frameInterval:.03330000000000055,side:'right',floorTopY:-.02,
  before:{right:{heelY:.19257548955450823,toeY:-.10777081432356109,
   heelXZ:[0,0],toeXZ:[.10,0]},
   left:{heelY:-.03913828454208674,toeY:-.03648081155664422,
    heelXZ:[1,0],toeXZ:[1.27,0]}},
  starter:{source:'actual-original-source-three-joint-swing-opportunity',
   sign:-1,expectedSourceSkinnedTrials:2,contactLocked:false,
   excessHeelRiseMeters:.005666615},
  trials:[]}),null,
  'candidate scheduling cannot bypass a measured native final-skin result');
 for(const bad of [
  {sourceToeSkinnedWeight:.89},{sourceToeTrackName:'toesl.quaternion'},
  {sourceToeChainVerified:false},{sourceFootTrackVerified:false},
  {sourceInstanceSame:false},{sourceWeight:.94},
  {frameInterval:.26},{sourceBurialMeters:.004},
  {interrupted:true},{reducedMotion:true},{teleport:true},
  {originalFollowups:[measured[1]]},
  {originalFollowups:[{...measured[0],footRad:.31},measured[1]]},
  {originalFollowups:[measured[0],{...measured[1],footRad:.46}]}
 ]) assert.equal(followup({...genuineWindow,...bad}),null,
  'unsupported original source band, damaged chain and non-native witnesses stay rejected');
});


// Real AFTER original GLB/390px source-skin from #44130392878:
// .46rad connected original foot trial lifts ~27.93mm yet leaves the toe
// ~51.85mm under floor. The fourth fixed -.14rad original toes-child adds
// ~14.45mm but leaves ~37.4mm burial. A true post-connected world hinge
// is needed instead of guessing a fixed child angle. All test axes below
// are SYNTHETIC planning fixtures, not source skin/IK/visual acceptance.
test('null original skinned trial safely fails closed without changing gameplay pose',async()=>{
 const {chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const rejected=choose({...owner,starter:{source:'actual-original-source-three-joint-swing-opportunity',expectedSourceSkinnedTrials:2,contactLocked:false,sign:-1,excessHeelRiseMeters:.005},trials:[null]});
 assert.equal(rejected,null);
});

test('RED: four-joint original toe probe is bounded by actual post-coupled skinned gap and world hinge',async()=>{
 const {planOriginalSourceAdaptiveToeHingeProbe:plan}=await load();
 assert.equal(typeof plan,'function');
 const source={source:'verified-original-post-coupled-toe-hinge',
  sourceClipName:'Walking_A',sourceWeight:1,frameInterval:.0333,
  sourceInstanceSame:true,sourceToeTrackVerified:true,
  sourceToeChainVerified:true,sourceToeSkinnedWeight:1,
  preplannedToeRad:-.14,
  sourceToeVertexWorld:[.1,-.07185,0],
  sourceToePivotWorld:[0,-.07185,0],sourceToeAxisWorld:[0,0,-1],
  sourceHeelY:.18841,floorTopY:-.02,
  ownerLocomotion:true,alive:true,visible:true,
  interrupted:false,teleport:false,reducedMotion:false};
 assert.equal(plan(source)?.toeRad,-.32);
 assert.equal(plan({...source,sourceToeVertexWorld:[.1,-.035,0],
  sourceToePivotWorld:[0,-.035,0]})?.toeRad,-.19);
 assert.equal(plan({...source,sourceToeAxisWorld:[0,0,1],
  preplannedToeRad:.14})?.toeRad,.32);
 for(const bad of [{sourceToeTrackVerified:false},
  {sourceToeChainVerified:false},{sourceToeSkinnedWeight:.89},
  {sourceInstanceSame:false},{sourceWeight:.90},
  {preplannedToeRad:.4},{preplannedToeRad:.14},
  {sourceToeAxisWorld:[NaN,0,0]},{sourceToeAxisWorld:[0,1,0]},
  {sourceToeVertexWorld:[0,-.07185,0]},
  {sourceHeelY:-.2},{floorTopY:.1},{frameInterval:.25},
  {reducedMotion:true},{teleport:true},{interrupted:true},
  {ownerLocomotion:false},{alive:false},{visible:false}])
  assert.equal(plan({...source,...bad}),null,'unsafe toe scheduling must fail closed');
});
test('RED: native fourth toe sample takes real third-sample skinned toe and updated source world axis',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const start=renderer.indexOf('const boundedConnectedAngles=');
 const finish=renderer.indexOf('if(!kneeFootCoupled){',start);
 const scope=renderer.slice(start,finish);
 assert.ok(start>0&&finish>start);
 assert.match(scope,/planOriginalSourceAdaptiveToeHingeProbe\(/);
 assert.match(scope,/sourceAdaptiveToeCandidate/);
 assert.match(renderer,/sourceAdaptiveToeCandidate:selectedTrial\?\.sourceAdaptiveToeCandidate/);
 const controller=fs.readFileSync(path.join(root,'public/ai-dungeon/full-body-animation-controller.js'),'utf8');
 assert.match(controller,/trial\?\.sourceAdaptiveToeCandidate/);
});


// Session 03 RED: real walking source has a deeply buried *swing* toe despite
// a verified linked thigh/calf/foot/toes correction. A bounded coordinated
// upper/lower-leg lift could recover additional clearance without another
// source-skin read. The WORLD bone/sole coordinates in this unit fixture are
// synthetic anatomical LEVER examples, NOT footage, contact or IK evidence.
// Chromium must still independently read the genuine CC0 weighted shoes.
test('RED: measured source hip-to-knee lever plans only a small supported swing-foot lift',async()=>{
 const {planOriginalSourceConnectedHipKneeLift:plan}=await load();
 assert.equal(typeof plan,'function');
 const source={
  source:'verified-original-post-coupled-hip-knee-lever',
  mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,sourceUpperTrackVerified:true,
  sourceLowerTrackVerified:true,sourceBindVerified:true,
  sourceToeChainVerified:true,ownerLocomotion:true,
  alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,frameInterval:.0333,
  floorTopY:-.02,sourceToeWorld:[0,-.055,.2],
  sourceHeelWorld:[0,.18,.21],
  sourceHipPivotWorld:[0,.48,-.18],
  sourceKneePivotWorld:[0,.21,0],
  sourceHipAxisWorld:[1,0,0],sourceKneeAxisWorld:[1,0,0],
  upperRad:-.11,lowerRad:.11,footRad:.46
 };
 const candidate=plan(source);
 assert.equal(candidate?.source,source.source);
 assert.ok(candidate.deltaRad>=.015&&candidate.deltaRad<=.035);
 assert.ok(candidate.upperRad<-.11&&candidate.upperRad>=-.14501);
 assert.ok(candidate.lowerRad>.11&&candidate.lowerRad<=.14501);
 assert.ok(candidate.worldToeLiftEstimateMeters>=.005);
 assert.ok(candidate.worldHeelLiftEstimateMeters>=0);
 assert.equal(candidate.originalSourceContactLocked,false);
 for(const bad of [
  {sourceWeight:.90},{sourceClipName:'Idle'},
  {sourceUpperTrackVerified:false},{sourceLowerTrackVerified:false},
  {sourceBindVerified:false},{sourceToeChainVerified:false},
  {sourceInstanceSame:false},{ownerLocomotion:false},
  {sourceToeWorld:[0,.01,.2]}, {sourceHeelWorld:[0,-.02,.21]},
  {sourceHipAxisWorld:[0,1,0]}, {sourceHipPivotWorld:[0,.48,.2]},
  {upperRad:.11,lowerRad:.11},{upperRad:-.15},
  {frameInterval:.50},{teleport:true},{interrupted:true},
  {reducedMotion:true},{alive:false},{visible:false}
 ]) assert.equal(plan({...source,...bad}),null,
  'no extra joint ownership when source bone, travel or hinge evidence fails');
});

test('RED: source connected fourth-foot sample uses real two-bone clearance before readback',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/planOriginalSourceConnectedHipKneeLift\(/);
 assert.match(renderer,/sourceCoupledHipKneeRelief/);
 assert.match(renderer,/worldToeLiftEstimateMeters/);
 const controller=fs.readFileSync(path.join(root,'public/ai-dungeon/full-body-animation-controller.js'),'utf8');
 assert.match(controller,/trial\?\.sourceCoupledHipKneeRelief/);
});


// Additional source-contract unit coverage after real RED run #44163171384.
// These shoe coordinates are synthetic *gate* fixtures. They are never
// presented as rendered GLB contact, visual quality or certified planted feet.
test('licensed fourth connected source-skin trial accepts only witnessed bounded lever and preserves opposite shoe',async()=>{
 const {planOriginalSourceCoupledFootStarter:starterFn,
  chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const starter=starterFn(owner);
 assert.equal(starter?.sign,-1);
 const relief={source:'verified-original-post-coupled-hip-knee-lever',
  upperRad:-.145,lowerRad:.145,footRad:.46,deltaRad:.035,
  worldToeLiftEstimateMeters:.0063,
  worldHeelLiftEstimateMeters:.0063,
  originalSourceContactLocked:false};
 const adaptive={source:'verified-original-post-coupled-toe-hinge',
  toeRad:-.32,derivativeMetersPerRad:-.085,
  originalSourceContactLocked:false};
 const trial={...relief,toeRad:-.32,
  sourceCoupledHipKneeRelief:relief,
  sourceAdaptiveToeCandidate:adaptive,
  after:after(.055,-.001)};
 const approved={...owner,starter,sourceToeTrackVerified:true,
  sourceToeChainVerified:true,sourceToeSkinnedWeight:1};
 const safe=choose({...approved,trials:[trial]});
 assert.equal(safe?.source,'measured-original-skinned-coupled-knee-foot');
 assert.equal(safe?.sourceJointCount,4);
 assert.equal(safe?.sourceCoupledHipKneeRelief,relief);
 assert.equal(safe?.oppositeShoePreserved,true);
 assert.equal(safe?.contactLocked,false);
 assert.ok(safe.afterToeY<owner.floorTopY,
  'a still-buried synthetic toe may never be relabelled as planted');
 for(const bad of [
  {...trial,sourceCoupledHipKneeRelief:null},
  {...trial,sourceCoupledHipKneeRelief:{...relief,deltaRad:.05}},
  {...trial,sourceCoupledHipKneeRelief:{...relief,worldToeLiftEstimateMeters:.09}},
  {...trial,sourceCoupledHipKneeRelief:{...relief,originalSourceContactLocked:true}},
  {...trial,sourceCoupledHipKneeRelief:{...relief,upperRad:-.14}},
  {...trial,after:after(.055,.06)},
  {...trial,after:after(.055,-.001,{...right,toeY:right.toeY+.005})}
 ]) assert.equal(choose({...approved,trials:[bad]}),null,
  'unsafe lever, heel or supporting shoe must fail closed');
 for(const unsafe of [{sourceToeTrackVerified:false},
  {sourceToeSkinnedWeight:.85},{sourceChainVerified:false},
  {sourceBindVerified:false},{interrupted:true},
  {reducedMotion:true},{teleport:true},{sourceWeight:.8},
  {rootTravel:0},{frameInterval:.24}])
   assert.equal(choose({...approved,...unsafe,trials:[trial]}),null);
});


// Source rig crossfade is still mostly delivered in 60-120ms display windows.
// This specific fixture uses an independently bounded original-skin shoe shape
// and hypothetical post-probe deltas; it is not a claim of witnessed after video.
test('RED: bounded 100ms source Walking_A with heel-dominant swing samples a connected knee-foot counterpitch before abandoning the two-shoe evidence',async()=>{
 const {planOriginalSourceCoupledFootStarter:starterFn,
  planOriginalSourceCoupledKneeFootFollowups:followups,
  chooseOriginalSourceCoupledKneeFootSweep:choose,
  planOriginalSourceCoupledToeHingeFollowups:toePlanner}=await load();
 const slow={...owner,frameInterval:.1001,frameAge:.04,rootTravel:.055,
  starterTrials:[
   {upperRad:.12,lowerRad:-.09,after:after(-.010,-.025)},
   {upperRad:-.12,lowerRad:.09,after:after(.016,.028)}
  ]};
 const starter=starterFn(slow);
 assert.equal(starter?.source,'actual-original-source-three-joint-swing-opportunity');
 assert.equal(starter.sign,-1);
 assert.deepEqual(followups({...slow,starter}),[
  {upperRad:-.11,lowerRad:.11,footRad:.30},
  {upperRad:-.11,lowerRad:.11,footRad:.36}
 ],'use exactly two original connected source skinning trials, not another arbitrary hip twitch');
 const safe={upperRad:-.11,lowerRad:.11,footRad:.36,
  after:after(.033,.008)};
 const result=choose({...slow,starter,trials:[safe]});
 assert.equal(result?.source,'measured-original-skinned-coupled-knee-foot');
 assert.equal(result?.sourceJointCount,3);
 assert.equal(result?.oppositeShoePreserved,true);
 assert.equal(result?.contactLocked,false);
 assert.ok(result.afterToeY<slow.floorTopY,'an improved buried toe is not an invented planted sole');
 assert.equal(toePlanner({
  source:'same-original-GLB-skin-toes-hinge',sourceClipName:'Walking_A',
  sourceWeight:1,frameInterval:.1001
 }),null,'100ms connected candidates must not bypass the separately audited original toe-track gate');
 for(const interval of [.051,.121])
  assert.deepEqual(followups({...slow,frameInterval:interval,starter}),[
   {upperRad:-.11,lowerRad:.11,footRad:.18},
   {upperRad:-.11,lowerRad:.11,footRad:.24}
  ],'outside measured moderate window preserve legacy safe two-probe plan');
 for(const patch of [
  {frameInterval:.241},
  {rootTravel:0},{frameAge:.16},{sourceWeight:.94},
  {sourceClipName:'Idle'},{teleport:true},{reducedMotion:true},
  {interrupted:true},{sourceInstanceSame:false},
  {sourceFootTrackVerified:false},{sourceBindVerified:false}
 ])assert.equal(followups({...slow,...patch,starter}),null,
  'no extra source leg counterpitch outside the actual owner, frame and licensed bone contract: '+JSON.stringify(patch));
 assert.equal(choose({...slow,starter,trials:[{...safe,after:after(.033,.042)}]}),null,
  'rising heel faster than toe is not physically coherent');
 assert.equal(choose({...slow,starter,trials:[{...safe,
  after:after(.033,.008,{...right,toeY:right.toeY+.009})}]}),null,
  'loaded opposite skinned shoe must remain intact');
});


// RED-first genuine source-skin scenario: exact 390px original Walking_A,
// run #44233843203, native artifact #14397695861, tick 6.
// Original source frame: 133.3ms; right toe -89.440621mm, heel +211.497743mm,
// floor -20mm, root movement 47.824095mm. The same source 4-probe report
// measured -110/+110/+240mrad hip/knee/foot: toe +16.643084mm,
// elevated heel +13.808181mm, original opposite shoe unchanged.
// Actual global XZ positions were NOT provided in that nested probe receipt;
// the coordinates below are a geometry-matched synthetic 307mm outsole and
// explicitly NOT an original source-space readback or a planted-foot claim.
test('RED: exact licensed 133ms 390px swinging Vanguard three-joint sole gains pitch without admitting heel-dominant or unsupported motion',async()=>{
 const {planOriginalSourceCoupledFootStarter:starterFn,
  chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const buried={heelY:.21149774279081252,toeY:-.08944062143436118,
  heelXZ:[0,0],toeXZ:[.068,0]};
 const loaded={heelY:-.01591527465656707,toeY:-.026072674993528777,
  heelXZ:[1,0],toeXZ:[1.25,0]};
 const shoes={left:loaded,right:buried};
 const afterPair=(toeLift,heelLift,support=loaded)=>({
  right:{...buried,toeY:buried.toeY+toeLift,
   heelY:buried.heelY+heelLift,
   heelXZ:[.0074313182935574,0],
   toeXZ:[.068+.02279583640287625,0]},
  left:{...support}
 });
 const real={...owner,side:'right',before:shoes,
  frameInterval:.13329999999999842,frameAge:.03,
  rootTravel:.04782409489028368,
  starterTrials:[
   {upperRad:.12,lowerRad:-.09,
    after:afterPair(-.014041815524834286,-.03265289930634119)},
   {upperRad:-.12,lowerRad:.09,
    after:afterPair(.023592626784849968,.028981939169081455)}
  ]};
 const starter=starterFn(real);
 assert.equal(starter?.source,'actual-original-source-three-joint-swing-opportunity');
 assert.equal(starter?.sign,-1);
 const measured={upperRad:-.11,lowerRad:.11,footRad:.24,
  after:afterPair(.01664308413408004,.013808181211668963)};
 const actual=choose({...real,starter,trials:[measured]});
 assert.equal(actual?.source,'measured-original-skinned-coupled-knee-foot',
  'admit the measured source three-joint pitch only after independently certified original skinned shoes');
 assert.equal(actual?.sourceJointCount,3);
 assert.equal(actual?.contactLocked,false);
 assert.equal(actual?.oppositeShoePreserved,true);
 assert.ok(actual?.toeLiftMeters>=.016&&actual?.toeLiftMeters<.017);
 assert.ok(actual?.toeLiftMeters-actual?.sourceHeelRiseMeters>.0025,
  'heel-to-toe pitch improved in the source-skinned trial');
 assert.ok(actual?.afterToeY<real.floorTopY-.05,
  'the still deeply buried toe is NOT a planted foot');
 for(const invalid of [
  {frameInterval:.165},{frameInterval:.099},{rootTravel:0},
  {frameAge:.16},{sourceWeight:.9},{sourceInstanceSame:false},
  {sourceChainVerified:false},{sourceFootTrackVerified:false},
  {sourceBindVerified:false},{sourceAnatomicalFootAxisVerified:false},
  {ownerLocomotion:false},{alive:false},{visible:false},
  {teleport:true},{reducedMotion:true},{interrupted:true},
  {sourceClipName:'Idle'}
 ])assert.equal(choose({...real,...invalid,starter,trials:[measured]}),null,
  'no alternate owner, unverified source rig or different timing can borrow the recorded source pose: '+JSON.stringify(invalid));
 for(const invalid of [
  {...measured,footRad:.28},
  {...measured,after:afterPair(.01664,.0185)},
  {...measured,after:afterPair(.010,.005)},
  {...measured,after:afterPair(.01664,.0138,{...loaded,toeY:loaded.toeY+.005})},
  {...measured,after:afterPair(.01664,.0138,{...loaded,heelXZ:[1.01,0]})}
 ])assert.equal(choose({...real,starter,trials:[invalid]}),null,
  'source angle, pitch, minimum measured lift and actual opposite shoe remain strict');
 assert.equal(choose({...real,trials:[measured]}),null,
  'missing licensed starter may never produce a foot-pose correction');
});


// RED FIRST — second physically witnessed native 390px shoe at tick 8,
// Actions #44233843203 artifact #14397695861 (original player_swordsman.glb).
// 150ms measured skin probe, right toe at -99.102385mm and heel 199.072599mm;
// the original -110/+110/+240mrad three-joint trial lifted the still-buried
// toe 15.722129mm, heel 12.888112mm (pitch +2.834017mm), with no changed
// supporting shoe. These XZ offsets model the separately measured signed
// deltas; source foot coordinates were not emitted by this nested receipt.
// The example tests controller selection, NOT a certified planted foot or
// actual after-change pose. Original native WebGL must independently retest.
test('RED: second real 150ms source-skinned Vanguard gait may keep its measured safer hip-knee-foot pitch across consecutive original walking samples',async()=>{
 const {planOriginalSourceCoupledFootStarter:starterFn,
  chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const buried={heelY:.1990725988221172,toeY:-.09910238545436453,
  heelXZ:[0,0],toeXZ:[.06736912337861349,0]};
 const loaded={heelY:-.035933146809678185,
  toeY:-.03596639891380841,
  heelXZ:[1,0],toeXZ:[1.25,0]};
 const afterPair=(toeLift,heelLift,support=loaded)=>({
  right:{...buried,toeY:buried.toeY+toeLift,
   heelY:buried.heelY+heelLift,
   heelXZ:[.007156980118132039,0],
   toeXZ:[.06736912337861349+.021465058087637365,0]},
  left:{...support}
 });
 const source={...owner,side:'right',
  before:{left:loaded,right:buried},frameInterval:.14999999999999858,
  frameAge:.03,rootTravel:.04,starterTrials:[
   {upperRad:.12,lowerRad:-.09,
    after:afterPair(-.011228157020910401,-.03184780005077947)},
   {upperRad:-.12,lowerRad:.09,
    after:afterPair(.02078329607562064,.028289055074330216)}
  ]};
 const starter=starterFn(source);
 assert.equal(starter?.source,'actual-original-source-three-joint-swing-opportunity');
 assert.equal(starter?.sign,-1);
 const measured={upperRad:-.11,lowerRad:.11,footRad:.24,
  after:afterPair(.015722129495721132,.012888111720327555)};
 const safe=choose({...source,starter,trials:[measured]});
 assert.equal(safe?.source,'measured-original-skinned-coupled-knee-foot',
  'do not drop a second witnessed same-GLB heel-safe joint chain solely because the source frame took 150ms');
 assert.equal(safe?.sourceJointCount,3);
 assert.equal(safe?.oppositeShoePreserved,true);
 assert.equal(safe?.contactLocked,false);
 assert.ok(safe.toeLiftMeters>.0157&&safe.toeLiftMeters<.0158);
 assert.ok(safe.toeLiftMeters-safe.sourceHeelRiseMeters>.0028);
 assert.ok(safe.afterToeY<source.floorTopY-.06,
  'even this accepted candidate remains a deeply buried swing toe, NEVER certified contact');
 for(const bad of [
  {frameInterval:.13},{frameInterval:.17},{rootTravel:0},
  {frameAge:.16},{sourceWeight:.91},{sourceChainVerified:false},
  {sourceFootTrackVerified:false},{sourceBindVerified:false},
  {sourceAnatomicalFootAxisVerified:false},{ownerLocomotion:false},
  {alive:false},{reducedMotion:true},{teleport:true},{interrupted:true},
  {sourceClipName:'Idle'}
 ])assert.equal(choose({...source,...bad,starter,trials:[measured]}),null,
  'only original licensed moving rig and witnessed second source window can use this relief');
 for(const bad of [
  {...measured,footRad:.36},
  {...measured,after:afterPair(.01572,.0151)},
  {...measured,after:afterPair(.009,.002)},
  {...measured,after:afterPair(.015722,.012888,
   {...loaded,toeY:loaded.toeY+.008})}
 ])assert.equal(choose({...source,starter,trials:[bad]}),null,
  'reject heel-dominant swing, missing source toe gain, changed loaded shoe or angle');
});


// 18 Nov 2026 exact source-GLB WebGL #44248326551, mobile original
// Walking_A tick 8, 16.7ms, original player_swordsman 41-joint skeleton:
// true right toe=-86.793739mm, heel=+213.931391mm, stone top=-20mm.
// The REAL four both-shoe trials were:
// initial -90/+75mrad hip/knee: toe +17.452mm, heel +23.074mm (worse pitch);
// connected -110/+110mrad plus +340mrad foot: toe +16.391mm,
// heel +5.956mm (pitch improves 10.435mm), supporting shoe unchanged.
// Trial after still buries the toe 50.403mm. NO plant/IK/visible pass.
// Raw source XZ shift *magnitudes* are real (6.942mm/33.476mm);
// below anchors are expressly reconstructed to match source 306.363mm
// shoe length; do NOT present XZ as captured world-patch positions.
test('RED-first: real 16.7ms original 390px three-joint source pitch rescue is eligible only after two-shoe skin proof',async()=>{
 const {planOriginalSourceCoupledFootStarter:planStarter,
  chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const right={toeY:-.08679373932033976,heelY:.21393139128936753,
  heelXZ:[0,0],toeXZ:[.05850465751282023,0]};
 const left={heelY:-.013333799403240202,toeY:-.023269049880951482,
  heelXZ:[1,0],toeXZ:[1.27,0]};
 const after=(toeLift,heelRise,toeShift=0,heelShift=0,support=left)=>({
  right:{...right,toeY:right.toeY+toeLift,heelY:right.heelY+heelRise,
   heelXZ:[heelShift,0],toeXZ:[right.toeXZ[0]+toeShift,0]},
  left:{...support}
 });
 const fixture={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,sourceInstanceId:'source-vanguard-original',
  sourceChainVerified:true,sourceUpperTrackVerified:true,
  sourceLowerTrackVerified:true,sourceFootTrackVerified:true,
  sourceBindVerified:true,sourceAnatomicalFootAxisVerified:true,
  ownerLocomotion:true,alive:true,visible:true,teleport:false,
  reducedMotion:false,interrupted:false,previousLinkedCertified:false,
  rootTravel:.03903010841073806,frameAge:.06670000000000087,
  frameInterval:.01670000000000016,side:'right',floorTopY:-.02,
  before:{left,right},starterTrials:[
   {upperRad:.09,lowerRad:-.075,
    after:after(-.011672830917331359,-.02546005908684526)},
   {upperRad:-.09,lowerRad:.075,
    after:after(.017451502406568065,.02307390102883622)}
  ]};
 const starter=planStarter(fixture);
 assert.equal(starter?.sign,-1,
  'source GLB actual heel-dominant starter must be witnessed');
 assert.ok(Math.abs(starter.excessHeelRiseMeters-.005622398622268154)<1e-9);
 const selected={upperRad:-.11,lowerRad:.11,footRad:.34,
  after:after(.016391183796119813,.0059564415093493195,
   .033476051339980425,.00694196583952994)};
 const result=choose({...fixture,starter,trials:[selected]});
 assert.equal(result?.source,'measured-original-skinned-coupled-knee-foot');
 assert.equal(result?.contactLocked,false);
 assert.ok(result.afterToeY<fixture.floorTopY-.05,
  'source toe remains deeply buried: never mislabel as foot plant');
 assert.ok(result.toeLiftMeters-result.sourceHeelRiseMeters>.0104);
 // This exception is NOT a generic permission to accept all 16mm toe lifts.
 const worse={upperRad:-.11,lowerRad:.11,footRad:.28,
  after:after(.01590877294175093,.01059473611325118,
   .02475121987786443,.006632585046640077)};
 assert.equal(choose({...fixture,starter,trials:[worse]}),null);
 for(const unsafe of [
  {frameInterval:.0333},{frameInterval:.025},
  {sourceWeight:.8},{rootTravel:0},{frameAge:.18},
  {sourceInstanceSame:false},{sourceFootTrackVerified:false},
  {sourceBindVerified:false},{interrupted:true},{reducedMotion:true},
  {teleport:true},{alive:false},{mode:'hurt'},
  {sourceClipName:'Idle'}
 ]) assert.equal(choose({...fixture,...unsafe,starter,trials:[selected]}),null,
  'no stale, non-source or interrupted owner may use the GLB exception');
 assert.equal(choose({...fixture,starter,trials:[{
  ...selected,after:after(.016391183796119813,.020,
   .033476051339980425,.00694196583952994)
 }]}),null,'airborne heel dominance must not pass');
 assert.equal(choose({...fixture,starter,trials:[{
  ...selected,after:after(.016391183796119813,.0059564415093493195,
   .033476051339980425,.00694196583952994,
   {...left,toeY:left.toeY+.005})
 }]}),null,'loaded original source shoe may not be lifted');
 assert.equal(choose({...fixture,starter,trials:[{
  ...selected,footRad:.35
 }]}),null,'no guessed foot angle beyond measured source trial');
});


// Actual exact-head 18 Nov native desktop source proof:
// #44254353600, original player_swordsman.glb Walking_A, 100ms.
// Left swing toe -98.134181mm, heel +198.728072mm, floor -20mm.
// The fourth true both-shoe skin read at -110/+110/+360mrad recovered
// 17.415432mm toe while rising the airborne heel only 3.537226mm.
// Original source outsole XZ projection 71.386188mm, span 305.324721mm;
// original other shoe heel/toe -35.867/-34.734mm were unchanged.
// XZ anchors below are SYNTHETIC world translations respecting the original
// measured span and shift magnitudes; not claimed as video coordinates.
// No contact, source-clip retiming, joint invention or authority mutation.
test('RED-first: measured original 100ms desktop three-joint shoe pitch is accepted only with genuine two-shoe proof',async()=>{
 const {chooseOriginalSourceCoupledKneeFootSweep:choose}=await load();
 const left={toeY:-.09813418119412332,heelY:.19872807214704796,
  heelXZ:[0,0],toeXZ:[.07138618763484618,0]};
 const right={heelY:-.03586705961319439,toeY:-.03473372218494759,
  heelXZ:[1,0],toeXZ:[1.27,0]};
 const source={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,sourceChainVerified:true,
  sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
  sourceFootTrackVerified:true,sourceBindVerified:true,
  sourceAnatomicalFootAxisVerified:true,ownerLocomotion:true,
  alive:true,visible:true,reducedMotion:false,teleport:false,
  interrupted:false,rootTravel:.045,frameAge:.03,frameInterval:.10,
  side:'left',floorTopY:-.02,before:{left,right},
  starter:{source:'actual-original-source-three-joint-swing-opportunity',
   sign:-1,expectedSourceSkinnedTrials:2,contactLocked:false,
   excessHeelRiseMeters:.008573677549026965}};
 const measured={upperRad:-.11,lowerRad:.11,footRad:.36,
  after:{left:{...left,
   toeY:left.toeY+.01741543239946003,
   heelY:left.heelY+.0035372258834572845,
   heelXZ:[.006341764309567057,0],
   toeXZ:[left.toeXZ[0]+.03609917985814321,0]},
   right:{...right}}};
 const accepted=choose({...source,trials:[measured]});
 assert.equal(accepted?.source,'measured-original-skinned-coupled-knee-foot');
 assert.equal(accepted?.oppositeShoePreserved,true);
 assert.equal(accepted?.contactLocked,false);
 assert.ok(accepted.afterToeY<source.floorTopY-.06,
  'measured trial is still deeply buried; never report a plant');
 assert.ok(accepted.toeLiftMeters-accepted.sourceHeelRiseMeters>.013);
 // A bare heel-dominant twitch, source loss or different clip does not
 // acquire the authentic original 100ms pitch gate.
 for(const bad of [{sourceWeight:.8},{frameInterval:.30},
  {rootTravel:0},{frameAge:.16},{sourceChainVerified:false},
  {sourceFootTrackVerified:false},{sourceBindVerified:false},
  {sourceInstanceSame:false},{mode:'hurt'},{alive:false},
  {interrupted:true},{teleport:true},{reducedMotion:true},
  {ownerLocomotion:false}])
  assert.equal(choose({...source,...bad,trials:[measured]}),null);
 const worse={...measured,after:{...measured.after,
  left:{...measured.after.left,heelY:left.heelY+.019}}};
 assert.equal(choose({...source,trials:[worse]}),null,
  'airborne heel rising more than actual toe loses physical pitch');
 const movedLoaded={...measured,after:{...measured.after,
  right:{...right,toeY:right.toeY+.006}}};
 assert.equal(choose({...source,trials:[movedLoaded]}),null,
  'swing correction cannot lift the original supporting shoe');
 const wrongAngle={...measured,footRad:.43};
 assert.equal(choose({...source,trials:[wrongAngle]}),null,
  'reject unmeasured source foot angle');
});


// Genuine source window from original CC0 Walking_A 390px mobile WebGL
// Actions #44290560418, native sole/hand trace tick6:
// observed 66.7ms, left swing toe Y=-.11532459m, heel +.18262032m,
// opposite near-loaded heel Y=-.04125572m/toe=-.03472260m.
// Crucially, the trial shoe XZ and 12mm toe lift BELOW are a *synthetic*
// test hypothesis, NOT observed successful applied source-foot motion.
// This planner may only offer further angles for the ACTUAL GLB adapter
// to try and independently re-skin; an eligible offer is NOT foot IK.
test('RED: genuine 390px 66.7ms licensed linked-leg followup must remeasure both original shoes',async()=>{
 const {planOriginalSourceDeepSwingFootFollowups:follow}=await load();
 const left={heelY:.1826203152506556,toeY:-.11532459384370104,
  heelXZ:[-3.71,-6.95],toeXZ:[-3.75,-6.94]};
 const right={heelY:-.0412557182111836,toeY:-.03472259852533576,
  heelXZ:[-3.83,-7.11],toeXZ:[-4.09,-7.13]};
 const linkedProof={source:'measured-original-skinned-linked-leg',
  sourceClip:'Walking_A',sourceInstanceId:'source-clone-mobile-tick6',
  side:'left',contactLocked:false,oppositeShoePreserved:true,
  upperRad:-.12,lowerRad:.09};
 const measuredHypothesis={angleRad:-.12,axisKind:'original-clip-track',
  after:{left:{...left,toeY:left.toeY+.0125,heelY:left.heelY+.002,
   heelXZ:[left.heelXZ[0]+.002,left.heelXZ[1]],
   toeXZ:[left.toeXZ[0]+.007,left.toeXZ[1]]},right}};
 const source={mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,sourceInstanceId:'source-clone-mobile-tick6',
  sourceFootChainVerified:true,sourceFootTrackVerified:true,
  ownerLocomotion:true,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false,
  rootTravel:.02808118335357416,frameAge:.0333,
  frameInterval:.0667,side:'left',floorTopY:-.02,
  linkedProof,before:{left,right},trials:[measuredHypothesis,{
   ...measuredHypothesis,angleRad:.12,
   after:{left:{...left,toeY:left.toeY-.007},right}}]};
 assert.deepEqual(follow(source),[-.18,-.24],
  'offer two bounded source-bone followups only after a heel-safe linked source trial');
 // Preserve every authority/accessibility/bind/source and footwear gate.
 for(const bad of [
  {mode:'hurt'},{sourceClipName:'Idle'},{sourceWeight:.8},
  {sourceInstanceSame:false},{sourceFootChainVerified:false},
  {sourceFootTrackVerified:false},{ownerLocomotion:false},
  {alive:false},{visible:false},{teleport:true},
  {reducedMotion:true},{interrupted:true},{rootTravel:0},
  {frameAge:.2},{frameInterval:.0333},{frameInterval:.16},
  {linkedProof:{...linkedProof,sourceInstanceId:'other-source-clone'}},
  {linkedProof:{...linkedProof,oppositeShoePreserved:false}},
  {trials:[{...measuredHypothesis,after:{left:{
   ...measuredHypothesis.after.left,heelY:left.heelY+.011},right}}]},
  {trials:[{...measuredHypothesis,after:{left:
   measuredHypothesis.after.left,right:{...right,toeY:right.toeY+.006}}}]}
 ])assert.equal(follow({...source,...bad}),null,
   'no illegal action, stale source, unmeasured shoe or unsafe trial may earn a stronger hinge');
});

test('RED: a consecutively witnessed source-skinned hip-knee swing may earn connected foot followups without a fresh pop',async()=>{
 const {planOriginalSourceCoupledFootStarter:plan}=await load();
 // Actual source 33.3ms buried-toe / heel starter is the original
 // licensed desktop source fixture above. The PRIOR-frame receipt below
 // is a deliberately constructed strict contract witness, NOT a second
 // captured GLB frame or proof of a real foot plant.
 const prior={
  source:'measured-original-skinned-linked-leg',
  sourceClip:'Walking_A',sourceInstanceId:owner.sourceInstanceId,
  sourceUpperBone:'upperlegl',sourceLowerBone:'lowerlegl',
  side:'left',contactLocked:false,oppositeShoePreserved:true,
  finalIndependentSourceSkin:true,
  witnessedFrameIntervalSeconds:.0333,
  witnessedRootTravelMeters:.01929,witnessedSourceWeight:1,
  after:after(.020,.019)
 };
 const options={...owner,previousLinkedCertified:true,
  sourceUpperBone:'upperlegl',sourceLowerBone:'lowerlegl',
  previousLinkedOriginalProof:prior};
 const qualified=plan(options);
 assert.equal(qualified?.source,
  'actual-original-source-three-joint-swing-opportunity',
  'one consecutive already certified hip-knee source frame must not permanently starve the real connected ankle');
 assert.equal(qualified?.expectedSourceSkinnedTrials,2);
 assert.equal(qualified?.contactLocked,false);
 for(const corrupt of [
  {previousLinkedOriginalProof:null},
  {previousLinkedOriginalProof:{...prior,sourceInstanceId:'different-rig'}},
  {previousLinkedOriginalProof:{...prior,sourceClip:'Idle'}},
  {previousLinkedOriginalProof:{...prior,sourceUpperBone:'other'}},
  {previousLinkedOriginalProof:{...prior,finalIndependentSourceSkin:false}},
  {previousLinkedOriginalProof:{...prior,after:after(.075,.019)}},
  {previousLinkedOriginalProof:{...prior,linkedOriginalFootFinisher:{angleRad:-.12}}},
  {previousLinkedOriginalProof:{...prior,sourceCoupledKneeFootProof:{footRad:.24}}},
  {previousLinkedOriginalProof:{...prior,witnessedFrameIntervalSeconds:.3}},
  {frameInterval:.1001},
  {sourceWeight:.91},{interrupted:true},{reducedMotion:true},
  {sourceInstanceSame:false}
 ])assert.equal(plan({...options,...corrupt}),null,
  'stale, already ankle-owned, changed action, invalid skin or slow samples cannot inherit a previous pose: '+Object.keys(corrupt));
});
