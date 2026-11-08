'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {finalizeOriginalJourneyRecording}=require('../browser/dungeon-m1-recording-lifecycle.cjs');
test('finalizes original WebM and preserves receipt order',async()=>{
 const order=[],film={status:'RECORDED',bytes:4096};
 const result=await finalizeOriginalJourneyRecording({
  stop:async()=>{order.push('stop');return film},
  close:async()=>{order.push('close')},
  persist:async data=>{order.push('persist');assert.equal(data.recording,film)}
 });
 assert.deepEqual(order,['stop','close','persist']);
 assert.equal(result.recording.status,'RECORDED');
 assert.deepEqual(result.finalizationErrors,[]);
});
test('browser stop failure still closes media sink and preserves partial metadata',async()=>{
 const order=[];
 const result=await finalizeOriginalJourneyRecording({
  stop:async()=>{order.push('stop');throw Error('browser page closed')},
  close:async()=>{order.push('close')},
  persist:async data=>{order.push('persist');assert.equal(data.recording.status,'UNAVAILABLE')}
 });
 assert.deepEqual(order,['stop','close','persist']);
 assert.match(result.finalizationErrors[0],/browser page closed/);
});
test('original disk sink failure remains explicit and metadata is still attempted',async()=>{
 let persisted=false;
 const result=await finalizeOriginalJourneyRecording({
  stop:async()=>({status:'RECORDED',bytes:8192}),
  close:async()=>{throw Error('ENOSPC')},
  persist:async data=>{persisted=true;assert.match(data.finalizationErrors[0],/ENOSPC/)}
 });
 assert.equal(persisted,true);
 assert.equal(result.finalizationErrors.length,1);
});
test('receipt errors remain visible',async()=>{
 const result=await finalizeOriginalJourneyRecording({
  stop:async()=>({status:'RECORDED',bytes:8192}),close:async()=>{},
  persist:async()=>{throw Error('permission denied')}
 });
 assert.match(result.finalizationErrors.at(-1),/persist: Error: permission denied/);
});
test('rejects incomplete lifecycle contract',async()=>{
 await assert.rejects(()=>finalizeOriginalJourneyRecording({stop:async()=>{},close:async()=>{}}),/persist/);
});
