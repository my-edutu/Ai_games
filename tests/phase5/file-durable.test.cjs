const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {FileDurableStore,createStoredEvent}=require('../../dist/packages/durable-store/src/index.js');
function event(seq){return createStoredEvent({streamId:'channel',runId:'run',eventId:`e${seq}`,seq,tick:seq,type:seq?'move':'initialized',payload:{seq},createdAtMs:seq});}
function commandEvent(seq,id='command-1'){return createStoredEvent({streamId:'channel',runId:'run',eventId:`c${seq}`,seq,tick:seq,type:'runtime-command',payload:{commandId:id,commandSeq:seq,kind:'step'},createdAtMs:seq});}
function temp(){return fs.mkdtempSync(path.join(os.tmpdir(),'snake-store-'));}

test('file store survives process reconstruction with events snapshots audit and command index intact',()=>{
  const dir=temp();try{
    const a=new FileDurableStore(dir,{eventCapacity:20,snapshotCapacity:2,auditCapacity:4});
    a.appendEvent(event(0));a.appendEvent(commandEvent(1));
    a.putSnapshot({schemaVersion:1,id:'s1',streamId:'channel',runId:'run',eventSeq:1,commandSeq:1,createdAtMs:10,compatibility:{gameVersion:'1',deterministicVersion:'1',configHash:'c',contentHash:'x'},envelope:{ok:true},checksum:'snapshot-checksum'});
    a.appendAudit({schemaVersion:1,id:'a1',kind:'system',actorRef:'service',action:'snapshot',targetRef:'channel',occurredAtMs:10,payloadDigest:'digest'});
    const b=new FileDurableStore(dir,{eventCapacity:20,snapshotCapacity:2,auditCapacity:4});
    assert.deepEqual(b.events('channel').map(e=>e.eventId),['e0','c1']);
    assert.equal(b.runtimeCommand('channel','command-1').eventId,'c1');
    assert.equal(b.runtimeCommand('channel','missing'),undefined);
    assert.deepEqual(b.snapshots('channel').map(s=>s.id),['s1']);
    assert.deepEqual(b.audits().map(a=>a.id),['a1']);
    assert.equal(b.appendEvent(commandEvent(1)).status,'duplicate');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('snapshot indexes use atomic valid JSON documents',()=>{
  const dir=temp();try{
    const store=new FileDurableStore(dir,{snapshotCapacity:2});
    store.putSnapshot({schemaVersion:1,id:'s1',streamId:'channel',runId:'run',eventSeq:0,commandSeq:0,createdAtMs:1,compatibility:{gameVersion:'1',deterministicVersion:'1',configHash:'c',contentHash:'x'},envelope:{ok:true},checksum:'c'});
    const files=fs.readdirSync(path.join(dir,'snapshots'));
    assert.equal(files.length,1);
    assert.doesNotThrow(()=>JSON.parse(fs.readFileSync(path.join(dir,'snapshots',files[0]),'utf8')));
    assert.equal(files.some(name=>name.endsWith('.tmp')),false);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('corrupt persisted event evidence fails closed on reconstruction',()=>{
  const dir=temp();try{
    const store=new FileDurableStore(dir);store.appendEvent(event(0));
    const file=path.join(dir,'events',fs.readdirSync(path.join(dir,'events'))[0]);
    fs.appendFileSync(file,'{not-json}\n');
    assert.throws(()=>new FileDurableStore(dir),e=>e.code==='CORRUPT_STORE');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});