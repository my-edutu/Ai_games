const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateCapacity,assessEndurance}=require('../../dist/packages/release-validation/src/index.js');

function capacity(source={kind:'ci-reference',attested:false}){
  return evaluateCapacity({
    source,
    samples:[
      {atMs:0,tickMs:4,aiMs:2,renderMs:8,snapshotMs:12,restoreMs:30,queueRatio:.2,memoryMb:100},
      {atMs:3600000,tickMs:5,aiMs:2.5,renderMs:9,snapshotMs:13,restoreMs:32,queueRatio:.3,memoryMb:102},
      {atMs:7200000,tickMs:6,aiMs:3,renderMs:10,snapshotMs:14,restoreMs:34,queueRatio:.4,memoryMb:104}
    ],
    budgets:{tickP99Ms:10,aiP99Ms:6,renderP99Ms:16.7,snapshotP99Ms:30,restoreP99Ms:100,queueMaxRatio:.8,memorySlopeMbPerHour:5,minHeadroomRatio:.2}
  });
}

test('capacity evaluator calculates percentiles, headroom and resource slope',()=>{
  const result=capacity();
  assert.equal(result.metrics.tick.p99,6);
  assert.equal(result.metrics.queue.max,.4);
  assert.equal(result.metrics.memory.slopePerHour,2);
  assert.equal(result.performancePass,true);
  assert.equal(result.productionReferenceSatisfied,false);
  assert.ok(result.metrics.render.headroomRatio>.2);
});

test('passing CI metrics cannot impersonate production-reference capacity',()=>{
  assert.equal(capacity({kind:'ci-reference',attested:true}).productionReferenceSatisfied,false);
  assert.equal(capacity({kind:'production-reference',attested:true,hardwareRef:'prod-gpu-1',digest:'sha256:deadbeef'}).productionReferenceSatisfied,true);
});

test('budget breach or unbounded memory slope fails capacity',()=>{
  const result=evaluateCapacity({source:{kind:'production-reference',attested:true,hardwareRef:'prod',digest:'sha256:deadbeef'},samples:[{atMs:0,tickMs:5,aiMs:2,renderMs:9,snapshotMs:10,restoreMs:20,queueRatio:.1,memoryMb:100},{atMs:3600000,tickMs:20,aiMs:9,renderMs:30,snapshotMs:50,restoreMs:200,queueRatio:.95,memoryMb:140}],budgets:{tickP99Ms:10,aiP99Ms:6,renderP99Ms:16.7,snapshotP99Ms:30,restoreP99Ms:100,queueMaxRatio:.8,memorySlopeMbPerHour:5,minHeadroomRatio:.1}});
  assert.equal(result.performancePass,false);
  assert.ok(result.blockers.includes('tick-budget'));
  assert.ok(result.blockers.includes('memory-slope'));
});

function endurance(overrides={}){
  return {candidateChecksum:'candidate-1',source:'production',realElapsed:true,startedAtMs:0,endedAtMs:72*3600000,samples:73,resourceSlopes:{memoryMbPerHour:1,handlesPerHour:0,queuePerHour:0},limits:{memoryMbPerHour:5,handlesPerHour:1,queuePerHour:1},duplicateEffects:0,replayDivergences:0,unresolvedOutputFailures:0,manualCommonRecoveries:0,privateExposures:0,crashLoops:0,evidenceDigest:'sha256:abcdef12',...overrides};
}

test('real 72-hour production endurance passes only with clean integrity and bounded slopes',()=>{
  const result=assessEndurance(endurance(),72);
  assert.equal(result.status,'pass');
  assert.deepEqual(result.blockers,[]);
  assert.equal(result.elapsedHours,72);
});

test('accelerated or synthetic duration can test logic but can never satisfy elapsed gate',()=>{
  const synthetic=assessEndurance(endurance({source:'synthetic',realElapsed:false,endedAtMs:1000*3600000}),72);
  assert.equal(synthetic.status,'blocked');
  assert.ok(synthetic.blockers.includes('real-elapsed-evidence'));
  const short=assessEndurance(endurance({endedAtMs:71.9*3600000}),72);
  assert.equal(short.status,'blocked');
  assert.ok(short.blockers.includes('minimum-duration'));
});

test('integrity, privacy, duplicate effect or unresolved output failure forces endurance failure',()=>{
  const result=assessEndurance(endurance({duplicateEffects:1,replayDivergences:1,unresolvedOutputFailures:1,privateExposures:1}),72);
  assert.equal(result.status,'fail');
  assert.ok(result.blockers.includes('duplicate-effects'));
  assert.ok(result.blockers.includes('replay-divergence'));
  assert.ok(result.blockers.includes('private-exposure'));
});

test('candidate mismatch and invalid digest block evidence reuse',()=>{
  const result=assessEndurance(endurance({candidateChecksum:'other',evidenceDigest:'bad'}),72,{expectedCandidateChecksum:'candidate-1'});
  assert.equal(result.status,'blocked');
  assert.ok(result.blockers.includes('candidate-mismatch'));
  assert.ok(result.blockers.includes('invalid-evidence-digest'));
});