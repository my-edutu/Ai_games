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
