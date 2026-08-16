const test=require('node:test');
const assert=require('node:assert/strict');
const {checksum}=require('../../dist/packages/replay/src/index.js');
const {InMemoryDurableStore}=require('../../dist/packages/durable-store/src/index.js');
const {RunLeaseStore}=require('../../dist/packages/operations-core/src/index.js');
const {SnakeChannelService}=require('../../dist/services/snake-channel/src/index.js');

const compatibility={gameVersion:'0.5.0',deterministicVersion:'snake-r2',configHash:'cfg',contentHash:'content'};
function service(shared={}){return new SnakeChannelService({channelId:'channel',workerId:shared.workerId??'worker-a',seed:'service-seed',config:{width:14,height:12,targetLength:30,profile:'rings'},store:shared.store??new InMemoryDurableStore({eventCapacity:5000,snapshotCapacity:4}),leases:shared.leases??new RunLeaseStore(),leaseTtlMs:1000,snapshotEveryCommands:5,compatibility});}

test('service persists initialized/runtime events, bounded snapshots and drains runtime buffers',()=>{
  const s=service();s.start(0);
  for(let i=1;i<=12;i++)assert.equal(s.tick(`tick-${i}`,i*10).status,'applied');
  const events=s.store.events('channel');
  assert.deepEqual(events.map(e=>e.seq),events.map((_,i)=>i));
  assert.ok(events.some(e=>e.type==='runtime-command'));
  assert.equal(s.store.snapshots('channel').length,2);
  assert.equal(s.runtime.events.length,0);
});

test('runtime commands are exactly-once by idempotency key',()=>{
  const s=service();s.start(0);
  assert.equal(s.tick('same',10).status,'applied');
  const before=checksum(s.runtime.state),count=s.store.events('channel').length;
  assert.equal(s.tick('same',20).status,'duplicate');
  assert.equal(checksum(s.runtime.state),before);
  assert.equal(s.store.events('channel').length,count);
});

test('expired writer is fenced after a newer service acquires the channel lease',()=>{
  const store=new InMemoryDurableStore({eventCapacity:5000}),leases=new RunLeaseStore();
  const a=service({store,leases,workerId:'a'});a.start(0);
  const b=service({store,leases,workerId:'b'});b.start(1001);
  assert.throws(()=>a.tick('old',1002),e=>e.code==='LEASE_FENCED');
  assert.equal(b.tick('new',1002).status,'applied');
});

test('service recovery fences the writer and exactly replays post-snapshot commands',()=>{
  const s=service();s.start(0);
  for(let i=1;i<=9;i++)s.tick(`tick-${i}`,i*10);
  const expected=checksum(s.runtime.state);
  const recovered=s.recover({nowMs:200,newOwnerId:'recovery-worker',expectedChecksum:expected});
  assert.equal(recovered.status,'restored');
  assert.equal(checksum(s.runtime.state),expected);
  assert.ok(s.status().leaseGeneration>=2);
});

test('provider/moderation outage disables interactions but autonomous ticks continue',()=>{
  const s=service();s.start(0);
  s.setDependencyHealth({gateway:false,moderation:false,persistence:true});
  assert.equal(s.status().interactionsEnabled,false);
  const before=s.runtime.state.tick;
  assert.equal(s.tick('autonomous',10).status,'applied');
  assert.equal(s.runtime.state.tick,before+1);
});

test('snapshot/event/command bookkeeping remains bounded by configured capacities',()=>{
  const store=new InMemoryDurableStore({eventCapacity:5000,snapshotCapacity:3,auditCapacity:10});
  const s=service({store});s.start(0);
  for(let i=1;i<=40;i++)s.tick(`t-${i}`,i);
  assert.ok(store.snapshots('channel').length<=3);
  assert.ok(s.status().commandDedupeEntries<=1000);
  assert.equal(s.runtime.events.length,0);
});