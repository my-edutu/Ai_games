'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {REQUIRED,auditTowerCampaigns}=require('../../scripts/tower-campaign-audit.cjs');
const SHA='a'.repeat(40);
function witness(complete=true){
 const markers=Object.fromEntries(REQUIRED.map((key,i)=>[
   key,{tick:key==='restarted'?0:i+1,floor:i<5?8:i<9?9:8}]));
 Object.assign(markers.crusherPressureSurvived,
   {hazardId:'f8:guardian-shutter',warningTicks:3});
 Object.assign(markers.groundedEarnedWalk,{capId:'f8:cap',x:100000});
 Object.assign(markers.advancedOnCap,{x:120000});
 Object.assign(markers.earnedFloorNine,{capId:'f8:cap',guardianId:'f8:guardian',
   clearanceX:130000,observedActualCrossingX:135000});
 Object.assign(markers.sourceResult,{kind:'game'});
 Object.assign(markers.restarted,{nextRunId:'real-run-b'});
 return {kind:'source-only-guardian-campaign',fixedStepHz:20,steps:3200,launchFloor:8,
  guardianDefeats:1,causalEpisodeProof:{kind:'unmodified-fixed-step-source-episode-chain',
   fullSourceChainObserved:complete,
   episodes:[{episode:0,runId:'real-run-a',firstFloor:8,
     completeSourceChain:complete,firstMissing:complete?null:'guardianDefeated',
     markers:complete?markers:{liveGuardian:markers.liveGuardian}}]}};
}
test('identical actual-shape complete source campaigns are source-only, never transformation passes',()=>{
 const a=witness();const r=auditTowerCampaigns(a,structuredClone(a),SHA);
 assert.equal(r.fullSameRunSourceChainObserved,true);
 assert.equal(r.deterministicExactReplay,true);
 assert.equal(r.sourceEvidenceStatus,'COMPLETE_SOURCE_EPISODE_ONLY');
 assert.equal(r.transformationVerdict,'NOT EVALUATED');
});
test('source run that never completes cannot be reported as full loop',()=>{
 const a=witness(false);const r=auditTowerCampaigns(a,structuredClone(a),SHA);
 assert.equal(r.fullSameRunSourceChainObserved,false);
 assert.equal(r.sourceEvidenceStatus,'SOURCE_EPISODE_INCOMPLETE');
 assert.equal(r.actualEpisodes[0].firstMissing,'guardianDefeated');
});
test('replay divergence and a forged completion flag are both rejected',()=>{
 const a=witness(); const b=structuredClone(a);b.guardianDefeats=3;
 assert.match(auditTowerCampaigns(a,b,SHA).issues.join(' '),/diverged/);
 const forged=witness();delete forged.causalEpisodeProof.episodes[0].markers.earnedFloorNine;
 assert.match(auditTowerCampaigns(forged,structuredClone(forged),SHA).issues.join(' '),/incomplete/);
});
test('wrong campaign config and unpinned input never certify a source chain',()=>{
 const a=witness();a.launchFloor=0;
 const result=auditTowerCampaigns(a,structuredClone(a),'HEAD');
 assert.equal(result.fullSameRunSourceChainObserved,false);
 assert.equal(result.issues.length,3);
});

test('counterfeit complete episodes cannot pass with out-of-order beats or wrong floors',()=>{
 for(const tamper of [
  m=>{m.advancedOnCap.tick=m.groundedEarnedWalk.tick-1},
  m=>{m.crusherPressureSurvived.tick=m.guardianDefeated.tick+1},
  m=>{m.guardianDefeated.floor=9},
  m=>{m.earnedFloorNine.floor=8}
 ]){
  const a=witness();tamper(a.causalEpisodeProof.episodes[0].markers);
  const r=auditTowerCampaigns(a,structuredClone(a),SHA);
  assert.equal(r.fullSameRunSourceChainObserved,false);
  assert.equal(r.sourceEvidenceStatus,'INVALID_OR_NONDETERMINISTIC_SOURCE_EVIDENCE');
 }
});
test('source gateway and restarting need actual geometry, pressure and game result',()=>{
 for(const tamper of [
  m=>{m.earnedFloorNine.observedActualCrossingX=m.earnedFloorNine.clearanceX-1},
  m=>{m.advancedOnCap.x=m.groundedEarnedWalk.x},
  m=>{m.crusherPressureSurvived.hazardId='f9:guardian-shutter'},
  m=>{m.sourceResult.kind='technical'},
  m=>{m.restarted.nextRunId='real-run-a'}
 ]){
  const a=witness();tamper(a.causalEpisodeProof.episodes[0].markers);
  const r=auditTowerCampaigns(a,structuredClone(a),SHA);
  assert.equal(r.fullSameRunSourceChainObserved,false);
  assert.equal(r.sourceEvidenceStatus,'INVALID_OR_NONDETERMINISTIC_SOURCE_EVIDENCE');
 }
});
