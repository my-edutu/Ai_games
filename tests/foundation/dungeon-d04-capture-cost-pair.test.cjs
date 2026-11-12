'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classifyD04CaptureCostPair,SOURCE}=
 require('../browser/dungeon-d04-capture-cost-pair.cjs');

const scene=i=>({run:1,floor:1,tick:i,checksum:'real-'+i});
const expected=()=>Array.from({length:8},(_,i)=>({
 stageIndex:i,scene:scene(i),hpLossCount:i===4?1:0
}));
function sample(capture,stageIndex,renderMs=12,extra={}){
 return {source:SOURCE,capture,stageIndex,seed:'visual-room-art-18',
  viewport:{width:1440,height:900},frameId:stageIndex+10,
  scene:scene(stageIndex),camera:'tactical',focusedHeroId:'vanguard',
  cameraPosition:{x:2,y:20,z:2},cameraAim:{x:0,y:0,z:0},
  softwareWebGL:true,postFX:'direct',renderMs,drawCalls:300,
  vfxDrawCalls:3,vfxReservedInstances:104,consentedSoundstage:true,
  recordingAtSample:capture==='on',...extra};
}
const offRecorder=()=>({status:'NOT_STARTED',peakConcurrentRecorders:0,videoTracks:0,audioTracks:0,activeDuringComparison:false});
const onRecorder=()=>({status:'RECORDED',peakConcurrentRecorders:1,videoTracks:1,audioTracks:1,
 startedBeforeStages:true,stoppedAfterStages:true,bytes:3000,requestedFrames:8});
function make(){
 return {expected:expected(),off:{recorder:offRecorder(),
    samples:Array.from({length:8},(_,i)=>sample('off',i,12+i))},
   on:{recorder:onRecorder(),samples:Array.from({length:8},(_,i)=>sample('on',i,14+i))}};
}
test('same real D04 states and camera with one original A/V encoder yield diagnostic only, never causation',()=>{
 const r=classifyD04CaptureCostPair(make());
 assert.equal(r.status,'MATCHED_CAPTURE_COST_DIAGNOSTIC_ONLY');
 assert.equal(r.matchedStages,8);
 assert.equal(r.hpLossStagesMatched,1);
 assert.equal(r.paired.p50DeltaMs,2);
 assert.equal(r.off.worstMs,19);
 assert.equal(r.on.worstMs,21);
 assert.equal(r.causedByRecorder,null);
 assert.equal(r.sampleSynchronized,false);
});
test('damage witness must match same authoritative checksum, not a nearby later tick',()=>{
 const d=make();d.on.samples[4].scene.checksum='different';
 const r=classifyD04CaptureCostPair(d);
 assert.deepEqual(r.excludedStages,[4]);
 assert.equal(r.hpLossStagesMatched,0);
 assert.equal(r.status,'INSUFFICIENT_CAPTURE_COMBAT_MATCH');
});
test('no real HP-loss transition rejects even eight apparently matching frames',()=>{
 const d=make();d.expected.forEach(s=>s.hpLossCount=0);
 assert.equal(classifyD04CaptureCostPair(d).status,'INSUFFICIENT_REAL_AUTHORITY');
});
test('a captured sample requires actual recorder active with opted-in original audio',()=>{
 const d=make();d.on.samples[4].recordingAtSample=false;
 d.on.samples[5].consentedSoundstage=false;
 const r=classifyD04CaptureCostPair(d);
 assert.deepEqual(r.excludedStages,[4,5]);
 assert.equal(r.hpLossStagesMatched,0);
});
test('two concurrent encoders or missing original audio track fail closed',()=>{
 for(const change of [{peakConcurrentRecorders:2},{audioTracks:0},{startedBeforeStages:false},
  {stoppedAfterStages:false},{status:'UNAVAILABLE'},{bytes:0}]){
  const d=make();Object.assign(d.on.recorder,change);
  const r=classifyD04CaptureCostPair(d);
  assert.equal(r.status,'CAPTURE_PROVENANCE_UNVERIFIED',JSON.stringify(change));
  assert.equal(r.causedByRecorder,null);
 }
});
test('mismatched viewpoint and duplicate receipts cannot be cherry-picked',()=>{
 const d=make();d.on.samples[0].cameraPosition.x+=2;
 d.on.samples[1].frameId=d.on.samples[0].frameId;
 d.on.samples.push(sample('on',4,0.01,{frameId:99}));
 const r=classifyD04CaptureCostPair(d);
 assert.ok(r.excludedStages.includes(0));
 assert.ok(r.excludedStages.includes(1));
 assert.ok(r.excludedStages.includes(4));
 assert.equal(r.hpLossStagesMatched,0);
});
test('a two-second WebGL stall is retained and budget violations stay red',()=>{
 const d=make();d.on.samples[4].renderMs=2005;
 d.on.samples[6].vfxDrawCalls=8;
 const r=classifyD04CaptureCostPair(d);
 assert.equal(r.on.worstMs,2005);
 assert.equal(r.paired.worstPositiveDeltaMs,1989);
 assert.equal(r.status,'D04_CAPTURE_EFFECT_BUDGET_VIOLATION');
 assert.deepEqual(r.budgetViolations.map(x=>x.kind),['VFX_DRAW_CALL_CAP']);
});
test('invalid clocks, frame order, source or capture mode are excluded without inferred data',()=>{
 const d=make();d.on.samples[0].renderMs=NaN;
 d.on.samples[1].frameId=d.on.samples[0].frameId;
 d.on.samples[2].source='synthetic';
 d.on.samples[3].capture='off';
 const r=classifyD04CaptureCostPair(d);
 assert.deepEqual(r.excludedStages,[0,1,2,3]);
 assert.equal(r.status,'MATCHED_CAPTURE_COST_DIAGNOSTIC_ONLY');
 assert.equal(r.matchedStages,4);
});
