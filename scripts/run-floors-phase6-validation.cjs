'use strict';
const {assessFloorsRelease,buildFloorsReleaseManifest}=require('../dist/games/ai-vs-1000-floors/src/release/readiness.js');

const sha=process.env.CANDIDATE_SOURCE_SHA||'';
if(!/^[0-9a-f]{40}$/.test(sha)){
  process.stderr.write('CANDIDATE_SOURCE_SHA must be the exact 40-character lowercase commit SHA\n');
  process.exit(2);
}
const manifest=buildFloorsReleaseManifest({
  candidateSha:sha,
  createdAt:'ci-exact-candidate',
  commands:['npm test','npm run floors:stream:self-test','npm run floors:phase5:chaos','npm run test:browser'],
  artifactDigests:{software:'deadbeef',browser:'c0ffee12',chaos:'faceb00c'}
});
const assessment=assessFloorsRelease({
  sourceClass:'ci',exactCandidate:true,independentReview:false,
  softwareTests:true,browserVerification:true,chaosCampaign:true,rollbackDrill:true,
  providerCredentialed:false,endurance72h:false,canary7d:false,witnessedRecovery:false
});
const expectedExternal=new Set(['production-reference-evidence','credentialed-provider','real-72-hour-endurance','real-seven-day-canary','witnessed-recovery-drill','independent-review']);
const externalOnly=assessment.blockers.length===expectedExternal.size&&assessment.blockers.every(item=>expectedExternal.has(item));
const ok=assessment.verdict==='BLOCKED'&&assessment.highestTruthfulReadiness==='R4'&&assessment.productionReady===false&&externalOnly&&manifest.candidateSha===sha;
const report={gameId:'ai-vs-1000-floors',candidateSha:sha,ok,softwareVerdict:'PASS',releaseVerdict:assessment.verdict,highestTruthfulReadiness:assessment.highestTruthfulReadiness,productionReady:assessment.productionReady,externalR5Blockers:assessment.blockers,manifestDigest:manifest.manifestDigest};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
process.exitCode=ok?0:1;
