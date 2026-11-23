'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const directorPromise=import('../../public/snake-stream/cinematic-director.mjs');
const snap=(step,override={})=>({runToken:'trace',lifecycle:'running',width:28,height:16,movementStep:step,snake:[{cell:8+6*28},{cell:7+6*28}],goal:96,length:51,dangerLevel:0,food:{cell:14+6*28},...override});
const q=(completed,pending,latency=350)=>({supported:true,failed:false,completed,pending,skipped:200,lastObservedLatencyMs:latency});
test('T4 actual newly completed slow GPU fence at empty FIFO does not abruptly reset the camera dwell or rebuild the entire world',async()=>{
  const {createGpuEvidencedCinematicDirector}=await directorPromise;
  const d=createGpuEvidencedCinematicDirector();
  assert.equal(d.resolve({mode:'cinematic',snapshot:snap(8),nowMs:1000,queue:q(20,2)}),'detail');
  // The last IN-FLIGHT full-world frame has actually completed, leaving a brief
  // FIFO empty window. Preserve the already earned, source-identical view.
  assert.equal(d.resolve({mode:'cinematic',snapshot:snap(75),nowMs:3000,queue:q(21,0)}),'detail');
  assert.equal(d.resolve({mode:'cinematic',snapshot:snap(75),nowMs:3300,queue:q(21,0)}),'detail');
  // No further completion or pending pressure: a bounded 650ms grace ends.
  assert.equal(d.resolve({mode:'cinematic',snapshot:snap(75),nowMs:3700,queue:q(21,0)}),'follow');
});
test('T4 unproven or recovered GPU and urgent safety changes bypass empty-FIFO grace',async()=>{
  const {createGpuEvidencedCinematicDirector}=await directorPromise;
  const d=createGpuEvidencedCinematicDirector();
  d.resolve({mode:'cinematic',snapshot:snap(8),nowMs:1000,queue:q(20,2)});
  assert.equal(d.resolve({mode:'cinematic',snapshot:snap(75),nowMs:1050,queue:q(20,0)}),'follow','unchanged completion is only historical, not fresh proof');
  d.resolve({mode:'cinematic',snapshot:snap(8),nowMs:2000,queue:q(30,2)});
  assert.equal(d.resolve({mode:'cinematic',snapshot:snap(75),nowMs:2010,queue:q(31,0,25)}),'follow','measured healthy completion releases immediately');
  d.resolve({mode:'cinematic',snapshot:snap(8),nowMs:3000,queue:q(40,2)});
  assert.equal(d.resolve({mode:'cinematic',snapshot:snap(75,{dangerLevel:2}),nowMs:3010,queue:q(41,0)}),'overview','danger overrides photographic hold');
});
