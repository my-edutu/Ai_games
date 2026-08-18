'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {runHeadlessCorpus}=require('../../dist/games/ai-ant-colony/src/index.js');

test('multi-seed headless corpus is invariant-safe and reproducible',()=>{
  const options={seeds:20,maxTicks:600,config:{width:36,height:24,targetPopulation:50,initialWorkers:14,broodInterval:18,eggHatchTicks:10,larvaTicks:10,pupaTicks:10,noProgressTicks:500}};
  const a=runHeadlessCorpus(options),b=runHeadlessCorpus(options);assert.deepEqual(a,b);assert.equal(a.invariantFailures,0);assert.equal(a.runs,20);assert.ok(a.totalTicks>0);
});
