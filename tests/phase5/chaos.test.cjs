const test=require('node:test');
const assert=require('node:assert/strict');
const {runPhase5Chaos}=require('../../dist/packages/chaos-harness/src/index.js');

test('compressed Phase 5 chaos campaign is deterministic and preserves integrity',()=>{
  const a=runPhase5Chaos('phase5-chaos');
  const b=runPhase5Chaos('phase5-chaos');
  assert.deepEqual(a,b);
  assert.equal(a.invariantFailures,0);
  assert.equal(a.duplicateEventIds,0);
  assert.equal(a.eventSequenceContiguous,true);
  assert.equal(a.recoveryStatus,'restored');
  assert.ok(a.rejectedRecoveryEvidence>=1);
  assert.ok(a.leaseGeneration>=2);
});

test('campaign demonstrates safe degradation and bounded resources',()=>{
  const result=runPhase5Chaos('phase5-bounds');
  assert.equal(result.autonomousTicksDuringProviderOutage,5);
  assert.equal(result.interactionsDisabledDuringOutage,true);
  assert.equal(result.outputProtectionStatus,'unsafe');
  assert.equal(result.crashBreakerState,'open');
  assert.equal(result.supervisorLevel,'unsafe');
  assert.ok(result.snapshotCount<=4);
  assert.ok(result.commandDedupeEntries<=1000);
  assert.ok(result.eventCount<1000);
});