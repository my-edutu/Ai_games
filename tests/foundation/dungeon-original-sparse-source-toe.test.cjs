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
