'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {PassThrough}=require('node:stream');
const {startFreshOriginalCaptureHost,READY_TEXT}=
  require('../../scripts/tower-capture-host-lifecycle.cjs');
const goodEnv={CI:'true',TOWER_CAPTURE_UNALTERED_SOURCE:'1',
 TOWER_CAPTURE_LATE_HOST_START:'1'};
function mockHost({announce=true}={}){
 const child=new EventEmitter();
 child.stdout=new PassThrough();child.stderr=new PassThrough();
 child.killedSignals=[];
 child.kill=signal=>{
   child.killedSignals.push(signal);
   queueMicrotask(()=>child.emit('exit',0,signal));return true;
 };
 if(announce)queueMicrotask(()=>child.stdout.write(READY_TEXT+'4176\n'));
 return child;
}
test('late host is forbidden without explicit source-capture CI',async()=>{
 await assert.rejects(startFreshOriginalCaptureHost({
   env:{CI:'false',TOWER_CAPTURE_UNALTERED_SOURCE:'1',
      TOWER_CAPTURE_LATE_HOST_START:'1'}}),/restricted/);
});
test('original host starts AFTER prepared page and requires this child bind',async()=>{
 const child=mockHost(),calls=[];
 const host=await startFreshOriginalCaptureHost({
   env:goodEnv,spawnProcess:(node,args,opts)=>{
     calls.push({node,args,opts});return child;},
   checkHealth:async()=>({status:'healthy'})
 });
 assert.equal(calls.length,1);
 assert.deepEqual(calls[0].args,
   ['scripts/tower-source-capture-server.cjs','--port=4176']);
 assert.equal(host.authority,'unaltered-current-checkout-20Hz-original-host');
 assert.ok(host.readyAtMs>=host.launchedAtMs);
 await host.stop();await host.stop();
 assert.deepEqual(child.killedSignals,['SIGTERM']);
});
test('stale external health cannot certify a child that never bound',async()=>{
 const child=mockHost({announce:false});
 let now=0,requests=0;
 await assert.rejects(startFreshOriginalCaptureHost({
   env:goodEnv,timeoutMs:270,spawnProcess:()=>child,
   now:()=>now,wait:async()=>{now+=100;},
   checkHealth:async()=>{requests++;return {status:'healthy'};}
 }),/did not bind/);
 assert.equal(requests,0);
 assert.deepEqual(child.killedSignals,['SIGTERM']);
});
test('child dying during source startup is a real failure, never reused',async()=>{
 const child=mockHost({announce:false});
 queueMicrotask(()=>child.emit('exit',1,null));
 await assert.rejects(startFreshOriginalCaptureHost({
   env:goodEnv,spawnProcess:()=>child,
   wait:async()=>Promise.resolve(),timeoutMs:1000
 }),/stopped/);
});
test('health from a stale endpoint cannot certify a child that exits during health read',async()=>{
 const child=mockHost();
 await assert.rejects(startFreshOriginalCaptureHost({
   env:goodEnv,spawnProcess:()=>child,
   checkHealth:async()=>{
     child.emit('exit',1,null);
     return {status:'healthy'};
   }
 }),/stopped/);
 assert.deepEqual(child.killedSignals,[]);
});
test('bound original host that never becomes healthy fails with source evidence',async()=>{
 const child=mockHost();
 let now=0,checks=0;
 await assert.rejects(startFreshOriginalCaptureHost({
   env:goodEnv,timeoutMs:270,spawnProcess:()=>child,
   now:()=>now,wait:async()=>{now+=100;},
   checkHealth:async()=>{checks++;return {status:'degraded'};}
 }),/did not bind and report healthy/);
 assert.equal(checks,2);
 assert.deepEqual(child.killedSignals,['SIGTERM']);
});
test('silent SIGTERM escalates to SIGKILL on the owned capture host only',async()=>{
 const child=mockHost();
 child.kill=signal=>{child.killedSignals.push(signal);if(signal==='SIGKILL')queueMicrotask(()=>child.emit('exit',null,signal));return true;};
 const host=await startFreshOriginalCaptureHost({
   env:goodEnv,spawnProcess:()=>child,
   checkHealth:async()=>({status:'healthy'}),wait:async()=>{}
 });
 await host.stop();await host.stop();
 assert.deepEqual(child.killedSignals,['SIGTERM','SIGKILL']);
});
