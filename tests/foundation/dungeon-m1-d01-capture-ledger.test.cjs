'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {summarizeTrial,intervalSummary,compareTrials}=require('../../scripts/m1-parallel/D01/frame-ledger.cjs');
const {parseArgs}=require('../../scripts/m1-parallel/D01/capture-dungeon.cjs');
test('source frame events and encoded output remain distinct populations',()=>{
 const raw={mode:'record',frames:[
  {atMs:0,frame:42,directRenderMs:11,drawCalls:123,triangles:456,renderPixels:420529},
  {atMs:40,frame:43,directRenderMs:12,drawCalls:124,triangles:456,renderPixels:420529},
  {atMs:40.1,frame:43,directRenderMs:12}, // duplicated diagnostic is not a new render
  {atMs:80,frame:44,directRenderMs:10,drawCalls:125,triangles:456,renderPixels:420529},
  {atMs:200,frame:47,directRenderMs:14,drawCalls:126,triangles:456,renderPixels:420529}
 ],callbacks:[{durationMs:18},{durationMs:22},{durationMs:40}],
 snapshots:[{run:1,tick:1},{run:1,tick:3},{run:1,tick:4}],
 recordedRequestFrames:4,capture:{status:'ENCODED',encodedFrames:500,encodedBytes:15000}};
 const s=summarizeTrial(raw);
 assert.equal(s.source.observedRenderEvents,4);
 assert.equal(s.source.firstRenderFrame,42);
 assert.equal(s.source.lastRenderFrame,47);
 assert.equal(s.source.observedRenderEventsPerSecond,15);
 assert.equal(s.source.deliveryIntervals.p50Ms,40);
 assert.equal(s.source.deliveryIntervals.p95Ms,120);
 assert.equal(s.source.synchronousDirectRender.p95Ms,14);
 assert.equal(s.authority.tickIncreases,3);
 assert.equal(s.source.recordedRequestFrames,4);
 assert.equal(s.capture.encodedFrames,500);
 assert.match(s.warnings.join(' '),/WebM/);
});
test('render stalls and recording regression are independent measurements',()=>{
 const a=summarizeTrial({frames:[{atMs:0,frame:1},{atMs:50,frame:2},{atMs:100,frame:3}],callbacks:[],snapshots:[]});
 const b=summarizeTrial({frames:[{atMs:0,frame:1},{atMs:100,frame:2},{atMs:200,frame:3}],callbacks:[],snapshots:[]});
 const comparison=compareTrials(a,b);
 assert.equal(comparison.recordingToUnrecordedSourceRatio,.5);
 assert.equal(comparison.diagnostic,'RECORDING_REDUCED_SOURCE_DELIVERY');
 assert.equal(compareTrials(a,a).diagnostic,'NO_LARGE_SOURCE_DELIVERY_CHANGE_OBSERVED');
 assert.equal(compareTrials({source:{observedRenderEventsPerSecond:null}},b).diagnostic,'INSUFFICIENT_SOURCE_FRAMES');
});
test('missing observations do not masquerade as fast frames or GPU numbers',()=>{
 const s=summarizeTrial({frames:[],callbacks:[],snapshots:[],frameRecordsDropped:1});
 assert.equal(s.source.observedRenderEventsPerSecond,null);
 assert.equal(s.source.synchronousDirectRender.p95Ms,null);
 assert.equal(s.source.drawCalls,null);
 assert.equal(s.authority.tickIncreases,0);
 assert.match(s.warnings.at(-1),/dropped/);
});
test('valid snapshots distinguish genuine run restart from tick regression',()=>{
 const s=summarizeTrial({frames:[],callbacks:[],snapshots:[
  {run:1,tick:50},{run:1,tick:60},{run:2,tick:2},{run:2,tick:9}
 ]});
 assert.equal(s.authority.tickIncreases,17);
 assert.equal(s.authority.restarts,1);
 assert.deepEqual(s.authority.runs,[1,2]);
});
test('bounded stage reports preserve exact nearest-rank percentiles',()=>{
 assert.deepEqual(intervalSummary([16,16,16,200,1000]),
  {count:5,p50Ms:16,p95Ms:1000,p99Ms:1000,worstMs:1000});
 assert.equal(intervalSummary([NaN,Infinity,-1]).p95Ms,null);
});
test('capture CLI is local-only and constrains recording duration and source steps',()=>{
 const p=parseArgs(['--url','http://127.0.0.1:4181/dungeon','--seconds','12','--seed','gauntlet','--advance','120','--mobile']);
 assert.equal(p.seconds,12);assert.equal(p.advance,120);assert.equal(p.mobile,true);
 assert.throws(()=>parseArgs(['--url','https://example.com/dungeon']),/local/);
 assert.throws(()=>parseArgs(['--seconds','120']),/3\.\.45/);
 assert.throws(()=>parseArgs(['--advance','-1']),/0\.\.3000/);
});

test('CDP browser task, script and layout counters are not silently labelled GPU time',()=>{
 const {summarizeBrowserCounters}=require('../../scripts/m1-parallel/D01/frame-ledger.cjs');
 const before=[{name:'TaskDuration',value:5},{name:'ScriptDuration',value:2},
   {name:'LayoutDuration',value:.5},{name:'LayoutCount',value:100},
   {name:'JSHeapUsedSize',value:2_000_000},{name:'Nodes',value:1200}];
 const after=[{name:'TaskDuration',value:6.2},{name:'ScriptDuration',value:2.4},
   {name:'LayoutDuration',value:.7},{name:'LayoutCount',value:105},
   {name:'JSHeapUsedSize',value:2_500_000},{name:'Nodes',value:1250}];
 const result=summarizeBrowserCounters(before,after);
 assert.equal(result.taskDurationMs,1200);
 assert.equal(result.scriptDurationMs,400);
 assert.equal(result.layoutDurationMs,200);
 assert.equal(result.layoutCountDelta,5);
 assert.equal(result.jsHeapBytesStart,2_000_000);
 assert.equal(result.jsHeapBytesEnd,2_500_000);
 assert.equal(result.domNodesEnd,1250);
 assert.equal('gpuElapsedMs' in result,false);
 assert.match(result.caveat,/not GPU/);
});

test('D01 retained framebuffer accounting is separate from source and encoded video frames',()=>{
 const s=summarizeTrial({frames:[
  {atMs:0,frame:10,renderSurfaceSetSizeCalls:1,renderSurfaceDprChanges:0},
  {atMs:20,frame:11,renderSurfaceSetSizeCalls:1,renderSurfaceDprChanges:0}
 ],callbacks:[],snapshots:[{run:1,tick:5}]});
 assert.equal(s.source.renderSurfaceSetSizeCalls,1);
 assert.equal(s.source.renderSurfaceDprChanges,0);
 assert.equal(s.source.observedRenderEvents,2);
 assert.equal(s.source.observedRenderEventsPerSecond,50);
 assert.equal(s.capture.status,'NOT_STARTED');
});
