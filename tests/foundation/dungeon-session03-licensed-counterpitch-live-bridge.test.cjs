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
