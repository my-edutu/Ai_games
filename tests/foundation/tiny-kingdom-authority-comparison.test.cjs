'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {PHASES,assessWorldComparability}=
 require('../../scripts/tiny-kingdom-gauntlet-comparability.cjs');
const make=(checksum='unchanged',hour=7)=>
 Object.fromEntries(PHASES.map(name=>[name,
  {snapshotChecksum:checksum,simulatedHour:hour}]));

test('matching exported-authority snapshots at every filmed time are equivalent',()=>{
 const baseline=make(),candidate=make();
 const result=assessWorldComparability(baseline,candidate);
 assert.equal(result.strictWorldStatePairProven,true);
 assert.equal(Object.keys(result.frames).length,PHASES.length);
 assert.deepEqual(baseline,make());assert.deepEqual(candidate,make());
});

test('same seed, hour and camera but different real initial worlds NEVER pass',()=>{
 const baseline=make('g088-checksum'),candidate=make('transformed-checksum');
 const result=assessWorldComparability(baseline,candidate);
 assert.equal(result.frames.day1.sameSimulationHour,true);
 assert.equal(result.frames.day1.authorityChecksumEqual,false);
 assert.equal(result.strictWorldStatePairProven,false);
});

test('one diverged 120-day authoritative society invalidates the whole comparison',()=>{
 const baseline=make(),candidate=make();
 candidate.day120.snapshotChecksum='different-citizens-inventory';
 assert.equal(assessWorldComparability(baseline,candidate).strictWorldStatePairProven,false);
});

test('a missing, empty or unknown source checksum fails closed',()=>{
 const baseline=make(),candidate=make();
 for(const missing of [null,'',undefined,123]){
  candidate.mobile.snapshotChecksum=missing;
  const result=assessWorldComparability(baseline,candidate);
  assert.equal(result.frames.mobile.authorityChecksumEqual,false);
  assert.equal(result.strictWorldStatePairProven,false);
 }
});

test('different tick count and hour never pass even with equal snapshot hash',()=>{
 const baseline=make(),candidate=make();
 candidate.labor.simulatedHour=8;
 assert.equal(assessWorldComparability(baseline,candidate).strictWorldStatePairProven,false);
 delete candidate.labor;
 assert.equal(assessWorldComparability(baseline,candidate).strictWorldStatePairProven,false);
});

test('evidence cannot assert equivalence without both original and candidate',()=>{
 assert.throws(()=>assessWorldComparability(null,make()),/required/);
 assert.throws(()=>assessWorldComparability(make(),null),/required/);
});
