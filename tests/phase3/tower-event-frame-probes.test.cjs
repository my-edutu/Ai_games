'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {selectFilmEvents,validateFilmProvenance}=require('../../scripts/tower-event-frame-probes.cjs');
function event(kind,t,episode=0,extras={}) {
  return {kind,nativeVideoSeconds:t,observedEpisode:episode,
    inOriginalVideo:true,eventVisibleInVideo:'NOT EVALUATED',sourceTick:Math.round(t*20),
    floor:kind==='floor-transition'?9:8,...extras};
}
const sha='a'.repeat(40),videoHash='b'.repeat(64);
function evidence(){
 return {expectedSha:sha,scenario:'danger',viewport:'portrait',size:333,hash:videoHash,
 index:{sourceSha:sha,scenario:'danger',seed:'seed'},
 clock:{sourceSha:sha,scenario:'danger',seed:'seed',
   viewport:{width:390,height:844},status:'CALIBRATED',
   originalWebMSha256:videoHash,originalWebMBytes:333,
   originalVideoDurationSeconds:72,sourceEventTimecodes:[]}};
}
test('never accepts a clock from another source, another WebM, or uncalibrated film',()=>{
 const ok=evidence(); assert.equal(validateFilmProvenance(ok).length,0);
 const wrongHash=evidence(); wrongHash.hash='c'.repeat(64);
 assert.match(validateFilmProvenance(wrongHash).join(';'),/original-WebM-sha256/);
 const wrongSha=evidence(); wrongSha.clock.sourceSha='f'.repeat(40);
 assert.match(validateFilmProvenance(wrongSha).join(';'),/source-sha/);
 const wrongTier=evidence(); wrongTier.clock.status='NOT EVALUATED';
 assert.match(validateFilmProvenance(wrongTier).join(';'),/uncalibrated/);
 const wrongWidth=evidence(); wrongWidth.clock.viewport.width=960;
 assert.match(validateFilmProvenance(wrongWidth).join(';'),/viewport/);
});
test('selects the same real guardian episode in authoritative order, not a spliced later restart',()=>{
 const events=[
   event('guardian-hp-decrease',9.5),event('guardian-hp-decrease',18.3),
   event('guardian-source-defeated',22),event('source-supported-gate-approach',22.1),
   event('guardian-source-physical-threshold',22.49,0,{fromFloor:8,toFloor:9}),
   event('guardian-earned-floor-nine-handoff',22.49,0,{fromFloor:8,toFloor:9}),
   event('floor-transition',22.49,0,{fromFloor:8,toFloor:9}),
   event('guardian-source-defeated',61.2,1),
   event('source-supported-gate-approach',62,1)
 ];
 const selection=selectFilmEvents(events,'danger',72);
 assert.equal(selection.episode,0);
 assert.ok(selection.events.some(x=>x.kind==='guardian-source-defeated'));
 assert.ok(selection.events.some(x=>x.kind==='guardian-source-physical-threshold'));
 assert.ok(selection.events.every(x=>x.observedEpisode===0));
 assert.ok(selection.events.every(x=>Number.isFinite(x.nativeVideoSeconds)));
 assert.ok(selection.events.length<=10);
 assert.deepEqual([...selection.events].map(x=>x.nativeVideoSeconds),
   [...selection.events].map(x=>x.nativeVideoSeconds).sort((a,b)=>a-b));
});
test('result/intermission/restart search points do not assert on-screen truth',()=>{
 const s=selectFilmEvents([
   event('source-result-phase',21,0,{phase:'result',resultKind:'game',floor:5}),
   event('source-result-phase',25,0,{phase:'intermission',resultKind:'game',floor:5}),
   event('source-run-token-change',30,1,{floor:0})
 ],'outcome',70);
 assert.equal(s.events.length,3);
 assert.equal(s.visualVerdict,'NOT EVALUATED');
 assert.equal(s.independentReviewCount,0);
 assert.equal(s.sourceEventsAreRenderedFrames,false);
});
test('out of-video, undefined or uncalibrated search handles never become frame requests',()=>{
 const s=selectFilmEvents([
  event('guardian-hp-decrease',-1),
  event('guardian-source-defeated',80),
  {...event('floor-transition',30),inOriginalVideo:false},
  {...event('source-supported-gate-approach',14),eventVisibleInVideo:'CONFIRMED'}
 ],'danger',72);
 assert.equal(s.events.length,0);
 assert.equal(s.visualVerdict,'NOT EVALUATED');
});
