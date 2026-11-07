'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createTowerFixedStepTraceCollector}=require('../../scripts/tower-fixed-step-trace.cjs');
const tick=(n,runToken='run-a')=>({atMs:1000+n*50,tick:n,runToken,
  floor:8,lifecycle:'running',checksum:'h'+n});
test('overlap preserves source origin across 180 seconds',()=>{
 const c=createTowerFixedStepTraceCollector();
 c.add(Array.from({length:2200},(_,i)=>tick(i)));
 c.add(Array.from({length:2200},(_,i)=>tick(i+1400)));
 assert.equal(c.snapshot().length,3600);
 assert.equal(c.snapshot()[0].tick,0);
 assert.equal(c.snapshot().at(-1).tick,3599);
 assert.equal(c.status().duplicates,800);
 assert.equal(c.status().missingFixedSteps,0);
 assert.equal(c.status().uninterruptedTrace,true);
});
test('gaps, contradictions and buffer eviction are not silently certified',()=>{
 const c=createTowerFixedStepTraceCollector(3);
 c.add([tick(1),tick(3),{...tick(3),checksum:'tampered'},tick(4),tick(5)]);
 assert.equal(c.status().missingFixedSteps,1);
 assert.equal(c.status().conflicts,1);
 assert.equal(c.status().evicted,1);
 assert.equal(c.status().uninterruptedTrace,false);
});
test('authentic next-run token resets tick without a fake rewind',()=>{
 const c=createTowerFixedStepTraceCollector();
 c.add([tick(200),{...tick(0,'run-b'),atMs:12000}]);
 assert.equal(c.snapshot().length,2);
 assert.equal(c.status().outOfOrder,0);
});
