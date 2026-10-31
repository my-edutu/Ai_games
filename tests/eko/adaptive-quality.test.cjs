'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
let api;
async function load(){
  if(!api){
    const code=fs.readFileSync(path.resolve(__dirname,'../../public/eko-run/adaptive-quality.js'),'utf8');
    api=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  }
  return api;
}
test('resolution scales down only after sustained frame drops, without thrashing',async()=>{
  const {createAdaptiveQualityGovernor}=await load();
  const a=createAdaptiveQualityGovernor({initialRatio:1.4,floorRatio:.65,lowFps:24,highFps:45,reduceAfter:2,recoverAfter:6,normalCooldownMs:2000});
  assert.equal(a.observe(8,1000).changed,false);
  assert.equal(a.observe(8,2000).changed,true);
  assert.ok(a.ratio<1.4);
  const afterDrop=a.ratio;
  assert.equal(a.observe(8,2500).changed,false);
  assert.equal(a.observe(8,3000).changed,false);
  assert.equal(a.ratio,afterDrop);
  assert.equal(a.observe(8,5000).changed,true);
  assert.ok(a.ratio<afterDrop);
  assert.equal(a.metrics().mode,'performance');
});
test('recovery is slow, bounded, and ignores invalid observations',async()=>{
  const {createAdaptiveQualityGovernor}=await load();
  const a=createAdaptiveQualityGovernor({initialRatio:.70,floorRatio:.65,ceilingRatio:1.2,recoverAfter:3,normalCooldownMs:0});
  const before=a.ratio;
  for(const fps of [0,NaN,Infinity,-2])assert.equal(a.observe(fps,2000).changed,false);
  assert.equal(a.observe(59,2500).changed,false);
  assert.equal(a.observe(59,3500).changed,false);
  assert.equal(a.observe(59,4500).changed,true);
  assert.ok(a.ratio>before&&a.ratio<=1.2);
  for(let i=0;i<100;i++)a.observe(61,5000+i*1000);
  assert.ok(a.ratio<=1.2);
});
