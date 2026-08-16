const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {checksum}=require('../../dist/packages/replay/src/index.js');
const {FileDurableStore}=require('../../dist/packages/durable-store/src/index.js');
const {RunLeaseStore}=require('../../dist/packages/operations-core/src/index.js');
const {SnakeChannelService}=require('../../dist/services/snake-channel/src/index.js');
const compatibility={gameVersion:'0.5.0',deterministicVersion:'snake-r2',configHash:'cfg',contentHash:'content'};
function options(store,leases,workerId){return{channelId:'persistent-channel',workerId,seed:'persistent-seed',config:{width:14,height:12,targetLength:30,profile:'rings'},store,leases,leaseTtlMs:1000,snapshotEveryCommands:5,compatibility};}

test('reconstructed service restores file-backed state and post-snapshot commands before new work',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'snake-service-'));
  try{
    const leases=new RunLeaseStore();
    const firstStore=new FileDurableStore(dir,{eventCapacity:5000,snapshotCapacity:4,auditCapacity:100});
    const first=new SnakeChannelService(options(firstStore,leases,'worker-a'));first.start(0);
    for(let i=1;i<=7;i++)first.tick(`tick-${i}`,i*10);
    const expected=checksum(first.runtime.state),eventCount=firstStore.events('persistent-channel').length;

    const reconstructedStore=new FileDurableStore(dir,{eventCapacity:5000,snapshotCapacity:4,auditCapacity:100});
    const replacement=new SnakeChannelService(options(reconstructedStore,leases,'worker-b'));
    replacement.start(1071);

    assert.equal(checksum(replacement.runtime.state),expected);
    assert.equal(replacement.status().commandSeq,7);
    assert.equal(replacement.status().leaseGeneration,2);
    const before=checksum(replacement.runtime.state);
    assert.equal(replacement.tick('tick-7',1072).status,'duplicate');
    assert.equal(checksum(replacement.runtime.state),before);
    assert.equal(reconstructedStore.events('persistent-channel').length,eventCount);
    assert.ok(reconstructedStore.audits().some(entry=>entry.action==='startup-recovery'));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});