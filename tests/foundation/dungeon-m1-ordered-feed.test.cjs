'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createOrderedReplayFeed}=require('../browser/dungeon-m1-ordered-feed.cjs');
test('slow original browser fetch cannot skip organic authority ticks',()=>{
 const feed=createOrderedReplayFeed(Array.from({length:7},(_,tick)=>({tick})));
 assert.equal(feed.pull().index,0);assert.equal(feed.pull().index,0);
 feed.allowThrough(3);
 assert.deepEqual([feed.pull().index,feed.pull().index,feed.pull().index,feed.pull().index,feed.pull().index],[0,1,2,3,3]);
 feed.allowThrough(6);
 assert.deepEqual([feed.pull().index,feed.pull().index,feed.pull().index,feed.pull().index],[3,4,5,6]);
 const result=feed.metrics();
 assert.equal(result.uniqueDelivered,7);
 assert.equal(result.lastDeliveredIndex,6);
 assert.ok(result.heldRequests>=3);
});
test('checkpoint gate rejects backwards, non-integer and invented future states',()=>{
 assert.throws(()=>createOrderedReplayFeed([]),/Nonempty/);
 const gate=createOrderedReplayFeed([{}, {}, {}]);gate.allowThrough(2);
 for(const n of [-1,1,3,NaN,1.3])assert.throws(()=>gate.allowThrough(n),/Milestone gate/);
});

test('original WebGL checkpoint reports missing delivered ticks rather than a false Warden pass',()=>{
 const {describeOrganicCheckpoint}=require('../browser/dungeon-m1-ordered-feed.cjs');
 const source=Array.from({length:12},(_,tick)=>({tick,checksum:'c'+tick}));
 const feed=createOrderedReplayFeed(source);
 feed.allowThrough(9);
 for(let i=0;i<4;i++)feed.pull();
 const missing=describeOrganicCheckpoint({stage:'warden',expectedIndex:9,
  expectedChecksum:'c9',renderedChecksum:'c9',renderedFrame:34,feed});
 assert.equal(missing.status,'NOT_DELIVERED');
 assert.equal(missing.missingDeliveredSnapshots,6);
 assert.equal(missing.accepted,false);
 while(feed.metrics().lastDeliveredIndex<9)feed.pull();
 const lag=describeOrganicCheckpoint({stage:'warden',expectedIndex:9,
  expectedChecksum:'c9',renderedChecksum:'c8',renderedFrame:45,feed});
 assert.equal(lag.status,'DELIVERED_NOT_RENDERED');
 assert.equal(lag.accepted,false);
 const seen=describeOrganicCheckpoint({stage:'warden',expectedIndex:9,
  expectedChecksum:'c9',renderedChecksum:'c9',renderedFrame:46,feed});
 assert.equal(seen.status,'EXACT_RENDERED_CHECKPOINT');
 assert.equal(seen.accepted,true);
 const noFrame=describeOrganicCheckpoint({stage:'restart',expectedIndex:9,
  expectedChecksum:'c9',renderedChecksum:'c9',renderedFrame:0,feed});
 assert.equal(noFrame.accepted,false);
 assert.equal(noFrame.status,'DELIVERED_NOT_RENDERED');
 assert.throws(()=>describeOrganicCheckpoint({stage:'warden',expectedIndex:13,
  expectedChecksum:'c13',renderedChecksum:'c13',renderedFrame:47,feed}),/index/);
});
