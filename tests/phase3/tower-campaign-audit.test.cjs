'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {REQUIRED,auditTowerCampaigns}=require('../../scripts/tower-campaign-audit.cjs');
const SHA='a'.repeat(40);
function witness(complete=true){
 const markers=Object.fromEntries(REQUIRED.map((key,i)=>[key,{tick:i+1,floor:i<6?8:9}]));
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
