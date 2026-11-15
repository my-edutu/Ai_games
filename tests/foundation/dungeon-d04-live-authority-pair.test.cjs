'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classifyD04LiveAuthorityPair,SOURCE}=
 require('../browser/dungeon-d04-live-authority-pair.cjs');
const scene=tick=>({run:1,floor:1,tick,checksum:'real-'+tick});
const manifest=()=>Array.from({length:24},(_,i)=>({
 stageIndex:i,scene:scene(i),victimIds:i===4?['enemy-1-0']:[]
}));
const sample=(capture,tick,renderMs=15,extra={})=>({
 source:SOURCE,capture,seed:'visual-room-art-18',
 viewport:{width:1440,height:900},frameId:tick+1,submittedFrameId:tick+1,
 elapsedMs:tick*250,
 scene:scene(tick),camera:'tactical',focusedHeroId:'vanguard',
 cameraPosition:{x:3,y:20,z:3},cameraAim:{x:0,y:0,z:0},
 softwareWebGL:true,postFX:'direct',directRenderMs:renderMs,
 vfxDrawCalls:7,vfxReservedInstances:104,consentedSoundstage:true,
 recordingAtSample:capture==='on',recentDeliveryReceipts:[],...extra
});
const offRec=()=>({status:'NOT_STARTED',peakConcurrentRecorders:0,videoTracks:0,audioTracks:0});
const onRec=()=>({status:'RECORDED',peakConcurrentRecorders:1,videoTracks:1,audioTracks:1,
 bytes:65000,startedBeforeAuthority:true,stoppedAfterAuthority:true,requestedFrames:12});
function pair(){return {manifest:manifest(),
 off:{capture:'off',recorder:offRec(),samples:Array.from({length:12},(_,i)=>sample('off',i,12+i))},
 on:{capture:'on',recorder:onRec(),samples:Array.from({length:12},(_,i)=>sample('on',i,15+i))}};}
test('continuous original audio capture is diagnostic only; not impact AV or causality',()=>{
 const r=classifyD04LiveAuthorityPair(pair());
 assert.equal(r.status,'MATCHED_LIVE_AUTHORITY_DIAGNOSTIC_ONLY');
 assert.equal(r.matchedTicks,12);assert.equal(r.matchedHpLossTicks,1);
 assert.equal(r.off.worstMs,23);assert.equal(r.on.worstMs,26);
 assert.equal(r.paired.worstPositiveDeltaMs,3);
 assert.equal(r.causedByRecorder,null);assert.equal(r.sampleSynchronized,false);
 assert.equal(r.impactAVAccepted,false);
});
test('falsified authority and repeated tick/checksum fail closed',()=>{
 const a=pair();a.manifest[4].victimIds=[];
 assert.equal(classifyD04LiveAuthorityPair(a).status,'INVALID_REAL_AUTHORITY');
 const b=pair();b.manifest[4].scene.checksum=b.manifest[3].scene.checksum;
 assert.equal(classifyD04LiveAuthorityPair(b).status,'INVALID_REAL_AUTHORITY');
 const c=pair();c.manifest[9].scene.tick=8;
 assert.equal(classifyD04LiveAuthorityPair(c).status,'INVALID_REAL_AUTHORITY');
});
test('later unrelated cue and invented attacker never certify original injury',()=>{
 const d=pair();d.on.samples[4].recentDeliveryReceipts=[{
  cueId:'1:1:5:damage:-:enemy-1-0',scene:'1:1',tick:5,kind:'damage',
  decision:'delivered',visual:true,frameId:5,observationToSubmissionMs:20
 }];
 const r=classifyD04LiveAuthorityPair(d);
 assert.equal(r.matchedHpLossTicks,1);
 assert.equal(r.damageReceipts.on.timely,0);
 assert.equal(r.impactAVAccepted,false);
});
test('actual 2661ms WebGL stall is not clipped or hidden',()=>{
 const d=pair();d.on.samples[4].directRenderMs=2661;
 const r=classifyD04LiveAuthorityPair(d);
 assert.equal(r.on.worstMs,2661);
 assert.equal(r.paired.worstPositiveDeltaMs,2645);
 assert.equal(r.allObserved.on.worstMs,2661);
});
test('mismatched camera, viewport, source and duplicate renderer frames excluded',()=>{
 const d=pair();d.on.samples[4].cameraAim.x=6;
 d.on.samples[5].viewport.width=390;
 d.on.samples[6].source='synthetic';
 d.on.samples[7].frameId=d.on.samples[6].frameId;
 const r=classifyD04LiveAuthorityPair(d);
 assert.deepEqual(r.excludedTicks,[4,5,6,7]);
 assert.equal(r.matchedHpLossTicks,0);
 assert.equal(r.status,'INSUFFICIENT_MATCHED_LIVE_DAMAGE');
});
test('multiple frames on one real tick retain the worst renderer cost',()=>{
 const d=pair();
 d.on.samples.splice(5,0,sample('on',4,2010,{frameId:90,elapsedMs:1125}));
 d.on.samples.slice(6).forEach((s,i)=>s.frameId=91+i);
 const r=classifyD04LiveAuthorityPair(d);
 assert.equal(r.on.worstMs,2010);
 assert.ok(r.repeatedTickSamples.on>0);
 assert.equal(r.impactAVAccepted,false);
});
test('concurrent encoders, missing sound consent and over-budget VFX fail closed',()=>{
 for(const change of [{peakConcurrentRecorders:2},{audioTracks:0},{status:'UNAVAILABLE'}]){
  const d=pair();Object.assign(d.on.recorder,change);
  assert.equal(classifyD04LiveAuthorityPair(d).status,'CAPTURE_PROVENANCE_UNVERIFIED');
 }
 const e=pair();e.on.samples[4].consentedSoundstage=false;
 assert.equal(classifyD04LiveAuthorityPair(e).status,'INSUFFICIENT_MATCHED_LIVE_DAMAGE');
 const f=pair();f.on.samples[4].vfxDrawCalls=8;
 const r=classifyD04LiveAuthorityPair(f);
 assert.equal(r.status,'LIVE_EFFECT_BUDGET_VIOLATION');
 assert.deepEqual(r.budgetViolations.map(x=>x.kind),['VFX_DRAW_CALL_CAP']);
});

/**
 * Test-first six-view original-game A/V contract. These synthetic manifest
 * fixtures exercise the evidence guard only; they are NOT captured footage.
 * Real Chrome must supply the authoritative samples and encoded recordings.
 */
const MULTIVIEW_CAMERA_MODES=['cinematic','tactical','chase'];
function sixViewFixture(){
 const seed='visual-room-art-18',runs=[];
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  for(const viewpoint of MULTIVIEW_CAMERA_MODES){
   runs.push({seed,viewpoint,viewport,feedbackMode:'d04',capture:'on',
    start:{status:'STARTED',originalAudioTracks:1},
    recorder:onRec(),errors:[],
    samples:Array.from({length:12},(_,tick)=>sample('on',tick,15,{
     camera:viewpoint,viewport,seed,feedbackMode:'d04',
     cameraPosition:{cinematic:{x:2,y:7,z:6},
      tactical:{x:3,y:20,z:3},chase:{x:1,y:8,z:4}}[viewpoint],
     d04PreviewEnabled:true,previewAudioOptedIn:true
    }))});
  }
 }
 return {seed,manifest:manifest(),runs};
}
test('three authentic camera modes at both sizes can be matched only by exact immutable authority states',()=>{
 const {classifyD04RealMultiview}=
  require('../browser/dungeon-d04-live-authority-pair.cjs');
 const valid=classifyD04RealMultiview(sixViewFixture());
 assert.equal(valid.status,'SIX_VIEWPOINT_CAPTURED_UNALIGNED');
 assert.equal(valid.capturedRecorders,6);
 assert.equal(valid.matchedAuthorityTicks,12);
 assert.equal(valid.matchedHpLossTicks,1);
 assert.deepEqual(valid.missingViews,[]);
 assert.equal(valid.sampleSynchronized,false);
 assert.equal(valid.impactAVAccepted,false);
 assert.equal(valid.cameraMovingVideoVerified,false,
  'Six encoded files alone do not prove decoded moving combat or audio onset');
});
test('a forged state, wrong physical viewpoint or duplicated camera arm cannot masquerade as matched combat',()=>{
 const {classifyD04RealMultiview}=
  require('../browser/dungeon-d04-live-authority-pair.cjs');
 for(const mutate of [
  a=>a.runs[0].samples[4].scene.checksum='invented',
  a=>a.runs[0].samples[4].camera='tactical',
  a=>a.runs[0].viewpoint='tactical',
  a=>a.runs[0].samples[4].previewAudioOptedIn=false,
  a=>a.runs[0].samples[4].vfxReservedInstances=105,
  a=>a.runs[0].recorder.audioTracks=0
 ]){
  const a=sixViewFixture();mutate(a);
  const v=classifyD04RealMultiview(a);
  assert.notEqual(v.status,'SIX_VIEWPOINT_CAPTURED_UNALIGNED',
   'noncanonical or over-budget evidence must not pass six-view provenance');
  assert.equal(v.impactAVAccepted,false);
 }
});
test('sparse real browser sampling and missing recorder remain explicit gaps, not false audiovisual certification',()=>{
 const {classifyD04RealMultiview}=
  require('../browser/dungeon-d04-live-authority-pair.cjs');
 const a=sixViewFixture();
 a.runs.forEach((r,i)=>r.samples=r.samples.filter(s=>s.scene.tick===i+1));
 let v=classifyD04RealMultiview(a);
 assert.equal(v.matchedAuthorityTicks,0);
 assert.equal(v.status,'SPARSE_VIEWPOINT_COVERAGE');
 assert.equal(v.sampleSynchronized,false);
 const b=sixViewFixture();b.runs[0].recorder.status='UNAVAILABLE';
 v=classifyD04RealMultiview(b);
 assert.equal(v.status,'INCOMPLETE_VIEWPOINT_CAPTURE');
 assert.equal(v.capturedRecorders,5);
 assert.equal(v.impactAVAccepted,false);
});

test('camera-mode labels alone do not establish three different genuine physical viewpoints',()=>{
 const {classifyD04RealMultiview}=
  require('../browser/dungeon-d04-live-authority-pair.cjs');
 const a=sixViewFixture();
 for(const arm of a.runs)
  for(const s of arm.samples){
   s.cameraPosition={x:3,y:20,z:3};
   s.cameraAim={x:0,y:0,z:0};
  }
 const verdict=classifyD04RealMultiview(a);
 assert.equal(verdict.status,'VIEWPOINT_GEOMETRY_UNVERIFIED',
  'three UI mode names may not borrow one unchanged physical camera');
 assert.equal(verdict.distinctViewPairs,0);
 assert.equal(verdict.impactAVAccepted,false);
});

test('frame-acknowledged six-view capture is explicitly non-realtime and never inherits wall-clock audiovisual acceptance',()=>{
 const {classifyD04RealMultiview}=
  require('../browser/dungeon-d04-live-authority-pair.cjs');
 const a=sixViewFixture();
 for(const arm of a.runs){
  arm.capturePacing='frame-acknowledged';
  arm.pacedReceipts=arm.samples.map((s,index)=>({
   stageIndex:index,scene:s.scene,frameId:s.frameId,
   acknowledgedFrames:s.frameId,accepted:true
  }));
 }
 let v=classifyD04RealMultiview(a);
 assert.equal(v.status,'SIX_VIEWPOINT_FRAME_PACED_UNALIGNED');
 assert.equal(v.matchedHpLossTicks,1);
 assert.equal(v.capturePacing,'frame-acknowledged');
 assert.equal(v.sampleSynchronized,false);
 assert.equal(v.impactAVAccepted,false);
 const b=sixViewFixture();
 b.runs[0].capturePacing='frame-acknowledged';
 b.runs[0].pacedReceipts=[{stageIndex:4,scene:scene(4),
  frameId:5,acknowledgedFrames:5,accepted:true}];
 v=classifyD04RealMultiview(b);
 assert.equal(v.status,'INVALID_VIEWPOINT_PROVENANCE',
  'mixed wall-clock and paced recordings cannot pose as one verified temporal experiment');
 const c=sixViewFixture();
 for(const arm of c.runs){
  arm.capturePacing='frame-acknowledged';
  arm.pacedReceipts=arm.samples.map((s,index)=>({
   stageIndex:index,scene:s.scene,frameId:s.frameId,
   acknowledgedFrames:s.frameId,accepted:true
  }));
 }
 c.runs[2].pacedReceipts[4].scene.checksum='invented-hp';
 v=classifyD04RealMultiview(c);
 assert.equal(v.status,'INVALID_VIEWPOINT_PROVENANCE',
  'a claim of a frame-acknowledged HP tick must match the immutable runtime state');
});


test('live original HP-impact credit requires drawable art on its exact submitted frame, not merely a sound',()=>{
 const canonical={
  cueId:'1:1:4:damage:-:enemy-1-0',scene:'1:1',tick:4,kind:'damage',
  visual:true,audio:true,decision:'delivered',frameId:5,
  observedClockMs:1000,submittedClockMs:1018,observationToSubmissionMs:18
 };
 const d=pair();d.on.samples[4].recentDeliveryReceipts=[{
  ...canonical,visualDrawableAtSubmission:false
 }];
 assert.equal(classifyD04LiveAuthorityPair(d).damageReceipts.on.timely,0,
  'sound-only HP foley must not earn a visible contact credit');
 d.on.samples[4].recentDeliveryReceipts=[{
  ...canonical,visualDrawableAtSubmission:true,frameId:3
 }];
 assert.equal(classifyD04LiveAuthorityPair(d).damageReceipts.on.timely,0,
  'old receipt retained in the ring is not proof of this submitted frame');
 d.on.samples[4].recentDeliveryReceipts=[{
  ...canonical,visualDrawableAtSubmission:true
 }];
 assert.equal(classifyD04LiveAuthorityPair(d).damageReceipts.on.timely,1,
  'same-frame drawable witnessed injury is legitimate');
 d.on.samples[4].recentDeliveryReceipts=[{
  ...canonical,audio:false,decision:'visual-only-submitted',
  visualDrawableAtSubmission:true
 }];
 assert.equal(classifyD04LiveAuthorityPair(d).damageReceipts.on.timely,1,
  'muted genuine visual-only injury still has a drawable frame witness');
});

test('six-view HP coverage distinguishes matched authority states from matching drawable injury frames',()=>{
 const {classifyD04RealMultiview}=
  require('../browser/dungeon-d04-live-authority-pair.cjs');
 const a=sixViewFixture(),frame={
  cueId:'1:1:4:damage:-:enemy-1-0',scene:'1:1',tick:4,kind:'damage',
  visual:true,audio:true,decision:'delivered',frameId:5,
  observedClockMs:1000,submittedClockMs:1018,observationToSubmissionMs:18
 };
 let v=classifyD04RealMultiview(a);
 assert.equal(v.matchedHpLossTicks,1);
 assert.equal(v.matchedDrawableHpLossTicks,0,
  'six rendered state checksums without confirmed injury art are not six visible impacts');
 for(const arm of a.runs)arm.samples[4].recentDeliveryReceipts=[
  {...frame,visualDrawableAtSubmission:true}];
 v=classifyD04RealMultiview(a);
 assert.equal(v.matchedDrawableHpLossTicks,1,
  'each actual viewpoint needs its own same-frame injury witness');
 a.runs[5].samples[4].recentDeliveryReceipts=[
  {...frame,visualDrawableAtSubmission:false}];
 v=classifyD04RealMultiview(a);
 assert.equal(v.matchedDrawableHpLossTicks,0,
  'a single hidden injury must break the six-view drawable contact claim');
 assert.equal(v.sampleSynchronized,false);
 assert.equal(v.impactAVAccepted,false);
});


test('original HP receipt joins D04 submitted-frame serial instead of an unrelated renderer-info counter',()=>{
 const canonical={
  cueId:'1:1:4:damage:-:enemy-1-0',scene:'1:1',tick:4,
  kind:'damage',visual:true,visualDrawableAtSubmission:true,
  audio:true,decision:'delivered',frameId:5,
  observedClockMs:1000,submittedClockMs:1018,observationToSubmissionMs:18
 };
 const d=pair();d.on.samples[4].recentDeliveryReceipts=[canonical];
 // A valid D04 acknowledgment can have a different serial from Three.js
 // renderer.info.render.frame (its reset count). Neither may borrow the other.
 d.on.samples[4].frameId=50;
 for(let i=5;i<d.on.samples.length;i++)d.on.samples[i].frameId=50+i-4;
 let r=classifyD04LiveAuthorityPair(d);
 assert.equal(r.damageReceipts.on.timely,1,
  'D04 submitted frame 5 is what actually authorized sound/art');
 d.on.samples[4].submittedFrameId=6;
 r=classifyD04LiveAuthorityPair(d);
 assert.equal(r.damageReceipts.on.timely,0,
  'the same immutable HP state and renderer frame cannot borrow D04 submission 5');
 delete d.on.samples[4].submittedFrameId;
 r=classifyD04LiveAuthorityPair(d);
 assert.equal(r.damageReceipts.on.timely,0,
  'missing D04 submission identity must never silently fall back to an unrelated counter');
});
