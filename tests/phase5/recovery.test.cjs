const test=require('node:test');
const assert=require('node:assert/strict');
const {SnakeRuntime}=require('../../dist/games/autonomous-snake/src/runtime/run.js');
const {checksum}=require('../../dist/packages/replay/src/index.js');
const {RunLeaseStore}=require('../../dist/packages/operations-core/src/index.js');
const {createRecoveryCheckpoint,recoverFromEvidence}=require('../../dist/packages/recovery/src/index.js');

const compatibility={gameVersion:'0.5.0',deterministicVersion:'snake-r2',configHash:'cfg',contentHash:'content'};
function command(seq){return{schemaVersion:1,id:`cmd-${seq}`,seq,kind:'step'};}

test('recovery replays commands after the newest compatible snapshot exactly',()=>{
  const r=SnakeRuntime.create({width:14,height:12,targetLength:30,profile:'rings'},'replay-recovery');
  for(let i=0;i<4;i++)r.step();
  const snapshot=createRecoveryCheckpoint(r,{streamId:'channel',id:'s4',commandSeq:4,createdAtMs:40,compatibility});
  for(let i=0;i<4;i++)r.step();
  const result=recoverFromEvidence({snapshots:[snapshot],commands:[5,6,7,8].map(command),compatibility,expectedChecksum:checksum(r.state)});
  assert.equal(result.status,'restored');
  assert.equal(checksum(result.runtime.state),checksum(r.state));
  assert.equal(result.appliedCommands,4);
});

test('corrupt newest snapshot is skipped and older evidence is replayed',()=>{
  const r=SnakeRuntime.create({width:12,height:12,targetLength:28,profile:'corridors'},'older-fallback');
  for(let i=0;i<3;i++)r.step();
  const older=createRecoveryCheckpoint(r,{streamId:'channel',id:'older',commandSeq:3,createdAtMs:30,compatibility});
  for(let i=0;i<2;i++)r.step();
  const newest=createRecoveryCheckpoint(r,{streamId:'channel',id:'newest',commandSeq:5,createdAtMs:50,compatibility});
  const corrupt={...newest,checksum:'corrupt'};
  for(let i=0;i<2;i++)r.step();
  const result=recoverFromEvidence({snapshots:[older,corrupt],commands:[4,5,6,7].map(command),compatibility,expectedChecksum:checksum(r.state)});
  assert.equal(result.status,'restored');
  assert.equal(result.snapshotId,'older');
  assert.ok(result.rejected.some(x=>x.includes('newest')));
});

test('replay divergence quarantines instead of silently continuing',()=>{
  const r=SnakeRuntime.create({width:10,height:10,targetLength:20},'diverge');
  const snapshot=createRecoveryCheckpoint(r,{streamId:'channel',id:'base',commandSeq:0,createdAtMs:1,compatibility});
  const result=recoverFromEvidence({snapshots:[snapshot],commands:[command(1)],compatibility,expectedChecksum:'wrong'});
  assert.equal(result.status,'quarantined');
  assert.equal(result.reason,'replay-divergence');
});

test('command sequence gaps quarantine the run',()=>{
  const r=SnakeRuntime.create({width:10,height:10,targetLength:20},'gap');
  const snapshot=createRecoveryCheckpoint(r,{streamId:'channel',id:'base',commandSeq:0,createdAtMs:1,compatibility});
  const result=recoverFromEvidence({snapshots:[snapshot],commands:[command(2)],compatibility});
  assert.equal(result.status,'quarantined');
  assert.equal(result.reason,'command-sequence-gap');
});

test('recovery fences the old writer before issuing a newer lease generation',()=>{
  const leases=new RunLeaseStore();
  const old=leases.acquire('channel','old-worker',10000,0);
  assert.equal(old.status,'acquired');
  const r=SnakeRuntime.create({width:10,height:10,targetLength:20},'lease-recovery');
  const snapshot=createRecoveryCheckpoint(r,{streamId:'channel',id:'base',commandSeq:0,createdAtMs:1,compatibility});
  const result=recoverFromEvidence({snapshots:[snapshot],commands:[],compatibility,expectedChecksum:checksum(r.state),lease:{store:leases,channelId:'channel',newOwnerId:'recovery-worker',ttlMs:10000,nowMs:100}});
  assert.equal(result.status,'restored');
  assert.ok(result.lease.generation>old.generation);
  assert.throws(()=>leases.assertWriter('channel',old.token,101),e=>e.code==='LEASE_FENCED');
});