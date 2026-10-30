'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {deferred,flush,clientHarness,workerHarness}=require('./network-harness.cjs');

test('a completed state body survives delayed main-thread message delivery without an abort',async()=>{
  const body=deferred();
  const probe=clientHarness({workerFetch:async()=>({ok:true,json:()=>body.promise})});
  const result=probe.client.read('/escape-room/state?w=1600'),worker=probe.workers[0];
  await flush();assert.equal(worker.runtime.clock.pending.size,1);assert.equal(probe.mainClock.pending.size,0);
  body.resolve({tick:12,runToken:'public-run'});await flush();
  // The worker has consumed the body, but the page has not processed any worker
  // messages. Advancing all deadlines cannot cancel the completed transfer.
  assert.equal(worker.runtime.clock.pending.size,0);
  assert.equal(worker.runtime.outbox.filter(message=>message.type==='state').length,1);
  worker.runtime.clock.fire();probe.mainClock.fire();
  assert.equal(worker.runtime.calls[0].options.signal.aborted,false);
  worker.deliver();assert.equal((await result).tick,12);assert.equal(probe.diagnostics.inFlight,0);
  probe.client.dispose();
});

test('missing response headers are aborted by the worker at 1800 ms and the next request recovers',async()=>{
  const headers=deferred();let first=true;
  const probe=clientHarness({workerFetch:()=>first?(first=false,headers.promise):Promise.resolve({ok:true,json:async()=>({tick:13})})});
  const result=probe.client.read('/escape-room/state'),worker=probe.workers[0],rejected=assert.rejects(result,{name:'TimeoutError'});
  await flush();
  assert.deepEqual([...worker.runtime.clock.pending.values()].map(timer=>timer.delay),[1800]);
  worker.runtime.clock.fire();assert.equal(worker.runtime.calls[0].options.signal.aborted,true);
  worker.deliver();await rejected;assert.equal(probe.diagnostics.inFlight,0);
  const recovered=probe.client.read('/escape-room/state');await flush();worker.deliver();assert.equal((await recovered).tick,13);
  headers.resolve({ok:true,json:async()=>({tick:999})});await flush();
  assert.equal(worker.runtime.outbox.length,0);assert.equal(worker.runtime.clock.pending.size,0);
  probe.client.dispose();
});

test('successful headers do not exempt an incomplete body from the worker deadline',async()=>{
  const body=deferred();let bodyStarted=false;
  const probe=clientHarness({workerFetch:async()=>({ok:true,json(){bodyStarted=true;return body.promise;}})});
  const result=probe.client.read('/escape-room/state'),worker=probe.workers[0],rejected=assert.rejects(result,{name:'TimeoutError'});
  await flush();assert.equal(bodyStarted,true);
  worker.runtime.clock.fire();assert.equal(worker.runtime.calls[0].options.signal.aborted,true);worker.deliver();await rejected;
  body.resolve({tick:999});await flush();assert.equal(worker.runtime.outbox.length,0);
  assert.equal(worker.runtime.clock.pending.size,0);probe.client.dispose();
});

test('an earlier completed request cannot exempt the next incomplete request',async()=>{
  let first=true;const stalled=deferred();
  const probe=clientHarness({workerFetch:async()=>({ok:true,json:()=>first?(first=false,Promise.resolve({tick:1})):stalled.promise})});
  const firstResult=probe.client.read('/escape-room/state');await flush();const worker=probe.workers[0];worker.deliver();await firstResult;
  const second=probe.client.read('/escape-room/state'),rejected=assert.rejects(second,{name:'TimeoutError'});await flush();
  worker.runtime.clock.fire();worker.deliver();await rejected;
  assert.equal(worker.runtime.calls[0].options.signal.aborted,false);assert.equal(worker.runtime.calls[1].options.signal.aborted,true);
  probe.client.dispose();
});

test('the worker rejects other origins and non-state endpoints without making a request',()=>{
  const probe=workerHarness(()=>{throw new Error('invalid URL reached fetch');});
  for(const [index,url]of ['https://elsewhere.test/escape-room/state','/escape-room/health','http://name:secret@preview.test/escape-room/state'].entries())probe.send({type:'poll',id:index+1,url});
  assert.equal(probe.calls.length,0);assert.equal(probe.clock.pending.size,0);
  assert.deepEqual(probe.outbox.filter(message=>message.type==='error').map(message=>message.error.name),['TypeError','TypeError','TypeError']);
});

test('the worker rejects a second concurrent request and cancellation retires its deadline',()=>{
  const probe=workerHarness(()=>deferred().promise);
  probe.send({type:'poll',id:1,url:'/escape-room/state'});probe.send({type:'poll',id:2,url:'/escape-room/state'});
  assert.equal(probe.calls.length,1);assert.equal(probe.clock.pending.size,1);
  assert.ok(probe.outbox.some(message=>message.id===2&&message.error?.name==='InvalidStateError'));
  probe.send({type:'abort',id:2});assert.equal(probe.calls[0].options.signal.aborted,false);
  probe.send({type:'abort',id:1});assert.equal(probe.calls[0].options.signal.aborted,true);assert.equal(probe.clock.pending.size,0);
  assert.equal(probe.outbox.filter(message=>message.id===1&&message.error?.name==='AbortError').length,1);
});
