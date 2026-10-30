'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {deferred,flush,clientHarness,applicationHarness}=require('./network-harness.cjs');

test('pinning evidence rejects a queued live result without overwriting the replay or recording a reconnect',async()=>{
  const probe=clientHarness(),app=applicationHarness(probe.client);await flush();const worker=probe.workers[0];
  assert.ok(worker.runtime.outbox.some(message=>message.type==='state'));
  app.context.window.__ESCAPE_PRESENT_FRAME__({tick:25,runToken:'pinned'});worker.deliver();await flush();
  assert.deepEqual(app.updates,[{tick:25,runToken:'pinned'}]);assert.equal(app.context.failures,0);assert.equal(app.context.inFlight,false);
  assert.equal(probe.diagnostics.inFlight,0);probe.client.dispose();
});

test('immediate Resume Live cancels the old epoch and fetches one fresh frame',async()=>{
  const oldBody=deferred();let first=true;
  const probe=clientHarness({workerFetch:async()=>({ok:true,json:()=>first?(first=false,oldBody.promise):Promise.resolve({tick:40,runToken:'fresh'})})});
  const app=applicationHarness(probe.client);await flush();const worker=probe.workers[0];
  app.context.window.__ESCAPE_PRESENT_FRAME__({tick:25,runToken:'pinned'});
  app.context.window.__ESCAPE_RESUME_LIVE__();await flush();
  assert.equal(worker.runtime.calls.length,2);assert.equal(worker.runtime.calls[0].options.signal.aborted,true);
  oldBody.resolve({tick:999,runToken:'stale'});await flush();worker.deliver();await flush();
  assert.deepEqual(app.updates,[{tick:25,runToken:'pinned'},{tick:40,runToken:'fresh'}]);
  assert.equal(app.context.failures,0);assert.equal(app.context.inFlight,false);assert.equal(probe.diagnostics.inFlight,0);probe.client.dispose();
});

test('full page exit stops polling, aborts the worker and prevents a late retry while BFCache preserves the session',async()=>{
  const probe=clientHarness({workerFetch:()=>deferred().promise}),app=applicationHarness(probe.client);await flush();const worker=probe.workers[0];
  app.events.pagehide({persisted:true});assert.equal(worker.terminated,undefined);assert.equal(app.context.disposed,false);
  app.events.pagehide({persisted:false});await flush();
  assert.equal(worker.terminated,true);assert.equal(worker.runtime.calls[0].options.signal.aborted,true);
  assert.deepEqual(app.lifecycle,{intervalCleared:1,rendererDisposed:1,audioClosed:1});assert.equal(app.context.disposed,true);
  app.context.window.__ESCAPE_RESUME_LIVE__();await app.context.poll();await flush();
  assert.equal(probe.workers.length,1);assert.equal(app.context.failures,0);assert.equal(app.updates.length,0);
  assert.equal(probe.mainClock.pending.size,0);assert.equal(worker.runtime.clock.pending.size,0);
});
