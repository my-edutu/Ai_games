'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {SOURCE,classifyD04ContinuousModePair}=require('../browser/dungeon-d04-continuous-mode-pair.cjs');
const view={width:1440,height:900},seed='visual-room-art-18';
const manifest=Array.from({length:9},(_,i)=>({stageIndex:i,scene:{run:1,floor:1,tick:i,checksum:'state-'+i},victimIds:i===4?['enemy-1-0']:[]}));
const sample=(mode,i,ms=12)=>({source:SOURCE,feedbackMode:mode,seed,viewport:view,frameId:i+1,elapsedMs:(i+1)*80,
 scene:{...manifest[i].scene},camera:'tactical',focusedHeroId:'vanguard',cameraPosition:{x:1,y:4,z:6},cameraAim:{x:0,y:0,z:0},
 softwareWebGL:true,postFX:'direct',directRenderMs:ms,drawCalls:mode==='d04'?18:15,triangles:10000,
 raster:{pixelRatio:.75,shadows:false},d04PreviewEnabled:mode==='d04',
 vfxDrawCalls:mode==='d04'?7:0,vfxReservedInstances:mode==='d04'?102:0,
 activeVfxInstances:mode==='d04'?3:0,activeVfxDrawCalls:mode==='d04'?2:0,
 consentedSoundstage:true,previewAudioOptedIn:mode==='d04',recentDeliveryReceipts:[]});
const arm=(mode)=>({feedbackMode:mode,viewport:view,seed,recorder:{status:'NOT_STARTED',peakConcurrentRecorders:0,videoTracks:0,audioTracks:0},errors:[],samples:[0,1,2,3,4,5].map(i=>sample(mode,i))});
const verdict=(legacy=arm('legacy'),preview=arm('d04'))=>classifyD04ContinuousModePair({manifest,legacy,preview});
test('matched live states are diagnostic only, not verified audiovisual impacts or causation',()=>{
 const v=verdict();assert.equal(v.status,'MATCHED_CONTINUOUS_MODE_DIAGNOSTIC_ONLY');
 assert.equal(v.matchedTicks,6);assert.equal(v.matchedHpLossTicks,1);
 assert.equal(v.causedByD04,null);assert.equal(v.sampleSynchronized,false);assert.equal(v.impactAVAccepted,false);
 assert.equal(v.budgetViolations.length,0);
});
test('large authentic renderer stalls remain in all-observed evidence, not discarded',()=>{
 const a=arm('legacy'),b=arm('d04');b.samples[5].directRenderMs=1600;
 const v=verdict(a,b);assert.equal(v.preview.worstMs,1600);assert.equal(v.allObserved.preview.worstMs,1600);
});
test('mismatched authoritative checksum cannot be counted as paired frame',()=>{
 const a=arm('legacy'),b=arm('d04');b.samples[4].scene.checksum='fabricated';
 const v=verdict(a,b);assert.equal(v.matchedTicks,5);assert.equal(v.matchedHpLossTicks,0);
 assert.equal(v.status,'INSUFFICIENT_MATCHED_LIVE_DAMAGE');
});
test('mismatched camera or render budget is excluded from comparable frames',()=>{
 const a=arm('legacy'),b=arm('d04');b.samples[4].cameraPosition.x+=3;b.samples[5].raster.pixelRatio=.3;
 const v=verdict(a,b);assert.equal(v.matchedTicks,4);assert.equal(v.matchedHpLossTicks,0);
});
test('reject legacy where D04 was secretly enabled',()=>{
 const a=arm('legacy');a.samples.forEach(s=>s.d04PreviewEnabled=true);
 const v=verdict(a);assert.equal(v.matchedTicks,0);assert.equal(v.status,'INSUFFICIENT_MATCHED_LIVE_DAMAGE');
});
test('reject recorder contamination and absent consent',()=>{
 const a=arm('legacy');a.recorder.status='RECORDED';assert.equal(verdict(a).status,'INVALID_MODE_PROVENANCE');
 const b=arm('d04');b.samples[4].consentedSoundstage=false;const v=verdict(arm('legacy'),b);
 assert.equal(v.matchedHpLossTicks,0);
});
test('breach of D04 retained draw or instance budgets is surfaced',()=>{
 const b=arm('d04');b.samples[4].vfxReservedInstances=105;b.samples[5].vfxDrawCalls=8;
 const v=verdict(arm('legacy'),b);assert.equal(v.status,'LIVE_EFFECT_BUDGET_VIOLATION');
 assert.equal(v.budgetViolations.length,2);
});
test('forged damage attribution is never upgraded to verified impact',()=>{
 const b=arm('d04');b.samples[4].recentDeliveryReceipts=[{kind:'damage',tick:4,scene:'1:1',cueId:'1:1:4:damage:warden-1:enemy-1-0',visual:true,decision:'delivered',frameId:4,observationToSubmissionMs:20}];
 const v=verdict(arm('legacy'),b);assert.equal(v.impactAVAccepted,false);
 assert.equal(v.previewDamageReceipts.timely,0);
});

test('unmatched genuine preview frame still exposes a breached retained GPU budget',()=>{
 const a=arm('legacy'),b=arm('d04');
 b.samples.push({...sample('d04',6,1800),vfxReservedInstances:105});
 const v=verdict(a,b);
 assert.equal(v.matchedTicks,6);
 assert.equal(v.status,'LIVE_EFFECT_BUDGET_VIOLATION');
 assert.ok(v.budgetViolations.some(x=>x.stageIndex===6&&
  x.kind==='VFX_INSTANCE_CAP'&&x.count===105));
 assert.equal(v.framePressure.preview.renderCallsOver400Ms,1);
 assert.equal(v.framePressure.preview.worstFrame.stageIndex,6);
});
test('unobserved authority damage remains a sampling gap, never inferred contact',()=>{
 const b=arm('d04');
 b.samples=[sample('d04',0,11),sample('d04',1,12),
  sample('d04',5,1700)];
 const v=verdict(arm('legacy'),b);
 assert.deepEqual(v.framePressure.preview.diagnosticUnobservedHpLossStageIndices,[4]);
 assert.equal(v.framePressure.preview.skippedAuthorityStagesBetweenSamples,3);
 assert.equal(v.framePressure.preview.renderCallsOver400Ms,1);
 assert.equal(v.impactAVAccepted,false);
 assert.equal(v.previewDamageReceipts.timely,0);
});
test('warmup and effect density report separate noncausal renderer distributions',()=>{
 const b=arm('d04');
 b.samples[0].activeVfxInstances=0;b.samples[0].activeVfxDrawCalls=0;
 b.samples[1].activeVfxInstances=0;b.samples[1].activeVfxDrawCalls=0;
 b.samples[5].directRenderMs=1400;
 const v=verdict(arm('legacy'),b);
 assert.equal(v.framePressure.preview.warmupRenderMs.count,2);
 assert.equal(v.framePressure.preview.postWarmupRenderMs.count,4);
 assert.equal(v.framePressure.preview.noActiveVfxRenderMs.count,2);
 assert.equal(v.framePressure.preview.activeVfxRenderMs.count,4);
 assert.equal(v.framePressure.preview.worstFrame.directRenderMs,1400);
 assert.equal(v.causedByD04,null);
});
