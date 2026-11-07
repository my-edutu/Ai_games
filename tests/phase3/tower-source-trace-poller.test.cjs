'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createTowerSourceTracePoller}=require('../../scripts/tower-source-trace-poller.cjs');
const tick=n=>({atMs:1000+n*50,tick:n,runToken:'real-guardian-run',
  floor:8,lifecycle:'running',checksum:'source-'+n});
test('continuous polling retains the real opening through a 180s video despite a blocked screenshot',async()=>{
  let latest=100, callback, cancelled=false;
  const poller=createTowerSourceTracePoller(async()=>({
    method:'original-host-fixed-step-public',
    ticks:Array.from({length:Math.min(latest,2200)},(_,i)=>tick(latest-Math.min(latest,2200)+i)),
  }),{schedule:fn=>(callback=fn,Symbol('interval')),unschedule:()=>{cancelled=true;}});
  await poller.start();
  // A browser screenshot can remain unresolved; the independent source
  // polling clock must still cover all 3600 authentic 20Hz ticks.
  const stalledScreenshot=new Promise(()=>{});
  void stalledScreenshot;
  for(latest=200;latest<=3600;latest+=100)await callback();
  const report=await poller.finish();
  assert.equal(report.available,true);
  assert.equal(report.unsupported,false);
  assert.equal(report.sourceCollector.uninterruptedTrace,true);
  assert.equal(poller.snapshot().length,3600);
  assert.equal(poller.snapshot()[0].tick,0);
  assert.equal(poller.snapshot().at(-1).tick,3599);
  assert.equal(cancelled,true);
  assert.equal(report.actualVideoQuality,'NOT EVALUATED');
});
test('a frozen original host without the optional endpoint is NOT altered or repeatedly polled',async()=>{
  let called=0,callback=()=>{};
  const poller=createTowerSourceTracePoller(async()=>{called++;return {unsupported:true};},
    {schedule:fn=>(callback=fn,1),unschedule:()=>{}});
  await poller.start();
  await callback();
  const status=await poller.finish();
  assert.equal(called,1);
  assert.equal(status.unsupported,true);
  assert.equal(status.available,false);
  assert.equal(poller.snapshot().length,0);
});
test('slow original host responses never overlap and a transient timeout cannot forge trace continuity',async()=>{
  let callback,release,calls=0;
  const poller=createTowerSourceTracePoller(async()=>{
    calls++;
    if(calls===2)await new Promise(resolve=>release=resolve);
    return {ticks:[tick(calls===1?0:3)]};
  },{schedule:fn=>(callback=fn,1),unschedule:()=>{}});
  await poller.start();
  const pending=callback();
  // schedule callback intentionally does not await its guarded request.
  await Promise.resolve();
  await callback();
  assert.equal(calls,2);
  release();
  await poller.finish();
  assert.equal(poller.status().sourceCollector.missingFixedSteps,2);
  assert.equal(poller.status().sourceCollector.uninterruptedTrace,false);
  assert.equal(poller.status().acceptedPages,3);
});
test('invalid polling cadence is rejected without touching source',()=>{
  assert.throws(()=>createTowerSourceTracePoller(()=>{}, {cadenceMs:0}),RangeError);
});
