'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {
  MarbleRuntime,
  createMarbleSnapshot,
  restoreMarbleSnapshot,
  marbleStateChecksum,
  MarbleSnapshotError
}=require('../../dist/games/marble-survival/src/index.js');

const config={rosterSize:8,roundQuotas:[4,3,2,2,1],roundTimeoutTicks:1800,intermissionTicks:3,roundIntroTicks:0};

test('twin runtimes remain checksum and event identical across fixed steps',()=>{
  const a=MarbleRuntime.create(config,'twin-marble');
  const b=MarbleRuntime.create(config,'twin-marble');
  for(let tick=0;tick<600;tick++){
    a.step(); b.step();
    assert.equal(marbleStateChecksum(a.state),marbleStateChecksum(b.state),`tick ${tick}`);
  }
  assert.deepEqual(a.drainEvents(),b.drainEvents());
});

test('snapshot restore matches uninterrupted execution and rejects corruption',()=>{
  const a=MarbleRuntime.create(config,'snapshot-marble');
  for(let i=0;i<240;i++)a.step();
  const snapshot=createMarbleSnapshot(a);
  const restored=restoreMarbleSnapshot(snapshot);
  for(let i=0;i<360;i++){a.step();restored.step();}
  assert.equal(marbleStateChecksum(a.state),marbleStateChecksum(restored.state));
  assert.equal(a.getNextEventSequence(),restored.getNextEventSequence());
  const corrupt=structuredClone(snapshot);
  corrupt.payload.state.marbles[0].position.x++;
  assert.throws(()=>restoreMarbleSnapshot(corrupt),MarbleSnapshotError);
});

test('championship result enters intermission and starts a clean deterministic tournament',()=>{
  const runtime=MarbleRuntime.create({...config,rosterSize:2,roundQuotas:[1,1,1,1,1]},'restart-marble');
  runtime.state.roundIndex=4;
  runtime.state.roundNumber=5;
  runtime.state.currentQuota=1;
  runtime.state.activeIds=[0,1];
  runtime.state.marbles.forEach(m=>{m.status='active';m.roundStatus='racing';});
  runtime.state.marbles[0].position.y=runtime.state.arena.finishY-runtime.state.config.marbleRadius;
  runtime.step();
  assert.equal(runtime.state.lifecycle,'tournament-result');
  assert.equal(runtime.state.result?.kind,'champion');
  const championId=runtime.state.result?.championId;
  assert.ok(championId===0||championId===1);
  runtime.step();
  assert.equal(runtime.state.lifecycle,'intermission');
  for(let i=0;i<runtime.state.config.intermissionTicks+1;i++)runtime.step();
  assert.equal(runtime.state.lifecycle,'active');
  assert.equal(runtime.state.runIndex,1);
  assert.equal(runtime.state.roundIndex,0);
  assert.equal(runtime.state.activeIds.length,2);
  assert.ok(runtime.state.marbles.every(m=>m.status==='active'));
});

test('integrity failure quarantines the run and is not classified as a legitimate elimination',()=>{
  const runtime=MarbleRuntime.create(config,'integrity-marble');
  runtime.state.marbles[0].position.x=Number.MAX_SAFE_INTEGER;
  runtime.step();
  assert.equal(runtime.state.lifecycle,'quarantined');
  assert.equal(runtime.state.result?.kind,'technical');
  assert.equal(runtime.state.result?.reason,'numeric-range');
  assert.equal(runtime.state.records.eligible,false);
  assert.ok(runtime.drainEvents().some(event=>event.type==='integrity-quarantined'));
});
