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
