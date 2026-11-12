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
 viewport:{width:1440,height:900},frameId:tick+1,elapsedMs:tick*250,
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
