const test=require('node:test');
const assert=require('node:assert/strict');
const {InMemoryDurableStore,createStoredEvent,rebuildRunProjection}=require('../../dist/packages/durable-store/src/index.js');

function event(seq,type='move',payload={}){
  return createStoredEvent({streamId:'channel-1',runId:'run-1',eventId:`event-${seq}`,seq,tick:seq,type,payload,createdAtMs:1000+seq});
}

test('append-only event stream is contiguous and duplicate retries are idempotent',()=>{
  const store=new InMemoryDurableStore({eventCapacity:16,snapshotCapacity:3,auditCapacity:4});
  const first=event(0,'initialized',{seed:'x'});
  assert.equal(store.appendEvent(first).status,'appended');
  assert.equal(store.appendEvent(first).status,'duplicate');
  assert.throws(()=>store.appendEvent(event(2)),e=>e.code==='SEQUENCE_GAP');
  assert.equal(store.appendEvent(event(1)).status,'appended');
  assert.deepEqual(store.events('channel-1').map(x=>x.seq),[0,1]);
});

test('conflicting duplicate event IDs fail closed',()=>{
  const store=new InMemoryDurableStore();
  const original=event(0,'move',{direction:'up'});
  store.appendEvent(original);
  const conflict={...original,payload:{direction:'left'},checksum:original.checksum};
  assert.throws(()=>store.appendEvent(conflict),e=>e.code==='EVENT_CONFLICT');
});

test('snapshots are newest-first, compatibility-filtered and bounded',()=>{
  const store=new InMemoryDurableStore({snapshotCapacity:2});
  for(let i=0;i<3;i++)store.putSnapshot({schemaVersion:1,id:`s${i}`,streamId:'channel-1',runId:'run-1',eventSeq:i,commandSeq:i,createdAtMs:100+i,compatibility:{gameVersion:'1',deterministicVersion:'1',configHash:'a',contentHash:'b'},envelope:{i},checksum:`c${i}`});
  assert.deepEqual(store.snapshots('channel-1').map(x=>x.id),['s2','s1']);
  const compatible=store.compatibleSnapshots('channel-1',{gameVersion:'1',deterministicVersion:'1',configHash:'a',contentHash:'b'});
  assert.deepEqual(compatible.map(x=>x.id),['s2','s1']);
  assert.equal(store.compatibleSnapshots('channel-1',{gameVersion:'2',deterministicVersion:'1',configHash:'a',contentHash:'b'}).length,0);
});

test('projection rebuild separates normal results from technical/quarantined outcomes',()=>{
  const normal=[event(0,'initialized'),event(1,'result',{reason:'victory',score:9,length:12,finalChecksum:'ok'})];
  const p=rebuildRunProjection('snake','run-1',normal);
  assert.equal(p.status,'completed');
  assert.equal(p.recordEligible,true);
  const technical=rebuildRunProjection('snake','run-2',[event(0,'technical-abort',{reason:'replay-divergence'})]);
  assert.equal(technical.status,'technical');
  assert.equal(technical.recordEligible,false);
  const quarantined=rebuildRunProjection('snake','run-3',[event(0,'quarantined',{reason:'corrupt-snapshot'})]);
  assert.equal(quarantined.status,'quarantined');
  assert.equal(quarantined.recordEligible,false);
});

test('operator/audience audit is append-only, idempotent and bounded',()=>{
  const store=new InMemoryDurableStore({auditCapacity:2});
  const a={schemaVersion:1,id:'a1',kind:'operator',actorRef:'op',action:'safe-scene',targetRef:'channel-1',occurredAtMs:1,payloadDigest:'d1'};
  assert.equal(store.appendAudit(a).status,'appended');
  assert.equal(store.appendAudit(a).status,'duplicate');
  store.appendAudit({...a,id:'a2',occurredAtMs:2,payloadDigest:'d2'});
  store.appendAudit({...a,id:'a3',occurredAtMs:3,payloadDigest:'d3'});
  assert.deepEqual(store.audits().map(x=>x.id),['a2','a3']);
  assert.equal(store.stats().auditEntries,2);
});