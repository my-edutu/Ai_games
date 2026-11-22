'use strict';
/**
 * Session 03: licensed original GLB counterpitch cannot be called a footplant.
 * Fixture coordinates encode an intentionally deeply buried original source
 * outsole. Only native browser tests can verify actual source-skinned GLB
 * behavior. The bridge test RED-gates real renderer integration.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const controller=fs.readFileSync(path.resolve(__dirname,
 '../../public/ai-dungeon/full-body-animation-controller.js'),'utf8');
const renderer=fs.readFileSync(path.resolve(__dirname,
 '../../public/ai-dungeon/model-assets.js'),'utf8');
const source=import('data:text/javascript;base64,'+
 Buffer.from(controller).toString('base64'));
const shoe=(heelY,toeY)=>({
 heelY,toeY,heelXZ:[0,0],toeXZ:[.09,0]
});
const loaded=shoe(-.016,-.019);
const before={right:shoe(.245,-.085),left:loaded};
const owner={
 source:'verified-licensed-source-native-counterpitch',
 sourceRole:'vanguard',mode:'move',sourceClipName:'Walking_A',
 sourceClipDurationSeconds:1.0416666,sourceClipTimeSeconds:.15,
 sourceWeight:1,sourceInstanceSame:true,
 sourceOriginalUpperTrackVerified:true,sourceOriginalLowerTrackVerified:true,
 sourceOriginalFootTrackVerified:true,sourceOriginalBindVerified:true,
 sourceBoneChainVerified:true,sourceFootLocalXAxisVerified:true,
 ownerLocomotion:true,alive:true,visible:true,
 interrupted:false,teleport:false,reducedMotion:false,
 frameInterval:.0167,rootTravel:.038,frameAge:.02,
 side:'right',floorTopY:-.02,before,
 previousFootRad:0,previousSameSourceFrame:false
};
test('licensed six-role source planner admits only a bounded original walking chain',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan}=await source;
 const p=plan(owner);assert.ok(p,'verified source rig + actual lawful root motion');
 assert.ok(p.footRad<0&&p.footRad>=-.851);
 assert.ok(p.upperRad<0&&p.lowerRad>0);
 assert.equal(p.contactLocked,false);assert.equal(p.plantCertified,false);
 for(const sourceRole of ['revenant','warden','ranger','mystic','cultist'])
  assert.equal(plan({...owner,sourceRole})?.sourceRole,sourceRole);
});
test('source-owned guards fail closed on stale, wrong-clip or unwitnessed travel',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan}=await source;
 for(const change of [
  {mode:'hurt'},{sourceClipName:'Idle'},{rootTravel:0},
  {sourceOriginalBindVerified:false},{sourceFootLocalXAxisVerified:false},
  {frameInterval:2},{sourceWeight:.7},{teleport:true},
  {reducedMotion:true},{interrupted:true},{sourceInstanceSame:false},
  {previousFootRad:-.4,previousSameSourceFrame:false},
  {sourceClipTimeSeconds:.45},{before:{right:before.right,left:shoe(.25,.1)}}
 ])assert.equal(plan({...owner,...change}),null,JSON.stringify(change));
});
test('a documented original sole pitch improvement requires actual two-shoe re-skin',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan,
  certifyLicensedSourceSwingCounterpitch:certify}=await source;
 const p=plan(owner);assert.ok(p);
 const after={right:shoe(.225,-.080),left:loaded};
 const result=certify({plan:p,before,after,
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  side:'right',floorTopY:-.02});
 assert.ok(result);
 assert.ok(result.pitchImprovementMeters>.02);
 assert.equal(result.contactLocked,false);
 assert.equal(result.plantCertified,false);
 assert.ok(result.residualToeBurialMeters>.05,
  'this is still a buried toe, NEVER a planted foot');
});
test('heel lift, opposite-shoe displacement, and unverified final clip reject',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan,
  certifyLicensedSourceSwingCounterpitch:certify}=await source;
 const p=plan(owner);assert.ok(p);
 const args={plan:p,before,sourceInstanceSame:true,
  sourceClipName:'Walking_A',side:'right',floorTopY:-.02};
 assert.equal(certify({...args,after:{
  right:shoe(.258,-.07),left:loaded}}),null,'heel rises');
 assert.equal(certify({...args,after:{
  right:shoe(.225,-.080),left:shoe(-.008,-.012)}}),null,
  'support shoe moves');
 assert.equal(certify({...args,sourceClipName:'Idle',after:{
  right:shoe(.225,-.080),left:loaded}}),null,'wrong source clip');
});

test('sparse original walking frame is allowed only with fresh directly witnessed same-frame root movement',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan}=await source;
 const sparse={...owner,frameInterval:.38,rootTravel:.05,frameAge:.02};
 assert.equal(plan(sparse),null,'a sparse displayed gap cannot grant source motion');
 const candidate=plan({...sparse,sparseFrameVerified:true});
 assert.ok(candidate,'only verified fresh real root travel may open a bounded source-skinned trial');
 assert.ok(candidate.footRad<0&&candidate.footRad>=-.851);
 assert.equal(candidate.contactLocked,false);
 assert.equal(candidate.plantCertified,false);
 for(const bad of [
  {frameAge:.036},{rootTravel:.011},{frameInterval:.421},
  {sourceWeight:.75},{sourceClipName:'Idle'},{teleport:true},
  {ownerLocomotion:false},{reducedMotion:true}
 ])assert.equal(plan({...sparse,sparseFrameVerified:true,...bad}),null,
  'sparse witness rejected: '+JSON.stringify(bad));
 assert.match(renderer,/actor\.rigLastGroundedTravel/,
  'renderer must use current original root displacement, not a stale receipt');
 assert.match(renderer,/Math\.abs\(direct-travel\)<=\.001/,
  'sparse candidate must match direct travel to source stride evidence');
});
test('REAL original-pose renderer must invoke and rollback the certified counterpitch',()=>{
 assert.match(renderer,/planLicensedSourceSwingCounterpitch/,
  'required native source planner wired into model-assets');
 assert.match(renderer,/certifyLicensedSourceSwingCounterpitch/,
  'renderer independently certifies actual skinned two-shoe candidate');
 assert.match(renderer,/stageLicensedSourceSwingCounterpitchAfterMixer\(actor,reducedMotion\)/,
  'source mixer owner actually invokes the witnessed original-rig correction');
});


test('actual source toe-child finishing certificate improves the original linked three-joint shoe without claiming a plant',async()=>{
 const {certifyLicensedCounterpitchToeFinish:certify}=await source;
 assert.equal(typeof certify,'function');
 const left=shoe(.18505782723677852,-.026411240831095674);
 const right=shoe(.005642947798000755,-.013260510673651723);
 const afterCounterpitch={left,right};
 const proof={
  source:'measured-original-licensed-source-counterpitch',
  sourceClip:'Walking_A',side:'left',
  sourceInstanceId:'real-original-skeleton-instance',
  finalIndependentSourceSkin:true,originalOppositeShoeVerified:true,
  sourceOriginalRootTravelWitnessed:true,
  witnessedFrameIntervalSeconds:.1334,
  residualToeBurialMeters:.006411240831095674,
  contactLocked:false,plantCertified:false,after:afterCounterpitch
 };
 const base={proof,before:afterCounterpitch,side:'left',
  sourceInstanceId:'real-original-skeleton-instance',
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  sourceToeTrackVerified:true,sourceToeBoneParentVerified:true,
  angleRad:.12,floorTopY:-.02};
 const improved={left:shoe(.185,-.0219),right};
 const certificate=certify({...base,after:improved});
 assert.ok(certificate,'source toe-child hinge lifts a REAL still-buried toe');
 assert.ok(certificate.toeLiftMeters>=.004);
 assert.ok(certificate.residualToeBurialMeters<.002);
 assert.equal(certificate.plantCertified,false);
 assert.equal(certificate.contactLocked,false);
 for(const patch of [
  {sourceToeTrackVerified:false},
  {sourceToeBoneParentVerified:false},
  {sourceInstanceSame:false},
  {sourceClipName:'Idle'},
  {sourceInstanceId:'different skeleton'},
  {angleRad:.26},
  {proof:{...proof,residualToeBurialMeters:.051}},
  {proof:{...proof,witnessedFrameIntervalSeconds:.0167}},
  {before:{left:shoe(.200,-.0264),right}},
  {after:{left:shoe(.185,-.028),right}},
  {after:{left:shoe(.18,-.0219),right}},
  {after:{left:shoe(.185,-.009),right}},
  {after:{left:shoe(.185,-.0219),right:shoe(.013,-.0132)}}
 ])assert.equal(certify({...base,after:improved,...patch}),null,
  'unsafe or stale two-shoe source hinge denied: '+JSON.stringify(patch));
});

test('original licensed counterpitch owns optional true toes-child finisher AFTER both-shoe certification',()=>{
 assert.match(renderer,/certifyLicensedCounterpitchToeFinish/);
 assert.match(renderer,/stageLicensedSourceToeFinisherAfterCounterpitch\(actor,reducedMotion\)/);
 const sourceIndex=renderer.indexOf(' stageLicensedSourceSwingCounterpitchAfterMixer(actor,reducedMotion);');
 const toeIndex=renderer.indexOf(' stageLicensedSourceToeFinisherAfterCounterpitch(actor,reducedMotion);');
 const evidenceIndex=renderer.indexOf(' rememberOriginalSourceAppliedSwingEvidence(actor);');
 assert.ok(sourceIndex>=0&&sourceIndex<toeIndex&&toeIndex<evidenceIndex,
  'correct real stage ordering prevents a stale counterpitch sole receipt');
 assert.match(renderer,/actor\.originalSwingToeJointRestore\.push\(/,
  'toe child original local quaternion must be restored before imported mixer');
});


test('real 60Hz original counterpitch may finish its shallow buried toe at a rate-limited 50mrad',async()=>{
 const {certifyLicensedCounterpitchToeFinish:certify}=await source;
 const original={left:shoe(.190,-.027),right:shoe(-.016,-.019)};
 const proof={
  source:'measured-original-licensed-source-counterpitch',
  sourceClip:'Walking_A',side:'left',
  sourceInstanceId:'real-source-60hz-skeleton',
  finalIndependentSourceSkin:true,
  originalOppositeShoeVerified:true,
  sourceOriginalRootTravelWitnessed:true,
  witnessedFrameIntervalSeconds:.0167,
  residualToeBurialMeters:.007,
  contactLocked:false,plantCertified:false,after:original
 };
 const args={proof,before:original,side:'left',
  sourceInstanceId:'real-source-60hz-skeleton',
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  sourceToeTrackVerified:true,sourceToeBoneParentVerified:true,
  floorTopY:-.02,angleRad:.0501,
  after:{left:shoe(.1898,-.0235),right:original.right}};
 const result=certify(args);
 assert.ok(result,'the source-leg+toe hinge must not be unreachable at genuine 16.7ms');
 assert.ok(result.toeLiftMeters>=.003);
 assert.ok(result.residualToeBurialMeters>.003,
  '4mm remaining burial is an improvement, never a certified footplant');
 assert.equal(result.plantCertified,false);
 assert.equal(result.contactLocked,false);
 assert.equal(certify({...args,angleRad:.06}),null,
  '60mrad on 16.7ms exceeds native 3rad/s source-motion budget');
 assert.equal(certify({...args,angleRad:.009}),null,
  '9mrad must remain below meaningful sourced toe hinge threshold');
 // Native 60Hz frames stay eligible; the later 240–420ms source extension
 // must remain a separate, freshness-gated path, never a blanket increase.
 assert.match(renderer,
  /if\(!Number\.isFinite\(interval\)\|\|interval<\.008\|\|interval>\.420001\|\|/,
  'render bridge must admit legal 16.7ms post-counterpitch source frames');
 assert.match(renderer,
  /interval>\.240001&&!?\(/,
  'only the documented sparse continuation may exceed the ordinary 240ms gate');
 assert.match(renderer,/proof\.sparseFrameVerified===true/,
  'a sparse frame needs an explicit source-parent certificate');
 assert.match(renderer,/proof\.witnessedDirectFrameTravelMeters>=\.012/,
  'a sparse continuation needs a real root-travel witness');
 assert.match(renderer,/proof\.witnessedFrameAgeSeconds<=\.035/,
  'stale source frames must remain ineligible');
});

test('licensed full-leg 60Hz/30Hz counterpitch must obey its own actual angular-rate budget',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan,
  certifyLicensedSourceSwingCounterpitch:certify}=await source;
 // The previous genuine original Vanguard desktop receipt applied 150mrad
 // in 16.8ms (8.93 rad/s). A source-rig, full-leg overlay must not make
 // a one-frame angular snap while the toe child is limited to 3rad/s.
 const sixty=plan({...owner,frameInterval:.0168,rootTravel:.010155,frameAge:0});
 assert.ok(sixty,'genuine 16.8ms moving-root licensed source walking must remain eligible');
 assert.ok(Math.abs(sixty.footRad)<=3*.0168+1e-7,
  'native 60Hz three-bone correction must not jump 150mrad at once');
 assert.ok(Math.abs(sixty.upperRad)<.08&&Math.abs(sixty.lowerRad)<.08,
  'thigh and calf must participate rather than an isolated toe hinge');
 const thirty=plan({...owner,frameInterval:.0333,rootTravel:.01929,frameAge:0});
 assert.ok(thirty);
 assert.ok(Math.abs(thirty.footRad)<=3*.0333+1e-7,
  'real 30Hz source frame obeys the same 3rad/s bound');
 const sparse=plan({...owner,frameInterval:.3153,rootTravel:.05,frameAge:.02,
  sparseFrameVerified:true});
 assert.ok(sparse);
 assert.ok(Math.abs(sparse.footRad)<=3*.24+1e-7,
  'verified late frames do not borrow unlimited past angular budget');
 const small={right:shoe(.242,-.082),left:loaded};
 const native=certify({plan:sixty,before,after:small,
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  side:'right',floorTopY:-.02});
 assert.ok(native,'a 3mm toe/3mm heel physically measured improvement must remain legal at 60Hz');
 assert.equal(native.contactLocked,false);
 assert.equal(native.plantCertified,false);
 assert.equal(certify({plan:sixty,before,
  after:{right:shoe(.248,-.082),left:loaded},
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  side:'right',floorTopY:-.02}),null,
  'rate-limited correction still must never accept a rising swing heel');
});


test('RED: the SAME original Walking_A counterpitch must ease the outgoing swing within 3rad/s, not snap its source full-leg chain',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan}=await source;
 // Real prior ANGLE and anatomy are anchored in original 390px Vanguard
 // source tick9, Actions #44698474521 (source artifact #14612438535).
 // The nearby .300 -> .3167 clip phases and skinned shoe coordinates
 // below are a deliberately synthetic continuation fixture, NOT captured
 // source film or evidence of a contact/foot-plant. The source only
 // qualifies the trial; the live renderer must still re-skin BOTH shoes.
 const previousFootRad=-.22884615384615384;
 const realFrame=.0167;
 const input={...owner,sourceClipTimeSeconds:.3167,
  previousSameSourceFrame:true,previousFootRad,
  frameInterval:realFrame,rootTravel:.0101,frameAge:0};
 const held=plan(input);
 assert.ok(held,'authenticated same-source moving swing remains eligible');
 assert.ok(Math.abs(held.footRad-previousFootRad)<=3*realFrame+1e-7,
  'a genuine 60Hz frame may not discard >50.1mrad of previous original ankle correction');
 assert.ok(held.footRad>previousFootRad,
  'source outsole must move TOWARD original clip, never grow an unneeded tail correction');
 assert.ok(Math.abs(held.upperRad)<=.081&&Math.abs(held.lowerRad)<=.081,
  'authentic source hip and knee remain connected, not toe-only');
 assert.equal(held.contactLocked,false);
 assert.equal(held.plantCertified,false);
 const first=plan({...input,previousSameSourceFrame:false,previousFootRad:0});
 assert.ok(first);
 assert.ok(Math.abs(first.footRad)<=3*realFrame+1e-7,
  'without genuine prior same-clip evidence, do not borrow an existing correction');
 for(const change of [
  {sourceInstanceSame:false},{previousSameSourceFrame:false},
  {sourceClipName:'Idle'},{mode:'hurt'},
  {ownerLocomotion:false},{teleport:true},
  {reducedMotion:true},{interrupted:true},{sourceWeight:.7}
 ]){
  const altered=plan({...input,...change});
  if(change.previousSameSourceFrame===false)
   assert.equal(altered,null,'a nonzero previous correction cannot be inherited without source identity');
  else assert.equal(altered,null,'only the actual licensed moving source owns gradual release');
 }
});


test('RED: original Walking_A toe-down swing must unwind its remaining hip-knee-ankle correction at <=3rad/s through the licensed tail',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan}=await source;
 // Phases below are SYNTHETIC consecutive 60Hz continuation of the
 // original 1.0416666s GLB Walking_A right source swing; no invented
 // contact, root step, hit or observed after-footage is claimed.
 // Existing source evidence has already witnessed a -0.178rad legal
 // original ankle counterpitch at the end of this source swing lobe.
 let prior=-.178,expectedSamples=0;
 for(const phase of [.332,.3487,.3654]){
  const next=plan({...owner,sourceClipTimeSeconds:phase,
   frameInterval:.0167,rootTravel:.0101,frameAge:0,
   previousFootRad:prior,previousSameSourceFrame:true});
  assert.ok(next,'same-clip source-owned true tail must not snap back from '+prior+' at '+phase);
  assert.ok(next.footRad>prior,'the falling source swing returns toward the original pose');
  assert.ok(Math.abs(next.footRad-prior)<=3*.0167+1e-7,
   'every displayed full-leg recovery must respect the 3rad/s native source budget');
  assert.ok(next.upperRad<0&&next.lowerRad>0,
   'original hip, knee and ankle must remain connected, not an ankle twitch');
  assert.equal(next.contactLocked,false);
  assert.equal(next.plantCertified,false);
  prior=next.footRad;expectedSamples++;
 }
 assert.equal(expectedSamples,3);
 assert.ok(Math.abs(prior)<.03,'by the third source frame the old ankle correction almost settles');
 // A fourth frame may restore the original source pose once the remaining
 // angular change fits the legitimate frame budget.
 assert.equal(plan({...owner,sourceClipTimeSeconds:.3821,
  frameInterval:.0167,rootTravel:.0101,frameAge:0,
  previousFootRad:prior,previousSameSourceFrame:true}),null);
 for(const change of [
  {previousSameSourceFrame:false},{sourceInstanceSame:false},
  {sourceClipName:'Idle'},{mode:'hurt'},{ownerLocomotion:false},
  {rootTravel:0},{teleport:true},{reducedMotion:true},
  {sourceWeight:.7},{interrupted:true},
  {sourceClipTimeSeconds:.48},
  {previousFootRad:0}
 ]){
  assert.equal(plan({...owner,sourceClipTimeSeconds:.3487,
   frameInterval:.0167,rootTravel:.0101,frameAge:0,
   previousFootRad:-.1279,previousSameSourceFrame:true,...change}),null,
   'no borrowed prior correction on invalid source: '+JSON.stringify(change));
 }
});

test('RED: live original renderer offers the tail release only on the previous accepted same-rig source swing',()=>{
 assert.match(renderer,/phase\s*>=\s*\.335[^;]*prior\?\.right/s,
  'right-source tail needs the previous accepted original rig proof, not a new arbitrary pose');
 assert.match(renderer,/phase\s*>=\s*\.875[^;]*prior\?\.left/s,
  'left-source tail needs the previous accepted original rig proof, not a new arbitrary pose');
 assert.match(renderer,/const samePrevious=Boolean\(previous\?\.sourceInstanceId===asset\.uuid/s,
  'source-tail restoration must still use same original clone and lawful previous phase');
});


test('RED: a truly weighted original heel-and-toe landing may settle near stone without falsely claiming a planted foot',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan,
  certifyLicensedSourceSwingCounterpitch:certify}=await source;
 // Prospectively certified ORIGINAL joint/skin trial only: these readbacks
 // are constructed geometry contracts, NOT a captured GLB after-frame.
 // A source 315.3ms frame may legitimately spend <=.72rad of ankle motion.
 const stone=-.02;
 const original={right:shoe(.122,-.126),left:loaded};
 const candidate=plan({...owner,before:original,
  sourceClipTimeSeconds:.15,frameInterval:.3153,rootTravel:.05,
  sparseFrameVerified:true,frameAge:.02});
 assert.ok(candidate,'the original GLB swing is source/phase/root qualified');
 const safe={right:shoe(-.018,-.018),left:loaded};
 const args={plan:candidate,before:original,
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  side:'right',floorTopY:stone};
 const support=certify({...args,after:safe});
 assert.ok(support,'a source-skinned heel 2mm above stone cannot be prohibited by a 60mm heel-hover floor');
 assert.equal(support.contactLocked,false);
 assert.equal(support.plantCertified,false,
  'this predicate has no sustained world-sole evidence and is NOT foot-plant IK');
 assert.ok(support.toeLiftMeters>.10);
 assert.ok(support.heelDeltaMeters<-.13);
 for(const after of [
  {right:shoe(stone-.006,stone-.006),left:loaded},
  {right:shoe(stone+.002,stone-.014),left:loaded},
  {right:shoe(stone+.002,stone+.002),left:shoe(-.006,-.012)},
  {right:shoe(stone+.002,stone+.002),left:{...loaded,
   heelXZ:[.006,0]}}
 ]){
  assert.equal(certify({...args,after}),null,
   'near-contact may not bury an original shoe or disturb weighted support');
 }
});


test('RED: genuine 60Hz original source deep swing can evaluate toes-child skin without inventing foot contact',async()=>{
 const {certifyLicensedCounterpitchToeFinish:certify}=await source;
 // BEFORE is from genuine original GLTFLoader 390px source #44768341460,
 // Walking_A right at 0.089976s and a 16.7ms, 10.603mm root move.
 // AFTER below is deliberately SYNTHETIC candidate skin geometry; no claim
 // it was actually achieved by a toesr source-joint probe in Chromium.
 const left={
  heelY:-.020791387448650642,toeY:.010947189279311292,
  heelXZ:[1.161021624431399,-6.9568991922232],
  toeXZ:[.8926045685879036,-6.932549053789255]};
 const right={
  heelY:.18609646743739877,toeY:-.0900424119549105,
  heelXZ:[1.2902502711956132,-7.1157095857401895],
  toeXZ:[1.1773153481378076,-7.133252744937796]};
 const before={left,right};
 const proof={
  source:'measured-original-licensed-source-counterpitch',
  sourceClip:'Walking_A',sourceClipTimeSeconds:.08997601324106551,
  side:'right',sourceInstanceId:'genuine-390px-original-clone',
  finalIndependentSourceSkin:true,originalOppositeShoeVerified:true,
  sourceOriginalRootTravelWitnessed:true,
  witnessedFrameIntervalSeconds:.0167,
  witnessedRootTravelMeters:.010602788045345202,
  witnessedDirectFrameTravelMeters:.010602788045345202,
  witnessedFrameAgeSeconds:0,
  residualToeBurialMeters:.0700424119549105,
  contactLocked:false,plantCertified:false,after:before};
 const args={proof,before,side:'right',
  sourceInstanceId:proof.sourceInstanceId,sourceInstanceSame:true,
  sourceClipName:'Walking_A',sourceToeTrackVerified:true,
  sourceToeBoneParentVerified:true,angleRad:.05009,floorTopY:-.02};
 const after={left,right:{...right,heelY:right.heelY-.0015,
  toeY:right.toeY+.0035,toeXZ:[right.toeXZ[0]-.001,right.toeXZ[1]]}};
 const trial=certify({...args,after});
 assert.ok(trial,'only independently re-skinned source toe/heel and unchanged other shoe can admit deep swing relief');
 assert.equal(trial.sourceDeepSwingToeRelief,true);
 assert.ok(trial.toeLiftMeters>=.003&&trial.toeLiftMeters<=.008);
 assert.ok(trial.residualToeBurialMeters>.055,
  'a small source-toe motion must not falsely classify a buried foot as planted');
 assert.equal(trial.plantCertified,false);
 assert.equal(trial.contactLocked,false);
 const blocked=[
  {proof:{...proof,sourceClipTimeSeconds:.45}},
  {proof:{...proof,witnessedFrameIntervalSeconds:.25}},
  {proof:{...proof,witnessedRootTravelMeters:0}},
  {proof:{...proof,witnessedDirectFrameTravelMeters:0}},
  {proof:{...proof,witnessedFrameAgeSeconds:.08}},
  {proof:{...proof,residualToeBurialMeters:.11,
    after:{left,right:{...right,toeY:-.13}}}},
  {sourceToeBoneParentVerified:false},
  {sourceToeTrackVerified:false},
  {sourceClipName:'Idle'},
  {after:{left,right:{...after.right,heelY:right.heelY+.004}}},
  {after:{left:{...left,toeY:left.toeY+.003},right:after.right}},
  {after:{left,right:{...after.right,toeY:right.toeY+.001}}},
  {angleRad:.12}
 ];
 for(const change of blocked)
  assert.equal(certify({...args,after,...change}),null,
   'deep source toe candidate must be denied when evidence is invalid: '+JSON.stringify(change));
});


// Genuine 390px original weighted-sole BEFORE from #44768341460; the
// proposed six-millimetre AFTER is deliberately SYNTHETIC and must still
// be independently proven by the real same-clone GLB skin in Chromium.
// A 200ms rendered frame carrying a fresh authoritative root displacement
// is not a licence to exceed 3rad/s, forge contact, or consume stale poses.
test('RED: measured 200ms Walking_A sparse window may try a rate-bounded original toe child without false footplant',async()=>{
 const {certifyLicensedCounterpitchToeFinish:certify}=await source;
 const original={
  left:{heelY:-.020791387448650642,toeY:.010947189279311292,
   heelXZ:[1.161021624431399,-6.9568991922232],
   toeXZ:[.8926045685879036,-6.932549053789255]},
  right:{heelY:.18609646743739877,toeY:-.0900424119549105,
   heelXZ:[1.2902502711956132,-7.1157095857401895],
   toeXZ:[1.1773153481378076,-7.133252744937796]}
 };
 const sourceId='real-390-original-before-synthetic-after';
 const proof={
  source:'measured-original-licensed-source-counterpitch',
  sourceClip:'Walking_A',sourceClipTimeSeconds:.08997601324106551,
  side:'right',sourceInstanceId:sourceId,
  finalIndependentSourceSkin:true,originalOppositeShoeVerified:true,
  sourceOriginalRootTravelWitnessed:true,
  witnessedFrameIntervalSeconds:.20,
  witnessedRootTravelMeters:.042,
  witnessedDirectFrameTravelMeters:.042,
  witnessedFrameAgeSeconds:0,
  residualToeBurialMeters:.0700424119549105,
  contactLocked:false,plantCertified:false,after:original
 };
 const after={...original,right:{...original.right,
  heelY:original.right.heelY-.001,
  toeY:original.right.toeY+.0065}};
 const inputs={proof,before:original,after,side:'right',
  sourceInstanceId:sourceId,sourceInstanceSame:true,
  sourceClipName:'Walking_A',sourceToeTrackVerified:true,
  sourceToeBoneParentVerified:true,angleRad:.12,floorTopY:-.02};
 const accepted=certify(inputs);
 assert.ok(accepted,'verified direct travel in a 200ms source frame should permit a bounded original-toes-child experiment');
 assert.equal(accepted.sourceDeepSwingToeRelief,true);
 assert.ok(Math.abs(accepted.toeLiftMeters-.0065)<1e-8);
 assert.ok(accepted.residualToeBurialMeters>.06,
  'partial measured trial must never be promoted into a planted foot');
 assert.equal(accepted.contactLocked,false);
 assert.equal(accepted.plantCertified,false);
 for(const invalid of [
  {proof:{...proof,witnessedFrameIntervalSeconds:.25}},
  {proof:{...proof,witnessedDirectFrameTravelMeters:0}},
  {proof:{...proof,witnessedRootTravelMeters:0}},
  {proof:{...proof,witnessedFrameAgeSeconds:.1}},
  {proof:{...proof,sourceClipTimeSeconds:.45}},
  {sourceInstanceSame:false},
  {sourceInstanceId:'different-clone'},
  {sourceClipName:'Idle'},
  {sourceToeTrackVerified:false},
  {sourceToeBoneParentVerified:false},
  {after:{...after,left:{...original.left,toeY:original.left.toeY+.004}}},
  {angleRad:.61},
  {after:{...after,right:{...after.right,toeY:original.right.toeY+.0121}}}
 ])assert.equal(certify({...inputs,...invalid}),null,
   'sparse source toe-child must reject stale root, wrong clip/bone, unsafe angle or skinned shoe');
 // Both the pure certificate and actual source renderer must allow the
 // exact same supported sparse interval: a planner-only change is inert.
 const renderer=fs.readFileSync(path.resolve(__dirname,
  '../../public/ai-dungeon/model-assets.js'),'utf8');
 const stage=renderer.slice(renderer.indexOf('function stageLicensedSourceToeFinisherAfterCounterpitch('),
  renderer.indexOf('function stageLicensedSourceToeFinisherAfterCounterpitch(')+6500);
 assert.match(stage,/proof\.witnessedFrameIntervalSeconds<=\.24&&/,
  'live original GLB toe finisher must independently audit current sparse direct travel');
});

// Genuine ORIGINAL 390px source skin at ae75 native f75 (21 Nov): right
// heel 183.694mm ABOVE stone; toe 75.085mm BELOW stone after the actual
// imported hip->knee->foot chain. Another original source toesl child at
// f69 produced 10.918mm true skinned lift, so the former 8mm hard ceiling
// can reject physically attainable, still-buried SAFE partial swing relief.
// The AFTER shoe below is SYNTHETIC; native WebGL must separately witness it.
test('RED: source-skinned deep swing can certify up to 11mm legal toe relief without false plant',async()=>{
 const {certifyLicensedCounterpitchToeFinish:certify}=await source;
 const id='original-390px-real-f75-synthetic-toe-after';
 const left={heelY:-.03294593314934879,toeY:-.010736327091934665,
  heelXZ:[-1.814949141131763,-6.957308485021304],
  toeXZ:[-2.0841192719364727,-6.9319577865527195]};
 const right={heelY:.18369441614067894,toeY:-.09508462480972439,
  heelXZ:[-1.7071563608055793,-7.107854929982336],
  toeXZ:[-1.8148420399622596,-7.136212214712062]};
 const before={left,right};
 const proof={source:'measured-original-licensed-source-counterpitch',
  sourceClip:'Walking_A',side:'right',sourceInstanceId:id,
  sourceClipTimeSeconds:.09851460877195402,
  finalIndependentSourceSkin:true,originalOppositeShoeVerified:true,
  sourceOriginalRootTravelWitnessed:true,
  witnessedFrameIntervalSeconds:.0333,
  witnessedRootTravelMeters:.019291663189031638,
  witnessedDirectFrameTravelMeters:.019291663189031638,
  witnessedFrameAgeSeconds:0,
  residualToeBurialMeters:.07508462480972439,
  contactLocked:false,plantCertified:false,after:before};
 const after={left,right:{...right,toeY:right.toeY+.0109}};
 const args={proof,before,after,side:'right',sourceInstanceId:id,
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  sourceToeTrackVerified:true,sourceToeBoneParentVerified:true,
  angleRad:-.0999,floorTopY:-.02};
 const safe=certify(args);
 assert.ok(safe,'real source angular rate and both weighted shoes permit 10.9mm partial relief');
 assert.ok(Math.abs(safe.toeLiftMeters-.0109)<1e-8);
 assert.ok(safe.residualToeBurialMeters>.06);
 assert.equal(safe.contactLocked,false);
 assert.equal(safe.plantCertified,false);
 for(const unsafe of [
  {after:{left,right:{...right,toeY:right.toeY+.0121}}},
  {after:{left,right:{...right,toeY:right.toeY+.0109,heelY:right.heelY+.003}}},
  {after:{left:{...left,toeY:left.toeY+.003},right:after.right}},
  {angleRad:-.103},{proof:{...proof,witnessedDirectFrameTravelMeters:0}},
  {proof:{...proof,sourceInstanceId:'other-original-rig'}},
  {proof:{...proof,witnessedFrameIntervalSeconds:.25}}
 ])assert.equal(certify({...args,...unsafe}),null,
  'source toe relief must remain bounded, real-skinned and non-contact');
});

test('RED-first: real 390px licensed toesl hinge can grow across one authenticated 60Hz Walking_A source pair without an angular snap',async()=>{
 const {planLicensedSourceToeChildContinuityCandidates:plan}=await source;
 assert.equal(typeof plan,'function',
  'the original weighted toe must carry a measured, source-owned angular trajectory instead of restarting +/-50mrad every frame');
 // Previous REAL original-GLB 390px frame114 (Actions #44797892247):
 // source time .61537359; original toesl -50.1mrad, final independently
 // skinned left toe still 76.573mm buried, opposite source shoe unchanged.
 // NEXT source frame below is a SYNTHETIC 16.7ms continuation fixture;
 // this test does NOT claim the next source frame was recorded or certified.
 const previous={
  source:'measured-original-licensed-source-counterpitch',
  sourceInstanceId:'same-original-41-joint-source-clone',
  sourceClip:'Walking_A',side:'left',
  sourceClipTimeSeconds:.6153735947028551,
  finalIndependentSourceSkin:true,originalOppositeShoeVerified:true,
  witnessedFrameIntervalSeconds:.0167,
  witnessedRootTravelMeters:.011576899920719752,
  contactLocked:false,plantCertified:false,
  licensedOriginalToeChildFinisher:{
   source:'measured-licensed-counterpitch-original-toes-child',
   side:'left',angleRad:-.0501,sourceBone:'toesl',
   sourceTrack:'toesl.quaternion',
   finalIndependentSourceSkin:true,
   originalOppositeShoeVerified:true,
   sourceToeTrackVerified:true,
   contactLocked:false,plantCertified:false
  }
 };
 const owner={
  sourceInstanceId:previous.sourceInstanceId,
  sourceClipName:'Walking_A',sourceClipTimeSeconds:.6323735947028551,
  sourceClipDurationSeconds:1.0416666,sourceWeight:1,
  sourceToeBoneName:'toesl',sourceToeTrackName:'toesl.quaternion',
  side:'left',frameInterval:.0167,
  ownerLocomotion:true,alive:true,visible:true,
  interrupted:false,teleport:false,reducedMotion:false,
  previous
 };
 const next=plan(owner);
 assert.ok(next,'live source clip and prior independently skinned toe hinge');
 assert.equal(next.length,2,'stay at TWO original weighted-skinned probes');
 assert.ok(Math.abs(next[0]+.0501)<1e-7);
 assert.ok(Math.abs(next[1]+.1002)<1e-7);
 assert.ok(next.every(x=>Math.abs(x-previous.licensedOriginalToeChildFinisher.angleRad)<=3*owner.frameInterval+1e-7),
  'genuine displayed frame allows no more than 3rad/s from the last measured source child');
 const first=plan({...owner,previous:null});
 assert.ok(Math.abs(first[0]+.0501)<1e-7&&Math.abs(first[1]-.0501)<1e-7,
  'no previous receipt means the original conservative +/- budget, not a borrowed pose');
 for(const patch of [
  {sourceClipName:'Idle'},{sourceWeight:.7},{sourceInstanceId:'other-clone'},
  {ownerLocomotion:false},{alive:false},{visible:false},{interrupted:true},
  {teleport:true},{reducedMotion:true},{frameInterval:1},
  {sourceToeTrackName:'spine.quaternion'},{sourceToeBoneName:'toesr'}
 ])assert.equal(plan({...owner,...patch}),null,
  'no source continuity nor speculative toe hinge on a false owner: '+JSON.stringify(patch));
 assert.equal(plan({...owner,previous:{...previous,sourceInstanceId:'other-clone'}}),null,
  'a previous original GLB clone must never authorize a fresh instance toe articulation');
 assert.equal(plan({...owner,previous:{...previous,sourceInstanceId:undefined}}),null,
  'a missing previous source identity cannot silently re-prime the child joint');
 for(const previousPatch of [
  {sourceClip:'Idle'},
  {side:'right'},{sourceClipTimeSeconds:.20},
  {finalIndependentSourceSkin:false},
  {originalOppositeShoeVerified:false},
  {licensedOriginalToeChildFinisher:{
   ...previous.licensedOriginalToeChildFinisher,angleRad:.20}},
  {licensedOriginalToeChildFinisher:{
   ...previous.licensedOriginalToeChildFinisher,sourceBone:'toesr'}},
  {licensedOriginalToeChildFinisher:{
   ...previous.licensedOriginalToeChildFinisher,finalIndependentSourceSkin:false}}
 ]){
  const fallback=plan({...owner,previous:{...previous,...previousPatch}});
  assert.ok(fallback&&Math.abs(fallback[0]+.0501)<1e-7&&
   Math.abs(fallback[1]-.0501)<1e-7,
   'a stale/fake prior receipt cannot contribute angle to current source pose');
 }
 assert.match(renderer,/planLicensedSourceToeChildContinuityCandidates/,
  'real GLTFLoader toes child must consume the source-certified continuity plan');
 assert.match(renderer,/sourceLicensedCounterpitchPreviousFrame/,
  'the next authenticated original frame must read only its IMMEDIATE prior frame');
});


test('certify an original full-leg toes-child angular continuation ONLY from the last licensed weighted two-shoe readback',async()=>{
 const {certifyLicensedCounterpitchToeFinish:certify}=await source;
 const id='exact-original-41-joint-clone',support=shoe(-.018,-.018);
 const swing=shoe(.186,-.090),before={left:support,right:swing};
 const proof={source:'measured-original-licensed-source-counterpitch',
  sourceInstanceId:id,side:'right',sourceClip:'Walking_A',
  sourceClipTimeSeconds:.089976,finalIndependentSourceSkin:true,
  originalOppositeShoeVerified:true,sourceOriginalRootTravelWitnessed:true,
  contactLocked:false,plantCertified:false,
  witnessedFrameIntervalSeconds:.0167,
  witnessedRootTravelMeters:.0106,
  witnessedDirectFrameTravelMeters:.0106,
  witnessedFrameAgeSeconds:0,residualToeBurialMeters:.070,after:before};
 const previous={...proof,sourceClipTimeSeconds:.072976,
  witnessedRootTravelMeters:.011,
  licensedOriginalToeChildFinisher:{
   source:'measured-licensed-counterpitch-original-toes-child',
   angleRad:-.0501,sourceBone:'toesr',sourceTrack:'toesr.quaternion',
   side:'right',sourceToeTrackVerified:true,
   finalIndependentSourceSkin:true,originalOppositeShoeVerified:true,
   contactLocked:false,plantCertified:false
  }};
 const originalToeContinuity={
  sourceInstanceId:id,sourceClipName:'Walking_A',
  sourceClipTimeSeconds:.089976,sourceClipDurationSeconds:1.0416666,
  sourceWeight:1,sourceToeBoneName:'toesr',
  sourceToeTrackName:'toesr.quaternion',side:'right',
  frameInterval:.0167,ownerLocomotion:true,alive:true,visible:true,
  interrupted:false,teleport:false,reducedMotion:false,previous};
 const args={proof,before,side:'right',sourceInstanceId:id,
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  sourceToeTrackVerified:true,sourceToeBoneParentVerified:true,
  floorTopY:-.02,angleRad:-.1002};
 // AFTER deliberately synthesized to exercise the strict existing source
 // two-shoe certificate. This is NOT an asserted new GLB recording.
 const after={left:support,right:{...swing,
  heelY:.185,toeY:-.084,toeXZ:[.089,0]}};
 const verified=certify({...args,after,originalToeContinuity});
 assert.ok(verified,'a real prior -50.1mrad native toe may advance another <=50.1mrad');
 assert.equal(verified.plantCertified,false);
 assert.equal(verified.contactLocked,false);
 for(const patch of [
  {originalToeContinuity:null},
  {originalToeContinuity:{...originalToeContinuity,
   sourceInstanceId:'other-source-clone'}},
  {originalToeContinuity:{...originalToeContinuity,sourceClipName:'Idle'}},
  {originalToeContinuity:{...originalToeContinuity,
   previous:{...previous,licensedOriginalToeChildFinisher:{
    ...previous.licensedOriginalToeChildFinisher,sourceTrack:'spine.quaternion'}}}},
  {angleRad:+.1002},{angleRad:-.12},
  {after:{left:{...support,toeY:-.011},right:after.right}}
 ])assert.equal(certify({...args,after,originalToeContinuity,...patch}),null,
  'cannot borrow a stale clip/rig/toe track or skip native angular-rate and opposite-shoe proof');
});

 
// 20 Nov 2026 genuine original GLB source witnesses at SHA 76c4a53b:
// 1440px desktop Walking_A f55: 10.097mm lawful root travel / 16.7ms,
// final original right toe 52.145mm beneath stone after existing source chain.
// 390px mobile f100: 19.345mm / 33.4ms, original left toe still
// 87.123mm buried. These are NOT fabricated AFTER comparison frames.
test('RED: original licensed hip-knee-ankle swing offers TWO rate-bounded connected source-joint poses, not an isolated ankle twitch',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan,
  planLicensedSourceConnectedChainTrials:trials}=await source;
 assert.equal(typeof trials,'function');
 for(const window of [
  {...owner,frameInterval:.0167,rootTravel:.010097,frameAge:0},
  {...owner,sourceClipTimeSeconds:.625,side:'left',
   frameInterval:.0334,rootTravel:.019345,frameAge:0,
   before:{left:shoe(.176199,-.110027),right:shoe(-.041817,-.007690)}}
 ]){
  const proposed=plan(window);
  assert.ok(proposed,'original verified source rig + genuine root window');
  const args={plan:proposed,frameInterval:window.frameInterval,
   sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
   sourceFootTrackVerified:true,sourceBindVerified:true};
  const candidates=trials(args);
  assert.equal(candidates?.length,2,'two original 41-joint linked poses only');
  assert.deepEqual(candidates[0],{
   upperRad:proposed.upperRad,lowerRad:proposed.lowerRad,footRad:proposed.footRad
  },'existing valid candidate must be preserved as safe baseline');
  const physical=candidates[1],cap=3*Math.min(window.frameInterval,.24);
  assert.ok(physical.upperRad<proposed.upperRad,
   'true source upper leg should support the loaded hip-to-knee chain');
  assert.ok(physical.lowerRad>proposed.lowerRad,
   'original knee bends with hip and supported foot, not alone');
  assert.equal(physical.footRad,proposed.footRad,
   'preserve the licensed original foot pose and full clip retiming');
  for(const rad of [physical.upperRad,physical.lowerRad,physical.footRad])
   assert.ok(Math.abs(rad)<=cap+1e-8,
    'every true original joint is independently limited to 3rad/s');
  for(const invalid of [
   {sourceUpperTrackVerified:false},{sourceLowerTrackVerified:false},
   {sourceFootTrackVerified:false},{sourceBindVerified:false},
   {frameInterval:.001},{frameInterval:.421},
   {plan:{...proposed,sourceClip:'Idle'}},
   {plan:{...proposed,sourceOriginalRootTravelWitnessed:false}},
   {plan:{...proposed,sourceActualClipPhaseVerified:false}},
   {plan:{...proposed,originalSourceBoneChainVerified:false}},
   {plan:{...proposed,plantCertified:true}},
   {plan:{...proposed,footRad:-.8}},
  ])assert.equal(trials({...args,...invalid}),null,
   'no fabricated pose from wrong source, bone, clip, rate or authority');
 }
});
test('RED: renderer selects only after BOTH genuine connected-leg source-skin trials and independent final dual-shoe readback',()=>{
 assert.match(renderer,/planLicensedSourceConnectedChainTrials\(/,
  'real GLTFLoader 41-joint upper/lower/foot chain must run connected candidate plan');
 const live=renderer.slice(renderer.indexOf('function stageLicensedSourceSwingCounterpitchAfterMixer('),
  renderer.indexOf('function stageLicensedSourceToeFinisherAfterCounterpitch('));
 assert.match(live,/for\(const trial of connectedTrials\)/,
  'source leg candidates must be physically trial-skinned in bounded loop');
 assert.match(live,/certifyLicensedSourceSwingCounterpitch\(/,
  'both connected poses must satisfy real two-shoe physical certificate');
 assert.match(live,/const final=read\(\)/,
  'winning original source pose must be independently re-skinned');
 assert.match(live,/mounts\.forEach\(\(m,i\)=>m\.last\.multiply\(deltas\[i\]\)\)/,
  'only accepted full-body source joints may persist as reversible overlays');
});

 
// 20 Nov 2026: independent ORIGINAL pinned KayKit/Vanguard 41-joint GLB
// Walking_A sampling (source inverse binds + true weighted heel/toe mesh).
// The following first-order source joint derivatives are in METRES/RADIAN.
// They are analytical rig evidence, NOT a live final GLB skinning certificate.
// A candidate must still survive the renderer's actual two-shoe re-skin.
// Previous linked -.80/+ .55 upper/knee shares buried the toe more deeply
// than the conservative source chain in BOTH original 60Hz/30Hz windows.
test('source-native ankle, hip and knee Jacobian contract preserves legal toe relief',async()=>{
 const {planLicensedSourceSwingCounterpitch:plan,
  planLicensedSourceConnectedChainTrials:trials}=await source;
 const windows=[
  {phase:.089479,side:'right',interval:.0167,
   heel:{upper:.1828,lower:.1882,foot:.0812},
   toe:{upper:.0594,lower:.0648,foot:-.0310},
   minimumGain:.00080},
  {phase:.619348,side:'left',interval:.0333,
   heel:{upper:.1722,lower:.1861,foot:.0785},
   toe:{upper:.0663,lower:.0801,foot:-.0160},
   minimumGain:.00150}
 ];
 for(const w of windows){
  const base={...owner,sourceClipTimeSeconds:w.phase,side:w.side,
   frameInterval:w.interval,frameAge:0,rootTravel:w.side==='right'?.0101:.0193,
   before:w.side==='right'?before:
    {left:shoe(.247,-.063),right:loaded}};
  const planned=plan(base);
  assert.ok(planned,'authentic source phase and legal root travel');
  const choices=trials({plan:planned,frameInterval:w.interval,
   sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
   sourceFootTrackVerified:true,sourceBindVerified:true});
  assert.equal(choices?.length,2,'no extra runtime skinned probes');
  const projected=(angles,derivative)=>
   angles.upperRad*derivative.upper+
   angles.lowerRad*derivative.lower+
   angles.footRad*derivative.foot;
  const safe=choices[0],candidate=choices[1];
  const oldToe=projected(safe,w.toe),nextToe=projected(candidate,w.toe);
  const nextHeel=projected(candidate,w.heel);
  assert.ok(nextToe-oldToe>w.minimumGain,
   'the alternative MUST improve source forefoot rise over the original conservative chain');
  assert.ok(nextHeel<-.0008,
   'the source swing heel still descends instead of being kicked upward');
  assert.ok(nextToe-nextHeel>=.003,
   'the original outsole still becomes more level (>=3mm pitch gain)');
  assert.ok(candidate.lowerRad>Math.abs(candidate.upperRad),
   'true sourced knee progression must exceed opposing upper-leg motion');
  for(const a of [candidate.upperRad,candidate.lowerRad,candidate.footRad])
   assert.ok(Math.abs(a)<=3*w.interval+1e-8,
    'real source-chain 3rad/s cap applies to EVERY joint');
 }
 const p=plan({...owner,sourceRole:'ranger',
  sourceClipTimeSeconds:.089479,frameInterval:.0167,rootTravel:.0101,frameAge:0});
 const ranger=trials({plan:p,frameInterval:.0167,
  sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
  sourceFootTrackVerified:true,sourceBindVerified:true});
 assert.ok(ranger?.length===2);
 assert.ok(ranger[1].lowerRad<Math.abs(ranger[1].upperRad),
  'Vanguard source Jacobian must NOT silently alter Ranger or the other five rigs');
});


/**
 * Genuine original 1440px WebGL Vanguard Walking_A frame 14,
 * exact PR #72 source SHA 5a1ee6d2e500, Actions #44857237417
 * (dungeon-full-body-continuous-desktop.json). Original source first
 * three-joint upperleg/lowerleg/foot candidate, followed by the actual
 * original toesr source-child, won its independent two-shoe skin receipt.
 * Its sourceConnectedLegSelected:false distinguishes the FIRST candidate
 * from the extra knee-biased trial; it does NOT mean no original source
 * chain is selected. LEFT loaded heel is 27.689mm below stone, toe 4.100mm
 * above stone. A bounded Y-only correction is justified by both actual
 * weighted soles; final renderer must STILL re-skin and accept or rollback.
 */
test('RED: actual original first 3-joint Walking_A source chain can transfer a verified loaded heel/toe shoe to FINAL pelvis',async()=>{
 const {certifyLicensedSourcePostChainPelvisOpportunity:certify,
  planOriginalSourceLoadedPelvisSupport:plan,
  verifyOriginalSourceLoadedPelvisFootWitness:verify}=await source;
 const soles={
  left:{heelY:-.047688567396312165,toeY:-.015900297245255192,
   heelXZ:[2.1660061681492224,-6.958763763617431],
   toeXZ:[1.897682341682455,-6.933530920492183]},
  right:{heelY:.1645851894114908,toeY:-.10581297288448721,
   heelXZ:[2.296461644509026,-7.111172199734786],
   toeXZ:[2.177602282391331,-7.137116049203764]}
 };
 const finisher={
  source:'measured-licensed-counterpitch-original-toes-child',
  side:'right',sourceClip:'Walking_A',angleRad:-.0498,
  sourceToeTrackVerified:true,originalOppositeShoeVerified:true,
  sourceBone:'toesr',sourceTrack:'toesr.quaternion',
  originalSourceFootParent:'footr',finalIndependentSourceSkin:true,
  contactLocked:false,plantCertified:false
 };
 const measured={
  source:'measured-original-licensed-source-counterpitch',
  sourceInstanceId:'actual-desktop-original-vanguard-clone',
  sourceClip:'Walking_A',side:'right',
  sourceConnectedLegCandidateCount:2,sourceConnectedLegSelected:false,
  sourceProbeCount:6,appliedUpperRad:-.00468705882352852,
  appliedLowerRad:.00468705882352852,appliedFootRad:-.0498,
  originalBindSegmentsMeters:[.17067002536856543,.11231605296387505],
  sourceUpperBone:'upperlegr',sourceLowerBone:'lowerlegr',
  sourceFootBone:'footr',
  sourceOriginalTracks:[
   'upperlegr.quaternion','lowerlegr.quaternion','footr.quaternion'],
  witnessedRootTravelMeters:.01003926783633724,
  witnessedFrameIntervalSeconds:.01659999999999684,
  sourceOriginalRootTravelWitnessed:true,
  originalOppositeShoeVerified:true,finalIndependentSourceSkin:true,
  licensedOriginalToeChildFinisher:finisher,
  contactLocked:false,plantCertified:false,after:soles
 };
 const args={
  sourceInstanceId:'actual-desktop-original-vanguard-clone',
  sourceClipName:'Walking_A',
  sourceFootProofs:{left:null,right:measured},currentSoles:soles
 };
 const accepted=certify(args);
 assert.equal(accepted?.source,'same-licensed-GLB-connected-leg-to-final-pelvis',
  'the first selected, real THREE original bones must not be confused with the unselected SECOND source trial');
 assert.equal(accepted?.originalWeightedSolesVerified,2);
 assert.equal(accepted?.contactLocked,false);
 assert.equal(accepted?.plantCertified,false);
 const staged=plan({mode:'move',sourceClipName:'Walking_A',
  sourceWeight:1,ownerLocomotion:true,rootTravel:.01003926783633724,
  frameAge:0,frameInterval:.01659999999999684,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,floorTopY:-.02,floorEvidence:'authored-cube-floor-top',
  left:soles.left,right:soles.right,previousLiftMeters:0});
 assert.equal(staged?.side,'left','genuine loaded left source shoe, not the deeply buried RIGHT airborne swing');
 assert.ok(staged.liftMeters>.007 && staged.liftMeters<=.0081,
  'original real frame permits only a small bounded presentation Y trial');
 const moved=s=>({...s,heelY:s.heelY+staged.liftMeters,
  toeY:s.toeY+staged.liftMeters});
 const physical=verify({before:soles.left,after:moved(soles.left),
  otherBefore:soles.right,otherAfter:moved(soles.right),
  floorTopY:-.02,requireWorldXZ:true});
 assert.ok(physical?.improvementMeters>.007,
  'actual source-weighted four-endpoint evidence must survive independent final skin');
 // Forged, stale or unlicensed source owner cannot use the first-chain exception.
 for(const broken of [
  {sourceConnectedLegCandidateCount:1},
  {sourceProbeCount:0},
  {appliedUpperRad:NaN},{appliedLowerRad:0},
  {originalBindSegmentsMeters:[.04,.8]},
  {licensedOriginalToeChildFinisher:{...finisher,sourceBone:'proceduralToe'}},
  {licensedOriginalToeChildFinisher:{...finisher,sourceTrack:'Idle.toesr'}},
  {licensedOriginalToeChildFinisher:{...finisher,contactLocked:true}},
  {sourceUpperBone:'fakeUpperleg'},
  {sourceOriginalTracks:['upperlegr.quaternion']},
  {plantCertified:true}
 ]){
  assert.equal(certify({...args,sourceFootProofs:{
   left:null,right:{...measured,...broken}}}),null,
   'a fabricated source chain or original toe-child must fail closed: '+Object.keys(broken).join(','));
 }
 assert.equal(certify({...args,currentSoles:{
  left:{...soles.left,heelXZ:[soles.left.heelXZ[0]+.003,soles.left.heelXZ[1]]},
  right:soles.right
 }}),null,'a mismatched real world-space weighted heel must reject the whole-body trial');
});


/**
 * Actual original 390px WebGL Vanguard Walking_A frame64/tick8 from exact
 * ae5fe33b, Actions #44862879484 / native source artifact 14691533052.
 * Real left source-weighted heel was 6.2186mm under -20mm stone, with the
 * same left toe 26.3572mm above the plane. This is a heel-FIRST rollover,
 * not a flat two-point planted foot. Right original swing sole is floating
 * heel +206.76mm and buried toe -62.94mm relative to authored stone.
 * The earlier strict two-point planner rejects any correction. Test FIRST
 * for a bounded, reversible whole-pelvis 6.2mm lift based on the true
 * weighted heel; toe roll may stay elevated but must not be called planted.
 */
test('RED: actual original mobile heel-first roll may earn bounded pelvis support without pretending the elevated toe is planted',async()=>{
 const {planOriginalSourceLoadedPelvisSupport:plan,
  verifyOriginalSourceLoadedPelvisFootWitness:verify}=await source;
 const base={
  mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  ownerLocomotion:true,rootTravel:.010097126678548118,
  frameAge:0,frameInterval:.016699999999993054,
  alive:true,visible:true,teleport:false,reducedMotion:false,
  interrupted:false,floorTopY:-.02,
  floorEvidence:'authored-cube-floor-top',previousLiftMeters:0,
  left:{heelY:-.026218604954277552,toeY:.006357235163678428,
   heelXZ:[-2.8345100179509983,-6.957069638233759],
   toeXZ:[-3.102741934344064,-6.931612502456333]},
  right:{heelY:.1867625304107833,toeY:-.08294209827491945,
   heelXZ:[-2.7034802056241007,-7.107765237158218],
   toeXZ:[-2.8231707260920484,-7.135878864712355]}
 };
 const candidate=plan(base);
 assert.equal(candidate?.side,'left','original loaded heel must be selected');
 assert.equal(candidate?.sourceHeelRollVerified,true,
  'a raised source toe and buried loaded heel are a named heel roll, never a 2-point contact');
 assert.ok(candidate.liftMeters>=.0061&&candidate.liftMeters<=.0063,
  'small measured visual pelvis recovery must stop at the original stone heel plane');
 const move=foot=>({...foot,heelY:foot.heelY+candidate.liftMeters,
  toeY:foot.toeY+candidate.liftMeters});
 const before=base.left,after=move(before),
  otherBefore=base.right,otherAfter=move(otherBefore);
 const actual=verify({before,after,otherBefore,otherAfter,
  floorTopY:-.02,requireWorldXZ:true,
  sourceHeelRollVerified:candidate.sourceHeelRollVerified});
 assert.ok(actual?.improvementMeters>=.006,
  'authentic weighted heel burial must reduce with no fabricated lateral shoe drift');
 assert.equal(actual?.supportKind,'source-loaded-heel-roll');
 assert.equal(actual?.contactLocked,false);
 assert.equal(actual?.plantCertified,false);
 assert.equal(verify({before,after,otherBefore,otherAfter,
  floorTopY:-.02,requireWorldXZ:true}),null,
  'the previous flat-foot verifier must not automatically accept heel-roll poses');
 for(const unsafe of [
  {mode:'attack'},{sourceClipName:'Idle'},{rootTravel:0},
  {teleport:true},{interrupted:true},{reducedMotion:true},
  {left:{...base.left,heelY:-.09}},
  {left:{...base.left,toeY:.025}},
  {left:{...base.left,toeY:-.01}},
  {right:{...base.right,heelY:-.022,toeY:-.019}}
 ])assert.equal(plan({...base,...unsafe}),null,
  'only genuine loaded-heel roll, licensed action and unoccupied opposing shoe may earn this motion: '+JSON.stringify(unsafe));
 assert.equal(verify({before,after:{...after,heelXZ:[after.heelXZ[0]+.003,after.heelXZ[1]]},
  otherBefore,otherAfter,floorTopY:-.02,requireWorldXZ:true,
  sourceHeelRollVerified:true}),null,
 'lateral source-sole drift cannot be hidden by a favorable vertical lift');
 assert.equal(verify({before,after:{...after,toeY:after.toeY+.008},
  otherBefore,otherAfter,floorTopY:-.02,requireWorldXZ:true,
  sourceHeelRollVerified:true}),null,
 'native toe cannot silently rise independent of the whole-pelvis Y translation');
});


// Exact original 390px source proof: b78a7cb8 Actions #44891587355,
// genuine loaded right heel -41.580655mm, source planner 10.1625mm desired
// vertical lift, final world heel -21.255655mm: 20.325mm actual movement.
// The local visual pivot must not apply a 2x-parent-scale world lift when
// its animation-only native pelvis support requested just 10.1625mm.
// This is a SOURCE-world sole calibration, never invented contact/IK/authority.
test('RED: original 390px loaded-heel support translates by measured world metres, not scaled local metres',async()=>{
 const {planOriginalSourceWorldPelvisLift:local}=await source;
 assert.equal(typeof local,'function',
  'the original rig requires a bounded world-to-local pelvis carrier');
 const input={
  source:'measured-original-GLB-loaded-heel-and-toe',
  desiredWorldLiftMeters:.010162500000000069,
  parentWorldLocalYAxis:[0,2,0]
 };
 const result=local(input);
 assert.ok(result);
 assert.ok(Math.abs(result.localLiftMeters-.0050812500000000345)<1e-10);
 assert.ok(Math.abs(result.worldLiftMeters-.010162500000000069)<1e-10);
 const originalHeel=-.04158065515263443;
 assert.ok(Math.abs(originalHeel+result.worldLiftMeters+
  .03141815515263436)<1e-9,
  'real source heel rises only planned 10.1625mm, not the previous 20.325mm');
 assert.equal(result.contactLocked,false);assert.equal(result.plantCertified,false);
 assert.match(renderer,/planOriginalSourceWorldPelvisLift\(/,
  'original renderer must carry source pelvis offset through world-axis calibration');
 assert.match(renderer,/baseY\+calibrated\.localLiftMeters/,
  'the loaded original rig must receive LOCAL rather than uncalibrated world metres');
 for(const bad of [
  {source:'unverified'},{desiredWorldLiftMeters:.03},
  {desiredWorldLiftMeters:-.01},
  {parentWorldLocalYAxis:[0,0,0]},
  {parentWorldLocalYAxis:[1,1,0]},
  {parentWorldLocalYAxis:[0,.3,0]},
  {parentWorldLocalYAxis:[NaN,2,0]}
 ])assert.equal(local({...input,...bad}),null,
  'unverified carrier / lateral source foot slide / invalid rig scale must fail closed');
 const yawOnly=local({...input,parentWorldLocalYAxis:[.04,2,.02]});
 assert.ok(yawOnly&&yawOnly.lateralWorldDriftMeters<.0015,
  'small measured parent tilt may proceed only within original two-shoe XZ budget');
});


// Genuine exact-head #44986546974 390px source-skinned Vanguard frame116/tick14:
// left original Walking_A swing toe -55.566mm below -20mm stone despite an
// independently certified 13.553mm original upperleg->knee->foot rescue.
// The right supporting *heel* is 2.390mm above stone and its rolling toe
// 37.071mm above. A whole-rig pelvis Y lift would FLOAT that support.
// These are real four source-GLB endpoints (not a fabricated after frame).
// The proposed body-lean endpoint values below are geometric predictions,
// NEVER claims of original WebGL success or contact; Chromium must actually
// read both true skinned soles after applying and roll back if they differ.
test('RED: original licensed heel-anchored full-body lean lifts a buried swing toe WITHOUT moving the real loaded heel or detaching the weapon',async()=>{
 const m=await source;
 const plan=m.planOriginalSourceHeelAnchoredBodyLean;
 const certify=m.certifyOriginalSourceHeelAnchoredBodyLean;
 assert.equal(typeof plan,'function');
 assert.equal(typeof certify,'function');
 const actual={
  left:{
   heel:[2.289816601524594,.19465245266076472,-6.949213656205713],
   toe:[2.1733307958457786,-.07556612932990792,-6.929605240306179]},
  right:{
   heel:[2.1719175486429254,-.01760954487710318,-7.1066396348137175],
   toe:[1.9038256873213801,.01707088838136843,-7.131150401217663]}
 };
 const proof={source:'measured-original-licensed-source-counterpitch',
  sourceRole:'vanguard',sourceClip:'Walking_A',side:'left',
  sourceInstanceId:'genuine-mobile-original-Vanguard-GLB',
  sourceClipTimeSeconds:.6193479222370726,
  sourceUpperBone:'upperlegl',sourceLowerBone:'lowerlegl',
  sourceFootBone:'footl',
  sourceOriginalTracks:['upperlegl.quaternion','lowerlegl.quaternion','footl.quaternion'],
  originalBindSegmentsMeters:[.1706700256741458,.11231604804499139],
  witnessedRootTravelMeters:.019291663189031638,
  witnessedFrameIntervalSeconds:.033300000000004104,
  finalIndependentSourceSkin:true,originalOppositeShoeVerified:true,
  sourceOriginalRootTravelWitnessed:true,
  contactLocked:false,plantCertified:false,
  after:{
   left:{heelY:actual.left.heel[1],toeY:actual.left.toe[1],
    heelXZ:[actual.left.heel[0],actual.left.heel[2]],
    toeXZ:[actual.left.toe[0],actual.left.toe[2]]},
   right:{heelY:actual.right.heel[1],toeY:actual.right.toe[1],
    heelXZ:[actual.right.heel[0],actual.right.heel[2]],
    toeXZ:[actual.right.toe[0],actual.right.toe[2]]}}};
 const inputs={mode:'move',sourceClipName:'Walking_A',sourceRole:'vanguard',
  sourceInstanceId:proof.sourceInstanceId,sourceWeight:1,
  sourceFootProof:proof,sourceSoles:actual,
  sourceWeaponGripVerified:true,
  ownerLocomotion:true,alive:true,visible:true,
  rootTravel:.019291663189031638,
  frameInterval:.033300000000004104,
  frameAge:0,floorTopY:-.02,
  teleport:false,reducedMotion:false,interrupted:false};
 const proposal=plan(inputs);
 assert.equal(proposal?.source,'licensed-original-supported-heel-anchored-body-lean');
 assert.equal(proposal?.supportSide,'right');
 assert.equal(proposal?.swingSide,'left');
 assert.ok(proposal.angleRad>0&&proposal.angleRad<=.050001,
  'the complete original GLB body gets at most a single 3rad/s-bounded ~2.9-degree roll');
 assert.ok(proposal.projectedSwingToeLiftMeters>=.008,
  'real supporting heel-to-buried swing toe separation permits material toe clearance');
 assert.ok(Math.abs(proposal.predictedAfter.right.heel[1]-actual.right.heel[1])<.0001,
  'loaded heel must remain the original same-world anchor, not a fabricated ground contact');
 assert.ok(proposal.predictedAfter.right.toe[1]<=actual.right.toe[1]+.001,
  'a source toe already above stone must not become a floating support');
 assert.ok(proposal.predictedAfter.left.toe[1]>actual.left.toe[1]+.008,
  'world-space whole-rig lean helps the original, STILL BURIED, skinned toe');
 assert.ok(proposal.predictedAfter.left.toe[1]<-.020,
  'partial source support can NEVER be certified as toe contact');
 const approved=certify({plan:proposal,before:actual,
  after:proposal.predictedAfter,sourceWeaponGripVerified:true});
 assert.equal(approved?.originalSkinnedShoesVerified,2);
 assert.equal(approved?.plantCertified,false);
 assert.equal(approved?.contactLocked,false);
 for(const unsafe of [
  {sourceRole:'ranger'}, {sourceClipName:'Idle'},
  {sourceInstanceId:'other-original-rig'}, {sourceWeight:.7},
  {sourceWeaponGripVerified:false}, {ownerLocomotion:false},
  {rootTravel:0},{frameInterval:.4},{reducedMotion:true},
  {teleport:true},{interrupted:true},{alive:false},
  {sourceFootProof:{...proof,finalIndependentSourceSkin:false}},
  {sourceSoles:{...actual,right:{...actual.right,
    heel:[...actual.right.heel.slice(0,1),.075,actual.right.heel[2]]}}}
 ])assert.equal(plan({...inputs,...unsafe}),null,
  'a different rig, unverified source, unavailable support or interruption must fail closed');
 const drifting={...proposal.predictedAfter,right:{...proposal.predictedAfter.right,
  heel:[proposal.predictedAfter.right.heel[0]+.018,
   proposal.predictedAfter.right.heel[1],proposal.predictedAfter.right.heel[2]]}};
 assert.equal(certify({plan:proposal,before:actual,after:drifting,
  sourceWeaponGripVerified:true}),null,
  'final real weighted supporting heel XZ deviation must reject the whole-body lean');
});


/**
 * REAL native six-GLB Chrome/390px after-head d92a2969, f114/tick14:
 * one independently skinned original Walking_A linked-leg+toe child witness
 * is already accepted, but the heel-proximal whole-body trial NEVER ran:
 * the support heel was +14.5128mm and its raised toe +55.1466mm over
 * the -20mm stone, just outside the earlier narrow 8/55mm proxy window.
 * These are BEFORE source-weighted 3D world-space endpoints, NOT hypothetical
 * skinned AFTER frames or a contact/plant certificate. Its valid source
 * skin + socket/clip must still be re-read in Chromium after the change.
 */
test('RED: genuine 390px f114 near-floor rolling heel allows a bounded original-body lean, never inventing a plant',async()=>{
 const m=await source;
 const actual={
  left:{
   heel:[2.2734302988517054,.20338158671403223,-6.946109202208276],
   toe:[2.161799201001761,-.07063313908216373,-6.9302070715531]},
  right:{
   heel:[2.1411352731796267,-.005487197993017038,-7.1063031680287425],
   toe:[1.873659469701867,.035146607150513175,-7.130170648877351]}
 };
 const sourceInstanceId='actual-390px-f114-same-original-source-instance';
 const proof={source:'measured-original-licensed-source-counterpitch',
  sourceRole:'vanguard',sourceClip:'Walking_A',side:'left',
  sourceInstanceId,sourceClipTimeSeconds:.6153084037846493,
  sourceUpperBone:'upperlegl',sourceLowerBone:'lowerlegl',
  sourceFootBone:'footl',
  sourceOriginalTracks:['upperlegl.quaternion','lowerlegl.quaternion','footl.quaternion'],
  originalBindSegmentsMeters:[.1706700256741458,.11231604804499139],
  witnessedRootTravelMeters:.011510561639823003,
  witnessedFrameIntervalSeconds:.01659999999999684,
  finalIndependentSourceSkin:true,originalOppositeShoeVerified:true,
  sourceOriginalRootTravelWitnessed:true,contactLocked:false,
  plantCertified:false,
  after:Object.fromEntries(['left','right'].map(side=>[side,{
   heelY:actual[side].heel[1],toeY:actual[side].toe[1],
   heelXZ:[actual[side].heel[0],actual[side].heel[2]],
   toeXZ:[actual[side].toe[0],actual[side].toe[2]]}]))};
 const input={mode:'move',sourceClipName:'Walking_A',
  sourceRole:'vanguard',sourceInstanceId,sourceWeight:1,
  sourceFootProof:proof,sourceSoles:actual,
  sourceWeaponGripVerified:true,ownerLocomotion:true,
  alive:true,visible:true,rootTravel:.011510561639823003,
  frameInterval:.01659999999999684,frameAge:0,
  floorTopY:-.02,interrupted:false,teleport:false,reducedMotion:false};
 const plan=m.planOriginalSourceHeelAnchoredBodyLean(input);
 assert.equal(plan?.source,'licensed-original-supported-heel-anchored-body-lean',
  'actual prior green-run source frame must reach trial instead of an overly narrow proximity gate');
 assert.equal(plan?.supportSide,'right');
 assert.ok(plan?.projectedSwingToeLiftMeters>=.007,
  'only bounded predicted ORIGINAL SOURCE toe motion warrants a real two-shoe skin probe');
 assert.ok(plan?.predictedAfter.left.toe[1]<-.02,
  'original skinned swing toe is STILL buried: never claim floor contact');
 assert.ok(plan?.predictedAfter.right.toe[1]<=actual.right.toe[1]+.001);
 assert.equal(plan?.plantCertified,false);
 assert.equal(plan?.contactLocked,false);
 const expected=m.certifyOriginalSourceHeelAnchoredBodyLean({
  plan,before:actual,after:plan.predictedAfter,sourceWeaponGripVerified:true});
 assert.ok(expected?.finalSwingToeLiftMeters>=.007,
  'analytic projection is a contract test, NOT a certified actual WebGL after-frame');
 for(const invalid of [
  {sourceSoles:{...actual,right:{...actual.right,
   heel:[actual.right.heel[0],actual.right.heel[1]+.012,actual.right.heel[2]]}}},
  {sourceSoles:{...actual,right:{...actual.right,
   toe:[actual.right.toe[0],actual.right.toe[1]+.025,actual.right.toe[2]]}}},
  {sourceFootProof:{...proof,finalIndependentSourceSkin:false}},
  {sourceWeaponGripVerified:false},{rootTravel:0},
  {frameAge:.2},{reducedMotion:true},{sourceRole:'warden'}]){
  assert.equal(m.planOriginalSourceHeelAnchoredBodyLean({...input,...invalid}),null,
   'high/floating shoe or unwitnessed source must remain ineligible');
 }
});


// The prior source-rig WebGL film (#44995466233 desktop f90/mobile f72)
// offered a licensed full-body heel rotation, but refused the final original
// skin. The previous refusal erased WHICH weighted sole or grip was wrong.
// These are intentionally artificial AFTER values applied to a genuinely
// measured f114 BEFORE; no test can claim the film improved from them.
test('RED: a rejected licensed whole-body lean identifies the first actual weighted GLB sole or socket mismatch',async()=>{
 const m=await source;
 assert.equal(typeof m.auditOriginalSourceHeelAnchoredBodyLeanReadback,'function');
 const before={
  left:{heel:[2.2734302988517054,.20338158671403223,-6.946109202208276],
   toe:[2.161799201001761,-.07063313908216373,-6.9302070715531]},
  right:{heel:[2.1411352731796267,-.005487197993017038,-7.1063031680287425],
   toe:[1.873659469701867,.035146607150513175,-7.130170648877351]}
 };
 const after={
  left:{heel:before.left.heel.slice(),
   toe:[before.left.toe[0],before.left.toe[1]+.008, before.left.toe[2]]},
  right:{heel:before.right.heel.slice(),toe:before.right.toe.slice()}
 };
 const plan={
  source:'licensed-original-supported-heel-anchored-body-lean',
  worldBodyRotationOnly:true,originalBoneTracksPreserved:true,
  contactLocked:false,plantCertified:false,
  sourceInstanceId:'observed-f114-original-vanguard',
  supportSide:'right',swingSide:'left',
  originalBefore:before,predictedAfter:after
 };
 const accepted=m.auditOriginalSourceHeelAnchoredBodyLeanReadback({
  plan,before,after,sourceWeaponGripVerified:true});
 assert.equal(accepted.reason,'independent-original-rig-skin-verified');
 assert.equal(accepted.certificate?.originalSkinnedEndpointsVerified,4);
 assert.equal(accepted.maxPredictedWorldSoleErrorMm,0);
 const wrong={...after,left:{...after.left,
  toe:[after.left.toe[0]+.003,after.left.toe[1],after.left.toe[2]]}};
 const sourceMismatch=m.auditOriginalSourceHeelAnchoredBodyLeanReadback({
  plan,before,after:wrong,sourceWeaponGripVerified:true});
 assert.equal(sourceMismatch.certificate,null);
 assert.equal(sourceMismatch.reason,'original-weighted-world-body-transform-mismatch');
 assert.equal(sourceMismatch.firstMismatchedEndpoint,'left.toe');
 assert.ok(sourceMismatch.maxPredictedWorldSoleErrorMm>=2.999);
 assert.equal(sourceMismatch.supportHeelDriftMm,0);
 assert.equal(sourceMismatch.measuredSwingToeLiftMm,8);
 const gripMismatch=m.auditOriginalSourceHeelAnchoredBodyLeanReadback({
  plan,before,after,sourceWeaponGripVerified:false});
 assert.equal(gripMismatch.certificate,null);
 assert.equal(gripMismatch.reason,'original-source-weapon-socket-mismatch');
 const badBefore={...before,right:{...before.right,
  heel:[before.right.heel[0]+.003,before.right.heel[1],before.right.heel[2]]}};
 const stale=m.auditOriginalSourceHeelAnchoredBodyLeanReadback({
  plan,before:badBefore,after,sourceWeaponGripVerified:true});
 assert.equal(stale.certificate,null);
 assert.equal(stale.reason,'stale-original-source-before-sole');
});


/**
 * RED — exact original mobile source-skin readback on 22 Nov 2026 at
 * 6d961535044d; genuine mobile f27/tick2 wanted 3.747356mm of visual-pelvis
 * lift but measured 7.494711mm on BOTH original weighted heels. At f69/tick8
 * it wanted 4.345285mm and measured 8.690569mm. These are REJECTED native
 * trials, never accepted floor contact or improvement.
 *
 * This real Three.js source-skin analog isolates the same stale attached
 * bind inverse observed in the previous heel-lean test. Only ORIGINAL
 * weighted source shoe meshes can be refreshed; simulation authority and
 * source clip remain untouched.
 */
test('RED: authentic source-pelvis lift refreshes attached original skin inverses before dual-shoe world read and rollback',()=>{
 const THREE=require('three');
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([.12,.14,.07],3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute([0,0,0,0],4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute([1,0,0,0],4));
 const material=new THREE.MeshBasicMaterial();
 const pivot=new THREE.Group();
 const meshes=[0,1].map(index=>{
  const mesh=new THREE.SkinnedMesh(geometry,material);
  const bone=new THREE.Bone();bone.name='licensed-shoe-'+index;
  mesh.add(bone);pivot.add(mesh);
  pivot.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton([bone]));
  mesh.updateMatrixWorld(true);
  return mesh;
 });
 const sample=mesh=>{
  const vertex=new THREE.Vector3().fromBufferAttribute(
   geometry.getAttribute('position'),0);
  mesh.applyBoneTransform(0,vertex);
  return vertex.applyMatrix4(mesh.matrixWorld).y;
 };
 const before=meshes.map(sample);
 const realMobileWorldLift=.0037473556973408317;
 pivot.position.y=realMobileWorldLift;
 pivot.updateWorldMatrix(true,true);
 const stale=meshes.map(sample);
 for(let i=0;i<2;i++)
  assert.ok(Math.abs((stale[i]-before[i])-2*realMobileWorldLift)<.000001,
   'attached bind inverse left stale reproduces actual 2x mobile world lift');
 for(const mesh of meshes)mesh.updateMatrixWorld(true);
 const verified=meshes.map(sample);
 for(let i=0;i<2;i++)
  assert.ok(Math.abs((verified[i]-before[i])-realMobileWorldLift)<.000001,
   'refreshing source attached bind inverse restores exact 1x world lift');
 pivot.position.y=0;
 pivot.updateWorldMatrix(true,true);
 for(const mesh of meshes)mesh.updateMatrixWorld(true);
 const rolledBack=meshes.map(sample);
 for(let i=0;i<2;i++)
  assert.ok(Math.abs(rolledBack[i]-before[i])<.000001,
   'pelvis rejection must leave original source shoe pose unchanged');
 geometry.dispose();material.dispose();
 const stage=renderer.slice(
  renderer.indexOf('function stageSourceLoadedPelvisBeforeLegs('),
  renderer.indexOf('function auditSourceLoadedPelvisAfterLegs('));
 assert.ok(stage.startsWith('function stageSourceLoadedPelvisBeforeLegs('));
 const readStart=stage.indexOf('const read=side=>');
 const readEnd=stage.indexOf("const left=read('left')",readStart);
 assert.ok(readStart>=0&&readEnd>readStart);
 const originalRead=stage.slice(readStart,readEnd);
 // The live source-rig bridge intentionally shares ONE bounded refresh helper
 // across the two shoe reads. A legacy assertion searched only inside read()
 // and falsely failed when production deduplicated that safe refresh.
 const refreshStart=stage.indexOf('const refreshOriginalPelvisShoeSkins=()=>');
 assert.ok(refreshStart>=0&&refreshStart<readStart,
  'define original attached-shoe refresh before either world-space sole read');
 const refreshed=stage.slice(refreshStart,readStart);
 assert.match(refreshed,/mesh\?\.isSkinnedMesh/,
  'only original attached licensed SkinnedMesh instances may be refreshed');
 assert.match(refreshed,/sourceShoeMeshes\.indexOf\(mesh\)===i/,
  'refresh each DISTINCT original skinned shoe mesh at most once per read');
 assert.match(refreshed,/mesh\.updateMatrixWorld\(true\)/,
  'repair Three.js attached bind inverses before each independent shoe sample');
 assert.match(originalRead,/refreshOriginalPelvisShoeSkins\(\)/,
  'both original source heel/toe reads must invoke the verified refresh helper');
 assert.match(stage,/sourceOriginalShoeSkinsAfterPelvisRollback|refreshOriginalPelvisShoeSkins\(\)/,
  'after rejected original pelvis pose restore the attached skin bind inverse as well');
 assert.match(stage,/Math\.abs\(delta-expectedWorldLift\)<=\.001/,
  'keep strict bilateral 1mm same-world source-sole certification');
});


/**
 * Native mobile source at exact 492cd81499da, frame 72/tick 8, certified
 * exactly ONE independently skinned heel-anchored whole-body lean (7.544mm).
 * Later native frames 78/95/99/120/128 retained acceptedFrames=1 despite
 * their CURRENT pose being rejected, making a historical counter appear as
 * multiple accepted original full-body frames. A Gauntlet measurement must
 * never confuse those events or count unsupported source poses as accepted.
 */
test('RED: original rig body lean native audit distinguishes same-frame source-skin certificate from cumulative counter',()=>{
 const browser=fs.readFileSync(path.resolve(__dirname,
  '../browser/dungeon-session03-continuous-motion.spec.cjs'),'utf8');
 const begin=browser.indexOf('originalWalkingHeelLeanGateAndSoleAudit:');
 const end=browser.indexOf('originalWalkingPelvisGateAndSoleAudit:',begin);
 assert.ok(begin>0&&end>begin);
 const audit=browser.slice(begin,end);
 assert.match(audit,/accepted:x\.sourceHeelLean\?\.finalProof\?\.originalSkinnedEndpointsVerified===4/,
  'only a same-frame genuine original four-endpoint source skin certificate counts as accepted');
 assert.match(audit,/acceptedFramesCumulative:x\.sourceHeelLean\?\.acceptedFrames\?\?0/,
  'retain separately labelled cumulative successes to identify later rejection');
 assert.doesNotMatch(audit,/accepted:x\.sourceHeelLean\?\.acceptedFrames/,
  'a cumulative previous frame must never certify current original rig motion');
 assert.match(audit,/originalResidualSwingToeBurialMeters:/,
  'report actual same-frame weighted original swing-toe burial after any certified body pose');
});


/**
 * RED 22 Nov 2026 — same original weighted 41-joint shoe reader is shared
 * by source knee/ankle/foot and heel-body ownership stages. Source mobile
 * #45004622408 demonstrated that moving an attached skinned parent without
 * refreshing the actual SkinnedMesh bind inverse yields 2x requested pelvis
 * motion. Earlier corrections refreshed only individual pelvis/body-lean
 * trials. The generic ORIGINAL weighted-sole sampler still accepts stale
 * bind inverses before source-linked joint probes and final skin receipts.
 *
 * The 3.7473557mm travel and 42.33mrad heel lean are documented genuine
 * source measurements used only as numerical fixtures here. This is a
 * real Three.js attached skin transform test, NOT new captured GLB footage.
 */
test('RED: shared original weighted skinned-sole reader refreshes attached bind inverse before every world read',()=>{
 const THREE=require('three');
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([.12,.14,.07],3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute([0,0,0,0],4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute([1,0,0,0],4));
 const material=new THREE.MeshBasicMaterial();
 const pivot=new THREE.Group();
 const mesh=new THREE.SkinnedMesh(geometry,material);
 const bone=new THREE.Bone();
 bone.name='original-licensed-weighted-shoe';
 mesh.add(bone);pivot.add(mesh);
 pivot.updateMatrixWorld(true);
 mesh.bind(new THREE.Skeleton([bone]));
 mesh.updateMatrixWorld(true);
 const read=()=>{
  const p=new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'),0);
  mesh.applyBoneTransform(0,p);
  return p.applyMatrix4(mesh.matrixWorld);
 };
 const before=read();
 const actualMobileLift=.0037473556973408317;
 const genuineCertifiedLean=.04233;
 pivot.position.y=actualMobileLift;
 pivot.rotation.z=genuineCertifiedLean;
 pivot.updateWorldMatrix(true,true);
 const stale=read();
 const expected=before.clone().applyAxisAngle(new THREE.Vector3(0,0,1),genuineCertifiedLean);
 expected.y+=actualMobileLift;
 assert.ok(stale.distanceTo(expected)>.001,
  'a stale original bind inverse is visibly wrong in a rotated + translated root');
 mesh.updateMatrixWorld(true);
 const verified=read();
 assert.ok(verified.distanceTo(expected)<.000001,
  'source CPU weighted toe must match the actual attached-skinned world transform');
 pivot.position.y=0;pivot.rotation.z=0;
 pivot.updateWorldMatrix(true,true);
 mesh.updateMatrixWorld(true);
 assert.ok(read().distanceTo(before)<.000001,
  'rejected candidate must return the original source weighted sole exactly');
 geometry.dispose();material.dispose();
 const start=renderer.indexOf('function readOriginalSwingSoleY(candidate){');
 const end=renderer.indexOf('function readOriginalSwingSoleSample(candidate){',start);
 assert.ok(start>=0&&end>start);
 const sharedReader=renderer.slice(start,end);
 assert.match(sharedReader,/mesh\.updateMatrixWorld\(true\)/,
  'refresh actual source SkinnedMesh bind inverse inside the SHARED weighted-sole sampler, not just isolated pelvis or heel-body trials');
 assert.match(sharedReader,/mesh\.applyBoneTransform\(index,originalSwingToePoint\)/,
  'continue source GLB skin-weighted sole and inverse-bind transform; do not fake a foot contact');
 assert.match(sharedReader,/originalSwingToePoint\.applyMatrix4\(mesh\.matrixWorld\)/,
  'independently verify final original source world X/Y/Z endpoint');
});
