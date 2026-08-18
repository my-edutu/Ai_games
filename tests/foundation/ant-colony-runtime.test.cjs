'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {AntColonyRuntime,createAntSnapshot,restoreAntSnapshot,stateChecksum,SnapshotError}=require('../../dist/games/ai-ant-colony/src/index.js');
const config={width:40,height:26,targetPopulation:80,initialWorkers:18,broodInterval:20,eggHatchTicks:12,larvaTicks:12,pupaTicks:12,intermissionTicks:2,noProgressTicks:5000};

test('twin runtimes remain byte-identical across fixed steps',()=>{
  const a=AntColonyRuntime.create(config,'twin-seed'),b=AntColonyRuntime.create(config,'twin-seed');
  for(let i=0;i<300;i++){a.step();b.step();assert.equal(stateChecksum(a.state),stateChecksum(b.state));}
  assert.deepEqual(a.drainEvents(),b.drainEvents());
});

test('snapshot restore matches uninterrupted execution and rejects corruption',()=>{
  const a=AntColonyRuntime.create(config,'snapshot-seed');for(let i=0;i<120;i++)a.step();
  const snapshot=createAntSnapshot(a),restored=restoreAntSnapshot(snapshot);for(let i=0;i<180;i++){a.step();restored.step();}
  assert.equal(stateChecksum(a.state),stateChecksum(restored.state));assert.equal(a.getNextEventSequence(),restored.getNextEventSequence());
  const corrupt=structuredClone(snapshot);corrupt.payload.colony.foodStore++;assert.throws(()=>restoreAntSnapshot(corrupt),SnapshotError);
});

test('terminal result enters intermission and deterministically restarts',()=>{
  const runtime=AntColonyRuntime.create({...config,targetPopulation:30},'restart-seed');runtime.state.queen.health=0;runtime.step();assert.equal(runtime.state.lifecycle,'result');runtime.step();assert.equal(runtime.state.lifecycle,'intermission');runtime.step();runtime.step();assert.equal(runtime.state.lifecycle,'active');assert.equal(runtime.state.tick,0);assert.equal(runtime.state.queen.health,runtime.state.config.queenHealth);
});
