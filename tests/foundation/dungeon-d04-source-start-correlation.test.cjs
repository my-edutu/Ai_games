'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {correlateD04OriginalSourceStarts,auditD04ImpactFramePhases}=require('../browser/dungeon-d04-source-start-correlation.cjs');
const damage={cueId:'1:1:7:damage-fatal:-:enemy-1-0',kind:'damage-fatal',scene:'1:1',tick:7,
 audio:true,visual:true,frameId:15,decision:'delivered',submittedClockMs:19506};
const started={cueId:damage.cueId,kind:damage.kind,sceneKey:damage.scene,tick:damage.tick,
 audio:'fatal-impact',scheduledContextMs:2500,startedSources:2,verifiedCanonicalCue:true};
test('actual submitted injury and original WebAudio source.start correlate without mixing clocks',()=>{
 const x=correlateD04OriginalSourceStarts({receipts:[damage],sourceStarts:[started]});
 assert.equal(x.classification,'MATCHED_SOURCE_STARTS_UNALIGNED');
 assert.equal(x.matches.length,1);assert.equal(x.matches[0].cueId,damage.cueId);
 assert.equal(x.matches[0].startedSources,2);
 assert.equal(x.unmatchedDeliveredReceiptCount,0);assert.equal(x.sampleSynchronized,false);
 assert.equal(x.matches[0].sampleSynchronized,false);
});
test('wrong scene, tick, kind, recipe, source-start evidence or canonical injury never matches',()=>{
 for(const altered of [{sceneKey:'2:1'},{tick:8},{kind:'swing'},{audio:'whoosh'},
  {startedSources:0},{scheduledContextMs:-1},{verifiedCanonicalCue:false}]){
  const x=correlateD04OriginalSourceStarts({receipts:[damage],sourceStarts:[{...started,...altered}]});
  assert.equal(x.matches.length,0,JSON.stringify(altered));
  assert.equal(x.unmatchedDeliveredReceiptCount,1);
 }
});
test('duplicate, stale, unsubmitted or missing originals never receive false match',()=>{
 for(const input of [
  {receipts:[damage],sourceStarts:[]},
  {receipts:[damage,damage],sourceStarts:[started]},
  {receipts:[damage],sourceStarts:[started,started]},
  {receipts:[{...damage,frameId:null}],sourceStarts:[started]},
  {receipts:[{...damage,decision:'stale-frame'}],sourceStarts:[started]}]){
  const x=correlateD04OriginalSourceStarts(input);
  assert.equal(x.matches.length,0);assert.equal(x.sampleSynchronized,false);
 }
});
test('observed guard may start original sound without inventing attacker or requiring injury proof',()=>{
 const r={...damage,cueId:'1:1:22:guard:warden-1:-',kind:'guard',tick:22};
 const s={...started,cueId:r.cueId,kind:r.kind,tick:r.tick,audio:'guard',
  startedSources:1,verifiedCanonicalCue:false};
 const x=correlateD04OriginalSourceStarts({receipts:[r],sourceStarts:[s]});
 assert.equal(x.matches.length,1);assert.equal(x.sampleSynchronized,false);
 assert.equal('attacker' in x.matches[0],false);
});
test('malformed and over-budget evidence cannot hide duplicate records by clipping',()=>{
 const x=correlateD04OriginalSourceStarts({receipts:Array(65).fill(damage),sourceStarts:[started]});
 assert.equal(x.matches.length,0);assert.equal(x.sampleSynchronized,false);
 assert.equal(x.classification,'SOURCE_STARTS_UNVERIFIED');
});

test('genuine warning sound starts can correlate without pretending a warning is an HP impact',()=>{
 const r={...damage,cueId:'1:1:11:boss-warning-rising:warden-1:-',
  kind:'boss-warning-rising',tick:11};
 const s={...started,cueId:r.cueId,kind:r.kind,tick:11,
  audio:'boss-warning-rising',verifiedCanonicalCue:false};
 const x=correlateD04OriginalSourceStarts({receipts:[r],sourceStarts:[s]});
 assert.equal(x.matches.length,1);
 assert.equal(x.matches[0].audio,'boss-warning-rising');
 assert.equal(x.sampleSynchronized,false);
});
test('no cross-source evidence promotion from a stale, mismatched or duplicated warning',()=>{
 const r={...damage,cueId:'1:1:11:boss-warning-rising:warden-1:-',
  kind:'boss-warning-rising',tick:11};
 const s={...started,cueId:r.cueId,kind:r.kind,tick:11,
  audio:'boss-warning-rising',verifiedCanonicalCue:false};
 for(const variant of [{...s,audio:'fatal-impact'},{...s,tick:10},{...s,sceneKey:'2:1'}]){
  const x=correlateD04OriginalSourceStarts({receipts:[r],sourceStarts:[variant]});
  assert.equal(x.matches.length,0);
 }
});

/**
 * Actual 2026-11-15 Chrome D04 frame-14 injury receipt (from run
 * 43767672432). A pool allocation was NOT an accepted audiovisual hit:
 * the genuine WebGL submit took 1,281ms of the 1,469ms observation age.
 * This is an attribution diagnostic, NOT a renderer-causation proof.
 */
const authenticLateInjury={
 cueId:'1:1:4:damage:-:enemy-1-0',kind:'damage',scene:'1:1',tick:4,
 decision:'stale-frame',frameId:14,visual:true,audio:false,
 visualDrawableAtSubmission:null,
 observedClockMs:8395,submittedClockMs:9864,
 observationToSubmissionMs:1469,beforeVisualAdvanceMs:141,
 visualAdvanceMs:0,visualEmissionMs:2,
 afterVisualAdvanceToSubmissionMs:1326,renderSubmissionMs:1281
};
test('D04 authentic delayed HP impact reports its measured renderer interval without accepting pixels or PCM',()=>{
 const report=auditD04ImpactFramePhases({receipts:[authenticLateInjury]});
 assert.equal(report.classification,'MEASURED_HP_FRAME_RECEIPTS_UNALIGNED');
 assert.equal(report.sampleSynchronized,false);
 assert.equal(report.damageReceipts.length,1);
 const injury=report.damageReceipts[0];
 assert.equal(injury.status,'STALE_NOT_ACCEPTED');
 assert.equal(injury.dominantPhase,'RENDERER_CALL_INTERVAL');
 assert.equal(injury.observationToSubmissionMs,1469);
 assert.equal(injury.renderSubmissionMs,1281);
 assert.equal(injury.rendererSharePct,87);
 assert.equal(injury.visualSubmissionVerified,false);
 assert.equal(injury.audibleImpactVerified,false);
 assert.equal('attacker' in injury,false);
 assert.equal('causedByD04' in injury,false);
});
test('D04 timely WebGL and original audio source admission are still not decoded contact/PCM synchronization',()=>{
 const receipt={...authenticLateInjury,cueId:'1:1:6:damage:-:enemy-1-0',
  tick:6,decision:'delivered',frameId:21,audio:true,
  visualDrawableAtSubmission:true,observedClockMs:10000,
  submittedClockMs:10055,observationToSubmissionMs:55,
  beforeVisualAdvanceMs:6,visualAdvanceMs:2,visualEmissionMs:1,
  afterVisualAdvanceToSubmissionMs:46,renderSubmissionMs:9};
 const report=auditD04ImpactFramePhases({receipts:[receipt]});
 assert.equal(report.damageReceipts[0].status,'TIMELY_FRAME_RECEIPT_ONLY');
 assert.equal(report.damageReceipts[0].dominantPhase,'NO_DOMINANT_STALL_MEASURED');
 assert.equal(report.damageReceipts[0].visualSubmissionVerified,true);
 assert.equal(report.damageReceipts[0].audibleImpactVerified,false);
 assert.equal(report.sampleSynchronized,false);
});
test('D04 impact audit does not infer submitted damage from absent, malformed or contradicted clocks',()=>{
 for(const specimen of [
  {...authenticLateInjury,frameId:null,submittedClockMs:null},
  {...authenticLateInjury,renderSubmissionMs:1550},
  {...authenticLateInjury,visualAdvanceMs:NaN},
  {...authenticLateInjury,submittedClockMs:8400},
  {...authenticLateInjury,decision:'delivered',audio:true,visualDrawableAtSubmission:null}
 ]){
  const report=auditD04ImpactFramePhases({receipts:[specimen]});
  assert.equal(report.sampleSynchronized,false);
  assert.equal(report.damageReceipts.length,1);
  assert.notEqual(report.damageReceipts[0].status,'TIMELY_FRAME_RECEIPT_ONLY');
  assert.equal(report.damageReceipts[0].dominantPhase,'UNVERIFIED');
 }
});
test('D04 impact audit rejects duplicate and over-budget histories rather than hiding conflicting evidence',()=>{
 for(const receipts of [
  [authenticLateInjury,authenticLateInjury],
  Array(65).fill(authenticLateInjury)
 ]){
  const report=auditD04ImpactFramePhases({receipts});
  assert.equal(report.classification,'IMPACT_PHASE_AUDIT_UNVERIFIED');
  assert.equal(report.damageReceipts.length,0);
  assert.equal(report.sampleSynchronized,false);
 }
});

test('genuine delayed HP frame identifies renderer interval without blaming D04 or granting synced sound',()=>{
 const receipt={...authenticLateInjury};
 const result=auditD04ImpactFramePhases({receipts:[receipt]});
 const item=result.damageReceipts[0];
 assert.equal(item.failureReason,'STALE_RENDER_DEADLINE');
 assert.equal(item.d04VisualCpuMs,2);
 assert.equal(item.nonRendererCpuMs,1467);
 assert.equal(item.otherCpuMs,186);
 assert.equal(item.renderSubmissionMs,1281);
 assert.equal(item.status,'STALE_NOT_ACCEPTED');
 assert.equal(item.sampleSynchronized,false);
 assert.equal('causedByD04' in item,false);
});
test('genuine no-frame and no-drawable HP receipts explain uncertainty without inventing combat',()=>{
 const withoutFrame={...authenticLateInjury,cueId:'1:1:24:damage:-:mystic',
  tick:24,frameId:null,decision:'expired-pending-before-frame',
  submittedClockMs:null,observationToSubmissionMs:null,
  beforeVisualAdvanceMs:null,visualAdvanceMs:null,visualEmissionMs:null,
  afterVisualAdvanceToSubmissionMs:null,renderSubmissionMs:null};
 const withoutDraw={...authenticLateInjury,cueId:'1:1:6:damage:-:enemy-1-0',
  tick:6,decision:'delivered',frameId:18,audio:true,
  observedClockMs:10000,submittedClockMs:10308,
  observationToSubmissionMs:308,
  beforeVisualAdvanceMs:7,visualAdvanceMs:1,visualEmissionMs:1,
  afterVisualAdvanceToSubmissionMs:299,renderSubmissionMs:8};
 const report=auditD04ImpactFramePhases({receipts:[withoutFrame,withoutDraw]});
 assert.equal(report.damageReceipts[0].failureReason,'NO_SUBMITTED_FRAME_RECEIPT');
 assert.equal(report.damageReceipts[0].renderSubmissionMs,null);
 assert.equal(report.damageReceipts[1].failureReason,'NO_DRAWABLE_HP_EFFECT');
 assert.equal(report.damageReceipts[1].d04VisualCpuMs,2);
 assert.equal(report.damageReceipts[1].status,'UNVERIFIED');
 assert.equal(report.sampleSynchronized,false);
});
