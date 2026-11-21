'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,
 '../../public/ai-dungeon/full-body-animation-controller.js'),'utf8');
let loaded;
async function controller(){
 return loaded??=await import('data:text/javascript;base64,'+
  Buffer.from(source).toString('base64'));
}
// Authentically OBSERVED shoe endpoints at original 390px 216.7ms source
// Walking_A, native source-rig Actions #44406645027, GLB source actor
// aaca7855. Toe pivot / world axis here are SYNTHETIC legal contract
// fixtures, not a measured source toe bone, IK or genuine AFTER WebGL.
const toe=[-7.724593053808082,-.07759606115121545,-6.875358909740754];
const pivot=[toe[0]+.08,toe[1]+.018,toe[2]];
const followups=[
 {upperRad:-.11,lowerRad:+.14,footRad:.18},
 {upperRad:-.11,lowerRad:+.14,footRad:.24}
];
const frame={
 source:'same-original-GLB-skin-toes-hinge',sourceClipName:'Walking_A',
 sourceWeight:1,frameInterval:.2167,sourceInstanceSame:true,
 sourceFootTrackVerified:true,sourceToeChainVerified:true,
 sourceToeBoneName:'toesl',sourceToeTrackName:'toesl.quaternion',
 sourceToeSkinnedWeight:.98,sourceToeVertexWorld:toe,
 sourceToePivotWorld:pivot,sourceToeAxisWorld:[0,0,1],
 sourceBurialMeters:-.02-toe[1],originalFollowups:followups,
 ownerLocomotion:true,alive:true,visible:true,
 teleport:false,reducedMotion:false,interrupted:false
};
test('RED: genuine 216.7ms original Walking_A permits a bounded source-connected toesl trial using existing four two-shoe probes',async()=>{
 const m=await controller();
 const candidates=m.planOriginalSourceCoupledToeHingeFollowups(frame);
 assert.ok(candidates,'licensed same-clone toe hinge must be eligible in a VERIFIED 216.7ms rendered source window');
 assert.equal(candidates.length,2,'reuse remaining two real original skin probe slots');
 assert.deepEqual(candidates[0],{...followups[1],toeRad:0});
 assert.equal(candidates[1].footRad,.24);
 assert.equal(candidates[1].toeRad,-.14);
 const adaptive=m.planOriginalSourceAdaptiveToeHingeProbe({
  source:'verified-original-post-coupled-toe-hinge',
  sourceClipName:'Walking_A',sourceWeight:1,frameInterval:.2167,
  sourceInstanceSame:true,sourceToeTrackVerified:true,
  sourceToeChainVerified:true,sourceToeSkinnedWeight:.98,
  preplannedToeRad:-.14,sourceToeVertexWorld:toe,
  sourceToePivotWorld:pivot,sourceToeAxisWorld:[0,0,1],
  sourceHeelY:.2364,floorTopY:-.02,
  ownerLocomotion:true,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false
 });
 assert.equal(adaptive?.toeRad,-.32,'source-position-derived toe hinge never exceeds 320mrad');
 assert.equal(adaptive?.originalSourceContactLocked,false);
});
test('invalid sparse source toe motion never invents toe contact or an extra animation owner',async()=>{
 const m=await controller();
 const blocked=[
  {frameInterval:.251},{frameInterval:.03}, // distinct old fast source envelopes
  {sourceWeight:.80},{sourceToeSkinnedWeight:.89},
  {sourceToeBoneName:'toesr'},{sourceToeTrackName:'toe_fake.quaternion'},
  {sourceInstanceSame:false},{sourceFootTrackVerified:false},
  {sourceToeChainVerified:false},{sourceToeVertexWorld:[NaN,0,0]},
  {sourceToePivotWorld:[NaN,0,0]},{sourceToeAxisWorld:[0,0,0]},
  {sourceBurialMeters:.150},{sourceBurialMeters:.001},
  {mode:'attack',ownerLocomotion:false},{visible:false},
  {teleport:true},{reducedMotion:true},{interrupted:true},
  {alive:false},{originalFollowups:[followups[1]]},
  {originalFollowups:[{...followups[0],lowerRad:-.14},followups[1]]}
 ];
 for(const change of blocked){
  const proposal=m.planOriginalSourceCoupledToeHingeFollowups({...frame,...change});
  assert.equal(proposal,null,JSON.stringify(change)+' must not claim source toe trial');
 }
});

test('connected native toe-child candidate requires genuine post-mixer BOTH-shoe receipts before it can win',async()=>{
 const m=await controller();
 // BEFORE original licensed 390px Walking_A mobile frame (source-rig
 // #14477439727); AFTER below is a *synthetic* reachable skinned-source
 // contract fixture. It is NOT a claim that this pose was rendered.
 const before={
  left:{heelY:.22242287960120563,toeY:-.07759606115121545,
   heelXZ:[-7.664535706275483,-6.873200425645406],
   toeXZ:[-7.724593053808082,-6.875358909740754]},
  right:{heelY:-.0030574266981496477,toeY:-.016939974035467348,
   heelXZ:[-7.637298531970188,-7.031612574960136],
   toeXZ:[-7.883080988889005,-7.146184025685571]}
 };
 const after={
  left:{heelY:.2364,toeY:-.0340,heelXZ:[-7.661,-6.871],
   toeXZ:[-7.722,-6.878]},right:{...before.right}
 };
 const trial={
  upperRad:-.11,lowerRad:.14,footRad:.24,toeRad:-.32,after,
  sourceAdaptiveToeCandidate:{
   source:'verified-original-post-coupled-toe-hinge',
   toeRad:-.32,derivativeMetersPerRad:-.08,
   originalSourceContactLocked:false
  }
 };
 const owner={
  starter:{source:'actual-original-source-three-joint-swing-opportunity',
   expectedSourceSkinnedTrials:2,contactLocked:false,sign:-1,
   excessHeelRiseMeters:.006661908192396038},
  mode:'move',sourceClipName:'Walking_A',sourceWeight:1,
  sourceInstanceSame:true,sourceChainVerified:true,
  sourceUpperTrackVerified:true,sourceLowerTrackVerified:true,
  sourceFootTrackVerified:true,sourceBindVerified:true,
  sourceAnatomicalFootAxisVerified:true,ownerLocomotion:true,
  sourceToeTrackVerified:true,sourceToeChainVerified:true,
  sourceToeSkinnedWeight:.98,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false,
  rootTravel:.0936068512326651,frameAge:.05,
  frameInterval:.2167,side:'left',floorTopY:-.02,before,trials:[trial]
 };
 const accepted=m.chooseOriginalSourceCoupledKneeFootSweep(owner);
 assert.equal(accepted?.source,'measured-original-skinned-coupled-knee-foot');
 assert.equal(accepted?.sourceJointCount,4);
 assert.equal(accepted?.oppositeShoePreserved,true);
 assert.equal(accepted?.contactLocked,false);
 assert.ok(accepted?.toeLiftMeters>.04);
 const illegal=[
  {sourceToeSkinnedWeight:.2},{sourceToeTrackVerified:false},
  {sourceClipName:'Idle'},{frameInterval:.08},{teleport:true},
  {reducedMotion:true},{interrupted:true},{sourceInstanceSame:false},
  {trials:[{...trial,after:{...after,
   right:{...after.right,toeY:before.right.toeY+.020}}}]},
  {trials:[{...trial,after:{...after,
   left:{...after.left,heelY:.30}}}]}
 ];
 for(const change of illegal)
  assert.equal(m.chooseOriginalSourceCoupledKneeFootSweep({...owner,...change}),
   null,'untrusted source/toe/loaded opposite shoe must fail: '+Object.keys(change));
});

test('RED: latest genuine 150ms original toe burial earns a bounded 11/11/24 source-toes child candidate',async()=>{
 const m=await controller();
 // Genuine 19 Nov source-run #44420458247 original mobile Walking_A:
 // left weighted toe -.080332m and heel +.223560m at 150.0ms.
 // Parent -110/+110/+180/+240mrad skinned source attempts all left the
 // toe buried. Synthetic XZ/pivot/skin weights only validate the planner;
 // do NOT present this as a measured after-GLB toe response.
 const raw=toe.slice();raw[1]=-.08033203580294723;
 const sourceFrame={...frame,frameInterval:.15000000000000036,
  sourceToeVertexWorld:raw,
  sourceToePivotWorld:[raw[0]+.08,raw[1]+.018,raw[2]],
  sourceBurialMeters:-.02-raw[1],
  originalFollowups:[
   {upperRad:-.11,lowerRad:.11,footRad:.18},
   {upperRad:-.11,lowerRad:.11,footRad:.24}
  ]};
 const offer=m.planOriginalSourceCoupledToeHingeFollowups(sourceFrame);
 assert.equal(offer?.length,2,'reuse original final two weighted dual-shoe probes');
 assert.equal(offer[1]?.toeRad,-.14);
 assert.equal(offer[1]?.lowerRad,.11);
 const adaptive=m.planOriginalSourceAdaptiveToeHingeProbe({
  source:'verified-original-post-coupled-toe-hinge',
  sourceClipName:'Walking_A',sourceWeight:1,
  frameInterval:.15000000000000036,sourceInstanceSame:true,
  sourceToeTrackVerified:true,sourceToeChainVerified:true,
  sourceToeSkinnedWeight:.98,preplannedToeRad:-.14,
  sourceToeVertexWorld:raw,
  sourceToePivotWorld:[raw[0]+.08,raw[1]+.018,raw[2]],
  sourceToeAxisWorld:[0,0,1],sourceHeelY:.238,
  floorTopY:-.02,ownerLocomotion:true,alive:true,visible:true,
  teleport:false,reducedMotion:false,interrupted:false
 });
 assert.ok(adaptive?.toeRad<0);
 assert.ok(Math.abs(adaptive.toeRad)<=.300001,
  'a genuine 150ms frame cannot flex licensed toes faster than 2rad/s');
 assert.equal(m.planOriginalSourceCoupledToeHingeFollowups({
  ...sourceFrame,frameInterval:.09}),null);
});


test('RED: original mobile 51mm toe burial needs safe licensed toe child option',async()=>{
 const m=await controller();
 // Observed real original GLB mobile tick 14 at 07da791c in
 // GitHub artifact #14595246080. Below 5mm after-hinge displacement
 // is a SYNTHETIC fixture, not a rendered or accepted source pose.
 const loaded={
  heelY:-.006356559943049322,toeY:.019087937062655463,
  heelXZ:[2.155201248034208,-6.956655386533977],
  toeXZ:[1.8862291113395355,-6.931890515256281]
 };
 const swing={
  heelY:.19687350701499604,toeY:-.07114242606245527,
  heelXZ:[2.277478079470471,-7.1129952446315015],
  toeXZ:[2.1501527045106803,-7.133815177051611]
 };
 const before={left:loaded,right:swing};
 const after={left:{...loaded},right:{
  ...swing,heelY:swing.heelY+.0004,toeY:swing.toeY+.005,
  toeXZ:[swing.toeXZ[0]-.002,swing.toeXZ[1]]
 }};
 const proof={
  source:'measured-original-licensed-source-counterpitch',
  sourceClip:'Walking_A',side:'right',
  sourceInstanceId:'source-clone-mobile-example',
  sourceOriginalRootTravelWitnessed:true,
  originalOppositeShoeVerified:true,finalIndependentSourceSkin:true,
  witnessedFrameIntervalSeconds:.0167,
  residualToeBurialMeters:.05114242606245527,
  after:before,contactLocked:false,plantCertified:false
 };
 const params={proof,before,after,side:'right',
  sourceInstanceId:proof.sourceInstanceId,sourceInstanceSame:true,
  sourceClipName:'Walking_A',sourceToeTrackVerified:true,
  sourceToeBoneParentVerified:true,angleRad:.042,floorTopY:-.02};
 const result=m.certifyLicensedCounterpitchToeFinish(params);
 assert.equal(result?.source,'measured-licensed-counterpitch-original-toes-child',
  'verified original 51mm swing burial may partly improve without inventing contact');
 assert.ok(result.residualToeBurialMeters>.045&&
  result.residualToeBurialMeters<proof.residualToeBurialMeters);
 assert.equal(result.originalOppositeShoeVerified,true);
 assert.equal(result.contactLocked,false);
 assert.equal(result.plantCertified,false);
 for(const change of [
  {after:{...after,left:{...loaded,toeY:loaded.toeY+.004}}},
  {after:{...after,right:{...after.right,heelY:swing.heelY+.009}}},
  {after:{...after,right:{...after.right,toeY:swing.toeY-.002}}},
  {sourceInstanceSame:false},{sourceClipName:'Idle'},
  {angleRad:.06},{sourceToeTrackVerified:false},
  {sourceToeBoneParentVerified:false},
  {proof:{...proof,residualToeBurialMeters:.065,after:{
   ...before,right:{...before.right,toeY:-.085}}},before:{
    ...before,right:{...before.right,toeY:-.085}}}
 ]){
  assert.equal(m.certifyLicensedCounterpitchToeFinish({...params,...change}),null,
   'wrong source, heel, opposite shoe, toe direction, angle rate or unproven deep burial must reject');
 }
 const renderer=fs.readFileSync(path.resolve(__dirname,
  '../../public/ai-dungeon/model-assets.js'),'utf8');
 const live=renderer.slice(renderer.indexOf('function stageLicensedSourceToeFinisherAfterCounterpitch('),
  renderer.indexOf('function stageOriginalSourceSwingLinkedToesAfterMixer('));
 assert.match(live,/sourceSkinnedSoleWorld/);
 assert.match(live,/certifyLicensedCounterpitchToeFinish/);
 assert.match(live,/originalSwingToeJointRestore/);
});


test('RED: verified sparse 315ms source counterpitch must permit a rate-bounded original toes-child finish',async()=>{
 const m=await controller();
 // Genuine imported-source RAF pairing reached a 315.3ms visible interval
 // in desktop/mobile 59f0cbf3 WebGL evidence. The shoe response below is
 // synthetic contract data, NOT an observed correction or contact proof.
 const before={
  left:{heelY:-.01,toeY:.01,heelXZ:[0,0],toeXZ:[0,.18]},
  right:{heelY:.19,toeY:-.071,heelXZ:[.3,0],toeXZ:[.3,.18]}
 };
 const after={
  left:{...before.left},
  right:{...before.right,toeY:-.065,heelY:.1905,
   toeXZ:[.302,.18]}
 };
 const proof={
  source:'measured-original-licensed-source-counterpitch',
  sourceClip:'Walking_A',side:'right',sourceInstanceId:'verified-sparse-clone',
  finalIndependentSourceSkin:true,
  originalOppositeShoeVerified:true,
  sourceOriginalRootTravelWitnessed:true,
  witnessedFrameIntervalSeconds:.3153,
  sparseFrameVerified:true,
  witnessedDirectFrameTravelMeters:.087,
  witnessedRootTravelMeters:.087,
  witnessedFrameAgeSeconds:.02,
  residualToeBurialMeters:.051,
  after:before,contactLocked:false,plantCertified:false
 };
 const args={proof,before,after,side:'right',sourceInstanceId:proof.sourceInstanceId,
  sourceInstanceSame:true,sourceClipName:'Walking_A',
  sourceToeTrackVerified:true,sourceToeBoneParentVerified:true,
  angleRad:-.12,floorTopY:-.02};
 const accepted=m.certifyLicensedCounterpitchToeFinish(args);
 assert.equal(accepted?.source,'measured-licensed-counterpitch-original-toes-child');
 assert.ok(accepted.toeLiftMeters>=.0059&&accepted.toeLiftMeters<.007);
 assert.equal(accepted.contactLocked,false);
 assert.equal(accepted.plantCertified,false);
 for(const altered of [
  {sparseFrameVerified:false},
  {witnessedDirectFrameTravelMeters:.005},
  {witnessedRootTravelMeters:.060},
  {witnessedFrameAgeSeconds:.051},
  {witnessedFrameIntervalSeconds:.421},
  {witnessedFrameIntervalSeconds:.3153,sourceOriginalRootTravelWitnessed:false}
 ]){
  assert.equal(m.certifyLicensedCounterpitchToeFinish({...args,
    proof:{...proof,...altered}}),null,
   'unwitnessed/stale sparse original GLB pose may never finish its toe child');
 }
});


test('RED: pinned original Walking_A toe keyframes can guide a strictly source-owned extra swing probe',async()=>{
 const m=await controller();
 assert.equal(typeof m.planLicensedSourceToePhaseProbe,'function',
  'requires an actual licensed-source phase-informed toe probe, not a guessed joint axis');
 // Exact original player_swordsman.glb Walking_A toes.r quaternion
 // accessor samples, pinned via assets/PROVENANCE.md. Sampled pose/angles
 // are genuine SOURCE DATA; resulting relief is not yet WebGL-proven.
 const times=Float32Array.from([0,.0416666679084301,.0833333358168602,
  .125,.1666666716337204,.2083333283662796,.25]);
 const values=Float32Array.from([
  .000000149,.767442644,-.641117573,.000000020,
  .000000146,.810950756,-.585114479,.000000023,
  .000000138,.878476143,-.477786243,.000000030,
  .000000063,.915839851,-.401543707,.000000060,
  .000000040,.911231518,-.411894530,.000000069,
  .000000044,.883440137,-.468544155,.000000066,
  .000000094,.859088480,-.511827111,.000000046
 ]);
 const tracks=[{name:'toesr.quaternion',times,values}];
 const duration=1.0416666,sourceTimeSeconds=.105;
 const original=m.sampleLicensedIdleJointQuaternionAtPhase(
  tracks,'toesr',sourceTimeSeconds/duration,duration).quaternion;
 const args={sourceClipName:'Walking_A',sourceInstanceSame:true,
  sourceToeTrackVerified:true,sourceToeBoneParentVerified:true,
  sourceRootTravelVerified:true,sourceWeight:1,
  ownerLocomotion:true,alive:true,visible:true,
  interrupted:false,teleport:false,reducedMotion:false,
  sourceToeBoneName:'toesr',side:'right',tracks,
  sourceToeAppliedAxis:[1,0,0],
  sourceTimeSeconds,sourceDurationSeconds:duration,
  originalQuaternion:original,frameInterval:.0333};
 const result=m.planLicensedSourceToePhaseProbe(args);
 assert.equal(result?.source,'original-Walking_A-authored-toe-phase');
 assert.equal(result.sourceTrackName,'toesr.quaternion');
 assert.equal(result.provenance,'licensed-original-clip-7-keyframe-diagnostic');
 assert.ok(result.extraAngleRad>-.099901&&result.extraAngleRad<.099901,
  'extra candidate must not spend more than witnessed 3rad/s');
 assert.ok(Math.abs(result.extraAngleRad)>=.018);
 // The imported original Walking_A hinge audit may choose NEGATIVE local X
 // as its peak licensed axis. The generated angle must therefore invert
 // with the actual world-to-local source adapter, never invert the motion.
 const reverseAxis=m.planLicensedSourceToePhaseProbe({
  ...args,sourceToeAppliedAxis:[-1,0,0]});
 assert.equal(reverseAxis?.source,result.source);
 assert.ok(Math.abs(reverseAxis.extraAngleRad+result.extraAngleRad)<1e-7,
  'source-sampled hinge direction must map to the signed imported joint axis');
 assert.equal(result.contactLocked,false);
 assert.equal(result.plantCertified,false);
 // Same verified source bone but different actual animation owners,
 // skin, clone or frame MUST fail closed. No invented aim or foot contact.
 for(const altered of [
  {sourceClipName:'Idle'},{sourceInstanceSame:false},
  {sourceToeTrackVerified:false},{sourceToeBoneParentVerified:false},
  {sourceRootTravelVerified:false},{sourceWeight:.83},
  {ownerLocomotion:false},{alive:false},{visible:false},
  {interrupted:true},{teleport:true},{reducedMotion:true},
  {sourceToeBoneName:'toesl'}, {sourceTimeSeconds:.99},
  {sourceToeAppliedAxis:undefined},
  {sourceToeAppliedAxis:[0,1,0]},
  {sourceToeAppliedAxis:[.1,.99,0]},
  {frameInterval:.5},{frameInterval:.005},
  {originalQuaternion:[0,0,0,1]},
  {tracks:[{name:'toesr.quaternion',times,values:Float32Array.from(values.slice(0,8))}]}
 ]){
  assert.equal(m.planLicensedSourceToePhaseProbe({...args,...altered}),null,
   'reject unowned, non-source, unsafe, invalid or stale toe retiming '+Object.keys(altered));
 }
 const renderer=fs.readFileSync(path.resolve(__dirname,
  '../../public/ai-dungeon/model-assets.js'),'utf8');
 const live=renderer.slice(renderer.indexOf(
  'function stageLicensedSourceToeFinisherAfterCounterpitch('),
  renderer.indexOf('function stageOriginalSourceSwingLinkedToesAfterMixer('));
 assert.match(live,/planLicensedSourceToePhaseProbe/);
 assert.match(live,/certifyLicensedCounterpitchToeFinish/);
 assert.match(live,/originalSwingToeJointRestore/);
});
test('RED: exact original mobile f97 95.697mm source toe burial admits measured, bounded toe-only relief',async()=>{
 const m=await controller();
 // REAL BEFORE: exact 6cb8 source-rig mobile frame97, authority tick14,
 // Walking_A 0.6194s. Previous original 41-joint hip/knee/ankle trial
 // raised the source toe 4.915mm but left 95.696860mm below stone.
 // AFTER is explicitly SYNTHETIC contract data, NOT a witnessed GLB pose.
 const before={
  left:{heelY:.16377622354364688,toeY:-.11569686049665617,
   heelXZ:[2.289809108915604,-6.9437442221808],
   toeXZ:[2.1830647270323738,-6.933448925885964]},
  right:{heelY:-.04217560803346984,toeY:-.0066379985780012155,
   heelXZ:[2.1720750277472916,-7.108004229780754],
   toeXZ:[1.903985109162657,-7.131467546160955]}
 };
 const after={left:{...before.left,
  heelY:before.left.heelY-.0002,
  toeY:before.left.toeY+.009,
  toeXZ:[before.left.toeXZ[0]-.001,before.left.toeXZ[1]]},
  right:{...before.right}};
 const proof={
  source:'measured-original-licensed-source-counterpitch',
  sourceClip:'Walking_A',side:'left',
  sourceInstanceId:'original-native-6cb8-mobile-f97',
  sourceClipTimeSeconds:.6193999961754562,
  sourceOriginalRootTravelWitnessed:true,
  originalOppositeShoeVerified:true,finalIndependentSourceSkin:true,
  witnessedRootTravelMeters:.019344653630752218,
  witnessedDirectFrameTravelMeters:.019344653630752218,
  witnessedFrameIntervalSeconds:.033400000000007424,
  witnessedFrameAgeSeconds:0,
  residualToeBurialMeters:.09569686049665617,
  after:before,contactLocked:false,plantCertified:false
 };
 const args={proof,before,after,side:'left',
  sourceInstanceId:proof.sourceInstanceId,sourceInstanceSame:true,
  sourceClipName:'Walking_A',sourceToeTrackVerified:true,
  sourceToeBoneParentVerified:true,angleRad:.08,floorTopY:-.02};
 const result=m.certifyLicensedCounterpitchToeFinish(args);
 assert.equal(result?.source,'measured-licensed-counterpitch-original-toes-child',
  'witnessed 95.697mm original deep swing should qualify for a 9mm conservative partial rescue');
 assert.equal(result.sourceDeepSwingToeRelief,true);
 assert.ok(result.residualToeBurialMeters>.08,
  'partial relief must NOT be misrepresented as planted or cleared');
 assert.equal(result.contactLocked,false);
 assert.equal(result.plantCertified,false);
 for(const change of [
  {after:{...after,left:{...after.left,toeY:before.left.toeY+.013}}},
  {after:{...after,left:{...after.left,heelY:before.left.heelY+.004}}},
  {after:{...after,right:{...before.right,toeY:before.right.toeY+.005}}},
  {proof:{...proof,witnessedFrameAgeSeconds:.06}},
  {proof:{...proof,witnessedRootTravelMeters:.002}},
  {proof:{...proof,sourceClipTimeSeconds:.412}},
  {angleRad:.13},{sourceInstanceSame:false},{sourceClipName:'Hit_A'}
 ]) assert.equal(m.certifyLicensedCounterpitchToeFinish({...args,...change}),null,
  'reject non-source, stale, over-speed, heel/opposite-foot drift, non-swing or false clearance: '+Object.keys(change));
 const deeper={...before,left:{...before.left,toeY:-.1315}};
 const afterDeeper={...after,left:{...after.left,toeY:-.1225}};
 assert.equal(m.certifyLicensedCounterpitchToeFinish({...args,
  before:deeper,after:afterDeeper,proof:{...proof,after:deeper,
   residualToeBurialMeters:.1115}}),null,
  'never widen correction to unvalidated >110mm original swing burial');
 const renderer=fs.readFileSync(path.resolve(__dirname,
  '../../public/ai-dungeon/model-assets.js'),'utf8');
 const stage=renderer.slice(renderer.indexOf(
  'function stageLicensedSourceToeFinisherAfterCounterpitch('),
  renderer.indexOf('function stageOriginalSourceSwingLinkedToesAfterMixer('));
 assert.match(stage,/const deepSourceWindow=residual>\.055&&residual<=\.110/,
  'both source renderer and independent certificate must admit the same witnessed 95.7mm window');
});


test('RED: 60Hz original toes.l phase travel must admit a rate-bounded partial authored arc on the real 0.610s source frame',async()=>{
 const m=await controller();
 // Pin exact original CC0 player_swordsman.glb Walking_A toes.l quaternion
 // samples surrounding native 390px tick2 at 0.6103124s. This is
 // SOURCE CLIP DATA, not an observed after-change skin or planted shoe.
 const times=Float32Array.from([.5416666865,.5833333135,.625,.6666666865,.7083333135]);
 const values=Float32Array.from([
  -.0000001,.7746965,-.6323333,.0000002,
  -.0000001,.8255442,-.5643374,.0000002,
  -.0000001,.8903230,-.4553295,.0000002,
   0,.9203548,-.3910845,.0000002,
   0,.9059688,-.4233444,.0000002
 ]);
 const tracks=[{name:'toesl.quaternion',times,values}];
 const sourceTimeSeconds=.6103124110738106,duration=1.0416666;
 const original=m.sampleLicensedIdleJointQuaternionAtPhase(
  tracks,'toesl',sourceTimeSeconds/duration,duration)?.quaternion;
 assert.ok(original,'source quaternion must be available from exact original joint keys');
 const args={sourceClipName:'Walking_A',sourceInstanceSame:true,
  sourceToeTrackVerified:true,sourceToeBoneParentVerified:true,
  sourceRootTravelVerified:true,sourceWeight:1,
  ownerLocomotion:true,alive:true,visible:true,
  interrupted:false,teleport:false,reducedMotion:false,
  sourceToeBoneName:'toesl',side:'left',tracks,
  sourceToeAppliedAxis:[1,0,0],sourceTimeSeconds,
  sourceDurationSeconds:duration,originalQuaternion:original,
  frameInterval:.0167};
 const result=m.planLicensedSourceToePhaseProbe(args);
 assert.equal(result?.source,'original-Walking_A-authored-toe-phase',
  'a real 25ms source-keyframe arc larger than 60Hz angular allowance must permit a SMALLER partial authored arc, not silently discard all authored evidence');
 assert.ok(Math.abs(result.extraAngleRad)>=.018);
 assert.ok(Math.abs(result.extraAngleRad)<=3*.0167*.8+1e-8,
  'partial clip arc must remain inside the original 3rad/s 60Hz joint budget');
 assert.ok(Math.abs(result.sourceTargetTimeSeconds-sourceTimeSeconds)<=.02501);
 const inverted=m.planLicensedSourceToePhaseProbe({...args,sourceToeAppliedAxis:[-1,0,0]});
 assert.ok(Math.abs(inverted.extraAngleRad+result.extraAngleRad)<1e-6,
  'signed imported toe axis must not reverse the intended original arc');
 for(const invalid of [{sourceClipName:'Idle'},{sourceInstanceSame:false},
  {sourceRootTravelVerified:false},{reducedMotion:true},
  {sourceToeBoneName:'toesr'},{sourceToeAppliedAxis:[0,1,0]},
  {sourceTimeSeconds:.94},{originalQuaternion:[0,0,0,1]},
  {frameInterval:.5}]){
  assert.equal(m.planLicensedSourceToePhaseProbe({...args,...invalid}),null,
   'strict original-rig clip, owner, bone and witness guards remain necessary');
 }
});
