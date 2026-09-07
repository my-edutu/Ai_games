'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {checksum}=require('../../dist/packages/replay/src/index.js');
const {FloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {encodeFloorsSnapshot,restoreFloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/persistence/snapshot.js');
const {floorsManifest}=require('../../dist/games/ai-vs-1000-floors/src/manifest.js');

function resign(envelope){
  const body={version:envelope.version,deterministicVersion:envelope.deterministicVersion,state:envelope.state,rng:envelope.rng,events:envelope.events,runtime:envelope.runtime};
  envelope.checksum=checksum(body);
  return envelope;
}

test('revision 2 is the current deterministic identity',()=>{
  assert.equal(floorsManifest.gameVersion,'0.1.1-r2');
  assert.equal(floorsManifest.deterministicVersion,'floors-r1-v2');
  assert.equal(floorsManifest.presentationVersion,'floors-presentation-r3');
});

test('legacy revision 1 snapshot restores truthfully and re-encodes as revision 2',()=>{
  const runtime=FloorsRuntime.create({},'legacy-snapshot-migration',{runId:'legacy-migration',policy:'production'});
  for(let i=0;i<24&&runtime.state.lifecycle==='running';i++)runtime.step();
  const current=encodeFloorsSnapshot(runtime);
  assert.equal(current.deterministicVersion,'floors-r1-v2');
  const legacy=resign({...structuredClone(current),deterministicVersion:'floors-r1-v1'});
  const restored=restoreFloorsRuntime(legacy);
  assert.deepEqual(restored.state,runtime.state);
  assert.deepEqual(restored.rng.snapshot(),runtime.rng.snapshot());
  assert.deepEqual(restored.peekEvents(),runtime.peekEvents());
  const migrated=encodeFloorsSnapshot(restored);
  assert.equal(migrated.deterministicVersion,'floors-r1-v2');
});
