const test=require('node:test');
const assert=require('node:assert/strict');
const {createReleaseManifest,assessTraceability}=require('../../dist/packages/release-governance/src/index.js');
const {assessReadiness}=require('../../dist/packages/readiness-assessor/src/index.js');
function manifest(){return createReleaseManifest({releaseId:'r5',candidateSourceSha:'74e9319f74985e224f3abd909a6d19ba06ac996d',createdAtMs:1,versions:{platform:'0.6.0',game:'1',deterministic:'snake-r2',snapshot:'1',event:'1',providerAdapters:'2026-08-16',configHash:'cfg',contentHash:'content',assetsHash:'assets',deploymentArtifact:'image@sha256:candidate'},environment:{name:'production',region:'eu',hardwareRef:'prod',productionReference:true},featureFlags:{chatVsAi:true},owners:{release:'release',onCall:'oncall',security:'security',product:'product'},rollback:{sourceSha:'bee0d26e8746a554c96afaedbd1ad5a9842dabc6',deploymentArtifact:'image@sha256:previous',configHash:'oldcfg',contentHash:'oldcontent',freshRunBoundary:true},artifacts:[{name:'bundle',kind:'release',digest:'sha256:deadbeef'}]});}
function trace(release){return assessTraceability([{id:'MUST',phase:6,level:'MUST',owner:'release'}],[{requirementId:'MUST',status:'pass',sourceSha:release.candidateSourceSha,releaseChecksum:release.checksum,digest:'sha256:abcdef12',collectedAtMs:1,owner:'release'}],{release,nowMs:2});}
function campaign(overrides={}){return{schemaVersion:1,totalInvariantFailures:0,totalDuplicateApplications:0,deterministicRerunReady:true,reportChecksum:'abcd1234',scenarios:[{technicalOutcomes:0,prohibitedTerminalEffects:0}],...overrides};}
function input(overrides={}){const release=manifest();return{manifest:release,traceability:trace(release),campaign:campaign(),capacity:{performancePass:true,productionReferenceSatisfied:true,blockers:[]},endurance:{status:'pass',blockers:[],integrityFailures:[],elapsedHours:72},providers:{status:'pass',blockers:[]},safety:{status:'pass',blockers:[]},drills:{implementationStatus:'pass',productionStatus:'pass',implementationBlockers:[],productionBlockers:[],completed:26,missing:[],duplicates:[]},canary:{status:'eligible',elapsedMs:7*24*3600000,sampleCount:168,blockers:[]},independentReview:{status:'pass',candidateChecksum:release.checksum,reviewer:'independent-reviewer',source:'external-signed',evidenceDigest:'sha256:feedface',openP0:0,openP1:0,acceptedP2:[]},findings:{openP0:0,openP1:0,acceptedP2:[]},...overrides};}

test('all current real gates plus independent review return R5 PASS',()=>{
  const result=assessReadiness(input());assert.equal(result.verdict,'PASS');assert.equal(result.highestTruthfulReadiness,'R5');assert.equal(result.productionReady,true);assert.deepEqual(result.blockers,[]);
});

test('fully green implementation with synthetic/missing external evidence remains BLOCKED at R4',()=>{
  const data=input({capacity:{performancePass:true,productionReferenceSatisfied:false,blockers:[]},endurance:{status:'blocked',blockers:['real-elapsed-evidence'],integrityFailures:[],elapsedHours:1000},providers:{status:'blocked',blockers:['youtube:not-credentialed']},safety:{status:'blocked',blockers:['audiovisual:not-production-equivalent']},drills:{implementationStatus:'pass',productionStatus:'blocked',implementationBlockers:[],productionBlockers:['rollback:not-production-equivalent'],completed:26,missing:[],duplicates:[]},canary:{status:'blocked',elapsedMs:30*24*3600000,sampleCount:1000,blockers:['real-production-evidence']},independentReview:{status:'missing',candidateChecksum:'',reviewer:'',source:'none',evidenceDigest:'',openP0:0,openP1:0,acceptedP2:[]}});
  const result=assessReadiness(data);assert.equal(result.verdict,'BLOCKED');assert.equal(result.highestTruthfulReadiness,'R4');assert.equal(result.productionReady,false);assert.ok(result.blockers.includes('production-reference-capacity'));assert.ok(result.blockers.includes('independent-review'));
});

test('open P0/P1 or deterministic integrity failure returns FAIL, not BLOCKED',()=>{
  const result=assessReadiness(input({campaign:campaign({totalInvariantFailures:1}),findings:{openP0:0,openP1:1,acceptedP2:[]}}));assert.equal(result.verdict,'FAIL');assert.equal(result.productionReady,false);assert.ok(result.failures.includes('campaign-integrity'));assert.ok(result.failures.includes('open-P1'));
});

test('canary rollback or failed endurance is a release failure',()=>{
  const result=assessReadiness(input({canary:{status:'rollback',elapsedMs:1,sampleCount:1,blockers:['rollback-triggered']},endurance:{status:'fail',elapsedHours:72,blockers:['replay-divergence'],integrityFailures:['replay-divergence']}}));assert.equal(result.verdict,'FAIL');assert.ok(result.failures.includes('canary-rollback'));assert.ok(result.failures.includes('endurance-integrity'));
});

test('independent review must be current, external, signed and for the exact candidate',()=>{
  const release=manifest();const result=assessReadiness(input({manifest:release,traceability:trace(release),independentReview:{status:'pass',candidateChecksum:'other',reviewer:'',source:'ci',evidenceDigest:'bad',openP0:0,openP1:0,acceptedP2:[]}}));assert.equal(result.verdict,'BLOCKED');assert.ok(result.blockers.includes('independent-review-candidate'));assert.ok(result.blockers.includes('independent-review-source'));assert.ok(result.blockers.includes('independent-review-digest'));
});

test('accepted P2 findings remain visible without preventing PASS',()=>{
  const result=assessReadiness(input({findings:{openP0:0,openP1:0,acceptedP2:['P2-123']},independentReview:{...input().independentReview,acceptedP2:['P2-123']}}));assert.equal(result.verdict,'PASS');assert.deepEqual(result.acceptedRisks,['P2-123']);
});

test('readiness result is deterministic and deeply immutable',()=>{
  const a=assessReadiness(input()),b=assessReadiness(input());assert.deepEqual(a,b);assert.equal(Object.isFrozen(a),true);assert.throws(()=>{a.verdict='FAIL'},TypeError);
});