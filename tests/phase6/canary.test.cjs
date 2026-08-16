'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {CanaryController}=require('../../dist/packages/canary-control/src/index.js');
const DAY=24*3600000,candidate='candidate';
function controller(){return new CanaryController({candidateChecksum:candidate,requiredDurationMs:7*DAY,maxSampleGapMs:DAY+1,maxErrorRate:.02,minUptimeRatio:.999,maxBadOutputSeconds:30,maxMemorySlopeMbPerHour:5,minSamples:8});}
function sample(day,overrides={}){return{candidateChecksum:candidate,atMs:day*DAY,errorRate:.001,uptimeRatio:.9999,badOutputSeconds:0,memorySlopeMbPerHour:1,replayDivergences:0,duplicateEffects:0,privateExposures:0,unauthorizedControls:0,unsafeModerationFailures:0,crashLoops:0,restoreFailures:0,recordCorruptions:0,platformPolicyBreaches:0,evidenceDigest:`sha256:${(10000000+day).toString(16).padStart(8,'0')}`,...overrides};}
function cleanWeek(c){c.start({startedAtMs:0,environment:'production',source:'external-signed',realElapsed:true,attestationDigest:'sha256:deadbeef'});for(let day=0;day<=7;day++)c.ingest(sample(day));return c;}

test('canary policy and incident history are immutable snapshots',()=>{
  const c=controller();assert.equal(Object.isFrozen(c.policy()),true);assert.throws(()=>{c.policy().maxErrorRate=1},TypeError);
  c.start({startedAtMs:0,environment:'production',source:'external-signed',realElapsed:true,attestationDigest:'sha256:deadbeef'});
  c.ingest(sample(0,{replayDivergences:1}));const incidents=c.incidents();assert.equal(Object.isFrozen(incidents[0]),true);assert.throws(()=>{incidents[0].reason='changed'},TypeError);
});

test('clean production canary cannot promote before seven real elapsed days',()=>{
  const c=controller();c.start({startedAtMs:0,environment:'production',source:'external-signed',realElapsed:true,attestationDigest:'sha256:deadbeef'});for(let day=0;day<=6;day++)c.ingest(sample(day));
  const result=c.evaluate(6.9*DAY);assert.equal(result.status,'running');assert.ok(result.blockers.includes('minimum-duration'));
});

test('clean seven-day production canary becomes eligible only after all guardrails pass',()=>{
  const c=cleanWeek(controller()),result=c.evaluate(7*DAY);assert.equal(result.status,'eligible');assert.deepEqual(result.blockers,[]);assert.equal(result.elapsedMs,7*DAY);assert.equal(result.sampleCount,8);
});

test('synthetic or non-production canary cannot satisfy promotion even with long timestamps',()=>{
  const c=controller();c.start({startedAtMs:0,environment:'ci',source:'synthetic',realElapsed:false,attestationDigest:'sha256:deadbeef'});for(let day=0;day<=20;day++)c.ingest(sample(day));const result=c.evaluate(20*DAY);assert.equal(result.status,'blocked');assert.ok(result.blockers.includes('real-production-evidence'));
});

test('critical integrity trigger immediately requires rollback and preserves cause',()=>{
  const c=controller();c.start({startedAtMs:0,environment:'production',source:'external-signed',realElapsed:true,attestationDigest:'sha256:deadbeef'});const decision=c.ingest(sample(0,{duplicateEffects:1}));assert.equal(decision.status,'rollback');assert.equal(c.evaluate(1).status,'rollback');assert.ok(c.incidents()[0].reason.includes('duplicate-effects'));
});

test('quantitative guardrail breach requires rollback',()=>{
  const c=controller();c.start({startedAtMs:0,environment:'production',source:'external-signed',realElapsed:true,attestationDigest:'sha256:deadbeef'});assert.equal(c.ingest(sample(0,{errorRate:.03})).status,'rollback');
});

test('material candidate change resets the canary clock and sample history',()=>{
  const c=cleanWeek(controller());assert.equal(c.evaluate(7*DAY).status,'eligible');c.invalidateForMaterialChange('content',8*DAY);assert.equal(c.evaluate(8*DAY).status,'not-started');assert.equal(c.samples().length,0);assert.ok(c.incidents().some(i=>i.type==='clock-reset'));
});

test('out-of-order, wrong-candidate, invalid-digest and excessive-gap samples fail closed',()=>{
  const c=controller();c.start({startedAtMs:0,environment:'production',source:'external-signed',realElapsed:true,attestationDigest:'sha256:deadbeef'});c.ingest(sample(0));
  assert.throws(()=>c.ingest(sample(0)),e=>e.code==='NON_MONOTONIC_SAMPLE');
  assert.throws(()=>c.ingest(sample(1,{candidateChecksum:'other'})),e=>e.code==='CANDIDATE_MISMATCH');
  assert.throws(()=>c.ingest(sample(1,{evidenceDigest:'bad'})),e=>e.code==='INVALID_EVIDENCE');
  assert.throws(()=>c.ingest(sample(3)),e=>e.code==='SAMPLE_GAP');
});