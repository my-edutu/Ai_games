'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {FloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {encodeFloorsSnapshot}=require('../../dist/games/ai-vs-1000-floors/src/persistence/snapshot.js');
const {FloorsDurableStore,acquireFloorsLease,restoreFloorsAuthority,assessFloorsHealth,verifyFloorsContinuity}=require('../../dist/games/ai-vs-1000-floors/src/operations/system.js');

test('lease generation fences stale writers and journal sequence is append-only',()=>{
  const store=new FloorsDurableStore();const first=acquireFloorsLease(store,'worker-a',0,50);store.append('command',1,{kind:'tick'},first);const second=acquireFloorsLease(store,'worker-b',2,50);assert.throws(()=>store.append('event',3,{kind:'late'},first),/STALE_LEASE/);const entry=store.append('event',3,{kind:'active'},second);assert.equal(entry.sequence,2);assert.deepEqual(store.entries().map(item=>item.sequence),[1,2]);
});

test('verified restore falls back from corrupt newest snapshot to previous compatible state',()=>{
  const store=new FloorsDurableStore();const lease=acquireFloorsLease(store,'worker',0,500);const runtime=FloorsRuntime.create({},'restore');for(let i=0;i<4;i++)runtime.step();const good=store.saveRuntime(runtime,lease);const expected=FloorsRuntime.restore({state:structuredClone(runtime.state),rng:runtime.rng.snapshot(),events:runtime.peekEvents(),...runtime.restoreMetadata});
  for(let i=0;i<4;i++)runtime.step();const corrupt=encodeFloorsSnapshot(runtime);corrupt.checksum='00000000';const bad=store.storeSnapshotEnvelope(corrupt,runtime.state.tick,lease);
  const restored=restoreFloorsAuthority(store);assert.equal(restored.status,'restored');assert.equal(restored.usedSequence,good.sequence);assert.deepEqual(restored.rejectedSequences,[bad.sequence]);assert.ok(restored.runtime);assert.equal(verifyFloorsContinuity(expected,restored.runtime),true);
});

test('all-corrupt snapshots quarantine instead of silently starting a new authority',()=>{
  const store=new FloorsDurableStore();const lease=acquireFloorsLease(store,'worker',0,100);const runtime=FloorsRuntime.create({},'quarantine');const corrupt=encodeFloorsSnapshot(runtime);corrupt.checksum='deadbeef';store.storeSnapshotEnvelope(corrupt,0,lease);const restored=restoreFloorsAuthority(store);assert.equal(restored.status,'quarantined');assert.equal(restored.runtime,undefined);
});

test('health probes distinguish degradation from finite recovery breaker',()=>{
  const healthy=assessFloorsHealth({tick:100,lastProgressTick:90,lastRenderTick:95,lastAudioTick:90,lastPersistTick:95,lastOutputTick:95,paused:false,recoveryAttempts:0});assert.equal(healthy.status,'healthy');
  const degraded=assessFloorsHealth({tick:500,lastProgressTick:0,lastRenderTick:0,lastAudioTick:0,lastPersistTick:0,lastOutputTick:0,paused:false,recoveryAttempts:2});assert.equal(degraded.status,'degraded');assert.ok(degraded.actions.includes('verified-restore'));
  const breaker=assessFloorsHealth({tick:500,lastProgressTick:0,lastRenderTick:0,lastAudioTick:0,lastPersistTick:0,lastOutputTick:0,paused:false,recoveryAttempts:3});assert.equal(breaker.status,'breaker');assert.deepEqual(breaker.actions,['safe-intermission','operator-review']);
});

test('paused authority does not falsely trip progress-stale probe',()=>{const report=assessFloorsHealth({tick:1000,lastProgressTick:0,lastRenderTick:999,lastAudioTick:999,lastPersistTick:999,lastOutputTick:999,paused:true,recoveryAttempts:0});assert.equal(report.reasons.includes('progress-stale'),false)});
