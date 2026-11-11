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
  nativeFilmAudit:{sourceSha:sha,scenario:'danger',status:'SOURCE_VIDEO_TRANSPORT_ONLY',
    viewports:[{viewport,status:'SOURCE_VIDEO_TRANSPORT_ONLY',problems:[],
      originalWebMSha256:(source==='baseline'?'b':'c').repeat(64),videoBytes:1100,
      native:{width:viewport==='portrait'?390:960,
        height:viewport==='portrait'?844:600,firstPtsSeconds:0,lastPtsSeconds:70}}]},
  index:{sourceSha:sha},motion:{seed:'seed-1',recordingQuality:'low',scenario:'danger'},
  nativeScenePhase:{sourceSha:sha,viewport,scenario:'danger',
    originalWebMSha256:(source==='baseline'?'b':'c').repeat(64),
    originalWebMBytes:1100,originalVideoUnmodified:true,
    phase:{status:'CHROMATIC_PHASE_NEAR_SOURCE_CUE_ONLY',sourceTick:430,
      eventPixelsConfirmed:false,nativeOriginalFramesSampled:280,
      videoPhaseWitness:{nativeSeconds:23.25,precisionSeconds:.25}},
    hud:{status:'DRAWN_HUD_NEAR_SOURCE_SEARCH_ONLY',sourceTick:430,
      sourceEventIsScreenProof:false,originalFramesSampled:280,
      visibleHudFloorChange:{nativeVideoSeconds:23.25,precisionSeconds:.25,
        observedDigitBefore:8,observedDigitAfter:9,precedingEightFrames:12,
        followingNineFrames:4}}},
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
 assert.match(htmlFor([p]),/review-media\/portrait-a\.webm/);
 assert.doesNotMatch(htmlFor([p]),/portrait-(?:baseline|candidate)\.webm/);
 assert.match(htmlFor([p]),/"synchronized":true/);
});
test('veto fabricated missing baseline floor transition, never align HP to an unrelated event',()=>{
 const e=make('baseline').videoClock.sourceEventTimecodes.slice(0,1);
 const p=planPair([make('baseline','portrait',e),make('candidate')],'portrait',CANDIDATE);
 assert.equal(p.canReview,false);assert.match(p.failures.join(','),/missing-common/);
 assert.equal(p.unalignedInspectionOnly,true,
   'missing anchors veto event synchrony, not inspection of genuine unchanged videos');
 const html=htmlFor([p]);
 assert.match(html,/"synchronized":false/);
 assert.match(html,/No shared source-event anchor/);
 assert.doesNotMatch(html,/portrait-(?:baseline|candidate)\.webm/);
});
test('reject swapped original video bytes even if source SHA and timebase claim success',()=>{
 const a=make('baseline'),b=make('candidate');
 b.videoClock.originalWebMSha256='e'.repeat(64);
 const result=planPair([a,b],'portrait',CANDIDATE);
 assert.match(result.failures.join(','),/unverified-original/);
 assert.equal(result.unalignedInspectionOnly,undefined,
   'unverified originals must NEVER be packaged as reviewable media');
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

test('veto a self-described calibrated film without transport-decoded native PTS',()=>{
 const a=make('baseline'),b=make('candidate');
 b.nativeFilmAudit.viewports[0].native.lastPtsSeconds=14;
 assert.equal(planPair([a,b],'portrait',CANDIDATE).canReview,false);
});

test('genuine native films remain reviewable without miscuing 2.4s early source transitions',()=>{
 const a=make('baseline'),b=make('candidate');
 b.nativeScenePhase.phase.status='SOURCE_CUE_AND_VISIBLE_PHASE_DISAGREE';
 b.nativeScenePhase.phase.sourceToVioletPhaseDeltaSeconds=2.393;
 const p=planPair([a,b],'portrait',CANDIDATE);
 assert.equal(p.canReview,false);
 assert.equal(p.unalignedInspectionOnly,true);
 assert.match(p.failures.join(','),/native-scene-phase-not-confirmed-candidate/);
 assert.match(htmlFor([p]),/"synchronized":false/);
 assert.equal(p.status,'NOT EVALUATED');
});
test('a source-search timestamp cannot cue original film if the drawn floor glyph is 2.4s later',()=>{
 const a=make('baseline'),b=make('candidate');
 b.nativeScenePhase.hud.status='SOURCE_CUE_AND_DRAWN_HUD_DISAGREE';
 b.nativeScenePhase.hud.sourceSearchToDrawnHudDeltaSeconds=2.393;
 const p=planPair([a,b],'portrait',CANDIDATE);
 assert.equal(p.canReview,false);
 assert.equal(p.unalignedInspectionOnly,true);
 assert.match(p.failures.join(','),/native-scene-phase-not-confirmed-candidate/);
});
test('a visual phase sidecar cannot be reused from another native WebM',()=>{
 const a=make('baseline'),b=make('candidate');
 b.nativeScenePhase.originalWebMSha256='f'.repeat(64);
 const p=planPair([a,b],'portrait',CANDIDATE);
 assert.equal(p.canReview,false);assert.equal(p.unalignedInspectionOnly,true);
});

test('original drawn floor pixels can be cued while source event A/B stays vetoed',()=>{
 const a=make('baseline'),b=make('candidate');
 for(const r of [a,b]){
  r.nativeScenePhase.phase.status='SOURCE_CUE_AND_VISIBLE_PHASE_DISAGREE';
  r.nativeScenePhase.hud.status='SOURCE_CUE_AND_DRAWN_HUD_DISAGREE';
  r.nativeScenePhase.phase.videoPhaseWitness.nativeSeconds=26;
  r.nativeScenePhase.hud.visibleHudFloorChange.nativeVideoSeconds=26;
 }
 const p=planPair([a,b],'portrait',CANDIDATE);
 assert.equal(p.canReview,false);
 assert.equal(p.unalignedInspectionOnly,true);
 assert.equal(p.nativeRasterAnchors.length,1);
 assert.equal(p.nativeRasterAnchors[0].physicalGatewayCrossingConfirmed,false);
 assert.match(htmlFor([p]),/Raster-only cue/);
 assert.match(htmlFor([p]),/"synchronized":false/);
 assert.doesNotMatch(htmlFor([p]),new RegExp(FROZEN));
});
test('raster-only cue vetoes inconsistent HUD/chroma and forged video hash',()=>{
 const a=make('baseline'),b=make('candidate');
 b.nativeScenePhase.hud.status='SOURCE_CUE_AND_DRAWN_HUD_DISAGREE';
 b.nativeScenePhase.phase.status='SOURCE_CUE_AND_VISIBLE_PHASE_DISAGREE';
 b.nativeScenePhase.hud.visibleHudFloorChange.nativeVideoSeconds=26;
 assert.equal(planPair([a,b],'portrait',CANDIDATE).nativeRasterAnchors.length,0);
 b.nativeScenePhase.phase.videoPhaseWitness.nativeSeconds=26;
 b.nativeScenePhase.originalWebMSha256='d'.repeat(64);
 assert.equal(planPair([a,b],'portrait',CANDIDATE).nativeRasterAnchors.length,0);
});
