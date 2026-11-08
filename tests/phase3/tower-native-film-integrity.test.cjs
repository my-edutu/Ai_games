'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inspectFilmMetadata}=require('../../scripts/tower-native-film-integrity.cjs');
const SHA='1234567890abcdef1234567890abcdef12345678';
function fixture(viewport='desktop',scenario='danger'){
  const dimensions=viewport==='desktop'?{width:960,height:600}:{width:390,height:844};
  return {
    probe:{streams:[{codec_type:'video',codec_name:'vp8',...dimensions}],
      frames:Array.from({length:731},(_,i)=>({best_effort_timestamp_time:(i/12).toFixed(6)})),
      format:{duration:'60.833333'}},
    motion:{sourceSha:SHA,scenario,viewport:{name:viewport,...dimensions},
      seed:'tower-transformation-capture-v1',actualWallSeconds:61,
      startScene:{floor:scenario==='danger'?8:scenario==='moving'?7:0,
        tick:12,runToken:'authentic-source-run'},
      sourceStory:{sameEpisodeSourceSequenceObserved:true}},
    index:{sourceSha:SHA,scenario,viewport:{name:viewport,...dimensions},
      seed:'tower-transformation-capture-v1'},
    expected:{sourceSha:SHA,scenario,viewport},
  };
}
test('transport check reads original 960x600 WebM PTS and source provenance without awarding visual quality',()=>{
 const f=fixture();
 const a=inspectFilmMetadata(f.probe,f.motion,f.index,f.expected);
 assert.equal(a.status,'SOURCE_VIDEO_TRANSPORT_ONLY',a.problems.join(','));
 assert.deepEqual(a.problems,[]);
 assert.deepEqual(a.warnings,[]);
 assert.equal(a.visibleGameplayEvents,'NOT EVALUATED');
 assert.equal(a.independentBlindReviews,'NOT EVALUATED');
 assert.equal(a.realDevicePerformance,'NOT EVALUATED');
});
test('portrait WebM wrongly encoded at 960x600 is rejected even if sidecar claims 390x844',()=>{
 const f=fixture('portrait');
 f.probe.streams[0].width=960;f.probe.streams[0].height=600;
 const a=inspectFilmMetadata(f.probe,f.motion,f.index,f.expected);
 assert.equal(a.status,'BLOCKED');
 assert.ok(a.problems.includes('native-WebM-viewport-not-390x844'));
});
test('long container metadata cannot disguise short, corrupt or disordered frame coverage',()=>{
 const f=fixture();
 f.probe.frames=f.probe.frames.slice(0,10);
 let a=inspectFilmMetadata(f.probe,f.motion,f.index,f.expected);
 assert.equal(a.status,'BLOCKED');
 assert.ok(a.problems.includes('decoded-video-frames-do-not-span-60s'));
 f.probe.frames=[{best_effort_timestamp_time:'0'},{best_effort_timestamp_time:'1'},
   {best_effort_timestamp_time:'0.5'}];
 a=inspectFilmMetadata(f.probe,f.motion,f.index,f.expected);
 assert.equal(a.status,'BLOCKED');
 assert.ok(a.problems.includes('missing-or-nonmonotonic-native-PTS'));
});
test('wrong initial source floor, stale SHA, insufficient browser time and sparse frame delivery never certify capture',()=>{
 const f=fixture('portrait','moving');
 f.motion.startScene.floor=8;
 f.index.sourceSha='other';
 f.motion.actualWallSeconds=15;
 f.probe.frames=Array.from({length:75},(_,i)=>({best_effort_timestamp_time:String(i*0.82)}));
 const a=inspectFilmMetadata(f.probe,f.motion,f.index,f.expected);
 assert.equal(a.status,'BLOCKED');
 assert.ok(a.problems.includes('wrong-or-late-real-source-episode'));
 assert.ok(a.problems.includes('source-sidecar-SHA-mismatch'));
 assert.ok(a.problems.includes('browser-observation-shorter-than-60s'));
 assert.ok(a.warnings.includes('original-film-too-sparse-for-reliable-motion-judgement'));
 assert.equal(a.motionReviewability.startsWith('NOT EVALUATED'),true);
});
