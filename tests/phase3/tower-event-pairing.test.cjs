'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {FROZEN,matchSourceEvents,auditPairs}=require('../../scripts/tower-event-pairing.cjs');
function rec(source,scenario='danger',viewport='portrait'){
 const sha=source==='baseline'?FROZEN:'c'.repeat(40);
 return {source,scenario,viewport,artifact:'authentic-'+source,sourceSha:sha,
  videoPath:'original/live.webm',videoPresent:true,
  motion:{sourceSha:sha,seed:'same-seed',graphicsTier:'low',reducedMotion:false,
   soundEnabled:false,actualWallSeconds:68,
   viewport:viewport==='portrait'?{width:390,height:844}:{width:960,height:600}},
  index:{sourceSha:sha,seed:'same-seed',scenario,sourceTicksObserved:120,events:[
   {kind:'guardian-present',floor:8,atMs:1000},
   {kind:'guardian-hp-decrease',floor:8,atMs:2000},
   {kind:'guardian-source-defeated',floor:8,atMs:3000},
   {kind:'floor-transition',floor:9,fromFloor:8,toFloor:9,atMs:4000}
  ]}};
}
test('same-floor combat and onward source events pair IN ORDER but cannot claim video visibility',()=>{
 const b=rec('baseline').index.events,c=rec('candidate').index.events;
 c.splice(1,0,{kind:'hazard-charge-begin',floor:8,hazardId:'crusher',atMs:1500});
 const a=matchSourceEvents(b,c);
 assert.equal(a.pairs.length,4);
 assert.equal(a.missingFromBaseline.length,1);
 assert.equal(a.pairs[3].event,'floor-transition:9:8:9');
 assert.equal(a.pairs[0].uneditedVideoTimecodeVerified,false);
 assert.equal(a.pairs[0].visuallyMatched,false);
});
test('no invented pairing when gateway or defeat was not witnessed',()=>{
 const b=rec('baseline').index.events,c=rec('candidate').index.events.slice(0,2);
 const m=matchSourceEvents(b,c);
 assert.equal(m.pairs.length,2);assert.equal(m.missingFromCandidate.length,2);
});
test('eight honest source-pinned capture pairs remain NOT EVALUATED',()=>{
 const rows=['ascent','danger','moving','outcome'].flatMap(s=>
  ['desktop','portrait'].flatMap(v=>[rec('baseline',s,v),rec('candidate',s,v)]));
 const a=auditPairs(rows,'c'.repeat(40));
 assert.equal(a.comparisons.length,8);
 assert.equal(a.missingPairs.length,0);
 assert.equal(a.provenanceDefects.length,0);
 assert.equal(a.verdict,'NOT EVALUATED');
 assert.equal(a.fullMotionPaired,false);
});
test('tampering, missing film, invalid phone width and short run are detected',()=>{
 const b=rec('baseline'),c=rec('candidate');
 b.sourceSha='bad';c.videoPresent=false;c.motion.actualWallSeconds=22;
 c.motion.viewport.width=800;
 const a=auditPairs([b,c],'c'.repeat(40));
 assert.equal(a.comparisons[0].faults.length,5);
 assert.equal(a.missingPairs.length,7);
 assert.equal(a.verdict,'NOT EVALUATED');
});
