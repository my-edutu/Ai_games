'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {FROZEN,matchSourceEvents,auditPairs}=require('../../scripts/tower-event-pairing.cjs');
function rec(source,scenario='danger',viewport='portrait'){
 const sha=source==='baseline'?FROZEN:'c'.repeat(40);
 const filmSha='f'.repeat(64),videoBytes=4096;
 return {source,scenario,viewport,artifact:'authentic-'+source,sourceSha:sha,
  videoPath:'original/live.webm',videoPresent:true,videoSha256:filmSha,videoBytes,
  nativeFilmAudit:{schemaVersion:1,sourceSha:sha,scenario,
   status:'SOURCE_VIDEO_TRANSPORT_ONLY',viewports:[{
    viewport,sourceSha:sha,scenario,status:'SOURCE_VIDEO_TRANSPORT_ONLY',
    problems:[],originalWebMSha256:filmSha,videoBytes}]},
  motion:{sourceSha:sha,seed:'same-seed',graphicsTier:'low',reducedMotion:false,
   soundEnabled:false,actualWallSeconds:68,
   viewport:viewport==='portrait'?{width:390,height:844}:{width:960,height:600},
   startScene:{floor:scenario==='danger'?8:scenario==='moving'?7:0,
     tick:80,runToken:'seeded-run-0',lifecycle:'running',atMs:1000}},
  index:{sourceSha:sha,seed:'same-seed',scenario,sourceTicksObserved:120,events:[
   {kind:'guardian-present',floor:8,atMs:1000},
   {kind:'guardian-hp-decrease',floor:8,atMs:2000},
   {kind:'guardian-source-defeated',floor:8,atMs:3000},
   {kind:'floor-transition',floor:9,fromFloor:8,toFloor:9,atMs:4000}
  ]}};
}
// Calibrated search handles never become a human-confirmed action by code.
function withOriginalFilmClock(record) {
 record.videoClock={sourceSha:record.sourceSha,scenario:record.scenario,
   viewport:record.motion.viewport,seed:record.motion.seed,
   graphicsTier:record.motion.graphicsTier,status:'CALIBRATED',
   originalWebMSha256:record.videoSha256,originalWebMBytes:record.videoBytes,
   calibration:{status:'CALIBRATED',offsetMs:-1000,maxResidualMs:20},
   originalVideoDurationSeconds:75,
   sourceEventTimecodes:record.index.events.map(e=>({...e,
     nativeVideoSeconds:(e.atMs-1000)/1000,inOriginalVideo:true,
     eventVisibleInVideo:'NOT EVALUATED'}))};
 return record;
}
test('calibrated event-index clocks yield honest event-relative film search handles',()=>{
 const before=withOriginalFilmClock(rec('baseline'));
 const after=withOriginalFilmClock(rec('candidate'));
 const report=auditPairs([before,after],'c'.repeat(40));
 assert.equal(report.calibratedTimebasePairs,1);
 assert.equal(report.videoTimecodesCalibrated,false);
 const comparison=report.comparisons[0];
 assert.equal(comparison.nativeSourceVideoTimebase.baseline,'CALIBRATED');
 assert.equal(comparison.nativeSourceVideoTimebase.candidate,'CALIBRATED');
 assert.equal(comparison.nativeSourceVideoTimebase.calibratedSourceEventPairSearchHandles,4);
 assert.equal(comparison.sourceEventPairs[1].calibratedSourceEventSearch.baseline.nativeVideoSeconds,1);
 assert.equal(comparison.sourceEventPairs[1].calibratedSourceEventSearch.bothInOriginalVideo,true);
 assert.equal(comparison.sourceEventPairs[1].calibratedSourceEventSearch.eventVisibleInBothVideos,false);
 assert.equal(comparison.sourceEventPairs[1].visuallyMatched,false);
 assert.equal(report.fullMotionPaired,false);
 assert.equal(report.verdict,'NOT EVALUATED');
});
test('native calibration cannot transfer to mismatched or unbound WebM bytes',()=>{
 const baseline=withOriginalFilmClock(rec('baseline'));
 const candidate=withOriginalFilmClock(rec('candidate'));
 assert.equal(auditPairs([baseline,candidate],'c'.repeat(40))
   .comparisons[0].nativeSourceVideoTimebase.candidate,'CALIBRATED');
 const originalSha=candidate.videoClock.originalWebMSha256;
 const originalBytes=candidate.videoClock.originalWebMBytes;
 const cases=[
   ['swapped-video-digest',()=>{candidate.videoClock.originalWebMSha256='a'.repeat(64);}],
   ['wrong-video-length',()=>{candidate.videoClock.originalWebMBytes=originalBytes+1;}],
   ['legacy-unbound-sidecar',()=>{delete candidate.videoClock.originalWebMSha256;}],
 ];
 for(const [label,corrupt] of cases) {
   candidate.videoClock.originalWebMSha256=originalSha;
   candidate.videoClock.originalWebMBytes=originalBytes;
   corrupt();
   const comparison=auditPairs([baseline,candidate],'c'.repeat(40)).comparisons[0];
   assert.equal(comparison.nativeFilmTransport.candidate.status,
     'SOURCE_VIDEO_TRANSPORT_ONLY',label);
   assert.equal(comparison.nativeSourceVideoTimebase.candidate,'NOT EVALUATED',label);
   assert.equal(comparison.nativeSourceVideoTimebase.calibratedSourceEventPairSearchHandles,0,label);
 }
});

test('stale, tampered or absent clock cannot create an event-matched film claim',()=>{
 const before=withOriginalFilmClock(rec('baseline'));
 const after=withOriginalFilmClock(rec('candidate'));
 after.videoClock.sourceSha='unexpected-sha';
 const report=auditPairs([before,after],'c'.repeat(40));
 assert.equal(report.comparisons[0].nativeSourceVideoTimebase.candidate,'NOT EVALUATED');
 assert.equal(report.comparisons[0].nativeSourceVideoTimebase.calibratedSourceEventPairSearchHandles,0);
 assert.equal(report.fullMotionPaired,false);
 delete after.videoClock;
 const missing=auditPairs([before,after],'c'.repeat(40));
 assert.equal(missing.comparisons[0].nativeSourceVideoTimebase.candidate,'NOT EVALUATED');
 assert.equal(missing.videoTimecodesCalibrated,false);
});
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
 assert.ok(a.comparisons[0].faults.length>=5);
 assert.ok(a.comparisons[0].faults.some(s=>s.includes('report-source-or-scenario-mismatch')));
 assert.equal(a.missingPairs.length,7);
 assert.equal(a.verdict,'NOT EVALUATED');
});

test('identical events in separate authentic run episodes are not spliced together',()=>{
 const b=[{kind:'guardian-present',floor:8,atMs:1000,observedEpisode:0},
   {kind:'guardian-source-defeated',floor:8,atMs:2000,observedEpisode:0}];
 const c=[{kind:'guardian-present',floor:8,atMs:1200,observedEpisode:0},
   {kind:'guardian-source-defeated',floor:8,atMs:9000,observedEpisode:1}];
 const r=matchSourceEvents(b,c);
 assert.equal(r.pairs.length,1);
 assert.equal(r.missingFromCandidate.length,1);
 assert.equal(r.missingFromBaseline.length,1);
 assert.equal(r.pairs[0].observedEpisodeProvenance,true);
});
test('danger source story discloses absent earned gate in original clips without assigning a film verdict',()=>{
 const b=rec('baseline'),c=rec('candidate');
 c.index.events.push({kind:'source-supported-gate-approach',floor:8,atMs:5000,observedEpisode:0});
 const a=auditPairs([b,c],'c'.repeat(40));
 assert.ok(a.comparisons[0].sourceStory.missingCandidateSearchEvents.includes('guardian-earned-floor-nine-handoff'));
 assert.ok(a.comparisons[0].sourceStory.missingBaselineSearchEvents.includes('source-supported-gate-approach'));
 assert.equal(a.comparisons[0].verdict.startsWith('NOT EVALUATED'),true);
});

function witness(kind, floor, atMs, observedEpisode=0, detail={}) {
 return {kind, floor, atMs, observedEpisode, ...detail};
}
function dangerWitnesses() {
 return [
  witness('guardian-present',8,1000),
  witness('guardian-hp-decrease',8,2000),
  witness('guardian-source-defeated',8,3000),
  witness('source-supported-gate-approach',8,4000),
  witness('guardian-earned-floor-nine-handoff',9,5000,0,{fromFloor:8,toFloor:9}),
  witness('guardian-source-physical-threshold',9,5000,0,{fromFloor:8,toFloor:9}),
 ];
}
test('source event comparison requires ordered, same-episode earned guardian passage',()=>{
 const baseline=rec('baseline'),candidate=rec('candidate');
 baseline.index.events=dangerWitnesses().slice(0,2);
 candidate.index.events=dangerWitnesses();
 const result=auditPairs([baseline,candidate],'c'.repeat(40));
 assert.equal(result.provenanceDefects.length,0);
 assert.deepEqual(result.sourceStoryDefects,[]);
 assert.equal(result.comparisons[0].sourceStorySequenceObserved,true);
 assert.equal(result.comparisons[0].sourceStoryEpisodes.candidate.observedEpisode,0);
 assert.equal(result.comparisons[0].verdict.startsWith('NOT EVALUATED'),true);
});
test('full-length native danger WebM with a split guardian episode is NOT source matched',()=>{
 const baseline=rec('baseline'),candidate=rec('candidate');
 baseline.index.events=dangerWitnesses().slice(0,2);
 candidate.index.events=dangerWitnesses();
 candidate.index.events[2].observedEpisode=1;
 candidate.motion.actualWallSeconds=132;
 const report=auditPairs([baseline,candidate],'c'.repeat(40));
 assert.equal(report.provenanceDefects.length,1,
   'a split episode with a later return to an earlier episode is a provenance violation');
 assert.ok(report.provenanceDefects[0].faults.some(f=>
   f.includes('nonmonotonic-source-episode-index')));
 assert.equal(report.sourceStoryDefects.length,1);
 assert.equal(report.comparisons[0].sourceStorySequenceObserved,false);
 assert.deepEqual(report.sourceStoryDefects[0].candidateMissingBeats,[]);
 assert.equal(report.verdict,'NOT EVALUATED');
});
test('portrait danger recording of floor ten instead of floor-eight duel lacks coverage',()=>{
 const baseline=rec('baseline'),candidate=rec('candidate');
 baseline.index.events=[witness('route-selection',10,1000,0,{selectedPlatformId:'f10:p1'})];
 candidate.index.events=[witness('source-result-phase',10,1000,0,{phase:'result',resultKind:'game'})];
 const report=auditPairs([baseline,candidate],'c'.repeat(40));
 assert.equal(report.provenanceDefects.length,0);
 assert.equal(report.sourceStoryDefects.length,1);
 assert.ok(report.sourceStoryDefects[0].candidateMissingBeats.includes('guardian-present'));
 assert.equal(report.comparisons[0].sourceStorySequenceObserved,false);
});
test('outcome requires game result then NEXT episode restart, not technical or same episode',()=>{
 const base=rec('baseline','outcome');
 const current=rec('candidate','outcome');
 const completed=[
  witness('source-result-phase',8,6000,0,{phase:'result',resultKind:'game',reason:'fall'}),
  witness('source-result-phase',8,6500,0,{phase:'intermission',resultKind:'game',reason:'fall'}),
  witness('source-run-token-change',8,9000,1),
 ];
 base.index.events=completed.map(e=>({...e}));
 current.index.events=completed.map(e=>({...e}));
 assert.deepEqual(auditPairs([base,current],'c'.repeat(40)).sourceStoryDefects,[]);
 current.index.events[2].observedEpisode=0;
 assert.equal(auditPairs([base,current],'c'.repeat(40)).sourceStoryDefects.length,1);
 current.index.events[2].observedEpisode=1;
 current.index.events[0].resultKind='technical';
 assert.equal(auditPairs([base,current],'c'.repeat(40)).sourceStoryDefects.length,1);
});
test('moving and ascent witnesses must originate on their requested floors',()=>{
 for(const [scenario,kind,wrongFloor] of [
  ['moving','observed-moving-deck-position-change',8],
  ['ascent','route-selection',1]
 ]) {
  const base=rec('baseline',scenario),current=rec('candidate',scenario);
  base.index.events=[witness(kind,scenario==='moving'?7:0,1000,0,
    scenario==='moving'?{platformId:'f7:p3'}:{selectedPlatformId:'f0:p1'})];
  current.index.events=[witness(kind,wrongFloor,1000,0,
    scenario==='moving'?{platformId:'f8:p3'}:{selectedPlatformId:'f1:p1'})];
  const report=auditPairs([base,current],'c'.repeat(40));
  assert.equal(report.provenanceDefects.length,0);
  assert.equal(report.sourceStoryDefects.length,1);
 }
});

test('late portrait starts on floor ten are a provenance veto, not matched footage',()=>{
 const base=rec('baseline','danger','portrait');
 const current=rec('candidate','danger','portrait');
 base.motion.startScene={...base.motion.startScene,floor:8,tick:467};
 current.motion.startScene={...current.motion.startScene,floor:10,tick:632};
 const report=auditPairs([base,current],'c'.repeat(40));
 assert.ok(report.comparisons[0].faults.includes(
   'missing, late, or wrong-floor initial source episode'));
 assert.equal(report.provenanceDefects.length,1);
 assert.equal(report.fullMotionPaired,false);
 assert.equal(report.verdict,'NOT EVALUATED');
});
test('similar source event names do not excuse a three-second start offset',()=>{
 const base=rec('baseline','ascent','desktop');
 const current=rec('candidate','ascent','desktop');
 base.motion.startScene.tick=20;
 current.motion.startScene.tick=150;
 const report=auditPairs([base,current],'c'.repeat(40));
 assert.ok(report.comparisons[0].faults.includes(
   'initial source ticks differ by over 3 seconds'));
 assert.equal(report.verdict,'NOT EVALUATED');
});
test('a missing first source observation cannot be silently treated as matched',()=>{
 const base=rec('baseline','outcome','portrait');
 const current=rec('candidate','outcome','portrait');
 delete current.motion.startScene;
 const report=auditPairs([base,current],'c'.repeat(40));
 assert.equal(report.provenanceDefects.length,1);
 assert.equal(report.comparisons[0].sourceStorySequenceObserved,false);
});

test('outcome without a real intermission is incomplete, not a film success',()=>{
 const before=rec('baseline','outcome'),after=rec('candidate','outcome');
 const result=witness('source-result-phase',0,6000,0,
  {phase:'result',resultKind:'game',reason:'fall'});
 const restart=witness('source-run-token-change',0,9000,1);
 before.index.events=[result,restart];after.index.events=[result,restart];
 const failed=auditPairs([before,after],'c'.repeat(40));
 assert.equal(failed.sourceStoryDefects.length,1);
 assert.ok(failed.sourceStoryDefects[0].candidateMissingBeats
  .includes('source-result-phase:intermission'));
 const intermission=witness('source-result-phase',0,6500,0,
  {phase:'intermission',resultKind:'game',reason:'fall'});
 before.index.events=[result,intermission,restart];
 after.index.events=[result,intermission,restart];
 assert.equal(auditPairs([before,after],'c'.repeat(40)).sourceStoryDefects.length,0);
});

test('native film provenance refuses reordered crossing after restart or regressed run episode',()=>{
 const baseline=rec('baseline'),candidate=rec('candidate');
 candidate.index.events.push({
   kind:'guardian-source-physical-threshold',floor:9,fromFloor:8,toFloor:9,
   atMs:2500,observedEpisode:0,
 });
 let report=auditPairs([baseline,candidate],'c'.repeat(40));
 assert.equal(report.comparisons[0].provenanceVerified,false);
 assert.ok(report.comparisons[0].faults.includes(
   'candidate-nonmonotonic-source-event-index'));
 assert.equal(report.comparisons[0].nativeSourceVideoTimebase.candidate,'NOT EVALUATED');
 assert.equal(report.verdict,'NOT EVALUATED');
 // Wall clock monotonic alone is insufficient when the trace switches back
 // to an earlier episode after the genuine restart marker.
 candidate.index.events.pop();
 candidate.index.events=[
   {kind:'guardian-present',floor:8,atMs:1000,observedEpisode:0},
   {kind:'source-run-token-change',floor:0,atMs:2000,observedEpisode:1},
   {kind:'guardian-source-defeated',floor:8,atMs:3000,observedEpisode:0},
 ];
 report=auditPairs([baseline,candidate],'c'.repeat(40));
 assert.ok(report.comparisons[0].faults.includes(
   'candidate-nonmonotonic-source-episode-index'));
 assert.equal(report.comparisons[0].provenanceVerified,false);
 // A normal, chronologically indexed source trace is admitted to the
 // transport gate but STILL cannot claim film-visible gameplay or quality.
 candidate.index.events=[
   {kind:'guardian-present',floor:8,atMs:1000,observedEpisode:0},
   {kind:'guardian-source-defeated',floor:8,atMs:2000,observedEpisode:0},
   {kind:'floor-transition',floor:9,fromFloor:8,toFloor:9,atMs:2500,observedEpisode:0},
   {kind:'guardian-source-physical-threshold',floor:9,fromFloor:8,toFloor:9,atMs:2500,observedEpisode:0},
   {kind:'source-run-token-change',floor:0,atMs:3500,observedEpisode:1},
 ];
 report=auditPairs([baseline,candidate],'c'.repeat(40));
 assert.equal(report.comparisons[0].provenanceVerified,true);
 assert.equal(report.comparisons[0].verdict.startsWith('NOT EVALUATED'),true);
});
test('native transport audit is required for every candidate/baseline pairing',()=>{
 const base=rec('baseline','ascent','desktop'),current=rec('candidate','ascent','desktop');
 const sha='c'.repeat(40);
 assert.equal(auditPairs([base,current],sha).comparisons[0].provenanceVerified,true);
 delete current.nativeFilmAudit;
 let r=auditPairs([base,current],sha);
 assert.equal(r.comparisons[0].provenanceVerified,false);
 assert.ok(r.comparisons[0].faults.some(f=>f.includes('report-missing-or-blocked')));
 current.nativeFilmAudit={...base.nativeFilmAudit,sourceSha:current.sourceSha,
  viewports:[{...base.nativeFilmAudit.viewports[0],sourceSha:current.sourceSha}]};
 current.nativeFilmAudit.viewports[0].originalWebMSha256='e'.repeat(64);
 r=auditPairs([base,current],sha);
 assert.ok(r.comparisons[0].faults.some(f=>f.includes('sha256-does-not-match-audit')));
 current.nativeFilmAudit.viewports[0].originalWebMSha256=current.videoSha256;
 current.nativeFilmAudit.status='BLOCKED';
 r=auditPairs([base,current],sha);
 assert.equal(r.comparisons[0].nativeSourceVideoTimebase.candidate,'NOT EVALUATED');
 assert.equal(r.provenanceDefects.length,1);
 assert.equal(r.verdict,'NOT EVALUATED');
});
