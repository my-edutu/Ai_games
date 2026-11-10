'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {planPair,htmlFor}=require('../../scripts/tower-event-review-playlist.cjs');
const FROZEN='1731b380851162741761c5569e2bc152a0869ca9';
const CANDIDATE='a'.repeat(40);
function make(source,viewport='portrait',events=null){
 const sha=source==='baseline'?FROZEN:CANDIDATE;
 const ev=events||[{kind:'guardian-hp-decrease',floor:8,sourceTick:100,
    observedEpisode:0,nativeVideoSeconds:12,inOriginalVideo:true,eventVisibleInVideo:'NOT EVALUATED'},
   {kind:'floor-transition',floor:9,fromFloor:8,toFloor:9,
    sourceTick:430,observedEpisode:0,nativeVideoSeconds:23,
    inOriginalVideo:true,eventVisibleInVideo:'NOT EVALUATED'}];
 return {source,scenario:'danger',viewport,sourceSha:sha,videoPresent:true,
  videoSha256:(source==='baseline'?'b':'c').repeat(64),videoBytes:1100,videoPath:'a/live.webm',
  index:{sourceSha:sha},motion:{seed:'seed-1',recordingQuality:'low',scenario:'danger'},
  videoClock:{sourceSha:sha,status:'CALIBRATED',originalWebMBytes:1100,
    originalVideoUnmodified:true,
    originalWebMSha256:(source==='baseline'?'b':'c').repeat(64),
    originalVideoDurationSeconds:70,scenario:'danger',seed:'seed-1',
    graphicsTier:'low',viewport:{name:viewport,width:viewport==='portrait'?390:960,
      height:viewport==='portrait'?844:600},
    sourceEventTimecodes:ev}};
}
test('original full movies and source-native events produce a reviewable but ungraded pair',()=>{
 const p=planPair([make('baseline'),make('candidate')],'portrait',CANDIDATE);
 assert.equal(p.canReview,true);assert.equal(p.status,'NOT EVALUATED');
 assert.equal(p.anchors.length,2);
 assert.ok(p.unmatchedSourceBeats.some(x=>x.kind==='guardian-source-defeated'));
 assert.equal(p.anchors.every(a=>!a.eventPixelsConfirmed),true);
 assert.match(htmlFor([p]),/complete original, 1× speed/);
 assert.doesNotMatch(htmlFor([p]),new RegExp(FROZEN));
});
test('veto fabricated missing baseline floor transition, never align HP to an unrelated event',()=>{
 const e=make('baseline').videoClock.sourceEventTimecodes.slice(0,1);
 const p=planPair([make('baseline','portrait',e),make('candidate')],'portrait',CANDIDATE);
 assert.equal(p.canReview,false);assert.match(p.failures.join(','),/missing-common/);
});
test('reject swapped original video bytes even if source SHA and timebase claim success',()=>{
 const a=make('baseline'),b=make('candidate');
 b.videoClock.originalWebMSha256='e'.repeat(64);
 assert.match(planPair([a,b],'portrait',CANDIDATE).failures.join(','),/unverified-original/);
});
test('do not accept zero-episode mismatch or fake event-visible successes',()=>{
 const a=make('baseline'),b=make('candidate');
 b.videoClock.sourceEventTimecodes=b.videoClock.sourceEventTimecodes.map(e=>({...e,observedEpisode:1}));
 assert.equal(planPair([a,b],'portrait',CANDIDATE).canReview,false);
 const c=make('candidate');
 c.videoClock.sourceEventTimecodes[0].eventVisibleInVideo='VERIFIED';
 assert.equal(planPair([a,c],'portrait',CANDIDATE).canReview,false);
});
test('veto changed seed/tier and only export trustworthy paths',()=>{
 const a=make('baseline'),b=make('candidate');
 b.videoClock.seed='other';
 const p=planPair([a,b],'portrait',CANDIDATE);
 assert.equal(p.canReview,false);assert.match(p.failures.join(','),/capture-conditions/);
});
