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
