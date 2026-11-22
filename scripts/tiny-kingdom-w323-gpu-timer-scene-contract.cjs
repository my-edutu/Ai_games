'use strict';
// W323 production source-bound hardware GPU profiling contract.
// No browser/software raster numbers are interpreted as physical FPS.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
function sourceFunction(name){
 const start=html.indexOf('function '+name+'(');
 assert.ok(start>=0,'missing actual production '+name);
 const open=html.indexOf('{',start);let depth=0;
 for(let i=open;i<html.length;i++){
  if(html[i]==='{')depth++;
  else if(html[i]==='}'&&!--depth)return html.slice(start,i+1);
 }
 throw Error('unclosed production '+name);
}
const harness=new Function('const GPU_TIMER_SAMPLE_MAX=48,GPU_TIMER_SCENE_LIMIT=6;'+
 'const gpuTimerSceneSamples=new Map();let gpuTimerSceneEvictions=0;'+
 sourceFunction('rememberGpuTimerSceneSample')+
 sourceFunction('summarizeGpuTimerSceneSamples')+
 'return {record:rememberGpuTimerSceneSample,summary:summarizeGpuTimerSceneSamples,'+
 'size:()=>gpuTimerSceneSamples.size,evictions:()=>gpuTimerSceneEvictions,'+
 'reset:()=>gpuTimerSceneSamples.clear()};')();
assert.match(html,/rememberGpuTimerSceneSample\(pending\.scene,ms\)/);
assert.match(html,/gpuTimerSceneSamples\.clear\(\)/);
assert.match(sourceFunction('getGpuFrameTimerAudit'),/p95Ms:scoped\.p95Ms/);
assert.doesNotMatch(sourceFunction('getGpuFrameTimerAudit'),/p95Ms:percentile/);
for(let i=0;i<30;i++)harness.record('day1-town-1024',9);
for(let i=0;i<30;i++)harness.record('day121-market-390',215);
assert.equal(harness.summary('day1-town-1024').p95Ms,9);
assert.equal(harness.summary('day121-market-390').p95Ms,215);
assert.equal(harness.summary('unobserved').p95Ms,null);
for(let i=0;i<70;i++)harness.record('day121-market-390',19);
assert.equal(harness.summary('day121-market-390').samples,48);
for(let i=0;i<9;i++)harness.record('new-view-'+i,5);
assert.equal(harness.size(),6);
assert.ok(harness.evictions()>=1);
assert.throws(()=>harness.record('',6),/Invalid actual GPU timing scene/);
assert.throws(()=>harness.record('day121',NaN),/Invalid actual GPU timing scene/);
harness.reset();
assert.equal(harness.summary('new-view-8').samples,0);
console.log('W323 real-source PASS: scene isolation, no false cross-workload p95, bounded GPU samples/eviction, disjoint reset');
