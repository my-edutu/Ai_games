const test=require('node:test');
const assert=require('node:assert/strict');
const {assessProviderEvidence,assessSafetyAttestations,MANDATORY_DRILLS,assessDrillProgramme}=require('../../dist/packages/release-validation/src/index.js');
const candidate='candidate-checksum';
function provider(name,overrides={}){return{provider:name,candidateChecksum:candidate,environment:'production-equivalent',credentialed:true,productionEquivalent:true,source:'external-signed',collectedAtMs:1000,expiresAtMs:2000,evidenceDigest:'sha256:deadbeef',checks:{authentication:true,reconnect:true,duplicates:true,reversal:true,outage:true,rateLimit:true},...overrides};}

test('provider gate requires current credentialed production-equivalent evidence for each provider',()=>{
  const result=assessProviderEvidence([provider('youtube'),provider('twitch')],{expectedCandidateChecksum:candidate,nowMs:1500,requiredProviders:['youtube','twitch']});
  assert.equal(result.status,'pass');
  assert.deepEqual(result.blockers,[]);
});

test('fixture or unauthenticated provider evidence cannot satisfy live validation',()=>{
  const result=assessProviderEvidence([provider('youtube',{environment:'fixture',credentialed:false,productionEquivalent:false,source:'ci'}),provider('twitch')],{expectedCandidateChecksum:candidate,nowMs:1500,requiredProviders:['youtube','twitch']});
  assert.equal(result.status,'blocked');
  assert.ok(result.blockers.includes('youtube:not-credentialed'));
  assert.ok(result.blockers.includes('youtube:not-production-equivalent'));
  assert.ok(result.blockers.includes('youtube:not-external-signed'));
});

test('expired, wrong-candidate or incomplete provider evidence is rejected',()=>{
  const result=assessProviderEvidence([provider('youtube',{candidateChecksum:'old',expiresAtMs:1200,checks:{authentication:true,reconnect:true,duplicates:false,reversal:true,outage:true,rateLimit:true}})],{expectedCandidateChecksum:candidate,nowMs:1500,requiredProviders:['youtube','twitch']});
  assert.equal(result.status,'blocked');
  assert.ok(result.blockers.includes('youtube:candidate-mismatch'));
  assert.ok(result.blockers.includes('youtube:expired'));
  assert.ok(result.blockers.includes('youtube:duplicates'));
  assert.ok(result.blockers.includes('twitch:missing'));
});

function safety(kind,overrides={}){return{kind,candidateChecksum:candidate,environment:'production-equivalent',source:'external-signed',status:'pass',collectedAtMs:1000,expiresAtMs:3000,evidenceDigest:'sha256:cafebabe',reviewer:'reviewer',blockingFindings:0,details:{},...overrides};}

test('security privacy moderation accessibility audiovisual assets and supply chain all require clean attestations',()=>{
  const kinds=['security','privacy','moderation','accessibility','audiovisual','assets','supply-chain'];
  const result=assessSafetyAttestations(kinds.map(kind=>safety(kind)),{expectedCandidateChecksum:candidate,nowMs:2000,requiredKinds:kinds});
  assert.equal(result.status,'pass');
});

test('safety evidence blocks stale, synthetic, missing-review or blocking-finding records',()=>{
  const result=assessSafetyAttestations([
    safety('security',{source:'ci'}),
    safety('privacy',{expiresAtMs:1500}),
    safety('moderation',{reviewer:''}),
    safety('accessibility',{blockingFindings:1})
  ],{expectedCandidateChecksum:candidate,nowMs:2000,requiredKinds:['security','privacy','moderation','accessibility','audiovisual']});
  assert.equal(result.status,'blocked');
  assert.ok(result.blockers.includes('security:not-external-signed'));
  assert.ok(result.blockers.includes('privacy:expired'));
  assert.ok(result.blockers.includes('moderation:missing-reviewer'));
  assert.ok(result.blockers.includes('accessibility:blocking-findings'));
  assert.ok(result.blockers.includes('audiovisual:missing'));
});

function drill(id,overrides={}){return{id,candidateChecksum:candidate,environment:'production-equivalent',source:'external-signed',owner:'oncall',witness:'independent',runbook:`runbooks/${id}.md`,startedAtMs:1000,endedAtMs:1100,status:'pass',evidenceDigest:'sha256:abcdef12',automatedActionsVerified:true,outputVerified:true,...overrides};}

test('mandatory drill programme passes only when every required drill has production-equivalent evidence',()=>{
  const result=assessDrillProgramme(MANDATORY_DRILLS.map(id=>drill(id)),{expectedCandidateChecksum:candidate});
  assert.equal(result.implementationStatus,'pass');
  assert.equal(result.productionStatus,'pass');
  assert.equal(result.completed,MANDATORY_DRILLS.length);
  assert.deepEqual(result.missing,[]);
});

test('synthetic drill suite proves implementation but cannot satisfy production operations',()=>{
  const result=assessDrillProgramme(MANDATORY_DRILLS.map(id=>drill(id,{environment:'ci',source:'synthetic',witness:''})),{expectedCandidateChecksum:candidate});
  assert.equal(result.implementationStatus,'pass');
  assert.equal(result.productionStatus,'blocked');
  assert.ok(result.productionBlockers.some(x=>x.endsWith(':not-production-equivalent')));
});

test('failed, duplicate, wrong-candidate or incomplete drills block both programme verdicts',()=>{
  const records=[...MANDATORY_DRILLS.slice(0,-1).map(id=>drill(id))];
  records.push(drill(MANDATORY_DRILLS[0],{status:'fail'}));
  records.push(drill('verified-restore',{candidateChecksum:'old'}));
  const result=assessDrillProgramme(records,{expectedCandidateChecksum:candidate});
  assert.equal(result.implementationStatus,'blocked');
  assert.equal(result.productionStatus,'blocked');
  assert.ok(result.missing.includes(MANDATORY_DRILLS.at(-1)));
  assert.ok(result.duplicates.includes(MANDATORY_DRILLS[0]));
  assert.ok(result.implementationBlockers.some(x=>x.includes('status-fail')));
  assert.ok(result.implementationBlockers.some(x=>x.includes('candidate-mismatch')));
});