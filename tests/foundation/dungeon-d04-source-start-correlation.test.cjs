'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {correlateD04OriginalSourceStarts}=require('../browser/dungeon-d04-source-start-correlation.cjs');
const damage={cueId:'1:1:7:damage-fatal:-:enemy-1-0',kind:'damage-fatal',scene:'1:1',tick:7,
 audio:true,visual:true,frameId:15,decision:'delivered',submittedClockMs:19506};
const started={cueId:damage.cueId,kind:damage.kind,sceneKey:damage.scene,tick:damage.tick,
 audio:'fatal-impact',scheduledContextMs:2500,startedSources:2,verifiedCanonicalCue:true};
test('actual submitted injury and original WebAudio source.start correlate without mixing clocks',()=>{
 const x=correlateD04OriginalSourceStarts({receipts:[damage],sourceStarts:[started]});
 assert.equal(x.classification,'MATCHED_SOURCE_STARTS_UNALIGNED');
 assert.equal(x.matches.length,1);assert.equal(x.matches[0].cueId,damage.cueId);
 assert.equal(x.matches[0].startedSources,2);
 assert.equal(x.unmatchedDeliveredReceiptCount,0);assert.equal(x.sampleSynchronized,false);
 assert.equal(x.matches[0].sampleSynchronized,false);
});
test('wrong scene, tick, kind, recipe, source-start evidence or canonical injury never matches',()=>{
 for(const altered of [{sceneKey:'2:1'},{tick:8},{kind:'swing'},{audio:'whoosh'},
  {startedSources:0},{scheduledContextMs:-1},{verifiedCanonicalCue:false}]){
  const x=correlateD04OriginalSourceStarts({receipts:[damage],sourceStarts:[{...started,...altered}]});
  assert.equal(x.matches.length,0,JSON.stringify(altered));
  assert.equal(x.unmatchedDeliveredReceiptCount,1);
 }
});
test('duplicate, stale, unsubmitted or missing originals never receive false match',()=>{
 for(const input of [
  {receipts:[damage],sourceStarts:[]},
  {receipts:[damage,damage],sourceStarts:[started]},
  {receipts:[damage],sourceStarts:[started,started]},
  {receipts:[{...damage,frameId:null}],sourceStarts:[started]},
  {receipts:[{...damage,decision:'stale-frame'}],sourceStarts:[started]}]){
  const x=correlateD04OriginalSourceStarts(input);
  assert.equal(x.matches.length,0);assert.equal(x.sampleSynchronized,false);
 }
});
test('observed guard may start original sound without inventing attacker or requiring injury proof',()=>{
 const r={...damage,cueId:'1:1:22:guard:warden-1:-',kind:'guard',tick:22};
 const s={...started,cueId:r.cueId,kind:r.kind,tick:r.tick,audio:'guard',
  startedSources:1,verifiedCanonicalCue:false};
 const x=correlateD04OriginalSourceStarts({receipts:[r],sourceStarts:[s]});
 assert.equal(x.matches.length,1);assert.equal(x.sampleSynchronized,false);
 assert.equal('attacker' in x.matches[0],false);
});
test('malformed and over-budget evidence cannot hide duplicate records by clipping',()=>{
 const x=correlateD04OriginalSourceStarts({receipts:Array(65).fill(damage),sourceStarts:[started]});
 assert.equal(x.matches.length,0);assert.equal(x.sampleSynchronized,false);
 assert.equal(x.classification,'SOURCE_STARTS_UNVERIFIED');
});
