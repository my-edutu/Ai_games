'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {deferred,flush,clientHarness}=require('./network-harness.cjs');
const root=path.resolve(__dirname,'../../public/ai-escape-room');

test('live public-state requests use a worker without a main-thread request deadline',async()=>{
  const workers=[],timers=new Map();let timerId=0;
  class Worker{
    constructor(url){this.url=url;this.messages=[];workers.push(this)}
    postMessage(message){this.messages.push(message)}
    terminate(){this.terminated=true}
  }
  const context={window:{},Worker,URL,AbortController,location:{href:'http://preview.test/escape-room'},console:{warn(){}},
    setTimeout(callback,milliseconds){const id=++timerId;timers.set(id,{callback,milliseconds});return id;},clearTimeout(id){timers.delete(id);},
    fetch(){throw new Error('live state must be fetched in the worker')},
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,'network.js'),'utf8'),context);
  assert.equal(typeof context.window.EscapeNetwork.createStateClient,'function','the worker transport must own the network deadline independently of rendering');
  const client=context.window.EscapeNetwork.createStateClient(),read=client.read('/escape-room/state?w=1600');
  assert.equal(workers.length,1);assert.equal(workers[0].url,'/escape-room/state-worker.js');
  assert.deepEqual([...timers.values()].map(timer=>timer.milliseconds),[5000]);assert.equal(workers[0].messages.length,0);
  workers[0].onmessage({data:{type:'ready'}});
  assert.equal(timers.size,0,'main-thread delivery must not have a competing network watchdog after startup');
  const request=workers[0].messages[0];assert.equal(request.type,'poll');
  workers[0].onmessage({data:{type:'state',id:request.id,state:{tick:12,runToken:'public-run'}}});
  assert.equal((await read).tick,12);
  client.dispose();assert.equal(workers[0].terminated,true);
});

test('only one client request can be pending, and abort allows a fresh request without accepting stale replies',async()=>{
  const headers=deferred();let first=true;
  const probe=clientHarness({workerFetch:()=>first?(first=false,headers.promise):Promise.resolve({ok:true,json:async()=>({tick:2})})});
  const controller=new AbortController(),old=probe.client.read('/escape-room/state',{signal:controller.signal});
  const cancelled=assert.rejects(old,{name:'AbortError'});await flush();const worker=probe.workers[0];
  await assert.rejects(probe.client.read('/escape-room/state'),{name:'InvalidStateError'});assert.equal(worker.runtime.calls.length,1);
  controller.abort();await cancelled;assert.equal(worker.runtime.calls[0].options.signal.aborted,true);assert.equal(worker.runtime.clock.pending.size,0);
  const fresh=probe.client.read('/escape-room/state');await flush();worker.deliver();assert.equal((await fresh).tick,2);
  headers.resolve({ok:true,json:async()=>({tick:999})});await flush();assert.equal(worker.runtime.outbox.length,0);
  assert.equal(probe.diagnostics.inFlight,0);probe.client.dispose();
});

test('a failed ready worker is terminated and the next request creates one replacement',async()=>{
  let first=true;
  const probe=clientHarness({workerFetch:()=>first?(first=false,deferred().promise):Promise.resolve({ok:true,json:async()=>({tick:3})})});
  const failed=probe.client.read('/escape-room/state'),rejected=assert.rejects(failed,{name:'NetworkError'});await flush();
  probe.workers[0].fail();await rejected;assert.equal(probe.workers[0].terminated,true);assert.equal(probe.workers[0].onmessage,null);
  const recovered=probe.client.read('/escape-room/state');await flush();probe.workers[1].deliver();assert.equal((await recovered).tick,3);
  assert.equal(probe.workers.length,2);assert.equal(probe.diagnostics.transport,'worker');assert.equal(probe.mainClock.pending.size,0);
  probe.client.dispose();
});

test('repeated worker crashes stop replacement churn and disclose the bounded fallback',async()=>{
  const probe=clientHarness({workerFetch:()=>deferred().promise,mainFetch:async()=>({ok:true,json:async()=>({tick:4})})});
  const first=probe.client.read('/escape-room/state'),rejected=assert.rejects(first,{name:'NetworkError'});await flush();probe.workers[0].fail();await rejected;
  const second=probe.client.read('/escape-room/state');await flush();probe.workers[1].fail();await flush();assert.equal((await second).tick,4);
  assert.equal(probe.workers.length,2);assert.ok(probe.workers.every(worker=>worker.terminated));
  assert.equal(probe.diagnostics.transport,'main-thread-fallback');assert.equal(probe.diagnostics.reason,'worker-repeatedly-failed');
  assert.equal(probe.warnings.length,1);assert.equal(probe.mainClock.pending.size,0);probe.client.dispose();
});

test('a worker startup error falls back without sending a state request to the failed worker',async()=>{
  const probe=clientHarness({autoReady:false});
  const read=probe.client.read('/escape-room/state');assert.equal(probe.workers[0].messages.length,0);
  probe.workers[0].fail();await flush();assert.equal((await read).tick,2);
  assert.equal(probe.workers[0].terminated,true);assert.equal(probe.workers[0].runtime.calls.length,0);
  assert.equal(probe.diagnostics.reason,'worker-startup-failed');assert.equal(probe.mainClock.pending.size,0);probe.client.dispose();
});

test('a silent worker startup is bounded separately from the state network deadline',async()=>{
  const probe=clientHarness({autoReady:false});
  const read=probe.client.read('/escape-room/state');
  assert.deepEqual([...probe.mainClock.pending.values()].map(timer=>timer.delay),[5000]);
  assert.equal(probe.workers[0].runtime.calls.length,0,'a main-thread startup deadline must never own an active state fetch');
  probe.mainClock.fire();await flush();assert.equal((await read).tick,2);
  assert.equal(probe.workers[0].terminated,true);assert.equal(probe.diagnostics.reason,'worker-startup-timeout');
  assert.equal(probe.mainClock.pending.size,0);probe.workers[0].deliver();assert.equal(probe.diagnostics.transport,'main-thread-fallback');
  probe.client.dispose();
});

test('cancelling startup clears its watchdog, terminates the worker and leaves no fallback request',async()=>{
  const probe=clientHarness({autoReady:false}),controller=new AbortController();
  const read=probe.client.read('/escape-room/state',{signal:controller.signal}),rejected=assert.rejects(read,{name:'AbortError'});
  controller.abort();await rejected;probe.mainClock.fire();await flush();
  assert.equal(probe.mainClock.pending.size,0);assert.equal(probe.workers[0].terminated,true);assert.equal(probe.mainCalls.length,0);
  assert.equal(probe.diagnostics.inFlight,0);probe.client.dispose();
});

test('evidence mode preserves the explicit window fetch fixture and clears its bounded fallback timer',async()=>{
  const probe=clientHarness({evidence:true,workerFetch:()=>{throw new Error('capture must not use worker fetch');},mainFetch:async()=>({ok:true,json:async()=>({tick:25,scene:'result'})})});
  const read=probe.client.read('/escape-room/state');await flush();assert.equal((await read).tick,25);
  assert.equal(probe.workers.length,0);assert.equal(probe.mainCalls.length,1);assert.equal(probe.mainClock.pending.size,0);
  assert.equal(probe.diagnostics.transport,'evidence-main-thread');assert.equal(probe.warnings.length,0);probe.client.dispose();
});

test('unsupported workers use a disclosed fallback whose hung request is still cancelled',async()=>{
  const probe=clientHarness({available:false,mainFetch:()=>deferred().promise});
  const read=probe.client.read('/escape-room/state'),rejected=assert.rejects(read,{name:'TimeoutError'});
  assert.deepEqual([...probe.mainClock.pending.values()].map(timer=>timer.delay),[1800]);
  probe.mainClock.fire();await rejected;assert.equal(probe.mainCalls[0].options.signal.aborted,true);
  assert.equal(probe.mainClock.pending.size,0);assert.equal(probe.diagnostics.reason,'worker-unavailable');assert.equal(probe.warnings.length,1);
  probe.client.dispose();
});

test('a blocked Worker constructor uses the same explicit fallback',async()=>{
  const probe=clientHarness({constructorError:true});const read=probe.client.read('/escape-room/state');await flush();assert.equal((await read).tick,2);
  assert.equal(probe.workers.length,0);assert.equal(probe.diagnostics.reason,'worker-blocked');assert.equal(probe.warnings.length,1);
  assert.equal(probe.mainClock.pending.size,0);probe.client.dispose();
});

test('invalid public-state addresses are rejected before starting either transport',async()=>{
  const probe=clientHarness();
  for(const url of ['https://elsewhere.test/escape-room/state','/escape-room/replay','/escape-room/state?x='+'a'.repeat(2048)])await assert.rejects(probe.client.read(url),{name:'TypeError'});
  assert.equal(probe.workers.length,0);assert.equal(probe.mainCalls.length,0);assert.equal(probe.mainClock.pending.size,0);probe.client.dispose();
});

test('disposal rejects pending delivery, releases handlers and prevents transport resurrection',async()=>{
  const probe=clientHarness();const read=probe.client.read('/escape-room/state'),rejected=assert.rejects(read,{name:'AbortError'});await flush();
  const worker=probe.workers[0];assert.ok(worker.runtime.outbox.some(message=>message.type==='state'));
  probe.client.dispose();probe.client.dispose();await rejected;worker.deliver();
  assert.equal(worker.terminated,true);assert.equal(worker.onmessage,null);assert.equal(worker.onerror,null);assert.equal(worker.onmessageerror,null);
  assert.equal(probe.mainClock.pending.size,0);assert.equal(worker.runtime.clock.pending.size,0);assert.equal(probe.diagnostics.inFlight,0);
  await assert.rejects(probe.client.read('/escape-room/state'),{name:'AbortError'});assert.equal(probe.workers.length,1);
});
