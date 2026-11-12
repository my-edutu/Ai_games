'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createUnheldAuthorityFeed}=require('../../tests/browser/dungeon-m1-unheld-feed.cjs');
const truth=Object.freeze([{checksum:'a',tick:0},{checksum:'b',tick:1},
 {checksum:'c',tick:2},{checksum:'d',tick:3}]);
test('unheld real-authority feed cannot pause, jump, duplicate an intermediate encounter, or fabricate a result',()=>{
 const feed=createUnheldAuthorityFeed(truth);
 assert.equal(feed.pull().snapshot,truth[0]);
 assert.equal(feed.pull().snapshot,truth[0]); // PRE-recording initialization only
 feed.begin();
 for(let i=0;i<truth.length;i++){
  const next=feed.pull();assert.equal(next.index,i);
  assert.strictEqual(next.snapshot,truth[i]); // never clone or alter actual combat
 }
 assert.deepEqual(feed.metrics(),{started:true,requests:4,uniqueDelivered:4,
  lastDeliveredIndex:3,total:4,prepHolds:2,terminalHolds:0,intermediateHolds:0,
  policy:'unheld real browser polling, one authentic consecutive tick per request'});
 assert.throws(()=>feed.begin(),/already running/);
 assert.strictEqual(feed.pull().snapshot,truth.at(-1));
 assert.equal(feed.metrics().terminalHolds,1);
});
test('unheld feed rejects missing, unchecksummed, or empty authority evidence',()=>{
 for(const invalid of [null,[],[{}],[{checksum:'a'}],[{checksum:'a'},{}]])
  assert.throws(()=>createUnheldAuthorityFeed(invalid),TypeError);
});
