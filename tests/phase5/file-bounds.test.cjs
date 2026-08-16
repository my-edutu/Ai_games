const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {FileDurableStore,createStoredEvent}=require('../../dist/packages/durable-store/src/index.js');
function temp(){return fs.mkdtempSync(path.join(os.tmpdir(),'snake-bounds-'));}
function event(seq){return createStoredEvent({streamId:'channel',runId:'run',eventId:`e-${seq}`,seq,tick:seq,type:'move',payload:{seq},createdAtMs:seq});}
function audit(id){return{schemaVersion:1,id:`a-${id}`,kind:'system',actorRef:'service',action:'check',targetRef:'channel',occurredAtMs:id,payloadDigest:`d-${id}`};}

test('file event capacity is checked before durable append',()=>{
  const dir=temp();try{
    const store=new FileDurableStore(dir,{eventCapacity:2});store.appendEvent(event(0));store.appendEvent(event(1));
    assert.throws(()=>store.appendEvent(event(2)),e=>e.code==='CAPACITY_EXCEEDED');
    const reconstructed=new FileDurableStore(dir,{eventCapacity:2});
    assert.deepEqual(reconstructed.events('channel').map(e=>e.eventId),['e-0','e-1']);
    const eventFile=path.join(dir,'events',fs.readdirSync(path.join(dir,'events'))[0]);
    assert.equal(fs.readFileSync(eventFile,'utf8').trim().split('\n').length,2);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('file audit retention compacts disk evidence to the configured bound',()=>{
  const dir=temp();try{
    const store=new FileDurableStore(dir,{auditCapacity:2});store.appendAudit(audit(1));store.appendAudit(audit(2));store.appendAudit(audit(3));
    assert.deepEqual(store.audits().map(a=>a.id),['a-2','a-3']);
    const lines=fs.readFileSync(path.join(dir,'audits.jsonl'),'utf8').trim().split('\n');
    assert.equal(lines.length,2);
    const reconstructed=new FileDurableStore(dir,{auditCapacity:2});
    assert.deepEqual(reconstructed.audits().map(a=>a.id),['a-2','a-3']);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});