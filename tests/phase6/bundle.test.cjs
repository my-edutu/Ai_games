const test=require('node:test');
const assert=require('node:assert/strict');
const {createCurrentValidationBundle}=require('../../dist/packages/release-validation/src/index.js');
const SHA='0123456789abcdef0123456789abcdef01234567';

test('current CI bundle is deterministic, internally complete and truthfully blocked at R4',()=>{
  const a=createCurrentValidationBundle(SHA),b=createCurrentValidationBundle(SHA);
  assert.deepEqual(a,b);
  assert.equal(a.manifest.candidateSourceSha,SHA);
  assert.equal(a.traceability.status,'complete');
  assert.equal(a.campaign.totalInvariantFailures,0);
  assert.equal(a.campaign.totalDuplicateApplications,0);
  assert.equal(a.drills.implementationStatus,'pass');
  assert.equal(a.drills.productionStatus,'blocked');
  assert.equal(a.readiness.verdict,'BLOCKED');
  assert.equal(a.readiness.highestTruthfulReadiness,'R4');
  assert.equal(a.readiness.productionReady,false);
  assert.match(a.bundleChecksum,/^[a-f0-9]{8}$/);
});

test('bundle preserves all genuine external launch blockers',()=>{
  const bundle=createCurrentValidationBundle(SHA),blockers=bundle.readiness.blockers.join('\n');
  assert.match(blockers,/production-reference-capacity/);
  assert.match(blockers,/endurance/);
  assert.match(blockers,/provider-validation/);
  assert.match(blockers,/safety-attestations/);
  assert.match(blockers,/production-drills/);
  assert.match(blockers,/seven-day-canary/);
  assert.match(blockers,/independent-review/);
});

test('synthetic elapsed timestamps and fixture providers cannot accidentally promote the bundle',()=>{
  const bundle=createCurrentValidationBundle(SHA);
  assert.equal(bundle.endurance.status,'blocked');
  assert.ok(bundle.endurance.blockers.includes('real-elapsed-evidence'));
  assert.equal(bundle.providers.status,'blocked');
  assert.ok(bundle.providers.blockers.some(value=>value.includes('not-credentialed')));
  assert.equal(bundle.canary.status,'blocked');
  assert.ok(bundle.canary.blockers.includes('real-production-evidence'));
});

test('bundle rejects non-commit source identifiers',()=>{
  assert.throws(()=>createCurrentValidationBundle('branch-name'),e=>e.code==='INVALID_CANDIDATE_SHA');
});